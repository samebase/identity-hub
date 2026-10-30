import type { ConvexQueryClient } from "@convex-dev/react-query";
import { SessionProvider, sessionBeforeLoad } from "@samebase/convex-auth-tanstack-start";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import appCss from "../style.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  convexQueryClient: ConvexQueryClient;
}>()({
  beforeLoad: sessionBeforeLoad,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Base" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  notFoundComponent: () => <p className="p-4">Not found</p>,
});

function RootComponent() {
  const { convexQueryClient, token } = Route.useRouteContext();
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        <SessionProvider client={convexQueryClient.convexClient} token={token}>
          <Outlet />
        </SessionProvider>
        <Scripts />
      </body>
    </html>
  );
}
