// The stack of this hub, in the shape of samebase/base-alchemy. The stage `prod` is the production
// deployment of the Convex project of this repository; any other stage, such as `pr-42` for a pull
// request, is a preview deployment named after the stage, which `alchemy destroy` deletes. The
// push is the `deploy` package script, which creates the key set on a new deployment and pushes
// the functions. The stack is named after the repository, `owner/name`, and its Convex project
// after `name`. The state of every stage is in the `alchemy-state` project of the team. Every run
// needs the team token CONVEX_ACCESS_TOKEN, or a Convex CLI login (`npx convex login`) on a
// laptop; it mints the deploy key itself:
//   pnpm exec alchemy deploy --stage prod
// A preview gets its email variables from the preview defaults of the project (README, Deploy).
import { execFileSync } from "node:child_process";
import * as GitHub from "@alchemy.run/github";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as Output from "alchemy/Output";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

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
const projectName = repository.slice(repository.indexOf("/") + 1);

export default Alchemy.Stack(
  repository,
  {
    providers: Layer.mergeAll(GitHub.providers(), Convex.providers()),
    state: Convex.state({ team }),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    const source = {
      path: "./convex",
      command: ["node", "--run", "deploy"],
      // The push inputs besides the functions, package.json, and the lockfile.
      include: ["scripts/**", "tsconfig*.json"],
    } satisfies Convex.Source;
    // The stage `prod` owns the project and keeps it on destroy: it holds the hub's registrations
    // and the key set. A project with this name that the stack did not create is taken over with
    // `alchemy deploy --adopt`. A preview stage reads the project by its slug, so it does not
    // depend on the state of `prod`; adopt(true) takes it into the state of that stage only.
    const project =
      stage === "prod"
        ? yield* Convex.Project("Project", { team, name: projectName }).pipe(RemovalPolicy.retain())
        : yield* Convex.Project("Project", { team, slug: projectName }).pipe(adopt(true));
    const deployment =
      stage === "prod"
        ? yield* Convex.Deployment("Deployment", { project, type: "prod", source })
        : yield* Convex.Deployment("Deployment", {
            project,
            type: "preview",
            name: stage,
            source,
          }).pipe(adopt(true), RemovalPolicy.destroy());

    const github = yield* GitHub.GitHubEnv;
    if (github?.pr) {
      // Retained: a closed pull request keeps the comment, as a record of what was deployed; the
      // preview's URL stops answering when the stage is destroyed.
      yield* GitHub.Comment("PreviewComment", {
        owner: github.owner,
        repository: github.repository,
        issueNumber: github.pr,
        body: Output.interpolate`Preview \`${stage}\`: ${deployment.siteUrl}`,
      }).pipe(RemovalPolicy.retain());
    }
    return { url: deployment.siteUrl };
  }),
);
