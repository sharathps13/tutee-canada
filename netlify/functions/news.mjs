/**
 * GET /api/news — live Canada headlines for the "Canada today" wire (Netlify Functions v2).
 *
 * Pulls public feeds server-side (browsers can't read them directly because of CORS),
 * normalises them to { title, link, source, kind, date } and returns the newest first.
 * Headlines and links only — no article text is copied. Results are cached in memory
 * for 10 minutes so the feeds are fetched at most a few times an hour per instance.
 *
 *   kind "ircc"   — Immigration, Refugees and Citizenship Canada news (Government of Canada)
 *   kind "canada" — national Canada news: every federal department's releases (canada.ca) plus CBC News · Canada
 *
 * No keys, no dependencies (Node 18+ global fetch). If every feed fails it returns
 * 503 and the page shows its offline state with links to the sources.
 */
export const config = { path: '/api/news' };

const FEEDS = [
  // Official Government of Canada news API (Canada News Centre) — Atom
  { kind: 'ircc', source: 'IRCC · canada.ca', url: 'https://api.io.canada.ca/io-server/gc/news/en/v2?dept=departmentofcitizenshipandimmigration&type=newsreleases&sort=publishedDate&orderBy=desc&pick=12&format=atom' },
  { kind: 'canada', source: 'Government of Canada', byAuthor: true, url: 'https://api.io.canada.ca/io-server/gc/news/en/v2?type=newsreleases&sort=publishedDate&orderBy=desc&pick=20&format=atom' },
  { kind: 'canada', source: 'CBC News', url: 'https://www.cbc.ca/webfeed/rss/rss-canada' }
];
const TTL_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 6000;
let cache = { at: 0, body: null };

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…' };
export function decode(s) {
  return String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ').trim();
}
const pick = (xml, tag) => { const m = xml.match(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)</' + tag + '>', 'i')); return m ? m[1] : ''; };
const safeLink = (u) => { try { const x = new URL(decode(u)); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };

/** Parse RSS 2.0 <item> or Atom <entry> blocks. */
export function parseFeed(xml, feed) {
  const out = [];
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const title = decode(pick(b, 'title')).slice(0, 220);
    let link = pick(b, 'link');
    if (!link || !/^\s*(https?:|<!\[CDATA\[)/i.test(link)) { const m = b.match(/<link\b[^>]*href="([^"]+)"/i); link = m ? m[1] : link; }
    link = safeLink(link);
    const raw = pick(b, 'pubDate') || pick(b, 'published') || pick(b, 'updated') || pick(b, 'dc:date');
    const t = Date.parse(decode(raw));
    const author = feed.byAuthor ? decode(pick(pick(b, 'author'), 'name')) : '';
    if (title && link) out.push({ title, link, source: author ? author.slice(0, 60) : feed.source, kind: feed.kind, date: Number.isFinite(t) ? new Date(t).toISOString() : null });
  }
  return out;
}

async function get(feed) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(feed.url, { signal: ctl.signal, headers: { 'user-agent': 'TuteeConnect-CanadaNews/1.0 (+https://tuteeconnect.com)', accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' } });
    if (!r.ok) return [];
    return parseFeed(await r.text(), feed);
  } catch { return []; } finally { clearTimeout(tm); }
}

const json = (status, body, maxAge) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store' }
});

export default async (req) => {
  if (req.method !== 'GET') return json(405, { error: 'method' });
  if (cache.body && Date.now() - cache.at < TTL_MS) return json(200, cache.body, 300);
  const lists = await Promise.all(FEEDS.map(get));
  let items = lists.flat();
  if (!items.length) return cache.body ? json(200, { ...cache.body, stale: true }, 60) : json(503, { error: 'feeds unavailable' });
  const seen = new Set();
  items = items.filter((i) => { const k = i.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => (b.date ? Date.parse(b.date) : 0) - (a.date ? Date.parse(a.date) : 0))
    .slice(0, 30);
  cache = { at: Date.now(), body: { updated: new Date().toISOString(), items } };
  return json(200, cache.body, 300);
};
