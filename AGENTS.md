# AGENTS.md

A Convex app that mounts the identity-broker and alchemyState components: the base app of one team,
which serves its sign-in hub and its Alchemy state. See README.md. Each component's own rules live
in its repository.

- `convex/connectors.ts` lists the providers the hub offers. A provider that needs credentials also
  gets its variables declared in `convex/convex.config.ts`.
- `convex/http.ts` mounts the broker; `convex/identityBroker.ts` exports the admin functions for
  `npx convex run`; `convex/crons.ts` runs the cleanup.
- `convex/state.ts`, `convex/reader.ts`, and `convex/auth.config.ts` serve the Alchemy state store,
  from the exports of `@samebase/alchemy-convex`. A push replaces every function, so a function that
  leaves these files leaves every stack of the team without its state.
- `alchemy.run.ts` is the stack `samebase/identity-hub/base` (adopted project, adopted production deployment,
  push); `scripts/check-keys.ts` checks the key set inside the `deploy` script the push runs and
  never creates it; `scripts/init-keys.ts` creates it once, by hand.
- Never use `npx convex import --replace-all` on this deployment, also not with `--component`: it
  deletes the rows of the other components.
- Never use the U+2014 em dash character. No `any`, no type assertions except `as const`.
- `pnpm install`, then `pnpm run check`. `convex/_generated` is committed; `npx convex dev --once`
  refreshes it.
