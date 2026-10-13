// Classifica Centocelle's Arcade.
// Usa un Redis di Upstash via API REST: nessuna dipendenza npm, nessun build.
// Vercel imposta da solo le variabili quando colleghi lo storage (vedi README).

const URL_ =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_URL;

const TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_TOKEN;

const KEY = 'centocelles:leaderboard';
const TOP = 20;

async function redis(command) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  if (!r.ok) throw new Error('redis ' + r.status + ' ' + (await r.text()));
  const j = await r.json();
  return j.result;
}

// Upstash restituisce [membro, punteggio, membro, punteggio, ...]
function toRows(flat) {
  const rows = [];
  if (!Array.isArray(flat)) return rows;
  for (let i = 0; i < flat.length; i += 2) {
    rows.push({ name: String(flat[i]), score: Number(flat[i + 1]) || 0 });
  }
  return rows;
}

async function top() {
  const flat = await redis(['ZRANGE', KEY, '0', String(TOP - 1), 'REV', 'WITHSCORES']);
  return toRows(flat);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL_ || !TOKEN) {
    return res.status(503).json({
      error: 'storage_non_collegato',
      hint: 'Collega Upstash Redis al progetto Vercel: vedi README.'
    });
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ top: await top() });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

      let name = String(body.name || '').trim().toUpperCase().slice(0, 12);
      name = name.replace(/[^A-Z0-9 ._'-]/g, '');
      const score = Math.floor(Number(body.score));

      if (!name) return res.status(400).json({ error: 'nome_mancante' });
      if (!Number.isFinite(score) || score < 0 || score > 100000) {
        return res.status(400).json({ error: 'punteggio_non_valido' });
      }

      // GT: aggiorna solo se il nuovo punteggio è più alto di quello salvato
      await redis(['ZADD', KEY, 'GT', 'CH', String(score), name]);
      return res.status(200).json({ ok: true, top: await top() });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'metodo_non_permesso' });
  } catch (e) {
    return res.status(500).json({ error: 'errore_storage', detail: String(e.message || e) });
  }
};
