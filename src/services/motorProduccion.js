const n = (v) => Number(v || 0);

const texto = (v) => String(v || "").toLowerCase();

const redondear = (v, dec = 2) => Number(n(v).toFixed(dec));

function tomarMedidas(origen = {}) {
  const ancho = n(origen.ancho || origen.medidas?.ancho || origen.cotizacion?.ancho || origen.item?.ancho);
  const alto = n(origen.alto || origen.medidas?.alto || origen.cotizacion?.alto || origen.item?.alto);
  const cantidad = n(origen.cantidad || origen.medidas?.cantidad || origen.item?.cantidad || 1) || 1;
  const area = n(origen.area || origen.medidas?.area) || ancho * alto * cantidad;
  const perimetro = n(origen.perimetro || origen.medidas?.perimetro) || (ancho + alto) * 2 * cantidad;

  return {
    ancho: redondear(ancho),
    alto: redondear(alto),
    cantidad,
    area: redondear(area),
    perimetro: redondear(perimetro),
  };
}

function proveedorPorCategoria(proveedores = [], categoria = "") {
  const cat = texto(categoria);

  const activos = Array.isArray(proveedores)
    ? proveedores.filter((p) => p.activo !== false)
    : [];

  const encontrados = activos
    .map((p) => {
      let puntos = 0;
      const base = `${p.categoria || ""} ${p.subcategorias || ""} ${p.nombre || ""}`.toLowerCase();

      if (base.includes(cat)) puntos += 30;
      if (p.preferido) puntos += 20;
      puntos += n(p.calidad) + n(p.cumplimiento) + n(p.tiempo) + n(p.precio);

      return { ...p, puntos };
    })
    .sort((a, b) => b.puntos - a.puntos);

  return encontrados[0] || null;
}

function tecnologiaDesdeSistema(sistema = {}, pedido = {}) {
  return (
    sistema.tecnologia ||
    sistema.tecnologiaNombre ||
    sistema.tecnologiaProduccion ||
    pedido.tecnologia ||
    pedido.cotizacion?.tecnologia ||
    "Tecnología pendiente de validación"
  );
}

function materialesDesdeSistema(sistema = {}, pedido = {}, medidas = {}) {
  const base = [];

  const despiece = sistema.despiece || sistema.materiales || pedido.despiece || pedido.cotizacion?.despiece || [];
  const estructura = sistema.estructura || pedido.estructura || pedido.cotizacion?.estructura || [];
  const obraCivil = sistema.obraCivil || sistema.obra_civil || pedido.obraCivil || pedido.cotizacion?.obra_civil || [];

  if (Array.isArray(despiece) && despiece.length > 0) {
    despiece.forEach((item, idx) => {
      base.push({
        id: item.id || `mat-${idx}`,
        nombre: item.nombre || item.material || "Material",
        tipo: item.tipo_componente || item.tipo || "Material",
        unidad: item.unidad || "unidad",
        cantidad: redondear(item.cantidad || item.total || 1),
        origen: "despiece",
      });
    });
  }

  if (Array.isArray(estructura) && estructura.length > 0) {
    estructura.forEach((item, idx) => {
      base.push({
        id: item.id || `est-${idx}`,
        nombre: item.nombre || item.material || "Estructura",
        tipo: "Estructura",
        unidad: item.unidad || "Metro lineal",
        cantidad: redondear(item.cantidad || 1),
        origen: "estructura",
      });
    });
  }

  if (Array.isArray(obraCivil) && obraCivil.length > 0) {
    obraCivil.forEach((item, idx) => {
      base.push({
        id: item.id || `obra-${idx}`,
        nombre: item.nombre || "Obra civil",
        tipo: "Obra civil",
        unidad: item.unidad || "unidad",
        cantidad: redondear(item.cantidad || 1),
        origen: "obra_civil",
      });
    });
  }

  if (base.length > 0) return base;

  const descripcion = texto(
    pedido.descripcion ||
      pedido.proyecto?.descripcion ||
      pedido.items?.[0]?.descripcion ||
      pedido.items?.[0]?.nombre ||
      sistema.nombre ||
      ""
  );

  if (descripcion.includes("lona") || descripcion.includes("fascia")) {
    return [
      { id: "lona", nombre: "Lona impresa", tipo: "Impresión", unidad: "m2", cantidad: medidas.area, origen: "inferido" },
      { id: "estructura", nombre: "Estructura metálica", tipo: "Estructura", unidad: "Metro lineal", cantidad: medidas.perimetro, origen: "inferido" },
      { id: "fijacion", nombre: "Remaches / tornillería", tipo: "Instalación", unidad: "Servicio", cantidad: 1, origen: "inferido" },
    ];
  }

  if (descripcion.includes("acm") || descripcion.includes("fachada")) {
    return [
      { id: "acm", nombre: "ACM", tipo: "Forro", unidad: "m2", cantidad: medidas.area, origen: "inferido" },
      { id: "estructura", nombre: "Estructura metálica", tipo: "Estructura", unidad: "Metro lineal", cantidad: medidas.perimetro, origen: "inferido" },
      { id: "sellado", nombre: "Sellador y fijación", tipo: "Instalación", unidad: "Servicio", cantidad: 1, origen: "inferido" },
    ];
  }

  if (descripcion.includes("luminos") || descripcion.includes("led")) {
    return [
      { id: "acrilico", nombre: "Acrílico lechoso", tipo: "Frente", unidad: "m2", cantidad: medidas.area, origen: "inferido" },
      { id: "led", nombre: "Módulos LED / fuente", tipo: "Iluminación", unidad: "Servicio", cantidad: 1, origen: "inferido" },
      { id: "estructura", nombre: "Cajuela / estructura", tipo: "Estructura", unidad: "Metro lineal", cantidad: medidas.perimetro, origen: "inferido" },
    ];
  }

  return [
    { id: "material-base", nombre: "Material base según receta", tipo: "Material", unidad: "m2", cantidad: medidas.area || 1, origen: "base" },
    { id: "instalacion", nombre: "Fijación e instalación", tipo: "Instalación", unidad: "Servicio", cantidad: 1, origen: "base" },
  ];
}

