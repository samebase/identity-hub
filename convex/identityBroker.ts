import { broker } from "./http";

// Administration for `npx convex run identityBroker:<name>`:
//   createApp '{"name":"Bristol","firstParty":true,"allowedCallbackHosts":["*.convex.site","127.0.0.1"]}'
//   mintRegistrationToken '{"appId":"bristol-ab12c"}'
//   listApps, listClients '{"appId":"..."}', deleteApp '{"appId":"..."}'
export const { createApp, mintRegistrationToken, deleteApp, listApps, listClients, cleanup } =
  broker.admin();
