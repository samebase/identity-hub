# AGENTS.md

An identity hub: a Convex app that mounts `@samebase/identity-broker`. See README.md.

- `convex/broker.ts` is the hub: connectors `google` and `github`, the registration policy (who may
  register comes from `HUB_OWNERS`, parsed in `convex/owners.ts`), and the admin functions.
  `convex/convex.config.ts` declares every deployment variable; `convex/http.ts` mounts the routes;
  `convex/crons.ts` runs the cleanup.
- Every value that differs between hubs is a GitHub variable or secret that `alchemy.run.ts` hands
  to the deployment. Keep it that way: a copy of this repository changes settings, not code.
- `alchemy.run.ts` creates the Convex project and its production deployment and never adopts one
  (`adopt(false)` on both). Without the four client values it pushes nothing.
- `scripts/init-keys.ts` creates `IDENTITY_BROKER_KEYS` once, by hand; `scripts/check-keys.ts`
  checks it before every push and never creates it.
- Never use `npx convex import --replace-all` on a hub: it deletes the rows of the components.
- Never use the U+2014 em dash character. No `any`, no type assertions except `as const`.
- `pnpm install`, then `pnpm run check`. `convex/_generated` is committed; a push refreshes it.
