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
    texto: 'Consulta rÃ¡pida de Ã³rdenes de trabajo, estado, cliente, ubicaciÃ³n y prioridad.',
  },
  {
    titulo: 'ProducciÃ³n mÃ³vil',
    texto: 'Registro de avances desde taller, instalaciÃ³n o visita tÃ©cnica.',
  },
  {
    titulo: 'Evidencia fotogrÃ¡fica',
    texto: 'Base preparada para adjuntar fotos de avance, entrega, instalaciÃ³n y garantÃ­a.',
  },
  {
    titulo: 'Alertas mÃ³viles',
    texto: 'Vista preparada para futuras notificaciones push de cobros, cuentas y producciÃ³n.',
  },
  {
    titulo: 'ConfirmaciÃ³n de entrega',
    texto: 'Base para cierre operativo con responsable, fecha, hora y observaciones.',
  },
  {
    titulo: 'Modo consulta',
    texto: 'Acceso simplificado para vendedores, producciÃ³n, supervisores y gerencia.',
  },
];

export default function AppMovilCRM() {
  return (
    <div style={styles.page}>
      <section style={styles.header}>
        <span style={styles.badge}>FASE 8.2 Â· Base APK</span>
        <h2 style={styles.title}>App MÃ³vil ELANKAV</h2>
        <p style={styles.subtitle}>
          MÃ³dulo base para preparar la futura aplicaciÃ³n Android conectada al CRM CENTRAL ELANKAV.
        </p>
      </section>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Objetivo operativo</h3>
          <p style={styles.muted}>
            Esta pantalla deja definida la estructura funcional que despuÃ©s se convertirÃ¡ en APK: seguimiento de Ã³rdenes,
            producciÃ³n, instalaciones, evidencias, alertas y cierre de trabajos desde celular.
          </p>
          <ul style={styles.list}>
            <li>Acceso rÃ¡pido a Ã³rdenes activas.</li>
            <li>Seguimiento de producciÃ³n por estado.</li>
            <li>Captura futura de fotos de avance.</li>
            <li>ConfirmaciÃ³n futura de instalaciÃ³n y entrega.</li>
            <li>Alertas mÃ³viles conectadas al CRM.</li>
          </ul>
        </div>

        <div style={styles.phone}>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ“‹ Ã“rdenes activas</h4>
            <p style={styles.screenText}>Pendientes, en producciÃ³n, listas e instaladas.</p>
          </div>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ­ ProducciÃ³n</h4>
            <p style={styles.screenText}>Avance por unidad, responsable y prioridad.</p>
          </div>
          <div style={styles.screenCard}>
            <h4 style={styles.screenTitle}>ðŸ“¸ Evidencias</h4>
            <p style={styles.screenText}>Preparado para fotos de taller e instalaciÃ³n.</p>
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

