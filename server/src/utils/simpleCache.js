// Minimal in-memory TTL cache for read-heavy, rarely-changing endpoints.
// Not shared across processes — fine here since the app runs as a single
// Node process per environment (no horizontal scaling to worry about).
const store = new Map();

// Disabled under test: route tests reuse the same query params across
// beforeEach-truncated fixtures, and a cache hit would silently serve a
// previous test's data instead of exercising the query at all.
const disabled = process.env.NODE_ENV === "test";

function get(key) {
  if (disabled) return undefined;
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlMs) {
  if (disabled) return;
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

module.exports = { get, set };
