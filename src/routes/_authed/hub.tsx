import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";

const hubQuery = convexQuery(api.console.hub, {});

export const Route = createFileRoute("/_authed/hub")({
  loader: async ({ context }) => {
    // @ts-expect-error convexQuery always sets queryFn, but its type allows undefined there, which `query` rejects under exactOptionalPropertyTypes.
    await context.queryClient.query(hubQuery);
  },
  component: HubPage,
});

function HubPage() {
  const { data: apps } = useSuspenseQuery(hubQuery);
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-lg font-medium">Hub</h1>
      {apps.map((app) => (
        <section key={app.appId} className="flex flex-col gap-2 text-sm">
          <h2 className="font-medium">
            {app.name} <span className="font-normal text-neutral-500">{app.appId}</span>
          </h2>
          <table className="w-full text-left">
            <thead className="text-neutral-500">
              <tr>
                <th className="py-1 font-normal">Client</th>
                <th className="py-1 font-normal">Type</th>
                <th className="py-1 font-normal">Callback</th>
              </tr>
            </thead>
            <tbody>
              {app.clients.map((client) => (
                <tr
                  key={client.clientId}
                  className="border-t border-neutral-200 dark:border-neutral-800"
                >
                  <td className="py-2">{client.clientName}</td>
                  <td className="py-2">{client.deploymentType}</td>
                  <td className="py-2 break-all text-neutral-500">{client.redirectUri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}
