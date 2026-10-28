// The stack of this hub, in the shape of samebase/base-alchemy. The stage `prod` is the production
// deployment of the Convex project of this repository; the push is the `deploy` package script,
// which creates the key set on a new deployment and pushes the functions. The stack is named after
// the repository, `owner/name`, and its Convex project after `name`. The state of every stage is in
// the `alchemy-state` project of the team. Every run needs the team token CONVEX_ACCESS_TOKEN, or a
// Convex CLI login (`npx convex login`) on a laptop; it mints the deploy key itself:
//   pnpm exec alchemy deploy --stage prod
// The hub has no preview stages: a pull request runs the checks only.
import { execFileSync } from "node:child_process";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";

/** The Convex team that holds the project and the state. */
const team = "nicu";

/** The GitHub repository, `owner/name`: GITHUB_REPOSITORY in Actions, else the origin remote. */
const repository =
  process.env["GITHUB_REPOSITORY"] ??
  /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(
    execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim(),
  )?.[1];
if (repository === undefined) {
  throw new Error("Set GITHUB_REPOSITORY to owner/name: the origin remote names no repository.");
}

export default Alchemy.Stack(
  repository,
  {
    providers: Convex.providers(),
    state: Convex.state({ team }),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    if (stage !== "prod") {
      return yield* Effect.die(
        new Error(`Stage "${stage}" is not prod. The hub has one deployment: --stage prod.`),
      );
    }
    // Retained on destroy: the project holds the hub's registrations and the key set. A project
    // with this name that the stack did not create is taken over with `alchemy deploy --adopt`.
    const project = yield* Convex.Project("Project", {
      team,
      name: repository.slice(repository.indexOf("/") + 1),
    }).pipe(RemovalPolicy.retain());
    const deployment = yield* Convex.Deployment("Deployment", {
      project,
      type: "prod",
      source: {
        path: "./convex",
        command: ["node", "--run", "deploy"],
        // The push inputs besides the functions, package.json, and the lockfile.
        include: ["scripts/**", "tsconfig*.json"],
      },
    });
    return { url: deployment.siteUrl };
  }),
);
