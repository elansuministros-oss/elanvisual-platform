import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Copy,
  DollarSign,
  Factory,
  PackageCheck,
  Search,
  ShieldCheck,
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
  'Cerrado',
];

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const n = (v) => Number(v || 0);

const getTotal = (pedido) => n(pedido?.resumen?.total || pedido?.total);
const getAnticipo = (pedido) => n(pedido?.anticipoRecibido || pedido?.pagos?.anticipoRecibido);
const getSaldo = (pedido) => Math.max(getTotal(pedido) - getAnticipo(pedido), 0);
const getOT = (pedido) => pedido?.numeroOT || pedido?.ordenTrabajo?.codigoOT || `OT-${String(pedido?.id || '').slice(-6)}`;

export default function PedidosProduccion() {
  const {
    configuracion,
    usuario,
    pedidos,
    actualizarPedido,
    eliminarPedido: eliminarPedidoDefinitivo,
    proveedores = [],
    cotizacionesProveedor = [],
    crearSolicitudProveedor,
    registrarRespuestaProveedor,
    asignarProveedorPedido,
    calcularCostoReal,
    calcularUtilidadReal,
    generarComisionAutomatica,
  } = useApp();

  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('Todos');
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [tab, setTab] = useState('comercial');

  const [pagoMoneda, setPagoMoneda] = useState('NIO');
  const [pagoMonto, setPagoMonto] = useState('');
  const [tipoCambio, setTipoCambio] = useState('36.80');
  const [pagoFecha, setPagoFecha] = useState(new Date().toISOString().slice(0, 10));
  const [pagoForma, setPagoForma] = useState('Transferencia');
  const [pagoBanco, setPagoBanco] = useState('');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [pagoObservaciones, setPagoObservaciones] = useState('');

  const [proveedorId, setProveedorId] = useState('');
  const [costoRealProveedor, setCostoRealProveedor] = useState('');
  const [tiempoEntrega, setTiempoEntrega] = useState('');
  const [notaProveedor, setNotaProveedor] = useState('');

  const [costos, setCostos] = useState({
    costoInventario: '',
    costoProveedor: '',
    costoImpresion: '',
    costoEstructura: '',
    costoTransporte: '',
    costoInstalacion: '',
    costoAdministracion: '',
  });

  const tieneAcceso =
    usuario?.rol === 'admin' ||
    usuario?.rol === 'ventas' ||
    usuario?.rol === 'produccion';

  const esAdmin = usuario?.rol === 'admin';
  const puedeVerCostos = esAdmin;

  const pedidosFiltrados = useMemo(() => {
    const lista = Array.isArray(pedidos) ? pedidos : [];

    return lista.filter((p) => {
      const texto = `
        ${p.numeroPedido || p.numero || ''}
        ${getOT(p)}
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

  const solicitudActiva = useMemo(() => {
    if (!pedidoActivo) return null;
    return cotizacionesProveedor.find((s) => s.pedidoId === pedidoActivo.id);
  }, [cotizacionesProveedor, pedidoActivo]);

  const actualizarActivo = (pedidoActualizado) => {
    actualizarPedido(pedidoActualizado);
    setPedidoActivo(pedidoActualizado);
  };

  const actualizarEstado = (id, estado) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;

    actualizarActivo({
      ...pedido,
      estado,
      produccion: {
        ...(pedido.produccion || {}),
        estado,
      },
      historial: [
        ...(pedido.historial || []),
        {
          estado,
          fecha: new Date().toISOString(),
          nota: `Estado actualizado a ${estado}.`,
        },
      ],
    });
  };

  const registrarPagoCliente = () => {
    if (!esAdmin) return alert('Solo administración puede registrar pagos.');
    if (!pedidoActivo) return;

    const montoRecibido = n(pagoMonto);
    const tc = n(pedidoActivo.tipoCambioCongelado || tipoCambio);

    if (montoRecibido <= 0) return alert('Indicá un monto válido.');
    if (pagoMoneda === 'NIO' && tc <= 0) return alert('Indicá un tipo de cambio válido.');

    const montoUSD = pagoMoneda === 'NIO' ? montoRecibido / tc : montoRecibido;
    const montoNIO = pagoMoneda === 'NIO' ? montoRecibido : montoRecibido * tc;

    const total = getTotal(pedidoActivo);
    const anticipoAnterior = getAnticipo(pedidoActivo);
    const anticipoNuevo = Math.min(total, anticipoAnterior + montoUSD);
    const saldoNuevo = Math.max(total - anticipoNuevo, 0);

    const numeroRecibo = `RC-${String(Date.now()).slice(-6)}`;

    const pago = {
      id: `pago-${Date.now()}`,
      recibo: numeroRecibo,
      fechaDeposito: pagoFecha,
      fechaRegistro: new Date().toISOString(),
      moneda: pagoMoneda,
      montoRecibido,
      montoUSD,
      montoNIO,
      tipoCambio: tc,
      formaPago: pagoForma,
      banco: pagoBanco,
      referencia: referenciaPago,
      observaciones: pagoObservaciones,
    };

    actualizarActivo({
      ...pedidoActivo,
      anticipoRecibido: anticipoNuevo,
      saldoPendiente: saldoNuevo,
      tipoCambioCongelado: pedidoActivo.tipoCambioCongelado || tc,
      ultimoPago: pago,
      pagoEstado: saldoNuevo <= 0 ? 'Pagado' : 'Pago parcial',
      pagos: {
        ...(pedidoActivo.pagos || {}),
        estadoPago: saldoNuevo <= 0 ? 'Pagado' : 'Pago parcial',
        anticipoRecibido: anticipoNuevo,
        saldoPendiente: saldoNuevo,
        tipoCambioCongelado: pedidoActivo.tipoCambioCongelado || tc,
        historial: [...(pedidoActivo.pagos?.historial || []), pago],
      },
      historial: [
        ...(pedidoActivo.historial || []),
        {
          estado: 'pago_cliente',
          fecha: new Date().toISOString(),
          nota: `Pago cliente registrado. Recibo ${numeroRecibo}. USD ${montoUSD.toFixed(2)}.`,
        },
      ],
    });

    setPagoMonto('');
    setReferenciaPago('');
    setPagoBanco('');
    setPagoObservaciones('');
    alert(`Pago registrado. Recibo ${numeroRecibo}.`);
  };

  const imprimirReciboCaja = () => {
    if (!pedidoActivo) return;

    const pago =
      pedidoActivo.ultimoPago ||
      pedidoActivo.pagos?.historial?.[pedidoActivo.pagos.historial.length - 1];

    if (!pago) return alert('Primero registrá un pago.');

    const marca = configuracion?.logoTexto || 'ELANVISIÓN';
    const logo = configuracion?.logo || '';
    const total = getTotal(pedidoActivo);
    const pagado = getAnticipo(pedidoActivo);
    const saldo = getSaldo(pedidoActivo);
    const cliente =
      pedidoActivo.cliente?.empresa ||
      pedidoActivo.cliente?.nombre ||
      pedidoActivo.cliente?.contacto ||
      'Cliente';
    const pedidoNumero = pedidoActivo.numeroPedido || pedidoActivo.numero || '';
    const ot = getOT(pedidoActivo);

    const html = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${pago.recibo || 'Recibo'} - ${marca}</title>
        <style>
          @page{size:5.5in 8.5in;margin:0.28in}
          *{box-sizing:border-box}
          body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111827;background:#fff}
          .receipt{width:100%;min-height:7.9in;border:2px solid #111827;padding:18px;display:flex;flex-direction:column;gap:14px}
          .head{display:flex;justify-content:space-between;gap:14px;border-bottom:3px solid #b48722;padding-bottom:12px}
          .brand{display:flex;gap:12px;align-items:center}
          .logo-img{width:118px;max-height:88px;object-fit:contain}
          .logo-mark{width:72px;height:72px;border-radius:18px;background:#111827;color:#fff;display:grid;place-items:center;font-weight:900;font-size:24px}
          h1{margin:0;font-size:24px;color:#111827;letter-spacing:.02em}
          .brand p{margin:3px 0 0;font-size:11px;color:#475569;font-weight:700}
          .meta{text-align:right}
          .meta strong{display:block;color:#b48722;font-size:18px}
          .meta span{display:block;font-size:12px;color:#475569;font-weight:800;margin-top:4px}
          .title{background:#111827;color:#fff;border-radius:14px;padding:10px 12px;text-align:center;font-size:16px;font-weight:900;letter-spacing:.08em}
          .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
          .box{border:1px solid #dbe3ef;border-radius:12px;padding:10px;background:#f8fafc}
          .box small{display:block;text-transform:uppercase;font-size:9px;font-weight:900;color:#64748b;margin-bottom:4px}
          .box b{font-size:13px;color:#111827}
          .amount{border:2px solid #111827;border-radius:16px;padding:14px;text-align:center;background:#fffbeb}
          .amount small{display:block;font-size:10px;font-weight:900;color:#92400e;text-transform:uppercase}
          .amount h2{margin:5px 0 0;font-size:28px;color:#111827}
          .summary{display:grid;gap:7px;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:10px 0}
          .summary p{display:flex;justify-content:space-between;margin:0;font-size:13px}
          .summary span{color:#475569;font-weight:800}
          .summary b{color:#111827}
          .obs{min-height:70px;border:1px dashed #cbd5e1;border-radius:12px;padding:10px;font-size:12px;color:#334155;white-space:pre-wrap}
          .foot{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:28px}
          .sign{border-top:1px solid #111827;text-align:center;padding-top:7px;font-size:11px;font-weight:900;color:#334155}
          .legal{font-size:10px;color:#64748b;text-align:center;line-height:1.35;margin-top:8px}
        </style>
      </head>
      <body>
        <section class="receipt">
          <header class="head">
            <div class="brand">
              ${
                logo
                  ? `<img src="${logo}" class="logo-img" />`
                  : `<div class="logo-mark">EV</div>`
              }
              <div>
                <h1>${marca}</h1>
                <p>Soluciones de Rotulación e Imagen Comercial</p>
                <p><strong>RUC: 4012805831001E</strong></p>
              </div>
            </div>
            <div class="meta">
              <strong>${pago.recibo || 'RC'}</strong>
              <span>${new Date().toLocaleDateString('es-NI')}</span>
            </div>
          </header>

          <div class="title">RECIBO OFICIAL DE CAJA</div>

          <div class="grid">
            <div class="box"><small>Cliente</small><b>${cliente}</b></div>
            <div class="box"><small>Pedido / OT</small><b>${pedidoNumero} · ${ot}</b></div>
            <div class="box"><small>Fecha depósito</small><b>${pago.fechaDeposito || ''}</b></div>
            <div class="box"><small>Forma de pago</small><b>${pago.formaPago || ''}</b></div>
            <div class="box"><small>Banco</small><b>${pago.banco || 'No especificado'}</b></div>
            <div class="box"><small>Referencia</small><b>${pago.referencia || 'No especificada'}</b></div>
          </div>

          <div class="amount">
            <small>Monto recibido</small>
            <h2>${pago.moneda === 'NIO' ? `C$ ${Number(pago.montoRecibido || 0).toFixed(2)}` : money(pago.montoRecibido)}</h2>
            <small>Equivalente USD ${Number(pago.montoUSD || 0).toFixed(2)} · TC ${Number(pago.tipoCambio || 0).toFixed(2)}</small>
          </div>

          <div class="summary">
            <p><span>Total pedido</span><b>${money(total)}</b></p>
            <p><span>Pagado acumulado</span><b>${money(pagado)}</b></p>
            <p><span>Saldo pendiente</span><b>${money(saldo)}</b></p>
          </div>

          <div class="obs">${pago.observaciones || 'Pago recibido conforme a condiciones de cotización y orden de trabajo.'}</div>

          <div class="foot">
            <div class="sign">Recibido por ELANVISUAL</div>
            <div class="sign">Firma cliente</div>
          </div>

          <div class="legal">Este recibo soporta el pago registrado para la orden indicada. Producción inicia según validación administrativa y disponibilidad de materiales.</div>
        </section>
        <script>
          window.onload = () => {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=650,height=900');
    if (!win) return alert('El navegador bloqueó la ventana de impresión.');
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const solicitarRecotizacion = () => {
    if (!pedidoActivo) return;
    const solicitud = crearSolicitudProveedor?.(pedidoActivo);
    alert(`Solicitud generada: ${solicitud?.codigo || ''}`);
  };

  const registrarRespuesta = () => {
    if (!solicitudActiva) return alert('Primero generá una solicitud de recotización.');
    if (!proveedorId) return alert('Seleccioná proveedor.');
    if (n(costoRealProveedor) <= 0) return alert('Indicá costo real.');

    registrarRespuestaProveedor?.({
      solicitudId: solicitudActiva.id,
      proveedorId,
      monto: costoRealProveedor,
      tiempoEntrega,
      nota: notaProveedor,
    });

    alert('Respuesta de proveedor registrada.');
  };

  const asignarProveedor = () => {
    if (!pedidoActivo) return;
    if (!proveedorId) return alert('Seleccioná proveedor.');
    if (n(costoRealProveedor) <= 0) return alert('Indicá costo real.');

    const actualizado = asignarProveedorPedido?.({
      pedidoId: pedidoActivo.id,
      proveedorId,
      costoReal: costoRealProveedor,
      tiempoEntrega,
      nota: notaProveedor || 'Asignado desde Pedidos / OT',
    });

    if (actualizado) {
      setPedidoActivo(actualizado);
      setCostos((prev) => ({ ...prev, costoProveedor: costoRealProveedor }));
      setProveedorId('');
      setCostoRealProveedor('');
      setTiempoEntrega('');
      setNotaProveedor('');
      alert('Proveedor asignado y costo real actualizado.');
    }
  };

  const registrarCostosReales = () => {
    if (!esAdmin) return alert('Solo administración puede registrar costos reales.');
    if (!pedidoActivo) return;

    const costoTotal =
      n(costos.costoInventario) +
      n(costos.costoProveedor) +
      n(costos.costoImpresion) +
      n(costos.costoEstructura) +
      n(costos.costoTransporte) +
      n(costos.costoInstalacion) +
      n(costos.costoAdministracion);

    const otId = getOT(pedidoActivo);
    const ventaCliente = getTotal(pedidoActivo);

    const costoRegistro = calcularCostoReal?.({
      otId,
      ...costos,
    });

    const utilidadRegistro = calcularUtilidadReal?.({
      otId,
      ventaCliente,
      costoReal: costoTotal,
    });

    actualizarActivo({
      ...pedidoActivo,
      costos: {
        ...(pedidoActivo.costos || {}),
        ...costos,
        costoTotalReal: costoTotal,
        actualizadoEn: new Date().toISOString(),
      },
      utilidad: {
        ...(pedidoActivo.utilidad || {}),
        ventaCliente,
        costoReal: costoTotal,
        utilidadReal: ventaCliente - costoTotal,
        porcentajeUtilidad: ventaCliente > 0 ? ((ventaCliente - costoTotal) / ventaCliente) * 100 : 0,
        costoRegistroId: costoRegistro?.id,
        utilidadRegistroId: utilidadRegistro?.id,
      },
      historial: [
        ...(pedidoActivo.historial || []),
        {
          estado: 'costos_reales',
          fecha: new Date().toISOString(),
          nota: `Costos reales registrados por ${money(costoTotal)}.`,
        },
      ],
    });

    alert('Costos reales registrados.');
  };

  const liquidarOT = () => {
    if (!esAdmin) return alert('Solo administración puede liquidar la OT.');
    if (!pedidoActivo) return;

    const ventaCliente = getTotal(pedidoActivo);
    const costoReal = n(pedidoActivo.costos?.costoTotalReal);
    const utilidadReal = ventaCliente - costoReal;
    const entregado = ['Entregado', 'Cobrado', 'Cerrado'].includes(pedidoActivo.estado);

    if (!entregado) return alert('La OT debe estar entregada antes de liquidar.');
    if (costoReal <= 0) return alert('Faltan costos reales completos.');
    if (utilidadReal <= 0) return alert('La utilidad real no permite liquidación positiva.');

    const comision = generarComisionAutomatica?.({
      otId: getOT(pedidoActivo),
      utilidadReal,
      vendedorId: pedidoActivo.vendedor?.id || '',
      vendedorNombre: pedidoActivo.vendedor?.nombre || '',
    });

    actualizarActivo({
      ...pedidoActivo,
      estado: 'Cerrado',
      liquidacion: {
        estado: 'Liquidada',
        fecha: new Date().toISOString(),
        ventaCliente,
        costoReal,
        utilidadReal,
        comisionId: comision?.id,
      },
      comisionEstado: 'generada',
      historial: [
        ...(pedidoActivo.historial || []),
        {
          estado: 'liquidada',
          fecha: new Date().toISOString(),
          nota: 'OT liquidada con utilidad real.',
        },
      ],
    });

    alert('OT liquidada correctamente.');
  };

  const borrarPedidoDefinitivo = () => {
    if (!esAdmin) return alert('Solo administración puede eliminar pedidos definitivamente.');
    if (!pedidoActivo) return;

    const codigo = pedidoActivo.numeroPedido || pedidoActivo.numero || getOT(pedidoActivo);
    const confirmacion = window.prompt(
      `Para eliminar definitivamente el pedido ${codigo}, escribí ELIMINAR`
    );

    if (confirmacion !== 'ELIMINAR') return;

    eliminarPedidoDefinitivo?.(pedidoActivo.id);
    setPedidoActivo(null);
    alert('Pedido eliminado definitivamente.');
  };

  const cancelarPedido = (id) => {
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
    const auto = produccionAutomatica(pedido);

    return [
      `*ORDEN DE PRODUCCIÓN ${getOT(pedido)}*`,
      `Pedido: ${pedido.numeroPedido || pedido.numero || ''}`,
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
      '',
      '*Ítems de producción*',
      ...items.map((item, index) => {
        const medida =
          item.tipoCalculo === 'unidad'
            ? `Cantidad: ${item.cantidad}`
            : `${item.ancho || ''} x ${item.alto || ''} m · Cantidad: ${item.cantidad}`;

        return `${index + 1}. ${item.descripcion || item.nombre || 'Ítem'}
${medida}
Instalación: ${item.instalacion || 'No'}
Nota: ${item.nota || ''}`;
      }),
      '',
      '*Producción automática*',
      ...(auto?.materiales || []).map((m) => `- ${m.nombre || m.material}: ${m.cantidad || ''} ${m.unidad || ''}`),
      '',
      '*Logística*',
      pedido.logistica?.modalidad || '',
      pedido.logistica?.km ? `KM: ${pedido.logistica.km}` : '',
      pedido.logistica?.altura ? `Altura: ${pedido.logistica.altura}` : '',
      pedido.logistica?.complejidad ? `Complejidad: ${pedido.logistica.complejidad}` : '',
    ]
      .filter(Boolean)
      .join('\n');
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
        <span>ELANVISUAL · ERP · AI-09.2</span>
        <h1>Pedidos y Orden de Trabajo</h1>
        <p>Control comercial, producción, pagos, costos reales y liquidación.</p>
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
          {pedidosFiltrados.map((pedido) => (
            <article
              key={pedido.id}
              className={`pedido-card ${pedidoActivo?.id === pedido.id ? 'active' : ''}`}
              onClick={() => {
                setPedidoActivo(pedido);
                setTab('comercial');
              }}
            >
              <div>
                <strong>{pedido.numeroPedido || pedido.numero || 'Pedido'}</strong>
                <span>{getOT(pedido)}</span>
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
                <b>{money(getTotal(pedido))}</b>
              </div>
            </article>
          ))}

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
              <button className="mobile-back-btn" type="button" onClick={() => setPedidoActivo(null)}>
                <ArrowLeft size={18} />
                Volver a pedidos
              </button>

              <div className="detail-head">
                <div>
                  <span>{pedidoActivo.numeroPedido || pedidoActivo.numero}</span>
                  <h2>{getOT(pedidoActivo)}</h2>
                  <p>
                    {pedidoActivo.cliente?.empresa ||
                      pedidoActivo.cliente?.nombre ||
                      pedidoActivo.cliente?.contacto ||
                      'Cliente'}
                  </p>
                </div>

                <PackageCheck size={34} />
              </div>

              <div className="tabs">
                <button className={tab === 'comercial' ? 'active' : ''} onClick={() => setTab('comercial')}>Comercial</button>
                <button className={tab === 'produccion' ? 'active' : ''} onClick={() => setTab('produccion')}>Producción</button>
                {puedeVerCostos && <button className={tab === 'proveedores' ? 'active' : ''} onClick={() => setTab('proveedores')}>Proveedores</button>}
                {puedeVerCostos && <button className={tab === 'costos' ? 'active' : ''} onClick={() => setTab('costos')}>Costos</button>}
                {puedeVerCostos && <button className={tab === 'rentabilidad' ? 'active' : ''} onClick={() => setTab('rentabilidad')}>Rentabilidad</button>}
              </div>

              {tab === 'comercial' && (
                <section className="panel">
                  <h3><DollarSign size={18} /> Comercial y pagos cliente</h3>

                  <div className="totals-box">
                    <p><span>Total venta</span><b>{money(getTotal(pedidoActivo))}</b></p>
                    <p><span>Pagado</span><b>{money(getAnticipo(pedidoActivo))}</b></p>
                    <p><span>Saldo</span><b>{money(getSaldo(pedidoActivo))}</b></p>
                    <p><span>Tipo cambio congelado</span><b>{pedidoActivo.tipoCambioCongelado || pedidoActivo.pagos?.tipoCambioCongelado || 'No congelado'}</b></p>
                  </div>

                  {esAdmin && (
                    <div className="form-grid">
                      <label>
                        Moneda
                        <select value={pagoMoneda} onChange={(e) => setPagoMoneda(e.target.value)}>
                          <option value="NIO">Córdobas C$</option>
                          <option value="USD">Dólares USD</option>
                        </select>
                      </label>
                      <label>Fecha depósito<input type="date" value={pagoFecha} onChange={(e) => setPagoFecha(e.target.value)} /></label>
                      <label>Monto recibido<input value={pagoMonto} onChange={(e) => setPagoMonto(e.target.value)} placeholder="0.00" /></label>
                      <label>Tipo cambio<input value={tipoCambio} onChange={(e) => setTipoCambio(e.target.value)} disabled={!!pedidoActivo.tipoCambioCongelado} /></label>
                      <label>Forma de pago<input value={pagoForma} onChange={(e) => setPagoForma(e.target.value)} placeholder="Transferencia, efectivo, depósito..." /></label>
                      <label>Banco<input value={pagoBanco} onChange={(e) => setPagoBanco(e.target.value)} placeholder="Banco o medio de pago..." /></label>
                      <label>Referencia<input value={referenciaPago} onChange={(e) => setReferenciaPago(e.target.value)} placeholder="Número de transferencia, voucher o recibo..." /></label>
                      <label>Observaciones<input value={pagoObservaciones} onChange={(e) => setPagoObservaciones(e.target.value)} placeholder="Detalle libre del pago..." /></label>
                      <button className="primary-btn" type="button" onClick={registrarPagoCliente}>Registrar pago cliente</button>
                      <button className="secondary-btn" type="button" onClick={imprimirReciboCaja}>Generar recibo PDF</button>
                      <div className="ot-panel" style={{ gridColumn: '1 / -1', marginTop: 12 }}>
                        <h4>Historial de pagos</h4>
                        {Array.isArray(pedidoActivo.pagos?.historial) && pedidoActivo.pagos.historial.length > 0 ? (
                          <div className="ot-list">
                            {pedidoActivo.pagos.historial.map((pago, index) => (
                              <div className="ot-list-item" key={pago.id || pago.recibo || index}>
                                <strong>{pago.recibo || `Pago ${index + 1}`}</strong>
                                <span>{pago.fechaDeposito || pago.fechaRegistro || ''}</span>
                                <span>{pago.forma || pago.formaPago || 'Pago cliente'}</span>
                                <span>{pago.banco || 'Sin banco'}</span>
                                <b>USD {n(pago.montoUSD || pago.monto || 0).toFixed(2)}</b>
                                <button className="secondary-btn" type="button" onClick={imprimirReciboCaja}>Ver último recibo PDF</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="muted">No hay pagos registrados todavía.</p>
                        )}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {tab === 'produccion' && (
                <section className="panel">
                  <h3><Factory size={18} /> Producción</h3>

                  <label>
                    Estado operativo
                    <select value={pedidoActivo.estado} onChange={(e) => actualizarEstado(pedidoActivo.id, e.target.value)}>
                      {estados.map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </label>

                  <div className="items-box">
                    <h3>Ítems producción</h3>
                    {(pedidoActivo.items || []).map((item) => (
                      <article key={item.id || item.descripcion} className="item-prod">
                        <strong>{item.descripcion || item.nombre}</strong>
                        <p>
                          {item.tipoCalculo === 'unidad'
                            ? `Cantidad: ${item.cantidad}`
                            : `${item.ancho || ''} x ${item.alto || ''} m · Cantidad: ${item.cantidad}`}
                        </p>
                        <span>Instalación: {item.instalacion || 'No'}</span>
                      </article>
                    ))}
                  </div>

                  <div className="logistica-box">
                    <Truck size={20} />
                    <div>
                      <strong>{pedidoActivo.logistica?.modalidad || 'Logística no definida'}</strong>
                      <p>
                        KM: {pedidoActivo.logistica?.km || 'N/A'} · Altura: {pedidoActivo.logistica?.altura || 'N/A'} · Complejidad: {pedidoActivo.logistica?.complejidad || 'Normal'}
                      </p>
                    </div>
                  </div>

                  <button className="primary-btn" type="button" onClick={() => copiarOT(pedidoActivo)}>
                    <Copy size={18} />
                    Copiar OT producción
                  </button>

                  <textarea className="ot-text" value={textoOT(pedidoActivo)} readOnly />
                </section>
              )}

              {tab === 'proveedores' && puedeVerCostos && (
                <section className="panel">
                  <h3><Truck size={18} /> Proveedores y recotización</h3>

                  <div className="form-grid">
                    <button className="secondary-btn" type="button" onClick={solicitarRecotizacion}>Crear solicitud proveedor</button>

                    <label>
                      Proveedor
                      <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                        <option value="">Seleccionar proveedor</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </label>

                    <label>Costo real proveedor<input value={costoRealProveedor} onChange={(e) => setCostoRealProveedor(e.target.value)} placeholder="0.00" /></label>
                    <label>Tiempo entrega<input value={tiempoEntrega} onChange={(e) => setTiempoEntrega(e.target.value)} placeholder="Ej. 3 días" /></label>
                    <label>Nota<input value={notaProveedor} onChange={(e) => setNotaProveedor(e.target.value)} placeholder="Condiciones, anticipo, alcance..." /></label>

                    <button className="secondary-btn" type="button" onClick={registrarRespuesta}>Registrar respuesta</button>
                    <button className="primary-btn" type="button" onClick={asignarProveedor}>Asignar proveedor</button>
                  </div>

                  {solicitudActiva && (
                    <div className="mini-table">
                      <strong>{solicitudActiva.codigo}</strong>
                      {(solicitudActiva.respuestas || []).map((r) => (
                        <p key={r.id}>{r.proveedorNombre}: {money(r.monto)} · {r.tiempoEntrega}</p>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {tab === 'costos' && puedeVerCostos && (
                <section className="panel">
                  <h3><ShieldCheck size={18} /> Costos reales OT</h3>

                  <div className="form-grid">
                    {Object.keys(costos).map((key) => (
                      <label key={key}>
                        {key.replace('costo', 'Costo ')}
                        <input value={costos[key]} onChange={(e) => setCostos({ ...costos, [key]: e.target.value })} placeholder="0.00" />
                      </label>
                    ))}
                  </div>

                  <div className="totals-box">
                    <p><span>Costo real total</span><b>{money(Object.values(costos).reduce((a, b) => a + n(b), 0))}</b></p>
                    <p><span>Venta cliente</span><b>{money(getTotal(pedidoActivo))}</b></p>
                    <p><span>Utilidad estimada</span><b>{money(getTotal(pedidoActivo) - Object.values(costos).reduce((a, b) => a + n(b), 0))}</b></p>
                  </div>

                  <button className="primary-btn" type="button" onClick={registrarCostosReales}>Registrar costos reales</button>
                </section>
              )}

              {tab === 'rentabilidad' && puedeVerCostos && (
                <section className="panel">
                  <h3><DollarSign size={18} /> Rentabilidad real</h3>

                  <div className="totals-box">
                    <p><span>Venta cliente</span><b>{money(getTotal(pedidoActivo))}</b></p>
                    <p><span>Costo real</span><b>{money(pedidoActivo.costos?.costoTotalReal)}</b></p>
                    <p><span>Utilidad real</span><b>{money(pedidoActivo.utilidad?.utilidadReal)}</b></p>
                    <p><span>Comisión vendedor 40%</span><b>{money(n(pedidoActivo.utilidad?.utilidadReal) * 0.4)}</b></p>
                    <p><span>ELAN 60%</span><b>{money(n(pedidoActivo.utilidad?.utilidadReal) * 0.6)}</b></p>
                  </div>

                  <button className="primary-btn" type="button" onClick={liquidarOT}>Liquidar OT</button>
                </section>
              )}

              <div className="action-stack">
                {esAdmin && (
                  <button className="danger-btn hard-danger" type="button" onClick={borrarPedidoDefinitivo}>
                    <Trash2 size={18} />
                    Eliminar definitivamente
                  </button>
                )}

                <button className="danger-btn" type="button" onClick={() => cancelarPedido(pedidoActivo.id)}>
                  <Trash2 size={18} />
                  Cancelar pedido
                </button>
              </div>
            </>
          )}
        </section>
      </section>

      <style>{`
        .pedidos-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .pedidos-hero,.pedidos-tools,.pedido-detail,.pedido-card,.pedidos-lock,.panel{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .pedidos-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .pedidos-hero h1{margin:8px 0;font-size:30px;color:#111827;line-height:1}
        .pedidos-hero p{margin:0;color:#64748b;font-weight:750;line-height:1.45}
        .pedidos-tools{display:grid;grid-template-columns:1fr 240px;gap:12px}
        .search-box{display:flex;align-items:center;gap:8px;border:1px solid #dbe3ef;border-radius:16px;padding:0 12px;background:#fff}
        .search-box input{border:0;padding-left:0}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:14px;font-size:16px;background:#fff;color:#0f172a}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        .pedidos-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:14px;align-items:start}
        .pedido-detail{max-height:calc(100vh - 245px);overflow-y:auto}
        .pedidos-list{display:grid;gap:12px;max-height:calc(100vh - 245px);overflow-y:auto;padding-right:6px}
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
        .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
        .tabs button{border:1px solid #dbe3ef;background:#fff;border-radius:999px;padding:10px 13px;font-weight:950;color:#334155}
        .tabs button.active{background:#111827;color:#fff;border-color:#111827}
        .panel{box-shadow:none;border:1px solid #e5e7eb;margin-bottom:14px}
        .panel h3{display:flex;align-items:center;gap:8px;margin:0 0 14px;color:#111827}
        .totals-box{background:#0f172a;color:#fff;border-radius:20px;padding:16px;margin:16px 0;display:grid;gap:8px}
        .totals-box p{display:flex;justify-content:space-between;margin:0;color:#dbeafe;gap:12px}
        .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end}
        .items-box{display:grid;gap:10px;margin:16px 0}
        .items-box h3{margin:0;color:#111827}
        .item-prod{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;display:grid;gap:5px}
        .item-prod strong{color:#111827}
        .item-prod p,.item-prod span,.item-prod small{margin:0;color:#64748b;font-weight:800}
        .logistica-box{background:#fffbeb;border:1px solid #fde68a;border-radius:18px;padding:14px;display:flex;gap:10px;margin:16px 0;color:#92400e}
        .logistica-box p{margin:4px 0 0;font-weight:800}
        .action-stack{display:grid;gap:10px;margin-top:12px}
        .primary-btn,.secondary-btn,.danger-btn,.mobile-back-btn{width:100%;border:0;border-radius:18px;padding:15px;font-weight:950;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
        .primary-btn{background:#111827;color:#fff}
        .secondary-btn{background:#e2e8f0;color:#0f172a}
        .danger-btn{background:#fee2e2;color:#991b1b}
        .hard-danger{background:#7f1d1d;color:#fff}
        .mobile-back-btn{display:none;background:#e2e8f0;color:#0f172a;margin-bottom:14px}
        .ot-text{margin-top:14px;font-family:monospace;min-height:260px}
        .empty{padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:18px;font-weight:800;background:#fff}
        .detail-empty{min-height:260px;display:grid;place-items:center}
        .pedidos-lock{text-align:center;margin:40px auto;max-width:420px}
        .mini-table{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin-top:14px}
        .mini-table p{margin:6px 0;color:#334155;font-weight:800}

        @media(max-width:850px){
          .pedidos-page{padding:12px;display:block}
          .pedidos-hero,.pedidos-tools{margin-bottom:12px}
          .pedidos-tools,.pedidos-grid,.form-grid{grid-template-columns:1fr}
          .pedidos-grid{display:block}
          .pedidos-list{display:grid;gap:12px;max-height:calc(100vh - 245px);overflow-y:auto;padding-right:6px}
          .pedido-detail{display:none}
          .mobile-detail-open .pedidos-hero,
          .mobile-detail-open .pedidos-tools,
          .mobile-detail-open .pedidos-list{display:none}
          .mobile-detail-open .pedido-detail{display:block;border-radius:22px;min-height:calc(100vh - 24px)}
          .mobile-back-btn{display:flex}
          .pedidos-hero h1{font-size:27px}
          input,select,textarea{font-size:16px;padding:15px}
          .primary-btn,.secondary-btn,.danger-btn,.mobile-back-btn{min-height:54px}
          .detail-head h2{font-size:24px}
          .ot-text{min-height:220px}
        }
      `}</style>
    </main>
  );
}

