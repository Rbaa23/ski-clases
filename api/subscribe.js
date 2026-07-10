const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { user_id, subscription } = req.body;
    if (!user_id || !subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return res.status(400).json({ error: 'Missing user_id or subscription' });
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/push_subs`, {
      method: 'POST',
      headers: { ...headers(), 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        user_id,
        endpoint: subscription.endpoint,
        auth: subscription.keys.auth,
        p256dh: subscription.keys.p256dh,
      }),
    });
    if (!r.ok) return res.status(500).json({ error: 'supabase insert failed' });
    return res.json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { user_id } = req.body;
    await fetch(`${SUPABASE_URL}/rest/v1/push_subs?user_id=eq.${user_id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
