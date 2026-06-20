import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  PackageCheck,
  Search,
  Trash2,
  Truck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generarProduccionAutomatica } from '../services/motorProduccion';

const estados = [
  'Pedido creado',
  'Pendiente',
  'En producción',
  'Listo',
  'Instalado',
  'Entregado',
  'Cobrado',
];

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

export default function PedidosProduccion() {
  const {
    usuario,
    pedidos,
    actualizarPedido,
    proveedores = [],
    crearSolicitudProveedor,
    asignarProveedorPedido,
  } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [proveedorId, setProveedorId] = useState('');
  const [costoReal, setCostoReal] = useState('');
  const [tiempoEntrega, setTiempoEntrega] = useState('');

  const tieneAcceso =
    usuario?.rol === 'admin' ||
    usuario?.rol === 'ventas' ||
    usuario?.rol === 'produccion';

  const pedidosFiltrados = useMemo(() => {
    const lista = Array.isArray(pedidos) ? pedidos : [];

    return lista.filter((p) => {
      const texto = `
        ${p.numeroPedido || p.numero || ''}
        ${p.numeroOT || p.ordenTrabajo?.codigoOT || ''}
        ${p.cliente?.empresa || ''}
        ${p.cliente?.nombre || ''}
        ${p.cliente?.contacto || ''}
        ${p.proyecto?.lugar || ''}
        ${p.estado || ''}
      `.toLowerCase();

      return (
        texto.includes(busqueda.toLowerCase()) &&
        (estadoFiltro === 'Todos' || p.estado === estadoFiltro)
      );
    });
  }, [pedidos, busqueda, estadoFiltro]);

  const abrirPedido = (pedido) => {
    setPedidoActivo(pedido);
  };

  const volverListaMobile = () => {
    setPedidoActivo(null);
  };

  const actualizarEstado = (id, estado) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    const pedidoActualizado = {
      ...pedido,
      estado,
      produccion: {
        ...(pedido.produccion || {}),
        estado,
      },
    };

    actualizarPedido(pedidoActualizado);

    if (pedidoActivo?.id === id) {
      setPedidoActivo(pedidoActualizado);
    }
  };

  const eliminarPedido = (id) => {
    if (!confirm('¿Cancelar este pedido?')) return;

    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    actualizarPedido({
      ...pedido,
      estado: 'cancelado',
      estadoProduccion: 'cancelado',
      seguimientoEstado: 'cancelado',
      produccion: {
        ...(pedido.produccion || {}),
        estado: 'cancelado',
      },
    });

    if (pedidoActivo?.id === id) setPedidoActivo(null);
  };

  const produccionAutomatica = (pedido) =>
    generarProduccionAutomatica({
      pedido,
      sistemaConstructivo:
        pedido?.sistemaConstructivo || pedido?.cotizacion?.sistemaConstructivo,
      proveedores,
    });

  const textoOT = (pedido) => {
    if (!pedido) return '';

    const items = pedido.items || [];
    const numeroOT = pedido.numeroOT || pedido.ordenTrabajo?.codigoOT || '';
    const numeroPedido = pedido.numeroPedido || pedido.numero || '';

    return [
      `*ORDEN DE PRODUCCIÓN ${numeroOT}*`,
      `Pedido: ${numeroPedido}`,
      `Estado: ${pedido.estado || ''}`,
      '',
      '*Cliente*',
      pedido.cliente?.empresa ? `Empresa: ${pedido.cliente.empresa}` : '',
      pedido.cliente?.nombre ? `Nombre: ${pedido.cliente.nombre}` : '',
      pedido.cliente?.contacto ? `Contacto: ${pedido.cliente.contacto}` : '',
      pedido.cliente?.whatsapp ? `WhatsApp: ${pedido.cliente.whatsapp}` : '',
      '',
      '*Proyecto*',
      pedido.proyecto?.lugar ? `Lugar: ${pedido.proyecto.lugar}` : '',
      pedido.proyecto?.direccion ? `Dirección: ${pedido.proyecto.direccion}` : '',
      pedido.proyecto?.contactoSitio
        ? `Contacto en sitio: ${pedido.proyecto.contactoSitio}`
        : '',
      pedido.proyecto?.whatsappSitio
        ? `WhatsApp en sitio: ${pedido.proyecto.whatsappSitio}`
        : '',
      '',
      '*Ítems de producción*',
      ...items.map((item, index) => {
        const medida =
          item.tipoCalculo === 'unidad'
            ? `Cantidad: ${item.cantidad}`
            : `${item.ancho || ''} x ${item.alto || ''} m · Cantidad: ${item.cantidad}`;

        const accesorios =
          item.accesoriosProduccion?.length > 0
            ? item.accesoriosProduccion
                .map((a) => `${a.nombre}: ${Number(a.cantidad).toFixed(2)} ${a.tipo}`)
                .join(' · ')
            : 'Sin accesorios automáticos';

        return `${index + 1}. ${item.descripcion || item.nombre || 'Ítem'}
${medida}
Instalación: ${item.instalacion || 'No'}
Accesorios: ${accesorios}
${item.nota ? `Nota: ${item.nota}` : ''}`;
      }),
      '',
      '*Logística*',
      pedido.logistica?.modalidad || '',
      pedido.logistica?.km ? `KM: ${pedido.logistica.km}` : '',
      pedido.logistica?.altura ? `Altura: ${pedido.logistica.altura}` : '',
      pedido.logistica?.complejidad
        ? `Complejidad: ${pedido.logistica.complejidad}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const solicitarRecotizacion = (pedido) => {
    const solicitud = crearSolicitudProveedor?.(pedido);
    alert(`Solicitud de recotización generada: ${solicitud?.codigo || ''}`);
  };

  const asignarProveedor = (pedido) => {
    if (!proveedorId) return alert('Seleccioná proveedor.');
    if (!costoReal) return alert('Indicá costo real.');

    const actualizado = asignarProveedorPedido?.({
      pedidoId: pedido.id,
      proveedorId,
      costoReal,
      tiempoEntrega,
      nota: 'Asignado desde Pedidos / OT',
    });

    if (actualizado) {
      setPedidoActivo(actualizado);
      setProveedorId('');
      setCostoReal('');
      setTiempoEntrega('');
      alert('Proveedor asignado y costo real actualizado.');
    }
  };

  const copiarOT = async (pedido) => {
    try {
      await navigator.clipboard.writeText(textoOT(pedido));
      alert('OT copiada para producción.');
    } catch {
      alert('No se pudo copiar automáticamente.');
    }
  };

  if (!tieneAcceso) {
    return (
      <main className="pedidos-page">
        <section className="pedidos-lock">
          <ClipboardList size={44} />
          <h1>Acceso restringido</h1>
          <p>Este módulo es para administración, ventas y producción.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={`pedidos-page ${pedidoActivo ? 'mobile-detail-open' : ''}`}>
      <section className="pedidos-hero">
        <span>ELANVISUAL · Producción</span>
        <h1>Pedidos y OT</h1>
        <p>Control operativo de pedidos generados desde el Cotizador Visual.</p>
      </section>

      <section className="pedidos-tools">
        <div className="search-box">
          <Search size={18} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar pedido, OT, cliente o lugar..."
          />
        </div>

        <select value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
          <option>Todos</option>
          {estados.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
      </section>

      <section className="pedidos-grid">
        <section className="pedidos-list">
          {pedidosFiltrados.map((pedido) => {
            const numeroPedido = pedido.numeroPedido || pedido.numero || '';
            const numeroOT = pedido.numeroOT || pedido.ordenTrabajo?.codigoOT || '';

            return (
              <article
                key={pedido.id}
                className={`pedido-card ${pedidoActivo?.id === pedido.id ? 'active' : ''}`}
                onClick={() => abrirPedido(pedido)}
              >
                <div>
                  <strong>{numeroPedido}</strong>
                  <span>{numeroOT}</span>
                </div>

                <h2>
                  {pedido.cliente?.empresa ||
                    pedido.cliente?.nombre ||
                    pedido.cliente?.contacto ||
                    'Cliente'}
                </h2>

                <p>{pedido.proyecto?.lugar || 'Sin lugar definido'}</p>

                <div className="pedido-meta">
                  <small>{pedido.estado}</small>
                  <b>{money(pedido.resumen?.total)}</b>
                </div>
              </article>
            );
          })}

          {pedidosFiltrados.length === 0 && (
            <div className="empty">No hay pedidos guardados todavía.</div>
          )}
        </section>

        <section className="pedido-detail">
          {!pedidoActivo && (
            <div className="empty detail-empty">Seleccioná un pedido para ver la OT.</div>
          )}

          {pedidoActivo && (
            <>
              <button className="mobile-back-btn" type="button" onClick={volverListaMobile}>
                <ArrowLeft size={18} />
                Volver a pedidos
              </button>

              <div className="detail-head">
                <div>
                  <span>{pedidoActivo.numeroPedido || pedidoActivo.numero}</span>
                  <h2>{pedidoActivo.numeroOT || pedidoActivo.ordenTrabajo?.codigoOT}</h2>
                  <p>
                    {pedidoActivo.cliente?.empresa ||
                      pedidoActivo.cliente?.nombre ||
                      pedidoActivo.cliente?.contacto ||
                      'Cliente'}
                  </p>
                </div>

                <PackageCheck size={34} />
              </div>

              <label>
                Estado operativo
                <select
                  value={pedidoActivo.estado}
                  onChange={(e) => actualizarEstado(pedidoActivo.id, e.target.value)}
                >
                  {estados.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>

              <div className="totals-box">
                <p>
                  <span>Total</span>
                  <b>{money(pedidoActivo.resumen?.total)}</b>
                </p>
                <p>
                  <span>Anticipo 60%</span>
                  <b>{money(pedidoActivo.resumen?.anticipo)}</b>
                </p>
                <p>
                  <span>Saldo 40%</span>
                  <b>{money(pedidoActivo.resumen?.saldo)}</b>
                </p>
              </div>

              <div className="items-box">
                <h3>Ítems producción</h3>

                {(pedidoActivo.items || []).map((item) => (
                  <article key={item.id} className="item-prod">
                    <strong>{item.descripcion || item.nombre}</strong>
                    <p>
                      {item.tipoCalculo === 'unidad'
                        ? `Cantidad: ${item.cantidad}`
                        : `${item.ancho || ''} x ${item.alto || ''} m · Cantidad: ${item.cantidad}`}
                    </p>
                    <span>Instalación: {item.instalacion || 'No'}</span>

                    {item.accesoriosProduccion?.length > 0 && (
                      <small>
                        {item.accesoriosProduccion
                          .map(
                            (a) =>
                              `${a.nombre}: ${Number(a.cantidad).toFixed(2)} ${a.tipo}`
                          )
                          .join(' · ')}
                      </small>
                    )}
                  </article>
                ))}
              </div>

              <div className="logistica-box">
                <Truck size={20} />
                <div>
                  <strong>{pedidoActivo.logistica?.modalidad || 'Logística no definida'}</strong>
                  <p>
                    KM: {pedidoActivo.logistica?.km || 'N/A'} · Altura:{' '}
                    {pedidoActivo.logistica?.altura || 'N/A'} · Complejidad:{' '}
                    {pedidoActivo.logistica?.complejidad || 'Normal'}
                  </p>
                </div>
              </div>

              <div className="action-stack">
                <button className="primary-btn" type="button" onClick={() => copiarOT(pedidoActivo)}>
                  <Copy size={18} />
                  Copiar OT producción
                </button>

                <button className="danger-btn" type="button" onClick={() => eliminarPedido(pedidoActivo.id)}>
                  <Trash2 size={18} />
                  Cancelar pedido
                </button>
              </div>

              <textarea className="ot-text" value={textoOT(pedidoActivo)} readOnly />
            </>
          )}
        </section>
      </section>

      <style>{`
        .pedidos-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .pedidos-hero,.pedidos-tools,.pedido-detail,.pedido-card,.pedidos-lock{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .pedidos-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .pedidos-hero h1{margin:8px 0;font-size:30px;color:#111827;line-height:1}
        .pedidos-hero p{margin:0;color:#64748b;font-weight:750;line-height:1.45}
        .pedidos-tools{display:grid;grid-template-columns:1fr 240px;gap:12px}
        .search-box{display:flex;align-items:center;gap:8px;border:1px solid #dbe3ef;border-radius:16px;padding:0 12px;background:#fff}
        .search-box input{border:0;padding-left:0}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:14px;font-size:16px;background:#fff;color:#0f172a}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        .pedidos-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:14px;align-items:start}
        .pedidos-list{display:grid;gap:12px}
        .pedido-card{cursor:pointer;border:2px solid transparent;display:grid;gap:8px}
        .pedido-card.active{border-color:#111827}
        .pedido-card div:first-child{display:flex;justify-content:space-between;gap:10px}
        .pedido-card strong{font-size:20px;color:#111827}
        .pedido-card span{font-weight:950;color:#b48722}
        .pedido-card h2{margin:0;font-size:17px;color:#111827}
        .pedido-card p{margin:0;color:#64748b;font-weight:750}
        .pedido-meta{display:flex;justify-content:space-between;align-items:center}
        .pedido-meta small{background:#eef2ff;color:#3730a3;border-radius:999px;padding:7px 10px;font-weight:950}
        .pedido-meta b{font-size:18px;color:#111827}
        .detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:16px}
        .detail-head span{font-weight:950;color:#b48722}
        .detail-head h2{margin:4px 0;font-size:28px;color:#111827}
        .detail-head p{margin:0;color:#64748b;font-weight:800}
        .totals-box{background:#0f172a;color:#fff;border-radius:20px;padding:16px;margin:16px 0;display:grid;gap:8px}
        .totals-box p{display:flex;justify-content:space-between;margin:0;color:#dbeafe}
        .items-box{display:grid;gap:10px;margin:16px 0}
        .items-box h3{margin:0;color:#111827}
        .item-prod{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;display:grid;gap:5px}
        .item-prod strong{color:#111827}
        .item-prod p,.item-prod span,.item-prod small{margin:0;color:#64748b;font-weight:800}
        .logistica-box{background:#fffbeb;border:1px solid #fde68a;border-radius:18px;padding:14px;display:flex;gap:10px;margin:16px 0;color:#92400e}
        .logistica-box p{margin:4px 0 0;font-weight:800}
        .action-stack{display:grid;gap:10px}
        .primary-btn,.danger-btn,.mobile-back-btn{width:100%;border:0;border-radius:18px;padding:15px;font-weight:950;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}
        .primary-btn{background:#111827;color:#fff}
        .danger-btn{background:#fee2e2;color:#991b1b}
        .mobile-back-btn{display:none;background:#e2e8f0;color:#0f172a;margin-bottom:14px}
        .ot-text{margin-top:14px;font-family:monospace;min-height:300px}
        .empty{padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:18px;font-weight:800;background:#fff}
        .detail-empty{min-height:260px;display:grid;place-items:center}
        .pedidos-lock{text-align:center;margin:40px auto;max-width:420px}

        @media(max-width:850px){
          .pedidos-page{padding:12px;display:block}
          .pedidos-hero,.pedidos-tools{margin-bottom:12px}
          .pedidos-tools,.pedidos-grid{grid-template-columns:1fr}
          .pedidos-grid{display:block}
          .pedidos-list{display:grid;gap:12px}
          .pedido-detail{display:none}
          .mobile-detail-open .pedidos-hero,
          .mobile-detail-open .pedidos-tools,
          .mobile-detail-open .pedidos-list{display:none}
          .mobile-detail-open .pedido-detail{display:block;border-radius:22px;min-height:calc(100vh - 24px)}
          .mobile-back-btn{display:flex}
          .pedidos-hero h1{font-size:27px}
          input,select,textarea{font-size:16px;padding:15px}
          .primary-btn,.danger-btn,.mobile-back-btn{min-height:54px}
          .detail-head h2{font-size:24px}
          .ot-text{min-height:220px}
        }
      `}</style>
    </main>
  );
}