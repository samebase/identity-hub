import { broker } from "./http";

// Administration for `npx convex run identityBroker:<name>`:
//   createApp '{"name":"Bristol","firstParty":true,"allowedCallbackHosts":["*.convex.site","127.0.0.1"]}'
//   mintRegistrationToken '{"appId":"bristol-ab12c","expiresInDays":3650}'
//   listRegistrationTokens '{"appId":"..."}', revokeRegistrationToken '{"tokenHash":"..."}'
//   setAllowedCallbackHosts '{"appId":"...","allowedCallbackHosts":["*.convex.site","app.example.com"]}'
//   listApps, listClients '{"appId":"..."}', deleteClient '{"clientId":"..."}', deleteApp '{"appId":"..."}'
export const {
  createApp,
  mintRegistrationToken,
  listRegistrationTokens,
  revokeRegistrationToken,
  setAllowedCallbackHosts,
  deleteApp,
  listApps,
  listClients,
  deleteClient,
  cleanup,
} = broker.admin();
