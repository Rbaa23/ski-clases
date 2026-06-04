function fmt(n){ return "$"+Math.round(n).toLocaleString("es-CL"); }

function buildEmail(nombre, mes, data) {
  const clases = data.clases||[];
  const descuentos = data.descuentos||[];
  const otros = data.otros||[];
  const totalClases = clases.length;
  const totalHoras = clases.reduce((s,c)=>s+(c.horas||1),0);
  const porTipo = {particular:0,colectiva:0,requerida:0};
  const horasTipo = {particular:0,colectiva:0,requerida:0};
  const valorTipo = {particular:0,colectiva:0,requerida:0};
  clases.forEach(c=>{porTipo[c.tipo]++;horasTipo[c.tipo]+=(c.horas||1);valorTipo[c.tipo]+=c.valor;});
  const totalBruto = clases.reduce((s,c)=>s+c.valor,0);
  const totalDesc = descuentos.reduce((s,d)=>s+d.valor,0);
  const totalGastos = otros.filter(o=>o.tipo==="gasto").reduce((s,o)=>s+o.valor,0);
  const totalIngresos = otros.filter(o=>o.tipo==="ingreso").reduce((s,o)=>s+o.valor,0);
  const totalNeto = totalBruto - totalDesc - totalGastos + totalIngresos;
  const skiClases = clases.filter(c=>(c.disciplina_clase||"ski")==="ski").length;
  const snowClases = clases.filter(c=>(c.disciplina_clase||"snow")==="snow").length;
  const nombreMes = new Date(mes+"-01").toLocaleDateString("es-CL",{month:"long",year:"numeric"});

  return `
<div style="font-family:sans-serif;max-width:500px;margin:auto;background:#0a1628;color:#e8f4f8;border-radius:12px;padding:24px">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:24px;font-weight:bold;color:#4FC3F7">StatClass</div>
    <div style="font-size:11px;color:#607d8b;letter-spacing:2">RESUMEN MENSUAL</div>
    <div style="font-size:13px;color:#90CAF9;margin-top:4px">${nombreMes}</div>
  </div>
  ${totalClases===0?`
    <div style="text-align:center;padding:20px;background:rgba(255,255,255,0.04);border-radius:10px;color:#607d8b;font-size:14px">No registraste clases este mes.</div>
  `:`
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:15px">
      ${porTipo.particular>0?`<tr><td style="padding:6px 0;color:#90CAF9">Particular</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.particular} · ${horasTipo.particular}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.particular)}</td></tr>`:""}
      ${porTipo.colectiva>0?`<tr><td style="padding:6px 0;color:#90CAF9">Colectiva</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.colectiva} · ${horasTipo.colectiva}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.colectiva)}</td></tr>`:""}
      ${porTipo.requerida>0?`<tr><td style="padding:6px 0;color:#90CAF9">Requerida</td><td style="text-align:center;padding:6px 0;color:#607d8b">${porTipo.requerida} · ${horasTipo.requerida}h</td><td style="text-align:right;padding:6px 0;color:#4FC3F7;font-weight:500">${fmt(valorTipo.requerida)}</td></tr>`:""}
      <tr><td colspan="3" style="border-top:1px solid rgba(255,255,255,0.07)"></td></tr>
      ${totalDesc>0?`<tr><td style="padding:4px 0;color:#ef9a9a;font-size:12px">Descuentos</td><td></td><td style="text-align:right;padding:4px 0;color:#ef9a9a;font-size:12px">-${fmt(totalDesc)}</td></tr>`:""}
      ${totalGastos>0?`<tr><td style="padding:4px 0;color:#ef9a9a;font-size:12px">Gastos</td><td></td><td style="text-align:right;padding:4px 0;color:#ef9a9a;font-size:12px">-${fmt(totalGastos)}</td></tr>`:""}
      ${totalIngresos>0?`<tr><td style="padding:4px 0;color:#81C784;font-size:12px">Ingresos extra</td><td></td><td style="text-align:right;padding:4px 0;color:#81C784;font-size:12px">+${fmt(totalIngresos)}</td></tr>`:""}
      <tr><td style="padding:8px 0;border-top:2px solid #4FC3F744;font-weight:bold;color:#4FC3F7">TOTAL</td><td style="text-align:center;padding:8px 0;border-top:2px solid #4FC3F744;color:#607d8b;font-size:12px">${totalClases} clases · ${totalHoras}h</td><td style="text-align:right;padding:8px 0;border-top:2px solid #4FC3F744;font-weight:bold;color:#4FC3F7;font-size:16px">${fmt(totalNeto)}</td></tr>
    </table>
    <div style="display:flex;gap:10px;margin-bottom:15px">
      <div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#607d8b">Horas</div>
        <div style="font-size:16px;font-weight:bold;color:#4FC3F7">${totalHoras}h</div>
      </div>
      <div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center">
        <div style="font-size:11px;color:#607d8b">Días</div>
        <div style="font-size:16px;font-weight:bold;color:#4FC3F7">${new Set(clases.map(c=>c.fecha?.slice(0,10))).size}</div>
      </div>
      ${skiClases>0?`<div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center"><div style="font-size:11px;color:#607d8b">Ski</div><div style="font-size:16px;font-weight:bold;color:#4FC3F7">${skiClases}</div></div>`:""}
      ${snowClases>0?`<div style="flex:1;background:rgba(79,195,247,0.06);border-radius:8px;padding:10px;text-align:center"><div style="font-size:11px;color:#607d8b">Snow</div><div style="font-size:16px;font-weight:bold;color:#4FC3F7">${snowClases}</div></div>`:""}
    </div>
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
    const mes = ahora.getMonth(); // 0-indexed, mes anterior
    const mesStr = `${anio}-${String(mes).padStart(2,'0')}`;

    const usersRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/rpc/get_users_for_summary`,
      { headers: { apikey: process.env.SUPABASE_ANON_KEY } }
    );
    const users = await usersRes.json();
    if (!Array.isArray(users)) return res.json({ sent: 0, users: [] });

    const results = [];
    for (const u of users) {
      const dataRes = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/rpc/get_user_summary_data`,
        {
          method: 'POST',
          headers: { apikey: process.env.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_user_id: u.id, p_anio: anio, p_mes: mes }),
        }
      );
      const data = await dataRes.json();
      const html = buildEmail(u.nombre, mesStr, data);
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'StatClass <onboarding@resend.dev>',
          to: [u.email],
          subject: `📊 Resumen mensual StatClass — ${new Date(anio, mes-1).toLocaleDateString("es-CL",{month:"long",year:"numeric"})}`,
          html,
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
