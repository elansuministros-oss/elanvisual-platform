import { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '../lib/supabase';

const STORAGE_CLIENTES = 'elanvisual_cotizador_clientes_v1';

const descuentos = [0, 5, 10, 15, 20];
const tarifas = ['A', 'B', 'C', 'D'];
const tintas = ['ecosolvente', 'solvente', 'uv'];
const labelsTinta = {
  ecosolvente: 'Ecosolvente',
  solvente: 'Solvente',
  uv: 'UV',
};

const costosTintaDefault = {
  ecosolvente: 1.5,
  solvente: 0,
  uv: 0,
};

const markupTarifa = {
  A: 2,
  B: 2.5,
  C: 3,
};

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
  const numero = String((lista || []).length + 1).padStart(4, '0');
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
  tinta: 'ecosolvente',
  tarifa: 'B',
  ancho: '',
  alto: '',
  cantidad: 1,
  descuento: 0,
  instalacion: 'No',
  costoInstalacionM2: '',
  nota: '',
};

function adaptarMaterial(row) {
  const extra = row.data || {};
  return {
    ...extra,
    id: row.id,
    nombre: row.nombre || extra.nombre || extra.descripcion || '',
    descripcion: extra.descripcion || row.nombre || '',
    categoria: row.categoria || extra.categoria || '',
    subcategoria: row.subcategoria || extra.subcategoria || '',
    unidad: row.unidad || extra.unidad || extra.tipoCalculo || 'm2',
    tipoCalculo: extra.tipoCalculo || row.unidad || 'm2',
    precioBase: Number(row.costo ?? extra.precioBase ?? 0),
    precioVenta: Number(row.precio ?? extra.precioVenta ?? extra.tarifaB ?? 0),
    stock: Number(row.stock ?? extra.stock ?? 0),
    proveedor: row.proveedor || extra.proveedor || '',
    activo: row.activo !== false,
    costosTinta: extra.costosTinta || {},
    costoInstalacionM2: Number(extra.costoInstalacionM2 || extra.instalacionM2 || 0),
  };
}

