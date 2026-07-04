import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Lock, PackagePlus, Search, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const tipos = ['Material', 'Articulo', 'Servicio'];
const categorias = [
  'VINILES',
  'LAMINADOS',
  'LONAS',
  'PVC',
  'ACRILICOS',
  'COROPLAS',
  'BACKLIT',
  'MICROPERFORADO',
  'DISPLAY',
  'ACCESORIOS',
  'SERVICIOS',
  'ESTRUCTURAS',
  'ILUMINACION',
];

const unidades = ['Rollo', 'Lamina', 'Unidad', 'Metro lineal', 'm2', 'Servicio'];

const inicialMaterial = {
  tipo: 'Material',
  categoria: 'VINILES',
  nombre: '',
  marca: '',
  proveedor: '',
  unidad_compra: 'Rollo',
  ancho: '',
  largo: '',
  costo_compra: '',
  iva: 15,
  desperdicio_recargo: 10,
  activo: true,
  notas: '',
};

const inicialTinta = {
  nombre: 'Ecosolvente',
  costo_m2: 1.5,
  activo: true,
  notas: '',
};

const inicialCombinacion = {
  categoria: 'VINILES',
  nombre: '',
  estado: 'borrador',
  activo: true,
  notas: '',
};

const monedaEMC = (item = {}) =>
  String(
    item.moneda ||
    item.currency ||
    item.divisa ||
    item.elankav_catalogo_listas_precio?.moneda ||
    item.elankav_catalogo_items?.moneda ||
    ''
  )
    .trim()
    .toUpperCase();

const money = (v, moneda = 'USD') =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: moneda === 'NIO' || moneda === 'C$' || moneda === 'CORDOBA' || moneda === 'CORDOBAS' ? 'NIO' : 'USD',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const num = (v) => Number(v || 0);

