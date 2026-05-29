import { useAuth } from "../auth/AuthContext.jsx";

const cards = [
  { label: "Pedidos pendientes", value: "0" },
  { label: "Pagos del dia", value: "$0.00" },
  { label: "Stock bajo", value: "0" },
  { label: "Cortes abiertos", value: "0" }
];

export function DashboardPage() {
  const { session } = useAuth();

  return (
    <section className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Panel principal</span>
          <h1>Hola, {session?.nombre}</h1>
        </div>
      </div>

      <div className="metrics-grid">
        {cards.map((card) => (
          <article className="metric-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="work-panel">
        <h2>Flujo recomendado</h2>
        <div className="workflow-list">
          <span>Clientes</span>
          <span>Pedidos</span>
          <span>Detalles</span>
          <span>Pagos</span>
          <span>Nota PDF</span>
        </div>
      </section>
    </section>
  );
}
