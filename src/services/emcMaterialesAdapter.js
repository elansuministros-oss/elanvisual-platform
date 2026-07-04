export async function cargarMaterialesEMC(supabase) {
  if (!supabase) {
    return { data: [], error: new Error('Supabase no configurado') };
  }

  const [itemsRes, proveedorItemsRes] = await Promise.all([
    supabase
  .from('elankav_catalogo_items')
  .select(`
    *,
    elankav_catalogo_categorias(nombre),
    elankav_catalogo_subcategorias(nombre),
    elankav_catalogo_marcas(nombre),
    elankav_catalogo_unidades(nombre)
  `)
  .limit(5000),
  ]);

  if (itemsRes.error) return { data: [], error: itemsRes.error };
  if (proveedorItemsRes.error) return { data: [], error: proveedorItemsRes.error };

  const proveedoresPorItem = new Map();

  (proveedorItemsRes.data || []).forEach((p) => {
    const itemId = p.item_id || p.catalogo_item_id || p.elankav_catalogo_item_id;
    if (!itemId) return;
    if (!proveedoresPorItem.has(itemId)) proveedoresPorItem.set(itemId, []);
    proveedoresPorItem.get(itemId).push(p);
  });

  const normalizados = (itemsRes.data || []).flatMap((item) => {
    const proveedores = proveedoresPorItem.get(item.id) || [null];

    return proveedores.map((prov, index) => {
      const precio =
        Number(prov?.precio_final) ||
        Number(prov?.precio_lista) ||
        Number(prov?.costo_unitario) ||
        Number(item?.precio_final) ||
        Number(item?.precio_lista) ||
        Number(item?.costo_unitario) ||
        Number(item?.costo) ||
        0;

      const nombre =
        item.nombre_catalogo ||
        item.nombre ||
        item.descripcion ||
        item.codigo_catalogo ||
        'Material EMC';

      return {
        ...item,
        id: prov?.id || item.id,
        emc_item_id: item.id,
        emc_proveedor_item_id: prov?.id || null,
        codigo: item.codigo_catalogo || item.codigo || item.sku || '',
        nombre,
        descripcion: item.descripcion || nombre,
        categoria:
  item.elankav_catalogo_categorias?.nombre ||
  item.categoria ||
  item.categoria_nombre ||
  'EMC',

subcategoria:
  item.elankav_catalogo_subcategorias?.nombre ||
  item.subcategoria ||
  item.subcategoria_nombre ||
  '',

marca:
  item.elankav_catalogo_marcas?.nombre ||
  item.marca ||
  item.marca_nombre ||
  '',

unidad:
  item.elankav_catalogo_unidades?.nombre ||
  item.unidad ||
  item.unidad_nombre ||
  item.unidad_compra ||
  'm2',

unidad_compra:
  item.elankav_catalogo_unidades?.nombre ||
  item.unidad_compra ||
  item.unidad ||
  item.unidad_nombre ||
  'm2',
        precio_base_usd: precio,
        precio_total_usd: precio,
        costo_unitario: precio,
        costo: precio,
        precio_lista: precio,
        precio_final: precio,
        moneda: prov?.elankav_catalogo_listas_precio?.moneda || item.moneda || 'NIO',
        proveedor_item: prov,
        origen: 'EMC',
        fuente: 'elankav_catalogo_*',
        key: `${item.id}-${prov?.id || index}`
      };
    });
  });

  return { data: normalizados, error: null };
}