const normalizar = (v = "") =>
  String(v || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const valorTexto = (...valores) =>
  valores.find((v) => v !== null && v !== undefined && String(v).trim() !== "") || "";

const valorNumero = (...valores) => {
  const encontrado = valores.find((v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  });

  return Number(encontrado || 0);
};

const nombreEMC = (item = {}) =>
  valorTexto(
    item.nombre_catalogo,
    item.nombre,
    item.descripcion,
    item.codigo_catalogo,
    item.item_nombre,
    item.catalogo_nombre,
    item.elankav_catalogo_items?.nombre_catalogo,
    item.elankav_catalogo_items?.nombre,
    item.elankav_catalogo_items?.descripcion,
    item.elankav_catalogo_items?.codigo_catalogo
  );

const precioEMC = (item = {}) =>
  valorNumero(
    item.precio_final,
    item.precio_lista,
    item.costo_unitario,
    item.costo,
    item.precio,
    item.precio_unitario,
    item.elankav_catalogo_items?.precio_final,
    item.elankav_catalogo_items?.precio_lista,
    item.elankav_catalogo_items?.costo_unitario,
    item.elankav_catalogo_items?.costo
  );

const proveedorEMC = (item = {}) =>
  valorTexto(
    item.proveedor_nombre,
    item.nombre_proveedor,
    item.proveedor,
    item.proveedores?.nombre_comercial,
    item.proveedores?.nombre,
    item.elankav_proveedores?.nombre_comercial,
    item.elankav_proveedores?.nombre
  );

const nombreRelacion = (valor) => {
  if (!valor) return "";
  if (typeof valor === "string") return valor;
  return valor.nombre || valor.nombre_catalogo || valor.descripcion || valor.titulo || "";
};

const normalizarCategoria = (valor = "") => {
  const n = normalizar(valor);
  const encontrada = categorias.find((cat) => normalizar(cat) === n || n.includes(normalizar(cat)));
  return encontrada || String(valor || "VINILES").toUpperCase();
};

const normalizarUnidad = (valor = "") => {
  const n = normalizar(valor);
  const encontrada = unidades.find((u) => normalizar(u) === n || n.includes(normalizar(u)));
  return encontrada || valor || "Unidad";
};

const extraerMedida = (item = {}, campo) => {
  const directos = {
    ancho: [item.ancho, item.ancho_m, item.ancho_cm, item.medida_ancho],
    largo: [item.largo, item.largo_m, item.largo_cm, item.medida_largo],
  };

  const directo = valorNumero(...(directos[campo] || []));
  if (directo) return directo;

  const medidas = item.medidas || item.dimension || item.dimensiones || item.elankav_catalogo_items?.medidas || "";
  if (!medidas) return "";

  const texto = String(medidas).replace(",", ".");
  const match = texto.match(/(\d+(\.\d+)?)\s*[x×]\s*(\d+(\.\d+)?)/i);
  if (!match) return "";

  return campo === "ancho" ? Number(match[1]) : Number(match[3]);
};

const adaptarItemEMCAMaterialMaster = (item = {}, index = 0) => {
  const itemBase = item.elankav_catalogo_items || item.item || {};
  const categoria = nombreRelacion(item.elankav_catalogo_categorias) || item.categoria_nombre || item.categoria || itemBase.categoria || itemBase.categoria_nombre;
  const subcategoria = nombreRelacion(item.elankav_catalogo_subcategorias) || item.subcategoria_nombre || item.subcategoria || itemBase.subcategoria || itemBase.subcategoria_nombre;
  const marca = nombreRelacion(item.elankav_catalogo_marcas) || item.marca_nombre || item.marca || itemBase.marca || itemBase.marca_nombre;
  const unidad = nombreRelacion(item.elankav_catalogo_unidades) || item.unidad_nombre || item.unidad || item.unidad_compra || itemBase.unidad || itemBase.unidad_nombre;

  const costoCompra = precioEMC(item);
  const iva = item.iva ?? item.porcentaje_iva ?? item.impuesto ?? itemBase.iva ?? itemBase.porcentaje_iva ?? 15;
  const ancho = extraerMedida(item, "ancho") || extraerMedida(itemBase, "ancho");
  const largo = extraerMedida(item, "largo") || extraerMedida(itemBase, "largo");

  return {
    id: item.id || item.proveedor_item_id || item.item_id || item.catalogo_item_id || `emc-${index}`,
    emc_item_id: item.item_id || item.catalogo_item_id || itemBase.id || item.id,
    emc_proveedor_item_id: item.id || item.proveedor_item_id,
    tipo: item.tipo || itemBase.tipo || "Material",
    categoria: normalizarCategoria(categoria || subcategoria),
    subcategoria: subcategoria || "",
    tipo_principal: itemBase.tipo_principal || item.tipo_principal || "",
configurable: itemBase.configurable ?? item.configurable ?? false,
nivel_producto: itemBase.nivel_producto || item.nivel_producto || "",
estado_calidad: itemBase.estado_calidad || item.estado_calidad || "PENDIENTE_REVISION",
    nombre: nombreEMC(item),
    marca: marca || "",
    proveedor: proveedorEMC(item),
    unidad_compra: normalizarUnidad(unidad),
    ancho: ancho || "",
    largo: largo || "",
    costo_compra: costoCompra,
    iva: Number(iva || 0),
    desperdicio_recargo: Number(item.desperdicio_recargo || item.recargo || itemBase.desperdicio_recargo || 10),
    costo_real: costoCompra,
    activo: item.activo ?? itemBase.activo ?? true,
    notas: valorTexto(item.notas, item.observaciones, itemBase.notas, itemBase.observaciones),
   moneda: monedaEMC({ ...item, elankav_catalogo_items: itemBase }) || 'NIO',
    _origen: "EMC",
  };
};

const proveedoresDelMaterial = (material, materiales = [], emcItems = []) => {
  const nombreBase = normalizar(material.nombre);

  const relacionados = materiales.filter((m) =>
    normalizar(m.nombre) === nombreBase && m.proveedor
  );

  const emc = emcItems
    .filter((item) => {
      const n = normalizar(nombreEMC(item));
      return n && nombreBase && (n === nombreBase || n.includes(nombreBase) || nombreBase.includes(n));
    })
    .map((item, index) => adaptarItemEMCAMaterialMaster(item, index))
    .filter((item) => item.proveedor);

  return [...relacionados, ...emc].filter((x) => x.proveedor);
};

const costoOperativo = (items = []) => {
  const precios = items
    .map((m) => Number(m.costo_real || m.costo_compra || 0))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);

  if (!precios.length) return 0;

  const mid = Math.floor(precios.length / 2);
  return precios.length % 2 ? precios[mid] : (precios[mid - 1] + precios[mid]) / 2;
};

