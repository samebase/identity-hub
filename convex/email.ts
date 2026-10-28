import { EmailInbox } from "@samebase/convex-cloudflare-email-inbox";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { env, internalAction } from "./_generated/server";

const inbox = new EmailInbox(components.mail, {
  defaultInbox: { address: env.EMAIL_FROM, label: "Sign-in codes", senderName: "Sign in" },
});

/** Delivers one sign-in code. The broker calls this and never sees how the mail goes out. */
export const sendCode = internalAction({
  args: { to: v.string(), code: v.string(), appName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!env.CLOUDFLARE_EMAIL_ACCOUNT_ID || !env.CLOUDFLARE_EMAIL_API_TOKEN) {
      throw new Error(
        "CLOUDFLARE_EMAIL_ACCOUNT_ID and CLOUDFLARE_EMAIL_API_TOKEN are not set on this deployment",
      );
    }
    const outcome = await inbox.send(ctx, {
      to: [args.to],
      subject: `${args.code} is your ${args.appName} sign-in code`,
      text: `Your ${args.appName} sign-in code is ${args.code}. It expires in ten minutes. If you did not ask for it, ignore this email.`,
      idempotencyKey: crypto.randomUUID(),
    });
    if (outcome.kind === "rejected" || outcome.kind === "unknown") {
      throw new Error(`Email delivery ${outcome.kind}`);
    }
    return null;
  },
});
