import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { useElan } from '../../core/context/ElanContext.jsx';
import AppCard from '../../components/AppCard.jsx';

export default function Dashboard() {
  const { state } = useElan();

  const data = useMemo(() => {
    const productos = state.productos || [];
    const multimedia = state.multimedia || [];
    const banners = state.banners || [];
    const pedidos = state.pedidos || [];
    const categorias = state.categorias || [];

    const productosActivos = productos.filter((p) => p.activo).length;
    const bannersActivos = banners.filter((b) => b.activo).length;
    const showroom = multimedia.filter(
      (m) => m.tipo === 'showroom' || m.tipo === 'general'
    ).length;

    return {
      productos,
      multimedia,
      banners,
      pedidos,
      categorias,
      productosActivos,
      bannersActivos,
      showroom,
      recientesProductos: [...productos].slice(-4).reverse(),
      recientesMultimedia: [...multimedia].slice(-4).reverse(),
      recientesBanners: [...banners].slice(-4).reverse(),
    };
  }, [state]);

  const cards = [
    ['Productos', data.productos.length, `${data.productosActivos} activos`],
    ['Categorías', data.categorias.length, 'Clasificación del catálogo'],
    ['Multimedia', data.multimedia.length, 'Banco de imágenes'],
    ['Banners', data.banners.length, `${data.bannersActivos} activos`],
    ['Showroom', data.showroom, 'Imágenes visibles'],
    ['Pedidos', data.pedidos.length, 'Registros actuales'],
  ];

  const alertas = [
    data.productos.length === 0 && 'No hay productos cargados.',
    data.multimedia.length === 0 && 'No hay imágenes en Multimedia.',
    data.bannersActivos === 0 && 'No hay banner activo para el Home.',
    data.categorias.length === 0 && 'No hay categorías registradas.',
  ].filter(Boolean);

  return (
    <main className="page-shell">
      <div className="page-title">
        <p className="eyebrow">Administrador</p>
        <h1>Dashboard</h1>
        <p className="muted">Resumen real del sistema ELANVISUAL V2.</p>
      </div>

      <section className="dashboard-grid">
        {cards.map(([label, value, detail]) => (
          <AppCard key={label}>
            <div className="dashboard-card">
              <p className="muted">{label}</p>
              <h2>{value}</h2>
              <small>{detail}</small>
            </div>
          </AppCard>
        ))}
      </section>

      <section className="dashboard-actions">
        <Link to="/admin/multimedia">Subir imagen</Link>
        <Link to="/admin/banners">Crear banner</Link>
        <Link to="/admin/productos">Crear producto</Link>
        <Link to="/admin/configuracion">Editar Home</Link>
      </section>

      {alertas.length > 0 && (
        <AppCard>
          <h3>Alertas operativas</h3>
          <ul className="dashboard-list">
            {alertas.map((alerta) => (
              <li key={alerta}>{alerta}</li>
            ))}
          </ul>
        </AppCard>
      )}

      <section className="dashboard-panels">
        <AppCard>
          <h3>Productos recientes</h3>
          <ul className="dashboard-list">
            {data.recientesProductos.length ? (
              data.recientesProductos.map((item) => (
                <li key={item.id}>
                  <strong>{item.nombre}</strong>
                  <span>{item.categoria || 'Sin categoría'}</span>
                </li>
              ))
            ) : (
              <li>No hay productos recientes.</li>
            )}
          </ul>
        </AppCard>

        <AppCard>
          <h3>Imágenes recientes</h3>
          <ul className="dashboard-list">
            {data.recientesMultimedia.length ? (
              data.recientesMultimedia.map((item) => (
                <li key={item.id}>
                  <strong>{item.titulo}</strong>
                  <span>{item.tipo}</span>
                </li>
              ))
            ) : (
              <li>No hay imágenes recientes.</li>
            )}
          </ul>
        </AppCard>

        <AppCard>
          <h3>Banners recientes</h3>
          <ul className="dashboard-list">
            {data.recientesBanners.length ? (
              data.recientesBanners.map((item) => (
                <li key={item.id}>
                  <strong>{item.titulo || 'Banner sin título'}</strong>
                  <span>{item.activo ? 'Activo' : 'Inactivo'}</span>
                </li>
              ))
            ) : (
              <li>No hay banners recientes.</li>
            )}
          </ul>
        </AppCard>
      </section>
    </main>
  );
}