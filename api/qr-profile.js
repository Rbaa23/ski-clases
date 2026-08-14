const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
}

const SUBTITLES = {
  ski: 'Profesor de Ski',
  snow: 'Profesor de Snowboard',
  polivalente: 'Profesor de Ski y Snowboard',
};

export default async function handler(req, res) {
  const id = req.query.id;
  if (!id || typeof id !== 'string' || id.length < 8) {
    return res.status(400).json({ error: 'id inválido' });
  }
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=nombre,avatar_url,disciplina,instagram,whatsapp`,
      { headers: headers() }
    );
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ error: 'no encontrado' });
    }
    const p = rows[0];
    res.json({
      nombre: p.nombre || null,
      avatar_url: p.avatar_url || null,
      disciplina: p.disciplina || 'ski',
      sub: SUBTITLES[p.disciplina] || 'Profesor de Ski',
      instagram: p.instagram || null,
      whatsapp: p.whatsapp || null,
    });
  } catch (e) {
    res.status(500).json({ error: 'error interno' });
  }
}
