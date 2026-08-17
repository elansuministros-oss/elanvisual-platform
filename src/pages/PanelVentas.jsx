import React from 'react';

const accesos = [
  {
    id: 'clientes',
    titulo: 'Clientes',
    descripcion: 'Ver y gestionar mis clientes.',
  },
  {
    id: 'capturaInteligente',
    titulo: 'Captura Inteligente',
    descripcion: 'Registrar cliente nuevo rápidamente.',
  },
  {
    id: 'aiStudio',
    titulo: 'AI Studio',
    descripcion: 'Conversar con IA, crear proyectos y generar borradores de cotización.',
  },
  {
    id: 'cotizador',
    titulo: 'Cotizador',
    descripcion: 'Cotizar con precios autorizados del sistema.',
  },
  {
    id: 'pedidos',
    titulo: 'Pedidos',
    descripcion: 'Consultar pedidos asignados.',
  },
  {
    id: 'seguimiento',
    titulo: 'Seguimiento',
    descripcion: 'Ver avances comerciales.',
  },
];

export default function PanelVentas({ setPage }) {
  return (
    <main
      style={{
        width: '100%',
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(1rem, 4vw, 2rem)',
        boxSizing: 'border-box',
      }}
    >
      <header style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.75rem, 6vw, 2.35rem)' }}>Panel Comercial</h2>
        <p style={{ margin: '0.65rem 0 0', lineHeight: 1.45 }}>
          Accesos del vendedor para operar clientes, cotizaciones y pedidos.
        </p>
      </header>

      <section
        aria-label="Accesos comerciales"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '0.8rem',
          width: '100%',
        }}
      >
        {accesos.map((acceso) => (
          <button
            key={acceso.id}
            type="button"
            onClick={() => setPage(acceso.id)}
            style={{
              width: '100%',
              minHeight: 92,
              margin: 0,
              padding: '1.15rem 1.25rem',
              border: 0,
              borderRadius: 20,
              background: 'var(--azul, #111827)',
              color: '#fff',
              display: 'grid',
              gridTemplateColumns: 'minmax(120px, 0.42fr) minmax(0, 0.58fr)',
              alignItems: 'center',
              gap: '1rem',
              textAlign: 'left',
              boxSizing: 'border-box',
              cursor: 'pointer',
            }}
          >
            <strong style={{ fontSize: '1.08rem', lineHeight: 1.2 }}>{acceso.titulo}</strong>
            <span style={{ fontSize: '0.98rem', lineHeight: 1.35, opacity: 0.96 }}>
              {acceso.descripcion}
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
