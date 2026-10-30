/// <reference types="node" />
import { execFileSync } from "node:child_process";
import { generateKeyPairSync, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

// Creates the Convex Auth signing keys of the selected deployment once, before its push:
// `pnpm run deploy` and `pnpm run deploy:dev` run this in their build, and `pnpm run dev` runs it
// before `convex dev`. Alchemy's CONVEX_DEPLOY_KEY selects the production or preview deployment;
// without one, CONVEX_DEPLOYMENT in .env.local selects the development deployment.
//
// An existing pair stays, so the deployment's sessions stay valid; one value without the other is
// an error. The keys of Convex Auth 0.0.x, JWT_PRIVATE_KEY and JWKS, are not touched.
const convex = fileURLToPath(new URL("../node_modules/convex/bin/main.js", import.meta.url));

function readVariable(name: string) {
  return execFileSync(process.execPath, [convex, "env", "get", name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

// Inside `convex deploy --cmd`, VITE_CONVEX_URL names the deployment of the push. A run that the
// CLI would point at another deployment, such as a production deploy without a deploy key, stops
// before it reads or writes anything.
const target = process.env["VITE_CONVEX_URL"];
if (target !== undefined) {
  const selected: unknown = JSON.parse(
    execFileSync(
      process.execPath,
      [convex, "run", "--inline-query", "process.env.CONVEX_CLOUD_URL"],
      {
        encoding: "utf8",
      },
    ),
  );
  if (selected !== target)
    throw new Error(
      `The Convex CLI selects ${String(selected)}, but the deploy pushes to ${target}. Deploy production through the Alchemy workflow.`,
    );
}

const privateKey = readVariable("AUTH_PRIVATE_KEY");
const jwks = readVariable("AUTH_JWKS");
if (privateKey && jwks) {
  console.log("Convex Auth keys already configured.");
} else if (privateKey || jwks) {
  throw new Error("AUTH_PRIVATE_KEY and AUTH_JWKS must be configured together.");
} else {
  // The format of `npx @convex-dev/auth`: the core decodes the base64 PKCS#8 key and signs with the
  // `kid` of the first key in the set.
  const pair = generateKeyPairSync("rsa", { modulusLength: 2048, publicExponent: 0x10001 });
  const pem = pair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
  const publicJwk = pair.publicKey.export({ format: "jwk" });
  const keySet = JSON.stringify({
    keys: [{ ...publicJwk, kid: randomUUID(), alg: "RS256", use: "sig" }],
  });
  // One request with both values, from standard input, so the private key stays out of the
  // process arguments. The CLI refuses the write if either value exists by then.
  execFileSync(process.execPath, [convex, "env", "set"], {
    input: `AUTH_PRIVATE_KEY='${Buffer.from(pem).toString("base64")}'\nAUTH_JWKS='${keySet}'\n`,
    stdio: ["pipe", "ignore", "inherit"],
  });
  console.log("Convex Auth keys configured.");
}
