# ADR 0003: Table partitioning for old reviews — not adopted; retention job for logs instead

**Status:** Evaluated. Declined partitioning; implemented a smaller, actually-applicable piece (see below).

## Context

The backlog item was "add partitioning/archiving for old reviews." Worth
checking the premise before building anything: does this table, at this
data volume, benefit from partitioning at all?

## Reviews specifically: no

Postgres table partitioning earns its complexity when a table is large
enough that full-table scans, index size, or vacuum time become a real
operational problem — typically tens of millions of rows, or a table with a
natural, always-filtered-on axis (time-series metrics, event logs) where
old partitions can be dropped wholesale. Neither applies here:

- The reviews table is in the thousands of rows, not millions. Partitioning
  a table this size adds query-planning overhead and migration risk for a
  performance problem that doesn't exist yet — indexes on `bookId`/`userId`
  already make every real query (a book's reviews, a user's reviews) fast.
- Reviews aren't naturally "archivable" the way logs are. A five-year-old
  review of a book is exactly as relevant as a five-day-old one — it's
  content, not telemetry. There's no `WHERE createdAt > X` access pattern to
  optimize for, and nothing to safely drop.
- Partitioning by `createdAt` would also fight the unique index added for
  soft-deleted reviews (`WHERE "deletedAt" IS NULL`, partial unique per
  book/user) — partition keys in Postgres have constraints on what indexes
  can enforce uniqueness across partitions, and reworking that isn't free.

## What actually *does* grow unboundedly here: SecurityEvents

The one table in this schema with genuine unbounded, rarely-queried-after-
the-fact growth is `SecurityEvents` — every failed login, rate-limit hit,
signup-bot block, and 2FA failure writes a row, forever, with no cleanup.
That's the actual "old data nobody needs in the hot table anymore" case
this backlog item was gesturing at, just on the wrong table.

## Decision

- Did not partition or archive the Reviews table — no current or
  foreseeable justification at this data volume and access pattern.
- Added a retention job instead, scoped to what actually accumulates
  without bound: `server/scripts/cleanupOldData.js`, run daily via a
  systemd timer (same pattern as the existing uptime-check timer), deletes
  `SecurityEvents` older than 90 days and clears expired password-reset
  tokens still sitting on user rows after their expiry passed. Chose
  deletion over a separate archive table — nothing has needed to look at a
  91-day-old security event yet, and adding an archive table would be
  solving a problem nobody has hit.

Revisit reviews partitioning if: the table reaches millions of rows, or a
genuinely time-scoped access pattern shows up (e.g. "only show reviews from
the last 2 years" as a product decision, not a technical one).
