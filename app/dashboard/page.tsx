import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

const logo = "https://www.bibliotecaunes.com.ve/images/Logo_Biblioteca_UNES_2.png";
type DashboardVisit = {
  id: number;
  nombres: string | null;
  apellidos: string | null;
  cedula: string | null;
  fecha_visita: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  area_consulta: string | null;
  nucleo?: string | null;
  tipo_visitante?: string | null;
};

function caracasDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("es-VE", { timeZone: "America/Caracas", weekday: "short" })
    .format(date).replace(".", "");
}

export default async function DashboardPage() {
  let supabase;
  try { supabase = await createClient(); } catch { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles")
    .select("full_name,role,active,nucleo").eq("id", user.id).maybeSingle();

  if (!profile || !profile.active) {
    return <main className="page"><section className="panel">
      <div className="brand brand-with-logo"><img className="unes-logo" src={logo} alt="Logo de la Biblioteca UNES" /><span>Biblioteca Virtual</span></div>
      <h1>Acceso pendiente</h1><p className="intro">Tu cuenta no tiene un perfil institucional activo. Contacta al administrador de UNES.</p>
      <form action="/auth/signout" method="post"><button className="secondary-button">Cerrar sesión</button></form>
    </section></main>;
  }

  const today = caracasDate();
  const monthStart = today.slice(0, 7) + "-01";
  let baseQuery = supabase.from("visitas").select("id,nombres,apellidos,cedula,fecha_visita,hora_entrada,hora_salida,area_consulta,nucleo,tipo_visitante");
  if (profile.role === "operator" && profile.nucleo) baseQuery = baseQuery.eq("nucleo", profile.nucleo);
  const { data: allVisits, error: visitsError } = await baseQuery.order("created_at", { ascending: false }).limit(1500);
  const visits = (allVisits ?? []) as DashboardVisit[];
  const total = visits.length;
  const active = visits.filter(v => !v.hora_salida).length;
  const todayCount = visits.filter(v => v.fecha_visita === today).length;
  const monthCount = visits.filter(v => v.fecha_visita >= monthStart && v.fecha_visita <= today).length;
  const recent = visits.slice(0, 8);

  const lastSeven = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = caracasDate(date);
    return { key, label: shortDate(date), count: visits.filter(v => v.fecha_visita === key).length };
  });
  const maxDaily = Math.max(1, ...lastSeven.map(d => d.count));
  const groupCount = (field: "nucleo" | "tipo_visitante") => {
    const counts = new Map<string, number>();
    visits.forEach(v => {
      const label = v[field]?.trim() || (field === "nucleo" ? "Sin núcleo" : "Sin tipo");
      counts.set(label, (counts.get(label) ?? 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es")).slice(0, 6);
  };
  const byNucleus = groupCount("nucleo");
  const byType = groupCount("tipo_visitante");
  const maxNucleus = Math.max(1, ...byNucleus.map(x => x.count));
  const maxType = Math.max(1, ...byType.map(x => x.count));

  return <main className="dashboard">
    <header className="dashboard-header">
      <div><div className="brand brand-with-logo"><img className="unes-logo" src={logo} alt="Logo de la Biblioteca UNES" /><span>Biblioteca Virtual</span></div><p className="muted">Sistema de registro y control de visitas</p></div>
      <form action="/auth/signout" method="post"><button className="secondary-button">Cerrar sesión</button></form>
    </header>
    <section className="welcome">
      <div className="eyebrow">PANEL INSTITUCIONAL · EN VIVO</div>
      <h1>Bienvenido{profile.full_name ? ", " + profile.full_name : ""}</h1>
      <p className="intro">Sesión iniciada como {profile.role === "admin" ? "Administrador" : "Agente operador"}{profile.role === "operator" && profile.nucleo ? " · Núcleo: " + profile.nucleo : ""}. Resumen visual de la actividad registrada.</p>
    </section>
    {visitsError && <p className="error-message" role="alert">No se pudieron cargar algunas estadísticas. Verifica las columnas de la tabla visitas y los permisos de acceso.</p>}
    <section className="stats dashboard-kpis">
      <article className="stat-card"><span>Visitas registradas{total >= 1500 ? " (últimos 1.500)" : ""}</span><strong>{total}</strong><small>Registros consultados</small></article>
      <article className="stat-card"><span>Visitantes dentro</span><strong>{active}</strong><small>Sin hora de salida</small></article>
      <article className="stat-card"><span>Visitas de hoy</span><strong>{todayCount}</strong><small>{today}</small></article>
      <article className="stat-card"><span>Este mes</span><strong>{monthCount}</strong><small>Desde el día 1</small></article>
    </section>
    <section className="dashboard-charts">
      <article className="table-panel chart-panel">
        <div className="chart-heading"><div><span className="chart-kicker">MOVIMIENTO</span><h2>Últimos 7 días</h2></div><span className="chart-total">{lastSeven.reduce((sum, d) => sum + d.count, 0)} visitas</span></div>
        <div className="daily-chart" role="img" aria-label="Gráfico de visitas registradas durante los últimos siete días">
          {lastSeven.map(day => <div className="daily-column" key={day.key} title={day.key + ": " + day.count + " visitas"}>
            <strong>{day.count}</strong><div className="daily-track"><div className="daily-bar" style={{ height: (day.count / maxDaily * 100) + "%" }} /></div><span>{day.label}</span>
          </div>)}
        </div>
      </article>
      <article className="table-panel chart-panel">
        <div className="chart-heading"><div><span className="chart-kicker">DISTRIBUCIÓN</span><h2>Visitas por núcleo</h2></div></div>
        {byNucleus.length ? <div className="horizontal-chart">{byNucleus.map(item => <div className="bar-row" key={item.label}><div className="bar-label"><span>{item.label}</span><strong>{item.count}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: (item.count / maxNucleus * 100) + "%" }} /></div></div>)}</div> : <p className="muted">Aún no hay datos para graficar.</p>}
      </article>
      <article className="table-panel chart-panel">
        <div className="chart-heading"><div><span className="chart-kicker">PERFIL</span><h2>Tipo de visitante</h2></div></div>
        {byType.length ? <div className="horizontal-chart">{byType.map(item => <div className="bar-row" key={item.label}><div className="bar-label"><span>{item.label}</span><strong>{item.count}</strong></div><div className="bar-track"><div className="bar-fill bar-fill-blue" style={{ width: (item.count / maxType * 100) + "%" }} /></div></div>)}</div> : <p className="muted">Aún no hay datos para graficar.</p>}
      </article>
    </section>
    <section className="action-grid">
      <Link className="action-card" href="/visitas/nueva"><strong>＋ Registrar visita</strong><span>Registrar el ingreso de un visitante.</span></Link>
      <Link className="action-card" href="/visitas"><strong>☷ Historial de visitas</strong><span>Consultar visitas y registrar salidas.</span></Link>
      <Link className="action-card" href="/reportes"><strong>▤ Reportes estadísticos</strong><span>Ver cantidad de visitas por fechas y núcleo; exportar a CSV o PDF.</span></Link>
      {profile.role === "admin" && <Link className="action-card" href="/usuarios"><strong>⚙ Usuarios</strong><span>Administrar cuentas y permisos.</span></Link>}
    </section>
    <section className="table-panel"><h2>Visitas recientes</h2>{recent.length ? <div className="table-scroll"><table><thead><tr><th>Visitante</th><th>Cédula</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Área</th></tr></thead><tbody>{recent.map(v => <tr key={v.id}><td>{v.nombres} {v.apellidos}</td><td>{v.cedula}</td><td>{v.fecha_visita}</td><td>{v.hora_entrada}</td><td>{v.hora_salida ?? "En biblioteca"}</td><td>{v.area_consulta}</td></tr>)}</tbody></table></div> : <p className="muted">Todavía no hay visitas registradas. Selecciona “Registrar visita” para comenzar.</p>}</section>
    <p className="dashboard-footnote">Las gráficas se calculan con hasta 1.500 visitas recientes y se actualizan al volver a cargar el panel.</p>
  </main>;
}
