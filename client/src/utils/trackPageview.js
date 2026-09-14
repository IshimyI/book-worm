

export default function trackPageview(path) {
  try {
    const url = `${import.meta.env.VITE_TARGET}/api/v1/analytics/pageview`;
    const body = JSON.stringify({ path, referrer: document.referrer || null });
    if (navigator.sendBeacon) {

      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true });
    }
  } catch {

  }
}
