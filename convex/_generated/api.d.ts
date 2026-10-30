/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as authAdmin from "../authAdmin.js";
import type * as broker from "../broker.js";
import type * as connectors from "../connectors.js";
import type * as console from "../console.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as identityBroker from "../identityBroker.js";
import type * as reader from "../reader.js";
import type * as state from "../state.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  authAdmin: typeof authAdmin;
  broker: typeof broker;
  connectors: typeof connectors;
  console: typeof console;
  crons: typeof crons;
  http: typeof http;
  identityBroker: typeof identityBroker;
  reader: typeof reader;
  state: typeof state;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  identityBroker: import("@samebase/identity-broker/_generated/component.js").ComponentApi<"identityBroker">;
  alchemyState: import("@samebase/alchemy-convex/state/_generated/component.js").ComponentApi<"alchemyState">;
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  hosting: import("@samebase/convex-hosting/_generated/component.js").ComponentApi<"hosting">;
};
