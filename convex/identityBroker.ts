import { broker } from "./http";

// Administration for `npx convex run identityBroker:<name>`:
//   createApp '{"name":"Bristol","firstParty":false}', for an app that is not the team's own
//   registerClient, which Convex.HubClient of @samebase/alchemy-convex runs at deploy time
//   mintRegistrationToken, listRegistrationTokens, revokeRegistrationToken,
//   setAllowedCallbackHosts: deprecated, for the old route until the apps have moved
//   listApps, listClients '{"appId":"..."}', deleteClient '{"clientId":"..."}', deleteApp '{"appId":"..."}'
export const {
  createApp,
  registerClient,
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
