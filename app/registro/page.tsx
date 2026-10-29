"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

const NUCLEOS = ["LA GUAIRA","CEFE CARMEN DE URIA","CARACAS","JUNQUITO","HELICOIDE","SAN PEDRO- COMUNAL","SENAMECF","EL LLANITO","CAFETAL","EJE ALTOS MIRANDINOS","EJE VALLES DEL TUY","EJE BARLOVENTO","EJE METROPOLITANO","EJE GUARENAS - GUATIRE","ARAGUA","CARABOBO","YARACUY","FALCÓN","LARA","EJE LA GUAJIRA","ZULIA","APURE","BARINAS","COJEDES TINAQUILLO","COJEDES","GUÁRICO","PORTUGUESA","MÉRIDA","TÁCHIRA","TRUJILLO","ANZOÁTEGUI","MONAGAS","NUEVA ESPARTA","CARUPANO","SUCRE","AMAZONAS","BOLÍVAR - PTO. ORDAZ","BOLÍVAR - ANGOSTURA","DELTA AMACURO"].sort((a, b) => a.localeCompare(b, "es"));
const logo = "https://www.bibliotecaunes.com.ve/images/Logo_Biblioteca_UNES_2.png";

export default function RegistroPage() {
 const router=useRouter();
 const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [nucleo,setNucleo]=useState("");
 const [error,setError]=useState(""); const [success,setSuccess]=useState(""); const [loading,setLoading]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>) {
  e.preventDefault(); setError("");setSuccess("");setLoading(true);
  try {
   const supabase=createClient();
   const {data,error}=await supabase.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim(),nucleo}}});
   if(error) throw error;
   if(data.user) {
    setSuccess("Solicitud creada. El administrador debe activar tu cuenta antes de que puedas entrar a registrar visitas. Si Supabase requiere confirmar el correo, revisa tu bandeja de entrada.");
    setName("");setEmail("");setPassword("");setNucleo("");
   } else setSuccess("Revisa tu correo para continuar con el registro.");
  } catch(err) {setError(err instanceof Error?err.message:"No se pudo crear la cuenta.");}
  finally {setLoading(false);}
 }
 return <main className="page"><section className="panel login-panel">
 <Link className="back-link" href="/">← Biblioteca Virtual UNES</Link>
 <div className="brand brand-with-logo"><img className="unes-logo" src={logo} alt="Logo de la Biblioteca UNES"/><span>Registro de agentes</span></div>
 <div className="eyebrow">NUEVA CUENTA</div><h1>Crear usuario</h1>
 <p className="intro">Regístrate con tu correo, crea una contraseña y selecciona el núcleo donde trabajarás.</p>
 <form className="form" onSubmit={submit}>
 <label htmlFor="full_name">Nombre y apellido *</label><input id="full_name" required minLength={3} maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Nombre completo"/>
 <label htmlFor="email">Correo electrónico *</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="nombre@correo.com"/>
 <label htmlFor="password">Crea tu contraseña *</label><input id="password" type="password" required minLength={10} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 10 caracteres"/>
 <label htmlFor="nucleo">Selecciona tu núcleo *</label><select id="nucleo" required value={nucleo} onChange={e=>setNucleo(e.target.value)}><option value="">Elige tu núcleo…</option>{NUCLEOS.map(n=><option key={n} value={n}>{n}</option>)}</select>
 <p className="small-note">Por seguridad, tu cuenta quedará pendiente de aprobación del administrador. No podrás registrar visitas hasta que sea activada.</p>
 {error&&<p className="error-message" role="alert">{error}</p>}{success&&<p className="success-message" role="status">{success}</p>}
 <button className="primary-button" type="submit" disabled={loading}>{loading?"Creando cuenta…":"Crear mi cuenta"}</button>
 </form><p className="small-note">¿Ya tienes usuario? <Link href="/login">Inicia sesión aquí</Link>.</p>
 </section></main>;
}
