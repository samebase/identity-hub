// Creates IDENTITY_BROKER_KEYS on the selected Convex deployment, once, by hand: the signing key of
// a new broker. It refuses a deployment that has the variable, whatever its value: a wrong value is
// replaced by hand, never here, so a second run never replaces a working key. Run it once per
// deployment, never from two places at the same time.
//
//   pnpm run keys:init --prod
//   pnpm run keys:init --deployment <name>
/// <reference types="node" />
import process from "node:process";
import { hasVariable, runConvex } from "./convex-cli.ts";

/** A key set with one current RS256 key, in the format of the broker's README (Environment variables). */
async function createKeySet() {
  const { privateKey } = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const kid = crypto.randomUUID();
  return {
    version: 1,
    keys: [{ kid, status: "current", privateJwk: { ...jwk, kid, use: "sig" } }],
  };
}

async function main(selection: string[]) {
  if (await hasVariable("IDENTITY_BROKER_KEYS", selection)) {
    throw new Error(
      "IDENTITY_BROKER_KEYS exists on this deployment. Nothing was created: restore the backup by hand when the value is wrong.",
    );
  }
  // The value goes through standard input, so the private key is never a process argument.
  await runConvex(["env", "set", ...selection, "IDENTITY_BROKER_KEYS"], {
    input: `${JSON.stringify(await createKeySet())}\n`,
  });
  console.log("IDENTITY_BROKER_KEYS created. Back it up now.");
}

await main(process.argv.slice(2));
