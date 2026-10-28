// The setup stack: the Convex project this hub deploys to. GitHub Actions deploys the functions
// with a deploy key (.github/workflows/deploy.yml); this stack owns what exists before the first
// deploy. Deploy it with `pnpm exec alchemy deploy --stage prod`.
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { deployNames } from "./scripts/deploy-names.ts";

const names = deployNames();

export default Alchemy.Stack(
  names.stack,
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Convex.providers()),
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
    // `alchemy deploy --adopt`. A destroy keeps the project: its data is the hub's registrations.
    const project = yield* Convex.Project("Project", {
      team: yield* Config.Int("CONVEX_TEAM_ID"),
      name: names.convexProject,
    }).pipe(Alchemy.RemovalPolicy.retain());
    return { convexProject: project.slug, productionDeployment: project.prodDeploymentName };
  }),
);
