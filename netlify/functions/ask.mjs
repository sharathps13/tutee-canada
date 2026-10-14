/**
 * POST /api/ask — AI answers for the "Ask Tutee" FAQ chat (Netlify Functions v2).
 *
 * Only used when a typed question doesn't closely match a vetted FAQ answer.
 * The model is told to answer ONLY from the supplied FAQ text and to send anything
 * personal or uncertain to a counsellor. With no key set it returns 503 and the
 * page falls back to its built-in answers — the chat still works.
 *
 * Environment variables (Netlify → Site settings → Environment variables):
 *   ANTHROPIC_API_KEY   required to enable AI answers. Server-side only.
 *   ANTHROPIC_MODEL     optional, defaults to claude-haiku-4-5
 */
export const config = { path: '/api/ask' };

const SYSTEM = `You are "Ask Tutee", the assistant on Tutee Connect's Study in Canada page.
Answer ONLY using the FAQ facts provided. If they don't cover the question, say so briefly and suggest booking free counselling with Tutee Connect.
Rules: never guarantee admission, a study permit, a job or permanent residence; never invent fees, rankings, dates or statistics; you are not a licensed immigration consultant, so personal immigration questions go to a counsellor or canada.ca.
Style: warm, plain English, at most 90 words, no markdown, no lists.`;

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(503, { error: 'not configured' });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: 'bad json' }); }
  const question = String(body?.question || '').trim().slice(0, 400);
  const context = String(body?.context || '').slice(0, 8000);
  if (!question) return json(400, { error: 'empty' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: 'user', content: `FAQ facts:\n${context}\n\nVisitor question: ${question}` }]
      })
    });
    if (!r.ok) return json(502, { error: 'upstream' });
    const d = await r.json();
    const answer = (d.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    return answer ? json(200, { answer }) : json(502, { error: 'empty' });
  } catch {
    return json(502, { error: 'upstream' });
  }
};
