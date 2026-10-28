import { BaseEmailSending } from "cloudflare/resources/email-sending/email-sending";
import { createClient } from "cloudflare/tree-shakable";
import { v } from "convex/values";
import { env, internalAction } from "./_generated/server";

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? Object.fromEntries(Object.entries(value)) : {};

const stringList = (source: Record<string, unknown>, name: string) => {
  const value = source[name];
  const items: unknown[] = Array.isArray(value) ? value : [];
  return items.filter((item) => typeof item === "string");
};

/**
 * The receipt of Cloudflare Email Sending, from
 * https://developers.cloudflare.com/email-service/api/send-emails/rest-api/#response.
 * Only the fields this hub reads; anything else in the body is ignored.
 */
function readReceipt(body: unknown) {
  const receipt = record(body);
  const result = record(receipt["result"]);
  return {
    success: receipt["success"] === true,
    delivered: stringList(result, "delivered"),
    queued: stringList(result, "queued"),
    permanentBounces: stringList(result, "permanent_bounces"),
    suppressed: stringList(result, "suppressed_recipients"),
  };
}

/** The HTTP status in an error the Cloudflare SDK throws for a non-2xx answer, else 0. */
const statusOf = (cause: unknown) => {
  const error = record(cause);
  return typeof error["status"] === "number" ? error["status"] : 0;
};

/**
 * Delivers one sign-in code, directly through Cloudflare Email Sending. The broker calls this and
 * never sees how the mail goes out. Nothing is stored: a code is a secret for ten minutes, so no
 * sent-mail history keeps it. The code is in the body only, not the subject. A recipient that
 * Cloudflare reports as bounced or suppressed fails the send, which the broker shows as a delivery
 * error; a queued recipient counts as sent, because Cloudflare delivers it when its queue clears.
 * Only a status and counts ever leave this function in an error: the SDK's own error carries the
 * response body, which may name the address, so it is not rethrown.
 */
export const sendCode = internalAction({
  args: { to: v.string(), code: v.string(), appName: v.string() },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const client = createClient({
      resources: [BaseEmailSending],
      apiToken: env.CLOUDFLARE_EMAIL_API_TOKEN,
      maxRetries: 0,
      timeout: 30_000,
      logLevel: "off",
    });
    const response = await client.emailSending
      .send({
        account_id: env.CLOUDFLARE_EMAIL_ACCOUNT_ID,
        from: { address: env.EMAIL_FROM, name: "Sign in" },
        to: [args.to],
        subject: `Your ${args.appName} sign-in code`,
        text: `Your ${args.appName} sign-in code is ${args.code}. It expires in ten minutes. If you did not ask for it, ignore this email.`,
      })
      .asResponse()
      .catch((cause: unknown) => {
        throw new Error(`Email delivery failed: the sending API answered ${statusOf(cause)}`);
      });
    const receipt = readReceipt(await response.json());
    const sent = receipt.delivered.includes(args.to) || receipt.queued.includes(args.to);
    if (!response.ok || !receipt.success || !sent) {
      throw new Error(
        `Email delivery failed: status ${response.status}, delivered ${receipt.delivered.length}, queued ${receipt.queued.length}, bounced ${receipt.permanentBounces.length}, suppressed ${receipt.suppressed.length}`,
      );
    }
    return null;
  },
});
