import { useAuthActions } from "@convex-dev/auth/react";
import { createFileRoute } from "@tanstack/react-router";
import { ConvexHttpClient } from "convex/browser";
import { type SyntheticEvent, useState } from "react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/signin")({ component: SignInPage });

function SignInPage() {
  const { setSession } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const signIn = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);
    try {
      // The route mints the session, keeps the refresh token in its httpOnly cookie, and returns
      // the access token. The trailing `?path=` puts the endpoint of the client into the query.
      const client = new ConvexHttpClient("/auth/signin?path=", {
        skipConvexDeploymentUrlCheck: true,
      });
      const result = await client.mutation(api.auth.signInWithPassword, { email, password });
      if (result.status === "error") {
        setError("Incorrect email or password, or too many attempts.");
        return;
      }
      await setSession(result.tokens);
      // A document load, so that the server renders the first page from the new cookie.
      location.assign("/");
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-4 pt-16">
      <h1 className="text-lg font-medium">Base</h1>
      <form className="flex flex-col gap-3" onSubmit={(event) => void signIn(event)}>
        <input
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="username"
          placeholder="Email"
          required
        />
        <input
          className="rounded border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          required
        />
        <button
          className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Signing in" : "Sign in"}
        </button>
      </form>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}
