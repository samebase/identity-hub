import { broker } from "./http";

// Administration for `npx convex run identityBroker:<name>`:
//   createApp '{"name":"Bristol","firstParty":true,"allowedCallbackHosts":["*.convex.site","127.0.0.1"]}'
//   mintRegistrationToken '{"appId":"bristol-ab12c"}'
//   setAllowedCallbackHosts '{"appId":"...","allowedCallbackHosts":["*.convex.site","app.example.com"]}'
//   listApps, listClients '{"appId":"..."}', deleteApp '{"appId":"..."}'
export const {
  createApp,
  mintRegistrationToken,
  setAllowedCallbackHosts,
  deleteApp,
  listApps,
  listClients,
  cleanup,
} = broker.admin();