const contarProveedoresUnicos = (items = []) =>
  new Set(items.map((x) => String(x.proveedor || "").trim()).filter(Boolean)).size;

const proveedorPrincipal = (material, proveedores = []) =>
  material.proveedor || proveedores.find((x) => x.proveedor)?.proveedor || "Sin proveedor";

function calcularCostoReal(form) {
  const costo = num(form.costo_compra);
  const iva = num(form.iva);
  const extra = num(form.desperdicio_recargo);
  const ancho = num(form.ancho);
  const largo = num(form.largo);

  const costoIva = costo * (1 + iva / 100);
  const costoFinal = costoIva * (1 + extra / 100);

  if (['Rollo', 'Lamina'].includes(form.unidad_compra) && ancho > 0 && largo > 0) {
    return costoFinal / (ancho * largo);
  }

  return costoFinal;
}

export default function MaterialesCostos() {
  const { usuario } = useApp();
  const esAdmin = usuario?.rol === 'admin';

  const [tab, setTab] = useState('materiales');
  const [materiales, setMateriales] = useState([]);
  const [tintas, setTintas] = useState([]);
  const [combinaciones, setCombinaciones] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [emcItems, setEmcItems] = useState([]);

  const [materialForm, setMaterialForm] = useState(inicialMaterial);
  const [tintaForm, setTintaForm] = useState(inicialTinta);
  const [comboForm, setComboForm] = useState(inicialCombinacion);

  const [editMaterial, setEditMaterial] = useState(null);
  const [editTinta, setEditTinta] = useState(null);
  const [editCombo, setEditCombo] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaMaterialCombo, setBusquedaMaterialCombo] = useState('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidadCombo, setCantidadCombo] = useState(1);

  const costoPreview = useMemo(() => calcularCostoReal(materialForm), [materialForm]);

  const cargarTodo = async () => {
  const [items, proveedorItems, cats, subs, marcas, unids, tin, com, det] = await Promise.all([
    supabase.from('elankav_catalogo_items').select('*').limit(2000),
    supabase
      .from('elankav_catalogo_proveedor_items')
      .select('*, elankav_catalogo_listas_precio(moneda)')
      .limit(2000),
    supabase.from('elankav_catalogo_categorias').select('*'),
    supabase.from('elankav_catalogo_subcategorias').select('*'),
    supabase.from('elankav_catalogo_marcas').select('*'),
    supabase.from('elankav_catalogo_unidades').select('*'),
    supabase.from('tintas_master').select('*').order('nombre'),
    supabase.from('combinaciones_master').select('*').order('categoria'),
    supabase.from('combinaciones_detalle').select('*'),
  ]);

  const itemMap = new Map((items.data || []).map((x) => [x.id, x]));
  const catMap = new Map((cats.data || []).map((x) => [x.id, x]));
  const subMap = new Map((subs.data || []).map((x) => [x.id, x]));
  const marcaMap = new Map((marcas.data || []).map((x) => [x.id, x]));
  const unidadMap = new Map((unids.data || []).map((x) => [x.id, x]));

  const emcData = (proveedorItems.data || []).map((pi) => {
    const item = itemMap.get(pi.item_id || pi.catalogo_item_id || pi.catalogo_id) || {};

    return {
      ...pi,
      elankav_catalogo_items: {
        ...item,
        elankav_catalogo_categorias: catMap.get(item.categoria_id) || null,
        elankav_catalogo_subcategorias: subMap.get(item.subcategoria_id) || null,
        elankav_catalogo_marcas: marcaMap.get(item.marca_id) || null,
        elankav_catalogo_unidades: unidadMap.get(item.unidad_id) || null,
      },
    };
  });

  setEmcItems(emcData);
  setMateriales(emcData.map((item, index) => adaptarItemEMCAMaterialMaster(item, index)));

  if (!tin.error) setTintas(tin.data || []);
  if (!com.error) setCombinaciones(com.data || []);
  if (!det.error) setDetalles(det.data || []);
};

  useEffect(() => {
    if (supabase) cargarTodo();
  }, []);

  const listaMateriales = useMemo(() => {
    const q = normalizar(busqueda);

    return materiales.filter((m) => {
      const relacionados = proveedoresDelMaterial(m, materiales, emcItems);
      const texto = normalizar([
        m.nombre,
        m.categoria,
        m.subcategoria,
        m.marca,
        m.proveedor,
        m.unidad_compra,
        m.notas,
        ...relacionados.map((x) => x.proveedor),
      ].join(" "));

      return !q || texto.includes(q);
    });
  }, [materiales, emcItems, busqueda]);

  const materialesParaCombo = useMemo(() => {
    const q = normalizar(busquedaMaterialCombo);
    return materiales
      .filter((m) => m.activo)
      .filter((m) => normalizar(`${m.nombre} ${m.categoria} ${m.marca}`).includes(q))
      .slice(0, 10);
  }, [materiales, busquedaMaterialCombo]);

  const guardarMaterial = async (e) => {
    e.preventDefault();

    const payloadProveedorItem = {
      precio_lista: num(materialForm.costo_compra),
      costo_unitario: num(materialForm.costo_compra),
      iva: num(materialForm.iva),
      activo: materialForm.activo,
      notas: materialForm.notas,
    };

    const payloadItem = {
      nombre: materialForm.nombre,
      descripcion: materialForm.nombre,
      activo: materialForm.activo,
      notas: materialForm.notas,
    };

    let res;

    if (editMaterial) {
      const actual = materiales.find((m) => m.id === editMaterial);

      if (actual?.emc_item_id) {
        await supabase.from('elankav_catalogo_items').update(payloadItem).eq('id', actual.emc_item_id);
      }

      res = await supabase
        .from('elankav_catalogo_proveedor_items')
        .update(payloadProveedorItem)
        .eq('id', actual?.emc_proveedor_item_id || editMaterial);
    } else {
      res = await supabase.from('elankav_catalogo_items').insert(payloadItem);
    }

    if (res.error) return alert('No se pudo guardar material.');
    setMaterialForm(inicialMaterial);
    setEditMaterial(null);
    cargarTodo();
  };

  const guardarTinta = async (e) => {
    e.preventDefault();

    const payload = {
      ...tintaForm,
      costo_m2: num(tintaForm.costo_m2),
    };

    const res = editTinta
      ? await supabase.from('tintas_master').update(payload).eq('id', editTinta)
      : await supabase.from('tintas_master').insert(payload);

    if (res.error) return alert('No se pudo guardar tinta.');
    setTintaForm(inicialTinta);
    setEditTinta(null);
    cargarTodo();
  };

  const guardarCombo = async (e) => {
    e.preventDefault();

    const payload = comboForm;

    const res = editCombo
      ? await supabase.from('combinaciones_master').update(payload).eq('id', editCombo)
      : await supabase.from('combinaciones_master').insert(payload).select().single();

    if (res.error) return alert('No se pudo guardar combinacion.');

    if (!editCombo && res.data?.id) setEditCombo(res.data.id);

    setComboForm(inicialCombinacion);
    cargarTodo();
  };

  const agregarDetalle = async () => {
    if (!editCombo) return alert('Primero guarda o edita una combinacion.');
    if (!materialSeleccionado) return alert('Selecciona un material.');

    const { error } = await supabase.from('combinaciones_detalle').insert({
      combinacion_id: editCombo,
      material_id: materialSeleccionado.id,
      cantidad: num(cantidadCombo) || 1,
    });

    if (error) return alert('No se pudo agregar material.');
    setMaterialSeleccionado(null);
    setBusquedaMaterialCombo('');
    setCantidadCombo(1);
    cargarTodo();
  };

  const eliminar = async (tabla, id) => {
    if (!confirm('Eliminar registro?')) return;

    const actual = tabla === 'materiales_master'
      ? materiales.find((m) => m.id === id)
      : null;

    const tablaFinal = tabla === 'materiales_master'
      ? 'elankav_catalogo_proveedor_items'
      : tabla;

    const idFinal = tabla === 'materiales_master'
      ? actual?.emc_proveedor_item_id || id
      : id;

    const { error } = await supabase.from(tablaFinal).delete().eq('id', idFinal);
    if (error) return alert('No se pudo eliminar.');
    cargarTodo();
  };

  const editarMaterial = (m) => {
    setMaterialForm({ ...inicialMaterial, ...m });
    setEditMaterial(m.id);
    setTab('materiales');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editarTinta = (t) => {
    setTintaForm({ ...inicialTinta, ...t });
    setEditTinta(t.id);
    setTab('tintas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editarComboFn = (c) => {
    setComboForm({ ...inicialCombinacion, ...c });
    setEditCombo(c.id);
    setTab('combinaciones');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const detallesCombo = detalles.filter((d) => d.combinacion_id === editCombo);

  if (!esAdmin) {
    return (
      <main className="mm3-page">
        <section className="mm3-card center">
          <Lock size={42} />
          <h1>Acceso restringido</h1>
          <p>Material Master V3 es solo para administracion.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISUAL</span>
        <h1>Material Master V3</h1>
        <p>Materiales, tintas y combinaciones aprobadas.</p>
      </section>

      <nav className="mm3-tabs">
        <button onClick={() => setTab('materiales')} className={tab === 'materiales' ? 'active' : ''}>Materiales</button>
        <button onClick={() => setTab('tintas')} className={tab === 'tintas' ? 'active' : ''}>Tintas</button>
        <button onClick={() => setTab('combinaciones')} className={tab === 'combinaciones' ? 'active' : ''}>Combinaciones</button>
      </nav>

      {tab === 'materiales' && (
        <section className="mm3-grid">
          <form className="mm3-card" onSubmit={guardarMaterial}>
            <div className="title"><PackagePlus size={20} /><h2>{editMaterial ? 'Editar material' : 'Nuevo material'}</h2></div>

            <input placeholder="Nombre" value={materialForm.nombre} onChange={(e) => setMaterialForm({ ...materialForm, nombre: e.target.value })} required />

            <div className="two">
              <select value={materialForm.tipo} onChange={(e) => setMaterialForm({ ...materialForm, tipo: e.target.value })}>
                {tipos.map((x) => <option key={x}>{x}</option>)}
              </select>
              <select value={materialForm.categoria} onChange={(e) => setMaterialForm({ ...materialForm, categoria: e.target.value })}>
                {categorias.map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>

            <div className="two">
              <input placeholder="Marca" value={materialForm.marca || ''} onChange={(e) => setMaterialForm({ ...materialForm, marca: e.target.value })} />
              <input placeholder="Proveedor" value={materialForm.proveedor || ''} onChange={(e) => setMaterialForm({ ...materialForm, proveedor: e.target.value })} />
            </div>

            <select value={materialForm.unidad_compra} onChange={(e) => setMaterialForm({ ...materialForm, unidad_compra: e.target.value })}>
              {unidades.map((x) => <option key={x}>{x}</option>)}
            </select>

            <div className="two">
              <input type="number" step="0.01" placeholder="Ancho" value={materialForm.ancho} onChange={(e) => setMaterialForm({ ...materialForm, ancho: e.target.value })} />
              <input type="number" step="0.01" placeholder="Largo" value={materialForm.largo} onChange={(e) => setMaterialForm({ ...materialForm, largo: e.target.value })} />
            </div>

            <div className="two">
              <input type="number" step="0.01" placeholder="Costo compra" value={materialForm.costo_compra} onChange={(e) => setMaterialForm({ ...materialForm, costo_compra: e.target.value })} />
              <input type="number" step="0.01" placeholder="IVA %" value={materialForm.iva} onChange={(e) => setMaterialForm({ ...materialForm, iva: e.target.value })} />
            </div>

            <input
              type="number"
              step="0.01"
              placeholder={['Rollo', 'Lamina'].includes(materialForm.unidad_compra) ? 'Desperdicio %' : 'Recargo %'}
              value={materialForm.desperdicio_recargo}
              onChange={(e) => setMaterialForm({ ...materialForm, desperdicio_recargo: e.target.value })}
            />

            <textarea placeholder="Notas" value={materialForm.notas || ''} onChange={(e) => setMaterialForm({ ...materialForm, notas: e.target.value })} />

            <div className="result">Costo real: <b>{money(costoPreview)}</b></div>

            <button className="primary" type="submit"><CheckCircle2 size={18} /> Guardar</button>
          </form>

          <section className="mm3-card">
            <div className="title"><Search size={20} /><h2>Materiales</h2></div>
            <input placeholder="Buscar por nombre, categoria, marca, proveedor, unidad o notas..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />

            <div className="list">
              {listaMateriales.map((m) => {
                const proveedores = proveedoresDelMaterial(m, materiales, emcItems);
                const totalProveedores = contarProveedoresUnicos(proveedores) || (m.proveedor ? 1 : 0);
                const operativo = costoOperativo(proveedores.length ? proveedores : [m]);

                return (
                  <article className="row" key={m.id}>
                    <div>
                      <h3>{m.nombre}</h3>
                      <p><b>Categoria:</b> {m.categoria || 'Sin categoria'} · <b>Unidad:</b> {m.unidad_compra || 'Sin unidad'}</p>
                      <p><b>Marca:</b> {m.marca || 'Sin marca'}</p>
                      <p><b>Proveedor principal:</b> {proveedorPrincipal(m, proveedores)}</p>
                      <p><b>Proveedores asociados:</b> {totalProveedores}</p>
                      <span>Costo operativo: {money(operativo, m.moneda)}</span>
                    </div>
                    <div className="actions">
                      <button className="btn-edit" onClick={() => editarMaterial(m)}>Editar</button>
                      <button className="btn-delete" onClick={() => eliminar('materiales_master', m.id)}>Eliminar</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      )}

      {tab === 'tintas' && (
        <section className="mm3-grid">
          <form className="mm3-card" onSubmit={guardarTinta}>
            <div className="title"><PackagePlus size={20} /><h2>{editTinta ? 'Editar tinta' : 'Nueva tinta'}</h2></div>
            <input placeholder="Nombre" value={tintaForm.nombre} onChange={(e) => setTintaForm({ ...tintaForm, nombre: e.target.value })} required />
            <input type="number" step="0.01" placeholder="Costo m2" value={tintaForm.costo_m2} onChange={(e) => setTintaForm({ ...tintaForm, costo_m2: e.target.value })} />
            <textarea placeholder="Notas" value={tintaForm.notas || ''} onChange={(e) => setTintaForm({ ...tintaForm, notas: e.target.value })} />
            <button className="primary" type="submit"><CheckCircle2 size={18} /> Guardar</button>
          </form>

          <section className="mm3-card">
            <div className="title"><Search size={20} /><h2>Tintas</h2></div>
            <div className="list">
              {tintas.map((t) => (
                <article className="row" key={t.id}>
                  <div>
                    <h3>{t.nombre}</h3>
                    <p>Costo m2</p>
                    <span>{money(t.costo_m2)}</span>
                  </div>
                  <div className="actions">
                    <button onClick={() => editarTinta(t)}><Edit3 size={15} /></button>
                    <button onClick={() => eliminar('tintas_master', t.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      {tab === 'combinaciones' && (
        <section className="mm3-grid">
          <form className="mm3-card" onSubmit={guardarCombo}>
            <div className="title"><PackagePlus size={20} /><h2>{editCombo ? 'Editar combinacion' : 'Nueva combinacion'}</h2></div>

            <select value={comboForm.categoria} onChange={(e) => setComboForm({ ...comboForm, categoria: e.target.value })}>
              {categorias.map((x) => <option key={x}>{x}</option>)}
            </select>

            <input placeholder="Nombre combinacion" value={comboForm.nombre} onChange={(e) => setComboForm({ ...comboForm, nombre: e.target.value })} required />

            <select value={comboForm.estado} onChange={(e) => setComboForm({ ...comboForm, estado: e.target.value })}>
              <option value="borrador">Borrador</option>
              <option value="aprobado">Aprobado</option>
              <option value="inactivo">Inactivo</option>
            </select>

            <textarea placeholder="Notas" value={comboForm.notas || ''} onChange={(e) => setComboForm({ ...comboForm, notas: e.target.value })} />

            <button className="primary" type="submit"><CheckCircle2 size={18} /> Guardar combinacion</button>

            {editCombo && (
              <div className="combo-box">
                <h3>Agregar material</h3>
                <input placeholder="Buscar material..." value={busquedaMaterialCombo} onChange={(e) => setBusquedaMaterialCombo(e.target.value)} />

                <div className="mini-scroll">
                  {materialesParaCombo.map((m) => (
                    <button type="button" key={m.id} onClick={() => setMaterialSeleccionado(m)}>
                      {m.nombre}
                    </button>
                  ))}
                </div>

                <div className="selected">
                  {materialSeleccionado ? materialSeleccionado.nombre : 'Sin material seleccionado'}
                </div>

                <input type="number" step="0.01" value={cantidadCombo} onChange={(e) => setCantidadCombo(e.target.value)} />

                <button type="button" className="secondary" onClick={agregarDetalle}>Agregar a combinacion</button>

                <div className="added">
                  {detallesCombo.map((d) => {
                    const mat = materiales.find((m) => m.id === d.material_id);
                    return (
                      <p key={d.id}>
                        {mat?.nombre || 'Material'} x {d.cantidad}
                        <button type="button" onClick={() => eliminar('combinaciones_detalle', d.id)}>Eliminar</button>
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </form>

          <section className="mm3-card">
            <div className="title"><Search size={20} /><h2>Combinaciones</h2></div>
            <div className="list">
              {combinaciones.map((c) => (
                <article className="row" key={c.id}>
                  <div>
                    <h3>{c.nombre}</h3>
                    <p>{c.categoria} · {c.estado}</p>
                  </div>
                  <div className="actions">
                    <button onClick={() => editarComboFn(c)}><Edit3 size={15} /></button>
                    <button onClick={() => eliminar('combinaciones_master', c.id)}><Trash2 size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      )}

      <style>{`
        .mm3-page{min-height:100vh;background:#f4f6fb;padding:14px;display:grid;gap:14px}
        .mm3-hero,.mm3-card{background:white;border-radius:22px;padding:16px;box-shadow:0 12px 28px rgba(15,23,42,.08)}
        .mm3-hero span{font-size:11px;font-weight:900;color:#b48722}
        .mm3-hero h1{margin:6px 0;font-size:28px}
        .mm3-hero p{margin:0;color:#64748b;font-weight:700}
        .mm3-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .mm3-tabs button{border:0;border-radius:16px;padding:13px;background:white;color:#111827;font-weight:900}
        .mm3-tabs .active{background:#111827;color:white}
        .mm3-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
        .title{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .title h2{font-size:18px;margin:0}
        input,select,textarea{width:100%;border:1px solid #dbe3ef;border-radius:15px;padding:12px;margin-bottom:10px;font-size:15px;background:white}
        textarea{min-height:72px;resize:vertical}
        .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .primary,.secondary{width:100%;border:0;border-radius:16px;padding:13px;background:#111827;color:white;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px}
        .secondary{background:#334155;margin-top:8px}
        .result{background:#f8fafc;border:1px solid #e5e7eb;border-radius:16px;padding:12px;margin-bottom:10px;font-weight:900}
        .list{display:grid;gap:8px;max-height:560px;min-height:280px;overflow-y:auto;padding-right:4px;background:#fff}
        .row{border:1px solid #e5e7eb;border-radius:15px;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}
        .row h3{margin:0;font-size:14px}
        .row p{margin:3px 0;color:#64748b;font-size:12px;font-weight:800}
        .row span{font-size:12px;font-weight:900}
        .actions{display:flex;gap:8px}
        .actions button{min-width:90px;height:38px;border:0;border-radius:12px;font-size:12px;font-weight:900;color:#fff;cursor:pointer}.btn-edit{background:#0f766e}.btn-delete{background:#b91c1c}
        .combo-box{margin-top:14px;border:1px solid #e5e7eb;border-radius:18px;padding:12px;background:#f8fafc}
        .combo-box h3{margin:0 0 10px}
        .mini-scroll{max-height:310px;overflow-y:auto;display:grid;gap:6px;margin-bottom:8px}
        .mini-scroll button{text-align:left;border:1px solid #e5e7eb;background:white;border-radius:12px;padding:10px;font-weight:800}
        .selected{background:white;border:1px dashed #cbd5e1;border-radius:12px;padding:10px;margin-bottom:8px;font-weight:900}
        .added p{display:flex;justify-content:space-between;gap:8px;background:white;border-radius:12px;padding:8px;margin:6px 0;font-size:12px;font-weight:900}
        .added button{border:0;background:#991b1b;color:white;border-radius:10px;padding:5px 8px;font-size:11px}
        .center{text-align:center;max-width:420px;margin:40px auto}
        @media(max-width:850px){
          .mm3-grid,.two{grid-template-columns:1fr}
          .mm3-page{padding:10px}
          .mm3-hero h1{font-size:24px}
          .mm3-card{padding:13px}
          .list{max-height:420px}
        }
      `}</style>
    </main>
  );
}