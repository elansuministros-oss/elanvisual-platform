import { useEffect, useMemo, useState } from 'react';
import { Lock, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const normalizar = (v = '') =>
  String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const pick = (obj = {}, keys = [], fallback = '') => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);
const sameId = (a, b) => String(a || '') === String(b || '');

const detectarMoneda = (row = {}, campoPrecio = '') => {
  const raw = pick(row, ['moneda', 'currency', 'divisa', 'tipo_moneda', 'moneda_precio', 'precio_moneda'], '');
  const m = normalizar(raw);

  if (campoPrecio.toLowerCase().endsWith('_usd') || m.includes('usd') || m.includes('dolar')) return 'USD';
  if (campoPrecio.toLowerCase().endsWith('_nio') || m.includes('nio') || m.includes('cordoba') || m === 'c$') return 'NIO';

  return 'NIO';
};

const formatMoney = (valor = 0, moneda = 'NIO') =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: moneda === 'USD' ? 'USD' : 'NIO',
    minimumFractionDigits: 2,
  }).format(Number(valor || 0));

const precioDesdeRegistro = (row = {}) => {
  const campos = [
    'precio_operativo_nio',
    'precio_final_nio',
    'precio_lista_nio',
    'costo_unitario_nio',
    'precio_operativo_usd',
    'precio_final_usd',
    'precio_lista_usd',
    'costo_unitario_usd',
    'precio_operativo',
    'precio_final',
    'precio_lista',
    'precio_unitario',
    'costo_unitario',
    'costo_compra',
    'costo',
    'precio',
  ];

  for (const campo of campos) {
    const value = row?.[campo];
    const numero = Number(value);
    if (Number.isFinite(numero) && numero > 0) {
      return {
        valor: numero,
        moneda: detectarMoneda(row, campo),
        campo,
      };
    }
  }

  return { valor: 0, moneda: detectarMoneda(row), campo: '' };
};

