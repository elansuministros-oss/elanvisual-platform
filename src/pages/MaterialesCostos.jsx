import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Lock, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const normalizar = (v = '') =>
  String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const pick = (obj = {}, keys = [], fallback = '') => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const precioProveedor = (p = {}) =>
  Number(
    pick(p, [
      'precio_operativo',
      'precio_final',
      'precio_lista',
      'precio_unitario',
      'costo_unitario',
      'costo_compra',
      'costo',
      'precio',
    ], 0)
  );

const mediana = (values = []) => {
  const nums = values
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (!nums.length) return 0;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const estadoItem = (item = {}) => {
  if (item.activo === false) return 'Inactivo';
  return pick(item, ['estado', 'estatus'], 'Activo');
};

const sameId = (a, b) => String(a || '') === String(b || '');

export default function MaterialesCostos() {
  const { usuario } = useApp();
  const esAdmin = usuario?.rol === 'admin';

  const [items, setItems] = useState([]);
  const [proveedorItems, setProveedorItems] = useState([]);
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

    const [itemsRes, proveedoresRes, categoriasRes, subcategoriasRes, marcasRes, unidadesRes] = await Promise.all([
      supabase.from('elankav_catalogo_items').select('*').limit(5000),
      supabase.from('elankav_catalogo_proveedor_items').select('*').limit(5000),
      supabase.from('elankav_catalogo_categorias').select('*').limit(1000),
      supabase.from('elankav_catalogo_subcategorias').select('*').limit(1000),
      supabase.from('elankav_catalogo_marcas').select('*').limit(1000),
      supabase.from('elankav_catalogo_unidades').select('*').limit(1000),
    ]);

    const errores = [itemsRes, proveedoresRes, categoriasRes, subcategoriasRes, marcasRes, unidadesRes]
      .map((res) => res.error?.message)
      .filter(Boolean);

    if (errores.length) setErrorCarga(errores.join(' | '));

    setItems(toArray(itemsRes.data));
    setProveedorItems(toArray(proveedoresRes.data));
    setCategorias(toArray(categoriasRes.data));
    setSubcategorias(toArray(subcategoriasRes.data));
    setMarcas(toArray(marcasRes.data));
    setUnidades(toArray(unidadesRes.data));
    setCargando(false);
  };

  useEffect(() => {
    if (supabase) cargarEMC();
  }, []);

  const buscarCatalogo = (lista, id, nombrePlanoKeys = ['nombre']) => {
    const found = lista.find((x) => sameId(x.id, id) || sameId(x.codigo, id) || sameId(x.slug, id));
    return found ? pick(found, ['nombre', 'descripcion', 'titulo', 'codigo'], '') : pick({ value: id }, ['value'], '');
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

  const nombreItem = (item = {}) =>
    pick(item, ['nombre', 'nombre_catalogo', 'descripcion', 'producto', 'material', 'codigo_catalogo', 'codigo'], 'Sin nombre');

  const categoriaItem = (item = {}) =>
    pick(item, ['categoria_nombre', 'categoria'], '') ||
    buscarCatalogo(categorias, pick(item, ['categoria_id', 'id_categoria'], '')) ||
    'Sin categoría';

  const subcategoriaItem = (item = {}) =>
    pick(item, ['subcategoria_nombre', 'subcategoria'], '') ||
    buscarCatalogo(subcategorias, pick(item, ['subcategoria_id', 'id_subcategoria'], '')) ||
    'Sin subcategoría';

  const marcaItem = (item = {}) =>
    pick(item, ['marca_nombre', 'marca'], '') || buscarCatalogo(marcas, pick(item, ['marca_id', 'id_marca'], '')) || 'Sin marca';

  const unidadItem = (item = {}) =>
    pick(item, ['unidad_nombre', 'unidad', 'unidad_compra', 'unidad_medida'], '') ||
    buscarCatalogo(unidades, pick(item, ['unidad_id', 'id_unidad'], '')) ||
    'Sin unidad';

  const proveedorNombre = (p = {}) =>
    pick(p, ['proveedor_nombre', 'nombre_proveedor', 'proveedor', 'supplier_name', 'empresa', 'proveedor_id'], 'Sin proveedor');

  const materialVM = (item = {}) => {
    const proveedores = proveedoresPorItem(item);
    const precios = proveedores.map(precioProveedor).filter((n) => Number.isFinite(n) && n > 0);
    const precioBase = Number(pick(item, ['precio_operativo', 'precio_final', 'precio_lista', 'costo_unitario', 'costo'], 0));
    const precioOperativo = precios.length ? mediana(precios) : precioBase;
    const proveedoresUnicos = [...new Set(proveedores.map(proveedorNombre).filter(Boolean))];

    return {
      id: item.id || pick(item, ['codigo_catalogo', 'codigo', 'sku'], nombreItem(item)),
      raw: item,
      nombre: nombreItem(item),
      categoria: categoriaItem(item),
      subcategoria: subcategoriaItem(item),
      marca: marcaItem(item),
      unidad: unidadItem(item),
      proveedores,
      proveedoresUnicos,
      proveedorPrincipal: proveedoresUnicos[0] || pick(item, ['proveedor_nombre', 'proveedor'], 'Sin proveedor'),
      precioOperativo,
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
  }, [items, proveedorItems, categorias, subcategorias, marcas, unidades, busqueda]);

  if (!esAdmin) {
    return (
      <main className="mm3-page">
        <section className="mm3-card center">
          <Lock size={42} />
          <h1>Acceso restringido</h1>
          <p>Material Master V3 es solo para administración.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISUAL · CATÁLOGO EMC</span>
        <h1>Material Master V3</h1>
        <p>Fuente operativa única: Catálogo EMC AI-22. Sin materiales_master.</p>
      </section>

      <section className="mm3-card mm3-toolbar">
        <div className="title">
          <Search size={20} />
          <h2>Materiales EMC</h2>
        </div>
        <input
          placeholder="Buscar lona, vinil, acrílico, marca, categoría, unidad o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button type="button" className="secondary" onClick={cargarEMC} disabled={cargando}>
          <RefreshCw size={17} /> {cargando ? 'Cargando EMC...' : 'Recargar catálogo EMC'}
        </button>
        {errorCarga && <div className="error">Error EMC: {errorCarga}</div>}
        <div className="result">
          Registros EMC visibles: <b>{listaMateriales.length}</b> · Origen: <b>EMC</b>
        </div>
      </section>

      <section className="mm3-grid">
        <section className="mm3-card">
          <div className="title">
            <CheckCircle2 size={20} />
            <h2>Listado operativo EMC</h2>
          </div>

          <div className="list">
            {listaMateriales.map((m) => (
              <article
                className={`row ${seleccionado?.id === m.id ? 'active-row' : ''}`}
                key={m.id}
                onClick={() => setSeleccionado(m)}
              >
                <div>
                  <h3>{m.nombre}</h3>
                  <p><b>Categoría:</b> {m.categoria}</p>
                  <p><b>Subcategoría:</b> {m.subcategoria}</p>
                  <p><b>Marca:</b> {m.marca} · <b>Unidad:</b> {m.unidad}</p>
                  <p><b>Proveedor:</b> {m.proveedorPrincipal}</p>
                  <p><b>Proveedores:</b> {m.proveedoresUnicos.length || 0} {m.multiProveedor ? '· Multi-proveedor' : ''}</p>
                  <span>Precio operativo: {money(m.precioOperativo)}</span>
                </div>
                <strong>{m.origen}</strong>
              </article>
            ))}

            {!listaMateriales.length && (
              <div className="empty">No hay materiales EMC para esa búsqueda.</div>
            )}
          </div>
        </section>

        <section className="mm3-card">
          <div className="title">
            <CheckCircle2 size={20} />
            <h2>Ficha de verificación</h2>
          </div>

          {seleccionado ? (
            <div className="detail">
              <label>Nombre</label>
              <div>{seleccionado.nombre}</div>

              <label>Categoría</label>
              <div>{seleccionado.categoria}</div>

              <label>Subcategoría</label>
              <div>{seleccionado.subcategoria}</div>

              <label>Marca</label>
              <div>{seleccionado.marca}</div>

              <label>Unidad</label>
              <div>{seleccionado.unidad}</div>

              <label>Proveedor principal</label>
              <div>{seleccionado.proveedorPrincipal}</div>

              <label>Proveedor(es)</label>
              <div>{seleccionado.proveedoresUnicos.join(', ') || 'Sin proveedor asociado'}</div>

              <label>Precio operativo</label>
              <div>{money(seleccionado.precioOperativo)}</div>

              <label>Estado</label>
              <div>{seleccionado.estado}</div>

              <label>Origen</label>
              <div>{seleccionado.origen}</div>

              <label>Regla de precio</label>
              <div>
                {seleccionado.proveedoresUnicos.length >= 3
                  ? 'Mediana de precios entre proveedores EMC.'
                  : seleccionado.proveedoresUnicos.length > 1
                    ? 'Referencia operativa multi-proveedor EMC.'
                    : 'Referencia EMC disponible.'}
              </div>
            </div>
          ) : (
            <div className="empty">Seleccioná un material EMC para revisar sus campos.</div>
          )}
        </section>
      </section>

      <style>{`
        .mm3-page{min-height:100vh;background:#f4f6fb;padding:14px;display:grid;gap:14px}
        .mm3-hero,.mm3-card{background:white;border-radius:22px;padding:16px;box-shadow:0 12px 28px rgba(15,23,42,.08)}
        .mm3-hero span{font-size:11px;font-weight:900;color:#b48722;letter-spacing:.08em}
        .mm3-hero h1{margin:6px 0;font-size:30px}
        .mm3-hero p{margin:0;color:#64748b;font-weight:800}
        .mm3-toolbar{display:grid;gap:8px}
        .title{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .title h2{font-size:18px;margin:0}
        input{width:100%;border:1px solid #dbe3ef;border-radius:15px;padding:13px;font-size:15px;background:white}
        .secondary{width:100%;border:0;border-radius:16px;padding:13px;background:#111827;color:white;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}
        .secondary:disabled{opacity:.65;cursor:not-allowed}
        .result{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;font-weight:900}
        .error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:16px;padding:12px;font-weight:900}
        .mm3-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;align-items:start}
        .list{display:grid;gap:8px;max-height:650px;min-height:320px;overflow-y:auto;padding-right:4px;background:#fff}
        .row{border:1px solid #e5e7eb;border-radius:15px;padding:12px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;cursor:pointer;background:#fff}
        .row:hover,.active-row{border-color:#111827;background:#f8fafc}
        .row h3{margin:0 0 6px;font-size:15px}
        .row p{margin:3px 0;color:#64748b;font-size:12px;font-weight:800}
        .row span{display:inline-block;margin-top:6px;font-size:13px;font-weight:900;color:#111827}
        .row strong{font-size:11px;background:#dcfce7;color:#166534;border-radius:999px;padding:6px 8px;height:max-content}
        .detail{display:grid;gap:7px}
        .detail label{font-size:11px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
        .detail div{border:1px solid #e5e7eb;border-radius:14px;padding:11px;background:#f8fafc;font-weight:900;color:#111827}
        .empty{border:1px dashed #cbd5e1;border-radius:16px;padding:18px;text-align:center;color:#64748b;font-weight:900;background:#f8fafc}
        .center{text-align:center;max-width:420px;margin:40px auto}
        @media(max-width:850px){
          .mm3-grid{grid-template-columns:1fr}
          .mm3-page{padding:10px}
          .mm3-hero h1{font-size:25px}
          .mm3-card{padding:13px}
          .list{max-height:460px}
        }
      `}</style>
    </main>
  );
}
