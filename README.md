# identity-hub

The sign-in hub of the Samebase team on [Convex](https://convex.dev): one deployment that holds the
team's GitHub, Google and email connections once and signs users in to all its apps, through the
[identity-broker](https://github.com/samebase/identity-broker) component. It keeps no user accounts;
each app creates its own user from the `id_token` it gets.

The repository is public and holds no secrets or team values: everything specific to a hub is a
deployment variable or a line in `convex/connectors.ts`, so a copy of it runs another team's hub.

## Deploy

`alchemy.run.ts` is the stack, in the shape of every app of the team: the stage `prod` is the
production deployment of the Convex project named after this repository, and the push is the
`deploy` package script, which creates the key set on a new deployment and pushes the functions. The
state is in the `alchemy-state` project of the team. Any other stage, such as `pr-42` for a pull
request, is a preview deployment named after the stage, which `alchemy destroy` deletes.
`.github/workflows/alchemy.yml` deploys each push to `main` to `prod`, each pull request to
`pr-<number>` with a comment that names the preview's URL, and destroys that stage when the pull
request closes.

1. In the repository, set the secret `CONVEX_ACCESS_TOKEN`, the team's Convex access token. It is
   the only secret: the run mints the deploy key itself. Without it the workflow deploys nothing and
   says so.
2. Set the email variables on the production deployment, from a domain verified with
   [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/): the account id as
   `CLOUDFLARE_EMAIL_ACCOUNT_ID`, a token with the Email Sending permission on that account as
   `CLOUDFLARE_EMAIL_API_TOKEN`, and the sender address as `EMAIL_FROM`. A push fails while one is
   missing. Set the same three as the preview defaults of the project (Convex dashboard, project
   settings, default environment variables), so every preview can send codes too. The hub sends each
   code once and keeps no copy of it.
3. Merge to `main`. The first run of the workflow on a project that exists already needs `adopt`
   checked (Run workflow on the Actions tab). The first deploy creates `IDENTITY_BROKER_KEYS`; every
   later deploy keeps it and stops when the variable holds anything that is not a key set. From a
   laptop, `pnpm exec alchemy deploy --stage prod` runs the same stack with the Convex CLI login.

Back up `IDENTITY_BROKER_KEYS` somewhere safe. It holds the signing keys and the pairwise salt: a
hub that loses it issues new subjects to every user of every app.

## Issuer

The hub answers at the deployment's `.convex.site` URL. Set `ISSUER` to a custom domain before the
first app registers: the issuer is the name every app trusts, in discovery, in every `id_token`, and
in the callback URLs registered with GitHub and Google. Changing it later means changing
`HUB_ISSUER` on every app's deployments and the callback URLs at every provider in one go; the app
ids, the clients and the salt stay, so the subjects do not change.

## Connectors

`convex/connectors.ts` lists them. Email codes are on from the start. Add GitHub or Google with the
credentials of an OAuth client whose callback is `<issuer>/connectors/<name>/callback`, declared as
variables in `convex/convex.config.ts` and read in `convex/connectors.ts`.

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

The admin functions are internal: `npx convex run --prod identityBroker:<name>`. The deploy key of
the hub is an administrator credential (it can read and replace the keys and run every internal
function); keep it out of every app's CI. The Convex CLI ignores `--prod` when `CONVEX_DEPLOY_KEY`
names another deployment, so unset it before an admin command. A cron runs the broker's cleanup
daily: expired requests and codes, preview clients idle for 30 days, sign-in records older than 90
days.

## License

Apache-2.0.
