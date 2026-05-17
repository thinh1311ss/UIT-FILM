export async function cachedFetch(url, ttlMs = 5 * 60 * 1000) {
  const key = 'cf_' + url;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { data, exp } = JSON.parse(raw);
      if (Date.now() < exp) return data;
      sessionStorage.removeItem(key);
    }
  } catch {}

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();

  try {
    sessionStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttlMs }));
  } catch {}

  return data;
}

export async function cachedHTML(url) {
  const key = 'html_' + url;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { html, exp } = JSON.parse(raw);
      if (Date.now() < exp) return html;
      sessionStorage.removeItem(key);
    }
  } catch {}

  const res = await fetch(url);
  const html = await res.text();

  try {
    sessionStorage.setItem(key, JSON.stringify({ html, exp: Date.now() + 30 * 60 * 1000 }));
  } catch {}

  return html;
}
