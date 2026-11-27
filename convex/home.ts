import { httpAction } from "./_generated/server";

const REPOSITORY = "https://github.com/samebase/identity-hub";

// The look of login.samebase.com's page (samebase/public-identity-broker, src/home.ts).
const page = (host: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${host}</title>
<meta name="description" content="Google and GitHub sign-in for every deployment of your app.">
<style>
  :root { color-scheme: light dark; --fg: #18181b; --muted: #71717a; --bg: #fafafa;
    --slate: #394447; --slate-fg: #fff; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #fafafa; --muted: #a1a1aa; --bg: #09090b; --slate: #fafafa; --slate-fg: #18181b; }
  }
  body { margin: 0; display: grid; min-height: 100svh; place-items: center; color: var(--fg);
    background: var(--bg); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .frame { width: calc(100% - 2rem); max-width: 38rem; padding: 2rem 0; text-align: center; }
  h1 { margin: 0; font-size: clamp(1.75rem, 5vw, 2.25rem); line-height: 1.15; font-weight: 700;
    letter-spacing: -0.03em; }
  .lead { margin: 1rem 0 0; color: var(--muted); font-size: 1.0625rem; }
  .cta { display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: center; justify-content: center;
    margin-top: 1.75rem; }
  .button { display: inline-flex; align-items: center; min-height: 2.5rem; padding: 0 1.125rem;
    color: var(--slate-fg); background: var(--slate); font-size: 0.9375rem; font-weight: 600;
    text-decoration: none; }
  a { color: inherit; text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
  a:focus-visible { outline: 2px solid var(--fg); outline-offset: 2px; }
  footer { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; align-items: center;
    justify-content: center; margin-top: 3rem; font-size: 0.75rem; }
  footer a { color: var(--muted); text-decoration: none; }
  footer a:hover { color: var(--fg); }
  /* The standard Samebase mark: the square, the name in bold, an underline on hover. */
  .samebase span { border-bottom: 1px solid transparent; white-space: nowrap; }
  .samebase:hover span { border-bottom-color: currentColor; }
  .samebase svg { display: inline-block; width: 0.75em; height: 0.75em; margin-right: 0.15em;
    vertical-align: baseline; }
</style>
</head>
<body><div class="frame">
<h1>Sign-in for every deployment of your app</h1>
<p class="lead">An OpenID Connect provider for Google and GitHub sign-in. Each app, pull request preview and dev checkout registers its exact URL from its own GitHub Actions run, with no account.</p>
<div class="cta">
<a class="button" href="${REPOSITORY}#which-one-are-you">Read the guide</a>
<a href="${REPOSITORY}">Source on GitHub</a>
</div>
<footer>
<a href="https://samebase.com/privacy">Privacy</a>
<a href="https://samebase.com/terms">Terms</a>
<a class="samebase" href="https://samebase.com" target="_blank" rel="noopener noreferrer"><span><b><svg viewBox="0 0 60 60" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h60v60H0z M20 20h20v20H20z" fill="currentColor" fill-rule="evenodd"/></svg>Samebase</b></span></a>
</footer>
</div></body>
</html>
`;

/** The page at `/`, which says what this host is to a person who opens it. */
export const home = httpAction(async (_ctx, request) => {
  return new Response(page(new URL(request.url).host), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
});
