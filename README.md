# identity-hub

A sign-in hub on [Convex](https://convex.dev): one place that holds a Google OAuth client and a
GitHub OAuth App, and signs users in to every app that registers with it. It keeps no user accounts.
Each app gets an OpenID Connect `id_token` and creates its own user from it. The hub is
[`@samebase/identity-broker`](https://www.npmjs.com/package/@samebase/identity-broker) plus the
settings of this repository.

Samebase runs this repository, unchanged, as its public hub. Apps made with
[Samebase](https://samebase.com) sign in there. Use this template to run your own.

## How it works

- An app registers in its own GitHub Actions run, with GitHub's OIDC token as proof of its
  repository. No account at the hub is needed. `HUB_OWNERS` decides which repositories may register.
- Each deployment of the app (production, a preview, a development checkout) gets its own client.
- A user's `sub` is the provider's own id, `google:<id>` or `github:<id>`. It is the same at every
  hub, so an app can move to another hub and keep its users.

## Start

You need a Convex team, a Google Cloud project, and a GitHub account. The steps take about 15
minutes.

1. **Create the repository** with "Use this template".
2. **Set the settings** in the repository, Settings, Secrets and variables, Actions:

   | Name                          | Kind     | Value                                                                                                  |
   | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
   | `CONVEX_ACCESS_TOKEN`         | secret   | A Convex team access token (Convex dashboard, team settings, Access Tokens).                           |
   | `HUB_OWNERS`                  | variable | `any`, or the numeric ids of the GitHub accounts whose repositories may register, separated by commas. |
   | `HUB_NAME`                    | variable | The name of your sign-in service, shown on the sign-in page.                                           |
   | `HUB_TERMS_URL`               | variable | Your terms for the sign-in service.                                                                    |
   | `HUB_PRIVACY_URL`             | variable | Your privacy notice for the sign-in service.                                                           |
   | `HUB_PROJECT`                 | variable | Optional. The Convex project name. Default: the repository name.                                       |
   | `IDENTITY_HUB_MODERATION_KEY` | secret   | Optional. A long random key for the `/moderation/*` API.                                               |

   A GitHub account's numeric id is at `https://api.github.com/users/<login>`, field `id`.

3. **Run the workflow once.** Actions, alchemy, Run workflow, on `main`. The run creates the Convex
   project and an empty production deployment, and prints its `url` and `deployment` name. It pushes
   no code yet. The stack never takes over a project that exists already: if the name is taken, the
   run stops. Set `HUB_PROJECT` to another name and run it again.
4. **Choose the issuer now.** It is the deployment's `url`, or a custom domain (see Custom domain).
   Every app and both providers use it, so set it before the next steps.
5. **Create the two clients**, with the issuer from step 4:
   - Google Cloud console, Google Auth Platform, Clients: a Web application client with the redirect
     URI `<issuer>/connectors/google/callback`. Publish the app and add your domain to the branding
     when you open the hub to other people.
   - GitHub, Settings, Developer settings, OAuth Apps: a new OAuth App with the callback URL
     `<issuer>/connectors/github/callback`.

   Set them as secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_GITHUB_CLIENT_ID`,
   `AUTH_GITHUB_CLIENT_SECRET`.

6. **Create the signing keys once,** from a clone of the repository:

   ```sh
   pnpm install
   npx convex login
   env -u CONVEX_DEPLOY_KEY pnpm run keys:init --deployment <deployment>
   ```

   Use the `deployment` name that step 3 printed. The script refuses a deployment that already has
   keys. Back up the value it writes (`IDENTITY_BROKER_KEYS`) somewhere safe.

7. **Run the workflow again.** This run pushes the hub. Check it:
   `<issuer>/.well-known/openid-configuration` answers with your issuer.

Every push to `main` deploys again. After you change a secret or a variable, run the workflow by
hand: saving a secret does not start a run.

## Custom domain

Custom domains need a Convex plan that includes them. Add the domain in the Convex dashboard (the
deployment, Settings, Custom Domains), then create both DNS records it asks for:

| Type  | Name                       | Value                                     |
| ----- | -------------------------- | ----------------------------------------- |
| CNAME | `<domain>`                 | `convex.domains` (DNS only, no proxy)     |
| TXT   | `_convex_domains.<domain>` | the `deployment` name that step 3 printed |

Convex verifies the domain only with the TXT record. Wait until `https://<domain>` serves HTTPS.
Then set the variable `ISSUER` to `https://<domain>`, register the callbacks for that domain at
Google and GitHub, and run the workflow.

Do it before the first app registers. Changing the issuer later is a move: every app registers again
and needs the new callbacks.

## Connect an app

An app made with Samebase's starter, [samebase/base](https://github.com/samebase/base), names its
hub in `alchemy.run.ts`:

```ts
const HUB = { issuer: "https://<your issuer>", terms: "<your HUB_TERMS_URL>" };
```

Its next deploy registers its clients here. Any other app uses the `IdentityHub.Client` resource of
[`@samebase/alchemy-convex`](https://www.npmjs.com/package/@samebase/alchemy-convex), with
`connectors: ["google", "github"]`. The broker's
[consumer guide](https://github.com/samebase/samebase/blob/main/packages/identity-broker/docs/consumers.md)
has the details.

## Operate

- **Pause every app:** set `APPS_PAUSED=true` on the deployment (Convex dashboard, Environment
  Variables). Remove it to resume.
- **List and delete:** `npx convex run --deployment <deployment> broker:listApps`, then
  `broker:listClients '{"appId":"..."}'`, `broker:deleteClient '{"clientId":"..."}'`,
  `broker:deleteApp '{"appId":"..."}'`.
- **Block a repository or an owner** at once, whatever `HUB_OWNERS` says:

  ```sh
  curl -X POST <issuer>/moderation/blocks \
    -H "Authorization: Bearer $IDENTITY_HUB_MODERATION_KEY" -H "Content-Type: application/json" \
    -d '{"action":"block","kind":"repository","githubId":"<numeric id>","reason":"<why>","adminEmail":"<you>"}'
  ```

  `"kind":"owner"` blocks every repository of an account, and `"action":"unblock"` lifts a block.
  The other endpoints are in the broker's
  [moderation API](https://github.com/samebase/samebase/blob/main/packages/identity-broker/src/client/moderation.ts).

- A daily cron removes expired requests, old sign-in records, and preview and development clients
  that no deploy renewed for 14 days. A production client stays until you delete it.
- A repository that changes owner stays under its last recorded owner until it registers again or
  you block it.
- The deploy key and `CONVEX_ACCESS_TOKEN` can read the signing keys. Treat both as administrator
  credentials.
- Never run `npx convex import --replace-all` on the hub: it also deletes the components' rows.

## Upgrade

Renovate opens a pull request when a new broker or alchemy-convex version is out. Read the
[broker's changelog](https://github.com/samebase/samebase/blob/main/packages/identity-broker/CHANGELOG.md)
before you merge: a release that changes stored data says what to do.

## License

Apache-2.0.
