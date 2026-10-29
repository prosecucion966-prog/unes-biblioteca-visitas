"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Visita = {
  id: number;
  cedula: string | null;
  fecha_visita: string;
  nucleo: string | null;
  tipo_visitante: string | null;
  programa_detalle: string | null;
  area_consulta: string | null;
  dependencia_administrativa: string | null;
};

function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [desde, setDesde] = useState(todayLocal().slice(0, 4) + "-01-01");
  const [hasta, setHasta] = useState(todayLocal());
  const [nucleo, setNucleo] = useState("todos");
  const [cedula, setCedula] = useState("");
  const [programa, setPrograma] = useState("todos");
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setError("");
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Tu sesión venció. Inicia sesión nuevamente.");
        let query = supabase.from("visitas")
          .select("id,cedula,fecha_visita,nucleo,tipo_visitante,programa_detalle,area_consulta,dependencia_administrativa")
          .gte("fecha_visita", desde)
          .lte("fecha_visita", hasta)
          .order("fecha_visita", { ascending: false })
          .limit(5000);
        if (nucleo !== "todos") query = query.eq("nucleo", nucleo);
        if (cedula.trim()) query = query.ilike("cedula", `%${cedula.trim()}%`);
        if (programa !== "todos") query = query.eq("programa_detalle", programa);
        const { data, error: queryError } = await query;
        if (queryError) throw queryError;
        if (!cancelled) setVisitas((data ?? []) as Visita[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo generar el reporte.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (desde && hasta && desde <= hasta) load();
    else { setLoading(false); setError("La fecha inicial debe ser anterior o igual a la fecha final."); }
    return () => { cancelled = true; };
  }, [desde, hasta, nucleo, cedula, programa]);

  const nucleos = useMemo(() => Array.from(new Set(visitas.map(v => v.nucleo?.trim() || "Sin núcleo"))).sort((a,b) => a.localeCompare(b, "es")), [visitas]);
  const programas = useMemo(() => Array.from(new Set(visitas.map(v => v.programa_detalle?.trim()).filter((v): v is string => !!v))).sort((a,b) => a.localeCompare(b, "es")), [visitas]);
  const porNucleo = useMemo(() => {
    const map = new Map<string, number>();
    visitas.forEach(v => { const key = v.nucleo?.trim() || "Sin núcleo"; map.set(key, (map.get(key) ?? 0) + 1); });
    return Array.from(map, ([nombre, cantidad]) => ({ nombre, cantidad })).sort((a,b) => b.cantidad-a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
  }, [visitas]);
  const porDependencia = useMemo(() => {
    const map = new Map<string, number>();
    visitas.filter(v => v.tipo_visitante === "Personal Administrativo").forEach(v => { const key = v.dependencia_administrativa?.trim() || "Sin dependencia"; map.set(key, (map.get(key) ?? 0) + 1); });
    return Array.from(map, ([nombre, cantidad]) => ({ nombre, cantidad })).sort((a,b) => b.cantidad-a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
  }, [visitas]);
  const porTipo = useMemo(() => {
    const map = new Map<string, number>();
    visitas.forEach(v => { const key = v.tipo_visitante?.trim() || "Sin tipo"; map.set(key, (map.get(key) ?? 0) + 1); });
    return Array.from(map, ([nombre, cantidad]) => ({ nombre, cantidad })).sort((a,b) => b.cantidad-a.cantidad);
  }, [visitas]);

  function exportarCSV() {
    const rows = [["Fecha desde", desde], ["Fecha hasta", hasta], ["Total de visitas", String(visitas.length)], [], ["Núcleo", "Cantidad de visitas"], ...porNucleo.map(x => [x.nombre, String(x.cantidad)]), [], ["Tipo de visitante", "Cantidad"], ...porTipo.map(x => [x.nombre, String(x.cantidad)]), [], ["Dependencia administrativa", "Cantidad"], ...porDependencia.map(x => [x.nombre, String(x.cantidad)])];
    const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `reporte-visitas-${desde}-a-${hasta}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return <main className="dashboard">
    <header className="dashboard-header"><div><div className="brand">UNES <span>Biblioteca Virtual</span></div><p className="muted">Reportes estadísticos de visitas</p></div><div className="home-actions"><Link className="secondary-link" href="/dashboard">← Volver al panel</Link></div></header>
    <section className="welcome"><div className="eyebrow">ESTADÍSTICAS INSTITUCIONALES</div><h1>Reportes de visitas</h1><p className="intro">Consulta la cantidad de visitas por período y su distribución por núcleo. Puedes exportar los resultados a Excel mediante CSV o imprimirlos/guardarlos como PDF.</p></section>
    <section className="table-panel" style={{marginBottom:20}}>
      <div className="report-filters">
        <div><label htmlFor="desde">Desde</label><input id="desde" type="date" value={desde} max={hasta} onChange={e=>setDesde(e.target.value)} /></div>
        <div><label htmlFor="hasta">Hasta</label><input id="hasta" type="date" value={hasta} min={desde} max={todayLocal()} onChange={e=>setHasta(e.target.value)} /></div>
        <div><label htmlFor="nucleo">Núcleo</label><select id="nucleo" value={nucleo} onChange={e=>setNucleo(e.target.value)}><option value="todos">Todos los núcleos</option>{nucleos.map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        <div><label htmlFor="cedula">Buscar por cédula</label><input id="cedula" type="search" inputMode="numeric" placeholder="Ingrese la cédula" value={cedula} onChange={e=>setCedula(e.target.value)} /></div>
        <div><label htmlFor="programa">Programa</label><select id="programa" value={programa} onChange={e=>setPrograma(e.target.value)}><option value="todos">Todos los programas</option>{programas.map(p=><option key={p} value={p}>{p}</option>)}</select></div>
      </div>
      <div className="home-actions"><button className="primary-button" onClick={exportarCSV} disabled={loading || !!error}>Exportar CSV</button><button className="secondary-button" onClick={()=>window.print()}>Imprimir / Guardar PDF</button></div>
    </section>
    {error && <p className="error-message" role="alert">{error}</p>}
    <section className="stats"><article className="stat-card"><span>Total de visitas en el período</span><strong>{loading ? "…" : visitas.length}</strong></article><article className="stat-card"><span>Núcleos con visitas</span><strong>{loading ? "…" : porNucleo.filter(x=>x.nombre!=="Sin núcleo").length}</strong></article></section>
    <section className="table-panel" style={{marginBottom:20}}><h2>Cantidad de visitas por núcleo</h2>{loading?<p className="muted">Generando reporte…</p>:porNucleo.length?<div className="table-scroll"><table><thead><tr><th>Núcleo</th><th>Cantidad de visitas</th><th>Porcentaje</th></tr></thead><tbody>{porNucleo.map(x=><tr key={x.nombre}><td>{x.nombre}</td><td>{x.cantidad}</td><td>{visitas.length ? (x.cantidad*100/visitas.length).toFixed(1)+"%" : "0%"}</td></tr>)}</tbody><tfoot><tr><th>Total</th><th>{visitas.length}</th><th>{visitas.length ? "100%" : "0%"}</th></tr></tfoot></table></div>:<p className="muted">No hay visitas para los filtros seleccionados.</p>}</section>
    <section className="table-panel" style={{marginBottom:20}}><h2>Visitas por dependencia administrativa</h2>{loading?<p className="muted">Generando reporte…</p>:porDependencia.length?<div className="table-scroll"><table><thead><tr><th>Dependencia administrativa</th><th>Cantidad</th></tr></thead><tbody>{porDependencia.map(x=><tr key={x.nombre}><td>{x.nombre}</td><td>{x.cantidad}</td></tr>)}</tbody></table></div>:<p className="muted">No hay visitas de personal administrativo para los filtros seleccionados.</p>}</section>
    <section className="table-panel"><h2>Cantidad por tipo de visitante</h2>{loading?<p className="muted">Generando reporte…</p>:porTipo.length?<div className="table-scroll"><table><thead><tr><th>Tipo de visitante</th><th>Cantidad</th></tr></thead><tbody>{porTipo.map(x=><tr key={x.nombre}><td>{x.nombre}</td><td>{x.cantidad}</td></tr>)}</tbody></table></div>:<p className="muted">No hay datos para mostrar.</p>}<p className="small-note">Nota: el reporte carga hasta 5.000 registros por consulta. Para períodos con más visitas se recomienda paginación o un reporte agregado en la base de datos.</p></section>
  </main>;
}
