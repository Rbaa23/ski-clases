import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eoppuoiaxnfaihpyovsy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvcHB1b2lheG5mYWlocHlvdnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNTkwNjIsImV4cCI6MjA5NTkzNTA2Mn0.YfbzhlfNwf9wvCk0iO-8II7RIABEzyWqitHhHi7Q-eo";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_PRECIOS = { particular:24000, colectiva:27000, colectiva_extra:1000, colectiva_base:3, requerida:27000, extra_por_hora:true, mostrar_monto:true };
const TIPOS = [
  { key:"particular", label:"Particular", color:"#4FC3F7", bg:"#0d2a3a" },
  { key:"colectiva",  label:"Colectiva",  color:"#81C784", bg:"#0d2a1a" },
  { key:"requerida",  label:"Requerida",  color:"#FFB74D", bg:"#2a1d0d" },
];
const DIAS_SEMANA = ["L","M","M","J","V","S","D"];

function fmt(n){ return "$"+Math.round(n).toLocaleString("es-CL"); }
function diasEnMes(anio,mes){ return new Date(anio,mes+1,0).getDate(); }
function tipoEmoji(tipo, disc, claseDisc){ const d=claseDisc||disc; return tipo==="particular"?(d==="snow"?"🏂":d==="poli"?"🎿":"⛷️"):tipo==="colectiva"?"👥":"📋"; }
function timeAgo(dateStr) {
  if(!dateStr) return "nunca";
  const diff=(Date.now()-new Date(dateStr).getTime())/1000;
  if(diff<60) return "hace un momento";
  if(diff<3600) return `hace ${Math.floor(diff/60)} min`;
  if(diff<86400) return `hace ${Math.floor(diff/3600)}h`;
  if(diff<172800) return "ayer "+new Date(dateStr).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
  return new Date(dateStr).toLocaleDateString("es-CL");
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div onClick={()=>onChange(!value)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:value?"rgba(129,199,132,0.08)":"rgba(255,255,255,0.03)",border:value?"1px solid rgba(129,199,132,0.25)":"1px solid rgba(255,255,255,0.08)",borderRadius:10,cursor:"pointer"}}>
      <div>
        <div style={{fontSize:12,color:value?"#81C784":"#607d8b",fontWeight:500}}>{label}</div>
        {desc&&<div style={{fontSize:11,color:"#607d8b",marginTop:2}}>{desc}</div>}
      </div>
      <div style={{width:44,height:24,background:value?"#81C784":"rgba(255,255,255,0.1)",borderRadius:12,position:"relative",flexShrink:0,marginLeft:12}}>
        <div style={{width:18,height:18,background:value?"#fff":"#607d8b",borderRadius:"50%",position:"absolute",top:3,left:value?"auto":3,right:value?3:"auto"}}/>
      </div>
    </div>
  );
}

function Avatar({ url, nombre, email, color="#4FC3F7", bg="rgba(79,195,247,0.15)", size=36 }) {
  const text = (nombre||email||"?").slice(0,2).toUpperCase();
  if(url) return <img src={url} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,border:"2px solid #4FC3F744"}} alt={text}/>;
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:500,color,flexShrink:0}}>{text}</div>;
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
  const [showInfo, setShowInfo] = useState(false);

  async function handleSubmit() {
    setError(""); setMsg(""); setLoading(true);
    if(mode==="login") {
      const {data,error}=await supabase.auth.signInWithPassword({email,password:pass});
      if(error) setError(error.message); else onAuth(data.user);
    } else {
      const {error}=await supabase.auth.signUp({email,password:pass,options:{data:{nombre}}});
      if(error) setError(error.message);
      else { setMsg("Cuenta creada. Revisa tu email. Un administrador debe aprobar tu acceso."); setMode("login"); }
    }
    setLoading(false);
  }

  async function handleRecuperar() {
    setError(""); setLoading(true);
    const {error}=await supabase.auth.resetPasswordForEmail(emailRecuperar,{redirectTo:"https://ski-clases.vercel.app"});
    if(error) setError(error.message); else setEnviado(true);
    setLoading(false);
  }

  if(recuperar) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      {enviado?(
        <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>📬</div>
          <div style={{fontSize:20,fontWeight:"bold",marginBottom:8}}>Email enviado</div>
          <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.6,marginBottom:24}}>Revisa tu bandeja de entrada y haz clic en el enlace.</div>
          <div style={{background:"rgba(79,195,247,0.08)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#4FC3F7"}}>{emailRecuperar}</div>
          <button onClick={()=>{setRecuperar(false);setEnviado(false);setEmailRecuperar("");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>← Volver</button>
        </div>
      ):(
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:40,marginBottom:8}}>🔑</div>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:6}}>Recuperar contraseña</div>
            <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.5}}>Te enviaremos un enlace para restablecer tu clave.</div>
          </div>
          <input placeholder="Tu email" value={emailRecuperar} onChange={e=>setEmailRecuperar(e.target.value)} type="email" style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"13px 16px",fontSize:14,marginBottom:16,boxSizing:"border-box",fontFamily:"inherit"}}/>
          {error&&<div style={{color:"#ef9a9a",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}
          <button onClick={handleRecuperar} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>{loading?"...":"Enviar enlace"}</button>
          <button onClick={()=>{setRecuperar(false);setError("");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>← Volver</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8",position:"relative"}}>
      <div style={{position:"absolute",top:40,right:24}}>
        <button onClick={()=>setShowInfo(true)} style={{background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:20,padding:"6px 14px",display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#4FC3F7",cursor:"pointer",fontWeight:"bold",fontFamily:"inherit"}}>¿Qué es StatClass?</button>
      </div>
      <img src="/logo.png" alt="StatClass" style={{width:80,height:80,marginBottom:8,objectFit:"contain"}}/>
      <div style={{fontSize:24,fontWeight:"bold",marginBottom:4}}>StatClass</div>
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
        {mode==="login"&&<div style={{textAlign:"right",marginBottom:16}}><span onClick={()=>{setRecuperar(true);setError("");}} style={{fontSize:12,color:"#4FC3F7",cursor:"pointer",textDecoration:"underline"}}>¿Olvidaste tu contraseña?</span></div>}
        {error&&<div style={{color:"#ef9a9a",fontSize:13,marginBottom:12,textAlign:"center"}}>{error}</div>}
        {msg&&<div style={{color:"#81C784",fontSize:13,marginBottom:12,textAlign:"center"}}>{msg}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"15px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:16,fontWeight:"bold",cursor:"pointer"}}>{loading?"...":mode==="login"?"Entrar":"Crear cuenta"}</button>
      </div>

      {showInfo&&(
        <div onClick={()=>setShowInfo(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"linear-gradient(160deg,#0a1628,#0d2035)",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:16,color:"#4FC3F7"}}>❓ ¿Qué es StatClass?</div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:16}}>
              StatClass es una herramienta de registro y estadísticas para instructores de ski y snowboard.
            </div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:12}}>✅ <strong style={{color:"#4FC3F7"}}>Registro de clases</strong> — Agrega clases particulares, colectivas y requeridas</div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:12}}>✅ <strong style={{color:"#4FC3F7"}}>Modo polivalente</strong> — Clasifica tus clases entre Ski y Snowboard</div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:12}}>✅ <strong style={{color:"#4FC3F7"}}>Estadísticas</strong> — Calendario, resumen por día, mes y disciplina</div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:12}}>✅ <strong style={{color:"#4FC3F7"}}>Control de ingresos</strong> — Lleva la cuenta de tus ganancias, descuentos y gastos</div>
            <div style={{fontSize:13,color:"#e8f4f8",lineHeight:1.7,marginBottom:16}}>✅ <strong style={{color:"#4FC3F7"}}>Multiusuario</strong> — Cada instructor tiene su propio registro y configuración de precios</div>
            <div style={{background:"rgba(79,195,247,0.06)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>💡 Creado por un instructor para instructores.</div>
              <div style={{fontSize:11,color:"#607d8b"}}>StatClass v1.0</div>
            </div>
            <button onClick={()=>setShowInfo(false)} style={{width:"100%",padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>Entendido</button>
          </div>
        </div>
      )}
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
    </div>
  );
}

