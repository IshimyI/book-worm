# ADR 0001: SSR / prerender migration — not adopted

**Status:** Evaluated, declined for now. Revisit if organic search traffic becomes a priority.

## Context

The client is a Vite + React SPA. Book pages, the catalog, and profile pages
build their `<title>`/`<meta description>`/OG tags client-side via
`useSeoMeta` after data loads, rather than having them present in the initial
HTML response. The question: is it worth migrating to SSR (e.g. Next.js) or
adding a prerender step (e.g. `vite-plugin-ssr`, `prerender-spa-plugin`) to
ship real content in the first response?

## What SSR/prerender would actually buy us

- Crawlers that don't execute JS see full content immediately. Googlebot does
  execute JS and generally indexes SPA content correctly, but with a delay
  (content goes through a second "rendering" wave) and less reliably for
  crawlers with tighter JS budgets (Bing, and most social-media link
  unfurlers, which is what actually breaks link previews on Discord/Slack/
  Telegram today — those do NOT run JS).
- Faster First Contentful Paint on slow connections, since there's real
  markup before the JS bundle finishes downloading/executing.

## What it would cost

- Next.js migration: every page becomes a server component / gets a data
  fetching story rewritten (`getServerSideProps` or the app router
  equivalent), the Express API stays but the deployment model changes
  (Node process serving pages, not a static `dist/` behind nginx), and the
  whole client/server split in this repo would need restructuring. This is
  not an incremental change — it's close to a rewrite of the client.
- `vite-plugin-ssr`/prerender-only: cheaper, but only pays off for pages with
  fixed content (FAQ, Privacy, Terms already are effectively static and
  wouldn't benefit much — they're small and rarely the entry point).
  Book pages and the catalog are exactly the pages that *would* benefit and
  are also the ones with the least static content — everything on them comes
  from the API at request time, so "prerendering" them means the prerender
  step is itself doing a live data fetch per book/list combination at build
  time, which doesn't work for a catalog that changes via user reviews
  continuously. That's server rendering, not prerendering — back to the
  Next.js cost above.

## Decision

Not worth it at current scale. What's already in place covers the highest-
value part of this cheaply:
- `sitemap.xml` + `robots.txt` so crawlers *find* every book/list page even
  without following in-app links.
- `useSeoMeta` gives Googlebot's second-wave render correct title/description
  per page, which is what actually matters for search result snippets.
- Link-preview unfurling (Discord/Telegram/Slack) genuinely doesn't work
  without SSR — but that's a "nice to have" for a book review site, not a
  conversion-critical path the way it would be for e.g. a product page.

Revisit this if: organic search becomes a meaningful acquisition channel and
current rankings/impressions (Search Console) show pages aren't being
indexed, or if social sharing of book pages becomes a real usage pattern
where broken previews are costing engagement.
