import React from 'react';

const styles = {
  page: { display: 'grid', gap: 18 },
  header: {
    background: '#fff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
  },
  title: { margin: 0, color: '#111827' },
  subtitle: { margin: '6px 0 0', color: '#6b7280' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 },
  card: {
    background: '#fff',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,.08)',
    border: '1px solid #eef2f7',
  },
  badge: {
    display: 'inline-flex',
    borderRadius: 999,
    padding: '6px 10px',
    background: '#eef2ff',
    color: '#3730a3',
    fontWeight: 900,
    fontSize: 12,
  },
  muted: { color: '#6b7280', margin: '8px 0 0', lineHeight: 1.5 },
  list: { margin: '12px 0 0', paddingLeft: 18, color: '#374151', lineHeight: 1.7 },
  phone: {
    maxWidth: 340,
    margin: '0 auto',
    borderRadius: 32,
    border: '10px solid #111827',
    background: '#f8fafc',
    padding: 18,
    boxShadow: '0 18px 40px rgba(15,23,42,.18)',
  },
  screenCard: {
    background: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    border: '1px solid #e5e7eb',
  },
  screenTitle: { margin: 0, fontSize: 14, color: '#111827' },
  screenText: { margin: '5px 0 0', color: '#6b7280', fontSize: 12 },
};

const funciones = [
  {
    titulo: 'Ã“rdenes en campo',
    texto: 'Consulta rapida de ordenes de trabajo, estado, cliente, ubicacion y prioridad.',
  },
  {
    titulo: 'Produccion movil',
    texto: 'Registro de avances desde taller, instalacion o visita tecnica.',
  },
  {
    titulo: 'Evidencia fotografica',
    texto: 'Base preparada para adjuntar fotos de avance, entrega, instalacion y garantia.',
  },
  {
    titulo: 'Alertas moviles',
    texto: 'Vista preparada para futuras notificaciones push de cobros, cuentas y produccion.',
  },
  {
    titulo: 'Confirmacion de entrega',
    texto: 'Base para cierre operativo con responsable, fecha, hora y observaciones.',
  },
  {
    titulo: 'Modo consulta',
    texto: 'Acceso simplificado para vendedores, produccion, supervisores y gerencia.',
  },
];

export default function AppMovilCRM() {
  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <span style={styles.badge}>FASE 8.2 - Base APK</span>
        <h2 style={styles.title}>App Movil ELANKAV</h2>
        <p style={styles.subtitle}>
          Modulo base para preparar la futura aplicacion Android conectada al CRM CENTRAL ELANKAV.
        </p>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Objetivo operativo</h3>
          <p style={styles.muted}>
            Esta pantalla deja definida la estructura funcional que despues se convertira en APK: seguimiento de ordenes,
            produccion, instalaciones, evidencias, alertas y cierre de trabajos desde celular.
          </p>
          <ul style={styles.list}>
            <li>Acceso rapido a ordenes activas.</li>
            <li>Seguimiento de produccion por estado.</li>
            <li>Captura futura de fotos de avance.</li>
            <li>Confirmacion futura de instalacion y entrega.</li>
            <li>Alertas moviles conectadas al CRM.</li>
          </ul>
        </div>

        <div style={styles.phone}>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ“‹ Ã“rdenes activas</h4>
            <p style={styles.screenText}>Pendientes, en produccion, listas e instaladas.</p>
          </div>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ­ Produccion</h4>
            <p style={styles.screenText}>Avance por unidad, responsable y prioridad.</p>
          </div>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ“¸ Evidencias</h4>
            <p style={styles.screenText}>Preparado para fotos de taller e instalacion.</p>
          </div>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ”” Alertas</h4>
            <p style={styles.screenText}>Cobros, cuentas, vencimientos y entregas.</p>
          </div>
        </div>
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Funciones planificadas</h3>
        <div style={styles.grid}>
          {funciones.map((item) => (
            <div key={item.titulo} style={{ ...styles.card, boxShadow: 'none', background: '#f8fafc' }}>
              <strong>{item.titulo}</strong>
              <p style={styles.muted}>{item.texto}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

