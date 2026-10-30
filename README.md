# identity-hub

The base app of the Samebase team on [Convex](https://convex.dev): the code of the production
deployment of the project `samebase`, which holds the team-level components.

- `identityBroker`, from [identity-broker](https://github.com/samebase/identity-broker), is the
  sign-in hub. It holds the team's Google and GitHub connections once and signs users in to all its
  apps. It keeps no user accounts; each app creates its own user from the `id_token` it gets.
- `alchemyState`, from [alchemy-convex](https://github.com/samebase/alchemy-convex), is the Alchemy
  state of every stack of the team.

The repository is public and holds no secrets. The values of the team are the constants in
`alchemy.run.ts` and the lines in `convex/connectors.ts`, so a copy of it with other values runs
another team's base.

## Deploy

`alchemy.run.ts` is the stack, in the shape of every app of the team with one stage: `prod` is the
production deployment of the Convex project `samebase`, and the push is the `deploy` package script,
which checks the key set and pushes the functions. The stack is named `samebase/base`, a constant
that does not follow the repository name. Its state is in the deployment that it deploys, next to
the state of the other stacks of the team. The hub has no previews: no app points at one, and Google
cannot sign in on one, since only the production callback is registered at Google.
`.github/workflows/alchemy.yml` deploys each push to `main`; pull requests run the checks only.

1. In the repository, set five secrets: `CONVEX_ACCESS_TOKEN`, the team's Convex access token, with
   which the run mints the deploy key itself; `GOOGLE_CLIENT_ID` with `GOOGLE_CLIENT_SECRET`, the
   team's Google OAuth client; and `AUTH_GITHUB_CLIENT_ID` with `AUTH_GITHUB_CLIENT_SECRET`, the
   team's GitHub login OAuth App. Without the Convex token the workflow deploys nothing and says so.
2. The stack hands both clients from `alchemy.run.ts` to the deployment it pushes: no connector
   variable is set by hand.
3. Create the keys of production once, by hand, with the Convex CLI login:
   `pnpm run keys:init --prod` writes `IDENTITY_BROKER_KEYS`, the signing key and the pairwise salt,
   and refuses a deployment that has the variable. Every deploy then checks the variable before the
   push and stops when it is missing or holds anything that is not a key set; no deploy ever creates
   or replaces it.
4. Merge to `main`. The stack adopts the project and its production deployment, so no run needs
   `--adopt`, and it retains both on destroy. Adoption replaces the code and sets the variables of
   the stack. It does not change other variables, the data, or the project. From a laptop,
   `pnpm exec alchemy deploy --stage prod` runs the same stack with the Convex CLI login.

Back up `IDENTITY_BROKER_KEYS` somewhere safe. It holds the signing keys and the pairwise salt: a
hub that loses it issues new subjects to every user of every app. An established hub that lost the
variable gets the backup restored by hand; its deploys stop until then.

## Base and seed

A push replaces every function of a deployment. `Convex.state()` of `@samebase/alchemy-convex`
pushes a small store app, a seed, to a project `samebase` that has no base, and it never pushes over
a base. Thus this app serves the same store functions as the seed: `convex/state.ts` with the host
`base`, `convex/reader.ts`, and `convex/auth.config.ts`. The `alchemyState` component has no name in
`convex/convex.config.ts`, so this app serves the rows that the seed wrote.

The store version of this base is the store version of the `@samebase/alchemy-convex` in
`package.json`. The stack and the app share that one pin. When the store version rises, this
repository moves first and each consumer follows. A consumer of the team fails on a base that is
older or newer than the consumer.

Push a base for the first time when no stack of the team runs: the push of a seed has no lock.

## Issuer

The hub answers at the deployment's `.convex.site` URL and at the custom domain `auth.samebase.com`.
The stack sets `ISSUER` to that domain: the issuer is the name every app trusts, in discovery, in
every `id_token`, and in the callback URLs registered with GitHub and Google. Changing it later
means changing `HUB_ISSUER` on every app's deployments and the callback URLs at every provider in
one go; the app ids, the clients and the salt stay, so the subjects do not change.

## Connectors

`convex/connectors.ts` lists them: Google and GitHub. Google uses the team's OAuth client,
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as repository secrets that the stack hands to the
deployment, and that client's redirect URIs must include `<issuer>/connectors/google/callback`.
GitHub uses the team's login OAuth App the same way, `AUTH_GITHUB_CLIENT_ID` and
`AUTH_GITHUB_CLIENT_SECRET`; that app lists `<issuer>/connectors/github/callback` among its redirect
URIs, exact, next to Samebase's own. Another provider is one more wrapper line, its variables
declared in `convex/convex.config.ts` and handed down the same way; the broker's `email()` wrapper
adds email codes, with a sender behind it and the abuse controls a public mail endpoint needs.

## Register an app

```sh
npx convex run --prod identityBroker:createApp '{"name":"Bristol","firstParty":true,"allowedCallbackHosts":["*.convex.site","127.0.0.1"]}'
npx convex run --prod identityBroker:mintRegistrationToken '{"appId":"bristol-ab12c","expiresInDays":3650}'
```

`firstParty: true` sends the user straight to the connector without the chooser: it is for your own
apps. `allowedCallbackHosts` is where that app's deployments may live; `*.convex.site` admits every
Convex deployment, so narrow it to a domain when the app has one. Narrowing later does not change
clients that already exist. A token registers any number of clients for its app until it expires (30
days unless `expiresInDays` says otherwise), so CI holds one long-lived token per app. Deleting an
app removes its tokens and clients; recreating it gives every user a new subject.

Give the token to the app's CI as a secret. Each deployment of the app registers itself with it
through the `IdentityHub.Client` resource of `@samebase/alchemy-identity-hub` in its Alchemy stack,
which also writes the client into the deployment's variables; see the component's
[consumer guide](https://github.com/samebase/identity-broker/blob/main/docs/consumers.md).

## Operate

The admin functions are internal: `npx convex run --prod identityBroker:<name>`, from a checkout
that selects the project `samebase`. The deploy key of the base is an administrator credential: it
can read and replace the keys, read every secret in the Alchemy state of the team, and run every
internal function. Keep it out of every app's CI. The Convex CLI ignores `--prod` when
`CONVEX_DEPLOY_KEY` names another deployment, so unset it before an admin command. A cron runs the
broker's cleanup daily: expired requests and codes, and sign-in records older than 90 days. Idle
preview clients are kept: the broker prunes them only when the host sets `previewClientIdleDays`,
and this hub does not, because a consumer's registration resource does not register a pruned client
again.

Never run `npx convex import --replace-all` on this deployment, also not with `--component`: it also
deletes the rows of the other components. To restore the tables of one component, import a ZIP of
that component with `--component <name> --replace`.

## License

Apache-2.0.
