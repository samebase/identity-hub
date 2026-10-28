// Writes IDENTITY_BROKER_KEYS to the selected Convex deployment when it has none. The deploy
// script runs it before `convex deploy`, so a fresh deployment never pushes without keys and an
// existing one never has its keys replaced. Rotation is `identity-broker keys --rotate` by hand.
/// <reference types="node" />
import { createKeySet } from "@samebase/identity-broker";
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const CONVEX_CLI_PATH = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);

function runConvex(args: string[], options: { sensitive?: boolean } = {}) {
  return new Promise<{ code: number; stdout: string }>((resolve, reject) => {
    const child = spawn(process.execPath, [CONVEX_CLI_PATH, ...args], {
      stdio: ["ignore", "pipe", "inherit"],
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const stdout = Buffer.concat(chunks).toString("utf8");
      if (code === 0) {
        resolve({ code: 0, stdout });
        return;
      }
      reject(
        new Error(
          `convex ${options.sensitive ? "env set" : args.join(" ")} failed with exit code ${code ?? 1}`,
        ),
      );
    });
  });
}

async function main(selection: string[]) {
  const current = await runConvex(["env", "get", "IDENTITY_BROKER_KEYS", ...selection]);
  if (current.stdout.trim().length > 0) {
    console.log("IDENTITY_BROKER_KEYS is set.");
    return;
  }
  const keySet = await createKeySet();
  await runConvex(
    ["env", "set", ...selection, "--", "IDENTITY_BROKER_KEYS", JSON.stringify(keySet)],
    { sensitive: true },
  );
  console.log("IDENTITY_BROKER_KEYS created.");
}

// Everything after the script name selects the deployment: `--prod`, `--deployment <name>`, or
// nothing for the development deployment of this checkout.
await main(process.argv.slice(2));
