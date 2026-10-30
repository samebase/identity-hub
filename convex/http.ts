import { routeAll } from "@samebase/convex-hosting";
// Type only, nothing is bundled: the server build imported below.
import type {} from "@samebase/convex-hosting-tanstack-start/server-build";
import { httpRouter } from "convex/server";
import { versionId } from "../.convex-hosting/version.js";
import server from "../dist/server/server.js";
import { components } from "./_generated/api";
import { broker } from "./broker";

const http = httpRouter();
broker.addHttpRoutes(http);

// Every other path, as a Cloudflare Worker with static assets: a file of the build, else the page
// that src/server.ts renders. Convex picks an exact path, then the longest prefix, so the routes of
// the hub above and the /auth prefix of the Convex Auth component win over "/". A page of the site
// cannot use those paths. `pnpm run deploy` writes the build and .convex-hosting/version.js.
const site = routeAll(http, components.hosting, versionId, server);
// Exact routes for the three session routes of src/server.ts: the /auth prefix would take them.
for (const path of ["/auth/signin", "/auth/refresh", "/auth/signout"]) {
  http.route({ path, method: "POST", handler: site });
}

export default http;
