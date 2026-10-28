// Checks IDENTITY_BROKER_KEYS on the selected Convex deployment before the push. The stack
// (alchemy.run.ts) runs it in the `deploy` script with the deployment's deploy key. The variable
// must exist (read from `env list`, which lists an empty variable too) and hold a key set the
// broker's parser accepts; otherwise the deploy stops here instead of at the first sign-in.
//
// Creation is separate, because a new key set means a new pairwise salt, which changes every
// subject the hub ever issued: an established hub that lost the variable restores its backup by
// hand, never gets a new set from a deploy. No deploy creates keys; `pnpm run keys:init`,
// scripts/init-keys.ts, does it once by hand.
/// <reference types="node" />
import { assertKeySetUsable, parseKeySet } from "@samebase/identity-broker";
import process from "node:process";
import { hasVariable, runConvex } from "./convex-cli.ts";

async function main(selection: string[]) {
  if (await hasVariable("IDENTITY_BROKER_KEYS", selection)) {
    const current = await runConvex(["env", "get", "IDENTITY_BROKER_KEYS", ...selection]);
    // The shape, then a sign-and-verify round trip through the broker's own signer and JWKS: a
    // key set that would fail at the first sign-in stops the deploy here.
    await assertKeySetUsable(parseKeySet(current.stdout.replace(/\n$/, "")));
    console.log("IDENTITY_BROKER_KEYS is set and usable.");
    return;
  }
  throw new Error(
    "IDENTITY_BROKER_KEYS does not exist on this deployment. A new hub creates it once with `pnpm run keys:init`; an established hub restores its backup. Nothing was deployed.",
  );
}

await main(process.argv.slice(2));
