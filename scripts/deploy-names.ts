// The names of the resources that the setup stack owns, from the GitHub repository name.
/// <reference types="node" />
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { parseEnv } from "node:util";

/**
 * GITHUB_REPOSITORY (`<owner>/<repository>`) from the environment, or from .env on a laptop. GitHub
 * Actions sets it. The Alchemy CLI reads .env into its own config, not into process.env, and
 * alchemy.run.ts needs the names on import.
 */
function repositoryFromEnvironment(): string {
  const value = process.env["GITHUB_REPOSITORY"];
  if (value) {
    return value;
  }
  return existsSync(".env")
    ? (parseEnv(readFileSync(".env", "utf8"))["GITHUB_REPOSITORY"] ?? "")
    : "";
}

/**
 * `stack` keys the Alchemy state: owner and repository, lowercase, joined with `_`; an owner name
 * has no `_`, so two repositories never share a stack. `convexProject` is the repository name as a
 * Convex project name: lowercase, runs of other characters as one dash, 40 characters at most.
 */
export function deployNames(repository = repositoryFromEnvironment()) {
  const match = /^([^/]+)\/([^/]+)$/.exec(repository);
  if (match === null) {
    throw new Error(
      `GITHUB_REPOSITORY is "${repository}", not "<owner>/<repository>". GitHub Actions sets it. On a laptop, set it in the environment or in .env.`,
    );
  }
  const [, owner, name] = match;
  const convexProject = name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  if (convexProject === "") {
    throw new Error(`The repository name "${name}" has no letter or digit.`);
  }
  return { repository: { owner, name }, stack: `${owner}_${name}`.toLowerCase(), convexProject };
}
