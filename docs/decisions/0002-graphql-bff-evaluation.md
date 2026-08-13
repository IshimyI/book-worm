# ADR 0002: GraphQL / BFF layer — not adopted

**Status:** Evaluated, declined. Revisit only if a second client (mobile app) is planned.

## Context

The REST API (`server/src/routes/*.js`) has grown to cover books, reviews,
comments, votes, follows, reading lists (personal + curated), feed, admin
moderation, and recommendations. The question: would introducing GraphQL, or
a dedicated Backend-For-Frontend layer, be worth it now?

## What problem GraphQL/BFF actually solves

- **Overfetching/underfetching** across heterogeneous clients (web + mobile
  + third-party) that each want different shapes of the same data.
- **N+1 request chains** from the client needing to stitch together multiple
  REST calls to render one screen.
- A single flexible query surface instead of hand-rolling a new endpoint
  every time a page needs a slightly different data shape.

## Why it doesn't apply well here

- **One client.** There's exactly one consumer of this API (the React SPA),
  built by the same person who owns the backend. The classic GraphQL
  motivation — different teams/clients with different data needs — doesn't
  exist yet.
- **Endpoints are already shaped for their screens, not generic CRUD.**
  `/book/:id` returns the book *with* its reviews *with* helpful-vote state
  *with* comment counts in one response — that's the same flattening
  GraphQL would do via a query, just decided server-side instead of
  client-side. `/feed`, `/recommendations`, `/users/:id/profile` are the
  same pattern. The N+1 problem GraphQL usually fixes was solved here by
  writing endpoints around actual page needs from the start.
- **Cost is real and ongoing.** A GraphQL layer means a schema to maintain
  in parallel with the Sequelize models, resolvers to write and keep
  authorized correctly (the auth/ownership checks currently living directly
  in each Express route — e.g. `loadManageableList`'s curated-vs-owner logic
  — would need to move into resolver-level guards, which is where GraphQL
  authorization bugs typically live), and a new class of problem
  (query complexity limits, resolver-level N+1 via dataloaders) traded in
  for the one just solved.
- **A BFF specifically** (a thin layer reshaping calls to other services for
  one frontend) doesn't apply either — there's no fan-out to multiple
  backend services here; it's one Express app talking to one Postgres
  database.

## Decision

Not worth it. The existing REST API already behaves like what a BFF would
produce (screen-shaped responses, not generic resource CRUD) because it was
designed for this one client. Introducing GraphQL now would add a schema/
resolver layer to maintain without removing any real pain point.

Revisit if: a second client with meaningfully different data needs shows up
(a mobile app, a public API for third parties) — that's the point where
"one endpoint shape fits all consumers" stops being true and a query layer
starts paying for itself.
