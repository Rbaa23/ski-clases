import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eoppuoiaxnfaihpyovsy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcHB1b2lheG5mYWlocHlvdnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTkwNjIsImV4cCI6MjA5NTkzNTA2Mn0.YfbzhlfNwf9wvCk0iO-8II7RIABEzyWqitHhHi7Q-eo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_PRECIOS = { particular:24000, colectiva:27000, colectiva_extra:1000, colectiva_base:3, requerida:27000, extra_por_hora:true };
const TIPOS = [
  { key:"particular", label:"Particular", emoji:"⛷️", color:"#4FC3F7", bg:"#0d2a3a" },
  { key:"colectiva",  label:"Colectiva",  emoji:"👥", color:"#81C784", bg:"#0d2a1a" },
  { key:"requerida",  label:"Requerida",  emoji:"📋", color:"#FFB74D", bg:"#2a1d0d" },
];
const DIAS_SEMANA = ["L","M","M","J","V","S","D"];
function fmt(n){ return "$"+Math.round(n).toLocaleString("es-CL"); }
function diasEnMes(anio,mes){ return new Date(anio,mes+1,0).getDate(); }

function Toggle({ value, onChange, label, desc, color="#81C784" }) {
  return (
    <div onClick={()=>onChange(!value)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:value?`rgba(129,199,132,0.08)`:"rgba(255,255,255,0.03)", border:value?"1px solid rgba(129,199,132,0.25)":"1px solid rgba(255,255,255,0.08)", borderRadius:10, cursor:"pointer" }}>
      <div>
        <div style={{ fontSize:12, color:value?color:"#607d8b", fontWeight:500 }}>{label}</div>
        {desc&&<div style={{ fontSize:11, color:"#607d8b", marginTop:2 }}>{desc}</div>}
      </div>
      <div style={{ width:44, height:24, background:value?color:"rgba(255,255,255,0.1)", borderRadius:12, position:"relative", flexShrink:0, marginLeft:12 }}>
        <div style={{ width:18, height:18, background:value?"#fff":"#607d8b", borderRadius:"50%", position:"absolute", top:3, left:value?"auto":3, right:value?3:"auto", transition:"all 0.2s" }}/>
      </div>
    </div>
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit() {
    setError(""); setMsg(""); setLoading(true);
    if (mode==="login") {
      const {data,error} = await supabase.auth.signInWithPassword({email,password:pass});
      if(error) setError(error.message); else onAuth(data.user);
    } else {
      const {error} = await supabase.auth.signUp({email,password:pass,options:{data:{nombre}}});
      if(error) setError(error.message);
      else { setMsg("¡Cuenta creada! Revisa tu email para confirmar. Un administrador debe aprobar tu acceso."); setMode("login"); }
    }
    setLoading(false);
  }

  async function handleRecuperar() {
    setError(""); setLoading(true);
    const {error} = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: "https://ski-clases.vercel.app"
    });
    if(error) setError(error.message);
    else setEnviado(true);
    setLoading(false);
  }

  if(recuperar) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      {enviado ? (
        <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>📬</div>
          <div style={{fontSize:20,fontWeight:"bold",marginBottom:8}}>¡Email enviado!</div>
          <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.6,marginBottom:24}}>Revisa tu bandeja de entrada.<br/>Haz clic en el enlace para crear<br/>una nueva contraseña.</div>
          <div style={{background:"rgba(79,195,247,0.08)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#4FC3F7"}}>{emailRecuperar}</div>
          <button onClick={()=>{setRecuperar(false);setEnviado(false);setEmailRecuperar("");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>← Volver al login</button>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:40,marginBottom:8}}>🔑</div>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:6}}>Recuperar contraseña</div>
            <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.5}}>Ingresa tu email y te enviaremos<br/>un enlace para restablecer tu clave.</div>
          </div>
          <input placeholder="Tu email" value={emailRecuperar} onChange={e=>setEmailRecuperar(e.target.value)} type="email" style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"13px 16px",fontSize:14,marginBottom:16,boxSizing:"border-box",fontFamily:"inherit"}}/>
          {error&&<div style={{color:"#ef9a9a",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}
          <button onClick={handleRecuperar} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>{loading?"...":"Enviar enlace"}</button>
          <button onClick={()=>{setRecuperar(false);setError("");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>← Volver al login</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{fontSize:48,marginBottom:8}}>⛷️</div>
      <div style={{fontSize:24,fontWeight:"bold",marginBottom:4}}>Ski Instructor</div>
      <div style={{fontSize:12,color:"#4FC3F7",letterSpacing:2,marginBottom:40}}>REGISTRO DE CLASES</div>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:12,padding:4,marginBottom:24}}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setMode(k);setShowPass(false);}} style={{flex:1,padding:"10px",border:"none",borderRadius:10,background:mode===k?"rgba(79,195,247,0.2)":"transparent",color:mode===k?"#4FC3F7":"#607d8b",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
        {mode==="register"&&<input placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:15,marginBottom:12,boxSizing:"border-box",fontFamily:"inherit"}}/>}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} type="email" style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:15,marginBottom:12,boxSizing:"border-box",fontFamily:"inherit"}}/>
        <div style={{position:"relative",marginBottom:mode==="login"?6:16}}>
          <input placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} type={showPass?"text":"password"} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"14px 48px 14px 16px",fontSize:15,boxSizing:"border-box",fontFamily:"inherit"}}/>
          <button onClick={()=>setShowPass(p=>!p)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",fontSize:18,cursor:"pointer",padding:0}}>{showPass?"👁️":"🔒"}</button>
        </div>
        {mode==="login"&&(
          <div style={{textAlign:"right",marginBottom:16}}>
            <span onClick={()=>{setRecuperar(true);setError("");}} style={{fontSize:12,color:"#4FC3F7",cursor:"pointer",textDecoration:"underline"}}>¿Olvidaste tu contraseña?</span>
          </div>
        )}
        {error&&<div style={{color:"#ef9a9a",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}
        {msg&&<div style={{color:"#81C784",fontSize:13,marginBottom:12,textAlign:"center"}}>{msg}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"15px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:16,fontWeight:"bold",cursor:"pointer"}}>
          {loading?"...":mode==="login"?"Entrar":"Crear cuenta"}
        </button>
      </div>
    </div>
  );
}

function PendienteScreen({user,onLogout}) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8",textAlign:"center"}}>
      <div style={{fontSize:56,marginBottom:16}}>⏳</div>
      <div style={{fontSize:20,fontWeight:"bold",color:"#fff",marginBottom:8}}>Cuenta pendiente</div>
      <div style={{fontSize:14,color:"#90CAF9",marginBottom:32,lineHeight:1.6}}>Tu cuenta está esperando aprobación.<br/>El administrador debe darte acceso.</div>
      <div style={{background:"rgba(79,195,247,0.08)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:14,padding:16,marginBottom:24,width:"100%",maxWidth:360}}>
        <div style={{fontSize:12,color:"#607d8b",marginBottom:4}}>Registrado como</div>
        <div style={{fontSize:14,color:"#4FC3F7"}}>{user.email}</div>
      </div>
      <button onClick={onLogout} style={{width:"100%",maxWidth:360,padding:"14px",background:"rgba(239,83,80,0.1)",border:"1px solid #ef5350",borderRadius:12,color:"#ef9a9a",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>↩ Cerrar sesión</button>
      <div style={{marginTop:20,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#FFB74D"}}></div>
        <span style={{fontSize:12,color:"#607d8b"}}>Esperando aprobación del admin</span>
      </div>
    </div>
  );
}

function AdminPanel({onBack}) {
  const [usuarios,setUsuarios] = useState([]);
  const [sesiones,setSesiones] = useState([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{cargar();},[]);
  async function cargar() {
    const {data:perfiles}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});
    const {data:ses}=await supabase.from("sesiones").select("*");
    setUsuarios(perfiles||[]); setSesiones(ses||[]); setLoading(false);
  }
  async function cambiarEstado(id,aprobado) {
    await supabase.from("profiles").update({aprobado}).eq("id",id);
    setUsuarios(prev=>prev.map(u=>u.id===id?{...u,aprobado}:u));
  }
  if(loading) return <div style={{minHeight:"100vh",background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif"}}>Cargando...</div>;
  const ahora=new Date();
  const mesActual=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
  const pendientes=usuarios.filter(u=>!u.aprobado&&!u.is_admin).length;
  const aprobados=usuarios.filter(u=>u.aprobado).length;
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{background:"linear-gradient(90deg,#0d2a3a,#1a3a50)",borderBottom:"2px solid #4FC3F7",padding:"20px 20px 16px",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:20,cursor:"pointer"}}>←</button>
        <div><div style={{fontSize:10,letterSpacing:3,color:"#4FC3F7"}}>PANEL ADMIN</div><div style={{fontSize:18,fontWeight:"bold"}}>Gestión de usuarios</div></div>
      </div>
      <div style={{padding:20}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
          {[{label:"Total",value:usuarios.length,color:"#4FC3F7"},{label:"Aprobados",value:aprobados,color:"#81C784"},{label:"Pendientes",value:pendientes,color:"#FFB74D"}].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${s.color}33`,borderRadius:14,padding:"14px 10px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:"bold",color:s.color}}>{s.value}</div>
              <div style={{fontSize:11,color:"#90CAF9"}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:12}}>USUARIOS</div>
        {usuarios.map(u=>{
          const esAdmin=u.is_admin,aprobado=u.aprobado;
          const totalAccesos=sesiones.filter(s=>s.user_id===u.id).length;
          const accesosMes=sesiones.filter(s=>s.user_id===u.id&&s.fecha.startsWith(mesActual)).length;
          const borderColor=esAdmin?"#FFB74D33":aprobado?"rgba(129,199,132,0.2)":"rgba(255,183,77,0.2)";
          const bg=esAdmin?"rgba(255,183,77,0.05)":aprobado?"rgba(129,199,132,0.05)":"rgba(255,183,77,0.05)";
          return (
            <div key={u.id} style={{background:bg,border:`1px solid ${borderColor}`,borderRadius:12,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,color:"#e8f4f8"}}>{u.nombre||"Sin nombre"}</div>
                  <div style={{fontSize:11,color:"#607d8b"}}>{u.email}</div>
                  <div style={{fontSize:11,color:"#607d8b",marginTop:2}}>Registrado: {new Date(u.created_at).toLocaleDateString("es-CL")}</div>
                  <div style={{fontSize:11,color:"#4FC3F7",marginTop:4}}>📲 <strong style={{color:"#fff"}}>{totalAccesos}</strong> accesos · <strong style={{color:"#81C784"}}>{accesosMes}</strong> este mes</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  {esAdmin&&<span style={{fontSize:11,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"2px 8px"}}>👑 Admin</span>}
                  {!esAdmin&&<span style={{fontSize:11,borderRadius:6,padding:"2px 8px",color:aprobado?"#81C784":"#FFB74D",background:aprobado?"rgba(129,199,132,0.1)":"rgba(255,183,77,0.1)",border:aprobado?"1px solid #81C78444":"1px solid #FFB74D44"}}>{aprobado?"✅ Aprobado":"⏳ Pendiente"}</span>}
                </div>
              </div>
              {!esAdmin&&(
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>cambiarEstado(u.id,true)} style={{flex:1,padding:"8px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:aprobado?"rgba(129,199,132,0.2)":"rgba(129,199,132,0.1)",border:"1px solid #81C784",color:"#81C784"}}>✅ Aprobar</button>
                  <button onClick={()=>cambiarEstado(u.id,false)} style={{flex:1,padding:"8px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:!aprobado?"rgba(239,83,80,0.2)":"rgba(239,83,80,0.1)",border:"1px solid #ef5350",color:"#ef9a9a"}}>❌ Bloquear</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditarNombre({profile,onGuardar,onCerrar}) {
  const [nombre,setNombre] = useState(profile?.nombre||"");
  const [loading,setLoading] = useState(false);
  async function guardar() {
    setLoading(true);
    await supabase.from("profiles").update({nombre}).eq("id",profile.id);
    onGuardar(nombre); setLoading(false); onCerrar();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
      <div style={{width:"100%",background:"linear-gradient(160deg,#0a1628,#0d2035)",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px"}}>
        <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>✏️ Editar nombre</div>
        <input placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F7",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,boxSizing:"border-box",fontFamily:"inherit",marginBottom:16}}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCerrar} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer"}}>Cancelar</button>
          <button onClick={guardar} disabled={loading} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>{loading?"...":"Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function Calendario({clases}) {
  const [mesOffset,setMesOffset] = useState(0);
  const [diaSeleccionado,setDiaSeleccionado] = useState(null);
  const hoy=new Date();
  const fecha=new Date(hoy.getFullYear(),hoy.getMonth()+mesOffset,1);
  const anio=fecha.getFullYear(),mes=fecha.getMonth();
  const mesStr=`${anio}-${String(mes+1).padStart(2,"0")}`;
  const nombreMes=fecha.toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  const totalDias=diasEnMes(anio,mes);
  let primerDia=new Date(anio,mes,1).getDay();
  primerDia=primerDia===0?6:primerDia-1;
  const clasesMes=clases.filter(c=>c.fecha.startsWith(mesStr));
  const porDia={};
  clasesMes.forEach(c=>{const dia=c.fecha.slice(8,10).replace(/^0/,"");if(!porDia[dia]) porDia[dia]={clases:[],total:0};porDia[dia].clases.push(c);porDia[dia].total+=c.valor;});
  const diasSelDia=diaSeleccionado?(porDia[diaSeleccionado]?.clases||[]):[];
  const totalDia=diaSeleccionado?(porDia[diaSeleccionado]?.total||0):0;
  const fechaDia=diaSeleccionado?new Date(anio,mes,parseInt(diaSeleccionado)).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long"}):"";
  const celdas=[];
  for(let i=0;i<primerDia;i++) celdas.push(null);
  for(let d=1;d<=totalDias;d++) celdas.push(d);
  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>{setMesOffset(m=>m-1);setDiaSeleccionado(null);}} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:8,color:"#4FC3F7",padding:"6px 14px",cursor:"pointer",fontSize:16}}>‹</button>
        <span style={{fontSize:15,fontWeight:"bold",color:"#fff",textTransform:"capitalize"}}>{nombreMes}</span>
        <button onClick={()=>{setMesOffset(m=>m+1);setDiaSeleccionado(null);}} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:8,color:"#4FC3F7",padding:"6px 14px",cursor:"pointer",fontSize:16}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
        {DIAS_SEMANA.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,color:"#607d8b",padding:"4px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {celdas.map((dia,i)=>{
          if(!dia) return <div key={i}/>;
          const dStr=String(dia),tiene=porDia[dStr];
          const esHoy=anio===hoy.getFullYear()&&mes===hoy.getMonth()&&dia===hoy.getDate();
          const seleccionado=diaSeleccionado===dStr;
          const tiposPresentes=tiene?[...new Set(tiene.clases.map(c=>c.tipo))]:[];
          return (
            <div key={i} onClick={()=>setDiaSeleccionado(seleccionado?null:dStr)} style={{borderRadius:10,padding:"6px 2px",textAlign:"center",cursor:tiene?"pointer":"default",background:seleccionado?"rgba(79,195,247,0.2)":esHoy?"rgba(255,140,0,0.1)":tiene?"rgba(255,255,255,0.05)":"transparent",border:seleccionado?"1px solid #4FC3F7":esHoy?"1px solid rgba(255,140,0,0.5)":"1px solid transparent"}}>
              <div style={{fontSize:13,color:seleccionado?"#4FC3F7":esHoy?"#FF8C00":tiene?"#fff":"#607d8b",fontWeight:esHoy||seleccionado?"bold":"normal"}}>{dia}</div>
              {tiene&&<div style={{display:"flex",justifyContent:"center",gap:2,marginTop:3,flexWrap:"wrap"}}>{tiposPresentes.map(t=>{const tipo=TIPOS.find(x=>x.key===t);return <div key={t} style={{width:6,height:6,borderRadius:"50%",background:tipo?.color||"#fff"}}/>;})}</div>}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:14,marginBottom:16}}>
        {TIPOS.map(t=>(<div key={t.key} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:t.color}}/><span style={{fontSize:11,color:"#90CAF9"}}>{t.label}</span></div>))}
      </div>
      {diaSeleccionado&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"#4FC3F7",marginBottom:10,textTransform:"capitalize"}}>{fechaDia}</div>
          {diasSelDia.length===0?<div style={{fontSize:13,color:"#607d8b"}}>Sin clases este día</div>:(
            <>
              {diasSelDia.map((c,i)=>{const tipo=TIPOS.find(t=>t.key===c.tipo);return(
                <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<diasSelDia.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                  <div>
                    <span style={{fontSize:13,color:tipo.color}}>{tipo.emoji} {tipo.label}</span>
                    {c.tipo==="colectiva"&&<span style={{fontSize:12,color:"#90CAF9"}}> · {c.personas} pers.{c.extras>0&&<span style={{color:"#81C784"}}> (➕{c.extras})</span>}</span>}
                    {c.horas>0&&<span style={{fontSize:11,color:"#4FC3F7"}}> · ⏱{c.horas}h</span>}
                    {c.comentario&&<div style={{fontSize:11,color:"#607d8b",marginTop:2}}>💬 {c.comentario}</div>}
                  </div>
                  <span style={{fontSize:13,color:"#fff"}}>{fmt(c.valor)}</span>
                </div>
              );})}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
                <span style={{fontSize:13,color:"#90CAF9"}}>Total del día</span>
                <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(totalDia)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PorDia({clases}) {
  const hoy=new Date();
  const [mesOffset,setMesOffset] = useState(0);
  const fecha=new Date(hoy.getFullYear(),hoy.getMonth()+mesOffset,1);
  const anio=fecha.getFullYear(),mes=fecha.getMonth();
  const mesStr=`${anio}-${String(mes+1).padStart(2,"0")}`;
  const nombreMes=fecha.toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  const clasesMes=clases.filter(c=>c.fecha.startsWith(mesStr));
  const porDia={};
  clasesMes.forEach(c=>{const dia=c.fecha.slice(0,10);if(!porDia[dia]) porDia[dia]={clases:[],total:0,horas:0};porDia[dia].clases.push(c);porDia[dia].total+=c.valor;porDia[dia].horas+=(c.horas||1);});
  const diasOrdenados=Object.keys(porDia).sort().reverse();
  const totalMes=clasesMes.reduce((s,c)=>s+c.valor,0);
  const horasMes=clasesMes.reduce((s,c)=>s+(c.horas||1),0);
  const hoyStr=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;
  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <button onClick={()=>setMesOffset(m=>m-1)} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:8,color:"#4FC3F7",padding:"6px 14px",cursor:"pointer",fontSize:16}}>‹</button>
        <span style={{fontSize:15,fontWeight:"bold",color:"#fff",textTransform:"capitalize"}}>{nombreMes}</span>
        <button onClick={()=>setMesOffset(m=>m+1)} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:8,color:"#4FC3F7",padding:"6px 14px",cursor:"pointer",fontSize:16}}>›</button>
      </div>
      {diasOrdenados.length===0?(
        <div style={{textAlign:"center",color:"#607d8b",marginTop:40,fontSize:14}}>No hay clases registradas este mes</div>
      ):diasOrdenados.map(dia=>{
        const {clases:clasesDelDia,total:totalDia,horas:horasDia}=porDia[dia];
        const esHoy=dia===hoyStr;
        const cDia={particular:0,colectiva:0,requerida:0};
        let extrasDelDia=0;
        clasesDelDia.forEach(c=>{cDia[c.tipo]++;if(c.tipo==="colectiva") extrasDelDia+=(c.extras||0);});
        const fechaLabel=new Date(dia+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
        const tieneComentarios=clasesDelDia.some(c=>c.comentario);
        return (
          <div key={dia} style={{background:esHoy?"rgba(255,140,0,0.08)":"rgba(255,255,255,0.03)",border:esHoy?"1px solid rgba(255,140,0,0.4)":"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:13,fontWeight:"bold",color:esHoy?"#FF8C00":"#4FC3F7",textTransform:"capitalize"}}>{fechaLabel}</div>
                {esHoy&&<div style={{fontSize:10,color:"#FF8C00",background:"rgba(255,140,0,0.15)",border:"1px solid rgba(255,140,0,0.4)",borderRadius:5,padding:"1px 6px"}}>hoy</div>}
              </div>
              <div style={{fontSize:14,fontWeight:"bold",color:"#fff"}}>{fmt(totalDia)}</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              {TIPOS.map(t=>cDia[t.key]>0&&(
                <div key={t.key} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:7,padding:"3px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}>
                  <span style={{color:t.color}}>{t.emoji} {t.label} ×{cDia[t.key]}</span>
                  {t.key==="colectiva"&&extrasDelDia>0&&<span style={{background:"rgba(129,199,132,0.2)",border:"1px solid #81C78455",borderRadius:5,padding:"0px 5px",fontSize:10,color:"#81C784"}}>➕{extrasDelDia}</span>}
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:esHoy?"#FF8C00":"#607d8b"}}>⏱ {horasDia}h · {clasesDelDia.length} clase{clasesDelDia.length>1?"s":""}</div>
              {tieneComentarios&&<div style={{fontSize:11,color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:6,padding:"1px 6px"}}>💬 comentario</div>}
            </div>
          </div>
        );
      })}
      {diasOrdenados.length>0&&(
        <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:14,marginTop:4}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:12,color:"#607d8b"}}>Total {nombreMes.split(" ")[0]}</span>
            <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(totalMes)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#607d8b"}}>{clasesMes.length} clases · {diasOrdenados.length} días trabajados</span>
            <span style={{fontSize:11,color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:6,padding:"2px 8px"}}>⏱ {horasMes}h</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PorMes({clases}) {
  const hoy=new Date();
  const mesesConDatos=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort();
  const mesActualStr=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  if(!mesesConDatos.includes(mesActualStr)) mesesConDatos.push(mesActualStr);
  const datosPorMes=mesesConDatos.map(m=>{
    const [anio,mes]=m.split("-").map(Number);
    const clasesMes=clases.filter(c=>c.fecha.startsWith(m));
    const total=clasesMes.reduce((s,c)=>s+c.valor,0);
    const horas=clasesMes.reduce((s,c)=>s+(c.horas||1),0);
    const conteo={particular:0,colectiva:0,requerida:0};
    clasesMes.forEach(c=>conteo[c.tipo]++);
    const totalDiasMes=diasEnMes(anio,mes-1);
    const esActual=m===mesActualStr;
    const diaActual=esActual?hoy.getDate():totalDiasMes;
    const pctDias=Math.round((diaActual/totalDiasMes)*100);
    const nombreMes=new Date(anio,mes-1,1).toLocaleDateString("es-CL",{month:"long"});
    return {m,total,horas,conteo,totalDiasMes,diaActual,pctDias,esActual,nombreMes};
  });
  const totalAcumulado=datosPorMes.reduce((s,d)=>s+d.total,0);
  const totalHoras=datosPorMes.reduce((s,d)=>s+d.horas,0);
  const mejorMes=datosPorMes.reduce((best,d)=>d.total>best.total?d:best,datosPorMes[0]);
  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:16}}>COMPARATIVA {hoy.getFullYear()}</div>
      <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:20}}>
        {datosPorMes.map((d,i)=>{
          const anterior=i>0?datosPorMes[i-1]:null;
          const diff=anterior?d.total-anterior.total:null;
          const esMejor=d.m===mejorMes?.m;
          const barColor=d.esActual?"#81C784":"rgba(79,195,247,0.4)";
          return (
            <div key={d.m}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,color:d.esActual?"#81C784":"#90CAF9",fontWeight:d.esActual?"bold":"normal",textTransform:"capitalize"}}>{d.nombreMes}</span>
                  {d.esActual&&<span style={{fontSize:10,color:"#607d8b"}}>en curso</span>}
                  {esMejor&&!d.esActual&&<span style={{fontSize:10,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"1px 6px"}}>★ mejor</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {diff!==null&&diff!==0&&<span style={{fontSize:11,borderRadius:6,padding:"1px 6px",color:diff>0?"#81C784":"#ef9a9a",background:diff>0?"rgba(129,199,132,0.1)":"rgba(239,83,80,0.1)",border:diff>0?"1px solid #81C78444":"1px solid #ef535044"}}>{diff>0?"↑":"↓"} {fmt(Math.abs(diff))}</span>}
                  <span style={{fontSize:13,fontWeight:"bold",color:"#fff"}}>{fmt(d.total)}</span>
                </div>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:4}}>
                <div style={{height:"100%",width:`${d.pctDias}%`,background:barColor,borderRadius:99}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:"#607d8b"}}>
                  {d.conteo.particular>0&&`⛷️ ${d.conteo.particular} · `}
                  {d.conteo.colectiva>0&&`👥 ${d.conteo.colectiva} · `}
                  {d.conteo.requerida>0&&`📋 ${d.conteo.requerida}`}
                </span>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{fontSize:11,color:d.esActual?"#81C784":"#607d8b"}}>{d.diaActual}/{d.totalDiasMes} días ·</span>
                  <span style={{fontSize:11,color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:6,padding:"1px 6px"}}>⏱ {d.horas}h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:12,color:"#607d8b"}}>Total acumulado {hoy.getFullYear()}</span>
          <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(totalAcumulado)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          {mejorMes&&<div style={{fontSize:11,color:"#FFB74D"}}>★ Mejor mes: {mejorMes.nombreMes} ({fmt(mejorMes.total)})</div>}
          <span style={{fontSize:11,color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:6,padding:"2px 8px"}}>⏱ {totalHoras}h totales</span>
        </div>
        <div style={{display:"flex",gap:16,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:5,background:"#81C784",borderRadius:99}}/><span style={{fontSize:11,color:"#607d8b"}}>Mes en curso</span></div>
          <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:5,background:"rgba(79,195,247,0.4)",borderRadius:99}}/><span style={{fontSize:11,color:"#607d8b"}}>Mes completo</span></div>
        </div>
      </div>
    </div>
  );
}

export default function SkiTracker() {
  const [user,setUser] = useState(null);
  const [profile,setProfile] = useState(null);
  const [loading,setLoading] = useState(true);
  const [showAdmin,setShowAdmin] = useState(false);
  const [showEditarNombre,setShowEditarNombre] = useState(false);
  const [precios,setPrecios] = useState(DEFAULT_PRECIOS);
  const [clases,setClases] = useState([]);
  const [descuentos,setDescuentos] = useState([]);
  const [personas,setPersonas] = useState(3);
  const [horasNuevaClase,setHorasNuevaClase] = useState({particular:1,colectiva:1,requerida:1});
  const [showConfig,setShowConfig] = useState(false);
  const [tempPrecios,setTempPrecios] = useState(precios);
  const [descuentoInput,setDescuentoInput] = useState("");
  const [tab,setTab] = useState("registro");
  const [subTabCal,setSubTabCal] = useState("calendario");
  const [mes,setMes] = useState(()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;});
  const [comentarios,setComentarios] = useState({});
  const [comentarioPrevio,setComentarioPrevio] = useState({particular:"",colectiva:"",requerida:""});
  const [mostrarComentarioPrevio,setMostrarComentarioPrevio] = useState({particular:false,colectiva:false,requerida:false});

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{if(session) handleAuth(session.user);else setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{if(session) handleAuth(session.user);else{setUser(null);setProfile(null);setLoading(false);}});
    return ()=>subscription.unsubscribe();
  },[]);

  async function handleAuth(u) {
    setUser(u);
    await supabase.from("sesiones").insert({user_id:u.id});
    await supabase.from("profiles").update({last_seen:new Date().toISOString()}).eq("id",u.id);
    const {data:prof}=await supabase.from("profiles").select("*").eq("id",u.id).single();
    setProfile(prof);
    if(prof?.aprobado||prof?.is_admin){
      const {data:prec}=await supabase.from("precios").select("*").eq("user_id",u.id).single();
      if(prec) setPrecios({particular:prec.particular,colectiva:prec.colectiva,colectiva_extra:prec.colectiva_extra,colectiva_base:prec.colectiva_base,requerida:prec.requerida,extra_por_hora:prec.extra_por_hora??true});
      const {data:cls}=await supabase.from("clases").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(cls){setClases(cls);const c={};cls.forEach(x=>{if(x.comentario) c[x.id]=x.comentario;});setComentarios(c);}
      const {data:desc}=await supabase.from("descuentos").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(desc) setDescuentos(desc);
    }
    setLoading(false);
  }

  async function logout(){await supabase.auth.signOut();setUser(null);setProfile(null);setClases([]);setDescuentos([]);}

  function calcularValor(tipo, horas) {
    const h = horas || 1;
    if(tipo==="particular") return precios.particular * h;
    if(tipo==="requerida") return precios.requerida * h;
    const extras = Math.max(0, personas - precios.colectiva_base);
    const extraValor = precios.extra_por_hora ? precios.colectiva_extra * extras * h : precios.colectiva_extra * extras;
    return precios.colectiva * h + extraValor;
  }

  async function agregarClase(tipo) {
    const horas = horasNuevaClase[tipo] || 1;
    const valor = calcularValor(tipo, horas);
    const extras = tipo==="colectiva" ? Math.max(0, personas - precios.colectiva_base) : 0;
    const comentario = comentarioPrevio[tipo] || "";
    const {data,error} = await supabase.from("clases").insert({user_id:user.id,tipo,valor,personas:tipo==="colectiva"?personas:0,extras,comentario:comentario||null,horas,fecha:new Date().toISOString()}).select().single();
    if(!error&&data){setClases(prev=>[...prev,data]);if(comentario.trim()) setComentarios(p=>({...p,[data.id]:comentario}));}
    setComentarioPrevio(p=>({...p,[tipo]:""}));
    setMostrarComentarioPrevio(p=>({...p,[tipo]:false}));
    setHorasNuevaClase(p=>({...p,[tipo]:1}));
  }

  async function eliminarUltimaDeTipo(tipo) {
    const ultima=[...clases].filter(c=>c.tipo===tipo&&c.fecha.startsWith(mes)).pop();
    if(!ultima) return;
    await supabase.from("clases").delete().eq("id",ultima.id);
    setClases(prev=>prev.filter(c=>c.id!==ultima.id));
  }

  async function agregarDescuento() {
    const val=parseInt(descuentoInput.replace(/\D/g,""));
    if(!val||val<=0) return;
    const {data,error}=await supabase.from("descuentos").insert({user_id:user.id,valor:val,fecha:new Date().toISOString()}).select().single();
    if(!error&&data) setDescuentos(prev=>[...prev,data]);
    setDescuentoInput("");
  }

  async function eliminarDescuento(id){await supabase.from("descuentos").delete().eq("id",id);setDescuentos(prev=>prev.filter(d=>d.id!==id));}

  async function guardarPrecios() {
    await supabase.from("precios").update({particular:tempPrecios.particular,colectiva:tempPrecios.colectiva,colectiva_extra:tempPrecios.colectiva_extra,colectiva_base:tempPrecios.colectiva_base,requerida:tempPrecios.requerida,extra_por_hora:tempPrecios.extra_por_hora}).eq("user_id",user.id);
    setPrecios({...tempPrecios}); setShowConfig(false);
  }

  if(loading) return <div style={{minHeight:"100vh",background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif",fontSize:16}}>⛷️ Cargando...</div>;
  if(!user) return <AuthScreen onAuth={handleAuth}/>;
  if(profile&&!profile.aprobado&&!profile.is_admin) return <PendienteScreen user={user} onLogout={logout}/>;
  if(showAdmin&&profile?.is_admin) return <AdminPanel onBack={()=>setShowAdmin(false)}/>;

  const base=precios.colectiva_base||3;
  const clasesMes=clases.filter(c=>c.fecha.startsWith(mes));
  const descuentosMes=descuentos.filter(d=>d.fecha.startsWith(mes));
  const totalBruto=clasesMes.reduce((s,c)=>s+c.valor,0);
  const totalDescuentos=descuentosMes.reduce((s,d)=>s+d.valor,0);
  const total=totalBruto-totalDescuentos;
  const horasPorTipo={particular:0,colectiva:0,requerida:0};
  let totalExtras=0;
  clasesMes.forEach(c=>{horasPorTipo[c.tipo]+=(c.horas||1);if(c.tipo==="colectiva") totalExtras+=(c.extras||0);});
  const totalHorasMes=Object.values(horasPorTipo).reduce((s,h)=>s+h,0);
  const mesesDisponibles=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort().reverse();
  const extrasActuales=Math.max(0,personas-base);
  const colectivaPreview=calcularValor("colectiva",horasNuevaClase.colectiva);
  const porDia={};
  clasesMes.forEach(c=>{const dia=c.fecha.slice(0,10);if(!porDia[dia]) porDia[dia]={clases:[],total:0};porDia[dia].clases.push(c);porDia[dia].total+=c.valor;});

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628 0%,#0d2035 50%,#0a1628 100%)",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{background:"linear-gradient(90deg,#0d2a3a,#1a3a50)",borderBottom:"2px solid #4FC3F7",padding:"20px 20px 0",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{cursor:"pointer"}} onClick={()=>setShowEditarNombre(true)}>
            <div style={{fontSize:10,letterSpacing:3,color:"#4FC3F7",textTransform:"uppercase"}}>⛷️ Ski Instructor</div>
            <div style={{fontSize:18,fontWeight:"bold",color:"#fff",display:"flex",alignItems:"center",gap:6}}>{profile?.nombre||profile?.email?.split("@")[0]||"Mi cuenta"}<span style={{fontSize:12,color:"#4FC3F7"}}>✏️</span></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {profile?.is_admin&&<button onClick={()=>setShowAdmin(true)} style={{background:"rgba(255,183,77,0.15)",border:"1px solid #FFB74D",borderRadius:10,color:"#FFB74D",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>👑</button>}
            <button onClick={()=>{setTempPrecios(precios);setShowConfig(true);}} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:10,color:"#4FC3F7",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>⚙️</button>
            <button onClick={logout} style={{background:"rgba(239,83,80,0.1)",border:"1px solid #ef535055",borderRadius:10,color:"#ef9a9a",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>↩</button>
          </div>
        </div>
        {tab!=="calendario"&&(
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:12,color:"#90CAF9"}}>Mes:</span>
            <select value={mes} onChange={e=>setMes(e.target.value)} style={{background:"#0d2a3a",color:"#e8f4f8",border:"1px solid #4FC3F7",borderRadius:8,padding:"4px 10px",fontSize:13}}>
              {[...new Set([mes,...mesesDisponibles])].map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}
        <div style={{display:"flex"}}>
          {[["registro","📝 Registro"],["calendario","🗓️ Calendario"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"10px 0",background:tab===key?"rgba(79,195,247,0.15)":"transparent",border:"none",borderBottom:tab===key?"2px solid #4FC3F7":"2px solid transparent",color:tab===key?"#4FC3F7":"#607d8b",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 20px 100px"}}>
        {tab!=="calendario"&&(
          <div style={{background:"linear-gradient(135deg,#0d2a3a,#1a3a50)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:18,padding:"18px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:4}}>Total estimado del mes</div>
            <div style={{fontSize:36,fontWeight:"bold",color:"#fff",letterSpacing:-1}}>{fmt(total)}</div>
            {totalDescuentos>0&&<div style={{fontSize:12,color:"#ef9a9a",marginTop:2}}>{fmt(totalBruto)} − descuentos {fmt(totalDescuentos)}</div>}
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:12}}>
              {TIPOS.map(t=>(
                <div key={t.key} style={{textAlign:"center"}}>
                  <div style={{fontSize:16}}>{t.emoji}</div>
                  <div style={{fontSize:18,fontWeight:"bold",color:t.color}}>{horasPorTipo[t.key]}h</div>
                  <div style={{fontSize:10,color:"#90CAF9"}}>{t.label}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"center",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:"#607d8b"}}>Total horas del mes</span>
              <span style={{fontSize:13,fontWeight:"bold",color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:8,padding:"3px 10px"}}>⏱ {totalHorasMes}h</span>
            </div>
          </div>
        )}

        {tab==="calendario"&&(
          <>
            <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:3,marginBottom:16}}>
              {[["calendario","🗓️ Calendario"],["pordia","📅 Por Día"],["pormes","📊 Por Mes"]].map(([key,label])=>(
                <button key={key} onClick={()=>setSubTabCal(key)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,background:subTabCal===key?"rgba(79,195,247,0.15)":"transparent",color:subTabCal===key?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
              ))}
            </div>
            {subTabCal==="calendario"&&<Calendario clases={clases}/>}
            {subTabCal==="pordia"&&<PorDia clases={clases}/>}
            {subTabCal==="pormes"&&<PorMes clases={clases}/>}
          </>
        )}

        {tab==="registro"&&(
          <>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:12}}>Registrar clase</div>

            {/* COLECTIVA */}
            <div style={{background:"#0d2a1a",border:"1px solid rgba(129,199,132,0.3)",borderRadius:14,padding:"16px",marginBottom:12}}>
              <div style={{fontSize:13,color:"#81C784",marginBottom:10,fontWeight:"bold"}}>👥 Colectiva</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Precio base (incluye {base} pers.)</span>
                <span style={{fontSize:12,color:"#81C784",fontWeight:"bold"}}>{fmt(precios.colectiva)}/h</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Personas en clase</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setPersonas(p=>Math.max(base,p-1))} style={{width:32,height:32,borderRadius:"50%",background:"rgba(129,199,132,0.2)",border:"1px solid #81C784",color:"#81C784",fontSize:18,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:22,fontWeight:"bold",color:"#fff",minWidth:24,textAlign:"center"}}>{personas}</span>
                  <button onClick={()=>setPersonas(p=>p+1)} style={{width:32,height:32,borderRadius:"50%",background:"rgba(129,199,132,0.2)",border:"1px solid #81C784",color:"#81C784",fontSize:18,cursor:"pointer"}}>+</button>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,color:extrasActuales>0?"#81C784":"#607d8b"}}>{extrasActuales>0?`${extrasActuales} extra${extrasActuales>1?"s":""} × ${fmt(precios.colectiva_extra)}${precios.extra_por_hora?"/h":""}`:`Sin extras (base = ${base} pers.)`}</span>
                <span style={{fontSize:12,color:extrasActuales>0?"#81C784":"#607d8b"}}>{extrasActuales>0?`+ ${fmt(precios.extra_por_hora?precios.colectiva_extra*extrasActuales*horasNuevaClase.colectiva:precios.colectiva_extra*extrasActuales)}`:"+$0"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"8px 10px",background:"rgba(129,199,132,0.05)",border:"1px solid rgba(129,199,132,0.15)",borderRadius:10}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>⏱ Duración</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setHorasNuevaClase(p=>({...p,colectiva:Math.max(1,p.colectiva-1)}))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(129,199,132,0.2)",border:"1px solid #81C784",color:"#81C784",fontSize:16,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:16,fontWeight:"bold",color:"#81C784",minWidth:28,textAlign:"center"}}>{horasNuevaClase.colectiva}h</span>
                  <button onClick={()=>setHorasNuevaClase(p=>({...p,colectiva:p.colectiva+1}))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(129,199,132,0.2)",border:"1px solid #81C784",color:"#81C784",fontSize:16,cursor:"pointer"}}>+</button>
                </div>
              </div>
              <div style={{borderTop:"1px solid rgba(129,199,132,0.2)",paddingTop:8,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>{fmt(precios.colectiva)} × {horasNuevaClase.colectiva}h{extrasActuales>0?` + extras`:""}</span>
                  <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(colectivaPreview)}</span>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <button onClick={()=>setMostrarComentarioPrevio(p=>({...p,colectiva:!p.colectiva}))} style={{background:"none",border:"none",color:mostrarComentarioPrevio.colectiva?"#81C784":"#607d8b",fontSize:12,cursor:"pointer",padding:0}}>{mostrarComentarioPrevio.colectiva?"✏️ Ocultar comentario":"✏️ Agregar comentario"}</button>
                {mostrarComentarioPrevio.colectiva&&<textarea placeholder="Escribe un comentario..." value={comentarioPrevio.colectiva} onChange={e=>setComentarioPrevio(p=>({...p,colectiva:e.target.value}))} rows={2} style={{width:"100%",marginTop:6,background:"#0a1e0a",border:"1px solid #81C78455",borderRadius:8,color:"#e8f4f8",padding:"8px",fontSize:13,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>}
              </div>
              <button onClick={()=>agregarClase("colectiva")} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#2e7d32,#388e3c)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",marginBottom:8}}>+ Agregar Clase Colectiva</button>
              <button onClick={()=>eliminarUltimaDeTipo("colectiva")} style={{width:"100%",padding:"9px",background:"rgba(239,83,80,0.08)",border:"1px solid #ef535066",borderRadius:10,color:"#ef9a9a",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>↩ Deshacer última colectiva</button>
            </div>

            {/* PARTICULAR Y REQUERIDA */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {TIPOS.filter(t=>t.key!=="colectiva").map(t=>(
                <div key={t.key} style={{background:`linear-gradient(135deg,${t.bg},#1a2a35)`,border:`1px solid ${t.color}55`,borderRadius:14,padding:"16px 12px"}}>
                  <div style={{textAlign:"center",marginBottom:10}}>
                    <div style={{fontSize:26,marginBottom:4}}>{t.emoji}</div>
                    <div style={{fontSize:14,fontWeight:"bold",color:t.color}}>{t.label}</div>
                    <div style={{fontSize:11,color:"#90CAF9",marginTop:2}}>{fmt(precios[t.key])}/h</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"6px 8px",background:`rgba(${t.key==="particular"?"79,195,247":"255,183,77"},0.05)`,border:`1px solid rgba(${t.key==="particular"?"79,195,247":"255,183,77"},0.15)`,borderRadius:8}}>
                    <span style={{fontSize:11,color:"#607d8b"}}>⏱</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>setHorasNuevaClase(p=>({...p,[t.key]:Math.max(1,p[t.key]-1)}))} style={{background:"none",border:"none",color:t.color,fontSize:16,cursor:"pointer",padding:"0 4px"}}>−</button>
                      <span style={{fontSize:13,fontWeight:"bold",color:t.color,minWidth:24,textAlign:"center"}}>{horasNuevaClase[t.key]}h</span>
                      <button onClick={()=>setHorasNuevaClase(p=>({...p,[t.key]:p[t.key]+1}))} style={{background:"none",border:"none",color:t.color,fontSize:16,cursor:"pointer",padding:"0 4px"}}>+</button>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#607d8b",textAlign:"center",marginBottom:8}}>{fmt(precios[t.key])} × {horasNuevaClase[t.key]}h = <strong style={{color:t.color}}>{fmt(precios[t.key]*horasNuevaClase[t.key])}</strong></div>
                  <div style={{marginBottom:6}}>
                    <button onClick={()=>setMostrarComentarioPrevio(p=>({...p,[t.key]:!p[t.key]}))} style={{background:"none",border:"none",color:mostrarComentarioPrevio[t.key]?t.color:"#607d8b",fontSize:11,cursor:"pointer",padding:0,width:"100%"}}>{mostrarComentarioPrevio[t.key]?"✏️ Ocultar":"✏️ Comentario"}</button>
                    {mostrarComentarioPrevio[t.key]&&<textarea placeholder="Comentario..." value={comentarioPrevio[t.key]} onChange={e=>setComentarioPrevio(p=>({...p,[t.key]:e.target.value}))} rows={2} style={{width:"100%",marginTop:4,background:"rgba(0,0,0,0.3)",border:`1px solid ${t.color}44`,borderRadius:8,color:"#e8f4f8",padding:"6px 8px",fontSize:12,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>}
                  </div>
                  <button onClick={()=>agregarClase(t.key)} style={{width:"100%",padding:"10px",background:t.bg,border:`1px solid ${t.color}88`,borderRadius:10,color:t.color,fontSize:13,fontWeight:"bold",cursor:"pointer",marginBottom:6}}>+ Agregar</button>
                  <button onClick={()=>eliminarUltimaDeTipo(t.key)} style={{width:"100%",padding:"7px",background:"rgba(239,83,80,0.08)",border:"1px solid #ef535066",borderRadius:8,color:"#ef9a9a",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>↩ Deshacer</button>
                </div>
              ))}
            </div>

            {/* DESCUENTOS */}
            <div style={{background:"linear-gradient(135deg,#2a0d0d,#1a1020)",border:"1px solid rgba(239,83,80,0.3)",borderRadius:18,padding:"16px"}}>
              <div style={{fontSize:11,color:"#ef9a9a",letterSpacing:1,marginBottom:10}}>🍽️ DESCUENTOS COMIDA</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:"#1a0a0a",border:"1px solid #ef535055",borderRadius:10,padding:"8px 12px"}}>
                  <span style={{color:"#ef9a9a"}}>$</span>
                  <input type="number" placeholder="Monto a descontar" value={descuentoInput} onChange={e=>setDescuentoInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarDescuento()} style={{flex:1,background:"none",border:"none",color:"#fff",fontSize:15,outline:"none"}}/>
                </div>
                <button onClick={agregarDescuento} style={{background:"rgba(239,83,80,0.2)",border:"1px solid #ef5350",borderRadius:10,color:"#ef9a9a",fontSize:22,padding:"0 16px",cursor:"pointer"}}>−</button>
              </div>
              {descuentosMes.length===0?<div style={{fontSize:12,color:"#607d8b",textAlign:"center",padding:"6px 0"}}>Sin descuentos este mes</div>:(
                <div>
                  {descuentosMes.map(d=>(
                    <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <div><div style={{fontSize:14,color:"#ef9a9a",fontWeight:"bold"}}>− {fmt(d.valor)}</div><div style={{fontSize:11,color:"#607d8b"}}>{new Date(d.fecha).toLocaleDateString("es-CL")}</div></div>
                      <button onClick={()=>eliminarDescuento(d.id)} style={{background:"none",border:"none",color:"#607d8b",fontSize:18,cursor:"pointer"}}>✕</button>
                    </div>
                  ))}
                  <div style={{marginTop:8,textAlign:"right",fontSize:13,color:"#ef9a9a"}}>Total: {fmt(totalDescuentos)}</div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL PRECIOS */}
      {showConfig&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:100}}>
          <div style={{width:"100%",background:"linear-gradient(160deg,#0a1628,#0d2035)",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>⚙️ Configurar Precios</div>
            {[
              {key:"particular",label:"Clase Particular",emoji:"⛷️",unit:"/h"},
              {key:"colectiva",label:"Clase Colectiva (precio base)",emoji:"👥",unit:"/h"},
              {key:"colectiva_base",label:"Personas incluidas sin extra",emoji:"👤",desc:"A partir de esta cantidad se cobra adicional",unit2:"pers."},
              {key:"colectiva_extra",label:"Adicional por persona extra",emoji:"➕"},
              {key:"requerida",label:"Clase Requerida",emoji:"📋",unit:"/h"},
            ].map(({key,label,emoji,desc,unit,unit2})=>(
              <div key={key} style={{marginBottom:18}}>
                <label style={{fontSize:12,color:"#90CAF9",display:"block",marginBottom:2}}>{emoji} {label}</label>
                {desc&&<div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>{desc}</div>}
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {!unit2&&<span style={{color:"#4FC3F7"}}>$</span>}
                  <input type="number" value={tempPrecios[key]??0} onChange={e=>setTempPrecios(p=>({...p,[key]:Number(e.target.value)}))} style={{flex:1,background:"#0d2a3a",border:"1px solid #4FC3F7",borderRadius:10,color:"#fff",padding:"10px 14px",fontSize:16}}/>
                  {unit&&<span style={{color:"#607d8b",fontSize:12}}>{unit}</span>}
                  {unit2&&<span style={{color:"#90CAF9",fontSize:13}}>{unit2}</span>}
                </div>
                {key==="colectiva_extra"&&(
                  <div style={{marginTop:10}}>
                    <Toggle
                      value={tempPrecios.extra_por_hora??true}
                      onChange={v=>setTempPrecios(p=>({...p,extra_por_hora:v}))}
                      label="⏱ Multiplicar por horas"
                      desc="El extra se cobra por cada hora de clase"
                    />
                    <div style={{fontSize:11,color:tempPrecios.extra_por_hora?"#81C784":"#607d8b",textAlign:"center",marginTop:6}}>
                      {tempPrecios.extra_por_hora
                        ?`Ej: 2 extras × ${fmt(tempPrecios.colectiva_extra)} × 2h = ${fmt(tempPrecios.colectiva_extra*2*2)}`
                        :`Ej: 2 extras × ${fmt(tempPrecios.colectiva_extra)} = ${fmt(tempPrecios.colectiva_extra*2)} (fijo)`}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div style={{display:"flex",gap:12,marginTop:10}}>
              <button onClick={()=>setShowConfig(false)} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer"}}>Cancelar</button>
              <button onClick={guardarPrecios} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showEditarNombre&&<EditarNombre profile={profile} onGuardar={(n)=>setProfile(p=>({...p,nombre:n}))} onCerrar={()=>setShowEditarNombre(false)}/>}
    </div>
  );
}
