# Moved to [samebase/samebase](https://github.com/samebase/samebase/tree/main/apps/identity-hub)

# team-base

The sign-in hub of the Samebase team on [Convex](https://convex.dev): the code of the production
deployment of the project `samebase`. It mounts `identityBroker` from
[identity-broker](https://github.com/samebase/identity-broker), holds the team's Google and GitHub
connections once, and signs users in to all its apps. It keeps no user accounts; each app creates
its own user from the `id_token` it gets.

The repository is public and holds no secrets. The values of the team are the constants in
`alchemy.run.ts` and the lines in `convex/connectors.ts`, so a copy of it with other values runs
another team's hub.

## Deploy

`alchemy.run.ts` is the stack, in the shape of every app of the team with one stage: `prod` is the
production deployment of the Convex project `samebase`, and the push is the `deploy` package script,
which checks the key set and pushes the functions. The stack is named after the repository,
`samebase/team-base`. Its state is in the Convex project `alchemy-state-store`, with the state of
the other stacks of the team. The hub has no previews: no app points at one, and Google cannot sign
in on one, since only the production callback is registered at Google.
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

## Issuer

The hub answers at the deployment's `.convex.site` URL and at the custom domain `auth.samebase.com`.
The stack sets `ISSUER` to that domain: the issuer is the name every app trusts, in discovery, in
every `id_token`, and in the callback URLs registered with GitHub and Google. Changing it later
means changing `HUB_ISSUER` on every app's deployments and the callback URLs at every provider in
one go; the app ids, the clients and the salt stay, so the subjects do not change. An app reads the
issuer from the reply of its registration, so it needs no setting of its own.

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

An app needs no step on the hub. Each deployment registers itself through the `Convex.HubClient`
resource of `@samebase/alchemy-convex` in its Alchemy stack, which also writes the client into the
deployment's variables:

```ts
const client =
  yield *
  Convex.HubClient("HubClient", {
    team,
    app: "bristol",
    redirectUri: `${siteUrl}/oauth/hub/callback`,
    deploymentType: "preview",
    clientName: stage,
  });
```

The resource finds this hub by the name of its project, and it runs `identityBroker:registerClient`
with a short-lived key that the Convex credential of the stack mints. So the app has no token of its
own. The first client of an `app` creates the app as a first-party app, which sends the user
straight to the connector without the chooser. For an app that is not the team's own, run
`createApp` with `firstParty` false first. A development deployment has no stack: the command
`alchemy-convex hub-client` does the same with the Convex CLI login. Deleting an app removes its
clients. Recreating it with the same id keeps the subjects of its users.

See the component's
[consumer guide](https://github.com/samebase/identity-broker/blob/main/docs/consumers.md).

## Operate

The admin functions are internal: `npx convex run --prod identityBroker:<name>`, from a checkout
that selects the project `samebase`. The deploy key of the hub is an administrator credential: it
can read and replace the keys and run every internal function. Every stack of the team mints keys of
the hub with the team's Convex token, for its hub client. These keys can run internal functions
only, and they end with the run. The team token itself reaches the hub, so treat it as an
administrator credential too. The Convex CLI ignores `--prod` when `CONVEX_DEPLOY_KEY` names another
deployment, so unset it before an admin command. A cron runs the broker's cleanup daily: expired
requests and codes, and sign-in records older than 90 days. Idle preview clients are kept: the
broker prunes them only when the host sets `previewClientIdleDays`, and this hub does not, because a
consumer's `Convex.HubClient` does not register a pruned client again.

Never run `npx convex import --replace-all` on this deployment, also not with `--component`: it also
deletes the rows of the other components. To restore the tables of one component, import a ZIP of
that component with `--component <name> --replace`.

## License

Apache-2.0.
