# identity-hub

Your own sign-in service on [Convex](https://convex.dev). One Google client and one GitHub OAuth
App, for every app, preview, and dev checkout you deploy. The hub keeps no user accounts: each app
gets a standard OpenID Connect `id_token` and owns its users.

[![Convex component](https://img.shields.io/badge/Convex_component-identity--broker-8D2676)](https://www.convex.dev/components/samebase/identity-broker)
[![npm](https://img.shields.io/npm/v/@samebase/identity-broker?label=%40samebase%2Fidentity-broker)](https://www.npmjs.com/package/@samebase/identity-broker)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)

![Google and GitHub refuse preview deployments because each has a new URL. The hub sits in front of them, so each provider sees one client and one URL, and every app and preview registers its exact URL at deploy.](https://raw.githubusercontent.com/samebase/samebase/main/packages/identity-broker/docs/how-it-works.gif)

Samebase runs this repository, unchanged, as its public hub at `id.samebase.com`. Every app made
from [samebase/base](https://github.com/samebase/base) signs in there out of the box. Use this
template when you want the same thing under your own name, with your own Google project and your
own rules about who may register.

## Why a hub

- **Providers want one callback URL.** Google and GitHub need each redirect URI registered by hand,
  so a preview deployment with a fresh URL cannot have Google sign-in. The hub registers that URL
  itself, at deploy time.
- **No account, no token.** An app registers in its own GitHub Actions run, with GitHub's OIDC token
  as proof of its repository. `HUB_OWNERS` decides which GitHub accounts may register.
- **Users are portable.** A user's `sub` is the provider's own id, `google:<id>` or `github:<id>`,
  the same at every hub. An app can move to another hub and keep its users.

The hub is [`@samebase/identity-broker`](https://www.npmjs.com/package/@samebase/identity-broker)
plus the settings of this repository.

## Start

You need a Convex team, a Google Cloud project, and a GitHub account. About 15 minutes.

### 1. Create the repository

Select **Use this template** on this page.

### 2. Set the settings

In the repository, **Settings**, **Secrets and variables**, **Actions**:

| Name                          | Kind     | Value                                                                                                  |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| `CONVEX_ACCESS_TOKEN`         | secret   | A Convex team access token (Convex dashboard, team settings, Access Tokens).                           |
| `HUB_OWNERS`                  | variable | `any`, or the numeric ids of the GitHub accounts whose repositories may register, separated by commas. |
| `HUB_NAME`                    | variable | The name of your sign-in service, shown on the sign-in page.                                           |
| `HUB_TERMS_URL`               | variable | Your terms for the sign-in service.                                                                    |
| `HUB_PRIVACY_URL`             | variable | Your privacy notice for the sign-in service.                                                           |
| `HUB_PROJECT`                 | variable | Optional. The Convex project name. Default: the repository name.                                       |
| `IDENTITY_HUB_MODERATION_KEY` | secret   | Optional. A long random key for the `/moderation/*` API.                                               |

A GitHub account's numeric id is the `id` field at `https://api.github.com/users/<login>`.

### 3. Run the workflow once

**Actions**, **alchemy**, **Run workflow**, on `main`. The run creates the Convex project and an
empty production deployment, and prints its `url` and `deployment` name. It pushes no code yet. If
the project name is taken, the run stops: set `HUB_PROJECT` to another name and run it again.

### 4. Choose the issuer

The issuer is the deployment's `url`, or a [custom domain](#custom-domain). Every app and both
providers use it, so decide now.

### 5. Create the two clients

- **Google Cloud console**, Google Auth Platform, Clients: a Web application client with the redirect
  URI `<issuer>/connectors/google/callback`. Publish the app and add your domain to the branding
  when you open the hub to other people.
- **GitHub**, Settings, Developer settings, OAuth Apps: a new OAuth App with the callback URL
  `<issuer>/connectors/github/callback`.

Save them as the secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_GITHUB_CLIENT_ID`, and
`AUTH_GITHUB_CLIENT_SECRET`.

### 6. Create the signing keys once

From a clone of the repository, with the `deployment` name from step 3:

```sh
pnpm install
npx convex login
env -u CONVEX_DEPLOY_KEY pnpm run keys:init --deployment <deployment>
```

The script refuses a deployment that already has keys. Back up the value it writes,
`IDENTITY_BROKER_KEYS`, somewhere safe.

### 7. Run the workflow again

This run pushes the hub. `<issuer>/.well-known/openid-configuration` now answers with your issuer.

Every push to `main` deploys again. After you change a secret or a variable, run the workflow by
hand: saving a secret does not start a run.

## Connect an app

An app from [samebase/base](https://github.com/samebase/base) names its hub in `alchemy.run.ts`:

```ts
const HUB = { issuer: "https://<your issuer>", terms: "<your HUB_TERMS_URL>" };
```

Its next deploy registers its clients here. Any other app uses the `IdentityHub.Client` resource of
[`@samebase/alchemy-convex`](https://www.npmjs.com/package/@samebase/alchemy-convex), with
`connectors: ["google", "github"]`. The broker's
[consumer guide](https://github.com/samebase/samebase/blob/main/packages/identity-broker/docs/consumers.md)
has the details.

## Custom domain

Custom domains need a Convex plan that includes them. Add the domain in the Convex dashboard (the
deployment, **Settings**, **Custom Domains**), then create both DNS records it asks for:

| Type  | Name                       | Value                                     |
| ----- | -------------------------- | ----------------------------------------- |
| CNAME | `<domain>`                 | `convex.domains` (DNS only, no proxy)     |
| TXT   | `_convex_domains.<domain>` | the `deployment` name that step 3 printed |

Convex verifies the domain only with the TXT record. Wait until `https://<domain>` serves HTTPS.
Then set the variable `ISSUER` to `https://<domain>`, register the callbacks for that domain at
Google and GitHub, and run the workflow.

Do it before the first app registers. Changing the issuer later is a move: every app registers again
and needs the new callbacks.

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

[Apache-2.0](./LICENSE).
