// Runs the installed Convex CLI for the key scripts. The selection after the script name names the
// deployment: `--prod`, `--deployment <name>`, or nothing for the deployment of CONVEX_DEPLOY_KEY
// or of this checkout.
/// <reference types="node" />
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const CONVEX_CLI_PATH = fileURLToPath(
  new URL("../node_modules/convex/bin/main.js", import.meta.url),
);

export function runConvex(args: string[], options: { input?: string } = {}) {
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

/** Whether the deployment has the variable at all. `env list` prints one NAME=value line each. */
export async function hasVariable(name: string, selection: string[]) {
  const listed = await runConvex(["env", "list", ...selection]);
  return listed.stdout.split("\n").some((line) => line.startsWith(`${name}=`));
}
