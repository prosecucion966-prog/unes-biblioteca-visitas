export default function HomePage() {
  return (
    <main className="page">
      <section className="panel">
        <div className="brand">UNES <span>Biblioteca Virtual</span></div>
        <div className="eyebrow">SISTEMA INSTITUCIONAL</div>
        <h1>Registro y control de visitas</h1>
        <p className="intro">
          Plataforma para gestionar el ingreso, la consulta y la salida de visitantes
          de la Biblioteca Virtual de la Universidad Nacional Experimental de la Seguridad.
        </p>
        <div className="notice">
          <strong>Configuración inicial</strong>
          <p>La aplicación ya cuenta con una página de inicio compatible con Next.js App Router.
          Para habilitar el acceso y el registro de visitas, configura las variables de entorno de
          Supabase en Vercel y aplica el esquema SQL descrito en el README.</p>
        </div>
        <footer>UNES · Biblioteca Virtual</footer>
      </section>
    </main>
  );
}
