// Writes IDENTITY_BROKER_KEYS to the selected Convex deployment when it has none. The stack
// (alchemy.run.ts) runs it before the push with the deployment's deploy key, so a fresh deployment never pushes without keys and an
// existing one never has its keys replaced: a present value is parsed and kept, a malformed one
// stops the deploy. A new key set also means a new pairwise salt, which changes every subject the
// hub ever issued, so nothing here regenerates. Rotation is `identity-broker keys --rotate` by hand.
/// <reference types="node" />
import { createKeySet } from "@samebase/identity-broker";
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const CONVEX_CLI_PATH = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);

function runConvex(args: string[], options: { input?: string } = {}) {
  return new Promise<{ code: number; stdout: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [CONVEX_CLI_PATH, ...args], {
      stdio: [options.input === undefined ? "ignore" : "pipe", "pipe", "inherit"],
    });
    const chunks: Buffer[] = [];
    child.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(chunks).toString("utf8");
      if (code === 0) {
        resolve({ code: 0, stdout });
        return;
      }
      reject(new Error(`convex ${args.join(" ")} failed with exit code ${code ?? 1}`));
    });
    if (options.input !== undefined) {
      child.stdin?.end(options.input);
    }
  });
}

async function main(selection: string[]) {
  const current = await runConvex(["env", "get", "IDENTITY_BROKER_KEYS", ...selection]);
  const value = current.stdout.trim();
  if (value.length > 0) {
    // A value that is not a JSON object stops the deploy here instead of at the first sign-in.
    const keySet: unknown = JSON.parse(value);
    if (typeof keySet !== "object" || keySet === null || !("keys" in keySet)) {
      throw new Error("IDENTITY_BROKER_KEYS is set but is not a key set. Restore it from backup.");
    }
    console.log("IDENTITY_BROKER_KEYS is set.");
    return;
  }
  const keySet = await createKeySet();
  // The value goes through standard input, so the private key is never a process argument.
  await runConvex(["env", "set", ...selection, "IDENTITY_BROKER_KEYS"], {
    input: `${JSON.stringify(keySet)}\n`,
  });
  console.log("IDENTITY_BROKER_KEYS created.");
}

// Everything after the script name selects the deployment: `--prod`, `--deployment <name>`, or
// nothing for the development deployment of this checkout.
await main(process.argv.slice(2));
