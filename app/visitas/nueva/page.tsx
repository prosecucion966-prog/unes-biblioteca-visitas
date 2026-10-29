"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
const NUCLEOS=[
  "LA GUAIRA",
  "CEFE CARMEN DE URIA",
  "CARACAS",
  "JUNQUITO",
  "HELICOIDE",
  "SAN PEDRO- COMUNAL",
  "SENAMECF",
  "EL LLANITO",
  "CAFETAL",
  "EJE ALTOS MIRANDINOS",
  "EJE VALLES DEL TUY",
  "EJE BARLOVENTO",
  "EJE METROPOLITANO",
  "EJE GUARENAS - GUATIRE",
  "ARAGUA",
  "CARABOBO",
  "YARACUY",
  "FALCÓN",
  "LARA",
  "EJE LA GUAJIRA",
  "ZULIA",
  "APURE",
  "BARINAS",
  "COJEDES TINAQUILLO",
  "COJEDES",
  "GUÁRICO",
  "PORTUGUESA",
  "MÉRIDA",
  "TÁCHIRA",
  "TRUJILLO",
  "ANZOÁTEGUI",
  "MONAGAS",
  "NUEVA ESPARTA",
  "CARUPANO",
  "SUCRE",
  "AMAZONAS",
  "BOLÍVAR - PTO. ORDAZ",
  "BOLÍVAR - ANGOSTURA",
  "DELTA AMACURO"
];
const AREAS=["Sala de Consulta Digital","Sala de Lectura","Revisión Bibliográfica","Consulta en Recepción"];
const ADMINISTRATIVO_SUB=["Rectorado","Dirección de Atención al Ciudadano","Auditoria Interna","Consultoria Juridica","Dirección General de Facultades","Faculta de Servicio Policial","Facultad de Investigación Penal y Criminalistica","Faculta de Servicios Penitenciario","Facultad de Ciencias del Fuego","Facultad de Protección Civil","Secretaría General","Vicerrectorado Administrativo","Vicerrectorado de Creación Intelectual y Vinculación Social","Vicerrectorado de Desarrollo Académico","Instituto de Altos Estudios","Decanato del Núcleo","Coordinación de Control de Estudio","Coordinación Administrativa","Coordinación de Desarrollo Académico","Coordinación de Creación Intelectual y Vinculación Social"];
const TIPOS=["Estudiante PNF","Estudiante PNFA","Estudiante PFG","Docente","Personal Administrativo","Personal Obrero","Visita Institucional","Oficial de Planta","Otro"];
const PNF_POLICIAL=["PNF en Policial","PNF en Investigación Penal","PNF en Ciencias del Fuego y Seguridad contra Incendios","PNF en Protección Civil y Administración de Desastres","PNF en Servicio Penitenciario","PNF en Prevención y Seguridad Ciudadana","PNF en Emergencia Prehospitalaria"];
const PNFA_NIVELES=["Especialista","Maestría","Doctorado"];
const PNFA_POSTGRADOS: Record<string,string>={"Especialista":"Especialista en Seguridad Ciudadana","Maestría":"Maestría en Seguridad Ciudadana","Doctorado":"Doctorado en Seguridad Ciudadana"};
const PNFA_AREA_FIJA="Seguridad Ciudadana";
const OPCIONES_PFG=["Derecho","Criminología","Ingeniería Estructural en Seguridad y Protección Contra Incendios"];
const ACTIVIDADES=["Consulta académica","Taller","Conferencia","Conversatorio","Jornada de lectura","Clase","Reunión"];
export default function NuevaVisitaPage(){
 const router=useRouter(); const [error,setError]=useState(""); const [saving,setSaving]=useState(false); const formRef=useRef<HTMLFormElement>(null); const [buscandoCedula,setBuscandoCedula]=useState(false); const [mensajeCedula,setMensajeCedula]=useState("");
 const [profile,setProfile]=useState<{role:string;nucleo:string|null}|null>(null);
 const [profileLoading,setProfileLoading]=useState(true);
 const [tipoVisitante,setTipoVisitante]=useState("");
 const [nivelPNFA,setNivelPNFA]=useState("");
 const [programaPNF,setProgramaPNF]=useState("");
 const [programaPFG,setProgramaPFG]=useState("");
 const [dependenciaAdministrativa,setDependenciaAdministrativa]=useState("");
 useEffect(()=>{let cancelled=false;(async()=>{try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Inicia sesión nuevamente.");const {data,error}=await supabase.from("profiles").select("role,nucleo,active").eq("id",user.id).single();if(error)throw error;if(!data?.active)throw new Error("Tu cuenta no está activa.");if(!cancelled)setProfile({role:data.role,nucleo:data.nucleo});}catch(e){if(!cancelled)setError(e instanceof Error?e.message:"No se pudo consultar tu núcleo asignado.");}finally{if(!cancelled)setProfileLoading(false);}})();return()=>{cancelled=true;}},[]);
 async function buscarVisitante(cedulaRaw:string){
  const cedula=cedulaRaw.trim();
  setMensajeCedula(""); 
  if(!cedula) return;
  setBuscandoCedula(true);
  try{
   const supabase=createClient();
   const {data,error:queryError}=await supabase.from("visitas").select("cedula,apellidos,nombres,genero,tipo_visitante,categoria_estudio,programa_detalle,nucleo,dependencia_administrativa,telefono,correo,procedencia").eq("cedula",cedula).order("created_at",{ascending:false}).limit(1).maybeSingle();
   if(queryError) throw queryError;
   if(!data){setMensajeCedula("No hay registros previos para esta cédula. Completa los datos del visitante.");return;}
   const form=formRef.current;
   if(!form) return;
   const setField=(name:string,value:string|null|undefined)=>{const el=form.elements.namedItem(name);if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement) el.value=value||"";};
   setField("apellidos",data.apellidos);setField("nombres",data.nombres);setField("genero",data.genero);setField("telefono",data.telefono);setField("correo",data.correo);setField("procedencia",data.procedencia);
   setTipoVisitante(data.tipo_visitante||"");
   setField("tipo_visitante",data.tipo_visitante);
   setField("categoria_estudio",data.categoria_estudio);
   setField("programa_detalle",data.programa_detalle);
   setDependenciaAdministrativa(data.dependencia_administrativa||"");
   setField("dependencia_administrativa",data.dependencia_administrativa);
   if(data.tipo_visitante==="Estudiante PNF") setProgramaPNF(data.programa_detalle||"");
   if(data.tipo_visitante==="Estudiante PFG") setProgramaPFG(data.programa_detalle||"");
   if(data.tipo_visitante==="Estudiante PNFA"){
    const nivel=PNFA_NIVELES.find(n=>data.categoria_estudio?.startsWith(n))||"";
    setNivelPNFA(nivel);
   }
   if(profile?.role!=="operator") setField("nucleo",data.nucleo);
   setMensajeCedula("Visitante habitual encontrado. Se cargaron sus datos de la visita anterior; verifica y actualiza lo necesario.");
  }catch(e){setMensajeCedula(e instanceof Error?e.message:"No se pudo buscar la cédula.");}
  finally{setBuscandoCedula(false);}
 }
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setSaving(true);const form=new FormData(e.currentTarget);
 try {const supabase=createClient();const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
 const {error:insertError}=await supabase.from("visitas").insert({cedula:String(form.get("cedula")).trim(),apellidos:String(form.get("apellidos")).trim(),nombres:String(form.get("nombres")).trim(),genero:String(form.get("genero")||""),tipo_visitante:String(form.get("tipo_visitante")),categoria_estudio:tipoVisitante==="Estudiante PNFA" ? `${nivelPNFA} - ${PNFA_AREA_FIJA}` : String(form.get("categoria_estudio")||""),programa_detalle:tipoVisitante==="Estudiante PNFA" ? (PNFA_POSTGRADOS[nivelPNFA]||"") : tipoVisitante==="Estudiante PFG" ? programaPFG : tipoVisitante==="Estudiante PNF" ? programaPNF : String(form.get("programa_detalle")||""),nucleo:profile?.role==="operator" ? (profile.nucleo||"") : String(form.get("nucleo")||""),dependencia_administrativa:tipoVisitante==="Personal Administrativo" ? dependenciaAdministrativa : "",telefono:String(form.get("telefono")||""),correo:String(form.get("correo")||""),area_consulta:String(form.get("area_consulta")),tipo_actividad:String(form.get("tipo_actividad")||""),numero_maquina:String(form.get("numero_maquina")||""),procedencia:String(form.get("procedencia")||""),atendido_por:String(form.get("atendido_por")||""),material_consultado:String(form.get("material_consultado")||""),created_by:user.id});
 if(insertError)throw insertError;router.push("/visitas");router.refresh();
 }catch(err){setError(err instanceof Error?err.message:"No se pudo guardar la visita.");}finally{setSaving(false);}}
 return <main className="page"><section className="panel"><Link className="back-link" href="/dashboard">← Volver al panel</Link><div className="eyebrow">CONTROL DE ACCESO</div><h1>Registrar visita</h1><p className="intro">Completa los datos del visitante. La fecha y hora de entrada se generan automáticamente.</p><form ref={formRef} className="form" onSubmit={submit}>
 <label htmlFor="cedula">Cédula *</label><div className="cedula-search-row"><input id="cedula" name="cedula" required maxLength={30} inputMode="numeric" autoComplete="off" placeholder="Ingrese la cédula del visitante" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void buscarVisitante(e.currentTarget.value);}}}/><button type="button" className="secondary-button" disabled={buscandoCedula} onClick={()=>{const el=formRef.current?.elements.namedItem("cedula");if(el instanceof HTMLInputElement)void buscarVisitante(el.value);}}>{buscandoCedula?"Buscando…":"Buscar"}</button></div>{mensajeCedula&&<p className={mensajeCedula.startsWith("No hay")?"small-note":"success-message"} role="status">{mensajeCedula}</p>}
 <label>Apellidos *</label><input name="apellidos" required maxLength={120}/>
 <label>Nombres *</label><input name="nombres" required maxLength={120}/>
 <label>Género</label><select name="genero" defaultValue=""><option value="">Seleccione…</option><option>Femenino</option><option>Masculino</option><option>No indica</option></select>
 <label>Tipo de visitante *</label><select name="tipo_visitante" required value={tipoVisitante} onChange={e=>{setTipoVisitante(e.target.value);setNivelPNFA("");setProgramaPNF("");setProgramaPFG("");setDependenciaAdministrativa("");}}><option value="" disabled>Seleccione…</option>{TIPOS.map(x=><option key={x}>{x}</option>)}</select>
 {tipoVisitante==="Personal Administrativo" ? <><label>Dependencia administrativa *</label><select name="dependencia_administrativa" required value={dependenciaAdministrativa} onChange={e=>setDependenciaAdministrativa(e.target.value)}><option value="">Seleccione una dependencia…</option>{ADMINISTRATIVO_SUB.map(x=><option key={x} value={x}>{x}</option>)}</select></> : tipoVisitante==="Estudiante PNFA" ? <><label>Nivel PNFA *</label><select required value={nivelPNFA} onChange={e=>setNivelPNFA(e.target.value)}><option value="">Seleccione un nivel…</option>{PNFA_NIVELES.map(x=><option key={x} value={x}>{x}</option>)}</select><label>Área</label><input value={PNFA_AREA_FIJA} readOnly aria-readonly="true"/><label>Programa / detalle</label><input value={nivelPNFA ? PNFA_POSTGRADOS[nivelPNFA] : ""} readOnly placeholder="Seleccione primero el nivel" aria-readonly="true"/></> : tipoVisitante==="Estudiante PFG" ? <><label>Programa PFG *</label><select required value={programaPFG} onChange={e=>setProgramaPFG(e.target.value)}><option value="">Seleccione un programa…</option>{OPCIONES_PFG.map(x=><option key={x} value={x}>{x}</option>)}</select></> : tipoVisitante==="Estudiante PNF" ? <><label>Programa PNF *</label><select required value={programaPNF} onChange={e=>setProgramaPNF(e.target.value)}><option value="">Seleccione un programa…</option>{PNF_POLICIAL.map(x=><option key={x} value={x}>{x}</option>)}<option value="Otro">Otro</option></select></> : <><label>Categoría de estudio</label><input name="categoria_estudio"/><label>Programa / detalle</label><input name="programa_detalle"/></>}
 <label>Núcleo asignado *</label>{profile?.role==="operator" ? <><input value={profile.nucleo||""} readOnly required aria-readonly="true"/><p className="small-note">Este núcleo está asignado a tu usuario. Para cambiarlo, contacta al administrador.</p></> : <select name="nucleo" defaultValue="" required><option value="">Seleccione un núcleo…</option>{NUCLEOS.map(x=><option key={x} value={x}>{x}</option>)}</select>}
 <label>Teléfono</label><input name="telefono" type="tel"/>
 <label>Correo</label><input name="correo" type="email"/>
 <label>Área de consulta *</label><select name="area_consulta" required defaultValue=""><option value="" disabled>Seleccione…</option>{AREAS.map(x=><option key={x}>{x}</option>)}</select>
 <label>Tipo de actividad</label><select name="tipo_actividad" defaultValue=""><option value="">Seleccione…</option>{ACTIVIDADES.map(x=><option key={x}>{x}</option>)}</select>
 <label>Número de máquina</label><select name="numero_maquina" defaultValue=""><option value="">Seleccione una máquina…</option>{Array.from({length:30},(_,i)=>String(i+1)).map(n=><option key={n} value={n}>{n}</option>)}</select>
 <label>Procedencia</label><input name="procedencia"/>
 <label>Atendido por</label><input name="atendido_por"/>
 <label>Material consultado</label><textarea name="material_consultado" rows={3}/>
 {error&&<p className="error-message" role="alert">{error}</p>}
 <button className="primary-button" disabled={saving||profileLoading||!profile||(profile.role==="operator"&&!profile.nucleo)}>{saving?"Guardando…":"Guardar visita"}</button>
 </form></section></main>;
}