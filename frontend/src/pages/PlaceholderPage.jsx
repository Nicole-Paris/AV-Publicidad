export function PlaceholderPage({ title }) {
  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Modulo</span>
          <h1>{title}</h1>
        </div>
      </div>

      <section className="work-panel">
        <h2>{title}</h2>
        <p>La estructura ya esta lista para conectar este modulo con sus endpoints.</p>
      </section>
    </section>
  );
}
