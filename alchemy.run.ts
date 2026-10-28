// The stack of this hub: the Convex project, its production deployment, a deploy key that works
// only on that deployment, the key set, and the push of the functions. GitHub Actions runs it on
// every push to main (.github/workflows/alchemy.yml); a laptop runs `pnpm run deploy`. Every step
// reads an output of the step before it:
// 1. The project and its production deployment. The stack takes an existing deployment over and
//    never deletes it: its data is the hub's registrations.
// 2. scripts/ensure-keys.ts, which writes IDENTITY_BROKER_KEYS when the deployment has none and
//    keeps it otherwise. It runs on every deploy (`memo: false`).
// 3. The push of the functions with the installed Convex CLI.
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Command from "alchemy/Command";
import * as Output from "alchemy/Output";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { deployNames } from "./scripts/deploy-names.ts";

const names = deployNames();

const DEPLOY_KEY_ACTIONS = [
  "deployment:deploy",
  "deployment:env:view",
  "deployment:env:write",
  // A push that deletes an index or a component needs it.
  "deployment:data:view",
] as const;

export default Alchemy.Stack(
  names.stack,
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Command.providers(), Convex.providers()),
    // The Cloudflare state store: an encrypted Durable Object in the account, shared by the laptop
    // and GitHub Actions.
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    if (stage !== "prod") {
      return yield* Effect.die(
        new Error(`Stage "${stage}" is not prod. Deploy with --stage prod.`),
      );
    }
    // A project with this name that the stack did not create stops the deploy until
    // `alchemy deploy --adopt`. A destroy keeps the project and the deployment.
    const project = yield* Convex.Project("Project", {
      team: yield* Config.Int("CONVEX_TEAM_ID"),
      name: names.convexProject,
    }).pipe(Alchemy.RemovalPolicy.retain());

    const deployment = yield* Convex.Deployment("Deployment", {
      projectId: project.projectId,
      type: "prod",
    }).pipe(Alchemy.RemovalPolicy.retain());

    const key = yield* Convex.DeployKey("DeployKey", {
      deployment: deployment.name,
      name: "alchemy",
      allowedActions: DEPLOY_KEY_ACTIONS,
    });

    const keys = yield* Command.Exec("Keys", {
      command: "node ./scripts/ensure-keys.ts",
      env: { CONVEX_DEPLOY_KEY: key.deployKey },
      memo: false,
    });

    const code = yield* Convex.Code("Code", {
      deployment,
      deployKey: key.deployKey,
      cwd: ".",
      // The push waits for the key set: a deployment without IDENTITY_BROKER_KEYS refuses it.
      command: Output.map(keys.hash, () => ["pnpm", "exec", "convex"] as const),
    });

    return {
      convexProject: project.slug,
      productionDeployment: deployment.name,
      siteUrl: code.siteUrl,
    };
  }),
);
