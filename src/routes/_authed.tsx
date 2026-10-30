import {
  RedirectWithoutSession,
  redirectWithoutSession,
  useSignOutSession,
} from "@samebase/convex-auth-tanstack-start";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

/** The pages under `_authed/` need a session: without one, they redirect to /signin. */
export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ serverContext }) => redirectWithoutSession(serverContext, { to: "/signin" }),
  component: AuthedLayout,
});

function AuthedLayout() {
  const signOut = useSignOutSession("/auth/signout", "/signin");
  return (
    <RedirectWithoutSession to="/signin">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4">
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "font-medium" }}>
            Stacks
          </Link>
          <Link to="/hub" activeProps={{ className: "font-medium" }}>
            Hub
          </Link>
          <button className="ml-auto" type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </nav>
        <Outlet />
      </div>
    </RedirectWithoutSession>
  );
}
