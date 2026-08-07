import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BCtRqTIFEjR87hH3e2uRUipj0CXmAX18cOA1hYC8LoDOSfh2SpteIGQeDUWAhq1Mgf1NnxYUQ_igpg0jyJx65AM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_PRECIOS = { particular:24000, colectiva:27000, colectiva_extra:1000, colectiva_base:3, requerida:27000, adicional:5000, mostrar_monto:true };
const TIPOS = [
  { key:"particular", label:"Particular", color:"#66BB6A", bg:"#0d2a1a" },
  { key:"colectiva",  label:"Colectiva",  color:"#546E7A", bg:"#0d1a1f" },
  { key:"requerida",  label:"Requerida",  color:"#E1BEE7", bg:"#1a1520" },
];
const COLORES_POLI = {
  ski:  { particular:"#6495ED", colectiva:"#4DB6AC", requerida:"#FFA726" },
  snow: { particular:"#F06292", colectiva:"#26C6DA", requerida:"#FF7043" },
};
function colorPoli(tipo,discClase){ return COLORES_POLI[discClase]?.[tipo]||"#4FC3F7"; }
function bgPoli(tipo,discClase){ return colorPoli(tipo,discClase)+"18"; }
const DIAS_SEMANA = ["L","M","M","J","V","S","D"];

