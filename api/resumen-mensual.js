import { sendEmail } from './email.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

function headers() {
  return { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' };
}

function fmt(n) { return "$" + Math.round(n).toLocaleString("es-CL"); }

function buildEmail(nombre, mes, data) {
  const clases = data.clases || [];
  const descuentos = data.descuentos || [];
  const otros = data.otros || [];
  const totalClases = clases.length;
  const totalHoras = clases.reduce((s, c) => s + (c.horas || 1), 0);
  const porTipo = { particular: 0, colectiva: 0, requerida: 0 };
  const horasTipo = { particular: 0, colectiva: 0, requerida: 0 };
  const valorTipo = { particular: 0, colectiva: 0, requerida: 0 };
  clases.forEach(c => { porTipo[c.tipo]++; horasTipo[c.tipo] += (c.horas || 1); valorTipo[c.tipo] += c.valor; });
  const totalBruto = clases.reduce((s, c) => s + c.valor, 0);
  const totalDesc = descuentos.reduce((s, d) => s + d.valor, 0);
  const totalGastos = otros.filter(o => o.tipo === "gasto").reduce((s, o) => s + o.valor, 0);
  const totalIngresos = otros.filter(o => o.tipo === "ingreso").reduce((s, o) => s + o.valor, 0);
  const totalNeto = totalBruto - totalDesc - totalGastos + totalIngresos;
  const impuesto = Math.round(totalNeto * 0.1525);
  const totalLiquido = totalNeto - impuesto;
  const skiClases = clases.filter(c => (c.disciplina_clase || "ski") === "ski").length;
  const snowClases = clases.filter(c => (c.disciplina_clase || "snow") === "snow").length;
  const diasTrabajados = new Set(clases.map(c => c.fecha?.slice(0, 10))).size;
  const nombreMes = new Date(mes + "-01").toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return `
<div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0a1628;color:#e8f4f8;border-radius:12px;padding:24px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:24px;font-weight:bold;color:#4FC3F7">StatClass</div>
    <div style="font-size:11px;color:#607d8b;letter-spacing:2">RESUMEN MENSUAL</div>
    <div style="font-size:13px;color:#90CAF9;margin-top:4px">${nombreMes}</div>
  </div>
  ${totalClases === 0 ? `
    <div style="text-align:center;padding:20px;background:rgba(255,255,255,0.04);border-radius:10px;color:#607d8b;font-size:14px">No registraste clases este mes.</div>
  ` : `
    <div style="display:flex;gap:10px;margin-bottom:15px">
      <div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#607d8b">Clases</div>
        <div style="font-size:16px;font-weight:bold;color:#4FC3F7">${totalClases}</div>
      </div>
      <div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#607d8b">Horas</div>
        <div style="font-size:16px;font-weight:bold;color:#4FC3F7">${totalHoras}h</div>
      </div>
      <div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#607d8b">Días</div>
        <div style="font-size:16px;font-weight:bold;color:#4FC3F7">${diasTrabajados}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px">
      ${porTipo.particular > 0 ? `<tr><td style="padding:6px 0;color:#90CAF9">⛷️ Particular</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.particular} · ${horasTipo.particular}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.particular)}</td></tr>` : ""}
      ${porTipo.colectiva > 0 ? `<tr><td style="padding:6px 0;color:#90CAF9">👥 Colectiva</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.colectiva} · ${horasTipo.colectiva}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.colectiva)}</td></tr>` : ""}
      ${porTipo.requerida > 0 ? `<tr><td style="padding:6px 0;color:#90CAF9">📋 Requerida</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.requerida} · ${horasTipo.requerida}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.requerida)}</td></tr>` : ""}
      ${skiClases > 0 || snowClases > 0 ? `<tr><td colspan="3" style="border-top:1px solid rgba(255,255,255,0.07);padding:4px 0"></td></tr>
      ${skiClases > 0 ? `<tr><td style="padding:4px 0;color:#6495ED;font-size:12px">⛷️ Ski</td><td style="text-align:center;padding:4px 0;color:#607d8b;font-size:12px">${skiClases} clases</td><td style="text-align:right;padding:4px 0;color:#6495ED;font-size:12px">${fmt(clases.filter(c=>c.disciplina_clase==="ski").reduce((s,c)=>s+c.valor,0))}</td></tr>` : ""}
      ${snowClases > 0 ? `<tr><td style="padding:4px 0;color:#F06292;font-size:12px">🏂 Snow</td><td style="text-align:center;padding:4px 0;color:#607d8b;font-size:12px">${snowClases} clases</td><td style="text-align:right;padding:4px 0;color:#F06292;font-size:12px">${fmt(clases.filter(c=>c.disciplina_clase==="snow").reduce((s,c)=>s+c.valor,0))}</td></tr>` : ""}` : ""}
      <tr><td colspan="3" style="border-top:1px solid rgba(255,255,255,0.07)"></td></tr>
      ${totalDesc > 0 ? `<tr><td style="padding:4px 0;color:#ef9a9a;font-size:12px">Descuentos comida</td><td></td><td style="text-align:right;padding:4px 0;color:#ef9a9a;font-size:12px">-${fmt(totalDesc)}</td></tr>` : ""}
      ${totalGastos > 0 ? `<tr><td style="padding:4px 0;color:#ef9a9a;font-size:12px">Gastos</td><td></td><td style="text-align:right;padding:4px 0;color:#ef9a9a;font-size:12px">-${fmt(totalGastos)}</td></tr>` : ""}
      ${totalIngresos > 0 ? `<tr><td style="padding:4px 0;color:#81C784;font-size:12px">Ingresos extra</td><td></td><td style="text-align:right;padding:4px 0;color:#81C784;font-size:12px">+${fmt(totalIngresos)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;border-top:2px solid #4FC3F744;font-weight:bold;color:#4FC3F7">TOTAL NETO</td><td style="text-align:center;padding:8px 0;border-top:2px solid #4FC3F744;color:#607d8b;font-size:12px">${totalClases} clases · ${totalHoras}h</td><td style="text-align:right;padding:8px 0;border-top:2px solid #4FC3F744;font-weight:bold;color:#4FC3F7;font-size:16px">${fmt(totalNeto)}</td></tr>
      <tr><td style="padding:4px 0;color:#FFB74D;font-size:12px">📄 Retención 15,25%</td><td></td><td style="text-align:right;padding:4px 0;color:#FFB74D;font-size:12px">-${fmt(impuesto)}</td></tr>
      <tr><td style="padding:8px 0;border-top:2px solid #81C784;font-weight:bold;color:#81C784">💰 LÍQUIDO A RECIBIR</td><td style="text-align:center;padding:8px 0;border-top:2px solid #81C784;color:#607d8b;font-size:12px">${totalNeto} - ${impuesto}</td><td style="text-align:right;padding:8px 0;border-top:2px solid #81C784;font-weight:bold;color:#81C784;font-size:18px">${fmt(totalLiquido)}</td></tr>
    </table>
  `}
  <div style="font-size:11px;color:#607d8b;text-align:center;border-top:1px solid rgba(255,255,255,0.07);padding-top:12px">
    StatClass · ski-clases.vercel.app
  </div>
</div>`;
}

export default async function handler(req, res) {
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = ahora.getMonth();
    const mesAnterior = mes === 0 ? 12 : mes;
    const anioAnterior = mes === 0 ? anio - 1 : anio;
    const mesStr = `${anioAnterior}-${String(mesAnterior).padStart(2, '0')}`;
    const siguienteAnio = mesAnterior === 12 ? anioAnterior + 1 : anioAnterior;
    const siguienteMes = mesAnterior === 12 ? 1 : mesAnterior + 1;
    const siguienteMesStr = `${siguienteAnio}-${String(siguienteMes).padStart(2, '0')}`;

    const usersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?resumen_mensual=eq.true&select=id,email,nombre`,
      { headers: headers() }
    );
    const users = await usersRes.json();
    if (!Array.isArray(users)) return res.json({ sent: 0, users: [] });

    const results = [];
    for (const u of users) {
      const [clasesRes, descuentosRes, otrosRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/clases?user_id=eq.${u.id}&fecha=gte.${mesStr}-01&fecha=lt.${siguienteMesStr}-01&select=*`, { headers: headers() }),
        fetch(`${SUPABASE_URL}/rest/v1/descuentos?user_id=eq.${u.id}&fecha=gte.${mesStr}-01&fecha=lt.${siguienteMesStr}-01&select=*`, { headers: headers() }),
        fetch(`${SUPABASE_URL}/rest/v1/otros?user_id=eq.${u.id}&fecha=gte.${mesStr}-01&fecha=lt.${siguienteMesStr}-01&select=*`, { headers: headers() }),
      ]);
      const clases = await clasesRes.json();
      const descuentos = await descuentosRes.json();
      const otros = await otrosRes.json();
      const data = {
        clases: Array.isArray(clases) ? clases : [],
        descuentos: Array.isArray(descuentos) ? descuentos : [],
        otros: Array.isArray(otros) ? otros : [],
      };
      const html = buildEmail(u.nombre, mesStr, data);
      const subject = `📊 Resumen mensual StatClass — ${new Date(anioAnterior, mesAnterior - 1).toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`;
      try {
        const info = await sendEmail({ to: u.email, subject, html });
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
