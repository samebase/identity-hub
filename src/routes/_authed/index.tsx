import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { formatTime, shortCommit } from "../../format";

const stacksQuery = convexQuery(api.console.stacks, {});

export const Route = createFileRoute("/_authed/")({
  // On the server, the query runs with the token of the session cookie.
  loader: async ({ context }) => {
    // @ts-expect-error convexQuery always sets queryFn, but its type allows undefined there, which `query` rejects under exactOptionalPropertyTypes.
    await context.queryClient.query(stacksQuery);
  },
  component: StacksPage,
});

function StacksPage() {
  const { data: stacks } = useSuspenseQuery(stacksQuery);
  return (
    <main className="flex flex-col gap-3">
      <h1 className="text-lg font-medium">Stacks</h1>
      <table className="w-full text-left text-sm">
        <thead className="text-neutral-500">
          <tr>
            <th className="py-1 font-normal">Stack</th>
            <th className="py-1 font-normal">Stages</th>
            <th className="py-1 font-normal">Last deploy</th>
          </tr>
        </thead>
        <tbody>
          {stacks.map((stack) => {
            const last = stack.stages
              .map((stage) => stage.record)
              .reduce<(typeof stack.stages)[number]["record"] | null>(
                (latest, record) =>
                  latest === null || record.recordedAt > latest.recordedAt ? record : latest,
                null,
              );
            return (
              <tr key={stack.name} className="border-t border-neutral-200 dark:border-neutral-800">
                <td className="py-2">
                  <Link to="/stacks/$" params={{ _splat: stack.name }} className="underline">
                    {stack.name}
                  </Link>
                </td>
                <td className="py-2">{stack.stages.length}</td>
                <td className="py-2 text-neutral-500">
                  {last === null
                    ? "No run record"
                    : `${formatTime(last.recordedAt)}, ${last.branch} ${shortCommit(last.headCommit)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