function fmt(n){ return "$"+Math.round(n).toLocaleString("es-CL"); }
function diasEnMes(anio,mes){ return new Date(anio,mes+1,0).getDate(); }
function tipoEmoji(tipo, disc){ return tipo==="particular"?(disc==="snow"?"🏂":"⛷️"):tipo==="colectiva"?"👥":"📋"; }
function timeAgo(dateStr) {
  if(!dateStr) return "nunca";
  const diff=(Date.now()-new Date(dateStr).getTime())/1000;
  if(diff<60) return "hace un momento";
  if(diff<3600) return `hace ${Math.floor(diff/60)} min`;
  if(diff<86400) return `hace ${Math.floor(diff/3600)}h`;
  if(diff<172800) return "ayer "+new Date(dateStr).toLocaleTimeString("es-CL",{hour:"2-digit",minute:"2-digit"});
  return new Date(dateStr).toLocaleDateString("es-CL");
}
function localISOString(){
  const d=new Date();
  const off=d.getTimezoneOffset();
  const local=new Date(d.getTime()-off*60000);
  return local.toISOString().replace("Z","");
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
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
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
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8",position:"relative"}}>
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
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",background:"#000000",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:18,fontWeight:"bold",color:"#4FC3F7"}}>⛷️ StatClass</div>
              <button onClick={()=>setShowInfo(false)} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#90CAF9",padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕ Cerrar</button>
            </div>
            <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.6,marginBottom:14}}>La herramienta para llevar el control de tus clases, ingresos y estadísticas en un solo lugar.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
              {[{n:"3",l:"Tipos de clase"},{n:"∞",l:"Historial"},{n:"📊",l:"Estadísticas"}].map(s=>(
                <div key={s.l} style={{background:"rgba(79,195,247,0.06)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:10,padding:10,textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:"bold",color:"#4FC3F7"}}>{s.n}</div>
                  <div style={{fontSize:10,color:"#607d8b",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>
            {[
              {icon:"📝",title:"Registro de clases",desc:<>Agrega clases <strong style={{color:"#e8f4f8"}}>Particulares, Colectivas y Requeridas</strong> con control de horas, personas y extras. Calcula el valor automáticamente según tus tarifas.</>},
              {icon:"🎿",title:"Modo Polivalente",desc:<>¿Enseñas ski y snowboard? Clasifica cada clase por disciplina y mira tus estadísticas <strong style={{color:"#e8f4f8"}}>separadas por ⛷️ Ski y 🏂 Snow</strong>.</>},
              {icon:"📊",title:"Estadísticas completas",desc:"Calendario mensual, resumen por día, comparativa anual y análisis por temporadas. Ve exactamente cuánto ganaste y cuántas horas trabajaste."},
              {icon:"💰",title:"Control de ingresos y gastos",desc:<>Registra <strong style={{color:"#81C784"}}>ingresos extras</strong> y <strong style={{color:"#ef9a9a"}}>gastos</strong> como descuentos de comida, arriendos o bonos. Tu total neto siempre actualizado.</>},
              {icon:"🔔",title:"Recordatorios por email",desc:<>Recibe un correo si olvidaste registrar tus clases del día, y un <strong style={{color:"#e8f4f8"}}>resumen mensual</strong> el primer día de cada mes.</>},
              {icon:"⚙️",title:"Precios personalizables",desc:"Configura tus tarifas por hora, personas base, extras y más. Cada instructor tiene su propia configuración."},
            ].map(f=>(
              <div key={f.title} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:12}}>
                <div style={{fontSize:24,flexShrink:0,marginTop:2}}>{f.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#4FC3F7",marginBottom:4}}>{f.title}</div>
                  <div style={{fontSize:12,color:"#90CAF9",lineHeight:1.5}}>{f.desc}</div>
                </div>
              </div>
            ))}
            <div style={{background:"rgba(79,195,247,0.06)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#607d8b"}}>💡 Creado por un instructor para instructores</div>
              <div style={{fontSize:11,color:"#4FC3F7",fontWeight:600}}>v1.0</div>
            </div>
            <button onClick={()=>setShowInfo(false)} style={{width:"100%",padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>¡Entendido, quiero registrarme!</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PendienteScreen({user,onLogout}) {
  return (
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8",textAlign:"center"}}>
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
      <div style={{width:"100%",background:"#000000",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px"}}>
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

function AdminPanel({onBack, pendientesCount, setPendientesCount}) {
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
    const user=usuarios.find(u=>u.id===id);
    const wasPending=user&&!user.aprobado&&!user.is_admin;
    await supabase.from("profiles").update({aprobado}).eq("id",id);
    setUsuarios(prev=>prev.map(u=>u.id===id?{...u,aprobado}:u));
    if(setPendientesCount){
      if(wasPending&&aprobado) setPendientesCount(prev=>Math.max(0,prev-1));
      if(!wasPending&&!aprobado&&!user?.is_admin) setPendientesCount(prev=>prev+1);
    }
  }

  if(loading) return <div style={{minHeight:"100vh",background:"#000000",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif"}}>Cargando...</div>;

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
        {showActions&&!u.is_admin&&(
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>cambiarEstado(u.id,true)} style={{flex:1,padding:"9px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:"rgba(129,199,132,0.15)",border:"1px solid #81C784",color:"#81C784"}}>✅ Aprobar</button>
            <button onClick={()=>cambiarEstado(u.id,false)} style={{flex:1,padding:"9px",borderRadius:8,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:"rgba(239,83,80,0.1)",border:"1px solid #ef5350",color:"#ef9a9a"}}>❌ Rechazar</button>
          </div>
        )}
        {!showActions&&!u.is_admin&&(
          <button onClick={()=>cambiarEstado(u.id,false)} style={{padding:"5px 9px",borderRadius:7,fontSize:11,cursor:"pointer",background:"rgba(239,83,80,0.08)",border:"1px solid #ef535055",color:"#ef9a9a",fontFamily:"inherit",marginTop:6}}>❌ Bloquear</button>
        )}
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#000000",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
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
                <div style={{textAlign:"center",padding:"40px 20px",color:"#607d8b"}}><div style={{fontSize:36,marginBottom:8}}>🎉</div><div style={{fontSize:14}}>Sin solicitudes pendientes</div></div>
              ):(
                <div style={{background:"rgba(255,183,77,0.03)",border:"1px solid rgba(255,183,77,0.2)",borderRadius:12,overflow:"hidden"}}>
                  {pendientes.map(u=><UserRow key={u.id} u={u} showActions={true}/>)}
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
                      <span key={t.key} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:6,padding:"2px 8px",fontSize:11,color:t.color}}>{tipoEmoji(t.key,"ski")} ×{cDia[t.key]}{t.key==="colectiva"&&extras>0&&<span style={{color:"#90A4AE"}}> ➕{extras}</span>}</span>
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

function Calendario({clases, disc, onDelete, onEdit, onAddForDate}) {
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
            <div key={i} onClick={()=>setDiaSeleccionado(seleccionado?null:dStr)} style={{borderRadius:10,padding:"6px 2px",textAlign:"center",cursor:"pointer",background:seleccionado?"rgba(79,195,247,0.2)":esHoy?"rgba(255,140,0,0.1)":tiene?"rgba(255,255,255,0.05)":"transparent",border:seleccionado?"1px solid #4FC3F7":esHoy?"1px solid rgba(255,140,0,0.5)":"1px solid transparent"}}>
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
          {diasSelDia.length===0?<div style={{fontSize:13,color:"#607d8b",marginBottom:10}}>Sin clases este día</div>:(
            <>{diasSelDia.map((c,i)=>{const tipo=TIPOS.find(t=>t.key===c.tipo);return(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<diasSelDia.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                <div><span style={{fontSize:13,color:tipo.color}}>{tipoEmoji(c.tipo,disc)} {tipo.label}</span>{c.tipo==="colectiva"&&<span style={{fontSize:12,color:"#90CAF9"}}> · {c.personas} pers.</span>}{c.horas>0&&<span style={{fontSize:11,color:"#4FC3F7"}}> · ⏱{c.horas}h</span>}</div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,color:"#fff"}}>{fmt(c.valor)}</span>
                  <button onClick={()=>onEdit(c)} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:13,cursor:"pointer",padding:2}}>✏️</button>
                  <button onClick={()=>onDelete(c)} style={{background:"none",border:"none",color:"#ef9a9a",fontSize:13,cursor:"pointer",padding:2}}>🗑️</button>
                </div>
              </div>
            );})}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:10,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <span style={{fontSize:13,color:"#90CAF9"}}>Total del día</span>
              <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(totalDia)}</span>
            </div></>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:12}}>
            {TIPOS.map(t=>(
              <button key={t.key} onClick={()=>onAddForDate(`${mesStr}-${String(diaSeleccionado).padStart(2,"0")}`,t.key)} style={{padding:"8px",background:t.bg,border:`1px solid ${t.color}88`,borderRadius:8,color:t.color,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:"bold",textAlign:"center"}}>
                {tipoEmoji(t.key,disc)} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PorDia({clases, disc, onDelete, onEdit}) {
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
              {TIPOS.map(t=>cDia[t.key]>0&&(<div key={t.key} style={{background:t.bg,border:`1px solid ${t.color}44`,borderRadius:7,padding:"3px 8px",fontSize:11,display:"flex",alignItems:"center",gap:4}}><span style={{color:t.color}}>{tipoEmoji(t.key,disc)} {t.label} ×{cDia[t.key]}</span>{t.key==="colectiva"&&extrasDelDia>0&&<span style={{background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A55",borderRadius:5,padding:"0px 5px",fontSize:10,color:"#90A4AE"}}>➕{extrasDelDia}</span>}</div>))}
            </div>
            {cd.map(c=>{const ct=TIPOS.find(t=>t.key===c.tipo);return(
              <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                <div><span style={{fontSize:12,color:ct?.color}}>{tipoEmoji(c.tipo,disc)} {c.tipo==="colectiva"?`${c.personas} pers.`:""}{c.comentario?` 💬${c.comentario.slice(0,20)}`:""}</span></div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <span style={{fontSize:12,color:"#90CAF9"}}>⏱{c.horas||1}h</span>
                  <span style={{fontSize:12,fontWeight:"bold"}}>{fmt(c.valor)}</span>
                  <button onClick={()=>onEdit(c)} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:12,cursor:"pointer",padding:2}}>✏️</button>
                  <button onClick={()=>onDelete(c)} style={{background:"none",border:"none",color:"#ef9a9a",fontSize:12,cursor:"pointer",padding:2}}>🗑️</button>
                </div>
              </div>
            );})}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
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

function PorDisciplina({clases}) {
  const hoy=new Date();
  const [subDisc,setSubDisc]=useState("mes");
  const mesesDisp=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort().reverse();
  const mesActualStr=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  const [selMes,setSelMes]=useState(mesActualStr);
  const mesesOpts=["2026","2027","2028","2029","2030","2031"].map(a=>["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map(m=>`${m} ${a}`)).flat();
  const [tempADesde,setTempADesde]=useState(mesesOpts[0]);
  const [tempAHasta,setTempAHasta]=useState(mesesOpts[4]);
  const [tempBDesde,setTempBDesde]=useState(mesesOpts[12]);
  const [tempBHasta,setTempBHasta]=useState(mesesOpts[16]);

  function getStats(cf){
    const sk=cf.filter(c=>c.disciplina_clase==="ski");
    const sn=cf.filter(c=>c.disciplina_clase==="snow");
    const skiTotal=sk.reduce((s,c)=>s+c.valor,0);
    const snowTotal=sn.reduce((s,c)=>s+c.valor,0);
    const skiH={p:sk.filter(c=>c.tipo==="particular").reduce((s,c)=>s+(c.horas||1),0),c:sk.filter(c=>c.tipo==="colectiva").reduce((s,c)=>s+(c.horas||1),0),r:sk.filter(c=>c.tipo==="requerida").reduce((s,c)=>s+(c.horas||1),0)};
    const snowH={p:sn.filter(c=>c.tipo==="particular").reduce((s,c)=>s+(c.horas||1),0),c:sn.filter(c=>c.tipo==="colectiva").reduce((s,c)=>s+(c.horas||1),0),r:sn.filter(c=>c.tipo==="requerida").reduce((s,c)=>s+(c.horas||1),0)};
    return {skiTotal,snowTotal,skiH,snowH,skiHT:skiH.p+skiH.c+skiH.r,snowHT:snowH.p+snowH.c+snowH.r};
  }
  function mesStrToIdx(m){const[mes,anio]=m.split(" ");const ms=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];return`${anio}-${String(ms.indexOf(mes)+1).padStart(2,"0")}`;}
  function clasesPorRango(d,h){const di=mesStrToIdx(d),hi=mesStrToIdx(h);return clases.filter(c=>c.fecha.slice(0,7)>=di&&c.fecha.slice(0,7)<=hi);}

  function StatsPanel({stats}){
    const {skiTotal,snowTotal,skiH,snowH,skiHT,snowHT}=stats;
    const total=skiTotal+snowTotal;
    const skiPct=total>0?Math.round(skiTotal/total*100):50;
    const maxH=Math.max(skiH.p,skiH.c,skiH.r,snowH.p,snowH.c,snowH.r,1);
    const bars=[{l:"⛷️ Ski — Particular",h:skiH.p,c:"#6495ED"},{l:"⛷️ Ski — Colectiva",h:skiH.c,c:"#4DB6AC"},{l:"⛷️ Ski — Requerida",h:skiH.r,c:"#FFA726"},{l:"🏂 Snow — Particular",h:snowH.p,c:"#F06292"},{l:"🏂 Snow — Colectiva",h:snowH.c,c:"#26C6DA"},{l:"🏂 Snow — Requerida",h:snowH.r,c:"#FF7043"}];
    return(
      <>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          <div style={{background:"rgba(100,149,237,0.08)",border:"1px solid rgba(100,149,237,0.25)",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#6495ED",letterSpacing:1,marginBottom:5}}>⛷️ SKI</div>
            <div style={{fontSize:18,fontWeight:"bold"}}>{fmt(skiTotal)}</div>
            <div style={{fontSize:12,color:"#6495ED",marginTop:3}}>{skiHT}h</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:3}}>P.{skiH.p}h · C.{skiH.c}h · R.{skiH.r}h</div>
          </div>
          <div style={{background:"rgba(240,98,146,0.08)",border:"1px solid rgba(240,98,146,0.25)",borderRadius:12,padding:12,textAlign:"center"}}>
            <div style={{fontSize:10,color:"#F06292",letterSpacing:1,marginBottom:5}}>🏂 SNOW</div>
            <div style={{fontSize:18,fontWeight:"bold"}}>{fmt(snowTotal)}</div>
            <div style={{fontSize:12,color:"#F06292",marginTop:3}}>{snowHT}h</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:3}}>P.{snowH.p}h · C.{snowH.c}h · R.{snowH.r}h</div>
          </div>
        </div>
        <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:8}}>DESGLOSE HORAS</div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:12,marginBottom:12}}>
          {bars.map(b=>(<div key={b.l} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:b.c}}>{b.l}</span><span>{b.h}h</span></div><div style={{height:4,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.round(b.h/maxH*100)}%`,background:b.c,borderRadius:99}}/></div></div>))}
        </div>
        <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:8}}>PROPORCIÓN</div>
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:12}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:"#6495ED"}}>⛷️ Ski</span><span>{skiPct}%</span></div>
          <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden",marginBottom:10}}><div style={{height:"100%",width:`${skiPct}%`,background:"#6495ED",borderRadius:99}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:5}}><span style={{color:"#F06292"}}>🏂 Snow</span><span>{100-skiPct}%</span></div>
          <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${100-skiPct}%`,background:"#F06292",borderRadius:99}}/></div>
        </div>
      </>
    );
  }

  const clasesMes=clases.filter(c=>c.fecha.startsWith(selMes));
  const statsTA=getStats(clasesPorRango(tempADesde,tempAHasta));
  const statsTB=getStats(clasesPorRango(tempBDesde,tempBHasta));

  return (
    <div style={{paddingBottom:20}}>
      <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:14,gap:2}}>
        <button onClick={()=>setSubDisc("mes")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subDisc==="mes"?"rgba(79,195,247,0.15)":"transparent",color:subDisc==="mes"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📅 Por mes</button>
        <button onClick={()=>setSubDisc("temporada")} style={{flex:1,padding:"6px 0",border:"none",borderRadius:7,background:subDisc==="temporada"?"rgba(79,195,247,0.15)":"transparent",color:subDisc==="temporada"?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>📆 Por temporada</button>
      </div>
      {subDisc==="mes"&&(
        <>
          <select value={selMes} onChange={e=>setSelMes(e.target.value)} style={{width:"100%",fontSize:13,padding:"8px 10px",borderRadius:8,background:"#0d2a3a",border:"1px solid #4FC3F744",color:"#e8f4f8",marginBottom:14}}>
            {[...new Set([mesActualStr,...mesesDisp])].map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <StatsPanel stats={getStats(clasesMes)}/>
        </>
      )}
      {subDisc==="temporada"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            {[{label:"Temporada A",color:"#4FC3F7",border:"rgba(79,195,247,0.2)",bg:"rgba(79,195,247,0.04)",desde:tempADesde,hasta:tempAHasta,setDesde:setTempADesde,setHasta:setTempAHasta,stats:statsTA},{label:"Temporada B",color:"#81C784",border:"rgba(129,199,132,0.3)",bg:"rgba(129,199,132,0.05)",desde:tempBDesde,hasta:tempBHasta,setDesde:setTempBDesde,setHasta:setTempBHasta,stats:statsTB}].map((t,idx)=>(
              <div key={idx} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:12,padding:12}}>
                <div style={{fontSize:11,color:t.color,marginBottom:6}}>{t.label}</div>
                <div style={{fontSize:9,color:"#607d8b",marginBottom:3}}>Desde</div>
                <select value={t.desde} onChange={e=>t.setDesde(e.target.value)} style={{width:"100%",fontSize:10,padding:"3px 4px",borderRadius:6,background:"#0d2a3a",border:`1px solid ${t.border}`,color:"#e8f4f8",marginBottom:6}}>
                  {mesesOpts.map(m=><option key={m}>{m}</option>)}
                </select>
                <div style={{fontSize:9,color:"#607d8b",marginBottom:3}}>Hasta</div>
                <select value={t.hasta} onChange={e=>t.setHasta(e.target.value)} style={{width:"100%",fontSize:10,padding:"3px 4px",borderRadius:6,background:"#0d2a3a",border:`1px solid ${t.border}`,color:"#e8f4f8",marginBottom:10}}>
                  {mesesOpts.map(m=><option key={m}>{m}</option>)}
                </select>
                <div style={{fontSize:10,color:"#6495ED",marginBottom:3}}>⛷️ Ski</div>
                <div style={{fontSize:14,fontWeight:"bold"}}>{fmt(t.stats.skiTotal)}</div>
                <div style={{fontSize:11,color:"#6495ED"}}>{t.stats.skiHT}h</div>
                <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0"}}/>
                <div style={{fontSize:10,color:"#F06292",marginBottom:3}}>🏂 Snow</div>
                <div style={{fontSize:14,fontWeight:"bold"}}>{fmt(t.stats.snowTotal)}</div>
                <div style={{fontSize:11,color:"#F06292"}}>{t.stats.snowHT}h</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",marginBottom:10}}>COMPARATIVA TOTAL</div>
          <StatsPanel stats={{skiTotal:statsTA.skiTotal+statsTB.skiTotal,snowTotal:statsTA.snowTotal+statsTB.snowTotal,skiH:{p:statsTA.skiH.p+statsTB.skiH.p,c:statsTA.skiH.c+statsTB.skiH.c,r:statsTA.skiH.r+statsTB.skiH.r},snowH:{p:statsTA.snowH.p+statsTB.snowH.p,c:statsTA.snowH.c+statsTB.snowH.c,r:statsTA.snowH.r+statsTB.snowH.r},skiHT:statsTA.skiHT+statsTB.skiHT,snowHT:statsTA.snowHT+statsTB.snowHT}}/>
        </>
      )}
    </div>
  );
}

function TemporadasComp({clases}) {
  const mesesNombre=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const aniosDisp=[...new Set(clases.map(c=>c.fecha.slice(0,4)))].sort();
  const anios=aniosDisp.length>0?aniosDisp:["2025","2026"];
  const opcionesMes=anios.flatMap(a=>mesesNombre.map((m,i)=>({label:`${m} ${a}`,value:`${a}-${String(i+1).padStart(2,"0")}`})));

  const hoy=new Date();
  const mesActual=`${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}`;
  const mesHace6=new Date(hoy.getFullYear(),hoy.getMonth()-5,1);
  const mesHace6Str=`${mesHace6.getFullYear()}-${String(mesHace6.getMonth()+1).padStart(2,"0")}`;

  const [aDesde,setADesde]=useState(mesHace6Str);
  const [aHasta,setAHasta]=useState(mesActual);
  const [bDesde,setBDesde]=useState(()=>{
    const d=new Date(hoy.getFullYear()-1,hoy.getMonth()-5,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
  const [bHasta,setBHasta]=useState(()=>{
    const d=new Date(hoy.getFullYear()-1,hoy.getMonth(),1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });

  function calcTemp(desde,hasta){
    const cf=clases.filter(c=>c.fecha.slice(0,7)>=desde&&c.fecha.slice(0,7)<=hasta);
    const total=cf.reduce((s,c)=>s+c.valor,0);
    const horas=cf.reduce((s,c)=>s+(c.horas||1),0);
    const dias=new Set(cf.map(c=>c.fecha.slice(0,10))).size;
    const conteo={particular:0,colectiva:0,requerida:0};
    cf.forEach(c=>conteo[c.tipo]++);
    return {total,horas,dias,conteo,clases:cf.length};
  }

  const statsA=calcTemp(aDesde,aHasta);
  const statsB=calcTemp(bDesde,bHasta);
  const fmt=n=>"$"+Math.round(n).toLocaleString("es-CL");

  function MesSelect({value,onChange,color}){
    return (
      <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",fontSize:11,padding:"4px 6px",borderRadius:6,background:"#0d2a3a",border:`1px solid ${color}44`,color:"#e8f4f8",marginBottom:4}}>
        {opcionesMes.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  const diffTotal=statsA.total-statsB.total;
  const diffHoras=statsA.horas-statsB.horas;

  return (
    <div style={{paddingBottom:20}}>
      <div style={{fontSize:11,color:"#4FC3F7",letterSpacing:2,marginBottom:12}}>COMPARAR TEMPORADAS</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Temporada A",color:"#4FC3F7",border:"rgba(79,195,247,0.25)",bg:"rgba(79,195,247,0.04)",desde:aDesde,hasta:aHasta,setDesde:setADesde,setHasta:setAHasta,stats:statsA},
          {label:"Temporada B",color:"#81C784",border:"rgba(129,199,132,0.3)",bg:"rgba(129,199,132,0.05)",desde:bDesde,hasta:bHasta,setDesde:setBDesde,setHasta:setBHasta,stats:statsB},
        ].map((t,i)=>(
          <div key={i} style={{background:t.bg,border:`1px solid ${t.border}`,borderRadius:12,padding:12}}>
            <div style={{fontSize:11,color:t.color,fontWeight:600,marginBottom:8}}>{t.label}</div>
            <div style={{fontSize:9,color:"#607d8b",marginBottom:2}}>Desde</div>
            <MesSelect value={t.desde} onChange={t.setDesde} color={t.color}/>
            <div style={{fontSize:9,color:"#607d8b",marginBottom:2}}>Hasta</div>
            <MesSelect value={t.hasta} onChange={t.setHasta} color={t.color}/>
            <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0"}}/>
            <div style={{fontSize:18,fontWeight:"bold",color:"#fff"}}>{fmt(t.stats.total)}</div>
            <div style={{fontSize:11,color:t.color,marginTop:2}}>⏱ {t.stats.horas}h · {t.stats.clases} clases · {t.stats.dias} días</div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:"#4FC3F7",letterSpacing:2,marginBottom:10}}>COMPARATIVA A vs B</div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(79,195,247,0.15)",borderRadius:12,padding:14,marginBottom:12}}>
        {[
          {label:"💰 Ingresos",vA:statsA.total,vB:statsB.total,fmt:true},
          {label:"⏱ Horas",vA:statsA.horas,vB:statsB.horas,fmt:false},
          {label:"📚 Clases",vA:statsA.clases,vB:statsB.clases,fmt:false},
          {label:"📅 Días trabajados",vA:statsA.dias,vB:statsB.dias,fmt:false},
        ].map(row=>{
          const max=Math.max(row.vA,row.vB,1);
          const diff=row.vA-row.vB;
          return (
            <div key={row.label} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:4}}>
                <span style={{color:"#90CAF9"}}>{row.label}</span>
                <span style={{color:diff>0?"#81C784":diff<0?"#ef9a9a":"#607d8b",fontSize:10}}>
                  {diff!==0?(diff>0?"▲":"▼")+" "+(row.fmt?fmt(Math.abs(diff)):Math.abs(diff)):"="}
                </span>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#4FC3F7",minWidth:60,textAlign:"right"}}>{row.fmt?fmt(row.vA):row.vA}</span>
                <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.round(row.vA/max*100)}%`,background:"#4FC3F7",borderRadius:99}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center",marginTop:3}}>
                <span style={{fontSize:10,color:"#81C784",minWidth:60,textAlign:"right"}}>{row.fmt?fmt(row.vB):row.vB}</span>
                <div style={{flex:1,height:6,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${Math.round(row.vB/max*100)}%`,background:"#81C784",borderRadius:99}}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{padding:"10px",background:"rgba(79,195,247,0.06)",border:"1px solid rgba(79,195,247,0.2)",borderRadius:10,textAlign:"center"}}>
          <div style={{fontSize:10,color:"#4FC3F7",marginBottom:4}}>Temporada A</div>
          <div style={{fontSize:16,fontWeight:"bold"}}>{fmt(statsA.total)}</div>
          <div style={{fontSize:11,color:"#607d8b"}}>{statsA.horas}h totales</div>
        </div>
        <div style={{padding:"10px",background:"rgba(129,199,132,0.06)",border:"1px solid rgba(129,199,132,0.2)",borderRadius:10,textAlign:"center"}}>
          <div style={{fontSize:10,color:"#81C784",marginBottom:4}}>Temporada B</div>
          <div style={{fontSize:16,fontWeight:"bold"}}>{fmt(statsB.total)}</div>
          <div style={{fontSize:11,color:"#607d8b"}}>{statsB.horas}h totales</div>
        </div>
      </div>
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
            <TemporadasComp clases={clases}/>
          )}
        </>
      )}
    </div>
  );
}

function CalendarAddModal({fecha,tipo,onConfirm,onCancel,precios,personas,setPersonas,disc,discClase,setDiscClase}) {
  const [horas,setHoras]=useState(1);
  const [adicional,setAdicional]=useState(0);
  const [comentario,setComentario]=useState("");
  const tipoInfo=TIPOS.find(t=>t.key===tipo);
  const precioH=precios[tipo]||0;
  const precioAd=precios.adicional||0;
  const base=precios.colectiva_base||3;
  const extras=Math.max(0,personas-base);
  let valor=0;
  if(tipo==="particular"||tipo==="requerida") valor=precioH*horas+precioAd*adicional*horas;
  else valor=precios.colectiva*horas+precios.colectiva_extra*extras;
  const fechaLabel=new Date(fecha+"T12:00:00").toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  function confirmar(){
    onConfirm({tipo,valor,horas,adicional,personas:tipo==="colectiva"?personas:0,extras:tipo==="colectiva"?extras:0,comentario,disciplina_clase:disc==="polivalente"?(discClase[tipo]||"ski"):disc,fecha});
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
      <div style={{width:"100%",background:"#000000",borderTop:`2px solid ${tipoInfo?.color||"#4FC3F7"}`,borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
        <div style={{textAlign:"center",marginBottom:16}}>
          <div style={{fontSize:36,marginBottom:4}}>{tipoEmoji(tipo,disc)}</div>
          <div style={{fontSize:18,fontWeight:"bold",color:tipoInfo?.color}}>{tipoInfo?.label}</div>
          <div style={{fontSize:12,color:"#90CAF9",marginTop:4}}>{fechaLabel}</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:16}}>
          {disc==="polivalente"&&<div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:8,padding:3,marginBottom:12,gap:3}}>
            {[["ski","⛷️ Ski","#4FC3F7"],["snow","🏂 Snow","#F06292"]].map(([k,l,c])=>(
              <button key={k} onClick={()=>setDiscClase(p=>({...p,[tipo]:k}))} style={{flex:1,padding:"7px",border:"none",borderRadius:7,background:discClase[tipo]===k?(k==="ski"?"rgba(79,195,247,0.25)":"rgba(240,98,146,0.25)"):"transparent",color:discClase[tipo]===k?c:"#607d8b",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:discClase[tipo]===k?600:400,outline:discClase[tipo]===k?`1px solid ${c}`:"none"}}>{l}</button>
            ))}
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"8px 10px",background:`rgba(255,255,255,0.03)`,border:`1px solid ${tipoInfo?.color}33`,borderRadius:10}}>
            <span style={{fontSize:12,color:"#90CAF9"}}>⏱ Horas</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button onClick={()=>setHoras(h=>Math.max(1,h-1))} style={{width:30,height:30,borderRadius:"50%",background:`${tipoInfo?.color}22`,border:`1px solid ${tipoInfo?.color}`,color:tipoInfo?.color,fontSize:16,cursor:"pointer"}}>−</button>
              <span style={{fontSize:16,fontWeight:"bold",color:tipoInfo?.color,minWidth:28,textAlign:"center"}}>{horas}h</span>
              <button onClick={()=>setHoras(h=>h+1)} style={{width:30,height:30,borderRadius:"50%",background:`${tipoInfo?.color}22`,border:`1px solid ${tipoInfo?.color}`,color:tipoInfo?.color,fontSize:16,cursor:"pointer"}}>+</button>
            </div>
          </div>
          {tipo==="colectiva"&&(<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(84,110,122,0.2)",borderRadius:10}}>
              <span style={{fontSize:12,color:"#90CAF9"}}>👥 Personas</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>setPersonas(p=>Math.max(1,p-1))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>−</button>
                <span style={{fontSize:16,fontWeight:"bold",color:"#90A4AE",minWidth:28,textAlign:"center"}}>{personas}</span>
                <button onClick={()=>setPersonas(p=>p+1)} style={{width:30,height:30,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>+</button>
              </div>
            </div>
            {extras>0&&<div style={{fontSize:12,color:"#90A4AE",textAlign:"center",marginBottom:12}}>+{extras} extra{extras>1?"s":""} × {fmt(precios.colectiva_extra)} = +{fmt(precios.colectiva_extra*extras)}</div>}
          </>)}
          {(tipo==="particular"||tipo==="requerida")&&(<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${tipoInfo?.color}33`,borderRadius:10}}>
              <span style={{fontSize:12,color:"#90CAF9"}}>➕ Adicionales</span>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>setAdicional(a=>Math.max(0,a-1))} style={{width:30,height:30,borderRadius:"50%",background:`${tipoInfo?.color}22`,border:`1px solid ${tipoInfo?.color}`,color:tipoInfo?.color,fontSize:16,cursor:"pointer"}}>−</button>
                <span style={{fontSize:16,fontWeight:"bold",color:tipoInfo?.color,minWidth:28,textAlign:"center"}}>{adicional}</span>
                <button onClick={()=>setAdicional(a=>a+1)} style={{width:30,height:30,borderRadius:"50%",background:`${tipoInfo?.color}22`,border:`1px solid ${tipoInfo?.color}`,color:tipoInfo?.color,fontSize:16,cursor:"pointer"}}>+</button>
              </div>
            </div>
            {adicional>0&&<div style={{fontSize:12,color:tipoInfo?.color,textAlign:"center",marginBottom:12}}>+{adicional} × {fmt(precioAd)} × {horas}h = +{fmt(precioAd*adicional*horas)}</div>}
          </>)}
          <div style={{marginBottom:0}}>
            <div style={{fontSize:11,color:comentario?"#4FC3F7":"#607d8b",cursor:"pointer",marginBottom:4}} onClick={()=>setComentario(c=>c===false?"":false)}>{comentario!==false?"✏️ Ocultar comentario":"✏️ Comentario"}</div>
            {comentario!==false&&<textarea placeholder="Comentario..." value={comentario} onChange={e=>setComentario(e.target.value)} rows={2} style={{width:"100%",background:"rgba(0,0,0,0.3)",border:`1px solid ${tipoInfo?.color}44`,borderRadius:8,color:"#e8f4f8",padding:"8px",fontSize:13,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>}
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:14,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"#90CAF9"}}>{fmt(precioH)} × {horas}h</span>
            <span style={{fontSize:12,color:"#fff"}}>{fmt(precioH*horas)}</span>
          </div>
          {tipo==="colectiva"&&extras>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"#90CAF9"}}>Extras ({extras} × {fmt(precios.colectiva_extra)})</span>
            <span style={{fontSize:12,color:"#90A4AE"}}>+{fmt(precios.colectiva_extra*extras)}</span>
          </div>}
          {(tipo==="particular"||tipo==="requerida")&&adicional>0&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,color:"#90CAF9"}}>Adicionales ({adicional} × {fmt(precioAd)} × {horas}h)</span>
            <span style={{fontSize:12,color:"#81C784"}}>+{fmt(precioAd*adicional*horas)}</span>
          </div>}
          <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:14,color:"#90CAF9",fontWeight:500}}>Total</span>
            <span style={{fontSize:22,fontWeight:"bold",color:"#fff"}}>{fmt(valor)}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
          <button onClick={confirmar} style={{flex:2,padding:"14px",background:`linear-gradient(90deg,${tipoInfo?.color||"#0277bd"},${tipoInfo?.color||"#0288d1"})`,border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>✅ Confirmar</button>
        </div>
      </div>
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
  const [adicionalNuevaClase,setAdicionalNuevaClase]=useState({particular:0,requerida:0});
  const [discClase,setDiscClase]=useState({particular:"ski",colectiva:"ski",requerida:"ski"});
  const [showConfig,setShowConfig]=useState(false);
  const [tempPrecios,setTempPrecios]=useState(DEFAULT_PRECIOS);
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
  const [recordar,setRecordar]=useState(false);
  const [pendientesCount,setPendientesCount]=useState(0);
  const [resumenMensual,setResumenMensual]=useState(true);
  const [pushNotif,setPushNotif]=useState(false);
  const [confirmandoTipo,setConfirmandoTipo]=useState(null);
  const [recoveryUser,setRecoveryUser]=useState(null);
  const [newPass,setNewPass]=useState("");
  const [newPassError,setNewPassError]=useState("");
  const [editandoClase,setEditandoClase]=useState(null);
  const [eliminandoClase,setEliminandoClase]=useState(null);
  const [fechaSeleccionada,setFechaSeleccionada]=useState(null);
  const [calendarAddFecha,setCalendarAddFecha]=useState(null);
  const [calendarAddTipo,setCalendarAddTipo]=useState(null);
  const [calendarAddPersonas,setCalendarAddPersonas]=useState(1);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{if(session) handleAuth(session.user);else setLoading(false);});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==="PASSWORD_RECOVERY"&&session){setRecoveryUser(session.user);setLoading(false);return;}if(session) handleAuth(session.user);else{setUser(null);setProfile(null);setLoading(false);}});
    return ()=>subscription.unsubscribe();
  },[]);

  async function handleAuth(u) {
    setUser(u);
    await supabase.from("sesiones").insert({user_id:u.id});
    await supabase.from("profiles").update({last_seen:new Date().toISOString()}).eq("id",u.id);
    let {data:prof}=await supabase.from("profiles").select("*").eq("id",u.id).single();
    if(!prof){
      await supabase.from("profiles").insert({id:u.id,email:u.email,nombre:u.user_metadata?.nombre||"",aprobado:false,is_admin:false,disciplina:"ski",resumen_mensual:true});
      const {data:newProf}=await supabase.from("profiles").select("*").eq("id",u.id).single();
      prof=newProf;
    }
    setProfile(prof);
    setResumenMensual(prof?.resumen_mensual!==false);
    setRecordar(prof?.recordar===true);
    if(prof?.aprobado||prof?.is_admin){
      const {data:prec}=await supabase.from("precios").select("*").eq("user_id",u.id).single();
      if(prec){
        setPrecios({
          particular:prec.particular,
          colectiva:prec.colectiva,
          colectiva_extra:prec.colectiva_extra,
          colectiva_base:prec.colectiva_base,
          requerida:prec.requerida,
          adicional:prec.adicional||0,
          mostrar_monto:prec.mostrar_monto!==false
        });
        setPersonas(prec.colectiva_base||3);
      }
      const {data:cls}=await supabase.from("clases").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(cls){setClases(cls);const c={};cls.forEach(x=>{if(x.comentario) c[x.id]=x.comentario;});setComentarios(c);}
      const {data:desc}=await supabase.from("descuentos").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(desc) setDescuentos(desc);
      const {data:ot}=await supabase.from("otros").select("*").eq("user_id",u.id).order("fecha",{ascending:true});
      if(ot) setOtros(ot);
    }
    if(prof?.is_admin){
      const {data:pendientes}=await supabase.from("profiles").select("id").eq("aprobado",false).eq("is_admin",false);
      if(pendientes) setPendientesCount(pendientes.length);
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
    if(disc!=="polivalente") setDiscClase({particular:disc,colectiva:disc,requerida:disc});
  }

  function calcularValor(tipo,horas,adicional) {
    const h=horas||1;
    const ad=adicional||0;
    if(tipo==="particular") return precios.particular*h+precios.adicional*ad*h;
    if(tipo==="requerida") return precios.requerida*h+precios.adicional*ad*h;
    const extras=Math.max(0,personas-precios.colectiva_base);
    const extraValor=precios.colectiva_extra*extras;
    return precios.colectiva*h+extraValor;
  }

  async function agregarClase(tipo) {
    const horas=horasNuevaClase[tipo]||1;
    const adicional=(tipo==="particular"||tipo==="requerida")?(adicionalNuevaClase[tipo]||0):0;
    const valor=calcularValor(tipo,horas,adicional);
    const extras=tipo==="colectiva"?Math.max(0,personas-precios.colectiva_base):0;
    const comentario=comentarioPrevio[tipo]||"";
    const disc=profile?.disciplina||"ski";
    const disc_clase=disc==="polivalente"?discClase[tipo]:disc;
    const fechaClase=fechaSeleccionada||(new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")+"-"+String(new Date().getDate()).padStart(2,"0"));
    const {data,error}=await supabase.from("clases").insert({user_id:user.id,tipo,valor,personas:tipo==="colectiva"?personas:0,extras,adicional,comentario:comentario||null,horas,fecha:fechaClase+"T"+localISOString().slice(11),disciplina_clase:disc_clase}).select().single();
    if(!error&&data){setClases(prev=>[...prev,data]);if(comentario.trim()) setComentarios(p=>({...p,[data.id]:comentario}));}
    setComentarioPrevio(p=>({...p,[tipo]:""}));
    setMostrarComentarioPrevio(p=>({...p,[tipo]:false}));
    setHorasNuevaClase(p=>({...p,[tipo]:1}));
    if(tipo==="particular"||tipo==="requerida") setAdicionalNuevaClase(p=>({...p,[tipo]:0}));
    setFechaSeleccionada(null);
  }

  async function handleCalendarAdd({tipo,valor,horas,adicional,personas,extras,comentario,disciplina_clase,fecha}) {
    const fechaClase=fecha+"T"+localISOString().slice(11);
    const {data,error}=await supabase.from("clases").insert({user_id:user.id,tipo,valor,personas:tipo==="colectiva"?personas:0,extras,adicional,comentario:comentario||null,horas,fecha:fechaClase,disciplina_clase}).select().single();
    if(!error&&data){setClases(prev=>[...prev,data]);}
    setCalendarAddFecha(null);setCalendarAddTipo(null);
  }

  async function eliminarUltimaDeTipo(tipo) {
    const ultima=[...clases].filter(c=>c.tipo===tipo&&c.fecha.startsWith(mes)).pop();
    if(!ultima) return;
    await supabase.from("clases").delete().eq("id",ultima.id);
    setClases(prev=>prev.filter(c=>c.id!==ultima.id));
  }

  async function handleEliminarClase(id) {
    await supabase.from("clases").delete().eq("id",id);
    setClases(prev=>prev.filter(c=>c.id!==id));
    setEliminandoClase(null);
  }

  async function handleGuardarEdit(clase) {
    const {data,error}=await supabase.from("clases").update({
      tipo:clase.tipo, valor:clase.valor, personas:clase.personas||0,
      extras:clase.extras||0, adicional:clase.adicional||0, comentario:clase.comentario||null,
      horas:clase.horas||1, disciplina_clase:clase.disciplina_clase||disc
    }).eq("id",clase.id).select().single();
    if(!error&&data){setClases(prev=>prev.map(c=>c.id===data.id?data:c));if(clase.comentario) setComentarios(p=>({...p,[data.id]:clase.comentario}));}
    setEditandoClase(null);
  }

  async function agregarDescuento() {
    const val=parseInt(descuentoInput.replace(/\D/g,""));
    if(!val||val<=0) return;
    const {data,error}=await supabase.from("descuentos").insert({user_id:user.id,valor:val,fecha:localISOString()}).select().single();
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
    const {data,error}=await supabase.from("otros").insert({user_id:user.id,nombre:nuevoOtroNombre.trim(),tipo:showAgregarOtro,valor:val,fecha:localISOString()}).select().single();
    if(!error&&data) setOtros(prev=>[...prev,data]);
    setNuevoOtroNombre(""); setNuevoOtroMonto(""); setShowAgregarOtro(null);
  }

  async function eliminarOtro(id){
    await supabase.from("otros").delete().eq("id",id);
    setOtros(prev=>prev.filter(o=>o.id!==id));
  }

  async function togglePush(v){
    setPushNotif(v);
    if(v){
      try{
        const perm=await Notification.requestPermission();
        if(perm!=="granted"){setPushNotif(false);return;}
        const reg=await navigator.serviceWorker.ready;
        const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:VAPID_PUBLIC_KEY});
        await fetch("/api/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id,subscription:sub.toJSON()})});
      }catch(e){setPushNotif(false);}
    }else{
      if('serviceWorker' in navigator){
        try{
          const reg=await navigator.serviceWorker.ready;
          const sub=await reg.pushManager.getSubscription();
          if(sub)await sub.unsubscribe();
        }catch{}
      }
      await fetch("/api/subscribe",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:user.id})});
    }
  }

  async function guardarPrecios() {
    await supabase.from("profiles").update({recordar,resumen_mensual:resumenMensual}).eq("id",user.id);
    await supabase.from("precios").update({
      particular:tempPrecios.particular,
      colectiva:tempPrecios.colectiva,
      colectiva_extra:tempPrecios.colectiva_extra,
      colectiva_base:tempPrecios.colectiva_base,
      requerida:tempPrecios.requerida,
      adicional:tempPrecios.adicional||0,
      mostrar_monto:tempPrecios.mostrar_monto
    }).eq("user_id",user.id);
    setPrecios({...tempPrecios});
    setPersonas(p=>Math.max(tempPrecios.colectiva_base||3,p));
    setShowConfig(false);
  }

  if(loading) return <div style={{minHeight:"100vh",background:"#000000",display:"flex",alignItems:"center",justifyContent:"center",color:"#4FC3F7",fontFamily:"system-ui,sans-serif",fontSize:16}}>⛷️ Cargando...</div>;
  if(!user) return <AuthScreen onAuth={handleAuth}/>;
  if(profile&&!profile.aprobado&&!profile.is_admin) return <PendienteScreen user={user} onLogout={logout}/>;
  if(recoveryUser) return (
    <div style={{minHeight:"100vh",background:"#000000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{width:"100%",maxWidth:360,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🔑</div>
        <div style={{fontSize:18,fontWeight:"bold",marginBottom:6}}>Restablecer contraseña</div>
        <div style={{fontSize:13,color:"#90CAF9",lineHeight:1.6,marginBottom:24}}>Ingresa tu nueva contraseña.</div>
        <input type="password" placeholder="Nueva contraseña (mín. 6 caracteres)" value={newPass} onChange={e=>{setNewPass(e.target.value);setNewPassError("");}} onKeyDown={async e=>{if(e.key!=="Enter") return;if(newPass.length<6){setNewPassError("Mínimo 6 caracteres");return;}const{error}=await supabase.auth.updateUser({password:newPass});if(error) setNewPassError(error.message);else{setRecoveryUser(null);setNewPass("");}}} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:12,color:"#fff",padding:"14px 16px",fontSize:15,marginBottom:12,boxSizing:"border-box",fontFamily:"inherit"}}/>
        {newPassError&&<div style={{color:"#ef9a9a",fontSize:13,marginBottom:12}}>{newPassError}</div>}
        <button onClick={async()=>{if(newPass.length<6){setNewPassError("Mínimo 6 caracteres");return;}const{error}=await supabase.auth.updateUser({password:newPass});if(error) setNewPassError(error.message);else{setRecoveryUser(null);setNewPass("");}}} style={{width:"100%",padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>Cambiar contraseña</button>
      </div>
    </div>
  );
  if(showAdmin&&profile?.is_admin) return <AdminPanel onBack={()=>setShowAdmin(false)} pendientesCount={pendientesCount} setPendientesCount={setPendientesCount}/>;

  const disc=profile?.disciplina||"ski";
  const mostrarMonto=precios.mostrar_monto!==false;
  const base=precios.colectiva_base||3;
  const clasesMes=clases.filter(c=>{
    if(!c.fecha.startsWith(mes)) return false;
    if(disc==="polivalente") return true;
    return (c.disciplina_clase||"ski")===disc;
  });
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
  const mesesDisponibles=[...new Set(clases.map(c=>c.fecha.slice(0,7)))].sort().reverse();
  const extrasActuales=Math.max(0,personas-base);
  const colectivaPreview=calcularValor("colectiva",horasNuevaClase.colectiva);

  return (
    <div style={{minHeight:"100vh",background:"#000000",fontFamily:"system-ui,sans-serif",color:"#e8f4f8"}}>
      <div style={{background:"linear-gradient(90deg,#0d2a3a,#1a3a50)",borderBottom:"2px solid #4FC3F7",padding:"16px 20px 0",position:"sticky",top:0,zIndex:10}}>

        {/* CAMBIO 2: Selector ski/snow */}
        <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:8,padding:2,marginBottom:10,width:"fit-content",gap:2}}>
          {[["ski","⛷️","Ski","#4FC3F7","rgba(79,195,247,0.2)"],["snow","🏂","Snow","#FFA726","rgba(255,167,38,0.2)"],["polivalente","🎿","Polivalente","#DA77F2","rgba(218,119,242,0.2)"]].map(([k,em,l,col,bg])=>(
            <button key={k} onClick={()=>setDisciplina(k)} style={{padding:"4px 14px",display:"flex",alignItems:"center",gap:5,cursor:"pointer",border:"none",borderRadius:7,background:disc===k?bg:"transparent",outline:disc===k?`1px solid ${col}`:"none",fontFamily:"inherit"}}>
              <span style={{fontSize:15}}>{em}</span>
              <span style={{fontSize:12,color:disc===k?col:"#607d8b",fontWeight:disc===k?"bold":"normal"}}>{l}</span>
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
              <div style={{fontSize:10,letterSpacing:3,color:disc==="snow"?"#FFA726":disc==="polivalente"?"#DA77F2":"#4FC3F7",textTransform:"uppercase"}}>{disc==="snow"?"🏂 Snow Instructor":disc==="polivalente"?"🎿 Instructor Polivalente":"⛷️ Ski Instructor"}</div>
              <div style={{fontSize:18,fontWeight:"bold",color:"#fff"}}>{profile?.nombre||profile?.email?.split("@")[0]||"Mi cuenta"}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {profile?.is_admin&&<div style={{position:"relative"}}>
              <button onClick={()=>setShowAdmin(true)} style={{background:"rgba(255,183,77,0.15)",border:"1px solid #FFB74D",borderRadius:10,color:"#FFB74D",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>👑</button>
              {pendientesCount>0&&<div style={{position:"absolute",top:-4,right:-4,width:10,height:10,borderRadius:"50%",background:"#ef5350",border:"2px solid #0d2a3a"}}/>}
            </div>}
            <button onClick={()=>{setTempPrecios({...precios});setShowConfig(true);}} style={{background:"rgba(79,195,247,0.15)",border:"1px solid #4FC3F7",borderRadius:10,color:"#4FC3F7",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>⚙️</button>
            <button onClick={logout} style={{background:"rgba(239,83,80,0.1)",border:"1px solid #ef535055",borderRadius:10,color:"#ef9a9a",padding:"8px 10px",fontSize:12,cursor:"pointer"}}>↩</button>
          </div>
        </div>


        <div style={{display:"flex"}}>
          {[["registro","📝 Registro"],["calendario","📊 Estadísticas"]].map(([key,label])=>(
            <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"10px 0",background:tab===key?"rgba(79,195,247,0.15)":"transparent",border:"none",borderBottom:tab===key?"2px solid #4FC3F7":"2px solid transparent",color:tab===key?"#4FC3F7":"#607d8b",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 20px 100px"}}>
        {tab!=="calendario"&&(
          <div style={{background:"linear-gradient(135deg,#0d2a3a,#1a3a50)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:18,padding:"18px 20px",marginBottom:20,textAlign:"center"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <button onClick={()=>{const [y,m]=mes.split("-").map(Number);const d=new Date(y,m-2,1);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{background:"rgba(79,195,247,0.1)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:8,color:"#4FC3F7",width:32,height:32,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
              <div>
                <div style={{fontSize:10,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:2}}>MES ACTUAL</div>
                <div style={{fontSize:14,fontWeight:"bold",color:"#fff",textTransform:"capitalize"}}>{new Date(mes+"-15").toLocaleDateString("es-CL",{month:"long",year:"numeric"})}</div>
              </div>
              <button onClick={()=>{const [y,m]=mes.split("-").map(Number);const d=new Date(y,m,1);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}} style={{background:"rgba(79,195,247,0.1)",border:"1px solid rgba(79,195,247,0.3)",borderRadius:8,color:"#4FC3F7",width:32,height:32,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
            </div>
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
            <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",justifyContent:"center",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:"#607d8b"}}>Total horas del mes</span>
              <span style={{fontSize:13,fontWeight:"bold",color:"#4FC3F7",background:"rgba(79,195,247,0.1)",border:"1px solid #4FC3F744",borderRadius:8,padding:"3px 10px"}}>⏱ {totalHorasMes}h</span>
            </div>
          </div>
        )}

        {tab==="calendario"&&(
          <>
            <div style={{display:"flex",background:"rgba(255,255,255,0.05)",borderRadius:10,padding:3,marginBottom:16}}>
              {[["calendario","🗓️ Calendario"],["pordia","📅 Por Día"],["pormes","📊 Por Mes"],...(disc==="polivalente"?[["disciplina","🎿 Disciplina"]]:[])]
                .map(([key,label])=>(
                  <button key={key} onClick={()=>setSubTabCal(key)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,background:subTabCal===key?"rgba(79,195,247,0.15)":"transparent",color:subTabCal===key?"#4FC3F7":"#607d8b",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{label}</button>
                ))}
            </div>
            {subTabCal==="calendario"&&<Calendario clases={clases} disc={disc} onDelete={(c)=>setEliminandoClase(c)} onEdit={(c)=>setEditandoClase({...c})} onAddForDate={(fecha,tipo)=>{setCalendarAddFecha(fecha);setCalendarAddTipo(tipo);}}/>}
            {subTabCal==="pordia"&&<PorDia clases={clases} disc={disc} onDelete={(c)=>setEliminandoClase(c)} onEdit={(c)=>setEditandoClase({...c})}/>}
            {subTabCal==="pormes"&&<PorMes clases={clases}/>}
            {subTabCal==="disciplina"&&disc==="polivalente"&&<PorDisciplina clases={clases}/>}
          </>
        )}

        {tab==="registro"&&(
          <>
            <div style={{fontSize:11,letterSpacing:2,color:"#4FC3F7",textTransform:"uppercase",marginBottom:12}}>Registrar clase</div>

            {/* COLECTIVA */}
            <div style={{background:"#0d1a1f",border:"1px solid rgba(84,110,122,0.3)",borderRadius:14,padding:"16px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,color:"#90A4AE",fontWeight:"bold"}}>👥 Colectiva</div>
                {disc==="polivalente"&&<div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:7,padding:2,gap:2}}>
                  {[["ski","⛷️"],["snow","🏂"]].map(([kd,em])=>(
                    <button key={kd} onClick={()=>setDiscClase(p=>({...p,colectiva:kd}))} style={{padding:"6px 13px",border:"none",borderRadius:7,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:discClase.colectiva===kd?(kd==="ski"?"rgba(79,195,247,0.25)":"rgba(240,98,146,0.25)"):"transparent",color:discClase.colectiva===kd?(kd==="ski"?"#4FC3F7":"#F06292"):"#607d8b",fontWeight:discClase.colectiva===kd?600:400,outline:discClase.colectiva===kd?`1px solid ${kd==="ski"?"#4FC3F7":"#F06292"}`:"none"}}>{em} {kd==="ski"?"Ski":"Snow"}</button>
                  ))}
                </div>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Precio base (incluye {base} pers.)</span>
                <span style={{fontSize:12,color:"#90A4AE",fontWeight:"bold"}}>{fmt(precios.colectiva)}/h</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>Personas en clase</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setPersonas(p=>Math.max(1,p-1))} style={{width:32,height:32,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:18,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:22,fontWeight:"bold",color:"#fff",minWidth:24,textAlign:"center"}}>{personas}</span>
                  <button onClick={()=>setPersonas(p=>p+1)} style={{width:32,height:32,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:18,cursor:"pointer"}}>+</button>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <span style={{fontSize:12,color:extrasActuales>0?"#90A4AE":"#607d8b"}}>{extrasActuales>0?`${extrasActuales} extra${extrasActuales>1?"s":""} × ${fmt(precios.colectiva_extra)}${precios.extra_por_hora?"/h":""}`:`Sin extras (base = ${base} pers.)`}</span>
                <span style={{fontSize:12,color:extrasActuales>0?"#90A4AE":"#607d8b"}}>{extrasActuales>0?`+ ${fmt(precios.colectiva_extra*extrasActuales)}`:"+$0"}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,padding:"8px 10px",background:"rgba(84,110,122,0.05)",border:"1px solid rgba(84,110,122,0.15)",borderRadius:10}}>
                <span style={{fontSize:12,color:"#90CAF9"}}>⏱ Duración</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <button onClick={()=>setHorasNuevaClase(p=>({...p,colectiva:Math.max(1,p.colectiva-1)}))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:16,fontWeight:"bold",color:"#90A4AE",minWidth:28,textAlign:"center"}}>{horasNuevaClase.colectiva}h</span>
                  <button onClick={()=>setHorasNuevaClase(p=>({...p,colectiva:p.colectiva+1}))} style={{width:30,height:30,borderRadius:"50%",background:"rgba(84,110,122,0.2)",border:"1px solid #546E7A",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>+</button>
                </div>
              </div>
              <div style={{borderTop:"1px solid rgba(84,110,122,0.2)",paddingTop:8,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,color:"#607d8b"}}>{fmt(precios.colectiva)} × {horasNuevaClase.colectiva}h{extrasActuales>0?" + extras":""}</span>
                  <span style={{fontSize:15,fontWeight:"bold",color:"#fff"}}>{fmt(colectivaPreview)}</span>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <button onClick={()=>setMostrarComentarioPrevio(p=>({...p,colectiva:!p.colectiva}))} style={{background:"none",border:"none",color:mostrarComentarioPrevio.colectiva?"#90A4AE":"#607d8b",fontSize:12,cursor:"pointer",padding:0}}>{mostrarComentarioPrevio.colectiva?"✏️ Ocultar comentario":"✏️ Agregar comentario"}</button>
                {mostrarComentarioPrevio.colectiva&&<textarea placeholder="Escribe un comentario..." value={comentarioPrevio.colectiva} onChange={e=>setComentarioPrevio(p=>({...p,colectiva:e.target.value}))} rows={2} style={{width:"100%",marginTop:6,background:"#0a1e0a",border:"1px solid #546E7A55",borderRadius:8,color:"#e8f4f8",padding:"8px",fontSize:13,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>}
              </div>
              <button onClick={()=>setConfirmandoTipo("colectiva")} style={{width:"100%",padding:"13px",background:"linear-gradient(90deg,#37474F,#455A64)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",marginBottom:8}}>+ Agregar Clase Colectiva</button>
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
                  {disc==="polivalente"&&<div style={{display:"flex",background:"rgba(255,255,255,0.06)",borderRadius:7,padding:2,gap:2,justifyContent:"center",marginBottom:8}}>
                    {[["ski","⛷️"],["snow","🏂"]].map(([kd,em])=>(
                      <button key={kd} onClick={()=>setDiscClase(p=>({...p,[t.key]:kd}))} style={{padding:"6px 13px",border:"none",borderRadius:7,fontSize:12,cursor:"pointer",fontFamily:"inherit",background:discClase[t.key]===kd?(kd==="ski"?"rgba(79,195,247,0.25)":"rgba(240,98,146,0.25)"):"transparent",color:discClase[t.key]===kd?(kd==="ski"?"#4FC3F7":"#F06292"):"#607d8b",fontWeight:discClase[t.key]===kd?600:400,outline:discClase[t.key]===kd?`1px solid ${kd==="ski"?"#4FC3F7":"#F06292"}`:"none"}}>{em} {kd==="ski"?"Ski":"Snow"}</button>
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
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,padding:"6px 8px",background:`rgba(${t.key==="particular"?"79,195,247":"255,183,77"},0.05)`,border:`1px solid rgba(${t.key==="particular"?"79,195,247":"255,183,77"},0.15)`,borderRadius:8}}>
                    <span style={{fontSize:11,color:"#607d8b"}}>➕</span>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>setAdicionalNuevaClase(p=>({...p,[t.key]:Math.max(0,p[t.key]-1)}))} style={{background:"none",border:"none",color:t.color,fontSize:16,cursor:"pointer",padding:"0 4px"}}>−</button>
                      <span style={{fontSize:13,fontWeight:"bold",color:t.color,minWidth:24,textAlign:"center"}}>{adicionalNuevaClase[t.key]||0}</span>
                      <button onClick={()=>setAdicionalNuevaClase(p=>({...p,[t.key]:(p[t.key]||0)+1}))} style={{background:"none",border:"none",color:t.color,fontSize:16,cursor:"pointer",padding:"0 4px"}}>+</button>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#607d8b",textAlign:"center",marginBottom:8}}>
                    {fmt(precios[t.key])} × {horasNuevaClase[t.key]}h{(adicionalNuevaClase[t.key]||0)>0?` + ${adicionalNuevaClase[t.key]}×${fmt(precios.adicional)}×${horasNuevaClase[t.key]}h`:""} = <strong style={{color:t.color}}>{fmt(calcularValor(t.key,horasNuevaClase[t.key],adicionalNuevaClase[t.key]||0))}</strong>
                  </div>
                  <div style={{marginBottom:6}}>
                    <button onClick={()=>setMostrarComentarioPrevio(p=>({...p,[t.key]:!p[t.key]}))} style={{background:"none",border:"none",color:mostrarComentarioPrevio[t.key]?t.color:"#607d8b",fontSize:11,cursor:"pointer",padding:0,width:"100%"}}>{mostrarComentarioPrevio[t.key]?"✏️ Ocultar":"✏️ Comentario"}</button>
                    {mostrarComentarioPrevio[t.key]&&<textarea placeholder="Comentario..." value={comentarioPrevio[t.key]} onChange={e=>setComentarioPrevio(p=>({...p,[t.key]:e.target.value}))} rows={2} style={{width:"100%",marginTop:4,background:"rgba(0,0,0,0.3)",border:`1px solid ${t.color}44`,borderRadius:8,color:"#e8f4f8",padding:"6px 8px",fontSize:12,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>}
                  </div>
                  <button onClick={()=>setConfirmandoTipo(t.key)} style={{width:"100%",padding:"10px",background:t.bg,border:`1px solid ${t.color}88`,borderRadius:10,color:t.color,fontSize:13,fontWeight:"bold",cursor:"pointer",marginBottom:6}}>+ Agregar</button>
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

      {confirmandoTipo&&(()=>{
        const tipo=confirmandoTipo;
        const horas=horasNuevaClase[tipo]||1;
        const adicional=(tipo==="particular"||tipo==="requerida")?(adicionalNuevaClase[tipo]||0):0;
        const valor=calcularValor(tipo,horas,adicional);
        const extras=tipo==="colectiva"?Math.max(0,personas-precios.colectiva_base):0;
        const tipoInfo=TIPOS.find(t=>t.key===tipo);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
            <div style={{width:"100%",background:"#000000",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px"}}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:36,marginBottom:8}}>{tipoEmoji(tipo,disc)}</div>
                <div style={{fontSize:18,fontWeight:"bold",color:tipoInfo?.color}}>{tipoInfo?.label}</div>
              </div>
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:13,color:"#90CAF9"}}>Precio por hora</span>
                  <span style={{fontSize:13,color:"#fff"}}>{fmt(precios[tipo])}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:13,color:"#90CAF9"}}>⏱ Horas</span>
                  <span style={{fontSize:13,color:"#fff"}}>× {horas}h</span>
                </div>
                {tipo==="colectiva"&&(
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:13,color:"#90CAF9"}}>Personas</span>
                      <span style={{fontSize:13,color:"#fff"}}>{personas}</span>
                    </div>
                    {extras>0&&(
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:13,color:"#90CAF9"}}>Extras ({extras} × {fmt(precios.colectiva_extra)})</span>
                        <span style={{fontSize:13,color:"#90A4AE"}}>{"+"}{fmt(precios.colectiva_extra*extras)}</span>
                      </div>
                    )}
                  </>
                )}
                {(tipo==="particular"||tipo==="requerida")&&adicional>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:13,color:"#90CAF9"}}>Adicionales ({adicional} × {fmt(precios.adicional)} × {horas}h)</span>
                    <span style={{fontSize:13,color:"#81C784"}}>{"+"}{fmt(precios.adicional*adicional*horas)}</span>
                  </div>
                )}
                <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,color:"#90CAF9",fontWeight:500}}>Total</span>
                  <span style={{fontSize:22,fontWeight:"bold",color:"#fff"}}>{fmt(valor)}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setConfirmandoTipo(null)} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                <button onClick={()=>{agregarClase(tipo);setConfirmandoTipo(null);}} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>✅ Confirmar clase</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete confirmation modal */}
      {eliminandoClase&&(()=>{
        const c=eliminandoClase;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setEliminandoClase(null)}>
            <div style={{width:"100%",background:"#000000",borderTop:"2px solid #ef5350",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
              <div style={{fontSize:40,marginBottom:8}}>🗑️</div>
              <div style={{fontSize:17,fontWeight:"bold",marginBottom:6}}>Eliminar clase</div>
              <div style={{fontSize:13,color:"#90CAF9",marginBottom:16}}>
                {tipoEmoji(c.tipo,disc)} {TIPOS.find(t=>t.key===c.tipo)?.label} — {fmt(c.valor)} · ⏱{c.horas||1}h
                {c.tipo==="colectiva"&&` · ${c.personas} pers.`}
                {(c.tipo==="particular"||c.tipo==="requerida")&&(c.adicional||0)>0&&` · +${c.adicional} adicional${(c.adicional||0)>1?"es":""}`}
                {c.comentario&&` · "${c.comentario.slice(0,30)}"`}
              </div>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setEliminandoClase(null)} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                <button onClick={()=>handleEliminarClase(c.id)} style={{flex:2,padding:"14px",background:"rgba(239,83,80,0.2)",border:"1px solid #ef5350",borderRadius:12,color:"#ef9a9a",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>🗑️ Eliminar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit class modal */}
      {editandoClase&&(()=>{
        const c=editandoClase;
        const tiposEdit=TIPOS;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:200}}>
            <div style={{width:"100%",background:"#000000",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
              <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>✏️ Editar clase</div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>Tipo</div>
                <div style={{display:"flex",gap:6}}>
                  {tiposEdit.map(t=>(
                    <button key={t.key} onClick={()=>setEditandoClase(p=>{const h=p.horas||1;const ad=p.adicional||0;const tk=t.key;if(tk==="particular"||tk==="requerida")return{...p,tipo:tk,valor:precios[tk]*h+precios.adicional*ad*h};const ex=Math.max(0,(p.personas||0)-precios.colectiva_base);return{...p,tipo:tk,valor:precios.colectiva*h+precios.colectiva_extra*ex*h}})} style={{flex:1,padding:"8px",border:"none",borderRadius:8,background:c.tipo===t.key?t.bg:"rgba(255,255,255,0.04)",color:c.tipo===t.key?t.color:"#607d8b",fontSize:12,cursor:"pointer",fontWeight:c.tipo===t.key?"bold":"normal",fontFamily:"inherit",outline:c.tipo===t.key?`1px solid ${t.color}`:"none"}}>{tipoEmoji(t.key,disc)} {t.label}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                <div>
                  <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>⏱ Horas</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>setEditandoClase(p=>{const h=Math.max(1,(p.horas||1)-1);return{...p,horas:h,valor:calcularValor(p.tipo,h,p.adicional)}})} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:16,cursor:"pointer"}}>−</button>
                    <span style={{fontSize:16,fontWeight:"bold",minWidth:24,textAlign:"center"}}>{c.horas||1}h</span>
                    <button onClick={()=>setEditandoClase(p=>{const h=(p.horas||1)+1;return{...p,horas:h,valor:calcularValor(p.tipo,h,p.adicional)}})} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:16,cursor:"pointer"}}>+</button>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>💰 Valor</div>
                  <input type="number" value={c.valor} onChange={e=>setEditandoClase(p=>({...p,valor:Number(e.target.value)}))} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:8,color:"#fff",padding:"8px 10px",fontSize:14,boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
              </div>
              {c.tipo==="colectiva"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div>
                    <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>Personas</div>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <button onClick={()=>setEditandoClase(p=>{const np=Math.max(1,(p.personas||1)-1);return{...p,personas:np,extras:Math.max(0,np-precios.colectiva_base),valor:calcularValor(p.tipo,p.horas)}})} style={{background:"none",border:"none",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>−</button>
                      <span style={{fontSize:16,fontWeight:"bold",minWidth:24,textAlign:"center"}}>{c.personas||0}</span>
                      <button onClick={()=>setEditandoClase(p=>{const np=(p.personas||0)+1;return{...p,personas:np,extras:Math.max(0,np-precios.colectiva_base),valor:calcularValor(p.tipo,p.horas)}})} style={{background:"none",border:"none",color:"#90A4AE",fontSize:16,cursor:"pointer"}}>+</button>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>Extras</div>
                    <input type="number" value={c.extras||0} onChange={e=>setEditandoClase(p=>({...p,extras:Number(e.target.value)}))} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:8,color:"#fff",padding:"8px 10px",fontSize:14,boxSizing:"border-box",fontFamily:"inherit"}}/>
                  </div>
                </div>
              )}
              {(c.tipo==="particular"||c.tipo==="requerida")&&(
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>➕ Adicionales</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button onClick={()=>setEditandoClase(p=>{const nad=Math.max(0,(p.adicional||0)-1);return{...p,adicional:nad,valor:calcularValor(p.tipo,p.horas,nad)}})} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:16,cursor:"pointer"}}>−</button>
                    <span style={{fontSize:16,fontWeight:"bold",minWidth:24,textAlign:"center"}}>{c.adicional||0}</span>
                    <button onClick={()=>setEditandoClase(p=>{const nad=(p.adicional||0)+1;return{...p,adicional:nad,valor:calcularValor(p.tipo,p.horas,nad)}})} style={{background:"none",border:"none",color:"#4FC3F7",fontSize:16,cursor:"pointer"}}>+</button>
                  </div>
                </div>
              )}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:"#607d8b",marginBottom:4}}>💬 Comentario</div>
                <textarea value={c.comentario||""} onChange={e=>setEditandoClase(p=>({...p,comentario:e.target.value}))} rows={2} style={{width:"100%",background:"#0d2a3a",border:"1px solid #4FC3F744",borderRadius:8,color:"#fff",padding:"10px 12px",fontSize:13,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
              <div style={{fontSize:12,color:"#607d8b",marginBottom:16}}>
                {new Date(c.fecha).toLocaleDateString("es-CL",{weekday:"long",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}
              </div>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>setEditandoClase(null)} style={{flex:1,padding:"14px",background:"rgba(255,255,255,0.05)",border:"1px solid #555",borderRadius:12,color:"#90CAF9",fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
                <button onClick={()=>handleGuardarEdit(c)} style={{flex:2,padding:"14px",background:"linear-gradient(90deg,#0277bd,#0288d1)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>💾 Guardar cambios</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CONFIGURACIÓN */}
      {showConfig&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"flex-end",zIndex:100}}>
          <div style={{width:"100%",background:"#000000",borderTop:"2px solid #4FC3F7",borderRadius:"20px 20px 0 0",padding:"24px 24px 44px",maxHeight:"85vh",overflowY:"auto"}}>
            <div style={{fontSize:18,fontWeight:"bold",marginBottom:20,color:"#4FC3F7"}}>⚙️ Configurar Precios</div>
            {[
              {key:"particular",label:"Clase Particular",emoji:tipoEmoji("particular",disc),unit:"/h"},
              {key:"colectiva",label:"Clase Colectiva (precio base)",emoji:"👥",unit:"/h"},
              {key:"colectiva_base",label:"Personas incluidas sin extra",emoji:"👤",desc:"A partir de esta cantidad se cobra adicional",unit2:"pers."},
              {key:"colectiva_extra",label:"Adicional por persona extra",emoji:"➕"},
              {key:"requerida",label:"Clase Requerida",emoji:"📋",unit:"/h"},
              {key:"adicional",label:"Adicional por clase (Particular/Requerida)",emoji:"➕",desc:"Monto que se suma por cada adicional agregado a la clase",unit:"/unidad"},
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
                {}
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
            <Toggle value={recordar} onChange={setRecordar} label="🔔 Recordatorio diario" desc="Te envía un correo a las 9 PM si no registraste clases"/>
            <div style={{marginTop:10}}>
              <Toggle value={resumenMensual} onChange={setResumenMensual} label="📊 Resumen mensual" desc="Te envía un correo el día 1 con el resumen del mes anterior"/>
            </div>
            <div style={{marginTop:10}}>
              <Toggle value={pushNotif} onChange={togglePush} label="🔔 Notificaciones push" desc="Recibe una notificación en el celular si olvidaste registrar clases"/>
            </div>
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

      {calendarAddTipo&&(
        <CalendarAddModal
          fecha={calendarAddFecha}
          tipo={calendarAddTipo}
          precios={precios}
          personas={calendarAddPersonas}
          setPersonas={setCalendarAddPersonas}
          disc={profile?.disciplina||"ski"}
          discClase={discClase}
          setDiscClase={setDiscClase}
          onConfirm={handleCalendarAdd}
          onCancel={()=>{setCalendarAddFecha(null);setCalendarAddTipo(null);}}
        />
      )}
    </div>
  );
}
