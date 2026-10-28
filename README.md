# identity-hub

Your team's sign-in hub on [Convex](https://convex.dev): one deployment that holds your GitHub,
Google and email connections once and signs users in to all your apps, through the
[identity-broker](https://github.com/samebase/identity-broker) component. It keeps no user accounts;
each app creates its own user from the `id_token` it gets.

Fork this repository, deploy it, and point your apps at it.

## Deploy

1. Create the Convex project: `pnpm exec alchemy deploy --stage prod` with `CONVEX_TEAM_ID` and
   `GITHUB_REPOSITORY=<owner>/<repo>` in `.env` and a Cloudflare API token for the state store.
2. Set the email variables on the production deployment, from a domain verified with
   [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/): the account id as
   `CLOUDFLARE_EMAIL_ACCOUNT_ID`, a token with the Email Sending permission on that account as
   `CLOUDFLARE_EMAIL_API_TOKEN`, and the sender address as `EMAIL_FROM`. A push fails while one is
   missing. The hub sends each code once and keeps no copy of it.
3. `pnpm run deploy`: it creates `IDENTITY_BROKER_KEYS` on the first run, keeps it on every later
   run, and stops when the variable holds anything that is not a key set. Then it pushes the
   functions. For GitHub Actions, store a deploy key as the `CONVEX_DEPLOY_KEY` secret and set the
   `CONVEX_DEPLOY_ENABLED` variable to `true`; only `main` deploys.

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
