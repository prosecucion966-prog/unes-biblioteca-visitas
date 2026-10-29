"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const NUCLEOS = [
  "LA GUAIRA","CEFE CARMEN DE URIA","CARACAS","JUNQUITO","HELICOIDE","SAN PEDRO- COMUNAL","SENAMECF","EL LLANITO","CAFETAL","EJE ALTOS MIRANDINOS","EJE VALLES DEL TUY","EJE BARLOVENTO","EJE METROPOLITANO","EJE GUARENAS - GUATIRE","ARAGUA","CARABOBO","YARACUY","FALCÓN","LARA","EJE LA GUAJIRA","ZULIA","APURE","BARINAS","COJEDES TINAQUILLO","COJEDES","GUÁRICO","PORTUGUESA","MÉRIDA","TÁCHIRA","TRUJILLO","ANZOÁTEGUI","MONAGAS","NUEVA ESPARTA","CARUPANO","SUCRE","AMAZONAS","BOLÍVAR - PTO. ORDAZ","BOLÍVAR - ANGOSTURA","DELTA AMACURO"
];
type Usuario = { id:string; full_name:string; email:string; role:string; active:boolean; nucleo:string|null };

export default function UsuariosPage() {
  const [users,setUsers] = useState<Usuario[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [success,setSuccess] = useState("");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [nucleo,setNucleo] = useState("");
  const [role,setRole] = useState("operator");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los usuarios.");
      setUsers(data.users ?? []);
    } catch(e) { setError(e instanceof Error ? e.message : "Error al cargar usuarios."); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ void load(); },[load]);

  async function createUser(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const response = await fetch("/api/usuarios",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:name,email,password,role,nucleo:role==="operator"?nucleo:""})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || "No se pudo crear el usuario.");
      setSuccess("Usuario creado correctamente. Entrégale sus credenciales por un canal seguro.");
      setName("");setEmail("");setPassword("");setNucleo("");setRole("operator");
      await load();
    } catch(e) { setError(e instanceof Error ? e.message : "Error al crear usuario."); }
    finally { setSaving(false); }
  }

  async function updateUser(user:Usuario, patch:{active?:boolean;nucleo?:string}) {
    setError("");setSuccess("");
    try {
      const response=await fetch("/api/usuarios",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:user.id,...patch})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error || "No se pudo actualizar.");
      setSuccess("Cambios guardados."); await load();
    } catch(e) { setError(e instanceof Error ? e.message : "No se pudo actualizar el usuario."); }
  }

  return <main className="dashboard">
    <header className="dashboard-header"><div><div className="brand brand-with-logo"><img className="unes-logo" src="https://www.bibliotecaunes.com.ve/images/Logo_Biblioteca_UNES_2.png" alt="Logo Biblioteca UNES"/><span>Gestión de usuarios</span></div><p className="muted">Asigna un núcleo a cada agente operador.</p></div><Link className="secondary-link" href="/dashboard">← Volver al panel</Link></header>
    <section className="welcome"><div className="eyebrow">ADMINISTRACIÓN</div><h1>Usuarios y núcleos</h1><p className="intro">Cada operador queda vinculado a un único núcleo. Las visitas que registre se asociarán automáticamente a ese núcleo. El administrador puede gestionar todos los núcleos.</p></section>
    {error&&<p className="error-message" role="alert">{error}</p>}{success&&<p className="success-message" role="status">{success}</p>}
    <section className="table-panel" style={{marginBottom:20}}><h2>Crear usuario</h2><form className="form" onSubmit={createUser}>
      <label htmlFor="full_name">Nombre completo *</label><input id="full_name" required value={name} onChange={e=>setName(e.target.value)} maxLength={120}/>
      <label htmlFor="email">Correo electrónico *</label><input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off"/>
      <label htmlFor="password">Contraseña temporal *</label><input id="password" type="password" required minLength={10} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="Mínimo 10 caracteres"/>
      <label htmlFor="role">Rol *</label><select id="role" value={role} onChange={e=>setRole(e.target.value)}><option value="operator">Agente operador</option><option value="admin">Administrador</option></select>
      {role==="operator"&&<><label htmlFor="nucleo">Núcleo asignado *</label><select id="nucleo" required value={nucleo} onChange={e=>setNucleo(e.target.value)}><option value="">Selecciona el núcleo del agente…</option>{NUCLEOS.map(n=><option key={n} value={n}>{n}</option>)}</select><p className="small-note">El agente no podrá elegir otro núcleo al registrar visitas.</p></>}
      <button className="primary-button" disabled={saving}>{saving?"Creando usuario…":"Crear usuario"}</button>
    </form></section>
    <section className="table-panel"><h2>Usuarios existentes</h2>{loading?<p className="muted">Cargando usuarios…</p>:users.length?<div className="table-scroll"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Núcleo asignado</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.full_name}</td><td>{u.email}</td><td>{u.role==="admin"?"Administrador":"Agente operador"}</td><td>{u.role==="admin"?"Todos los núcleos":<select aria-label={"Núcleo de "+u.full_name} value={u.nucleo??""} onChange={e=>void updateUser(u,{nucleo:e.target.value})}>{NUCLEOS.map(n=><option key={n} value={n}>{n}</option>)}</select>}</td><td>{u.active?"Activo":"Inactivo"}</td><td><button className="secondary-button" onClick={()=>void updateUser(u,{active:!u.active})}>{u.active?"Desactivar":"Activar"}</button></td></tr>)}</tbody></table></div>:<p className="muted">No hay usuarios en los perfiles institucionales.</p>}</section>
  </main>;
}