export default function CotizadorVisual() {
  const { usuario, pedidos = [], crearPedidoOperativo } = useApp();

  const [materiales, setMateriales] = useState([]);
  const [cargandoMateriales, setCargandoMateriales] = useState(false);
  const [clientes, setClientes] = useState(() => leerStorage(STORAGE_CLIENTES));

  const [cliente, setCliente] = useState(clienteInicial);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [proyecto, setProyecto] = useState(proyectoInicial);

  const [itemForm, setItemForm] = useState(itemInicial);
  const [items, setItems] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');

  const [km, setKm] = useState('');
  const [costoKm, setCostoKm] = useState(1);
  const [aplicaIva, setAplicaIva] = useState(false);
  const [pedidoGenerado, setPedidoGenerado] = useState(null);

  const tieneAcceso = usuario?.rol === 'admin' || usuario?.rol === 'ventas';

  const cargarMateriales = async () => {
    try {
      setCargandoMateriales(true);
      const { data, error } = await supabase
        .from('materiales')
        .select('*')
        .eq('activo', true)
        .order('categoria', { ascending: true });

      if (error) throw error;
      setMateriales((data || []).map(adaptarMaterial));
    } catch (error) {
      console.error('Error cargando materiales:', error);
      alert('No se pudieron cargar materiales desde Supabase.');
    } finally {
      setCargandoMateriales(false);
    }
  };

  useEffect(() => {
    cargarMateriales();
  }, []);

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
          .map((m) => m.subcategoria || 'General')
          .filter(Boolean)
      ),
    ],
    [materialesActivos, itemForm.categoria]
  );

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.toLowerCase();
    return materialesActivos.filter((m) => {
      const texto = `${m.descripcion || ''} ${m.nombre || ''} ${m.categoria || ''} ${m.subcategoria || ''}`.toLowerCase();
      return (
        (!itemForm.categoria || m.categoria === itemForm.categoria) &&
        texto.includes(q)
      );
    });
  }, [materialesActivos, itemForm.categoria, busquedaProducto]);

  const materialSeleccionado =
    materialesActivos.find((m) => m.id === itemForm.materialId) ||
    productosFiltrados.find((m) => m.subcategoria === itemForm.subcategoria) ||
    null;

  useEffect(() => {
    if (!materialSeleccionado) return;
    setItemForm((prev) => ({
      ...prev,
      costoInstalacionM2:
        prev.instalacion === 'Si'
          ? String(prev.costoInstalacionM2 || materialSeleccionado.costoInstalacionM2 || '')
          : prev.costoInstalacionM2,
    }));
  }, [materialSeleccionado]);

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.toLowerCase();
    if (!q) return clientes.slice(0, 6);
    return clientes.filter((c) =>
      `${c.empresa} ${c.contacto} ${c.whatsapp} ${c.correo}`.toLowerCase().includes(q)
    );
  }, [clientes, busquedaCliente]);

  const areaItem = useMemo(() => {
    const cantidad = Math.max(1, num(itemForm.cantidad));
    if (materialSeleccionado?.tipoCalculo === 'unidad') return cantidad;
    if (materialSeleccionado?.tipoCalculo === 'metro_lineal' || materialSeleccionado?.tipoCalculo === 'lineal') {
      return num(itemForm.ancho) * cantidad;
    }
    return num(itemForm.ancho) * num(itemForm.alto) * cantidad;
  }, [itemForm.ancho, itemForm.alto, itemForm.cantidad, materialSeleccionado]);

  const costoTinta = (material, tinta) => {
    if (!material) return 0;
    return num(material.costosTinta?.[tinta] ?? costosTintaDefault[tinta]);
  };

  const precioTarifa = (material, tarifa, tinta) => {
    if (!material) return 0;

    if (tarifa === 'D') {
      return num(material.tarifaD || material.precioAprobado || material.precioVenta || material.tarifaC);
    }

    const tarifaGuardada = num(material[`tarifa${tarifa}`] || material[`precio${tarifa}`]);
    const costoMaterial = num(material.precioBase || material.costoMaterialSinTinta || material.costo);

    if (costoMaterial > 0) {
      const costoProduccion = (costoMaterial + costoTinta(material, tinta)) * 1.1;
      return costoProduccion * (markupTarifa[tarifa] || markupTarifa.B);
    }

    return tarifaGuardada || num(material.precioVenta);
  };

  const tarifasPreview = useMemo(() => {
    if (!materialSeleccionado || areaItem <= 0) return [];

    const visibles = tarifas.filter((t) => usuario?.rol === 'admin' || t !== 'D');

    return visibles.map((tarifa) => {
      const precioUnitario = precioTarifa(materialSeleccionado, tarifa, itemForm.tinta);
      const subtotal = precioUnitario * areaItem;
      const descuentoPermitido = Math.min(num(itemForm.descuento), num(materialSeleccionado.descuentoMaximo || 20));
      const montoDescuento = subtotal * (descuentoPermitido / 100);
      const total = subtotal - montoDescuento;

      return {
        tarifa,
        precioUnitario,
        subtotal,
        descuentoPermitido,
        total,
      };
    });
  }, [materialSeleccionado, areaItem, itemForm.tinta, itemForm.descuento, usuario?.rol]);

  const resumen = useMemo(() => {
    const subtotalItems = items.reduce((acc, item) => acc + num(item.total), 0);
    const descuento = items.reduce((acc, item) => acc + num(item.montoDescuento), 0);
    const totalM2Instalacion = items
      .filter((item) => item.categoria === 'Instalacion')
      .reduce((acc, item) => acc + num(item.cantidadBase), 0);

    const transporte = num(km) * num(costoKm);
    const subtotal = subtotalItems + transporte;
    const iva = aplicaIva ? subtotal * 0.15 : 0;
    const total = subtotal + iva;

    return {
      subtotalItems,
      descuento,
      totalM2Instalacion,
      transporte,
      subtotal,
      iva,
      total,
      anticipo: total * 0.6,
      saldo: total * 0.4,
    };
  }, [items, km, costoKm, aplicaIva]);

  const actualizarCliente = (campo, valor) => setCliente((prev) => ({ ...prev, [campo]: valor }));
  const actualizarProyecto = (campo, valor) => setProyecto((prev) => ({ ...prev, [campo]: valor }));
  const actualizarItem = (campo, valor) => setItemForm((prev) => ({ ...prev, [campo]: valor }));

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

  const agregarItem = (e) => {
    e.preventDefault();
    if (!materialSeleccionado) return;

    const cantidadBase = areaItem;
    if (cantidadBase <= 0) {
      alert('Ingresa medidas validas.');
      return;
    }

    const precioUnitario = precioTarifa(materialSeleccionado, itemForm.tarifa, itemForm.tinta);
    const subtotal = precioUnitario * cantidadBase;
    const descuentoPermitido = Math.min(num(itemForm.descuento), num(materialSeleccionado.descuentoMaximo || 20));
    const montoDescuento = subtotal * (descuentoPermitido / 100);
    const total = subtotal - montoDescuento;

    const nuevoItem = {
      id: `item-${Date.now()}`,
      materialId: materialSeleccionado.id,
      descripcion: materialSeleccionado.descripcion || materialSeleccionado.nombre || 'Material sin nombre',
      tinta: itemForm.tinta,
      tintaLabel: labelsTinta[itemForm.tinta],
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
    };

    const nuevos = [nuevoItem];

    if (itemForm.instalacion === 'Si') {
      const instalacionM2 = num(itemForm.costoInstalacionM2 || materialSeleccionado.costoInstalacionM2);
      if (instalacionM2 <= 0) {
        alert('Ingresa costo de instalacion por m2.');
        return;
      }

      nuevos.push({
        id: `inst-${Date.now()}`,
        descripcion: `Instalacion de ${nuevoItem.descripcion}`,
        categoria: 'Instalacion',
        subcategoria: 'Instalacion por m2',
        tipoCalculo: 'm2',
        ancho: nuevoItem.ancho,
        alto: nuevoItem.alto,
        cantidad: nuevoItem.cantidad,
        cantidadBase,
        tarifa: 'Instalacion',
        precioUnitario: instalacionM2,
        subtotal: instalacionM2 * cantidadBase,
        descuento: 0,
        montoDescuento: 0,
        total: instalacionM2 * cantidadBase,
        instalacion: 'Si',
        nota: 'Instalacion calculada por m2.',
      });
    }

    setItems((prev) => [...nuevos, ...prev]);
    setPedidoGenerado(null);
    setItemForm((prev) => ({
      ...itemInicial,
      categoria: prev.categoria,
      subcategoria: prev.subcategoria,
      tinta: prev.tinta,
      tarifa: prev.tarifa,
    }));
  };

  const quitarItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setPedidoGenerado(null);
  };

  const crearPedido = () => {
    if (items.length === 0) return alert('Agrega al menos un item.');
    if (!cliente.empresa && !cliente.contacto) return alert('Completa el cliente.');

    const nuevoPedido = {
      id: `ped-${Date.now()}`,
      numeroPedido: consecutivo('PED', pedidos),
      numeroOT: consecutivo('OT', pedidos),
      fecha: new Date().toISOString(),
      estado: 'Pedido creado',
      cliente,
      proyecto,
      logistica: {
        km,
        costoKm,
        transporte: resumen.transporte,
      },
      resumen,
      items: [
        ...items,
        ...(resumen.transporte > 0
          ? [{
              id: `trans-${Date.now()}`,
              descripcion: `Transporte ${km} km`,
              categoria: 'Transporte',
              cantidadBase: num(km),
              precioUnitario: num(costoKm),
              total: resumen.transporte,
            }]
          : []),
      ],
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
        items,
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
          : `Medida: ${item.ancho} x ${item.alto} m - Cantidad: ${item.cantidad} - Total: ${Number(item.cantidadBase).toFixed(2)} m2`;

      return `${index + 1}. ${item.descripcion}
${item.tintaLabel ? `Tinta: ${item.tintaLabel}` : ''}
${medida}
${item.instalacion === 'Si' ? 'Incluye instalacion.' : 'Sin instalacion.'}
Total item: ${money(item.total)}
${item.nota ? `Nota: ${item.nota}` : ''}`;
    });

    const lineas = [
      '*COTIZACION ELANVISUAL*',
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
      proyecto.direccion ? `Direccion: ${proyecto.direccion}` : '',
      '',
      '*Detalle*',
      ...detalle,
      '',
      resumen.totalM2Instalacion > 0 ? `Total m2 instalacion: ${resumen.totalM2Instalacion.toFixed(2)} m2` : '',
      resumen.transporte > 0 ? `Transporte: ${km} km x ${money(costoKm)} = ${money(resumen.transporte)}` : '',
      '',
      `Subtotal items: ${money(resumen.subtotalItems)}`,
      `Subtotal: ${money(resumen.subtotal)}`,
      aplicaIva ? `IVA 15%: ${money(resumen.iva)}` : 'IVA: No aplicado',
      `Total: ${money(resumen.total)}`,
      `Anticipo 60%: ${money(resumen.anticipo)}`,
      `Saldo 40%: ${money(resumen.saldo)}`,
      '',
      'Precios sujetos a validacion final segun artes, medidas definitivas y condiciones reales de instalacion.',
    ];

    return lineas.filter(Boolean).join('\n');
  }, [items, resumen, km, costoKm, aplicaIva, cliente, proyecto, pedidoGenerado]);

  const copiarTexto = async (texto, mensaje) => {
    try {
      await navigator.clipboard.writeText(texto);
      alert(mensaje);
    } catch {
      alert('No se pudo copiar automaticamente.');
    }
  };

  if (!tieneAcceso) {
    return (
      <main className="cotizador-page">
        <section className="cotizador-lock">
          <Calculator size={44} />
          <h1>Acceso restringido</h1>
          <p>Este cotizador es solo para administracion y vendedores.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="cotizador-page">
      <section className="cotizador-hero">
        <span>ELANVISUAL - COTIZADOR V3</span>
        <h1>Cotizador Visual</h1>
        <p>Material, tinta, medidas, instalacion, transporte e IVA.</p>
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
              <input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Empresa, contacto o WhatsApp" />
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
            <label>Empresa<input value={cliente.empresa} onChange={(e) => actualizarCliente('empresa', e.target.value)} /></label>
            <label>Contacto<input value={cliente.contacto} onChange={(e) => actualizarCliente('contacto', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>WhatsApp<input value={cliente.whatsapp} onChange={(e) => actualizarCliente('whatsapp', e.target.value)} /></label>
            <label>Correo<input value={cliente.correo} onChange={(e) => actualizarCliente('correo', e.target.value)} /></label>
          </div>

          <button className="secondary-btn" type="button" onClick={guardarCliente}>Guardar cliente</button>
        </section>

        <section className="cotizador-card">
          <div className="card-title">
            <MapPin size={22} />
            <h2>Proyecto</h2>
          </div>

          <label>Lugar<input value={proyecto.lugar} onChange={(e) => actualizarProyecto('lugar', e.target.value)} /></label>
          <label>Direccion<textarea value={proyecto.direccion} onChange={(e) => actualizarProyecto('direccion', e.target.value)} /></label>

          <div className="two">
            <label>Contacto sitio<input value={proyecto.contactoSitio} onChange={(e) => actualizarProyecto('contactoSitio', e.target.value)} /></label>
            <label>WhatsApp sitio<input value={proyecto.whatsappSitio} onChange={(e) => actualizarProyecto('whatsappSitio', e.target.value)} /></label>
          </div>
        </section>
      </section>

      <section className="cotizador-grid">
        <form className="cotizador-card" onSubmit={agregarItem}>
          <div className="card-title">
            <PlusCircle size={22} />
            <h2>Agregar item</h2>
          </div>

          {cargandoMateriales && <div className="empty">Cargando materiales desde Supabase...</div>}

          <div className="two">
            <label>
              Categoria
              <select value={itemForm.categoria} onChange={(e) => setItemForm((p) => ({ ...p, categoria: e.target.value, subcategoria: '', materialId: '' }))}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label>
              Producto / Subcategoria
              <select
                value={itemForm.subcategoria}
                onChange={(e) => {
                  const valor = e.target.value;
                  const material = productosFiltrados.find((m) => m.subcategoria === valor);
                  setItemForm((p) => ({
                    ...p,
                    subcategoria: valor,
                    materialId: material?.id || '',
                  }));
                }}
                required
              >
                <option value="">Seleccionar producto</option>
                {subcategorias.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <label>
            Buscar producto
            <div className="search-box">
              <Search size={18} />
              <input value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} placeholder="Lona, vinil, PVC, roll up..." />
            </div>
          </label>

          {materialSeleccionado && (
            <div className="selected-box">
              <strong>{materialSeleccionado.descripcion || materialSeleccionado.nombre}</strong>
              <span>{materialSeleccionado.categoria} - {materialSeleccionado.subcategoria} - {materialSeleccionado.tipoCalculo}</span>
            </div>
          )}

          <label>
            Tinta
            <select value={itemForm.tinta} onChange={(e) => actualizarItem('tinta', e.target.value)}>
              {tintas.map((t) => <option key={t} value={t}>{labelsTinta[t]}</option>)}
            </select>
          </label>

          <div className="tarifas-preview">
            <strong>Precios disponibles</strong>
            <div className="tarifas-grid">
              {tarifasPreview.map((item) => (
                <button
                  key={item.tarifa}
                  type="button"
                  className={itemForm.tarifa === item.tarifa ? 'tarifa-card active' : 'tarifa-card'}
                  onClick={() => actualizarItem('tarifa', item.tarifa)}
                >
                  <span>Tarifa {item.tarifa}</span>
                  <b>{money(item.total)}</b>
                  <small>{money(item.precioUnitario)} / unidad calculada</small>
                </button>
              ))}
            </div>
          </div>

          <div className="two">
            <label>Ancho m<input type="number" step="0.01" value={itemForm.ancho} disabled={materialSeleccionado?.tipoCalculo === 'unidad'} onChange={(e) => actualizarItem('ancho', e.target.value)} /></label>
            <label>Alto m<input type="number" step="0.01" value={itemForm.alto} disabled={materialSeleccionado?.tipoCalculo === 'unidad'} onChange={(e) => actualizarItem('alto', e.target.value)} /></label>
          </div>

          <div className="two">
            <label>Cantidad<input type="number" min="1" step="1" value={itemForm.cantidad} onChange={(e) => actualizarItem('cantidad', e.target.value)} /></label>
            <label>Descuento<select value={itemForm.descuento} onChange={(e) => actualizarItem('descuento', e.target.value)}>{descuentos.map((d) => <option key={d} value={d}>{d}%</option>)}</select></label>
          </div>

          <div className="two">
            <label>Instalacion<select value={itemForm.instalacion} onChange={(e) => actualizarItem('instalacion', e.target.value)}><option>No</option><option>Si</option></select></label>
            {itemForm.instalacion === 'Si' && (
              <label>Costo instalacion m2<input type="number" step="0.01" value={itemForm.costoInstalacionM2} onChange={(e) => actualizarItem('costoInstalacionM2', e.target.value)} /></label>
            )}
          </div>

          <div className="selected-box">
            <strong>Total calculado</strong>
            <span>{Number(areaItem || 0).toFixed(2)} m2</span>
          </div>

          <label>Nota interna / comercial<textarea value={itemForm.nota} onChange={(e) => actualizarItem('nota', e.target.value)} /></label>

          <button className="primary-btn" type="submit">
            <CheckCircle2 size={18} />
            Agregar item
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
                  <p>{item.tipoCalculo === 'unidad' ? `Cantidad: ${item.cantidad}` : `${item.ancho} x ${item.alto} m - Cantidad: ${item.cantidad} - ${Number(item.cantidadBase).toFixed(2)} m2`}</p>
                  <span>{item.tintaLabel ? `Tinta: ${item.tintaLabel} - ` : ''}Instalacion: {item.instalacion} - Desc. {item.descuento || 0}%</span>
                </div>

                <div className="quote-price">
                  <strong>{money(item.total)}</strong>
                  <button type="button" onClick={() => quitarItem(item.id)}><Trash2 size={15} /></button>
                </div>
              </article>
            ))}
            {items.length === 0 && <div className="empty">Agrega items para construir la cotizacion.</div>}
          </div>

          <div className="logistica-box">
            <div className="card-title small">
              <Truck size={20} />
              <h2>Transporte</h2>
            </div>

            <div className="two">
              <label>KM<input type="number" step="0.01" value={km} onChange={(e) => setKm(e.target.value)} /></label>
              <label>Costo por KM<input type="number" step="0.01" value={costoKm} onChange={(e) => setCostoKm(e.target.value)} /></label>
            </div>
          </div>

          <label className="iva-check">
            <input type="checkbox" checked={aplicaIva} onChange={(e) => setAplicaIva(e.target.checked)} />
            Aplicar IVA 15%
          </label>

          <div className="totals-box">
            <p><span>Items</span><b>{money(resumen.subtotalItems)}</b></p>
            <p><span>M2 instalacion</span><b>{resumen.totalM2Instalacion.toFixed(2)} m2</b></p>
            <p><span>Transporte</span><b>{money(resumen.transporte)}</b></p>
            <p><span>Subtotal</span><b>{money(resumen.subtotal)}</b></p>
            <p><span>IVA</span><b>{money(resumen.iva)}</b></p>
            <p className="total"><span>Total</span><b>{money(resumen.total)}</b></p>
            <p><span>Anticipo 60%</span><b>{money(resumen.anticipo)}</b></p>
            <p><span>Saldo 40%</span><b>{money(resumen.saldo)}</b></p>
          </div>

          <div className="action-stack">
            <button className="primary-btn" type="button" onClick={crearPedido}><PackageCheck size={18} />Convertir a Pedido / OT</button>
            <button className="secondary-btn" type="button" onClick={() => copiarTexto(textoWhatsApp, 'Cotizacion copiada para WhatsApp.')}><Copy size={18} />Copiar WhatsApp cliente</button>
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

      <style>{`
        .cotizador-page{padding:14px;display:grid;gap:14px;background:#f4f6fb;min-height:100vh}
        .cotizador-hero,.cotizador-card,.cotizador-lock{background:#fff;border-radius:24px;padding:18px;box-shadow:0 14px 35px rgba(15,23,42,.08)}
        .cotizador-hero span{font-size:12px;font-weight:950;color:#b48722;text-transform:uppercase}
        .cotizador-hero h1{margin:8px 0;font-size:30px;color:#111827;line-height:1}
        .cotizador-hero p{margin:0;color:#64748b;line-height:1.45;font-weight:700}
        .app-grid,.cotizador-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .card-title{display:flex;gap:10px;align-items:center;margin-bottom:14px;color:#111827}
        .card-title h2{margin:0;font-size:19px}
        label{display:grid;gap:7px;font-weight:900;color:#334155;margin-bottom:12px}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:16px;padding:13px 14px;font-size:16px;background:#fff;color:#0f172a}
        textarea{min-height:84px;resize:vertical}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .search-box{display:flex;align-items:center;gap:8px;border:1px solid #dbe3ef;border-radius:16px;padding:0 12px;background:#fff}
        .search-box input{border:0;padding-left:0}
        .client-list{display:grid;gap:8px;margin-bottom:12px}
        .client-list button{text-align:left;border:1px solid #e5e7eb;background:#f8fafc;border-radius:16px;padding:12px;display:grid;gap:3px}
        .client-list span{font-size:12px;color:#64748b;font-weight:800}
        .selected-box{border:1px solid #fde68a;background:#fffbeb;border-radius:18px;padding:14px;margin-bottom:14px;display:grid;gap:4px}
        .tarifas-preview{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin-bottom:14px;display:grid;gap:12px}
        .tarifas-preview>strong{color:#111827;font-size:15px}
        .tarifas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
        .tarifa-card{border:1px solid #dbe3ef;background:#fff;border-radius:18px;padding:14px;text-align:left;display:grid;gap:4px;color:#111827}
        .tarifa-card span{font-size:12px;font-weight:950;text-transform:uppercase;color:#64748b}
        .tarifa-card b{font-size:22px;color:#111827}
        .tarifa-card small{font-size:11px;color:#64748b;font-weight:800}
        .tarifa-card.active{background:#111827;color:#fff;border-color:#111827}
        .tarifa-card.active span,.tarifa-card.active b,.tarifa-card.active small{color:#fff}
        .selected-box span{color:#92400e;font-size:13px;font-weight:800}
        .primary-btn,.secondary-btn{width:100%;border:0;border-radius:18px;padding:15px;font-weight:950;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px}
        .primary-btn{background:#111827;color:#fff}
        .secondary-btn{background:#f3f4f6;color:#111827;border:1px solid #dbe3ef}
        .action-stack{display:grid;gap:10px}
        .logistica-box{background:#f8fafc;border:1px solid #e5e7eb;border-radius:18px;padding:14px;margin:14px 0}
        .items-list{display:grid;gap:12px}
        .quote-item{border:1px solid #e5e7eb;border-radius:18px;padding:14px;background:#f8fafc;display:flex;justify-content:space-between;gap:14px}
        .quote-item h3{margin:0 0 5px;color:#111827;font-size:16px}
        .quote-item p{margin:0;color:#64748b;font-weight:700}
        .quote-item span{display:block;margin-top:7px;font-size:12px;font-weight:900;color:#475569}
        .quote-price{text-align:right;display:grid;gap:7px;justify-items:end}
        .quote-price strong{font-size:18px;color:#111827}
        .quote-price button{border:0;background:#fee2e2;color:#991b1b;border-radius:12px;width:36px;height:36px}
        .iva-check{display:flex;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin:14px 0;font-weight:950}
        .iva-check input{width:22px;height:22px}
        .totals-box{background:#0f172a;color:#fff;border-radius:20px;padding:16px;margin:16px 0;display:grid;gap:8px}
        .totals-box p{display:flex;justify-content:space-between;margin:0;color:#dbeafe}
        .totals-box .total{font-size:21px;color:#fff;border-top:1px solid rgba(255,255,255,.18);padding-top:10px}
        .pedido-ok{margin-top:12px;background:#ecfdf5;border:1px solid #bbf7d0;color:#065f46;border-radius:18px;padding:14px;display:grid;gap:4px;font-weight:900}
        .pedido-ok span{font-size:20px}
        .pedido-ok small{color:#047857}
        .whatsapp-text{margin-top:14px;font-family:monospace;min-height:300px}
        .empty{padding:24px;text-align:center;color:#64748b;border:1px dashed #cbd5e1;border-radius:18px;font-weight:800}
        .cotizador-lock{text-align:center;margin:40px auto;max-width:420px}
        @media(max-width:850px){
          .cotizador-page{padding:12px;gap:12px}
          .app-grid,.cotizador-grid,.two,.tarifas-grid{grid-template-columns:1fr}
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
