// The stack of this hub, in the shape of samebase/base-alchemy with one stage: `prod` is the
// production deployment of the Convex project of this repository, and nothing else is deployed.
// The hub has no previews: no app points at one, and Google cannot sign in on one, since only the
// production callback is registered at Google. The push is the `deploy` package script, which
// checks the key set and pushes the functions. The stack is named after the repository,
// `owner/name`, and its Convex project after `name`. The state is in the `alchemy-state` project
// of the team.
//
// Every run needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI login (`npx convex login`)
// on a laptop; it mints the deploy key itself. Every run also reads CLOUDFLARE_EMAIL_API_TOKEN, a
// Cloudflare account token limited to Email Sending, and CLOUDFLARE_EMAIL_ACCOUNT_ID, and hands
// them with the sender address to the deployment: no email variable is ever set by hand. It reads
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET the same way, for the Google connector.
//   pnpm exec alchemy deploy --stage prod
import { execFileSync } from "node:child_process";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

/** The Convex team that holds the project and the state. */
const team = "nicu";
/** The sender of the sign-in codes, on a domain verified with Cloudflare Email Sending. */
const EMAIL_FROM = "auth@samebase.com";

/** The GitHub repository, `owner/name`: GITHUB_REPOSITORY in Actions, else the origin remote. */
const repository =
  process.env["GITHUB_REPOSITORY"] ??
  /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(
    execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim(),
  )?.[1];
if (repository === undefined) {
  throw new Error("Set GITHUB_REPOSITORY to owner/name: the origin remote names no repository.");
}
const projectName = repository.slice(repository.indexOf("/") + 1);

export default Alchemy.Stack(
  repository,
  { providers: Convex.providers(), state: Convex.state({ team }) },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    // One stage: any other name would create a second project and deployment with this name.
    if (stage !== "prod") {
      throw new Error(`This stack has one stage, prod. The stage ${stage} is not deployed.`);
    }
    const source = {
      path: "./convex",
      command: ["node", "--run", "deploy"],
      // The push inputs besides the functions, package.json, and the lockfile.
      include: ["scripts/**", "tsconfig*.json"],
    } satisfies Convex.Source;
    // The variables of the deployment. The token is a prop, so the state store holds it next to
    // the deployment it serves; it can only send email.
    const env = {
      CLOUDFLARE_EMAIL_ACCOUNT_ID: yield* Config.String("CLOUDFLARE_EMAIL_ACCOUNT_ID"),
      CLOUDFLARE_EMAIL_API_TOKEN: yield* Config.Redacted("CLOUDFLARE_EMAIL_API_TOKEN"),
      EMAIL_FROM,
      GOOGLE_CLIENT_ID: yield* Config.String("GOOGLE_CLIENT_ID"),
      GOOGLE_CLIENT_SECRET: yield* Config.Redacted("GOOGLE_CLIENT_SECRET"),
    };
    // The project is kept on destroy: it holds the hub's registrations and the key set. A project
    // with this name that the stack did not create is taken over with `alchemy deploy --adopt`.
    const project = yield* Convex.Project("Project", { team, name: projectName }).pipe(
      RemovalPolicy.retain(),
    );
    const deployment = yield* Convex.Deployment("Deployment", {
      project,
      type: "prod",
      source,
      env,
    });
    return { url: deployment.siteUrl };
  }),
);