function procesosDesdeMateriales(materiales = [], pedido = {}) {
  const nombres = materiales.map((m) => texto(m.nombre + " " + m.tipo)).join(" ");

  const fabricacion = [
    "Revisar medidas aprobadas contra arte final.",
    "Preparar materiales según despiece técnico.",
    "Ejecutar corte, impresión, armado o estructura según tecnología definida.",
    "Control de calidad: medidas, acabados, limpieza y resistencia de unión.",
  ];

  if (nombres.includes("led")) fabricacion.push("Realizar prueba eléctrica antes de cerrar el rótulo.");
  if (nombres.includes("estructura")) fabricacion.push("Verificar escuadra, soldadura, refuerzos y pintura anticorrosiva.");
  if (nombres.includes("lona")) fabricacion.push("Revisar tensión, dobladillo, soldadura o refuerzo perimetral.");
  if (nombres.includes("acm")) fabricacion.push("Validar doblez, modulación, sentido de veta y sellado.");

  const instalacion = [
    "Confirmar acceso, altura, superficie y punto exacto de montaje.",
    "Presentar pieza en sitio, nivelar y marcar perforaciones.",
    "Fijar con anclaje compatible con la superficie.",
    "Limpiar área, tomar evidencia y reportar cierre de instalación.",
  ];

  if (pedido.logistica?.altura) instalacion.unshift(`Considerar altura indicada: ${pedido.logistica.altura}.`);
  if (pedido.logistica?.km) instalacion.unshift(`Considerar traslado aproximado: ${pedido.logistica.km} km.`);

  return { fabricacion, instalacion };
}

export function generarProduccionAutomatica({
  sistemaConstructivo = null,
  pedido = {},
  cotizacion = {},
  proveedores = [],
} = {}) {
  const sistema = sistemaConstructivo || pedido.sistemaConstructivo || pedido.cotizacion?.sistemaConstructivo || cotizacion.sistemaConstructivo || {};

  const itemBase = Array.isArray(pedido.items) && pedido.items.length > 0 ? pedido.items[0] : {};
  const medidas = tomarMedidas({
    ...cotizacion,
    ...pedido,
    item: itemBase,
    medidas: sistema.medidas || pedido.medidas || cotizacion.medidas,
  });

  const materiales = materialesDesdeSistema(sistema, pedido, medidas);
  const tecnologia = tecnologiaDesdeSistema(sistema, pedido);
  const procesos = procesosDesdeMateriales(materiales, pedido);

  const categoriaProveedor =
    materiales.find((m) => texto(m.tipo).includes("impresi"))?.tipo ||
    materiales.find((m) => texto(m.tipo).includes("estructura"))?.tipo ||
    materiales[0]?.tipo ||
    "Producción";

  const proveedorSugerido = proveedorPorCategoria(proveedores, categoriaProveedor);

  return {
    version: "CI-16D",
    generadoEn: new Date().toISOString(),
    origen: Object.keys(sistema || {}).length > 0 ? "sistema_constructivo" : "pedido_inferido",
    medidas,
    materiales,
    cantidades: materiales.map((m) => ({
      nombre: m.nombre,
      unidad: m.unidad,
      cantidad: m.cantidad,
    })),
    despiece: materiales,
    tecnologia,
    procesoFabricacion: procesos.fabricacion,
    procesoInstalacion: procesos.instalacion,
    proveedorSugerido: proveedorSugerido
      ? {
          id: proveedorSugerido.id,
          nombre: proveedorSugerido.nombre,
          categoria: proveedorSugerido.categoria,
          whatsapp: proveedorSugerido.whatsapp,
          tiempoEntrega: proveedorSugerido.tiempoEntrega,
          puntos: proveedorSugerido.puntos,
        }
      : null,
    visibleProduccion: true,
    ocultarFinanzas: true,
  };
}
