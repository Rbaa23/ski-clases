export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const r = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/get_users_for_reminder`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY },
    });
    const users = await r.json();
    if (!Array.isArray(users)) return res.json({ sent: 0, users: [] });

    const results = [];
    for (const u of users) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'StatClass <onboarding@resend.dev>',
          to: [u.email],
          subject: '¿Te olvidaste de registrar tus clases hoy?',
          html: `<div style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto;background:#0a1628;color:#e8f4f8;border-radius:12px;text-align:center">
            <div style="font-size:40px;margin-bottom:12px">⛷️</div>
            <h2 style="color:#4FC3F7;margin:0 0 8px">¡Te echamos de menos!</h2>
            <p style="font-size:14px;line-height:1.6;margin-bottom:20px">Hola <strong>${u.nombre}</strong>, hoy no registraste ninguna clase en StatClass.</p>
            <p style="font-size:14px;line-height:1.6;margin-bottom:20px">¿Se te pasó? Puedes agregarlas ahora en la app.</p>
            <a href="https://ski-clases.vercel.app" style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#0277bd,#0288d1);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px">Ir a StatClass</a>
          </div>`,
        }),
      });
      const emailData = await emailRes.json();
      results.push({ user: u.email, ok: emailRes.ok, id: emailData.id });
    }
    res.json({ sent: results.filter(r=>r.ok).length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
