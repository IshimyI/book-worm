

const store = new Map();

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

function clearPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = { get, set, clearPrefix };
