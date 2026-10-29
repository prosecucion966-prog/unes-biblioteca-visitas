"use client";
import { useState } from "react";

export default function RegistrarSalida({ id, pendiente, onDone }: { id: number; pendiente: boolean; onDone?: () => void }) {
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  async function registrar() {
    if (!window.confirm("¿Registrar la hora de salida de esta visita ahora?")) return;
    setLoading(true);setError("");setSuccess("");
    try {
      const response=await fetch("/api/visitas/salida",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"No se pudo registrar la salida.");
      setSuccess("Salida: "+data.hora_salida.slice(0,5));
      onDone?.();
      window.location.reload();
    } catch(e) {setError(e instanceof Error?e.message:"Error al registrar salida.");}
    finally {setLoading(false);}
  }
  if (!pendiente) return <span className="muted">Registrada</span>;
  return <div style={{minWidth:120}}><button type="button" className="secondary-button" disabled={loading} onClick={registrar}>{loading?"Guardando…":"Registrar salida"}</button>{error&&<p className="error-message" role="alert">{error}</p>}{success&&<p className="success-message" role="status">{success}</p>}</div>;
}
