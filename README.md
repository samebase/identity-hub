# identity-hub

Your team's sign-in hub on [Convex](https://convex.dev): one deployment that holds your GitHub,
Google and email connections once and signs users in to all your apps, through the
[identity-broker](https://github.com/samebase/identity-broker) component. It keeps no user accounts;
each app creates its own user from the `id_token` it gets.

Fork this repository, deploy it, and point your apps at it.

## Deploy

1. Create the Convex project: `pnpm exec alchemy deploy --stage prod` with `CONVEX_TEAM_ID` and
   `GITHUB_REPOSITORY=<owner>/<repo>` in `.env` and a Cloudflare API token for the state store, or
   simply `pnpm exec convex dev --once --configure new`.
2. Set the email variables on the production deployment, from a domain verified with
   [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/):
   `CLOUDFLARE_EMAIL_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_API_TOKEN`, `EMAIL_FROM`.
3. `pnpm run deploy`: it creates `IDENTITY_BROKER_KEYS` on first run and pushes the functions. For
   GitHub Actions, store a deploy key as the `CONVEX_DEPLOY_KEY` secret and set the
   `CONVEX_DEPLOY_ENABLED` variable to `true`.

The hub answers at the deployment's `.convex.site` URL. Set `ISSUER` to a custom domain before the
first app registers: the issuer is the name every app trusts.

## Connectors

`convex/connectors.ts` lists them. Email codes are on from the start. Add GitHub or Google with the
credentials of an OAuth client whose callback is `<issuer>/connectors/<name>/callback`.

## Register an app

```sh
npx convex run --prod identityBroker:createApp '{"name":"Bristol","firstParty":true,"allowedCallbackHosts":["*.convex.site","127.0.0.1"]}'
npx convex run --prod identityBroker:mintRegistrationToken '{"appId":"bristol-ab12c"}'
```

Give the token to the app's CI. Each deployment of the app registers itself with it; see the
component's
[consumer guide](https://github.com/samebase/identity-broker/blob/main/docs/consumers.md).

## License

Apache-2.0.