function EditarPerfil({profile, onGuardar, onCerrar}) {
  const [nombre, setNombre] = useState(profile?.nombre||"");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url||"");
  const fileRef = useRef();

  async function uploadAvatar(file) {
    setUploading(true);
    const ext=file.name.split(".").pop();
    const path=`${profile.id}/avatar.${ext}`;
    const {error}=await supabase.storage.from("avatars").upload(path,file,{upsert:true});
    if(!error){
      const {data}=supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl+"?t="+Date.now());
    }
    setUploading(false);
  }

  async function guardar() {
    setLoading(true);
    await supabase.from("profiles").update({nombre,avatar_url:avatarUrl||null}).eq("id",profile.id);
    onGuardar({nombre,avatar_url:avatarUrl});
    setLoading(false);
    onCerrar();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
      <div style={{width:"100%",background:"linear-gradient(160deg,#0a1628,#0d2035)",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px"}}>
        <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>✏️ Editar perfil</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:20}}>
          <div style={{position:"relative",marginBottom:12}}>
            <Avatar url={avatarUrl} nombre={nombre} email={profile?.email} size={80}/>
            <div onClick={()=>fileRef.current.click()} style={{width:26,height:26,borderRadius:"50%",background:"#4FC3F7",border:"2px solid #0d2035",position:"absolute",bottom:2,right:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,cursor:"pointer"}}>✏️</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files[0]&&uploadAvatar(e.target.files[0])}/>
          <button onClick={()=>fileRef.current.click()} disabled={uploading} style={{padding:"8px 20px",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F7",borderRadius:10,color:"#4FC3F7",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{uploading?"Subiendo...":"📷 Cambiar foto"}</button>
        </div>
        <input placeholder="Tu nombre" value={nombre} onChange={e=>setNombre(e.target.value)} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F7",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:16,boxSizing:"border-box",fontFamily:"inherit",marginBottom:16}}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCerrar} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer"}}>Cancelar</button>
          <button onClick={guardar} disabled={loading||uploading} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>{loading?"...":"Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({onBack}) {
  const [subTab, setSubTab] = useState("usuarios");
  const [catTab, setCatTab] = useState("pendientes");
  const [usuarios, setUsuarios] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selUsuario, setSelUsuario] = useState("");
  const [selMes, setSelMes] = useState("");
  const [statsUsuario, setStatsUsuario] = useState("todos");

  useEffect(()=>{ cargar(); },[]);

  async function cargar() {
    const {data:perfiles}=await supabase.from("profiles").select("*").order("created_at",{ascending:false});
    const {data:ses}=await supabase.from("sesiones").select("*");
    const {data:cls}=await supabase.from("clases").select("*").order("fecha",{ascending:false});
    setUsuarios(perfiles||[]);
    setSesiones(ses||[]);
    setClases(cls||[]);
    const ahora=new Date();
    setSelMes(`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`);
    if(perfiles&&perfiles.length>0) setSelUsuario(perfiles.find(u=>!u.is_admin)?.id||perfiles[0].id);
    setLoading(false);
  }

  async function cambiarEstado(id, aprobado) {
    await supabase.from("profiles").update({aprobado}).eq("id",id);
    setUsuarios(prev=>prev.map(u=>u.id===id?{...u,aprobado}:u));
  }

  if(loading) return <div style={{minHeight:"100vh",background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif"}}>Cargando...</div>;

  const ahora=new Date();
  const mesActual=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
  const pendientes=usuarios.filter(u=>!u.aprobado&&!u.is_admin);
  const aprobados=usuarios.filter(u=>u.aprobado);

  const clasesFiltradas=clases.filter(c=>c.user_id===selUsuario&&c.fecha.startsWith(selMes));
  const totalHist=clasesFiltradas.reduce((s,c)=>s+c.valor,0);
  const horasHist=clasesFiltradas.reduce((s,c)=>s+(c.horas||1),0);
  const porDiaHist={};
  clasesFiltradas.forEach(c=>{const d=c.fecha.slice(0,10);if(!porDiaHist[d]) porDiaHist[d]={clases:[],total:0,horas:0};porDiaHist[d].clases.push(c);porDiaHist[d].total+=c.valor;porDiaHist[d].horas+=(c.horas||1);});
  const diasHist=Object.keys(porDiaHist).sort().reverse();
  const mesesDisp=[...new Set(clases.filter(c=>c.user_id===selUsuario).map(c=>c.fecha.slice(0,7)))].sort().reverse();
  const hoyStr=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}-${String(ahora.getDate()).padStart(2,"0")}`;

  const clasesStats=statsUsuario==="todos"?clases:clases.filter(c=>c.user_id===statsUsuario);
  const totalClases=clasesStats.length;
  const totalHorasStats=clasesStats.reduce((s,c)=>s+(c.horas||1),0);
  const totalGanado=clasesStats.reduce((s,c)=>s+c.valor,0);
  const accesosStat=statsUsuario==="todos"?sesiones.length:sesiones.filter(s=>s.user_id===statsUsuario).length;
  const conteoTipos={particular:0,colectiva:0,requerida:0};
  clasesStats.forEach(c=>conteoTipos[c.tipo]++);
  const mesesStats=[...new Set(clasesStats.map(c=>c.fecha.slice(0,7)))];
  const mejorMesStats=mesesStats.map(m=>{
    const t=clasesStats.filter(c=>c.fecha.startsWith(m)).reduce((s,c)=>s+c.valor,0);
    const nom=new Date(m+"-01").toLocaleDateString("es-CL",{month:"long",year:"numeric"});
    return {m,t,nom};
  }).sort((a,b)=>b.t-a.t)[0];

  function UserRow({u, showActions=false}) {
    const totalAccesos=sesiones.filter(s=>s.user_id===u.id).length;
    const accesosMes=sesiones.filter(s=>s.user_id===u.id&&s.fecha.startsWith(mesActual)).length;
    const ultimaSesion=sesiones.filter(s=>s.user_id===u.id).sort((a,b)=>new Date(b.fecha)-new Date(a.fecha))[0];
    const activo=ultimaSesion&&(Date.now()-new Date(ultimaSesion.fecha).getTime())<300000;
    return (
      <div style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showActions?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{position:"relative"}}>
              <Avatar url={u.avatar_url} nombre={u.nombre} email={u.email} color={u.is_admin?"#FFB74D":"#4FC3F7"} bg={u.is_admin?"rgba(255,183,77,0.15)":"rgba(79,195,247,0.15)"} size={36}/>
              <div style={{width:10,height:10,borderRadius:"50%",background:activo?"#4CAF50":"#ef5350",border:"2px solid #0d2035",position:"absolute",bottom:0,right:0}}/>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>{u.nombre||"Sin nombre"}</div>
              <div style={{fontSize:11,color:"#607d8b"}}>{u.email}</div>
              <div style={{fontSize:11,color:activo?"#4CAF50":"#ef9a9a"}}>{activo?"● Activo ahora":"✕ "+timeAgo(ultimaSesion?.fecha)}</div>
              <div style={{fontSize:11,color:"#607d8b"}}>📲 {totalAccesos} accesos · {accesosMes} este mes</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {u.is_admin&&<span style={{fontSize:10,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"2px 7px"}}>👑 Admin</span>}
            {!u.is_admin&&<span style={{fontSize:10,borderRadius:6,padding:"2px 7px",color:u.aprobado?"#81C784":"#FFB74D",background:u.aprobado?"rgba(129,199,132,0.1)":"rgba(255,183,77,0.1)",border:u.aprobado?"1px solid #81C78444":"1px solid #FFB74D44"}}>{u.aprobado?"✅ Aprobado":"⏳ Pendiente"}</span>}
          </div>
        </div>
        {!u.is_admin&&(
          <button onClick={()=>cambiarEstado(u.id,!u.aprobado)} style={{padding:"5px 9px",borderRadius:7,fontSize:11,cursor:"pointer",background:u.aprobado?"rgba(239,83,80,0.08)":"rgba(129,199,132,0.15)",border:u.aprobado?"1px solid #ef535055":"1px solid #81C784",color:u.aprobado?"#ef9a9a":"#81C784",fontFamily:"inherit",marginTop:6}}>{u.aprobado?"❌ Bloquear":"✅ Activar"}</button>
        )}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628,#0d2035)",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{background:"linear-gradient(90deg,#0d2a3a,#1a3a50)",borderBottom:"2px solid #4FC3F7",padding:"20px 20px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:20,cursor:"pointer"}}>←</button>
          <div>
            <div style={{fontSize:10,letterSpacing:3,color:"#4FC3F7"}}>PANEL ADMIN</div>
            <div style={{fontSize:18,fontWeight:"bold"}}>Gestión de usuarios</div>
          </div>
        </div>
        <div style={{display:"flex"}}>
          {[["usuarios","👥 Usuarios"],["historial","📋 Historial"],["stats","📊 Estadísticas"]].map(([key,label])=>(
            <button key={key} onClick={()=>setSubTab(key)} style={{flex:1,padding:"10px 0",border:"none",borderBottom:subTab===key?"2px solid #4FC3F7":"2px solid transparent",background:subTab===key?"rgba(79,195,247,0.1)":"transparent",color:subTab===key?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"16px 16px 80px"}}>
        {subTab==="usuarios"&&(
          <>
            <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:3,marginBottom:16,gap:3}}>
              {[
                ["pendientes",`⏳ Pendientes${pendientes.length>0?` (${pendientes.length})`:""}`,pendientes.length>0?"#FFB74D":"#607d8b"],
                ["aprobados","✅ Aprobados","#81C784"],
                ["bloqueados","❌ Bloqueados","#ef9a9a"],
              ].map(([key,label,col])=>(
                <button key={key} onClick={()=>setCatTab(key)} style={{flex:1,padding:"8px 4px",border:"none",borderRadius:8,background:catTab===key?"rgba(79,195,247,0.15)":"transparent",color:catTab===key?"#4FC3F7":col,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:catTab===key?500:400}}>{label}</button>
              ))}
            </div>

          {catTab==="pendientes"&&(
            pendientes.length===0?(
              <div style={{textAlign:"center",padding:"40px 20px",color:"#607d8b"}}><div style={{fontSize:36,marginBottom:8}}>🎉</div><div style={{fontSize:14}}>Sin usuarios pendientes</div></div>
            ):(
              <div style={{background:"rgba(255,183,77,0.03)",border:"1px solid rgba(255,183,77,0.2)",borderRadius:12,overflow:"hidden"}}>
                  {pendientes.map(u=><UserRow key={u.id} u={u}/>)}
                </div>
              )
            )}

            {catTab==="aprobados"&&(
              aprobados.length===0?(
                <div style={{textAlign:"center",padding:"40px 20px",color:"#607d8b"}}><div style={{fontSize:14}}>Sin usuarios aprobados</div></div>
              ):(
                <div style={{background:"rgba(129,199,132,0.03)",border:"1px solid rgba(129,199,132,0.15)",borderRadius:12,overflow:"hidden"}}>
                  {aprobados.map(u=><UserRow key={u.id} u={u}/>)}
                </div>
              )
            )}

            {catTab==="bloqueados"&&(
              usuarios.filter(u=>!u.aprobado&&!u.is_admin).length===0?(
                <div style={{textAlign:"center",padding:"40px 20px",color:"#607d8b"}}><div style={{fontSize:36,marginBottom:8}}>✅</div><div style={{fontSize:14}}>Sin usuarios bloqueados</div></div>
              ):(
                <div style={{background:"rgba(239,83,80,0.03)",border:"1px solid rgba(239,83,80,0.15)",borderRadius:12,overflow:"hidden"}}>
                  {usuarios.filter(u=>!u.aprobado&&!u.is_admin).map(u=>(
                    <div key={u.id} style={{padding:"12px 14px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Avatar url={u.avatar_url} nombre={u.nombre} email={u.email} color="#ef9a9a" bg="rgba(239,83,80,0.1)" size={36}/>
                        <div><div style={{fontSize:13,fontWeight:500}}>{u.nombre||"Sin nombre"}</div><div style={{fontSize:11,color:"#607d8b"}}>{u.email}</div></div>
                      </div>
                      <button onClick={()=>cambiarEstado(u.id,true)} style={{padding:"7px 12px",borderRadius:8,fontSize:12,cursor:"pointer",background:"rgba(129,199,132,0.1)",border:"1px solid #81C784",color:"#81C784",fontFamily:"inherit"}}>✅ Aprobar</button>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {subTab==="historial"&&(
          <>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <select value={selUsuario} onChange={e=>setSelUsuario(e.target.value)} style={{flex:1,fontSize:13,padding:"8px 10px",borderRadius:8,background:"#0d2a3a",border:"1px solid #4FC3F744",color:"#e8f4f8"}}>
                {usuarios.filter(u=>u.aprobado||u.is_admin).map(u=><option key={u.id} value={u.id}>{u.nombre||u.email}</option>)}
              </select>
              <select value={selMes} onChange={e=>setSelMes(e.target.value)} style={{fontSize:13,padding:"8px 10px",borderRadius:8,background:"#0d2a3a",border:"1px solid #4FC3F744",color:"#e8f4f8"}}>
                {[...new Set([selMes,...mesesDisp])].map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div style={{background:"linear-gradient(135deg,#0d2a3a,#1a3a50)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:16,padding:"16px",marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:10,letterSpacing:2,color:"#4FC3F7",marginBottom:4}}>TOTAL {selMes}</div>
              <div style={{fontSize:32,fontWeight:"bold",marginBottom:12}}>{fmt(totalHist)}</div>
              <div style={{display:"flex",justifyContent:"center",gap:20}}>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:"bold",color:"#4FC3F7"}}>{clasesFiltradas.length}</div><div style={{fontSize:11,color:"#607d8b"}}>Clases</div></div>
                <div style={{width:1,background:"rgba(255,255,255,0.1)"}}/>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:"bold",color:"#81C784"}}>{horasHist}h</div><div style={{fontSize:11,color:"#607d8b"}}>Horas</div></div>
                <div style={{width:1,background:"rgba(255,255,255,0.1)"}}/>
                <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:"bold",color:"#FFB74D"}}>{diasHist.length}</div><div style={{fontSize:11,color:"#607d8b"}}>Días</div></div>
              </div>
            </div>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:10}}>DÍAS TRABAJADOS</div>
            {diasHist.length===0?(
              <div style={{textAlign:"center",padding:"30px",color:"#607d8b",fontSize:13}}>Sin clases este mes</div>
            ):diasHist.map(dia=>{
              const {clases:cd,total:td,horas:hd}=porDiaHist[dia];
              const esHoy=dia===hoyStr;
              const cDia={particular:0,colectiva:0,requerida:0};
              let extras=0;
              cd.forEach(c=>{cDia[c.tipo]++;if(c.tipo==="colectiva") extras+=(c.extras||0);});
              const fechaLabel=new Date(dia+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
              return (
                <div key={dia} style={{background:esHoy?"rgba(255,140,0,0.08)":"rgba(255,255,255,0.03)",border:esHoy?"1px solid rgba(255,140,0,0.4)":"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{fontSize:13,fontWeight:"bold",color:esHoy?"#FF8C00":"#4FC3F7",textTransform:"capitalize"}}>{fechaLabel}</div>
                      {esHoy&&<div style={{fontSize:10,color:"#FF8C00",background:"rgba(255,140,0,0.15)",border:"1px solid rgba(255,140,0,0.4)",borderRadius:5,padding:"1px 6px"}}>hoy</div>}
                    </div>
                    <div style={{fontSize:13,fontWeight:"bold"}}>{fmt(td)}</div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>
                    {TIPOS.map(t=>cDia[t.key]>0&&(
                      <span key={t.key} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:6,padding:"2px 8px",fontSize:11,color:t.color}}>{tipoEmoji(t.key,"ski")} ×{cDia[t.key]}{t.key==="colectiva"&&extras>0&&<span style={{color:"#81C784"}}> ➕{extras}</span>}</span>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:esHoy?"#FF8C00":"#607d8b"}}>⏱ {hd}h</div>
                </div>
              );
            })}
          </>
        )}

        {subTab==="stats"&&(
          <>
            <select value={statsUsuario} onChange={e=>setStatsUsuario(e.target.value)} style={{width:"100%",fontSize:13,padding:"9px 12px",borderRadius:8,background:"#0d2a3a",border:"1px solid #4FC3F744",color:"#e8f4f8",marginBottom:16}}>
              <option value="todos">Todos los usuarios</option>
              {usuarios.filter(u=>u.aprobado||u.is_admin).map(u=><option key={u.id} value={u.id}>{u.nombre||u.email}</option>)}
            </select>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[{label:"Clases totales",value:totalClases,color:"#fff"},{label:"Horas de clases",value:`${totalHorasStats}h`,color:"#4FC3F7"},{label:"Total ganado",value:fmt(totalGanado),color:"#81C784"},{label:"Accesos app",value:`${accesosStat}`,color:"#FFB74D"}].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:"bold",color:s.color}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#607d8b",marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:10}}>DISTRIBUCIÓN DE CLASES</div>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"14px",marginBottom:16}}>
              {TIPOS.map(t=>{
                const pct=totalClases>0?Math.round(conteoTipos[t.key]/totalClases*100):0;
                return (
                  <div key={t.key} style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{color:t.color}}>{tipoEmoji(t.key,"ski")} {t.label}</span>
                      <span style={{fontWeight:500}}>{conteoTipos[t.key]} · {pct}%</span>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:t.color,borderRadius:99}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            {mejorMesStats&&(
              <>
                <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:10}}>MEJOR MES</div>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontSize:14,fontWeight:500,textTransform:"capitalize"}}>{mejorMesStats.nom}</div><div style={{fontSize:11,color:"#607d8b"}}>{clasesStats.filter(c=>c.fecha.startsWith(mejorMesStats.m)).length} clases</div></div>
                  <div style={{fontSize:16,fontWeight:"bold",color:"#FFB74D"}}>{fmt(mejorMesStats.t)} ★</div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Calendario({clases, disc}) {
  const [mesOffset,setMesOffset]=useState(0);
  const [diaSeleccionado,setDiaSeleccionado]=useState(null);
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>{DIAS_SEMANA.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:11,color:"#607d8b",padding:"4px 0"}}>{d}</div>)}</div>
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
      <div style={{display:"flex",gap:12,marginTop:14,marginBottom:16}}>{TIPOS.map(t=>(<div key={t.key} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:t.color}}/><span style={{fontSize:11,color:"#90CAF9"}}>{t.label}</span></div>))}</div>
      {diaSeleccionado&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"#4FC3F7",marginBottom:10,textTransform:"capitalize"}}>{fechaDia}</div>
          {diasSelDia.length===0?<div style={{fontSize:13,color:"#607d8b"}}>Sin clases este día</div>:(
            <>{diasSelDia.map((c,i)=>{const tipo=TIPOS.find(t=>t.key===c.tipo);return(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<diasSelDia.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                <div><span style={{fontSize:13,color:tipo.color}}>{tipoEmoji(c.tipo,disc,c.disciplina_clase)} {tipo.label}</span>{c.tipo==="colectiva"&&<span style={{fontSize:12,color:"#90CAF9"}}> · {c.personas} pers.</span>}{c.horas>0&&<span style={{fontSize:11,color:"#4FC3F7"}}> · ⏱{c.horas}h</span>}</div>
                <span style={{fontSize:13,color:"#fff"}}>{fmt(c.valor)}</span>
              </div>
            );})}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <span style={{fontSize:13,color:"#90CAF9"}}>Total del día</span>
              <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(totalDia)}</span>
            </div></>
          )}
        </div>
      )}
    </div>
  );
}

function PorDia({clases, disc}) {
  const hoy=new Date();
  const [mesOffset,setMesOffset]=useState(0);
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
      {diasOrdenados.length===0?<div style={{textAlign:"center",color:"#607d8b",marginTop:40,fontSize:14}}>No hay clases este mes</div>:diasOrdenados.map(dia=>{
        const {clases:cd,total:td,horas:hd}=porDia[dia];
        const esHoy=dia===hoyStr;
        const cDia={particular:0,colectiva:0,requerida:0};
        let extrasDelDia=0;
        cd.forEach(c=>{cDia[c.tipo]++;if(c.tipo==="colectiva") extrasDelDia+=(c.extras||0);});
        const fechaLabel=new Date(dia+"T12:00:00").toLocaleDateString("es-CL",{weekday:"short",day:"numeric",month:"short"});
        const tieneComentarios=cd.some(c=>c.comentario);
        return (
          <div key={dia} style={{background:esHoy?"rgba(255,140,0,0.08)":"rgba(255,255,255,0.03)",border:esHoy?"1px solid rgba(255,140,0,0.4)":"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{fontSize:13,fontWeight:"bold",color:esHoy?"#FF8C00":"#4FC3F7",textTransform:"capitalize"}}>{fechaLabel}</div>
                {esHoy&&<div style={{fontSize:10,color:"#FF8C00",background:"rgba(255,140,0,0.15)",border:"1px solid rgba(255,140,0,0.4)",borderRadius:5,padding:"1px 6px"}}>hoy</div>}
              </div>
              <div style={{fontSize:14,fontWeight:"bold",color:"#fff"}}>{fmt(td)}</div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              {TIPOS.map(t=>cDia[t.key]>0&&(<div key={t.key} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:7,padding:"3px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}><span style={{color:t.color}}>{tipoEmoji(t.key,disc)} {t.label} ×{cDia[t.key]}</span>{t.key==="colectiva"&&extrasDelDia>0&&<span style={{background:"rgba(129,199,132,0.2)",border:"1px solid #81C78455",borderRadius:5,padding:"0px 5px",fontSize:10,color:"#81C784"}}>➕{extrasDelDia}</span>}</div>))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:esHoy?"#FF8C00":"#607d8b"}}>⏱ {hd}h · {cd.length} clase{cd.length>1?"s":""}</div>
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
  const [subTab,setSubTab]=useState("mes");
  const [subTemp,setSubTemp]=useState("meses");
  const [mesSel,setMesSel]=useState(()=>{
    const m=hoy.getMonth();
    return ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m];
  });

  const mesesNombre=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const aniosDisp=[...new Set(clases.map(c=>c.fecha.slice(0,4)))].sort();
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
      <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:14,gap:2}}>
        <button onClick={()=>setSubTab("mes")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTab==="mes"?"rgba(79,195,247,0.15)":"transparent",color:subTab==="mes"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📈 Por mes</button>
        <button onClick={()=>setSubTab("temp")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTab==="temp"?"rgba(79,195,247,0.15)":"transparent",color:subTab==="temp"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🏆 Temporadas</button>
      </div>

      {subTab==="mes"&&(
        <>
          <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:16}}>COMPARATIVA {hoy.getFullYear()}</div>
          <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:20}}>
            {datosPorMes.map((d,i)=>{
              const anterior=i>0?datosPorMes[i-1]:null;
              const diff=anterior?d.total-anterior.total:null;
              const esMejor=d.m===mejorMes?.m;
              return (
                <div key={d.m}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13,color:d.esActual?"#81C784":"#90CAF9",fontWeight:d.esActual?"bold":"normal",textTransform:"capitalize"}}>{d.nombreMes}</span>
                      {d.esActual&&<span style={{fontSize:10,color:"#607d8b"}}>en curso</span>}
                      {esMejor&&!d.esActual&&<span style={{fontSize:10,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"1px 6px"}}>★ mejor</span>}
                    </div>
                    <span style={{fontSize:13,fontWeight:"bold",color:"#fff"}}>{fmt(d.total)}</span>
                  </div>
                  <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",width:`${d.pctDias}%`,background:d.esActual?"#81C784":"rgba(79,195,247,0.4)",borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:11,color:diff!==null&&diff!==0?(diff>0?"#81C784":"#ef9a9a"):"#607d8b"}}>
                      {diff!==null&&diff!==0?(diff>0?`↑ ${fmt(Math.abs(diff))} más que el mes pasado`:`↓ ${fmt(Math.abs(diff))} menos que el mes pasado`):""}
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
        </>
      )}

      {subTab==="temp"&&(
        <>
          <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:14,gap:2}}>
            <button onClick={()=>setSubTemp("meses")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTemp==="meses"?"rgba(79,195,247,0.15)":"transparent",color:subTemp==="meses"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📅 Por meses</button>
            <button onClick={()=>setSubTemp("temporada")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTemp==="temporada"?"rgba(79,195,247,0.15)":"transparent",color:subTemp==="temporada"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📆 Por temporada</button>
          </div>

          {subTemp==="meses"&&(
            <>
              <select value={mesSel} onChange={e=>setMesSel(e.target.value)} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,background:"#0d2a3a",border:"1px solid #4FC3F744",color:"#e8f4f8",marginBottom:12}}>
                {mesesNombre.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </select>
              <div style={{fontSize:11,color:"#4FC3F7",letterSpacing:2,marginBottom:10}}>{mesSel.toUpperCase()} — POR AÑOS</div>
              {aniosDisp.length===0?(
                <div style={{textAlign:"center",color:"#607d8b",fontSize:13,padding:20}}>Sin datos suficientes para comparar</div>
              ):aniosDisp.map((anio,i)=>{
                const mesNum=String(mesesNombre.indexOf(mesSel)+1).padStart(2,"0");
                const mStr=`${anio}-${mesNum}`;
                const cm=clases.filter(c=>c.fecha.startsWith(mStr));
                const total=cm.reduce((s,c)=>s+c.valor,0);
                const horas=cm.reduce((s,c)=>s+(c.horas||1),0);
                const conteo={particular:0,colectiva:0,requerida:0};
                cm.forEach(c=>conteo[c.tipo]++);
                const esActual=mStr===mesActualStr;
                const prevAnio=i>0?aniosDisp[i-1]:null;
                let diffAnio=null;
                if(prevAnio){
                  const ps=`${prevAnio}-${mesNum}`;
                  const pt=clases.filter(c=>c.fecha.startsWith(ps)).reduce((s,c)=>s+c.valor,0);
                  diffAnio=total-pt;
                }
                const maxTotal=Math.max(...aniosDisp.map(a=>{
                  const s=`${a}-${mesNum}`;
                  return clases.filter(c=>c.fecha.startsWith(s)).reduce((ss,cc)=>ss+cc.valor,0);
                }),1);
                return (
                  <div key={anio} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,color:esActual?"#81C784":"#90CAF9",fontWeight:esActual?"bold":"normal"}}>{mesSel.charAt(0).toUpperCase()+mesSel.slice(1)} {anio}</span>
                        {esActual&&<span style={{fontSize:10,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"1px 5px"}}>en curso</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {diffAnio!==null&&diffAnio!==0&&<span style={{fontSize:11,borderRadius:6,padding:"1px 5px",color:diffAnio>0?"#81C784":"#ef9a9a",background:diffAnio>0?"rgba(129,199,132,0.1)":"rgba(239,83,80,0.1)",border:diffAnio>0?"1px solid #81C78444":"1px solid #ef535044"}}>{diffAnio>0?"↑":"↓"} {Math.abs(Math.round((diffAnio/Math.max(total-diffAnio,1))*100))}%</span>}
                        <span style={{fontSize:13,fontWeight:"bold",color:"#fff"}}>{fmt(total)}</span>
                      </div>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:4}}>
                      <div style={{height:"100%",width:`${Math.round(total/maxTotal*100)}%`,background:esActual?"#81C784":"rgba(79,195,247,0.4)",borderRadius:99}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:11,color:"#607d8b"}}>{conteo.particular>0&&`⛷️ ${conteo.particular} · `}{conteo.colectiva>0&&`👥 ${conteo.colectiva} · `}{conteo.requerida>0&&`📋 ${conteo.requerida}`}</span>
                      <span style={{fontSize:11,color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:6,padding:"1px 6px"}}>⏱ {horas}h</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {subTemp==="temporada"&&(
            <>
              <div style={{fontSize:11,color:"#4FC3F7",letterSpacing:2,marginBottom:12}}>TEMPORADA COMPLETA</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[{label:"Temporada A",color:"#4FC3F7",border:"rgba(79,195,247,0.2)",bg:"rgba(79,195,247,0.04)"},{label:"Temporada B",color:"#81C784",border:"rgba(129,199,132,0.3)",bg:"rgba(129,199,132,0.05)"}].map((t,idx)=>(
                  <div key={idx} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:12,padding:12}}>
                    <div style={{fontSize:11,color:t.color,marginBottom:6}}>{t.label}</div>
                    <div style={{display:"flex",gap:3,marginBottom:8}}>
                      <select style={{flex:1,fontSize:10,padding:"3px 4px",borderRadius:6,background:"#0d2a3a",border:`1px solid ${t.border}`,color:"#e8f4f8"}}>
                        {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m=><option key={m}>{m}</option>)}
                      </select>
                      <select style={{flex:1,fontSize:10,padding:"3px 4px",borderRadius:6,background:"#0d2a3a",border:`1px solid ${t.border}`,color:"#e8f4f8"}}>
                        {["2026","2027","2028","2029","2030","2031"].map(a=>["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m=>`${m} ${a}`)).flat().map(m=><option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>$0</div>
                    <div style={{fontSize:11,color:"#90CAF9",marginTop:2}}>⏱ 0h</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,display:"flex",justifyContent:"space-between",padding:"9px 10px",background:"rgba(129,199,132,0.08)",border:"1px solid rgba(129,199,132,0.2)",borderRadius:8}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>💰 Ingresos</span>
                  <span style={{fontSize:12,fontWeight:500,color:"#607d8b"}}>—</span>
                </div>
                <div style={{flex:1,display:"flex",justifyContent:"space-between",padding:"9px 10px",background:"rgba(79,195,247,0.08)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:8}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>⏱ Horas</span>
                  <span style={{fontSize:12,fontWeight:500,color:"#607d8b"}}>—</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function PorDisciplina({clases, disc, mostrarMonto, fmt}) {
  const [subTab,setSubTab]=useState("mes");
  const [subTemp,setSubTemp]=useState("meses");
  const [mesSel,setMesSel]=useState(()=>{
    const m=new Date().getMonth();
    return ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][m];
  });
  const hoy=new Date();
  const mesesNombre=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const aniosDisp=[...new Set(clases.map(c=>c.fecha.slice(0,4)))].sort();
  const mesesConDatos=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort();
  const mesActualStr=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  if(!mesesConDatos.includes(mesActualStr)) mesesConDatos.push(mesActualStr);

  const datosPorMes=mesesConDatos.map(m=>{
    const [anio,mes]=m.split("-").map(Number);
    const cm=clases.filter(c=>c.fecha.startsWith(m));
    const skiM=cm.filter(c=>(c.disciplina_clase||"ski")==="ski");
    const snowM=cm.filter(c=>(c.disciplina_clase||"snow")==="snow");
    const totalSki=skiM.reduce((s,c)=>s+c.valor,0);
    const totalSnow=snowM.reduce((s,c)=>s+c.valor,0);
    const horasSki=skiM.reduce((s,c)=>s+(c.horas||1),0);
    const horasSnow=snowM.reduce((s,c)=>s+(c.horas||1),0);
    const total=totalSki+totalSnow;
    const horas=horasSki+horasSnow;
    const totalDiasMes=diasEnMes(anio,mes-1);
    const esActual=m===mesActualStr;
    const diaActual=esActual?hoy.getDate():totalDiasMes;
    const pctDias=Math.round((diaActual/totalDiasMes)*100);
    const nombreMes=new Date(anio,mes-1,1).toLocaleDateString("es-CL",{month:"long"});
    return {m,total,horas,totalSki,totalSnow,horasSki,horasSnow,totalDiasMes,diaActual,pctDias,esActual,nombreMes};
  });
  const totalAcumulado=datosPorMes.reduce((s,d)=>s+d.total,0);
  const totalAcumuladoSki=datosPorMes.reduce((s,d)=>s+d.totalSki,0);
  const totalAcumuladoSnow=datosPorMes.reduce((s,d)=>s+d.totalSnow,0);
  const mejorMes=datosPorMes.reduce((best,d)=>d.total>best.total?d:best,datosPorMes[0]);
  const skiClasesTotal=clases.filter(c=>(c.disciplina_clase||"ski")==="ski");
  const snowClasesTotal=clases.filter(c=>(c.disciplina_clase||"snow")==="snow");

  return (
    <div>
      <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:14,gap:2}}>
        <button onClick={()=>setSubTab("mes")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTab==="mes"?"rgba(156,39,176,0.15)":"transparent",color:subTab==="mes"?"#CE93D8":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📈 Por mes</button>
        <button onClick={()=>setSubTab("temp")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTab==="temp"?"rgba(156,39,176,0.15)":"transparent",color:subTab==="temp"?"#CE93D8":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>🏆 Temporadas</button>
      </div>

      {subTab==="mes"&&(
        <>
          <div style={{fontSize:11,letterSpacing:2,color:"#CE93D8",marginBottom:16}}>COMPARATIVA {hoy.getFullYear()}</div>
          <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:20}}>
            {datosPorMes.map((d,i)=>{
              const anterior=i>0?datosPorMes[i-1]:null;
              const diff=anterior?d.total-anterior.total:null;
              return (
                <div key={d.m}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:13,color:d.esActual?"#81C784":"#90CAF9",fontWeight:d.esActual?"bold":"normal",textTransform:"capitalize"}}>{d.nombreMes}</span>
                      {d.esActual&&<span style={{fontSize:10,color:"#607d8b"}}>en curso</span>}
                    </div>
                    <span style={{fontSize:13,fontWeight:"bold",color:"#fff"}}>{mostrarMonto?fmt(d.total):"••••••"}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:12}}>⛷️</span>
                      <span style={{fontSize:12,color:"#4FC3F7",fontWeight:"bold"}}>{mostrarMonto?fmt(d.totalSki):"••••••"}</span>
                      <span style={{fontSize:11,color:"#607d8b"}}>· ⏱{d.horasSki}h</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                      <span style={{fontSize:11,color:"#607d8b"}}>⏱{d.horasSnow}h ·</span>
                      <span style={{fontSize:12,color:"#FF9800",fontWeight:"bold"}}>{mostrarMonto?fmt(d.totalSnow):"••••••"}</span>
                      <span style={{fontSize:12}}>🏂</span>
                    </div>
                  </div>
                  {anterior&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:10,color:d.totalSki>=anterior.totalSki?"#81C784":"#ef9a9a"}}>{d.totalSki!==anterior.totalSki?(d.totalSki>anterior.totalSki?`↑ ${mostrarMonto?fmt(d.totalSki-anterior.totalSki):""}`:`↓ ${mostrarMonto?fmt(anterior.totalSki-d.totalSki):""}`):""}</span>
                      <span style={{fontSize:10,color:d.totalSnow>=anterior.totalSnow?"#81C784":"#ef9a9a"}}>{d.totalSnow!==anterior.totalSnow?(d.totalSnow>anterior.totalSnow?`↑ ${mostrarMonto?fmt(d.totalSnow-anterior.totalSnow):""}`:`↓ ${mostrarMonto?fmt(anterior.totalSnow-d.totalSnow):""}`):""}</span>
                    </div>
                  )}
                  <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:4}}>
                    <div style={{height:"100%",width:`${d.pctDias}%`,background:d.esActual?"#81C784":"rgba(79,195,247,0.4)",borderRadius:99}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{display:"flex",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:"#4FC3F7",marginTop:3}}/>
                      <div style={{width:8,height:8,borderRadius:"50%",background:"#FF9800",marginTop:3}}/>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:11,color:d.esActual?"#81C784":"#607d8b"}}>{d.diaActual}/{d.totalDiasMes} días ·</span>
                      <span style={{fontSize:11,color:"#CE93D8",background:"rgba(156,39,176,0.1)",border:"1px solid #CE93D844",borderRadius:6,padding:"1px 6px"}}>⏱ {d.horas}h</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:12,color:"#607d8b"}}>Total acumulado {hoy.getFullYear()}</span>
              <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{mostrarMonto?fmt(totalAcumulado):"••••••"}</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8,marginBottom:10}}>
              <div style={{textAlign:"center",padding:8,background:"rgba(79,195,247,0.06)",borderRadius:8}}>
                <div style={{fontSize:18,fontWeight:"bold",color:"#4FC3F7"}}>{mostrarMonto?fmt(totalAcumuladoSki):"••••••"}</div>
                <div style={{fontSize:10,color:"#607d8b"}}>⛷️ Ski</div>
              </div>
              <div style={{textAlign:"center",padding:8,background:"rgba(255,152,0,0.06)",borderRadius:8}}>
                <div style={{fontSize:18,fontWeight:"bold",color:"#FF9800"}}>{mostrarMonto?fmt(totalAcumuladoSnow):"••••••"}</div>
                <div style={{fontSize:10,color:"#607d8b"}}>🏂 Snow</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              {mejorMes&&<div style={{fontSize:11,color:"#FFB74D"}}>★ Mejor mes: {mejorMes.nombreMes} ({mostrarMonto?fmt(mejorMes.total):"••••••"})</div>}
              <span style={{fontSize:11,color:"#CE93D8",background:"rgba(156,39,176,0.1)",border:"1px solid #CE93D844",borderRadius:6,padding:"2px 8px"}}>🏆 {totalAcumuladoSki+totalAcumuladoSnow>0?Math.round(totalAcumuladoSki/(totalAcumuladoSki+totalAcumuladoSnow)*100):0}% ski</span>
            </div>
            <div style={{display:"flex",gap:16,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:5,background:"#81C784",borderRadius:99}}/><span style={{fontSize:11,color:"#607d8b"}}>Mes en curso</span></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:5,background:"rgba(79,195,247,0.4)",borderRadius:99}}/><span style={{fontSize:11,color:"#607d8b"}}>Mes completo</span></div>
            </div>
          </div>
        </>
      )}

      {subTab==="temp"&&(
        <>
          <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:14,gap:2}}>
            <button onClick={()=>setSubTemp("meses")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTemp==="meses"?"rgba(156,39,176,0.15)":"transparent",color:subTemp==="meses"?"#CE93D8":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📅 Por meses</button>
            <button onClick={()=>setSubTemp("temporada")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subTemp==="temporada"?"rgba(156,39,176,0.15)":"transparent",color:subTemp==="temporada"?"#CE93D8":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📆 Por temporada</button>
          </div>

          {subTemp==="meses"&&(
            <>
              <select value={mesSel} onChange={e=>setMesSel(e.target.value)} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,background:"#0d2a3a",border:"1px solid #CE93D844",color:"#e8f4f8",marginBottom:12}}>
                {mesesNombre.map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
              </select>
              <div style={{fontSize:11,color:"#CE93D8",letterSpacing:2,marginBottom:10}}>{mesSel.toUpperCase()} — POR AÑOS</div>
              {aniosDisp.length===0?(
                <div style={{textAlign:"center",color:"#607d8b",fontSize:13,padding:20}}>Sin datos suficientes para comparar</div>
              ):aniosDisp.map((anio,i)=>{
                const mesNum=String(mesesNombre.indexOf(mesSel)+1).padStart(2,"0");
                const mStr=`${anio}-${mesNum}`;
                const cm=clases.filter(c=>c.fecha.startsWith(mStr));
                const skiAnio=cm.filter(c=>(c.disciplina_clase||"ski")==="ski");
                const snowAnio=cm.filter(c=>(c.disciplina_clase||"snow")==="snow");
                const tSki=skiAnio.reduce((s,c)=>s+c.valor,0);
                const tSnow=snowAnio.reduce((s,c)=>s+c.valor,0);
                const hSki=skiAnio.reduce((s,c)=>s+(c.horas||1),0);
                const hSnow=snowAnio.reduce((s,c)=>s+(c.horas||1),0);
                const total=tSki+tSnow;
                const horas=hSki+hSnow;
                const esActual=mStr===mesActualStr;
                const prevAnio=i>0?aniosDisp[i-1]:null;
                let diffAnio=null;
                if(prevAnio){
                  const ps=`${prevAnio}-${mesNum}`;
                  const pt=clases.filter(c=>c.fecha.startsWith(ps)).reduce((s,c)=>s+c.valor,0);
                  diffAnio=total-pt;
                }
                const maxTotal=Math.max(...aniosDisp.map(a=>{
                  const s=`${a}-${mesNum}`;
                  return clases.filter(c=>c.fecha.startsWith(s)).reduce((ss,cc)=>ss+cc.valor,0);
                }),1);
                return (
                  <div key={anio} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,color:esActual?"#81C784":"#90CAF9",fontWeight:esActual?"bold":"normal"}}>{mesSel.charAt(0).toUpperCase()+mesSel.slice(1)} {anio}</span>
                        {esActual&&<span style={{fontSize:10,color:"#FFB74D",background:"rgba(255,183,77,0.1)",border:"1px solid #FFB74D44",borderRadius:6,padding:"1px 5px"}}>en curso</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {diffAnio!==null&&diffAnio!==0&&<span style={{fontSize:11,borderRadius:6,padding:"1px 5px",color:diffAnio>0?"#81C784":"#ef9a9a",background:diffAnio>0?"rgba(129,199,132,0.1)":"rgba(239,83,80,0.1)",border:diffAnio>0?"1px solid #81C78444":"1px solid #ef535044"}}>{diffAnio>0?"↑":"↓"} {Math.abs(Math.round((diffAnio/Math.max(total-diffAnio,1))*100))}%</span>}
                        <span style={{fontSize:13,fontWeight:"bold",color:"#fff"}}>{mostrarMonto?fmt(total):"••••••"}</span>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <span style={{fontSize:11}}>⛷️</span>
                        <span style={{fontSize:12,color:"#4FC3F7",fontWeight:"bold"}}>{mostrarMonto?fmt(tSki):"••••••"}</span>
                        <span style={{fontSize:10,color:"#607d8b"}}>· ⏱{hSki}h</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end"}}>
                        <span style={{fontSize:10,color:"#607d8b"}}>⏱{hSnow}h ·</span>
                        <span style={{fontSize:12,color:"#FF9800",fontWeight:"bold"}}>{mostrarMonto?fmt(tSnow):"••••••"}</span>
                        <span style={{fontSize:11}}>🏂</span>
                      </div>
                    </div>
                    <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:4}}>
                      <div style={{height:"100%",width:`${Math.round(total/maxTotal*100)}%`,background:esActual?"#81C784":"rgba(79,195,247,0.4)",borderRadius:99}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:11,color:"#607d8b"}}>{skiAnio.length>0&&`⛷️ ${skiAnio.length} · `}{snowAnio.length>0&&`🏂 ${snowAnio.length} · `}📊 {cm.length} clases</span>
                      <span style={{fontSize:11,color:"#CE93D8",background:"rgba(156,39,176,0.1)",border:"1px solid #CE93D844",borderRadius:6,padding:"1px 6px"}}>⏱ {horas}h</span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {subTemp==="temporada"&&(
            <>
              <div style={{fontSize:11,color:"#CE93D8",letterSpacing:2,marginBottom:12}}>TEMPORADA COMPLETA</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:12}}>
                  <div style={{fontSize:11,color:"#607d8b",marginBottom:6}}>⛷️ Ski</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:"#4FC3F7",marginBottom:2}}>{mostrarMonto?fmt(totalAcumuladoSki):"••••••"}</div>
                  <div style={{fontSize:11,color:"#607d8b"}}>{skiClasesTotal.reduce((s,c)=>s+(c.horas||1),0)}h · {skiClasesTotal.length} clases</div>
                  <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:`${totalAcumulado>0?Math.round(totalAcumuladoSki/totalAcumulado*100):0}%`,background:"#4FC3F7",borderRadius:99}}/></div>
                </div>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,152,0,0.15)",borderRadius:12,padding:12}}>
                  <div style={{fontSize:11,color:"#607d8b",marginBottom:6}}>🏂 Snow</div>
                  <div style={{fontSize:15,fontWeight:"bold",color:"#FF9800",marginBottom:2}}>{mostrarMonto?fmt(totalAcumuladoSnow):"••••••"}</div>
                  <div style={{fontSize:11,color:"#607d8b"}}>{snowClasesTotal.reduce((s,c)=>s+(c.horas||1),0)}h · {snowClasesTotal.length} clases</div>
                  <div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginTop:6}}><div style={{height:"100%",width:`${totalAcumulado>0?Math.round(totalAcumuladoSnow/totalAcumulado*100):0}%`,background:"#FF9800",borderRadius:99}}/></div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:1,display:"flex",justifyContent:"space-between",padding:"9px 10px",background:"rgba(129,199,132,0.08)",border:"1px solid rgba(129,199,132,0.2)",borderRadius:8}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>💰 Total</span>
                  <span style={{fontSize:12,fontWeight:500,color:"#81C784"}}>{mostrarMonto?fmt(totalAcumulado):"••••••"}</span>
                </div>
                <div style={{flex:1,display:"flex",justifyContent:"space-between",padding:"9px 10px",background:"rgba(156,39,176,0.08)",border:"1px solid rgba(156,39,176,0.2)",borderRadius:8}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>⏱ Total</span>
                  <span style={{fontSize:12,fontWeight:500,color:"#CE93D8"}}>{datosPorMes.reduce((s,d)=>s+d.horas,0)}h</span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function SkiTracker() {
  const [user,setUser]=useState(null);
  const [profile,setProfile]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showAdmin,setShowAdmin]=useState(false);
  const [showEditarPerfil,setShowEditarPerfil]=useState(false);
  const [precios,setPrecios]=useState(DEFAULT_PRECIOS);
  const [clases,setClases]=useState([]);
  const [descuentos,setDescuentos]=useState([]);
  const [otros,setOtros]=useState([]);
  const [personas,setPersonas]=useState(3);
  const [horasNuevaClase,setHorasNuevaClase]=useState({particular:1,colectiva:1,requerida:1});
  const [showConfig,setShowConfig]=useState(false);
  const [tempPrecios,setTempPrecios]=useState(DEFAULT_PRECIOS);
  const [recordar,setRecordar]=useState(false);
  const [resumenMensual,setResumenMensual]=useState(false);
  const [descuentoInput,setDescuentoInput]=useState("");
  const [tab,setTab]=useState("registro");
  const [subTabCal,setSubTabCal]=useState("calendario");
  const [mes,setMes]=useState(()=>{const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;});
  const [comentarios,setComentarios]=useState({});
  const [comentarioPrevio,setComentarioPrevio]=useState({particular:"",colectiva:"",requerida:""});
  const [mostrarComentarioPrevio,setMostrarComentarioPrevio]=useState({particular:false,colectiva:false,requerida:false});
  const [showAgregarOtro,setShowAgregarOtro]=useState(null);
  const [nuevoOtroNombre,setNuevoOtroNombre]=useState("");
  const [nuevoOtroMonto,setNuevoOtroMonto]=useState("");
  const [claseDisc,setClaseDisc]=useState({particular:"ski",colectiva:"ski",requerida:"ski"});

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{if(session) handleAuth(session.user);else setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{if(session) handleAuth(session.user);else{setUser(null);setProfile(null);setLoading(false);}});
    return ()=>subscription.unsubscribe();
  },[]);

  async function handleAuth(u) {
    setUser(u);
    await supabase.from("sesiones").insert({user_id:u.id});
    await supabase.from("profiles").update({last_seen:new Date().toISOString()}).eq("id",u.id);
    let {data:prof}=await supabase.from("profiles").select("*").eq("id",u.id).single();
    if(!prof){
      await supabase.from("profiles").insert({id:u.id,email:u.email,nombre:u.user_metadata?.nombre||"",aprobado:false,is_admin:false,disciplina:"ski",recordar:false});
      const {data:newProf}=await supabase.from("profiles").select("*").eq("id",u.id).single();
      prof=newProf;
    }
    setProfile(prof);
    if(prof) {setRecordar(prof.recordar??false);setResumenMensual(prof.resumen_mensual??false);}
    if(prof?.aprobado||prof?.is_admin){
      const {data:prec}=await supabase.from("precios").select("*").eq("user_id",u.id).single();
      if(prec) setPrecios({
        particular:prec.particular,
        colectiva:prec.colectiva,
        colectiva_extra:prec.colectiva_extra,
        colectiva_base:prec.colectiva_base,
        requerida:prec.requerida,
        extra_por_hora:prec.extra_por_hora??true,
        mostrar_monto:prec.mostrar_monto!==false
      });
      const {data:cls}=await supabase.from("clases").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(cls){setClases(cls);const c={};cls.forEach(x=>{if(x.comentario) c[x.id]=x.comentario;});setComentarios(c);}
      const {data:desc}=await supabase.from("descuentos").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(desc) setDescuentos(desc);
      const {data:ot}=await supabase.from("otros").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(ot) setOtros(ot);
    }
    setLoading(false);
  }

  async function logout(){
    await supabase.auth.signOut();
    setUser(null);setProfile(null);setClases([]);setDescuentos([]);setOtros([]);
  }

  async function setDisciplina(disc) {
    await supabase.from("profiles").update({disciplina:disc}).eq("id",profile.id);
    setProfile(p=>({...p,disciplina:disc}));
    setSubTabCal("calendario");
  }

  function handleClaseDisc(tipo,val){ setClaseDisc(p=>({...p,[tipo]:val})); }

  function disciplinaClaseActual(tipo){ return disc==="poli"?claseDisc[tipo]:disc; }

  function calcularValor(tipo,horas) {
    const h=horas||1;
    if(tipo==="particular") return precios.particular*h;
    if(tipo==="requerida") return precios.requerida*h;
    const extras=Math.max(0,personas-precios.colectiva_base);
    const extraValor=precios.extra_por_hora?precios.colectiva_extra*extras*h:precios.colectiva_extra*extras;
    return precios.colectiva*h+extraValor;
  }

  async function agregarClase(tipo) {
    const horas=horasNuevaClase[tipo]||1;
    const valor=calcularValor(tipo,horas);
    const extras=tipo==="colectiva"?Math.max(0,personas-precios.colectiva_base):0;
    const comentario=comentarioPrevio[tipo]||"";
    const dc=disciplinaClaseActual(tipo);
    const {data,error}=await supabase.from("clases").insert({user_id:user.id,tipo,valor,personas:tipo==="colectiva"?personas:0,extras,comentario:comentario||null,horas,fecha:new Date().toISOString(),disciplina_clase:dc}).select().single();
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

  async function eliminarDescuento(id){
    await supabase.from("descuentos").delete().eq("id",id);
    setDescuentos(prev=>prev.filter(d=>d.id!==id));
  }

  async function agregarOtro() {
    const val=parseInt(nuevoOtroMonto.replace(/\D/g,""));
    if(!val||val<=0||!nuevoOtroNombre.trim()) return;
    const {data,error}=await supabase.from("otros").insert({user_id:user.id,nombre:nuevoOtroNombre.trim(),tipo:showAgregarOtro,valor:val,fecha:new Date().toISOString()}).select().single();
    if(!error&&data) setOtros(prev=>[...prev,data]);
    setNuevoOtroNombre(""); setNuevoOtroMonto(""); setShowAgregarOtro(null);
  }

  async function eliminarOtro(id){
    await supabase.from("otros").delete().eq("id",id);
    setOtros(prev=>prev.filter(o=>o.id!==id));
  }

  async function guardarPrecios() {
    await supabase.from("profiles").update({recordar,resumen_mensual:resumenMensual}).eq("id",user.id);
    await supabase.from("precios").update({
      particular:tempPrecios.particular,
      colectiva:tempPrecios.colectiva,
      colectiva_extra:tempPrecios.colectiva_extra,
      colectiva_base:tempPrecios.colectiva_base,
      requerida:tempPrecios.requerida,
      extra_por_hora:tempPrecios.extra_por_hora,
      mostrar_monto:tempPrecios.mostrar_monto
    }).eq("user_id",user.id);
    setPrecios({...tempPrecios});
    setPersonas(p=>Math.max(p,tempPrecios.colectiva_base||3));
    setShowConfig(false);
  }

  if(loading) return <div style={{minHeight:"100vh",background:"#0a1628",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif",fontSize:16}}>⛷️ Cargando...</div>;
  if(!user) return <AuthScreen onAuth={handleAuth}/>;
  if(profile&&!profile.aprobado&&!profile.is_admin) return <PendienteScreen user={user} onLogout={logout}/>;
  if(showAdmin&&profile?.is_admin) return <AdminPanel onBack={()=>setShowAdmin(false)}/>;

  const disc=profile?.disciplina||"ski";
  const mostrarMonto=precios.mostrar_monto!==false;
  const base=precios.colectiva_base||3;
  const clasesMes=clases.filter(c=>c.fecha.startsWith(mes));
  const descuentosMes=descuentos.filter(d=>d.fecha.startsWith(mes));
  const otrosMes=otros.filter(o=>o.fecha.startsWith(mes));
  const totalBruto=clasesMes.reduce((s,c)=>s+c.valor,0);
  const totalDescuentos=descuentosMes.reduce((s,d)=>s+d.valor,0);
  const totalOtrosGastos=otrosMes.filter(o=>o.tipo==="gasto").reduce((s,o)=>s+o.valor,0);
  const totalOtrosIngresos=otrosMes.filter(o=>o.tipo==="ingreso").reduce((s,o)=>s+o.valor,0);
  const total=totalBruto-totalDescuentos-totalOtrosGastos+totalOtrosIngresos;
  const horasPorTipo={particular:0,colectiva:0,requerida:0};
  clasesMes.forEach(c=>{horasPorTipo[c.tipo]+=(c.horas||1);});
  const totalHorasMes=Object.values(horasPorTipo).reduce((s,h)=>s+h,0);
  const skiClases=clasesMes.filter(c=>(c.disciplina_clase||disc)==="ski");
  const snowClases=clasesMes.filter(c=>(c.disciplina_clase||disc)==="snow");
  const totalSki=skiClases.reduce((s,c)=>s+c.valor,0);
  const totalSnow=snowClases.reduce((s,c)=>s+c.valor,0);
  const horasSki={particular:0,colectiva:0,requerida:0};
  const horasSnow={particular:0,colectiva:0,requerida:0};
  skiClases.forEach(c=>{horasSki[c.tipo]+=(c.horas||1);});
  snowClases.forEach(c=>{horasSnow[c.tipo]+=(c.horas||1);});
  const totalHorasSki=Object.values(horasSki).reduce((s,h)=>s+h,0);
  const totalHorasSnow=Object.values(horasSnow).reduce((s,h)=>s+h,0);
  const mesesDisponibles=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort().reverse();
  const extrasActuales=Math.max(0,personas-base);
  const colectivaPreview=calcularValor("colectiva",horasNuevaClase.colectiva);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1628 0%,#0d2035 50%,#0a1628 100%)",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{background:"linear-gradient(90deg,#0d2a3a,#1a3a50)",borderBottom:"2px solid #4FC3F7",padding:"16px 20px 0",position:"sticky",top:0,zIndex:10}}>

        {/* CAMBIO 2: Selector ski/snow */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:10,width:"fit-content",gap:2}}>
          {[["ski","⛷️","Ski"],["snow","🏂","Snow"],["poli","🎿","Polivalente"]].map(([k,em,l])=>(
            <button key={k} onClick={()=>setDisciplina(k)} style={{padding:"4px 14px",display:"flex",alignItems:"center",gap:5,cursor:"pointer",border:"none",borderRadius:7,background:disc===k?k==="poli"?"rgba(156,39,176,0.2)":"rgba(79,195,247,0.2)":"transparent",outline:disc===k?k==="poli"?"1px solid #CE93D8":"1px solid #4FC3F7":"none",fontFamily:"inherit"}}>
              <span style={{fontSize:15}}>{em}</span>
              <span style={{fontSize:12,color:disc===k?k==="poli"?"#CE93D8":"#4FC3F7":"#607d8b",fontWeight:disc===k?"bold":"normal"}}>{l}</span>
            </button>
          ))}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          {/* CAMBIO 6: Avatar + editar perfil */}
          <div style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}} onClick={()=>setShowEditarPerfil(true)}>
            <div style={{position:"relative"}}>
              <Avatar url={profile?.avatar_url} nombre={profile?.nombre} email={profile?.email} size={40}/>
              <div style={{width:16,height:16,borderRadius:"50%",background:"#4FC3F7",border:"2px solid #0d2a3a",position:"absolute",bottom:0,right:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9}}>✏️</div>
            </div>
            <div>
              <div style={{fontSize:10,letterSpacing:3,color:"#4FC3F7",textTransform:"uppercase"}}>{disc==="snow"?"🏂 Snow Instructor":disc==="poli"?"🎿 Instructor Polivalente":"⛷️ Ski Instructor"}</div>
              <div style={{fontSize:18,fontWeight:"bold",color:"#fff"}}>{profile?.nombre||profile?.email?.split("@")[0]||"Mi cuenta"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {profile?.is_admin&&<button onClick={()=>setShowAdmin(true)} style={{background:"rgba(255,183,77,0.15)",border:"1px solid #FFB74D",borderRadius:10,color:"#FFB74D",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>👑</button>}
            <button onClick={()=>{setTempPrecios({...precios});setShowConfig(true);}} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:10,color:"#4FC3F7",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>⚙️</button>
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
          {[["registro","📝 Registro"],["calendario","📊 Estadísticas"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"10px 0",background:tab===key?"rgba(79,195,247,0.15)":"transparent",border:"none",borderBottom:tab===key?"2px solid #4FC3F7":"2px solid transparent",color:tab===key?"#4FC3F7":"#607d8b",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 20px 100px"}}>
        {tab!=="calendario"&&(
          <div style={{background:"linear-gradient(135deg,#0d2a3a,#1a3a50)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:18,padding:"18px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{fontSize:10,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:4}}>Total estimado del mes</div>
            {/* CAMBIO 3: toggle mostrar/ocultar monto */}
            <div style={{fontSize:36,fontWeight:"bold",color:"#fff",letterSpacing:-1}}>{mostrarMonto?fmt(total):"••••••"}</div>
            {(totalDescuentos>0||totalOtrosGastos>0||totalOtrosIngresos>0)&&mostrarMonto&&(
              <div style={{fontSize:12,color:"#90CAF9",marginTop:2}}>
                {fmt(totalBruto)} clases
                {totalOtrosIngresos>0&&` + ${fmt(totalOtrosIngresos)}`}
                {(totalDescuentos+totalOtrosGastos)>0&&` − ${fmt(totalDescuentos+totalOtrosGastos)}`}
              </div>
            )}
            <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:12}}>
              {TIPOS.map(t=>(
                <div key={t.key} style={{textAlign:"center"}}>
                  <div style={{fontSize:16}}>{tipoEmoji(t.key,disc)}</div>
                  <div style={{fontSize:18,fontWeight:"bold",color:t.color}}>{horasPorTipo[t.key]}h</div>
                  <div style={{fontSize:10,color:"#90CAF9"}}>{t.label}</div>
                </div>
              ))}
            </div>
            {disc==="poli"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{background:"rgba(79,195,247,0.04)",border:"1px solid rgba(79,195,247,0.25)",borderRadius:12,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:18}}>⛷️</div>
                    <div style={{fontSize:18,fontWeight:"bold",color:"#4FC3F7",marginTop:2}}>{mostrarMonto?fmt(totalSki):"••••••"}</div>
                    <div style={{fontSize:11,color:"#607d8b"}}>⏱ {totalHorasSki}h</div>
                  </div>
                  <div style={{background:"rgba(255,152,0,0.04)",border:"1px solid rgba(255,152,0,0.25)",borderRadius:12,padding:10,textAlign:"center"}}>
                    <div style={{fontSize:18}}>🏂</div>
                    <div style={{fontSize:18,fontWeight:"bold",color:"#FF9800",marginTop:2}}>{mostrarMonto?fmt(totalSnow):"••••••"}</div>
                    <div style={{fontSize:11,color:"#607d8b"}}>⏱ {totalHorasSnow}h</div>
                  </div>
                </div>
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                  <div style={{fontSize:10,color:"#607d8b",letterSpacing:1,marginBottom:6,textAlign:"center"}}>HORAS POR CATEGORÍA</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:"rgba(79,195,247,0.06)",borderRadius:8,padding:8}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#4FC3F7",marginBottom:6}}>⛷️ SKI</div>
                      {TIPOS.map(t=>(
                        <div key={t.key} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                          <span style={{color:"#90CAF9"}}>{t.label}</span>
                          <span style={{fontWeight:"bold"}}>{horasSki[t.key]}h</span>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",borderTop:"1px solid rgba(255,255,255,0.07)",marginTop:4,paddingTop:4}}>
                        <span style={{color:"#607d8b"}}>Total</span>
                        <span style={{fontWeight:"bold",color:"#4FC3F7"}}>{totalHorasSki}h</span>
                      </div>
                    </div>
                    <div style={{background:"rgba(255,152,0,0.06)",borderRadius:8,padding:8}}>
                      <div style={{fontSize:11,fontWeight:600,color:"#FF9800",marginBottom:6}}>🏂 SNOW</div>
                      {TIPOS.map(t=>(
                        <div key={t.key} style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0"}}>
                          <span style={{color:"#90CAF9"}}>{t.label}</span>
                          <span style={{fontWeight:"bold"}}>{horasSnow[t.key]}h</span>
                        </div>
                      ))}
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,padding:"2px 0",borderTop:"1px solid rgba(255,255,255,0.07)",marginTop:4,paddingTop:4}}>
                        <span style={{color:"#607d8b"}}>Total</span>
                        <span style={{fontWeight:"bold",color:"#FF9800"}}>{totalHorasSnow}h</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"center",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:"#607d8b"}}>Total horas del mes</span>
              <span style={{fontSize:13,fontWeight:"bold",color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:8,padding:"3px 10px"}}>⏱ {totalHorasMes}h</span>
            </div>
          </div>
        )}

        {tab==="calendario"&&(
          <>
            <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:3,marginBottom:16}}>
              {[["calendario","🗓️ Calendario"],["pordia","📅 Por Día"],["pormes","📊 Por Mes"],disc==="poli"&&["pordisc","🎿 Por Disciplina"]].filter(Boolean).map(([key,label])=>(
                <button key={key} onClick={()=>setSubTabCal(key)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,background:subTabCal===key?"rgba(79,195,247,0.15)":"transparent",color:subTabCal===key?key==="pordisc"?"#CE93D8":"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
              ))}
            </div>
            {subTabCal==="calendario"&&<Calendario clases={clases} disc={disc}/>}
            {subTabCal==="pordia"&&<PorDia clases={clases} disc={disc}/>}
            {subTabCal==="pormes"&&<PorMes clases={clases}/>}
            {subTabCal==="pordisc"&&<PorDisciplina clases={clases} disc={disc} mostrarMonto={mostrarMonto} fmt={fmt}/>}
          </>
        )}

        {tab==="registro"&&(
          <>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:12}}>Registrar clase</div>

            {/* COLECTIVA */}
            <div style={{background:"#0d2a1a",border:"1px solid rgba(129,199,132,0.3)",borderRadius:14,padding:"16px",marginBottom:12}}>
              <div style={{fontSize:13,color:"#81C784",marginBottom:10,fontWeight:"bold"}}>👥 Colectiva</div>
              {disc==="poli"&&<div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:8,padding:2,marginBottom:8,gap:2,width:"fit-content"}}>
                {[["ski","⛷️"],["snow","🏂"]].map(([kd,em])=>(
                  <button key={kd} onClick={()=>handleClaseDisc("colectiva",kd)} style={{padding:"4px 10px",border:"none",borderRadius:6,background:claseDisc.colectiva===kd?kd==="ski"?"rgba(79,195,247,0.2)":"rgba(255,152,0,0.2)":"transparent",color:claseDisc.colectiva===kd?kd==="ski"?"#4FC3F7":"#FF9800":"#607d8b",fontSize:11,cursor:"pointer",fontWeight:claseDisc.colectiva===kd?600:400,fontFamily:"inherit"}}>{em} {kd==="ski"?"Ski":"Snow"}</button>
                ))}
              </div>}
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Precio base (incluye {base} pers.)</span>
                <span style={{fontSize:12,color:"#81C784",fontWeight:"bold"}}>{fmt(precios.colectiva)}/h</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Personas en clase</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setPersonas(p=>Math.max(1,p-1))} style={{width:32,height:32,borderRadius:"50%",background:"rgba(129,199,132,0.2)",border:"1px solid #81C784",color:"#81C784",fontSize:18,cursor:"pointer"}}>−</button>
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
                  <span style={{fontSize:11,color:"#607d8b"}}>{fmt(precios.colectiva)} × {horasNuevaClase.colectiva}h{extrasActuales>0?" + extras":""}</span>
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
                    <div style={{fontSize:26,marginBottom:4}}>{tipoEmoji(t.key,disc)}</div>
                    <div style={{fontSize:14,fontWeight:"bold",color:t.color}}>{t.label}</div>
                    <div style={{fontSize:11,color:"#90CAF9",marginTop:2}}>{fmt(precios[t.key])}/h</div>
                  </div>
                  {disc==="poli"&&<div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:8,padding:2,marginBottom:8,gap:2,width:"fit-content",marginLeft:"auto",marginRight:"auto"}}>
                    {[["ski","⛷️"],["snow","🏂"]].map(([kd,em])=>(
                      <button key={kd} onClick={()=>handleClaseDisc(t.key,kd)} style={{padding:"4px 10px",border:"none",borderRadius:6,background:claseDisc[t.key]===kd?kd==="ski"?"rgba(79,195,247,0.2)":"rgba(255,152,0,0.2)":"transparent",color:claseDisc[t.key]===kd?kd==="ski"?"#4FC3F7":"#FF9800":"#607d8b",fontSize:11,cursor:"pointer",fontWeight:claseDisc[t.key]===kd?600:400,fontFamily:"inherit"}}>{em} {kd==="ski"?"Ski":"Snow"}</button>
                    ))}
                  </div>}
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

            {/* CAMBIO 5: SECCIÓN OTROS */}
            <div style={{height:1,background:"rgba(255,255,255,0.07)",marginBottom:16}}/>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:12}}>Otros ingresos y gastos</div>

            {/* Descuentos comida - igual que antes */}
            <div style={{background:"linear-gradient(135deg,#2a0d0d,#1a1020)",border:"1px solid rgba(239,83,80,0.3)",borderRadius:16,padding:"14px",marginBottom:8}}>
              <div style={{fontSize:11,color:"#ef9a9a",letterSpacing:1,marginBottom:10}}>🍽️ DESCUENTOS COMIDA</div>
              <div style={{display:"flex",gap:10,marginBottom:10}}>
                <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:"#1a0a0a",border:"1px solid #ef535055",borderRadius:10,padding:"8px 12px"}}>
                  <span style={{color:"#ef9a9a"}}>$</span>
                  <input type="number" placeholder="Monto a descontar" value={descuentoInput} onChange={e=>setDescuentoInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter") agregarDescuento();}} style={{flex:1,background:"none",border:"none",color:"#fff",fontSize:15,outline:"none"}}/>
                </div>
                <button onClick={()=>agregarDescuento()} style={{background:"rgba(239,83,80,0.2)",border:"1px solid #ef5350",borderRadius:10,color:"#ef9a9a",fontSize:22,padding:"0 16px",cursor:"pointer"}}>−</button>
              </div>
              {descuentosMes.length===0?<div style={{fontSize:12,color:"#607d8b",textAlign:"center",padding:"4px 0"}}>Sin descuentos este mes</div>:(
                <div>
                  {descuentosMes.map(d=>(
                    <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 4px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                      <div><div style={{fontSize:13,color:"#ef9a9a",fontWeight:"bold"}}>− {fmt(d.valor)}</div><div style={{fontSize:11,color:"#607d8b"}}>{new Date(d.fecha).toLocaleDateString("es-CL")}</div></div>
                      <button onClick={()=>eliminarDescuento(d.id)} style={{background:"none",border:"none",color:"#607d8b",fontSize:18,cursor:"pointer"}}>✕</button>
                    </div>
                  ))}
                  <div style={{marginTop:6,textAlign:"right",fontSize:12,color:"#ef9a9a"}}>Total: {fmt(totalDescuentos)}</div>
                </div>
              )}
            </div>

            {/* Otros gastos e ingresos personalizados */}
            {otrosMes.map(o=>(
              <div key={o.id} style={{background:o.tipo==="gasto"?"linear-gradient(135deg,#2a0d0d,#1a1020)":"linear-gradient(135deg,#0d2a1a,#0a1e0a)",border:`1px solid ${o.tipo==="gasto"?"rgba(239,83,80,0.3)":"rgba(129,199,132,0.3)"}`,borderRadius:14,padding:"12px 14px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:o.tipo==="gasto"?"#ef9a9a":"#81C784",letterSpacing:1,textTransform:"uppercase"}}>{o.nombre}</span>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:13,fontWeight:"bold",color:o.tipo==="gasto"?"#ef9a9a":"#81C784"}}>{o.tipo==="gasto"?"− ":"+ "}{fmt(o.valor)}</span>
                    <button onClick={()=>eliminarOtro(o.id)} style={{background:"none",border:"none",color:"#607d8b",fontSize:16,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:"#607d8b",marginTop:4}}>{new Date(o.fecha).toLocaleDateString("es-CL")}</div>
              </div>
            ))}

            {/* Modal agregar otro */}
            {showAgregarOtro&&(
              <div style={{background:showAgregarOtro==="gasto"?"rgba(239,83,80,0.05)":"rgba(129,199,132,0.05)",border:`1px solid ${showAgregarOtro==="gasto"?"rgba(239,83,80,0.3)":"rgba(129,199,132,0.3)"}`,borderRadius:14,padding:14,marginBottom:10}}>
                <div style={{fontSize:12,color:showAgregarOtro==="gasto"?"#ef9a9a":"#81C784",marginBottom:10,fontWeight:"bold"}}>Nuevo {showAgregarOtro}</div>
                <input placeholder={`Nombre del ${showAgregarOtro} (ej: arriendo, bono...)`} value={nuevoOtroNombre} onChange={e=>setNuevoOtroNombre(e.target.value)} style={{width:"100%",background:"rgba(0,0,0,0.3)",border:`1px solid ${showAgregarOtro==="gasto"?"#ef535055":"#81C78455"}`,borderRadius:10,color:"#fff",padding:"10px 12px",fontSize:13,marginBottom:8,boxSizing:"border-box",fontFamily:"inherit"}}/>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{color:showAgregarOtro==="gasto"?"#ef9a9a":"#81C784"}}>$</span>
                  <input type="number" placeholder="Monto" value={nuevoOtroMonto} onChange={e=>setNuevoOtroMonto(e.target.value)} style={{flex:1,background:"rgba(0,0,0,0.3)",border:`1px solid ${showAgregarOtro==="gasto"?"#ef535055":"#81C78455"}`,borderRadius:10,color:"#fff",padding:"10px 12px",fontSize:13,fontFamily:"inherit"}}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <button onClick={()=>{setShowAgregarOtro(null);setNuevoOtroNombre("");setNuevoOtroMonto("");}} style={{padding:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:10,color:"#90CAF9",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                  <button onClick={agregarOtro} style={{padding:"10px",background:showAgregarOtro==="gasto"?"rgba(239,83,80,0.2)":"rgba(129,199,132,0.2)",border:`1px solid ${showAgregarOtro==="gasto"?"#ef5350":"#81C784"}`,borderRadius:10,color:showAgregarOtro==="gasto"?"#ef9a9a":"#81C784",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Guardar</button>
                </div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <button onClick={()=>setShowAgregarOtro("gasto")} style={{padding:"11px",background:"rgba(239,83,80,0.1)",border:"1px solid rgba(239,83,80,0.4)",borderRadius:10,color:"#ef9a9a",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>− Agregar gasto</button>
              <button onClick={()=>setShowAgregarOtro("ingreso")} style={{padding:"11px",background:"rgba(129,199,132,0.1)",border:"1px solid rgba(129,199,132,0.4)",borderRadius:10,color:"#81C784",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>+ Agregar ingreso</button>
            </div>
          </>
        )}
      </div>

      {/* CONFIGURACIÓN - con CAMBIO 3: toggle mostrar monto */}
      {showConfig&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:100}}>
          <div style={{width:"100%",background:"linear-gradient(160deg,#0a1628,#0d2035)",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>⚙️ Configurar Precios</div>
            {[
              {key:"particular",label:"Clase Particular",emoji:tipoEmoji("particular",disc),unit:"/h"},
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
                    <Toggle value={tempPrecios.extra_por_hora??true} onChange={v=>setTempPrecios(p=>({...p,extra_por_hora:v}))} label="⏱ Multiplicar por horas" desc="El extra se cobra por cada hora de clase"/>
                    <div style={{fontSize:11,color:tempPrecios.extra_por_hora?"#81C784":"#607d8b",textAlign:"center",marginTop:6}}>{tempPrecios.extra_por_hora?`Ej: 2 extras × ${fmt(tempPrecios.colectiva_extra)} × 2h = ${fmt(tempPrecios.colectiva_extra*2*2)}`:`Ej: 2 extras × ${fmt(tempPrecios.colectiva_extra)} = ${fmt(tempPrecios.colectiva_extra*2)} (fijo)`}</div>
                  </div>
                )}
              </div>
            ))}
            <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0 16px"}}/>
            <div style={{fontSize:11,color:"#607d8b",letterSpacing:1,marginBottom:10}}>PRIVACIDAD</div>
            <Toggle
              value={tempPrecios.mostrar_monto!==false}
              onChange={v=>setTempPrecios(p=>({...p,mostrar_monto:v}))}
              label="Mostrar total ganado"
              desc="Oculta el monto en la pantalla principal"
            />
            <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"16px 0"}}/>
            <div style={{fontSize:11,color:"#607d8b",letterSpacing:1,marginBottom:10}}>RECORDATORIO</div>
            <Toggle
              value={recordar}
              onChange={setRecordar}
              label="🔔 Recordatorio diario"
              desc="Te envía un correo a las 9 PM si no registraste clases"
            />
            <Toggle
              value={resumenMensual}
              onChange={setResumenMensual}
              label="📊 Resumen mensual"
              desc="Te envía un correo el día 1 con el resumen del mes anterior"
            />
            <div style={{display:"flex",gap:12,marginTop:20}}>
              <button onClick={()=>setShowConfig(false)} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer"}}>Cancelar</button>
              <button onClick={guardarPrecios} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer"}}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* CAMBIO 6: Modal editar perfil con foto */}
      {showEditarPerfil&&(
        <EditarPerfil
          profile={profile}
          onGuardar={(data)=>setProfile(p=>({...p,...data}))}
          onCerrar={()=>setShowEditarPerfil(false)}
        />
      )}
    </div>
  );
}
