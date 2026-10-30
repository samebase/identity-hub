# AGENTS.md

A Convex app that mounts the identity-broker and alchemyState components: the base app of one team,
which serves its sign-in hub and its Alchemy state. See README.md. Each component's own rules live
in its repository.

- `convex/connectors.ts` lists the providers the hub offers. A provider that needs credentials also
  gets its variables declared in `convex/convex.config.ts`.
- `convex/broker.ts` defines the broker, `convex/http.ts` mounts it, `convex/identityBroker.ts`
  exports the admin functions for `npx convex run`, and `convex/crons.ts` runs the cleanup.
- `convex/state.ts`, `convex/reader.ts`, and `convex/auth.config.ts` serve the Alchemy state store,
  from the exports of `@samebase/alchemy-convex`. A push replaces every function, so a function that
  leaves these files leaves every stack of the team without its state.
- `alchemy.run.ts` is the stack `samebase/team-base` (adopted project, adopted production
  deployment, push); `scripts/check-keys.ts` checks the key set inside the `deploy` script the push
  runs and never creates it; `scripts/init-keys.ts` creates it once, by hand.
- `src/` is the console of the base, a TanStack Start site that `convex/http.ts` serves through
  convex-hosting. `convex/console.ts` holds its reads: each one needs a session, and the state comes
  through the redacted `reader.repository`, so a secret never reaches the browser. A page cannot use
  the paths of the hub or of Convex Auth: `/authorize`, `/continue`, `/token`, `/userinfo`,
  `/connectors/*`, `/.well-known/*`, `/auth/*`.
- The console has no sign-up. Run `authAdmin:createOrUpdatePasswordAccount` from the Functions page
  of the Convex dashboard, with the email and password you choose, not in a terminal.
- `pnpm run deploy:dev` builds, uploads, and pushes to the development deployment. It must run once
  before `pnpm run dev`: `convex/http.ts` imports the build.
- Never use `npx convex import --replace-all` on this deployment, also not with `--component`: it
  deletes the rows of the other components.
- Never use the U+2014 em dash character. No `any`, no type assertions except `as const`.
- `pnpm install`, then `pnpm run check`. `convex/_generated` is committed; `npx convex dev --once`
  refreshes it.
