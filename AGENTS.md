# AGENTS.md

A Convex app that mounts the identity-broker component and is the sign-in hub of one team. See
README.md. The component's own rules live in its repository.

- `convex/connectors.ts` lists the providers the hub offers. A provider that needs credentials also
  gets its variables declared in `convex/convex.config.ts`.
- `convex/http.ts` mounts the broker; `convex/identityBroker.ts` exports the admin functions for
  `npx convex run`; `convex/email.ts` sends the codes through Cloudflare Email Sending;
  `convex/crons.ts` runs the cleanup.
- `alchemy.run.ts` owns the Convex project; `scripts/ensure-keys.ts` creates the key set once.
- Never use the U+2014 em dash character. No `any`, no type assertions except `as const`.
- `pnpm install`, then `pnpm run check`. `convex/_generated` is committed; `npx convex dev --once`
  refreshes it.
