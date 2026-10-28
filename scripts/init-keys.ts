// Creates IDENTITY_BROKER_KEYS on the selected Convex deployment, once, by hand: the signing key and
// the pairwise salt of a new hub. It refuses a deployment that has the variable, whatever its value:
// a wrong value is restored from the backup by hand, never replaced here, and a second run never
// mints a second salt. Run it once per deployment, never from two places at the same time.
//
//   pnpm run keys:init --prod
//   pnpm run keys:init --deployment <name>
/// <reference types="node" />
import { createKeySet } from "@samebase/identity-broker";
import process from "node:process";
import { hasVariable, runConvex } from "./convex-cli.ts";

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