const mediana = (values = []) => {
  const nums = values
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (!nums.length) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const precioOperativoPorMoneda = (precios = []) => {
  const validos = precios.filter((p) => Number.isFinite(Number(p.valor)) && Number(p.valor) > 0);
  const nio = validos.filter((p) => p.moneda === 'NIO').map((p) => p.valor);
  const usd = validos.filter((p) => p.moneda === 'USD').map((p) => p.valor);

  return {
    nio: mediana(nio),
    usd: mediana(usd),
    tieneNio: nio.length > 0,
    tieneUsd: usd.length > 0,
    cantidadNio: nio.length,
    cantidadUsd: usd.length,
    mixto: nio.length > 0 && usd.length > 0,
  };
};

const mostrarPrecioOperativo = (precio = {}) => {
  const partes = [];
  if (precio.tieneNio) partes.push(formatMoney(precio.nio, 'NIO'));
  if (precio.tieneUsd) partes.push(formatMoney(precio.usd, 'USD'));
  return partes.length ? partes.join(' / ') : 'Sin precio';
};

const estadoItem = (item = {}) => {
  if (item.activo === false) return 'Inactivo';
  return String(pick(item, ['estado', 'estatus'], 'Activo')).toUpperCase();
};

export default function MaterialesCostos() {
  const { usuario } = useApp();
  const esAdmin = usuario?.rol === 'admin';

  const [items, setItems] = useState([]);
  const [proveedorItems, setProveedorItems] = useState([]);
  const [proveedoresCatalogo, setProveedoresCatalogo] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const cargarEMC = async () => {
    setCargando(true);
    setErrorCarga('');

    const [itemsRes, proveedorItemsRes, proveedoresRes, categoriasRes, subcategoriasRes, marcasRes, unidadesRes] =
      await Promise.all([
        supabase.from('elankav_catalogo_items').select('*').limit(5000),
        supabase.from('elankav_catalogo_proveedor_items').select('*').limit(5000),
        supabase.from('elankav_catalogo_proveedores').select('*').limit(1000),
        supabase.from('elankav_catalogo_categorias').select('*').limit(1000),
        supabase.from('elankav_catalogo_subcategorias').select('*').limit(1000),
        supabase.from('elankav_catalogo_marcas').select('*').limit(1000),
        supabase.from('elankav_catalogo_unidades').select('*').limit(1000),
      ]);

    const erroresCriticos = [itemsRes, proveedorItemsRes, categoriasRes, subcategoriasRes, marcasRes, unidadesRes]
      .map((res) => res.error?.message)
      .filter(Boolean);

    if (erroresCriticos.length) setErrorCarga(erroresCriticos.join(' | '));

    setItems(toArray(itemsRes.data));
    setProveedorItems(toArray(proveedorItemsRes.data));
    setProveedoresCatalogo(toArray(proveedoresRes.data));
    setCategorias(toArray(categoriasRes.data));
    setSubcategorias(toArray(subcategoriasRes.data));
    setMarcas(toArray(marcasRes.data));
    setUnidades(toArray(unidadesRes.data));
    setCargando(false);
  };

  useEffect(() => {
    if (supabase) cargarEMC();
  }, []);

  const buscarCatalogo = (lista, id) => {
    const found = lista.find((x) => sameId(x.id, id) || sameId(x.codigo, id) || sameId(x.slug, id));
    return found ? pick(found, ['nombre', 'descripcion', 'titulo', 'razon_social', 'empresa', 'codigo'], '') : '';
  };

  const nombreItem = (item = {}) =>
    pick(item, ['nombre', 'nombre_catalogo', 'descripcion', 'producto', 'material', 'codigo_catalogo', 'codigo'], 'Sin nombre');

  const categoriaItem = (item = {}) =>
    pick(item, ['categoria_nombre', 'categoria'], '') ||
    buscarCatalogo(categorias, pick(item, ['categoria_id', 'id_categoria'], '')) ||
    'General';

  const subcategoriaItem = (item = {}) =>
    pick(item, ['subcategoria_nombre', 'subcategoria'], '') ||
    buscarCatalogo(subcategorias, pick(item, ['subcategoria_id', 'id_subcategoria'], '')) ||
    'Sin clasificar';

  const marcaItem = (item = {}) =>
    pick(item, ['marca_nombre', 'marca'], '') || buscarCatalogo(marcas, pick(item, ['marca_id', 'id_marca'], '')) || 'Sin marca';

  const unidadItem = (item = {}) =>
    pick(item, ['unidad_nombre', 'unidad', 'unidad_compra', 'unidad_medida'], '') ||
    buscarCatalogo(unidades, pick(item, ['unidad_id', 'id_unidad'], '')) ||
    'Unidad';

  const proveedorNombre = (p = {}) => {
    const directo = pick(p, ['proveedor_nombre', 'nombre_proveedor', 'proveedor', 'supplier_name', 'empresa'], '');
    if (directo) return directo;

    const proveedorId = pick(p, ['proveedor_id', 'supplier_id', 'id_proveedor'], '');
    return buscarCatalogo(proveedoresCatalogo, proveedorId) || (proveedorId ? `Proveedor ${String(proveedorId).slice(0, 8)}` : 'Sin proveedor');
  };

  const proveedoresPorItem = (item = {}) => {
    const itemId = item.id;
    const codigo = pick(item, ['codigo', 'codigo_catalogo', 'sku', 'referencia'], '');
    const nombre = normalizar(nombreItem(item));

    return proveedorItems.filter((p) => {
      const pItemId = pick(p, ['item_id', 'catalogo_item_id', 'producto_id', 'material_id'], '');
      const pCodigo = pick(p, ['codigo_item', 'codigo_catalogo', 'sku', 'referencia'], '');
      const pNombre = normalizar(pick(p, ['nombre_item', 'nombre_catalogo', 'nombre', 'descripcion'], ''));

      return (
        sameId(pItemId, itemId) ||
        (codigo && sameId(pCodigo, codigo)) ||
        (nombre && pNombre && (pNombre === nombre || pNombre.includes(nombre) || nombre.includes(pNombre)))
      );
    });
  };

  const materialVM = (item = {}) => {
    const proveedores = proveedoresPorItem(item);
    const preciosProveedor = proveedores.map((p) => ({ ...precioDesdeRegistro(p), proveedor: proveedorNombre(p) }));
    const precioBase = precioDesdeRegistro(item);
    const precios = preciosProveedor.length ? preciosProveedor : [precioBase];
    const operativo = precioOperativoPorMoneda(precios);
    const proveedoresUnicos = [...new Set(proveedores.map(proveedorNombre).filter(Boolean))];

    return {
      id: item.id || pick(item, ['codigo_catalogo', 'codigo', 'sku'], nombreItem(item)),
      nombre: nombreItem(item),
      categoria: categoriaItem(item),
      subcategoria: subcategoriaItem(item),
      marca: marcaItem(item),
      unidad: unidadItem(item),
      proveedores,
      proveedoresUnicos,
      proveedorPrincipal: proveedoresUnicos[0] || pick(item, ['proveedor_nombre', 'proveedor'], 'Sin proveedor'),
      precioOperativo: operativo,
      precioDetalle: precios,
      estado: estadoItem(item),
      origen: 'EMC',
      multiProveedor: proveedoresUnicos.length > 1,
    };
  };

  const listaMateriales = useMemo(() => {
    const q = normalizar(busqueda);
    return items
      .map(materialVM)
      .filter((m) => {
        const texto = normalizar([
          m.nombre,
          m.categoria,
          m.subcategoria,
          m.marca,
          m.unidad,
          m.estado,
          m.origen,
          m.proveedorPrincipal,
          ...m.proveedoresUnicos,
        ].join(' '));
        return !q || texto.includes(q);
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [items, proveedorItems, proveedoresCatalogo, categorias, subcategorias, marcas, unidades, busqueda]);

  if (!esAdmin) {
    return (
      <main className="mm3-page">
        <section className="mm3-card center">
          <Lock size={36} />
          <h1>Acceso restringido</h1>
          <p>Material Master V3 es solo para administración.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mm3-page">
      <section className="mm3-card mm3-toolbar">
        <div className="mm3-head">
          <div>
            <span>Material Master V3 · EMC</span>
            <h1>Catálogo operativo EMC</h1>
            <p>Vista de verificación. Moneda real por registro: C$ y USD sin conversión automática.</p>
          </div>
          <button type="button" className="secondary" onClick={cargarEMC} disabled={cargando}>
            <RefreshCw size={16} /> {cargando ? 'Cargando...' : 'Recargar'}
          </button>
        </div>

        <div className="searchbox">
          <Search size={18} />
          <input
            placeholder="Buscar lona, vinil, acrílico, marca, categoría, unidad o proveedor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {errorCarga && <div className="error">Error EMC: {errorCarga}</div>}
        <div className="result">Registros visibles: <b>{listaMateriales.length}</b> · Fuente: <b>EMC</b> · Moneda: <b>según catálogo</b></div>
      </section>

      <section className="mm3-grid">
        <section className="mm3-card">
          <div className="section-title">Listado compacto EMC</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Unidad</th>
                  <th>Proveedor</th>
                  <th>Precio operativo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {listaMateriales.map((m) => (
                  <tr
                    key={m.id}
                    className={seleccionado?.id === m.id ? 'selected' : ''}
                    onClick={() => setSeleccionado(m)}
                  >
                    <td className="name">{m.nombre}</td>
                    <td>{m.categoria}<small>{m.subcategoria}</small></td>
                    <td>{m.marca}</td>
                    <td>{m.unidad}</td>
                    <td>{m.proveedorPrincipal}<small>{m.proveedoresUnicos.length || 0} proveedor(es)</small></td>
                    <td className="price">
                      {mostrarPrecioOperativo(m.precioOperativo)}
                      {m.precioOperativo.mixto && <small>Mixto C$ / USD</small>}
                    </td>
                    <td>{m.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!listaMateriales.length && <div className="empty">No hay materiales EMC para esa búsqueda.</div>}
          </div>
        </section>

        <aside className="mm3-card">
          <div className="section-title">Ficha</div>
          {seleccionado ? (
            <div className="detail">
              <label>Nombre</label><div>{seleccionado.nombre}</div>
              <label>Categoría</label><div>{seleccionado.categoria}</div>
              <label>Subcategoría</label><div>{seleccionado.subcategoria}</div>
              <label>Marca</label><div>{seleccionado.marca}</div>
              <label>Unidad</label><div>{seleccionado.unidad}</div>
              <label>Proveedor principal</label><div>{seleccionado.proveedorPrincipal}</div>
              <label>Proveedor(es)</label><div>{seleccionado.proveedoresUnicos.join(', ') || 'Sin proveedor asociado'}</div>
              <label>Precio operativo</label><div>{mostrarPrecioOperativo(seleccionado.precioOperativo)}</div>
              <label>Detalle de moneda</label>
              <div>
                C$: {seleccionado.precioOperativo.cantidadNio} precio(s) · USD: {seleccionado.precioOperativo.cantidadUsd} precio(s)
              </div>
              <label>Estado</label><div>{seleccionado.estado}</div>
              <label>Origen</label><div>{seleccionado.origen}</div>
            </div>
          ) : (
            <div className="empty">Seleccioná un material.</div>
          )}
        </aside>
      </section>

      <style>{`
        .mm3-page{min-height:100vh;background:#f4f6fb;padding:10px;display:grid;gap:10px;font-family:Inter,system-ui,sans-serif;color:#0f172a}
        .mm3-card{background:white;border-radius:16px;padding:12px;box-shadow:0 8px 20px rgba(15,23,42,.06)}
        .mm3-head{display:flex;justify-content:space-between;gap:12px;align-items:center}
        .mm3-head span{font-size:10px;font-weight:900;color:#b48722;letter-spacing:.06em;text-transform:uppercase}
        .mm3-head h1{margin:2px 0;font-size:20px;line-height:1.1}
        .mm3-head p{margin:0;color:#64748b;font-size:12px;font-weight:800}
        .secondary{border:0;border-radius:12px;padding:10px 14px;background:#111827;color:white;font-weight:900;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;white-space:nowrap}
        .searchbox{margin-top:10px;border:1px solid #dbe3ef;border-radius:12px;padding:0 10px;display:flex;align-items:center;gap:8px;background:#fff}
        .searchbox input{width:100%;border:0;outline:0;padding:11px 0;font-size:14px;background:white;font-weight:800}
        .result{margin-top:8px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:9px;font-size:13px;font-weight:900}
        .error{margin-top:8px;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:12px;padding:9px;font-size:13px;font-weight:900}
        .mm3-grid{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:10px;align-items:start}
        .section-title{font-size:15px;font-weight:950;margin-bottom:8px}
        .table-wrap{max-height:560px;overflow:auto;border:1px solid #e5e7eb;border-radius:12px}
        table{width:100%;border-collapse:collapse;font-size:12px;background:white}
        th{position:sticky;top:0;background:#f8fafc;border-bottom:1px solid #e5e7eb;text-align:left;padding:8px;font-size:11px;text-transform:uppercase;color:#475569;z-index:1}
        td{border-bottom:1px solid #eef2f7;padding:8px;vertical-align:top;font-weight:800;color:#334155}
        tr{cursor:pointer}
        tr:hover,.selected{background:#f8fafc}
        .name{font-weight:950;color:#0f172a;min-width:220px}
        .price{font-weight:950;color:#0f172a;white-space:nowrap}
        small{display:block;color:#64748b;font-size:10px;font-weight:800;margin-top:2px}
        .detail{display:grid;gap:5px}
        .detail label{font-size:10px;font-weight:950;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
        .detail div{border:1px solid #e5e7eb;border-radius:10px;padding:8px;background:#f8fafc;font-size:12px;font-weight:900;color:#111827;word-break:break-word}
        .empty{border:1px dashed #cbd5e1;border-radius:12px;padding:14px;text-align:center;color:#64748b;font-weight:900;background:#f8fafc;font-size:13px}
        .center{text-align:center;max-width:420px;margin:40px auto}
        @media(max-width:950px){.mm3-grid{grid-template-columns:1fr}.mm3-head{align-items:flex-start}.table-wrap{max-height:460px}}
      `}</style>
    </main>
  );
}
