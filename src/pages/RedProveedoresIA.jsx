import React, { useEffect, useMemo, useState } from 'react';
import {
  rpiCrearCatalogoTecnico,
  rpiCrearProveedor,
  rpiListarCatalogoTecnico,
  rpiListarProveedores
} from '../services/rpiService';
import { catalogoPilotoRPI, proveedorPilotoRPI } from '../data/rpiProveedorPiloto';

export default function RedProveedoresIA() {
  const [proveedores, setProveedores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setMensaje('');
      const [prov, cat] = await Promise.all([
        rpiListarProveedores(),
        rpiListarCatalogoTecnico()
      ]);
      setProveedores(prov);
      setCatalogo(cat);
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo cargar la Red de Proveedores IA.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const sembrarProveedorPiloto = async () => {
    try {
      setCargando(true);
      setMensaje('');

      const existente = proveedores.find((p) =>
        String(p.nombre || '').toLowerCase().includes('nauffar')
      );

      const proveedor = existente || await rpiCrearProveedor(proveedorPilotoRPI);

      const productosExistentes = new Set(
        catalogo
          .filter((item) => item.proveedor_id === proveedor.id)
          .map((item) => String(item.producto || '').toLowerCase())
      );

      const nuevosItems = catalogoPilotoRPI
        .filter((item) => !productosExistentes.has(String(item.producto || '').toLowerCase()))
        .map((item) => ({
          ...item,
          proveedor_id: proveedor.id
        }));

      if (nuevosItems.length > 0) {
        await rpiCrearCatalogoTecnico(nuevosItems);
      }

      setMensaje('Proveedor piloto NAUFFAR cargado en conocimiento técnico RPI.');
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setMensaje('No se pudo sembrar el proveedor piloto.');
    } finally {
      setCargando(false);
    }
  };

  const catalogoFiltrado = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return catalogo;

    return catalogo.filter((item) => {
      return [
        item.categoria,
        item.linea,
        item.producto,
        item.descripcion,
        item.materiales,
        item.uso_recomendado,
        item.aplicaciones,
        item.observaciones,
        item.rpi_proveedores?.nombre
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [busqueda, catalogo]);

  const categorias = useMemo(() => {
    return [...new Set(catalogo.map((item) => item.categoria).filter(Boolean))];
  }, [catalogo]);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>RPI-01 · Módulo aislado</p>
          <h1 style={styles.title}>Red de Proveedores Inteligente IA</h1>
          <p style={styles.text}>
            Base de conocimiento técnica para proveedores locales. Primero registra capacidades,
            líneas, materiales, usos y compatibilidades. Los precios, compras y automatización IA
            vienen después.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={sembrarProveedorPiloto} disabled={cargando}>
          {cargando ? 'Procesando...' : 'Cargar proveedor piloto NAUFFAR'}
        </button>
      </section>

      {mensaje && <div style={styles.message}>{mensaje}</div>}

      <section style={styles.gridStats}>
        <article style={styles.statCard}>
          <strong>{proveedores.length}</strong>
          <span>Proveedores técnicos</span>
        </article>
        <article style={styles.statCard}>
          <strong>{catalogo.length}</strong>
          <span>Registros técnicos</span>
        </article>
        <article style={styles.statCard}>
          <strong>{categorias.length}</strong>
          <span>Categorías detectadas</span>
        </article>
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h2 style={styles.subtitle}>Conocimiento técnico</h2>
            <p style={styles.smallText}>
              Sin precios obligatorios. Esta base sirve para que la IA sepa qué proveedor consultar
              según material, sistema o solución.
            </p>
          </div>

          <input
            style={styles.input}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar PVC, ACM, WPC, vidrio..."
          />
        </div>

        <div style={styles.catalogGrid}>
          {catalogoFiltrado.map((item) => (
            <article key={item.id} style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.badge}>{item.categoria || 'Sin categoría'}</span>
                <span style={item.tiene_precio ? styles.priceYes : styles.priceNo}>
                  {item.tiene_precio ? 'Con precio' : 'Sin precio'}
                </span>
              </div>

              <h3 style={styles.cardTitle}>{item.producto}</h3>
              <p style={styles.cardText}>{item.descripcion}</p>

              <div style={styles.meta}>
                <span>Proveedor</span>
                <strong>{item.rpi_proveedores?.nombre || 'No asignado'}</strong>
              </div>

              {item.observaciones && (
                <p style={styles.note}>{item.observaciones}</p>
              )}
            </article>
          ))}

          {!cargando && catalogoFiltrado.length === 0 && (
            <div style={styles.empty}>
              No hay registros técnicos todavía. Cargá el proveedor piloto para iniciar RPI-01.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    padding: '24px',
    background: '#f4f6f8',
    minHeight: '100vh',
    color: '#17202a'
  },
  hero: {
    display: 'flex',
    gap: '18px',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderRadius: '22px',
    background: '#111827',
    color: '#fff',
    marginBottom: '18px',
    flexWrap: 'wrap'
  },
  kicker: {
    margin: 0,
    color: '#93c5fd',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  title: {
    margin: '8px 0',
    fontSize: 'clamp(28px, 5vw, 44px)',
    lineHeight: 1
  },
  text: {
    margin: 0,
    maxWidth: '760px',
    color: '#d1d5db',
    fontSize: '16px'
  },
  primaryButton: {
    border: 0,
    borderRadius: '16px',
    padding: '14px 18px',
    background: '#2563eb',
    color: '#fff',
    fontWeight: 800,
    cursor: 'pointer',
    minHeight: '52px'
  },
  message: {
    padding: '14px 16px',
    background: '#ecfeff',
    border: '1px solid #67e8f9',
    borderRadius: '16px',
    marginBottom: '16px',
    fontWeight: 700
  },
  gridStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '18px'
  },
  statCard: {
    background: '#fff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
  },
  panel: {
    background: '#fff',
    borderRadius: '22px',
    padding: '20px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)'
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '18px'
  },
  subtitle: {
    margin: 0,
    fontSize: '24px'
  },
  smallText: {
    margin: '6px 0 0',
    color: '#64748b'
  },
  input: {
    border: '1px solid #cbd5e1',
    borderRadius: '14px',
    padding: '14px 16px',
    minWidth: '280px',
    fontSize: '15px'
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '14px'
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
    padding: '16px',
    background: '#ffffff'
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  badge: {
    background: '#eef2ff',
    color: '#3730a3',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800
  },
  priceNo: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800
  },
  priceYes: {
    background: '#dcfce7',
    color: '#166534',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: '20px'
  },
  cardText: {
    margin: 0,
    color: '#475569'
  },
  meta: {
    marginTop: '14px',
    display: 'grid',
    gap: '4px',
    fontSize: '13px',
    color: '#64748b'
  },
  note: {
    marginTop: '12px',
    padding: '10px',
    background: '#f8fafc',
    borderRadius: '12px',
    color: '#475569',
    fontSize: '13px'
  },
  empty: {
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '16px',
    color: '#64748b',
    fontWeight: 700
  }
};
