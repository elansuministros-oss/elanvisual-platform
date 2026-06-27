import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  FileText,
  ImagePlus,
  Paperclip,
  Printer,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const POLITICA = {
  minimo: 2,
  recomendado: 2.5,
  objetivo: 3,
  iva: 0.15,
  descuentos: [0, 5, 10],
};

const money = (v) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(Number(v || 0));

const n = (v) => Number(v || 0);

const limpiar = (v) =>
  String(v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const costoMaterial = (m) =>
  n(
    m?.costo_real ??
      m?.costo ??
      m?.precio ??
      m?.precio_unitario ??
      m?.costo_unitario ??
      m?.costo_m2 ??
      m?.precio_total_usd ??
      m?.precio_base_usd ??
      m?.precio_venta_1x ??
      0
  );

function textoMaterial(m) {
  return limpiar(
    `${m?.nombre || ''} ${m?.categoria || ''} ${m?.descripcion || ''} ${m?.unidad || ''}`
  );
}

function buscar(lista, palabras) {
  const keys = palabras.map(limpiar);
  return (lista || []).find((m) => keys.some((k) => textoMaterial(m).includes(k)));
}

function inferir(form) {
  const t = limpiar(form.descripcion);

  return {
    impresion: /impres|lona|vinil|banner|micro|uv|solvente|ecosolvente/.test(t),
    lona: /lona|banner|traslucida|traslucida|13oz|18oz/.test(t),
    vinil: /vinil|microperforado|adhesivo/.test(t),
    pvc: /pvc/.test(t),
    acrilico: /acril/.test(t),
    acm: /acm|alucobond|fachada|fascia/.test(t),
    iluminado: /led|luz|luminos|iluminad|cajillo|cajuela/.test(t),
    estructura: /tubo|poste|estructura|marco|arriba|abajo|metal|hierro/.test(t),
    instalacion: /instal|montaje|colocar|fijar/.test(t),
    dobleCara: /doble cara|dos caras/.test(t),
  };
}

function crearLinea({ nombre, tipo, unidad, cantidad, material }) {
  return {
    id: `linea-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nombre: material?.nombre || nombre,
    tipo,
    unidad: material?.unidad || unidad,
    cantidad: Math.max(Number(cantidad || 1), 0),
    costoUnitario: costoMaterial(material),
    origen: material ? 'Material Master' : 'Regla interna',
  };
}

function armarLineasAutomaticas(form, materiales, tintas) {
  const ancho = n(form.ancho);
  const alto = n(form.alto);
  const cantidad = n(form.cantidad || 1);
  const area = Math.max(ancho * alto * cantidad, 0);
  const perimetro = Math.max((ancho + alto) * 2 * cantidad, 0);
  const ia = inferir(form);
  const lineas = [];

  const lona = buscar(materiales, ['lona banner', 'lona', 'banner']);
  const vinil = buscar(materiales, ['vinil', 'adhesivo', 'microperforado']);
  const pvc = buscar(materiales, ['pvc']);
  const acrilico = buscar(materiales, ['acrilico', 'acrilico']);
  const acm = buscar(materiales, ['acm', 'alucobond']);
  const tubo = buscar(materiales, ['tubo', 'metal', 'poste']);
  const led = buscar(materiales, ['led']);
  const fuente = buscar(materiales, ['fuente']);
  const instalacion = buscar(materiales, ['instalacion', 'instalacion', 'mano de obra', 'montaje']);
  const tornillo = buscar(materiales, ['tornillo', 'silicon', 'sellador', 'remache']);
  const tintaSeleccionada = (tintas || []).find((t) => String(t.id) === String(form.tintaId));
  const tinta = tintaSeleccionada || null;

  if (ia.lona) {
    lineas.push(
      crearLinea({
        nombre: 'Lona impresa',
        tipo: 'Impresion',
        unidad: 'm2',
        cantidad: area,
        material: lona,
      })
    );
  }

  if (ia.vinil && !ia.lona) {
    lineas.push(
      crearLinea({
        nombre: 'Vinil impreso',
        tipo: 'Impresion',
        unidad: 'm2',
        cantidad: area,
        material: vinil,
      })
    );
  }

  if (ia.impresion) {
    lineas.push(
      crearLinea({
        nombre: 'Tinta / impresion',
        tipo: 'Impresion digital',
        unidad: 'm2',
        cantidad: area,
        material: tinta,
      })
    );
  }

  if (ia.pvc) {
    lineas.push(
      crearLinea({
        nombre: 'PVC',
        tipo: 'Material base',
        unidad: 'm2',
        cantidad: area,
        material: pvc,
      })
    );
  }

  if (ia.acrilico) {
    lineas.push(
      crearLinea({
        nombre: 'Acrilico',
        tipo: 'Material base',
        unidad: 'm2',
        cantidad: ia.dobleCara ? area * 2 : area,
        material: acrilico,
      })
    );
  }

  if (ia.acm) {
    lineas.push(
      crearLinea({
        nombre: 'ACM',
        tipo: 'Fachada',
        unidad: 'm2',
        cantidad: area,
        material: acm,
      })
    );
  }

  if (ia.estructura) {
    lineas.push(
      crearLinea({
        nombre: 'Estructura metalica',
        tipo: 'Estructura',
        unidad: 'metro lineal',
        cantidad: perimetro || 1,
        material: tubo,
      })
    );
  }

  if (ia.iluminado) {
    lineas.push(
      crearLinea({
        nombre: 'LED',
        tipo: 'Iluminacion',
        unidad: 'servicio',
        cantidad: 1,
        material: led,
      })
    );

    lineas.push(
      crearLinea({
        nombre: 'Fuente electrica',
        tipo: 'Iluminacion',
        unidad: 'servicio',
        cantidad: 1,
        material: fuente,
      })
    );
  }

  if (ia.instalacion) {
    lineas.push(
      crearLinea({
        nombre: 'Instalacion / fijacion',
        tipo: 'Instalacion',
        unidad: 'servicio',
        cantidad: 1,
        material: instalacion || tornillo,
      })
    );
  }
  if (lineas.length === 0) {
    const principal = buscar(materiales, ['lona', 'vinil', 'pvc', 'acrilico', 'acrilico', 'acm']) || materiales[0];

    lineas.push(
      crearLinea({
        nombre: 'Material principal detectado',
        tipo: 'Material',
        unidad: 'm2',
        cantidad: area || 1,
        material: principal,
      })
    );
  }

  return lineas;
}

function resumenItem(lineas, precioElegido) {
  const costo = lineas.reduce((acc, l) => acc + n(l.cantidad) * n(l.costoUnitario), 0);
  const minimo = costo * POLITICA.minimo;
  const recomendado = costo * POLITICA.recomendado;
  const objetivo = costo * POLITICA.objetivo;
  const venta =
    precioElegido === 'minimo' ? minimo : precioElegido === 'objetivo' ? objetivo : recomendado;

  return { costo, minimo, recomendado, objetivo, venta };
}

function campoCompleto(valor) {
  return String(valor || '').trim().length > 0;
}

export default function CotizadorDirectoAI({ setPage }) {
  const { configuracion, productos = [] } = useApp();
  const [materiales, setMateriales] = useState([]);
  const [productosRegistrados, setProductosRegistrados] = useState([]);
  const [tintas, setTintas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [lineasPreview, setLineasPreview] = useState([]);
  const [items, setItems] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cotizacionEdicion, setCotizacionEdicion] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);

  const productosDisponibles = useMemo(() => {
  const desdeContexto = Array.isArray(productos)
    ? productos.filter((p) => p?.activo !== false)
    : [];

  const desdeSupabase = Array.isArray(productosRegistrados)
    ? productosRegistrados.filter((p) => p?.activo !== false)
    : [];

  const mapa = new Map();

  [...desdeSupabase, ...desdeContexto].forEach((p) => {
    const key = p.id || p.codigo || p.nombre;
    if (key) mapa.set(String(key), p);
  });

  return Array.from(mapa.values());
}, [productos, productosRegistrados]);

const productosFiltrados = useMemo(() => {
  const q = limpiar(busquedaProducto);
  if (!q) return [];

  return productosDisponibles
    .filter((p) => {
      const texto = limpiar(
        `${p.codigo || ''} ${p.nombre || ''} ${p.titulo || ''} ${p.categoria || ''} ${p.descripcion || ''}`
      );
      return texto.includes(q);
    })
    .slice(0, 8);
}, [productosDisponibles, busquedaProducto]);

  const params = new URLSearchParams(window.location.search);
  const cotizacionIdEdicion = params.get('id');
  const modoEdicion = Boolean(cotizacionIdEdicion);

  const [form, setForm] = useState({
    buscarCliente: '',
    cliente: '',
    empresa: '',
    whatsapp: '',
    correo: '',
    direccion: '',
    ciudad: '',
    descripcion: '',
    ancho: 1,
    alto: 1,
    cantidad: 1,
      tintaId: '',
    precioElegido: 'recomendado',
    descuento: 0,
    usaIVA: false,
    formaPago: '6040',
    p1: 60,
    p2: 40,
    p3: 0,
    archivos: [],
  });

  useEffect(() => {
    const cargar = async () => {
      const [mat, tin, prod] = await Promise.all([
        supabase.from('materiales_master_v2').select('*').order('categoria'),
        supabase.from('tintas_master').select('*').order('nombre'),
        supabase.from('productos_registrados').select('*').eq('activo', true).order('nombre'),
      ]);

      if (mat.error) {
        setMensaje(`No se pudo cargar Material Master: ${mat.error.message}`);
      }

      setMateriales(mat.data || []);
      setTintas(tin.data || []);
      setProductosRegistrados(prod.data || []);

      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (!clientesError) {
        setClientes(clientesData || []);
      } else {
        const localClientes = JSON.parse(localStorage.getItem('elanvision_clientes') || '[]');
        setClientes(localClientes);
      }
    };

    cargar();
  }, []);

  useEffect(() => {
    const cargarCotizacionEdicion = async () => {
      if (!cotizacionIdEdicion || !supabase) return;

      setCargandoEdicion(true);

      const { data, error } = await supabase
        .from('cotizaciones_inteligentes')
        .select('*')
        .eq('id', cotizacionIdEdicion)
        .maybeSingle();

      if (error) {
        console.error('Error cargando cotizacion inteligente para edicion:', error);
        setMensaje('No se pudo cargar la cotizacion inteligente para edicion.');
        setCargandoEdicion(false);
        return;
      }

      if (!data) {
        setMensaje('No se encontro la cotizacion inteligente indicada.');
        setCargandoEdicion(false);
        return;
      }

      setCotizacionEdicion(data);

      const descripcion =
        data.descripcion ||
        data.biblioteca_nombre ||
        data.codigo ||
        'Cotizacion inteligente';

      const precioBase = Number(data.precio_b || 0);
      const costoBase =
        Number(data.costo_produccion || 0) +
        Number(data.costo_instalacion || 0) +
        Number(data.costo_transporte || 0) +
        Number(data.costo_viaticos || 0) +
        Number(data.costo_equipo || 0) +
        Number(data.costo_empresa || 0);

      const lineaEdicion = {
        id: `ci17-linea-${data.id}`,
        nombre: data.biblioteca_nombre || descripcion,
        tipo: 'Cotizacion inteligente',
        unidad: 'servicio',
        cantidad: Number(data.cantidad || 1),
        costoUnitario: costoBase > 0 ? costoBase : precioBase,
        origen: 'cotizaciones_inteligentes',
      };

      const resumenEdicion = resumenItem([lineaEdicion], 'recomendado');

      const itemEdicion = {
        id: `ci17-item-${data.id}`,
        descripcion,
        ancho: Number(data.ancho || 1),
        alto: Number(data.alto || 1),
        cantidad: Number(data.cantidad || 1),
        precioElegido: 'recomendado',
        lineas: [lineaEdicion],
        resumen: resumenEdicion,
        archivos: [],
      };

      setForm((prev) => ({
        ...prev,
        buscarCliente: '',
        cliente: data.cliente_nombre || '',
        empresa: data.cliente_nombre || '',
        whatsapp: data.celular || '',
        correo: '',
        direccion: data.ubicacion || '',
        ciudad: data.ubicacion || '',
        descripcion,
        ancho: Number(data.ancho || 1),
        alto: Number(data.alto || 1),
        cantidad: Number(data.cantidad || 1),
        precioElegido: 'recomendado',
        descuento: 0,
        usaIVA: false,
        formaPago: '6040',
        p1: 60,
        p2: 40,
        p3: 0,
      }));

      setLineasPreview([lineaEdicion]);
      setItems([itemEdicion]);
      setMensaje(`Modo edicion activo: ${data.codigo || data.id}`);
      setCargandoEdicion(false);
    };

    cargarCotizacionEdicion();
  }, [cotizacionIdEdicion]);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const clientesFiltrados = useMemo(() => {
    const q = limpiar(form.buscarCliente);
    if (!q) return [];

    return clientes
      .filter((c) =>
        limpiar(
          `${c.cliente || ''} ${c.nombre || ''} ${c.contacto || ''} ${c.empresa || ''} ${c.whatsapp || ''} ${c.telefono || ''} ${c.correo || ''} ${c.email || ''} ${c.ruc || ''} ${c.ciudad || ''}`
        ).includes(q)
      )
      .slice(0, 10);
  }, [clientes, form.buscarCliente]);

  const seleccionarCliente = (c) => {
    setForm((prev) => ({
      ...prev,
      cliente: c.cliente || c.nombre || c.contacto || '',
      empresa: c.empresa || '',
      whatsapp: c.whatsapp || c.telefono || '',
      correo: c.correo || c.email || '',
      direccion: c.direccion || '',
      ciudad: c.ciudad || '',
      buscarCliente: '',
    }));
  };

  const guardarClienteLocal = () => {
    if (!form.cliente && !form.empresa) return;

    const resumenFinal = productoSeleccionado
  ? {
      costo: Number(productoSeleccionado.precio_total_usd || 0) / POLITICA.recomendado,
      minimo: Number(productoSeleccionado.precio_total_usd || 0),
      recomendado: Number(productoSeleccionado.precio_total_usd || 0),
      objetivo: Number(productoSeleccionado.precio_total_usd || 0),
      venta: Number(productoSeleccionado.precio_total_usd || 0),
    }
  : preview;

const nuevo = {
  id: `item-${Date.now()}`,
  descripcion: form.descripcion,
  ancho: form.ancho,
  alto: form.alto,
  cantidad: form.cantidad,
  precioElegido: productoSeleccionado ? 'producto_registrado' : form.precioElegido,
  lineas: lineasPreview,
  resumen: resumenFinal,
  archivos: form.archivos,
};

    const actual = JSON.parse(localStorage.getItem('elanvision_clientes') || '[]');
    const filtrado = actual.filter(
      (c) => limpiar(`${c.cliente}-${c.empresa}`) !== limpiar(`${nuevo.cliente}-${nuevo.empresa}`)
    );

    const lista = [nuevo, ...filtrado];
    localStorage.setItem('elanvision_clientes', JSON.stringify(lista));
    setClientes(lista);
  };

  const guardarClienteSupabase = async () => {
    if (!supabase) return false;
    if (!form.cliente && !form.empresa) return false;

    const whatsapp = String(form.whatsapp || '').trim();

    const dataCliente = {
      cliente: form.cliente || '',
      empresa: form.empresa || '',
      whatsapp,
      correo: form.correo || '',
      direccion: form.direccion || '',
      ciudad: form.ciudad || '',
      unidad_negocio: 'ELANVISUAL',
      origen: 'CotizadorDirecto',
      data: {
        cliente: form.cliente || '',
        empresa: form.empresa || '',
        whatsapp,
        correo: form.correo || '',
        direccion: form.direccion || '',
        ciudad: form.ciudad || '',
        actualizadoDesde: 'CotizadorDirecto',
      },
      updated_at: new Date().toISOString(),
    };

    try {
      if (whatsapp) {
        const { data: existente, error: buscarError } = await supabase
          .from('clientes')
          .select('id')
          .eq('unidad_negocio', 'ELANVISUAL')
          .eq('whatsapp', whatsapp)
          .maybeSingle();

        if (buscarError) throw buscarError;

        if (existente?.id) {
          const { error } = await supabase
            .from('clientes')
            .update(dataCliente)
            .eq('id', existente.id);

          if (error) throw error;
          return true;
        }
      }

      const { error } = await supabase.from('clientes').insert(dataCliente);
      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error guardando cliente en Supabase:', error);
      return false;
    }
  };

  const manejarArchivos = (e) => {
    const files = Array.from(e.target.files || []).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      nombre: file.name,
      tipo: file.type,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }));

    setForm((prev) => ({ ...prev, archivos: [...prev.archivos, ...files] }));
  };

  const eliminarArchivo = (id) => {
    setForm((prev) => ({
      ...prev,
      archivos: prev.archivos.filter((a) => a.id !== id),
    }));
  };

  const calcularPreview = () => {
    if (!campoCompleto(form.descripcion)) {
      setMensaje('Escribi la descripcion del item para poder calcular.');
      return;
    }

    const requiereTinta = inferir(form).impresion;
    if (requiereTinta && !form.tintaId) {
      setMensaje('Selecciona el tipo de tinta / impresion para calcular el precio.');
      return;
    }

    const nuevas = armarLineasAutomaticas(form, materiales, tintas);
    setLineasPreview(nuevas);

    const sinCosto = nuevas.filter((l) => n(l.costoUnitario) <= 0);
    setMensaje(
      sinCosto.length
        ? `Atencion: ${sinCosto.length} elemento(s) necesitan costo en Material Master.`
        : 'item calculado correctamente.'
    );
  };

  const preview = useMemo(
    () => resumenItem(lineasPreview, form.precioElegido),
    [lineasPreview, form.precioElegido]
  );

  const agregarItem = () => {
    if (!lineasPreview.length && !productoSeleccionado) {
      setMensaje('Primero calcula el item con IA o selecciona un producto registrado.');
      return;
    }

    const precioProducto = Number(productoSeleccionado?.precio_total_usd || 0);

    const resumenFinal = productoSeleccionado
      ? {
          costo: precioProducto / POLITICA.recomendado,
          minimo: precioProducto,
          recomendado: precioProducto,
          objetivo: precioProducto,
          venta: precioProducto,
        }
      : preview;

    const nuevo = {
      id: `item-${Date.now()}`,
      descripcion: form.descripcion,
      ancho: form.ancho,
      alto: form.alto,
      cantidad: form.cantidad,
      precioElegido: productoSeleccionado ? 'producto_registrado' : form.precioElegido,
      lineas: lineasPreview,
      resumen: resumenFinal,
      archivos: form.archivos,
    };

    setItems((prev) => [...prev, nuevo]);
    setLineasPreview([]);
    setProductoSeleccionado(null);
    setBusquedaProducto('');
    setForm((prev) => ({
      ...prev,
      descripcion: '',
      ancho: 1,
      alto: 1,
      cantidad: 1,
      tintaId: '',
      precioElegido: 'recomendado',
      archivos: [],
    }));
    setMensaje('item agregado a la cotizacion.');
  };
  const eliminarItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

  const total = useMemo(() => {
    const subtotalBruto = items.reduce((acc, item) => acc + n(item.resumen.venta), 0);
    const descuento = subtotalBruto * (n(form.descuento) / 100);
    const subtotal = subtotalBruto - descuento;
    const iva = form.usaIVA ? subtotal * POLITICA.iva : 0;
    const totalCliente = subtotal + iva;

    let pagos = [];

    if (form.formaPago === 'contado') {
      pagos = [{ label: 'Contado', porcentaje: 100, monto: totalCliente }];
    } else if (form.formaPago === '6040') {
      pagos = [
        { label: 'Anticipo 60%', porcentaje: 60, monto: totalCliente * 0.6 },
        { label: 'Contra entrega 40%', porcentaje: 40, monto: totalCliente * 0.4 },
      ];
    } else if (form.formaPago === '602020') {
      pagos = [
        { label: 'Inicio 60%', porcentaje: 60, monto: totalCliente * 0.6 },
        { label: 'Produccion 20%', porcentaje: 20, monto: totalCliente * 0.2 },
        { label: 'Entrega 20%', porcentaje: 20, monto: totalCliente * 0.2 },
      ];
    } else {
      pagos = [
        { label: `Pago 1 ${form.p1}%`, porcentaje: n(form.p1), monto: totalCliente * (n(form.p1) / 100) },
        { label: `Pago 2 ${form.p2}%`, porcentaje: n(form.p2), monto: totalCliente * (n(form.p2) / 100) },
        { label: `Pago 3 ${form.p3}%`, porcentaje: n(form.p3), monto: totalCliente * (n(form.p3) / 100) },
      ].filter((p) => p.porcentaje > 0);
    }

    const sumaPagos = pagos.reduce((acc, p) => acc + n(p.porcentaje), 0);

    return { subtotalBruto, descuento, subtotal, iva, totalCliente, pagos, sumaPagos };
  }, [items, form]);

  const guardar = async () => {
    guardarClienteLocal();
    const clienteSupabaseOk = await guardarClienteSupabase();

    const payload = {
      id: `cot-dir-${Date.now()}`,
      fecha: new Date().toISOString(),
      origen: 'CotizadorDirecto',
      unidadNegocio: 'ELANVISUAL',
      form,
      items,
      total,
    };

    const actual = JSON.parse(localStorage.getItem('elanvision_cotizaciones_directas') || '[]');
    localStorage.setItem('elanvision_cotizaciones_directas', JSON.stringify([payload, ...actual]));

    if (!supabase) {
      setMensaje('Cotizacion guardada localmente. Supabase no disponible.');
      return payload;
    }

    try {
      const { error } = await supabase.from('pedidos').insert({
        numero: payload.id,
        cliente_nombre: form.cliente || form.empresa || 'Cliente',
        cliente_telefono: form.whatsapp || '',
        estado: 'cotizacion_guardada',
        estado_produccion: 'pendiente',
        unidad_negocio: 'ELANVISUAL',
        total: Number(total.totalCliente || 0),
        data: payload,
      });

      if (error) {
        console.error('Error guardando cotizacion directa en Supabase:', error);
        setMensaje('Cotizacion guardada localmente. No se pudo guardar en Supabase.');
        return payload;
      }

      setMensaje(clienteSupabaseOk ? 'Cotizacion y cliente guardados en Supabase.' : 'Cotizacion guardada en Supabase. Cliente pendiente de sincronizar.');
      return payload;
    } catch (error) {
      console.error('Error inesperado guardando cotizacion directa:', error);
      setMensaje('Cotizacion guardada localmente. Supabase no disponible.');
      return payload;
    }
  };

  const imprimir = async () => {
    const esMovil =
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 900;

    /*
      En movil window.print() ejecutado sobre la misma pantalla suele fallar:
      Android/iOS pueden bloquear el dialogo, mostrar blanco o no ofrecer guardar PDF.
      Por eso abrimos una ventana limpia de impresion en el mismo clic del usuario.
    */
    const ventanaImpresion = esMovil ? window.open('', '_blank') : null;

    await guardar();

    const imprimirPaginaActual = () => {
      setTimeout(() => {
        window.print();
      }, 700);
    };

    if (!esMovil) {
      imprimirPaginaActual();
      return;
    }

    const areaImpresion = document.querySelector('.print-area');

    if (!areaImpresion || !ventanaImpresion) {
      imprimirPaginaActual();
      return;
    }

    const estilos = Array.from(document.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    const tituloPDF = `Cotizacion-ELANVISION-${Date.now()}`;

    ventanaImpresion.document.open();
    ventanaImpresion.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${tituloPDF}</title>
          <style>
            ${estilos}

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            .print-area {
              display: block !important;
              width: 100% !important;
              padding: 0 !important;
              background: #ffffff !important;
            }

            .ev-quote-sheet {
              width: 1080px !important;
              min-height: 1800px !important;
              margin: 0 auto !important;
              box-shadow: none !important;
            }

            @page {
              size: auto;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${areaImpresion.innerHTML}
          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 900);
            };
          </script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  return (
    <main className="cot-directo">
      <section className="cd-hero no-print">
        <span>ELANVISION - Cotizador Directo</span>
        <h1>CREA TU COTIZACION</h1>
        <p>
          Transforma ideas en proyectos.
          <br />
          Cotiza rapido, vende mejor.
        </p>
      </section>


      <section className="cd-captura-box no-print">
        <button
          type="button"
          className="cd-btn-captura"
          onClick={() => setPage && setPage('capturaInteligente')}
        >
          Capturar cliente nuevo
        </button>
      </section>

      <section className="cd-grid no-print">
        <form
          className="cd-card"
          onSubmit={(e) => {
            e.preventDefault();
            calcularPreview();
          }}
        >
          <div className="cd-title">
            <Search size={20} />
            <h2>Cliente</h2>
          </div>

          <input
            placeholder="Buscar cliente registrado"
            value={form.buscarCliente}
            onChange={(e) => actualizar('buscarCliente', e.target.value)}
          />

          {clientesFiltrados.length > 0 && (
            <div className="cliente-lista">
              {clientesFiltrados.map((c, idx) => (
                <button key={idx} type="button" onClick={() => seleccionarCliente(c)}>
                  <b>{c.cliente || c.nombre || c.contacto || c.empresa}</b>
                  <span>{c.whatsapp || c.telefono || c.correo || c.email || 'Cliente registrado'}</span>
                </button>
              ))}
            </div>
          )}

          <div className="cd-subtitle">
            <UserPlus size={18} />
            <strong>Datos del cliente</strong>
          </div>

          <div className="two">
            <div className="field">
              <label>Nombre del cliente</label>
              <input value={form.cliente} onChange={(e) => actualizar('cliente', e.target.value)} />
            </div>

            <div className="field">
              <label>Empresa</label>
              <input value={form.empresa} onChange={(e) => actualizar('empresa', e.target.value)} />
            </div>
          </div>

          <div className="two">
            <div className="field">
              <label>WhatsApp / celular</label>
              <input value={form.whatsapp} onChange={(e) => actualizar('whatsapp', e.target.value)} />
            </div>

            <div className="field">
              <label>Correo</label>
              <input value={form.correo} onChange={(e) => actualizar('correo', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Direccion / ubicacion</label>
            <input value={form.direccion} onChange={(e) => actualizar('direccion', e.target.value)} />
          </div>

          <div className="field">
            <label>Ciudad</label>
            <input value={form.ciudad} onChange={(e) => actualizar('ciudad', e.target.value)} />
          </div>

          <div className="cd-title item-title">
            <Calculator size={20} />
            <h2>Item a cotizar</h2>
          </div>

          <div className="field producto-registrado-box">
  <label>Buscar producto registrado</label>

  <input
    placeholder="Ejemplo: caballete, CAB-075-120, PVC, lona..."
    value={busquedaProducto}
    onChange={(e) => setBusquedaProducto(e.target.value)}
  />

  {productosFiltrados.length > 0 && (
    <div className="producto-resultados">
      {productosFiltrados.map((p) => (
        <button
          key={p.id || p.codigo}
          type="button"
          className="producto-card"
          onClick={() => {
            setProductoSeleccionado(p);
            setBusquedaProducto(p.nombre || p.codigo || '');

            setForm((prev) => ({
              ...prev,
              descripcion: p.nombre || p.titulo || prev.descripcion,
ancho: p.ancho_m || p.ancho || prev.ancho,
alto: p.largo_m || p.alto || prev.alto,
cantidad: 1,
            }));
          }}
        >
          <strong>{p.codigo || 'SIN-CODIGO'}</strong>
          <span>{p.nombre}</span>

          <small>
            {p.precio_total_usd
              ? `C$ ${Number(p.precio_total_usd).toFixed(2)}`
              : ''}
          </small>
        </button>
      ))}
    </div>
  )}

  {productoSeleccionado && (
    <div className="producto-seleccionado">
      Producto seleccionado:
      <strong> {productoSeleccionado.codigo}</strong>
      {' - '}
      {productoSeleccionado.nombre}
    </div>
  )}
</div>

          <div className="field">
            <label>Descripcion del trabajo</label>
            <textarea
              placeholder="Ejemplo: Impresion en lona banner 13oz de 1x2 mts con tubo arriba y abajo e instalacion"
              value={form.descripcion}
              onChange={(e) => actualizar('descripcion', e.target.value)}
            />
          </div>

          <div className="three">
            <div className="field">
              <label>Ancho en metros</label>
              <input
                type="number"
                step="0.01"
                value={form.ancho}
                onChange={(e) => actualizar('ancho', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Alto en metros</label>
              <input
                type="number"
                step="0.01"
                value={form.alto}
                onChange={(e) => actualizar('alto', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Cantidad de unidades</label>
              <input
                type="number"
                step="1"
                value={form.cantidad}
                onChange={(e) => actualizar('cantidad', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Tipo de tinta / impresion</label>
            <select value={form.tintaId} onChange={(e) => actualizar('tintaId', e.target.value)}>
              <option value="">Seleccionar tinta</option>
              {tintas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
          <label className="upload">
            <Paperclip size={18} />
            Cargar imagenes, PDF o referencias opcionales
            <input type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.csv" onChange={manejarArchivos} />
          </label>

          {form.archivos.length > 0 && (
            <div className="archivos">
              {form.archivos.map((a) => (
                <article key={a.id}>
                  {a.url ? <img src={a.url} alt={a.nombre} /> : <FileText size={22} />}
                  <span>{a.nombre}</span>
                  <button type="button" onClick={() => eliminarArchivo(a.id)}>
                    X
                  </button>
                </article>
              ))}
            </div>
          )}

          <button className="primary" type="submit">
            <Calculator size={18} />
            Calcular item con IA
          </button>

          <button className="secondary" type="button" onClick={agregarItem}>
            Agregar item a cotizacion
          </button>
        </form>

        <section className="cd-card resumen-card">
          <div className="cd-title">
            <FileText size={20} />
            <h2>Resumen comercial</h2>
          </div>

          <div className="price-mini">
            <span>Item minimo</span>
            <b>{money(preview.minimo)}</b>
            <span>Item recomendado</span>
            <b>{money(preview.recomendado)}</b>
            <span>Item objetivo</span>
            <b>{money(preview.objetivo)}</b>
          </div>

          <div className="prices">
            <label>
              <input
                type="radio"
                checked={form.precioElegido === 'minimo'}
                onChange={() => actualizar('precioElegido', 'minimo')}
              />
              Precio minimo
            </label>

            <label>
              <input
                type="radio"
                checked={form.precioElegido === 'recomendado'}
                onChange={() => actualizar('precioElegido', 'recomendado')}
              />
              Precio recomendado
            </label>

            <label>
              <input
                type="radio"
                checked={form.precioElegido === 'objetivo'}
                onChange={() => actualizar('precioElegido', 'objetivo')}
              />
              Precio objetivo
            </label>
          </div>

          <div className="two">
            <div className="field">
              <label>Descuento autorizado</label>
              <select value={form.descuento} onChange={(e) => actualizar('descuento', e.target.value)}>
                {POLITICA.descuentos.map((d) => (
                  <option key={d} value={d}>
                    {d}%
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Aplicar IVA</label>
              <select
                value={form.usaIVA ? 'si' : 'no'}
                onChange={(e) => actualizar('usaIVA', e.target.value === 'si')}
              >
                <option value="no">Sin IVA</option>
                <option value="si">Con IVA</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Forma de pago</label>
            <select value={form.formaPago} onChange={(e) => actualizar('formaPago', e.target.value)}>
              <option value="contado">Contado</option>
              <option value="6040">60% / 40%</option>
              <option value="602020">60% / 20% / 20%</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {form.formaPago === 'personalizado' && (
            <>
              <div className="three">
                <div className="field">
                  <label>Pago 1 %</label>
                  <input type="number" value={form.p1} onChange={(e) => actualizar('p1', e.target.value)} />
                </div>

                <div className="field">
                  <label>Pago 2 %</label>
                  <input type="number" value={form.p2} onChange={(e) => actualizar('p2', e.target.value)} />
                </div>

                <div className="field">
                  <label>Pago 3 %</label>
                  <input type="number" value={form.p3} onChange={(e) => actualizar('p3', e.target.value)} />
                </div>
              </div>

              {total.sumaPagos !== 100 && (
                <p className="alerta">Los pagos personalizados deben sumar 100%.</p>
              )}
            </>
          )}

          <div className="total-box">
            <p>
              <span>Subtotal</span>
              <b>{money(total.subtotal)}</b>
            </p>

            {form.usaIVA && (
              <p>
                <span>IVA</span>
                <b>{money(total.iva)}</b>
              </p>
            )}

            <p className="total-line">
              <span>Total</span>
              <b>{money(total.totalCliente)}</b>
            </p>

            <hr />
            <strong>Forma de pago</strong>

            {total.pagos.map((p) => (
              <p key={p.label}>
                <span>{p.label}</span>
                <b>{money(p.monto)}</b>
              </p>
            ))}
          </div>

          <button className="secondary" type="button" onClick={guardar}>
            Guardar cotizacion
          </button>

          <button className="primary" type="button" onClick={imprimir}>
            <Printer size={18} />
            Descargar / Imprimir PDF
          </button>

          {mensaje && <p className="msg">{mensaje}</p>}
        </section>
      </section>

      <section className="cd-card no-print">
        <div className="cd-title">
          <ImagePlus size={20} />
          <h2>items cargados en cotizacion</h2>
        </div>

        {items.length === 0 && <p className="empty">Todavia no hay items agregados.</p>}

        <div className="items">
          {items.map((item, idx) => (
            <article className="item" key={item.id}>
              <b>{idx + 1}</b>
              <span>{item.descripcion}</span>
              <strong>{money(item.resumen.venta)}</strong>
              <button type="button" onClick={() => eliminarItem(item.id)}>
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="cd-card no-print">
        <div className="cd-title">
          <h2>Validacion interna IA</h2>
        </div>

        {lineasPreview.length === 0 ? (
          <p className="muted">Al calcular un item se mostraran aqui las categorias detectadas.</p>
        ) : (
          <div className="chips">
            {lineasPreview.map((l) => (
              <span key={l.id}>{l.tipo}</span>
            ))}
          </div>
        )}

        <p className="muted">No se muestran costos internos al vendedor. Solo categorias detectadas.</p>
      </section>

      <section className="print-area">
        <div className="ev-quote-sheet">
          <header className="ev-quote-header">
            <div className="ev-brand-block">
              {true ? (
                <img src="/assets/branding/elanvisual.svg" alt={configuracion.logoTexto || 'ELANVISION'} className="ev-logo-img" />
              ) : (
                <div className="ev-logo-mark">EV</div>
              )}

              <div>
                <h1>{configuracion?.logoTexto || 'ELANVISION'}</h1>
                <p>Soluciones de Rotulacion e Imagen Comercial</p>
                <strong>RUC: 4012805831001E</strong>
              </div>
            </div>

            <div className="ev-doc-box">
              <div>
                <span>COTIZACION</span>
                <b>{`EV-${String(Date.now()).slice(-6)}`}</b>
              </div>

              <div>
                <span>FECHA</span>
                <b>{new Date().toLocaleDateString('es-NI')}</b>
              </div>

              <div>
                <span>VALIDEZ</span>
                <b>15 DIAS</b>
              </div>
            </div>
          </header>

          <section className="ev-client-row">
            <article className="ev-client-card main">
              <span>CLIENTE</span>
              <h2>{form.empresa || form.cliente || '-'}</h2>
              <p><b>RUC:</b> -</p>
              <p><b>Atencion:</b> {form.cliente || '-'}</p>
              <p><b>Telefono:</b> {form.whatsapp || '-'}</p>
              <p><b>Correo:</b> {form.correo || '-'}</p>
              <p><b>Direccion:</b> {form.direccion || '-'}</p>
              <p><b>Ciudad:</b> {form.ciudad || '-'}</p>
            </article>

            <article className="ev-client-card seller">
              <span>ATENDIDO POR</span>
              <h2>Erick Cano</h2>
              <p><b>Unidad:</b> ELANVISION</p>
              <p><b>WhatsApp:</b></p>
              <p className="ev-phone">+505 8838 8940</p>
            </article>
          </section>

          <section className="ev-items-section">
            {items.length === 0 && (
              <p className="ev-empty">No hay items agregados.</p>
            )}

            {items.map((item, idx) => {
              const cantidad = Math.max(n(item.cantidad), 1);
              const subtotalItem = n(item.resumen?.venta);
              const precioUnitario = subtotalItem / cantidad;

              return (
                <article className="ev-item-card" key={item.id}>
                  <div className="ev-item-title">
                    <span>{`ITEM ${String(idx + 1).padStart(2, '0')}`}</span>
                  </div>

                  <p className="ev-item-description">{item.descripcion}</p>

                  <div className="ev-item-values">
                    <p><span>Cantidad</span><b>{cantidad}</b></p>
                    <p><span>Precio Unitario</span><b>{money(precioUnitario)}</b></p>
                    <p><span>Subtotal</span><b>{money(subtotalItem)}</b></p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="ev-summary-box">
            <h2>RESUMEN</h2>

            <div className="ev-summary-line">
              <span>Subtotal</span>
              <b>{money(total.subtotalBruto)}</b>
            </div>

            <div className="ev-summary-line">
              <span>Descuento comercial</span>
              <b>-{money(total.descuento)}</b>
            </div>

            <div className="ev-summary-line">
              <span>Subtotal ajustado</span>
              <b>{money(total.subtotal)}</b>
            </div>

            {form.usaIVA && (
              <div className="ev-summary-line">
                <span>IVA 15%</span>
                <b>{money(total.iva)}</b>
              </div>
            )}

            <div className="ev-total-line">
              <span>TOTAL</span>
              <b>{money(total.totalCliente)}</b>
            </div>
          </section>

          <section className="ev-payment-box">
            <h2>FORMA DE PAGO</h2>
            {total.pagos.map((p) => (
              <p key={p.label}>
                <span>{p.label}</span>
                <b>{money(p.monto)}</b>
              </p>
            ))}
          </section>

          <section className="ev-check-box">
            <h2>ELABORAR CK A NOMBRE DE:</h2>
            <strong>ERICK ANTONIO CANO JOSE</strong>
          </section>

          <section className="ev-notes-box">
            <h2>OBSERVACIONES</h2>
            <p>La presente cotizacion tiene validez de 15 dias.</p>
            <p>Produccion inicia con aprobacion y anticipo.</p>
            <p>Materiales sujetos a disponibilidad.</p>
            <p>Gracias por confiar en ELANVISION.</p>
          </section>
        </div>
      </section>
      <style>{`
        .print-area{
          width:100%;
          display:flex;
          justify-content:center;
          padding:40px 0;
          background:#eef2f7;
        }

        .ev-quote-sheet{
          width:1080px;
          min-height:1800px;
          background:#ffffff;
          color:#0f172a;
          padding:64px;
          box-sizing:border-box;
          font-family:Arial, Helvetica, sans-serif;
          display:grid;
          gap:34px;
        }

        .ev-quote-header{
          display:grid;
          grid-template-columns:1.25fr .75fr;
          gap:34px;
          align-items:start;
          border-bottom:3px solid #0f2f5f;
          padding-bottom:34px;
        }

        .ev-brand-block{
          display:flex;
          align-items:flex-start;
          gap:22px;
        }

        .ev-logo-img{
          width:150px;
          max-height:120px;
          object-fit:contain;
        }

        .ev-logo-mark{
          width:118px;
          height:118px;
          border-radius:28px;
          background:#0f2f5f;
          color:#ffffff;
          display:grid;
          place-items:center;
          font-size:42px;
          font-weight:950;
          letter-spacing:-2px;
        }

        .ev-brand-block h1{
          margin:0 0 8px;
          font-size:44px;
          line-height:1;
          color:#0f2f5f;
          letter-spacing:-1px;
          font-weight:950;
        }

        .ev-brand-block p{
          margin:0 0 12px;
          font-size:20px;
          color:#334155;
          font-weight:800;
        }

        .ev-brand-block strong{
          font-size:17px;
          color:#111827;
        }

        .ev-doc-box{
          display:grid;
          grid-template-columns:1fr;
          gap:14px;
        }

        .ev-doc-box div{
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:22px;
          padding:20px;
          display:grid;
          gap:8px;
        }

        .ev-doc-box span,
        .ev-client-card span,
        .ev-item-title span{
          font-size:14px;
          font-weight:950;
          letter-spacing:.08em;
          color:#64748b;
          text-transform:uppercase;
        }

        .ev-doc-box b{
          font-size:25px;
          color:#0f2f5f;
        }

        .ev-client-row{
          display:grid;
          grid-template-columns:1.35fr .65fr;
          gap:24px;
        }

        .ev-client-card{
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:28px;
          padding:30px;
        }

        .ev-client-card.main{
          border-left:8px solid #0f2f5f;
        }

        .ev-client-card h2{
          margin:12px 0 18px;
          font-size:34px;
          line-height:1.1;
          color:#111827;
          font-weight:950;
        }

        .ev-client-card p{
          margin:8px 0;
          font-size:18px;
          color:#334155;
          line-height:1.35;
        }

        .ev-client-card b{
          color:#111827;
        }

        .ev-phone{
          font-size:24px !important;
          color:#0f2f5f !important;
          font-weight:950;
        }

        .ev-items-section{
          display:grid;
          gap:24px;
        }

        .ev-item-card{
          border:1px solid #e2e8f0;
          border-radius:30px;
          padding:34px;
          background:#ffffff;
          box-shadow:0 10px 26px rgba(15,23,42,.06);
          page-break-inside:avoid;
          break-inside:avoid;
        }

        .ev-item-title{
          margin-bottom:18px;
        }

        .ev-item-title span{
          color:#0f2f5f;
          font-size:17px;
        }

        .ev-item-description{
          margin:0 0 28px;
          font-size:25px;
          line-height:1.42;
          color:#111827;
          font-weight:850;
          white-space:pre-wrap;
        }

        .ev-item-values{
          display:grid;
          grid-template-columns:repeat(3, 1fr);
          gap:14px;
        }

        .ev-item-values p{
          margin:0;
          background:#f8fafc;
          border-radius:20px;
          padding:18px;
          display:grid;
          gap:8px;
        }

        .ev-item-values span{
          font-size:14px;
          color:#64748b;
          font-weight:900;
          text-transform:uppercase;
        }

        .ev-item-values b{
          font-size:22px;
          color:#111827;
        }

        .ev-summary-box{
          background:#0f2f5f;
          color:#ffffff;
          border-radius:34px;
          padding:38px;
          display:grid;
          gap:16px;
          page-break-inside:avoid;
          break-inside:avoid;
        }

        .ev-summary-box h2,
        .ev-payment-box h2,
        .ev-check-box h2,
        .ev-notes-box h2{
          margin:0 0 8px;
          font-size:22px;
          letter-spacing:.08em;
          text-transform:uppercase;
        }

        .ev-summary-line,
        .ev-total-line,
        .ev-payment-box p{
          display:flex;
          justify-content:space-between;
          gap:24px;
          align-items:center;
          margin:0;
        }

        .ev-summary-line span,
        .ev-payment-box span{
          font-size:20px;
          font-weight:800;
        }

        .ev-summary-line b{
          font-size:23px;
        }

        .ev-total-line{
          margin-top:12px;
          padding-top:22px;
          border-top:2px solid rgba(255,255,255,.25);
        }

        .ev-total-line span{
          font-size:28px;
          font-weight:950;
        }

        .ev-total-line b{
          font-size:42px;
          font-weight:950;
        }

        .ev-payment-box,
        .ev-check-box,
        .ev-notes-box{
          background:#f8fafc;
          border:1px solid #e2e8f0;
          border-radius:30px;
          padding:32px;
          page-break-inside:avoid;
          break-inside:avoid;
        }

        .ev-payment-box h2,
        .ev-check-box h2,
        .ev-notes-box h2{
          color:#0f2f5f;
        }

        .ev-payment-box p{
          padding:12px 0;
          border-bottom:1px solid #e2e8f0;
        }

        .ev-payment-box p:last-child{
          border-bottom:0;
        }

        .ev-payment-box b{
          font-size:21px;
          color:#111827;
        }

        .ev-check-box strong{
          display:block;
          font-size:28px;
          color:#111827;
          margin-top:10px;
        }

        .ev-notes-box p{
          margin:8px 0;
          font-size:18px;
          color:#475569;
          line-height:1.45;
        }

        .ev-empty{
          padding:32px;
          text-align:center;
          border:1px dashed #cbd5e1;
          border-radius:24px;
          color:#64748b;
          font-weight:900;
        }

        @media print{
          @page{
            size:auto;
            margin:0;
          }

          body{
            margin:0 !important;
            background:#ffffff !important;
          }

          .no-print,
          .desktop-header,
          .mobile-header,
          .erp-floating-actions{
            display:none !important;
          }

          .cot-directo{
            background:#ffffff !important;
            padding:0 !important;
            display:block !important;
          }

          .print-area{
            display:block !important;
            padding:0 !important;
            background:#ffffff !important;
          }

          .ev-quote-sheet{
            width:1080px !important;
            min-height:1800px !important;
            margin:0 auto !important;
            box-shadow:none !important;
          }
        }


        .cot-directo{
          min-height:100vh;
          background:#f4f6fb;
          padding:14px;
          display:grid;
          gap:14px;
        }

        .cd-hero,
        .cd-card{
          background:#fff;
          border-radius:24px;
          padding:18px;
          box-shadow:0 14px 35px rgba(15,23,42,.08);
        }

        .cd-hero span{
          font-size:12px;
          font-weight:950;
          color:#b48722;
          text-transform:uppercase;
          letter-spacing:.03em;
        }

        .cd-hero h1{
          margin:8px 0;
          font-size:38px;
          line-height:1;
          color:#111827;
          font-weight:950;
        }

        .cd-hero p{
          margin:0;
          color:#64748b;
          font-weight:800;
          font-size:18px;
          line-height:1.35;
        }

        .cd-grid{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:14px;
          align-items:start;
        }

        .cd-title{
          display:flex;
          gap:8px;
          align-items:center;
          margin-bottom:12px;
        }

        .cd-title h2{
          margin:0;
          color:#111827;
        }

        .cd-subtitle{
          display:flex;
          align-items:center;
          gap:8px;
          margin:4px 0 12px;
          color:#334155;
        }

        .item-title{
          margin-top:18px;
        }

        input,
        textarea,
        select{
          width:100%;
          border:1px solid #dbe3ef;
          border-radius:16px;
          padding:13px;
          font-size:16px;
          margin-bottom:10px;
          background:#fff;
          color:#111827;
        }

        textarea{
          min-height:120px;
          resize:vertical;
        }

        .field label{
          display:block;
          font-size:13px;
          font-weight:950;
          color:#475569;
          margin:0 0 6px 4px;
        }

        .two{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        }

        .three{
          display:grid;
          grid-template-columns:repeat(3,1fr);
          gap:10px;
        }

        .primary,
        .secondary{
          width:100%;
          border:0;
          border-radius:18px;
          padding:14px;
          font-weight:950;
          font-size:15px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          cursor:pointer;
          margin-top:8px;
        }

        .primary{
          background:#111827;
          color:#fff;
        }

        .secondary{
          background:#eef2ff;
          color:#3730a3;
        }

        .cliente-lista{
          display:grid;
          gap:6px;
          margin-bottom:10px;
        }

        .cliente-lista button{
          border:1px solid #dbe3ef;
          background:#f8fafc;
          border-radius:14px;
          padding:10px;
          text-align:left;
        }

        .cliente-lista span{
          display:block;
          color:#64748b;
        }

        .upload{
          border:2px dashed #cbd5e1;
          border-radius:18px;
          padding:14px;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:8px;
          font-weight:900;
          color:#334155;
          cursor:pointer;
          text-align:center;
        }

        .upload input{
          display:none;
        }

        .archivos{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(120px,1fr));
          gap:8px;
          margin:10px 0;
        }

        .archivos article{
          border:1px solid #e5e7eb;
          border-radius:14px;
          padding:8px;
          display:grid;
          gap:6px;
          position:relative;
          overflow:hidden;
        }

        .archivos img{
          width:100%;
          height:90px;
          object-fit:cover;
          border-radius:10px;
        }

        .archivos span{
          font-size:12px;
          color:#475569;
          word-break:break-word;
        }

        .archivos button{
          position:absolute;
          right:5px;
          top:5px;
          border:0;
          background:#ef4444;
          color:#fff;
          border-radius:99px;
          width:28px;
          height:28px;
        }

        .price-mini{
          display:grid;
          grid-template-columns:1fr auto;
          gap:6px;
          background:#f8fafc;
          border-radius:16px;
          padding:12px;
          margin-bottom:10px;
        }

        .price-mini span{
          color:#475569;
        }

        .price-mini b{
          color:#111827;
        }

        .prices{
          display:grid;
          gap:8px;
          margin-bottom:10px;
        }

        .prices label{
          font-weight:900;
        }

        .prices input{
          width:auto;
          margin-right:8px;
        }

        .total-box{
          background:#0f172a;
          color:#fff;
          border-radius:20px;
          padding:14px;
          margin-top:10px;
        }

        .total-box p{
          display:flex;
          justify-content:space-between;
          margin:6px 0;
          gap:12px;
        }

        .total-box hr{
          border:0;
          border-top:1px solid rgba(255,255,255,.2);
          margin:12px 0;
        }

        .total-line{
          font-size:18px;
        }

        .items{
          display:grid;
          gap:8px;
        }

        .item{
          display:grid;
          grid-template-columns:50px 1fr 160px 42px;
          gap:8px;
          align-items:center;
          background:#f8fafc;
          border:1px solid #e5e7eb;
          border-radius:16px;
          padding:12px;
        }

        .item button{
          border:0;
          background:#fee2e2;
          color:#991b1b;
          border-radius:12px;
          height:42px;
        }

        .chips{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }

        .chips span{
          background:#e0f2fe;
          color:#075985;
          border-radius:999px;
          padding:8px 12px;
          font-weight:900;
        }

        .muted,
        .empty{
          color:#64748b;
          font-weight:750;
        }

        .msg{
          font-weight:900;
          color:#0f766e;
        }

        .alerta{
          background:#fef3c7;
          color:#92400e;
          padding:10px 12px;
          border-radius:14px;
          font-weight:900;
        }

        .print-area{
          display:none;
        }

        .cd-btn-captura{
          margin-top:14px;
          border:0;
          border-radius:16px;
          padding:12px 16px;
          font-weight:950;
          background:#0f172a;
          color:white;
          cursor:pointer;
        }

        @media(max-width:900px){
          .cot-directo{
            padding:14px;
            padding-bottom:110px;
          }

          .cd-grid,
          .two,
          .three,
          .item{
            grid-template-columns:1fr;
          }

          .cd-hero,
          .cd-card{
            border-radius:22px;
            padding:18px;
          }

          .cd-hero h1{
            font-size:46px;
          }

          .cd-hero p{
            font-size:19px;
          }

          .field label{
            color:#cbd5e1;
            font-size:14px;
          }
        }

        @media print{
          .no-print,
          .cd-hero,
          .cd-grid,
          .cd-card{
            display:none!important;
          }

          .cot-directo{
            background:#fff;
            padding:0;
          }

          .print-area{
            display:block;
            font-family:Arial,sans-serif;
            color:#111827;
            padding:28px;
          }

          .print-banner{
            background:#062b70;
            color:#fff;
            padding:24px;
            border-radius:18px;
            margin-bottom:18px;
          }

          .print-banner h1{
            font-size:44px;
            margin:0;
          }

          .print-banner p{
            margin:6px 0 0;
          }

          .print-client{
            border:3px solid #0b4db3;
            border-radius:18px;
            padding:16px;
            margin-bottom:18px;
          }

          table{
            width:100%;
            border-collapse:collapse;
            margin:14px 0;
          }

          th{
            background:#062b70;
            color:#fff;
          }

          th,
          td{
            border:1px solid #d1d5db;
            padding:10px;
            text-align:left;
          }

          .print-total{
            background:#062b70;
            color:#fff;
            border-radius:12px;
            padding:14px;
            margin-top:14px;
          }

          .print-total p{
            display:flex;
            justify-content:space-between;
          }

          .legal{
            margin-top:30px;
            color:#64748b;
          }
        }
      `}</style>
    </main>
  );
}





















