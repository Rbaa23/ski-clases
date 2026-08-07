import webPush from 'web-push';
import { sendEmail } from './email.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@statclass.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?recordar=eq.true&select=id,email,nombre`, { headers: headers() });
    const users = await r.json();
    if (!Array.isArray(users)) return res.json({ sent: 0, users: [] });

    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    const mananaStr = manana.toISOString().slice(0, 10);

    const results = [];
    for (const u of users) {
      const clsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clases?user_id=eq.${u.id}&fecha=gte.${hoyStr}&fecha=lt.${mananaStr}&select=id`,
        { headers: headers() }
      );
      const cls = await clsRes.json();
      if (Array.isArray(cls) && cls.length > 0) continue;

      const pushRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subs?user_id=eq.${u.id}&select=id,endpoint,auth,p256dh`, { headers: headers() });
      const pushSubs = await pushRes.json();
      if (Array.isArray(pushSubs) && pushSubs.length > 0) {
        for (const ps of pushSubs) {
          try {
            await webPush.sendNotification({
              endpoint: ps.endpoint,
              keys: { auth: ps.auth, p256dh: ps.p256dh }
            }, JSON.stringify({ title: 'StatClass', body: `Hola ${u.nombre}, hoy no registraste clases. ¡Agrégalas ahora!`, url: 'https://ski-clases.vercel.app' }));
          } catch (e) {
            if (e.statusCode === 410) {
              await fetch(`${SUPABASE_URL}/rest/v1/push_subs?id=eq.${ps.id}`, { method: 'DELETE', headers: headers() });
            }
          }
        }
      }

      try {
        const info = await sendEmail({
          to: u.email,
          subject: '¿Te olvidaste de registrar tus clases hoy?',
          html: `<div style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto;background:#0a1628;color:#e8f4f8;border-radius:12px;text-align:center">
            <div style="font-size:40px;margin-bottom:12px">⛷️</div>
            <h2 style="color:#4FC3F7;margin:0 0 8px">¡Te echamos de menos!</h2>
            <p style="font-size:14px;line-height:1.6;margin-bottom:20px">Hola <strong>${u.nombre}</strong>, hoy no registraste ninguna clase en StatClass.</p>
            <p style="font-size:14px;line-height:1.6;margin-bottom:20px">¿Se te pasó? Puedes agregarlas ahora en la app.</p>
            <a href="https://ski-clases.vercel.app" style="display:inline-block;padding:14px 32px;background:linear-gradient(90deg,#0277bd,#0288d1);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px">Ir a StatClass</a>
          </div>`,
        });
        results.push({ user: u.email, ok: true, id: info.messageId });
      } catch (e) {
        results.push({ user: u.email, ok: false, error: e.message });
      }
    }
    res.json({ sent: results.filter(r => r.ok).length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
