import { useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  Copy,
  FileText,
  MapPin,
  PackageCheck,
  PlusCircle,
  Search,
  Trash2,
  Truck,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const STORAGE_MATERIALES = 'elanvisual_materiales_costos_v1';
const STORAGE_CLIENTES = 'elanvisual_clientes_cotizador_v1';
const STORAGE_PEDIDOS = 'elanvisual_pedidos_v1';

const descuentos = [0, 5, 10, 15, 20];
const tarifas = ['A', 'B', 'C', 'D'];
const logisticaOpciones = ['Retira en taller', 'Entrega', 'InstalaciÃ³n', 'Entrega + instalaciÃ³n'];

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

function leerStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function guardarStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function consecutivo(prefix, lista) {
  const numero = String(lista.length + 1).padStart(4, '0');
  return `${prefix}-${numero}`;
}

const clienteInicial = {
  empresa: '',
  contacto: '',
  whatsapp: '',
  correo: '',
};

const proyectoInicial = {
  lugar: '',
  direccion: '',
  contactoSitio: '',
  whatsappSitio: '',
};

const itemInicial = {
  categoria: '',
  subcategoria: '',
  materialId: '',
  tarifa: 'B',
  ancho: '',
  alto: '',
  cantidad: 1,
  descuento: 0,
  instalacion: 'No',
  nota: '',
  accesorios: {
    ojete: false,
    tuboPvc: false,
    tuboGalvanizado: false,
    bridas: false,
  },
  separacionOjetes: 0.5,
  separacionBridas: 0.5,
};

export default function CotizadorVisual() {
 const { usuario, pedidos, crearPedidoOperativo } = useApp();

  const [materiales] = useState(() => leerStorage(STORAGE_MATERIALES));
  const [clientes, setClientes] = useState(() => leerStorage(STORAGE_CLIENTES));

  const [cliente, setCliente] = useState(clienteInicial);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [proyecto, setProyecto] = useState(proyectoInicial);
  const [itemForm, setItemForm] = useState(itemInicial);
  const [items, setItems] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');

  const [logistica, setLogistica] = useState('Retira en taller');
  const [km, setKm] = useState('');
  const [altura, setAltura] = useState('');
  const [complejidad, setComplejidad] = useState('Normal');
  const [pedidoGenerado, setPedidoGenerado] = useState(null);

  const tieneAcceso = usuario?.rol === 'admin' || usuario?.rol === 'ventas';

  const materialesActivos = useMemo(
  () => materiales.filter((m) => m && m.activo !== false && (m.descripcion || m.nombre || m.categoria)),
  [materiales]
);

  const categorias = useMemo(
    () => [...new Set(materialesActivos.map((m) => m.categoria).filter(Boolean))],
    [materialesActivos]
  );

  const subcategorias = useMemo(
    () => [
      ...new Set(
        materialesActivos
          .filter((m) => !itemForm.categoria || m.categoria === itemForm.categoria)
          .map((m) => m.subcategoria)
          .filter(Boolean)
      ),
    ],
    [materialesActivos, itemForm.categoria]
  );

  const productosFiltrados = useMemo(() => {
    return materialesActivos.filter((m) => {
      const texto = `${m.descripcion || ''} ${m.categoria || ''} ${m.subcategoria || ''}`.toLowerCase();

      return (
        (!itemForm.categoria || m.categoria === itemForm.categoria) &&
        (!itemForm.subcategoria || m.subcategoria === itemForm.subcategoria) &&
        texto.includes(busquedaProducto.toLowerCase())
      );
    });
  }, [materialesActivos, itemForm.categoria, itemForm.subcategoria, busquedaProducto]);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase();
    if (!q) return clientes.slice(0, 6);

    return clientes.filter((c) =>
      `${c.empresa} ${c.contacto} ${c.whatsapp} ${c.correo}`.toLowerCase().includes(q)
    );
  }, [clientes, busquedaCliente]);

  const materialSeleccionado = materialesActivos.find((m) => m.id === itemForm.materialId);

  const mostrarLogisticaExtra =
    logistica === 'Entrega' || logistica === 'InstalaciÃ³n' || logistica === 'Entrega + instalaciÃ³n';

  const resumen = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + num(item.subtotal), 0);
    const descuento = items.reduce((acc, item) => acc + num(item.montoDescuento), 0);
    const total = items.reduce((acc, item) => acc + num(item.total), 0);

    return {
      subtotal,
      descuento,
      total,
      anticipo: total * 0.6,
      saldo: total * 0.4,
    };
  }, [items]);

  const actualizarCliente = (campo, valor) => setCliente((prev) => ({ ...prev, [campo]: valor }));
  const actualizarProyecto = (campo, valor) => setProyecto((prev) => ({ ...prev, [campo]: valor }));
  const actualizarItem = (campo, valor) => setItemForm((prev) => ({ ...prev, [campo]: valor }));

  const actualizarAccesorio = (campo) => {
    setItemForm((prev) => ({
      ...prev,
      accesorios: {
        ...prev.accesorios,
        [campo]: !prev.accesorios[campo],
      },
    }));
  };

  const seleccionarCliente = (c) => {
    setCliente({
      empresa: c.empresa || '',
      contacto: c.contacto || '',
      whatsapp: c.whatsapp || '',
      correo: c.correo || '',
    });
    setBusquedaCliente('');
  };

  const guardarCliente = () => {
    if (!cliente.empresa && !cliente.contacto) return;

    const nuevoCliente = {
      id: `cli-${Date.now()}`,
      ...cliente,
      creadoEn: new Date().toISOString(),
    };

    const lista = [
      nuevoCliente,
      ...clientes.filter(
        (c) =>
          `${c.empresa}${c.whatsapp}`.toLowerCase() !==
          `${cliente.empresa}${cliente.whatsapp}`.toLowerCase()
      ),
    ];

    setClientes(lista);
    guardarStorage(STORAGE_CLIENTES, lista);
    alert('Cliente guardado.');
  };

  const precioTarifa = (material, tarifa) => {
    if (!material) return 0;
    return num(material[`tarifa${tarifa}`] || material[`precio${tarifa}`] || material.precioVenta);
  };

  const calcularCantidadBase = (material) => {
    const ancho = num(itemForm.ancho);
    const alto = num(itemForm.alto);
    const cantidad = Math.max(1, num(itemForm.cantidad));

    if (!material) return 0;
    if (material.tipoCalculo === 'unidad') return cantidad;
    if (material.tipoCalculo === 'metro_lineal') return ancho * cantidad;

    return ancho * alto * cantidad;
  };

  const calcularAccesorios = () => {
    const ancho = num(itemForm.ancho);
    const alto = num(itemForm.alto);
    const cantidad = Math.max(1, num(itemForm.cantidad));
    const perimetro = 2 * (ancho + alto) * cantidad;
    const resultado = [];

    if (itemForm.accesorios.tuboPvc) {
      resultado.push({ nombre: 'Tubo PVC', tipo: 'metro lineal', cantidad: 2 * ancho * cantidad });
    }

    if (itemForm.accesorios.tuboGalvanizado) {
      resultado.push({ nombre: 'Tubo Galvanizado', tipo: 'metro lineal', cantidad: 2 * ancho * cantidad });
    }

    if (itemForm.accesorios.ojete) {
      resultado.push({
        nombre: 'Ojete',
        tipo: 'unidad',
        cantidad: Math.ceil(perimetro / Math.max(0.1, num(itemForm.separacionOjetes))),
      });
    }

    if (itemForm.accesorios.bridas) {
      resultado.push({
        nombre: 'Bridas',
        tipo: 'unidad',
        cantidad: Math.ceil(perimetro / Math.max(0.1, num(itemForm.separacionBridas))),
      });
    }

    return resultado;
  };

  const agregarItem = (e) => {
    e.preventDefault();
    if (!materialSeleccionado) return;

    const cantidadBase = calcularCantidadBase(materialSeleccionado);
    const precioUnitario = precioTarifa(materialSeleccionado, itemForm.tarifa);
    const subtotal = precioUnitario * cantidadBase;

    const descuentoPermitido = Math.min(
      num(itemForm.descuento),
      num(materialSeleccionado.descuentoMaximo || 20)
    );

    const montoDescuento = subtotal * (descuentoPermitido / 100);
    const total = subtotal - montoDescuento;

    const nuevoItem = {
      id: `item-${Date.now()}`,
      materialId: materialSeleccionado.id,
      descripcion: materialSeleccionado.descripcion || materialSeleccionado.nombre || 'Material sin nombre',
      categoria: materialSeleccionado.categoria || '',
      subcategoria: materialSeleccionado.subcategoria || '',
      tipoCalculo: materialSeleccionado.tipoCalculo || 'm2',
      ancho: num(itemForm.ancho),
      alto: num(itemForm.alto),
      cantidad: Math.max(1, num(itemForm.cantidad)),
      cantidadBase,
      tarifa: itemForm.tarifa,
      precioUnitario,
      subtotal,
      descuento: descuentoPermitido,
      montoDescuento,
      total,
      instalacion: itemForm.instalacion,
      nota: itemForm.nota,
      accesoriosProduccion: calcularAccesorios(),
      costoProduccion: materialSeleccionado.costoProduccion || 0,
    };

    setItems((prev) => [nuevoItem, ...prev]);
    setPedidoGenerado(null);
    setItemForm((prev) => ({
      ...itemInicial,
      tarifa: prev.tarifa,
      categoria: prev.categoria,
      subcategoria: prev.subcategoria,
    }));
  };

  const quitarItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setPedidoGenerado(null);
  };

  const crearPedido = () => {
    if (items.length === 0) {
      alert('AgregÃ¡ al menos un Ã­tem antes de convertir a pedido.');
      return;
    }

    if (!cliente.empresa && !cliente.contacto) {
      alert('CompletÃ¡ el cliente antes de convertir a pedido.');
      return;
    }

    const numeroPedido = consecutivo('PED', pedidos);
    const numeroOT = consecutivo('OT', pedidos);

    const nuevoPedido = {
      id: `ped-${Date.now()}`,
      numeroPedido,
      numeroOT,
      fecha: new Date().toISOString(),
      estado: 'Pedido creado',
      cliente,
      proyecto,
      logistica: {
        modalidad: logistica,
        km,
        altura,
        complejidad,
      },
      resumen,
      items,
      pagos: {
        anticipoEsperado: resumen.anticipo,
        saldoEsperado: resumen.saldo,
        anticipoRecibido: 0,
        saldoRecibido: 0,
        estadoPago: 'Pendiente anticipo',
      },
      produccion: {
        estado: 'Pendiente',
        prioridad: 'Normal',
        observaciones: '',
        items: items.map((item) => ({
          id: item.id,
          descripcion: item.descripcion,
          categoria: item.categoria,
          subcategoria: item.subcategoria,
          medidas:
            item.tipoCalculo === 'unidad'
              ? `Cantidad: ${item.cantidad}`
              : `${item.ancho} x ${item.alto} m Â· Cantidad: ${item.cantidad}`,
          instalacion: item.instalacion,
          accesoriosProduccion: item.accesoriosProduccion,
          nota: item.nota,
        })),
      },
      flujo: {
        lead: true,
        cotizacion: true,
        pedido: true,
        ot: true,
        produccion: false,
        instalacion: false,
        entrega: false,
        cobro: false,
        comision: false,
      },
    };

   const pedidoOperativo = crearPedidoOperativo(nuevoPedido);
setPedidoGenerado(pedidoOperativo);
alert(`Pedido generado: ${pedidoOperativo.numeroPedido} / ${pedidoOperativo.numeroOT}`);

  };

  const textoWhatsApp = useMemo(() => {
    const detalle = items.map((item, index) => {
      const medida =
        item.tipoCalculo === 'unidad'
          ? `Cantidad: ${item.cantidad}`
          : `Medida: ${item.ancho} x ${item.alto} m Â· Cantidad: ${item.cantidad}`;

      return `${index + 1}. ${item.descripcion}
${medida}
${item.instalacion === 'SÃ­' ? 'Incluye solicitud de instalaciÃ³n por revisar en sitio.' : 'Solo suministro / entrega segÃºn logÃ­stica.'}
Total Ã­tem: ${money(item.total)}
${item.nota ? `Nota: ${item.nota}` : ''}`;
    });

    const lineas = [
      '*COTIZACIÃ“N ELANVISUAL*',
      pedidoGenerado ? `Pedido interno: ${pedidoGenerado.numeroPedido}` : '',
      pedidoGenerado ? `OT interna: ${pedidoGenerado.numeroOT}` : '',
      '',
      '*Cliente*',
      `Empresa: ${cliente.empresa || 'Cliente'}`,
      cliente.contacto ? `Contacto: ${cliente.contacto}` : '',
      cliente.whatsapp ? `WhatsApp: ${cliente.whatsapp}` : '',
      cliente.correo ? `Correo: ${cliente.correo}` : '',
      '',
      '*Proyecto*',
      proyecto.lugar ? `Lugar: ${proyecto.lugar}` : '',
      proyecto.direccion ? `DirecciÃ³n: ${proyecto.direccion}` : '',
      proyecto.contactoSitio ? `Contacto en sitio: ${proyecto.contactoSitio}` : '',
      proyecto.whatsappSitio ? `WhatsApp en sitio: ${proyecto.whatsappSitio}` : '',
      '',
      '*Detalle comercial*',
      ...detalle,
      '',
      '*LogÃ­stica*',
      logistica,
      mostrarLogisticaExtra && km ? `KM: ${km}` : '',
      mostrarLogisticaExtra && altura ? `Altura: ${altura}` : '',
      mostrarLogisticaExtra ? `Complejidad: ${complejidad}` : '',
      '',
      `Subtotal: ${money(resumen.subtotal)}`,
      `Descuento aplicado: ${money(resumen.descuento)}`,
      `Total: ${money(resumen.total)}`,
      `Anticipo 60%: ${money(resumen.anticipo)}`,
      `Saldo 40%: ${money(resumen.saldo)}`,
      '',
      'Precios sujetos a validaciÃ³n final segÃºn artes, medidas definitivas y condiciones reales de instalaciÃ³n.',
    ];

    return lineas.filter(Boolean).join('\n');
  }, [
    cliente,
    proyecto,
    items,
    logistica,
    km,
    altura,
    complejidad,
    resumen,
    mostrarLogisticaExtra,
    pedidoGenerado,
  ]);

  const textoProduccion = useMemo(() => {
    if (!pedidoGenerado) return 'ConvertÃ­ la cotizaciÃ³n a pedido para generar OT de producciÃ³n.';

    const lineas = [
      `*ORDEN DE PRODUCCIÃ“N ${pedidoGenerado.numeroOT}*`,
      `Pedido: ${pedidoGenerado.numeroPedido}`,
      '',
      `Cliente: ${cliente.empresa || cliente.contacto}`,
      proyecto.lugar ? `Lugar: ${proyecto.lugar}` : '',
      proyecto.direccion ? `DirecciÃ³n: ${proyecto.direccion}` : '',
      '',
      '*Ãtems producciÃ³n*',
      ...items.map((item, index) => {
        const medida =
          item.tipoCalculo === 'unidad'
            ? `Cantidad: ${item.cantidad}`
            : `${item.ancho} x ${item.alto} m Â· Cantidad: ${item.cantidad}`;

        const accesorios =
          item.accesoriosProduccion.length > 0
            ? item.accesoriosProduccion
                .map((a) => `${a.nombre}: ${Number(a.cantidad).toFixed(2)} ${a.tipo}`)
                .join(' Â· ')
            : 'Sin accesorios automÃ¡ticos';

        return `${index + 1}. ${item.descripcion}
${medida}
InstalaciÃ³n: ${item.instalacion}
Accesorios: ${accesorios}
${item.nota ? `Nota: ${item.nota}` : ''}`;
      }),
      '',
      `LogÃ­stica: ${logistica}`,
      mostrarLogisticaExtra && km ? `KM: ${km}` : '',
      mostrarLogisticaExtra && altura ? `Altura: ${altura}` : '',
      mostrarLogisticaExtra ? `Complejidad: ${complejidad}` : '',
    ];

    return lineas.filter(Boolean).join('\n');
  }, [pedidoGenerado, cliente, proyecto, items, logistica, km, altura, complejidad, mostrarLogisticaExtra]);

  const copiarTexto = async (texto, mensaje) => {
    try {
      await navigator.clipboard.writeText(texto);
      alert(mensaje);
    } catch {
      alert('No se pudo copiar automÃ¡ticamente. SeleccionÃ¡ el texto manualmente.');
    }
  };

  if (!tieneAcceso) {
    return (
      <main className="cotizador-page">
        <section className="cotizador-lock">
          <Calculator size={44} />
          <h1>Acceso restringido</h1>
          <p>Este cotizador es solo para administraciÃ³n y vendedores.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="cotizador-page">
      <section className="cotizador-hero">
        <span>ELANVISUAL Â· APP MODE</span>
        <h1>Cotizador Visual V2.2</h1>
        <p>CotizaciÃ³n, pedido y OT de producciÃ³n desde celular.</p>
      </section>

      <section className="app-grid">
        <section className="cotizador-card">
          <div className="card-title">
            <UserPlus size={22} />
            <h2>Cliente</h2>
          </div>

          <label>
            Buscar cliente
            <div className="search-box">
              <Search size={18} />
              <input
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Empresa, contacto o WhatsApp"
              />
            </div>
          </label>

          {clientesFiltrados.length > 0 && (
            <div className="client-list">
              {clientesFiltrados.map((c) => (
                <button key={c.id} type="button" onClick={() => seleccionarCliente(c)}>
                  <strong>{c.empresa || c.contacto}</strong>
                  <span>{c.whatsapp || c.correo || 'Sin contacto'}</span>
                </button>
              ))}
            </div>
          )}

          <div className="two">
            <label>
              Empresa
              <input value={cliente.empresa} onChange={(e) => actualizarCliente('empresa', e.target.value)} />
            </label>

            <label>
              Contacto
              <input value={cliente.contacto} onChange={(e) => actualizarCliente('contacto', e.target.value)} />
            </label>
          </div>

          <div className="two">
            <label>
              WhatsApp
              <input value={cliente.whatsapp} onChange={(e) => actualizarCliente('whatsapp', e.target.value)} />
            </label>

            <label>
              Correo
              <input value={cliente.correo} onChange={(e) => actualizarCliente('correo', e.target.value)} />
            </label>
          </div>

          <button className="secondary-btn" type="button" onClick={guardarCliente}>
            Guardar cliente
          </button>
        </section>

        <section className="cotizador-card">
          <div className="card-title">
            <MapPin size={22} />
            <h2>Proyecto</h2>
          </div>

          <label>
            Lugar
            <input value={proyecto.lugar} onChange={(e) => actualizarProyecto('lugar', e.target.value)} />
          </label>

          <label>
            DirecciÃ³n
            <textarea value={proyecto.direccion} onChange={(e) => actualizarProyecto('direccion', e.target.value)} />
          </label>

          <div className="two">
            <label>
              Contacto en sitio
              <input
                value={proyecto.contactoSitio}
                onChange={(e) => actualizarProyecto('contactoSitio', e.target.value)}
              />
            </label>

            <label>
              WhatsApp en sitio
              <input
                value={proyecto.whatsappSitio}
                onChange={(e) => actualizarProyecto('whatsappSitio', e.target.value)}
              />
            </label>
          </div>
        </section>
      </section>

      <section className="cotizador-grid">
        <form className="cotizador-card" onSubmit={agregarItem}>
          <div className="card-title">
            <PlusCircle size={22} />
            <h2>Agregar Ã­tem</h2>
          </div>

          <div className="two">
            <label>
              CategorÃ­a
              <select
                value={itemForm.categoria}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    categoria: e.target.value,
                    subcategoria: '',
                    materialId: '',
                  }))
                }
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              SubcategorÃ­a
              <select
                value={itemForm.subcategoria}
                onChange={(e) =>
                  setItemForm((prev) => ({
                    ...prev,
                    subcategoria: e.target.value,
                    materialId: '',
                  }))
                }
              >
                <option value="">Todas</option>
                {subcategorias.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Buscar producto
            <div className="search-box">
              <Search size={18} />
              <input
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Lona, vinil, PVC, roll up..."
              />
            </div>
          </label>

          <label>
            Producto
            <select
              value={itemForm.materialId}
              onChange={(e) => actualizarItem('materialId', e.target.value)}
              required
            >
              <option value="">Seleccionar producto</option>
              {productosFiltrados.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.descripcion}
                </option>
              ))}
            </select>
          </label>

          {materialSeleccionado && (
            <div className="selected-box">
              <strong>{materialSeleccionado.descripcion || materialSeleccionado.nombre || 'Material sin nombre'}</strong>
              <span>
                {materialSeleccionado.categoria || 'Sin categorÃ­a'} Â·{' '}
                {materialSeleccionado.subcategoria || 'Sin subcategorÃ­a'} Â·{' '}
                {materialSeleccionado.tipoCalculo || 'm2'}
              </span>
            </div>
          )}

          <div className="two">
            <label>
              Tarifa
              <select value={itemForm.tarifa} onChange={(e) => actualizarItem('tarifa', e.target.value)}>
                {tarifas.map((t) => (
                  <option key={t} value={t}>Tarifa {t}</option>
                ))}
              </select>
            </label>

            <label>
              Descuento Ã­tem
              <select value={itemForm.descuento} onChange={(e) => actualizarItem('descuento', e.target.value)}>
                {descuentos.map((d) => (
                  <option key={d} value={d}>{d}%</option>
                ))}
              </select>
            </label>
          </div>

          <div className="two">
            <label>
              Ancho m
              <input
                type="number"
                step="0.01"
                value={itemForm.ancho}
                disabled={materialSeleccionado?.tipoCalculo === 'unidad'}
                onChange={(e) => actualizarItem('ancho', e.target.value)}
              />
            </label>

            <label>
              Alto m
              <input
                type="number"
                step="0.01"
                value={itemForm.alto}
                disabled={materialSeleccionado?.tipoCalculo === 'unidad'}
                onChange={(e) => actualizarItem('alto', e.target.value)}
              />
            </label>
          </div>

          <div className="two">
            <label>
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                value={itemForm.cantidad}
                onChange={(e) => actualizarItem('cantidad', e.target.value)}
              />
            </label>

            <label>
              InstalaciÃ³n por Ã­tem
              <select value={itemForm.instalacion} onChange={(e) => actualizarItem('instalacion', e.target.value)}>
                <option>No</option>
                <option>SÃ­</option>
              </select>
            </label>
          </div>

          <div className="access-box">
            <strong>Accesorios automÃ¡ticos</strong>

            <div className="access-grid">
              <button type="button" className={itemForm.accesorios.ojete ? 'active' : ''} onClick={() => actualizarAccesorio('ojete')}>Ojete</button>
              <button type="button" className={itemForm.accesorios.tuboPvc ? 'active' : ''} onClick={() => actualizarAccesorio('tuboPvc')}>Tubo PVC</button>
              <button type="button" className={itemForm.accesorios.tuboGalvanizado ? 'active' : ''} onClick={() => actualizarAccesorio('tuboGalvanizado')}>Tubo Galv.</button>
              <button type="button" className={itemForm.accesorios.bridas ? 'active' : ''} onClick={() => actualizarAccesorio('bridas')}>Bridas</button>
            </div>

            <div className="two compact">
              <label>
                SeparaciÃ³n ojetes m
                <input
                  type="number"
                  step="0.05"
                  value={itemForm.separacionOjetes}
                  onChange={(e) => actualizarItem('separacionOjetes', e.target.value)}
                />
              </label>

              <label>
                SeparaciÃ³n bridas m
                <input
                  type="number"
                  step="0.05"
                  value={itemForm.separacionBridas}
                  onChange={(e) => actualizarItem('separacionBridas', e.target.value)}
                />
              </label>
            </div>
          </div>

          <label>
            Nota interna / comercial
            <textarea value={itemForm.nota} onChange={(e) => actualizarItem('nota', e.target.value)} />
          </label>

          <button className="primary-btn" type="submit">
            <CheckCircle2 size={18} />
            Agregar Ã­tem
          </button>
        </form>

        <section className="cotizador-card">
          <div className="card-title">
            <FileText size={22} />
            <h2>Resumen</h2>
          </div>

          <div className="items-list">
            {items.map((item) => (
              <article className="quote-item" key={item.id}>
                <div>
                  <h3>{item.descripcion}</h3>
                  <p>
                    {item.tipoCalculo === 'unidad'
                      ? `Cantidad: ${item.cantidad}`
                      : `${item.ancho} x ${item.alto} m Â· Cantidad: ${item.cantidad}`}
                  </p>
                  <span>InstalaciÃ³n: {item.instalacion} Â· Desc. {item.descuento}%</span>

                  {item.accesoriosProduccion.length > 0 && (
                    <small>
                      ProducciÃ³n:{' '}
                      {item.accesoriosProduccion
                        .map((a) => `${a.nombre}: ${Number(a.cantidad).toFixed(2)} ${a.tipo}`)
                        .join(' Â· ')}
                    </small>
                  )}
                </div>

                <div className="quote-price">
                  <strong>{money(item.total)}</strong>
                  <button type="button" onClick={() => quitarItem(item.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}

            {items.length === 0 && <div className="empty">AgregÃ¡ Ã­tems para construir la cotizaciÃ³n.</div>}
          </div>

          <div className="logistica-box">
            <div className="card-title small">
              <Truck size={20} />
              <h2>LogÃ­stica global</h2>
            </div>

            <label>
              Modalidad
              <select value={logistica} onChange={(e) => setLogistica(e.target.value)}>
                {logisticaOpciones.map((op) => (
                  <option key={op}>{op}</option>
                ))}
              </select>
            </label>

            {mostrarLogisticaExtra && (
              <div className="three">
                <label>
                  KM
                  <input value={km} onChange={(e) => setKm(e.target.value)} />
                </label>

                <label>
                  Altura
                  <input value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="Ej. 3 m" />
                </label>

                <label>
                  Complejidad
                  <select value={complejidad} onChange={(e) => setComplejidad(e.target.value)}>
                    <option>Normal</option>
                    <option>Media</option>
                    <option>Alta</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="totals-box">
            <p><span>Subtotal</span><b>{money(resumen.subtotal)}</b></p>
            <p><span>Descuento</span><b>{money(resumen.descuento)}</b></p>
            <p className="total"><span>Total</span><b>{money(resumen.total)}</b></p>
            <p><span>Anticipo 60%</span><b>{money(resumen.anticipo)}</b></p>
            <p><span>Saldo 40%</span><b>{money(resumen.saldo)}</b></p>
          </div>

          <div className="action-stack">
            <button className="primary-btn" type="button" onClick={crearPedido}>
              <PackageCheck size={18} />
              Convertir a Pedido / OT
            </button>

            <button className="secondary-btn" type="button" onClick={() => copiarTexto(textoWhatsApp, 'CotizaciÃ³n copiada para WhatsApp.')}>
              <Copy size={18} />
              Copiar WhatsApp cliente
            </button>

            <button className="secondary-btn" type="button" onClick={() => copiarTexto(textoProduccion, 'OT copiada para producciÃ³n.')}>
              <Copy size={18} />
              Copiar OT producciÃ³n
            </button>
          </div>

          {pedidoGenerado && (
            <div className="pedido-ok">
              <strong>{pedidoGenerado.numeroPedido}</strong>
              <span>{pedidoGenerado.numeroOT}</span>
<small>Guardado en flujo ERP global</small>
            </div>
          )}

          <textarea className="whatsapp-text" value={textoWhatsApp} readOnly />
        </section>
      </section>

      <section className="cotizador-card future-box">
        <PackageCheck size={22} />
        <div>
          <strong>Flujo activo</strong>
          <p>Lead â†’ CotizaciÃ³n â†’ Pedido â†’ OT â†’ ProducciÃ³n â†’ InstalaciÃ³n â†’ Entrega â†’ Cobro â†’ ComisiÃ³n.</p>
        </div>
      </section>

      <style>{`
        .cotizador-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .cotizador-hero,.cotizador-card,.cotizador-lock{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .cotizador-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .cotizador-hero h1{margin:8px 0;font-size:30px;color:#111827;line-height:1}
        .cotizador-hero p{margin:0;color:#64748b;line-height:1.45;font-weight:700}
        .app-grid,.cotizador-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .card-title{display:flex;gap:10px;align-items:center;margin-bottom:14px;color:#111827}
        .card-title h2{margin:0;font-size:19px}
        .card-title.small{margin-top:16px}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:13px 14px;font-size:16px;background:#fff;color:#0f172a}
        textarea{min-height:84px;resize:vertical}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .three{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .compact input{padding:11px 12px}
        .search-box{display:flex;align-items:center;gap:8px;border:1px solid #dbe3ef;border-radius:16px;padding:0 12px;background:#fff}
        .search-box input{border:0;padding-left:0}
        .client-list{display:grid;gap:8px;margin-bottom:12px}
        .client-list button{text-align:left;border:1px solid #e5e7eb;background:#f8fafc;border-radius:16px;padding:12px;display:grid;gap:3px}
        .client-list span{font-size:12px;color:#64748b;font-weight:800}
        .selected-box{border:1px solid #fde68a;background:#fffbeb;border-radius:18px;padding:14px;margin-bottom:14px;display:grid;gap:4px}
        .selected-box span{color:#92400e;font-size:13px;font-weight:800}
        .primary-btn,.secondary-btn{width:100%;border:0;border-radius:18px;padding:15px;font-weight:950;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}
        .primary-btn{background:#111827;color:#fff}
        .secondary-btn{background:#f3f4f6;color:#111827;border:1px solid #dbe3ef}
        .action-stack{display:grid;gap:10px}
        .access-box,.logistica-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin-bottom:14px}
        .access-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
        .access-grid button{border:1px solid #dbe3ef;background:#fff;border-radius:14px;padding:12px;font-weight:950}
        .access-grid button.active{background:#111827;color:#fff}
        .items-list{display:grid;gap:12px}
        .quote-item{border:1px solid #e5e7eb;border-radius:18px;padding:14px;background:#f8fafc;display:flex;justify-content:space-between;gap:14px}
        .quote-item h3{margin:0 0 5px;color:#111827;font-size:16px}
        .quote-item p{margin:0;color:#64748b;font-weight:700}
        .quote-item span,.quote-item small{display:block;margin-top:7px;font-size:12px;font-weight:900;color:#475569}
        .quote-price{text-align:right;display:grid;gap:7px;justify-items:end}
        .quote-price strong{font-size:18px;color:#111827}
        .quote-price button{border:0;background:#fee2e2;color:#991b1b;border-radius:12px;width:36px;height:36px}
        .totals-box{background:#0f172a;color:#fff;border-radius:20px;padding:16px;margin:16px 0;display:grid;gap:8px}
        .totals-box p{display:flex;justify-content:space-between;margin:0;color:#dbeafe}
        .totals-box .total{font-size:21px;color:#fff;border-top:1px solid rgba(255,255,255,.18);padding-top:10px}
        .pedido-ok{margin-top:12px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;border-radius:18px;padding:14px;display:grid;gap:4px;font-weight:900}
        .pedido-ok span{font-size:20px}
        .pedido-ok small{color:#047857}
        .whatsapp-text{margin-top:14px;font-family:monospace;min-height:300px}
        .empty{padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:18px;font-weight:800}
        .future-box{display:flex;gap:12px;align-items:flex-start}
        .future-box strong{font-size:16px;color:#111827}
        .future-box p{margin:4px 0 0;color:#64748b;font-weight:700}
        .cotizador-lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:850px){
          .cotizador-page{padding:12px;gap:12px}
          .app-grid,.cotizador-grid,.two,.three{grid-template-columns:1fr}
          .access-grid{grid-template-columns:repeat(2,1fr)}
          .cotizador-hero h1{font-size:27px}
          .quote-item{flex-direction:column}
          .quote-price{text-align:left;justify-items:start}
          input,select,textarea{font-size:16px;padding:15px}
          .primary-btn,.secondary-btn{min-height:54px}
        }
      `}</style>
    </main>
  );
}


