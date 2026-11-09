// The stack of this identity hub, with one stage: `prod` is the production deployment of a Convex
// project that this stack creates, and nothing else is deployed. The stack never adopts: a project
// or deployment that exists without this stack's state belongs to something else, such as another
// hub in the same Convex team, and the run stops instead of pushing over it. The stack is named
// after the repository; its state is in the team's `alchemy-state-store` project.
//
// The first run, before the Google and GitHub clients exist, creates the project and an empty
// production deployment and pushes nothing: the clients' callbacks need its URL. Once the four
// client values are set, every run pushes the hub (README, Start).
import { execFileSync } from "node:child_process";
import process from "node:process";
import * as Convex from "@samebase/alchemy-convex";
import * as Alchemy from "alchemy";
import { adopt } from "alchemy/AdoptPolicy";
import * as RemovalPolicy from "alchemy/RemovalPolicy";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { parseOwners } from "./convex/owners.ts";

/** The GitHub repository, `owner/name`: GITHUB_REPOSITORY in Actions, else the origin remote. */
const repository =
  process.env["GITHUB_REPOSITORY"] ??
  /[:/]([^/:]+\/[^/]+?)(?:\.git)?$/.exec(
    execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim(),
  )?.[1];
if (repository === undefined) {
  throw new Error("Set GITHUB_REPOSITORY to owner/name: the origin remote names no repository.");
}

/** A setting, trimmed. Empty is unset: GitHub passes an unset secret or variable as "". */
const setting = (name: string) => process.env[name]?.trim() || undefined;

/** A setting that the push needs. */
const required = (name: string) => {
  const value = setting(name);
  if (value === undefined) {
    throw new Error(`Set ${name} (README, Start). Nothing was pushed.`);
  }
  return value;
};

/** The values of the two connectors. The hub is pushed once all four are set. */
const CLIENT_SETTINGS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "AUTH_GITHUB_CLIENT_ID",
  "AUTH_GITHUB_CLIENT_SECRET",
];

export default Alchemy.Stack(
  repository,
  { providers: Convex.providers(), state: Convex.withRunRecord(Convex.state()) },
  Effect.gen(function* () {
    const { stage } = yield* Alchemy.Stack;
    // One stage: any other name would be a second hub with its own project.
    if (stage !== "prod") {
      throw new Error(`This stack has one stage, prod. The stage ${stage} is not deployed.`);
    }
    // Checked before anything is created: a typo never opens or closes the hub.
    const owners = required("HUB_OWNERS");
    parseOwners(owners);
    const project = yield* Convex.Project("Project", {
      name: setting("HUB_PROJECT") ?? repository.slice(repository.indexOf("/") + 1),
    }).pipe(adopt(false), RemovalPolicy.retain());

    const missing = CLIENT_SETTINGS.filter((name) => setting(name) === undefined);
    if (missing.length > 0) {
      // The first run: the deployment exists, with no code and no variables.
      const deployment = yield* Convex.Deployment("Deployment", { project, type: "prod" }).pipe(
        adopt(false),
        RemovalPolicy.retain(),
      );
      return {
        url: deployment.siteUrl,
        deployment: deployment.name,
        next: `Not pushed: set ${missing.join(", ")} (README, Start).`,
      };
    }

    const issuer = setting("ISSUER");
    const moderationKey = setting("IDENTITY_HUB_MODERATION_KEY");
    // The variables of the deployment. The secrets are props, so the state store holds them next
    // to the deployment they serve.
    const env = {
      ...(issuer === undefined ? {} : { ISSUER: issuer }),
      HUB_OWNERS: owners,
      HUB_NAME: required("HUB_NAME"),
      HUB_TERMS_URL: required("HUB_TERMS_URL"),
      HUB_PRIVACY_URL: required("HUB_PRIVACY_URL"),
      GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
      GOOGLE_CLIENT_SECRET: Redacted.make(required("GOOGLE_CLIENT_SECRET")),
      AUTH_GITHUB_CLIENT_ID: required("AUTH_GITHUB_CLIENT_ID"),
      AUTH_GITHUB_CLIENT_SECRET: Redacted.make(required("AUTH_GITHUB_CLIENT_SECRET")),
      ...(moderationKey === undefined
        ? {}
        : { IDENTITY_HUB_MODERATION_KEY: Redacted.make(moderationKey) }),
    };
    const deployment = yield* Convex.Deployment("Deployment", {
      project,
      type: "prod",
      // The push is the `deploy` package script, which checks the key set first. The functions,
      // package.json, and the lockfile are always hashed.
      source: {
        path: "./convex",
        command: ["node", "--run", "deploy"],
        include: ["scripts/**", "tsconfig*.json"],
      },
      env,
    }).pipe(adopt(false), RemovalPolicy.retain());
    return { url: deployment.siteUrl, deployment: deployment.name };
  }),
);
