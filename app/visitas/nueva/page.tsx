"use client";
import { useEffect, useState, type FormEvent } from "react";
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
const TIPOS=["Estudiante PNF","Estudiante PNFA","Estudiante PFG","Docente","Personal Administrativo","Personal Obrero","Visita Institucional","Oficial de Planta"];
const PNF_POLICIAL=["PNF en Policial","PNF en Investigación Penal","PNF en Ciencias del Fuego y Seguridad contra Incendios","PNF en Protección Civil y Administración de Desastres","PNF en Servicio Penitenciario","PNF en Prevención y Seguridad Ciudadana","PNF en Emergencia Prehospitalaria"];
const ACTIVIDADES=["Consulta académica","Taller","Conferencia","Conversatorio","Jornada de lectura","Clase","Reunión"];
export default function NuevaVisitaPage(){
 const router=useRouter(); const [error,setError]=useState(""); const [saving,setSaving]=useState(false);
 const [profile,setProfile]=useState<{role:string;nucleo:string|null}|null>(null);
 const [profileLoading,setProfileLoading]=useState(true);
 useEffect(()=>{let cancelled=false;(async()=>{try{const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Inicia sesión nuevamente.");const {data,error}=await supabase.from("profiles").select("role,nucleo,active").eq("id",user.id).single();if(error)throw error;if(!data?.active)throw new Error("Tu cuenta no está activa.");if(!cancelled)setProfile({role:data.role,nucleo:data.nucleo});}catch(e){if(!cancelled)setError(e instanceof Error?e.message:"No se pudo consultar tu núcleo asignado.");}finally{if(!cancelled)setProfileLoading(false);}})();return()=>{cancelled=true;}},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setError("");setSaving(true);const form=new FormData(e.currentTarget);
 try {const supabase=createClient();const {data:{user},error:authError}=await supabase.auth.getUser();if(authError||!user)throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
 const {error:insertError}=await supabase.from("visitas").insert({cedula:String(form.get("cedula")).trim(),apellidos:String(form.get("apellidos")).trim(),nombres:String(form.get("nombres")).trim(),genero:String(form.get("genero")||""),tipo_visitante:String(form.get("tipo_visitante")),categoria_estudio:String(form.get("categoria_estudio")||""),programa_detalle:String(form.get("programa_detalle")||""),nucleo:profile?.role==="operator" ? (profile.nucleo||"") : String(form.get("nucleo")||""),telefono:String(form.get("telefono")||""),correo:String(form.get("correo")||""),area_consulta:String(form.get("area_consulta")),tipo_actividad:String(form.get("tipo_actividad")||""),numero_maquina:String(form.get("numero_maquina")||""),procedencia:String(form.get("procedencia")||""),atendido_por:String(form.get("atendido_por")||""),material_consultado:String(form.get("material_consultado")||""),created_by:user.id});
 if(insertError)throw insertError;router.push("/visitas");router.refresh();
 }catch(err){setError(err instanceof Error?err.message:"No se pudo guardar la visita.");}finally{setSaving(false);}}
 return <main className="page"><section className="panel"><Link className="back-link" href="/dashboard">← Volver al panel</Link><div className="eyebrow">CONTROL DE ACCESO</div><h1>Registrar visita</h1><p className="intro">Completa los datos del visitante. La fecha y hora de entrada se generan automáticamente.</p><form className="form" onSubmit={submit}>
 <label>Cédula *</label><input name="cedula" required maxLength={30}/>
 <label>Apellidos *</label><input name="apellidos" required maxLength={120}/>
 <label>Nombres *</label><input name="nombres" required maxLength={120}/>
 <label>Género</label><select name="genero" defaultValue=""><option value="">Seleccione…</option><option>Femenino</option><option>Masculino</option><option>No indica</option></select>
 <label>Tipo de visitante *</label><select name="tipo_visitante" required defaultValue=""><option value="" disabled>Seleccione…</option>{TIPOS.map(x=><option key={x}>{x}</option>)}</select>
 <label>Categoría de estudio</label><input name="categoria_estudio"/>
 <label>Programa / detalle</label><select name="programa_detalle" defaultValue=""><option value="">Seleccione un programa…</option>{PNF_POLICIAL.map(x=><option key={x} value={x}>{x}</option>)}<option value="Otro">Otro</option></select>
 <label>Núcleo asignado *</label>{profile?.role==="operator" ? <><input value={profile.nucleo||""} readOnly required aria-readonly="true"/><p className="small-note">Este núcleo está asignado a tu usuario. Para cambiarlo, contacta al administrador.</p></> : <select name="nucleo" defaultValue="" required><option value="">Seleccione un núcleo…</option>{NUCLEOS.map(x=><option key={x} value={x}>{x}</option>)}</select>}
 <label>Teléfono</label><input name="telefono" type="tel"/>
 <label>Correo</label><input name="correo" type="email"/>
 <label>Área de consulta *</label><select name="area_consulta" required defaultValue=""><option value="" disabled>Seleccione…</option>{AREAS.map(x=><option key={x}>{x}</option>)}</select>
 <label>Tipo de actividad</label><select name="tipo_actividad" defaultValue=""><option value="">Seleccione…</option>{ACTIVIDADES.map(x=><option key={x}>{x}</option>)}</select>
 <label>Número de máquina</label><input name="numero_maquina"/>
 <label>Procedencia</label><input name="procedencia"/>
 <label>Atendido por</label><input name="atendido_por"/>
 <label>Material consultado</label><textarea name="material_consultado" rows={3}/>
 {error&&<p className="error-message" role="alert">{error}</p>}
 <button className="primary-button" disabled={saving||profileLoading||!profile||(profile.role==="operator"&&!profile.nucleo)}>{saving?"Guardando…":"Guardar visita"}</button>
 </form></section></main>;
}