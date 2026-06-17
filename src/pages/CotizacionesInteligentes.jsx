import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Eye, FileText, RefreshCcw, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

export default function CotizacionesInteligentes() {
  const { crearPedidoOperativo } = useApp();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cotizacionActiva, setCotizacionActiva] = useState(null);

  const cargarCotizaciones = async () => {
    setCargando(true);

    const { data, error } = await supabase
      .from('cotizaciones_inteligentes')
      .select('*')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error(error);
      alert('No se pudieron cargar las cotizaciones.');
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
    const q = busqueda.toLowerCase();

    return cotizaciones.filter((c) =>
      `${c.codigo} ${c.cliente_nombre} ${c.celular} ${c.ubicacion} ${c.estado}`
        .toLowerCase()
        .includes(q)
    );
  }, [cotizaciones, busqueda]);

  const convertirAPedido = async (cotizacion) => {
    if (!cotizacion) return;
    if (!confirm(`Convertir ${cotizacion.codigo} a pedido de producción?`)) return;

    const fecha = new Date().toISOString();
    const numero = `PED-${String(Date.now()).slice(-6)}`;
    const numeroOT = `OT-${String(Date.now()).slice(-6)}`;

    const itemPrincipal = {
      id: `item-${Date.now()}`,
      nombre: cotizacion.biblioteca_nombre || 'Cotización inteligente',
      descripcion: cotizacion.descripcion || cotizacion.biblioteca_nombre || 'Trabajo cotizado',
      ancho: Number(cotizacion.ancho || 0),
      alto: Number(cotizacion.alto || 0),
      cantidad: Number(cotizacion.cantidad || 1),
      tipoCalculo: 'area',
      instalacion: Number(cotizacion.costo_instalacion || 0) > 0 ? 'Si' : 'No',
      costoProduccion: Number(cotizacion.costo_produccion || 0),
      precio: Number(cotizacion.precio_b || 0),
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

    const total = Number(cotizacion.precio_b || 0);
    const anticipo = total * 0.6;
    const saldo = Math.max(total - anticipo, 0);

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
      ordenTrabajo: {
        codigoOT: numeroOT,
        pedido: numero,
        cliente: cotizacion.cliente_nombre || 'Cliente',
        producto: cotizacion.biblioteca_nombre || cotizacion.descripcion || 'Cotización inteligente',
        cantidad: Number(cotizacion.cantidad || 1),
        observaciones: `Convertido desde cotización ${cotizacion.codigo}. ${cotizacion.descripcion || ''}`,
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

    await supabase
      .from('cotizaciones_inteligentes')
      .update({
        estado: 'convertida_pedido',
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', cotizacion.id);

    alert(`Pedido creado: ${pedido.numeroPedido || pedido.numero}`);

    cargarCotizaciones();
  };

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-08.4</span>
        <h1>Cotizaciones Inteligentes</h1>
        <p>Historial comercial, apertura de detalle y conversión a pedido de producción.</p>
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
              <article className="row" key={c.id}>
                <div>
                  <h3>{c.codigo || 'Sin código'}</h3>
                  <p>
                    {c.cliente_nombre || 'Cliente no especificado'} · {c.celular || 'Sin celular'}
                  </p>
                  <span>
                    Estado: {c.estado || 'borrador'} · Precio B: {money(c.precio_b)} · Fecha:{' '}
                    {c.creado_en ? new Date(c.creado_en).toLocaleDateString('es-NI') : 'Sin fecha'}
                  </span>
                </div>

                <div className="actions">
                  <button type="button" onClick={() => setCotizacionActiva(c)}>
                    <Eye size={15} /> Ver
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
        <section className="mm3-card">
          <div className="title">
            <FileText size={20} />
            <h2>Detalle {cotizacionActiva.codigo}</h2>
          </div>

          <div className="result">Cliente: <b>{cotizacionActiva.cliente_nombre || 'Sin cliente'}</b></div>
          <div className="result">Celular: <b>{cotizacionActiva.celular || 'Sin celular'}</b></div>
          <div className="result">Ubicación: <b>{cotizacionActiva.ubicacion || 'Sin ubicación'}</b></div>
          <div className="result">Estado: <b>{cotizacionActiva.estado}</b></div>
          <div className="result">Costo empresa: <b>{money(cotizacionActiva.costo_empresa)}</b></div>
          <div className="result">Precio A: <b>{money(cotizacionActiva.precio_a)}</b></div>
          <div className="result">Precio B: <b>{money(cotizacionActiva.precio_b)}</b></div>
          <div className="result">Precio C: <b>{money(cotizacionActiva.precio_c)}</b></div>

          <p className="note">{cotizacionActiva.descripcion}</p>

          <button className="primary" type="button" onClick={() => convertirAPedido(cotizacionActiva)}>
            <ClipboardList size={18} />
            Convertir a Pedido Producción
          </button>
        </section>
      )}
    </main>
  );
}
