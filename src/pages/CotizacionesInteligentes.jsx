import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ClipboardList,
  Eye,
  FileText,
  Printer,
  RefreshCcw,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const anticipo60 = (total) => Number(total || 0) * 0.6;
const saldo40 = (total) => Math.max(Number(total || 0) - anticipo60(total), 0);

export default function CotizacionesInteligentes() {
  const { crearPedidoOperativo, usuario } = useApp();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);
  const [otActiva, setOtActiva] = useState(null);

  const detalleRef = useRef(null);

  const cargarCotizaciones = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from('cotizaciones_inteligentes')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error cargando cotizaciones inteligentes:', error);
      alert(`No se pudieron cargar las cotizaciones: ${error.message}`);
      setCargando(false);
      return;
    }

    setCotizaciones(data || []);
    setCargando(false);
  };

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const listaFiltrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (!q) return cotizaciones;

    return cotizaciones.filter((c) =>
      `${c.codigo || ''} ${c.cliente_nombre || ''} ${c.celular || ''} ${c.ubicacion || ''} ${c.estado || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [cotizaciones, busqueda]);

  const abrirDetalleCotizacion = (cotizacion) => {
    setCotizacionActiva(cotizacion);

    requestAnimationFrame(() => {
      setTimeout(() => {
        detalleRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 80);
    });
  };

  useEffect(() => {
    if (!cotizaciones.length) return;

    const raw = localStorage.getItem('elanvisual_cotizacion_ai_activa');
    if (!raw) return;

    try {
      const activa = JSON.parse(raw);

      const encontrada = cotizaciones.find(
        (c) => c.id === activa?.id || c.codigo === activa?.codigo
      );

      if (encontrada) {
        setBusqueda(encontrada.codigo || '');
        abrirDetalleCotizacion(encontrada);
        localStorage.removeItem('elanvisual_cotizacion_ai_activa');
      }
    } catch {
      localStorage.removeItem('elanvisual_cotizacion_ai_activa');
    }
  }, [cotizaciones]);

  const actualizarEstadoCotizacion = async (cotizacion, estado) => {
    const payload = {
      estado,
      actualizado_en: new Date().toISOString(),
    };

    if (estado === 'aprobada') {
      payload.aprobado_por =
        usuario?.nombre || usuario?.usuario || usuario?.email || 'Admin';
      payload.aprobado_en = new Date().toISOString();
      payload.anticipo_requerido = anticipo60(cotizacion.precio_b);
      payload.saldo_pendiente = saldo40(cotizacion.precio_b);
      payload.estado_pago = 'pendiente_anticipo';
    }

    const { error } = await supabase
      .from('cotizaciones_inteligentes')
      .update(payload)
      .eq('id', cotizacion.id);

    if (error) {
      console.error(error);
      alert('No se pudo actualizar la cotización.');
      return;
    }

    const actualizada = { ...cotizacion, ...payload };

    setCotizacionActiva((prev) =>
      prev?.id === cotizacion.id ? actualizada : prev
    );

    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cotizacion.id ? { ...c, ...payload } : c))
    );

    alert(`Cotización ${cotizacion.codigo} actualizada a: ${estado}`);
  };

  const convertirAPedido = async (cotizacion) => {
    if (!cotizacion) return;

    if (cotizacion.estado !== 'aprobada') {
      alert('Primero debés aprobar la cotización antes de convertirla a pedido.');
      return;
    }

    if (!confirm(`¿Convertir ${cotizacion.codigo} a pedido de producción?`)) return;

    const fecha = new Date().toISOString();
    const numero = `PED-${String(Date.now()).slice(-6)}`;
    const numeroOT = `OT-${String(Date.now()).slice(-6)}`;

    const total = Number(cotizacion.precio_b || 0);
    const anticipo = anticipo60(total);
    const saldo = saldo40(total);

    const itemPrincipal = {
      id: `item-${Date.now()}`,
      nombre: cotizacion.biblioteca_nombre || 'Cotización inteligente',
      descripcion:
        cotizacion.descripcion ||
        cotizacion.biblioteca_nombre ||
        'Trabajo cotizado',
      ancho: Number(cotizacion.ancho || 0),
      alto: Number(cotizacion.alto || 0),
      cantidad: Number(cotizacion.cantidad || 1),
      tipoCalculo: 'area',
      instalacion: Number(cotizacion.costo_instalacion || 0) > 0 ? 'Si' : 'No',
      costoProduccion: Number(cotizacion.costo_produccion || 0),
      precio: total,
      accesoriosProduccion: [
        ...(Array.isArray(cotizacion.despiece) ? cotizacion.despiece : []),
        ...(Array.isArray(cotizacion.estructura) ? cotizacion.estructura : []),
        ...(Array.isArray(cotizacion.obra_civil) ? cotizacion.obra_civil : []),
      ].map((x) => ({
        nombre: x.nombre || x.tipo_componente || 'Componente',
        cantidad: Number(x.cantidad || 0),
        tipo: x.unidad || '',
        total: Number(x.costo || 0),
      })),
      nota: `Generado desde ${cotizacion.codigo}`,
    };

    const pedido = crearPedidoOperativo({
      id: `pedido-${Date.now()}`,
      numero,
      numeroPedido: numero,
      numeroOT,
      fecha,
      createdAt: fecha,
      origenCotizacionId: cotizacion.id,
      origenCotizacionCodigo: cotizacion.codigo,
      cliente: {
        nombre: cotizacion.cliente_nombre || 'Cliente',
        empresa: cotizacion.cliente_nombre || '',
        contacto: cotizacion.cliente_nombre || '',
        whatsapp: cotizacion.celular || '',
        telefono: cotizacion.celular || '',
        correo: '',
        email: '',
      },
      proyecto: {
        lugar: cotizacion.ubicacion || '',
        direccion: cotizacion.ubicacion || '',
      },
      items: [itemPrincipal],
      total,
      resumen: {
        subtotal: total,
        descuento: 0,
        total,
        anticipo,
        saldo,
        comision: 0,
      },
      costos: {
        produccionEstimada: Number(cotizacion.costo_produccion || 0),
        instalacion: Number(cotizacion.costo_instalacion || 0),
        transporte: Number(cotizacion.costo_transporte || 0),
        viaticos: Number(cotizacion.costo_viaticos || 0),
        equipo: Number(cotizacion.costo_equipo || 0),
        empresa: Number(cotizacion.costo_empresa || 0),
      },
      estado: 'Pedido creado',
      estadoProduccion: 'pendiente',
      pagoEstado: 'Pendiente anticipo',
      seguimientoEstado: 'pendiente',
      anticipoRequerido: anticipo,
      saldoPendiente: saldo,
      ordenTrabajo: {
        codigoOT: numeroOT,
        pedido: numero,
        cliente: cotizacion.cliente_nombre || 'Cliente',
        producto:
          cotizacion.biblioteca_nombre ||
          cotizacion.descripcion ||
          'Cotización inteligente',
        cantidad: Number(cotizacion.cantidad || 1),
        observaciones: `Convertido desde cotización ${cotizacion.codigo}. ${
          cotizacion.descripcion || ''
        }`,
        fecha,
        estadoProduccion: 'pendiente',
      },
      historial: [
        {
          estado: 'Pedido creado',
          fecha,
          nota: `Pedido convertido desde cotización inteligente ${cotizacion.codigo}.`,
        },
      ],
    });

    const payload = {
      estado: 'convertida_pedido',
      pedido_numero: numero,
      pedido_ot: numeroOT,
      convertido_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };

    await supabase
      .from('cotizaciones_inteligentes')
      .update(payload)
      .eq('id', cotizacion.id);

    const actualizada = { ...cotizacion, ...payload };

    setCotizacionActiva(actualizada);
    setOtActiva({ cotizacion: actualizada, pedido, numero, numeroOT, total, anticipo, saldo });

    setCotizaciones((prev) =>
      prev.map((c) => (c.id === cotizacion.id ? actualizada : c))
    );

    alert(`Pedido creado: ${pedido.numeroPedido || pedido.numero}`);
  };

  const imprimirOT = (cotizacion) => {
    if (!cotizacion) return;

    const total = Number(cotizacion.precio_b || 0);

    setOtActiva({
      cotizacion,
      pedido: null,
      numero: cotizacion.pedido_numero || 'PED-PENDIENTE',
      numeroOT: cotizacion.pedido_ot || 'OT-PENDIENTE',
      total,
      anticipo: anticipo60(total),
      saldo: saldo40(total),
    });

    setTimeout(() => window.print(), 150);
  };

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · COTIZADOR INTELIGENTE</span>
        <h1>Cotizaciones Inteligentes</h1>
        <p>Aprobación comercial, anticipo, pedido y orden de producción.</p>
      </section>

      <section className="mm3-card">
        <div className="title">
          <Search size={20} />
          <h2>Buscar cotización</h2>
        </div>

        <input
          placeholder="Buscar por código, cliente, celular, ubicación o estado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <button className="primary" type="button" onClick={cargarCotizaciones}>
          <RefreshCcw size={18} />
          {cargando ? 'Actualizando...' : 'Actualizar'}
        </button>
      </section>

      <section className="mm3-card">
        <div className="title">
          <FileText size={20} />
          <h2>Listado</h2>
        </div>

        <div className="list">
          {listaFiltrada.length === 0 ? (
            <p className="note">No hay cotizaciones guardadas todavía.</p>
          ) : (
            listaFiltrada.map((c) => (
              <article
                className={`row ${
                  cotizacionActiva?.id === c.id ? 'row-active' : ''
                }`}
                key={c.id}
              >
                <div>
                  <h3>{c.codigo || 'Sin código'}</h3>
                  <p>
                    {c.cliente_nombre || 'Cliente no especificado'} ·{' '}
                    {c.celular || 'Sin celular'}
                  </p>
                  <span>
                    Estado: {c.estado || 'borrador'} · Precio B: {money(c.precio_b)} ·
                    Anticipo:{' '}
                    {money(c.anticipo_requerido || anticipo60(c.precio_b))}
                  </span>
                </div>

                <div className="actions">
                  <button type="button" onClick={() => abrirDetalleCotizacion(c)}>
                    <Eye size={15} /> Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => actualizarEstadoCotizacion(c, 'aprobada')}
                  >
                    Aprobar
                  </button>

                  <button
                    type="button"
                    onClick={() => actualizarEstadoCotizacion(c, 'rechazada')}
                  >
                    Rechazar
                  </button>

                  <button type="button" onClick={() => convertirAPedido(c)}>
                    <ClipboardList size={15} /> Pedido
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {cotizacionActiva && (
        <section
          ref={detalleRef}
          className="mm3-card cotizacion-detalle-activa"
        >
          <div className="detalle-header">
            <div className="title">
              <FileText size={20} />
              <h2>Detalle {cotizacionActiva.codigo || 'Sin código'}</h2>
            </div>

            <button
              className="close-detail"
              type="button"
              onClick={() => setCotizacionActiva(null)}
            >
              <X size={16} />
              Cerrar
            </button>
          </div>

          <div className="detalle-grid">
            <div className="result">
              Cliente: <b>{cotizacionActiva.cliente_nombre || 'Sin cliente'}</b>
            </div>
            <div className="result">
              Celular: <b>{cotizacionActiva.celular || 'Sin celular'}</b>
            </div>
            <div className="result">
              Ubicación: <b>{cotizacionActiva.ubicacion || 'Sin ubicación'}</b>
            </div>
            <div className="result">
              Estado: <b>{cotizacionActiva.estado || 'borrador'}</b>
            </div>
            <div className="result">
              Total recomendado: <b>{money(cotizacionActiva.precio_b)}</b>
            </div>
            <div className="result">
              Anticipo 60%:{' '}
              <b>
                {money(
                  cotizacionActiva.anticipo_requerido ||
                    anticipo60(cotizacionActiva.precio_b)
                )}
              </b>
            </div>
            <div className="result">
              Saldo 40%:{' '}
              <b>
                {money(
                  cotizacionActiva.saldo_pendiente ||
                    saldo40(cotizacionActiva.precio_b)
                )}
              </b>
            </div>
            <div className="result">
              Pedido: <b>{cotizacionActiva.pedido_numero || 'No generado'}</b>
            </div>
            <div className="result">
              OT: <b>{cotizacionActiva.pedido_ot || 'No generada'}</b>
            </div>
          </div>

          {cotizacionActiva.descripcion && (
            <p className="note detalle-descripcion">
              {cotizacionActiva.descripcion}
            </p>
          )}

          <div className="detalle-actions">
            <button
              className="primary"
              type="button"
              onClick={() =>
                actualizarEstadoCotizacion(cotizacionActiva, 'aprobada')
              }
            >
              Aprobar cotización
            </button>

            <button
              className="primary"
              type="button"
              onClick={() =>
                actualizarEstadoCotizacion(cotizacionActiva, 'rechazada')
              }
            >
              Rechazar
            </button>

            <button
              className="primary"
              type="button"
              onClick={() => convertirAPedido(cotizacionActiva)}
            >
              <ClipboardList size={18} />
              Convertir a Pedido Producción
            </button>

            <button
              className="primary"
              type="button"
              onClick={() => imprimirOT(cotizacionActiva)}
            >
              <Printer size={18} />
              Imprimir OT
            </button>
          </div>
        </section>
      )}

      {otActiva && (
        <section className="ot-print">
          <div className="ot-page">
            <header className="ot-header">
              <div>
                <span>ELANVISIÓN</span>
                <h1>Orden de Producción</h1>
                <p>Producción · Instalación · Control operativo</p>
              </div>
              <div>
                <strong>{otActiva.numeroOT}</strong>
                <p>{otActiva.numero}</p>
              </div>
            </header>

            <section className="ot-grid">
              <div>
                <h2>Cliente</h2>
                <p>
                  <b>Nombre:</b>{' '}
                  {otActiva.cotizacion.cliente_nombre || 'Cliente'}
                </p>
                <p>
                  <b>Celular:</b>{' '}
                  {otActiva.cotizacion.celular || 'Sin celular'}
                </p>
                <p>
                  <b>Ubicación:</b>{' '}
                  {otActiva.cotizacion.ubicacion || 'Sin ubicación'}
                </p>
              </div>

              <div>
                <h2>Proyecto</h2>
                <p>
                  <b>Cotización:</b> {otActiva.cotizacion.codigo}
                </p>
                <p>
                  <b>Producto:</b>{' '}
                  {otActiva.cotizacion.biblioteca_nombre ||
                    'Producción visual'}
                </p>
                <p>
                  <b>Medidas:</b>{' '}
                  {Number(otActiva.cotizacion.ancho || 0).toFixed(2)} m ×{' '}
                  {Number(otActiva.cotizacion.alto || 0).toFixed(2)} m
                </p>
                <p>
                  <b>Cantidad:</b> {otActiva.cotizacion.cantidad || 1}
                </p>
              </div>
            </section>

            <section className="ot-box">
              <h2>Descripción</h2>
              <p>{otActiva.cotizacion.descripcion || 'Sin descripción'}</p>
            </section>

            <section className="ot-grid">
              <div>
                <h2>Finanzas</h2>
                <p>
                  <b>Total:</b> {money(otActiva.total)}
                </p>
                <p>
                  <b>Anticipo 60%:</b> {money(otActiva.anticipo)}
                </p>
                <p>
                  <b>Saldo 40%:</b> {money(otActiva.saldo)}
                </p>
              </div>

              <div>
                <h2>Producción</h2>
                <p>
                  <b>Estado:</b> Pendiente
                </p>
                <p>
                  <b>Instalación:</b>{' '}
                  {Number(otActiva.cotizacion.costo_instalacion || 0) > 0
                    ? 'Sí'
                    : 'No'}
                </p>
                <p>
                  <b>Fecha:</b> {new Date().toLocaleDateString('es-NI')}
                </p>
              </div>
            </section>

            <section className="ot-box">
              <h2>Checklist de Producción</h2>
              <p>□ Arte final aprobado</p>
              <p>□ Materiales revisados</p>
              <p>□ Producción iniciada</p>
              <p>□ Control de calidad</p>
              <p>□ Instalación / entrega</p>
            </section>

            <footer className="ot-footer">
              <strong>ELANVISIÓN · ONE VISION · MULTIPLE SOLUTIONS</strong>
            </footer>
          </div>
        </section>
      )}

      <style>{`
        .cotizacion-detalle-activa {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative;
          z-index: 20;
          margin-top: 18px;
          border: 1px solid rgba(201, 162, 39, 0.45);
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        }

        .detalle-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 14px;
        }

        .close-detail {
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.06);
          color: inherit;
          border-radius: 12px;
          padding: 9px 12px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }

        .detalle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
        }

        .detalle-descripcion {
          margin-top: 14px;
          white-space: pre-wrap;
        }

        .detalle-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .row-active {
          border-color: rgba(201, 162, 39, 0.6) !important;
          background: rgba(201, 162, 39, 0.08);
        }

        .ot-print {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .ot-print,
          .ot-print * {
            visibility: visible !important;
          }

          .ot-print {
            display: block !important;
            position: absolute;
            inset: 0;
            background: white;
            color: #111827;
            font-family: Arial, sans-serif;
          }

          .ot-page {
            padding: 28px;
          }

          .ot-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            background: #111827;
            color: white;
            border-radius: 18px;
            padding: 20px;
            margin-bottom: 16px;
          }

          .ot-header span {
            color: #C9A227;
            font-size: 12px;
            letter-spacing: 3px;
            font-weight: 900;
          }

          .ot-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
          }

          .ot-grid div,
          .ot-box {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 14px;
          }

          .ot-footer {
            border-top: 3px solid #111827;
            margin-top: 20px;
            padding-top: 12px;
            font-size: 12px;
          }

          @page {
            size: portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </main>
  );
}