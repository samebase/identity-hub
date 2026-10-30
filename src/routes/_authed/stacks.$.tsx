import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { formatTime, shortCommit } from "../../format";

export const Route = createFileRoute("/_authed/stacks/$")({
  validateSearch: (search: Record<string, unknown>): { stage?: string } =>
    typeof search["stage"] === "string" ? { stage: search["stage"] } : {},
  loader: async ({ context, params }) => {
    // @ts-expect-error convexQuery always sets queryFn, but its type allows undefined there, which `query` rejects under exactOptionalPropertyTypes.
    await context.queryClient.query(convexQuery(api.console.stack, { name: params._splat ?? "" }));
  },
  component: StackPage,
});

const parse = (json: string): Record<string, unknown> => {
  const value: unknown = JSON.parse(json);
  return typeof value === "object" && value !== null
    ? Object.fromEntries(Object.entries(value))
    : {};
};

function StackPage() {
  const { _splat: name = "" } = Route.useParams();
  const search = Route.useSearch();
  const { data: stack } = useSuspenseQuery(convexQuery(api.console.stack, { name }));
  if (stack === null) {
    return <p className="text-sm">{name} has no run record.</p>;
  }
  // `prod` first, then the previews.
  const stages = [...stack.stages].sort(
    (a, b) => Number(b.name === "prod") - Number(a.name === "prod"),
  );
  const stage = stages.find(({ name }) => name === search.stage) ?? stages[0];
  if (stage === undefined) {
    return <p className="text-sm">{name} has no stages.</p>;
  }
  const { record } = stage;
  const repositoryUrl = `https://github.com/${record.repository}`;
  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-lg font-medium">{stack.name}</h1>

      <nav className="flex flex-wrap gap-3 text-sm">
        {stages.map(({ name: stageName }) => (
          <Link
            key={stageName}
            to="/stacks/$"
            params={{ _splat: stack.name }}
            search={{ stage: stageName }}
            className={stageName === stage.name ? "font-medium" : "text-neutral-500"}
          >
            {stageName}
          </Link>
        ))}
      </nav>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="font-medium">Last run</h2>
        <p>
          {formatTime(record.recordedAt)} from {record.source}, branch {record.branch}, commit{" "}
          <a className="underline" href={`${repositoryUrl}/commit/${record.headCommit}`}>
            {shortCommit(record.headCommit)}
          </a>
        </p>
        <p className="flex gap-3">
          {record.pullRequest === null ? null : (
            <a className="underline" href={`${repositoryUrl}/pull/${record.pullRequest}`}>
              Pull request {record.pullRequest}
            </a>
          )}
          {record.runUrl === null ? null : (
            <a className="underline" href={record.runUrl}>
              Workflow run
            </a>
          )}
        </p>
      </section>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="font-medium">Output</h2>
        <pre className="overflow-x-auto">{JSON.stringify(JSON.parse(stage.output), null, 2)}</pre>
      </section>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="font-medium">Resources</h2>
        {stage.resources.map(({ fqn, value }) => {
          const resource = parse(value);
          return (
            <details key={fqn} className="border-t border-neutral-200 py-2 dark:border-neutral-800">
              <summary className="cursor-pointer">
                {fqn}{" "}
                <span className="text-neutral-500">
                  {String(resource["resourceType"])}, {String(resource["status"])}
                </span>
              </summary>
              <pre className="overflow-x-auto pt-2">{JSON.stringify(resource, null, 2)}</pre>
            </details>
          );
        })}
      </section>
    </main>
  );
}
