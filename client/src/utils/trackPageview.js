// No cookies, no persisted visitor id, nothing read back from the client —
// this only ever sends the current path forward. sendBeacon over fetch/axios
// because it's designed exactly for "fire this and don't block navigation
// away," which is what a route-change tracker needs.
export default function trackPageview(path) {
  try {
    const url = `${import.meta.env.VITE_TARGET}/api/v1/analytics/pageview`;
    const body = JSON.stringify({ path, referrer: document.referrer || null });
    if (navigator.sendBeacon) {
      // text/plain, not application/json — sendBeacon can't do a CORS
      // preflight, so a "non-simple" content-type silently fails to send
      // cross-origin (only bites in dev, where client/API are different
      // ports; same-origin in prod either way). Server parses it as JSON
      // regardless of the label.
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    // Analytics failing silently is the correct behavior — never let it
    // affect the actual page.
  }
}
