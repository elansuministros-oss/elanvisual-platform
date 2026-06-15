import React, { useMemo } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANVISUAL',
  'ELANVISUAL',
  'ELANKAV CENTER',
  'ELANHOME',
  'ELAN AI',
];

const IVA = 0.15;

const numero = (valor) => {
  const n = Number(valor || 0);
  return Number.isFinite(n) ? n : 0;
};

const formatoNumero = (valor) => new Intl.NumberFormat('es-NI').format(numero(valor));

const moneda = (valor) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
  }).format(numero(valor));

const obtenerFecha = (registro = {}) =>
  registro.actualizado ||
  registro.fechaRegistro ||
  registro.fecha ||
  registro.fechaCobro ||
  registro.fechaPago ||
  registro.fechaCompra ||
  registro.fechaFactura ||
  registro.fechaVencimiento ||
  registro.createdAt ||
  '';

const ordenarRecientes = (lista = []) =>
  [...lista]
    .filter(Boolean)
    .sort((a, b) => {
      const fechaA = new Date(obtenerFecha(a) || 0).getTime();
      const fechaB = new Date(obtenerFecha(b) || 0).getTime();
      return fechaB - fechaA;
    });

const contarPorEstado = (lista = [], palabras = []) => {
  const palabrasNormalizadas = palabras.map((p) => p.toLowerCase());

  return lista.filter((item) => {
    const estado = String(item?.estado || item?.estatus || item?.fase || '').toLowerCase();
    return palabrasNormalizadas.some((palabra) => estado.includes(palabra));
  }).length;
};

const obtenerNombre = (registro, fallback) =>
  registro?.nombre ||
  registro?.cliente ||
  registro?.empresa ||
  registro?.proveedor ||
  registro?.titulo ||
  registro?.codigo ||
  registro?.descripcion ||
  fallback;

const unidadRegistro = (item = {}) => item.unidadNegocio || item.unidad || 'ELANVISUAL';

const sumar = (lista = [], selector) =>
  lista.reduce((total, item) => total + numero(selector(item)), 0);

const esConIVA = (item = {}) =>
  item.tipoFiscal === 'Con IVA' ||
  item.facturaFiscal === 'Si' ||
  numero(item.ivaDebito || item.ivaCredito || item.iva) > 0;

const montoVenta = (item = {}) =>
  numero(item.montoFactura || item.monto || item.total || item.importe || item.valor);

const montoCobrado = (item = {}) =>
  numero(item.montoCobrado || item.abonado || item.pagado || item.monto || item.total);

const montoCompra = (item = {}) =>
  numero(item.total || item.monto || item.importe || item.valor || item.subtotal);

const montoSaldo = (item = {}) =>
  numero(item.saldo || item.saldoPendiente || item.pendiente || item.montoPendiente || item.total);

const montoComision = (item = {}) =>
  numero(item.monto || item.comision || item.total || item.valor);

const montoFlujo = (item = {}) => numero(item.monto || item.total || item.valor);

const ivaDebito = (item = {}) => {
  if (!esConIVA(item)) return 0;
  if (item.ivaDebito !== undefined) return numero(item.ivaDebito);
  if (item.iva !== undefined) return numero(item.iva);
  const total = montoVenta(item);
  return total - total / (1 + IVA);
};

const ivaCredito = (item = {}) => {
  if (!esConIVA(item)) return 0;
  if (item.ivaCredito !== undefined) return numero(item.ivaCredito);
  if (item.iva !== undefined) return numero(item.iva);
  const subtotal = numero(item.subtotal || item.baseImponible || 0);
  if (subtotal > 0) return subtotal * IVA;
  const total = montoCompra(item);
  return total - total / (1 + IVA);
};

const rankingClientes = (cobros = [], cuentasPorCobrar = []) => {
  const mapa = new Map();

  [...cobros, ...cuentasPorCobrar].forEach((item) => {
    const nombre = obtenerNombre(item, 'Cliente sin nombre');
    const actual = mapa.get(nombre) || 0;
    mapa.set(nombre, actual + montoVenta(item));
  });

  return [...mapa.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
};

export default function DashboardCRM() {
  const {
    empresas = [],
    contactos = [],
    cotizaciones = [],
    pedidos = [],
    ordenesTrabajo = [],
    produccion = [],
    cobros = [],
    comisiones = [],
    inventario = [],
    materiales = [],
    compras = [],
    cuentasPorCobrar = [],
    cuentasPorPagar = [],
    flujoCaja = [],
  } = useCore();

  const totalRegistros =
    empresas.length +
    contactos.length +
    cotizaciones.length +
    pedidos.length +
    ordenesTrabajo.length +
    produccion.length +
    cobros.length +
    comisiones.length +
    inventario.length +
    materiales.length +
    compras.length +
    cuentasPorCobrar.length +
    cuentasPorPagar.length +
    flujoCaja.length;

  const metricas = useMemo(() => {
    const ventasTotales = sumar(cobros, montoVenta);
    const cobrado = sumar(cobros, montoCobrado);
    const comprasTotales = sumar(compras, montoCompra);
    const porCobrar = sumar(cuentasPorCobrar, montoSaldo);
    const porPagar = sumar(cuentasPorPagar, montoSaldo);
    const comisionesTotales = sumar(comisiones, montoComision);

    const ingresosFlujo = sumar(
      flujoCaja.filter((item) => item.tipo === 'Ingreso'),
      montoFlujo
    );

    const egresosFlujo = sumar(
      flujoCaja.filter((item) => item.tipo === 'Egreso'),
      montoFlujo
    );

    const ivaDebitoTotal = sumar(cobros, ivaDebito) + sumar(cuentasPorCobrar, ivaDebito);
    const ivaCreditoTotal = sumar(compras, ivaCredito) + sumar(cuentasPorPagar, ivaCredito);

    const utilidadBruta = ventasTotales - comprasTotales;
    const utilidadNeta = utilidadBruta + ingresosFlujo - egresosFlujo - comisionesTotales;
    const flujoNeto = cobrado + ingresosFlujo - comprasTotales - egresosFlujo - comisionesTotales;

    const unidades = UNIDADES_NEGOCIO.map((unidad) => {
      const cobrosUnidad = cobros.filter((item) => unidadRegistro(item) === unidad);
      const comprasUnidad = compras.filter((item) => unidadRegistro(item) === unidad);
      const cxcUnidad = cuentasPorCobrar.filter((item) => unidadRegistro(item) === unidad);
      const cxpUnidad = cuentasPorPagar.filter((item) => unidadRegistro(item) === unidad);
      const comisionesUnidadLista = comisiones.filter((item) => unidadRegistro(item) === unidad);
      const produccionUnidadLista = produccion.filter((item) => unidadRegistro(item) === unidad);

      const ventas = sumar(cobrosUnidad, montoVenta);
      const comprasTotal = sumar(comprasUnidad, montoCompra);
      const comisionTotal = sumar(comisionesUnidadLista, montoComision);

      return {
        unidad,
        ventas,
        cobrado: sumar(cobrosUnidad, montoCobrado),
        compras: comprasTotal,
        porCobrar: sumar(cxcUnidad, montoSaldo),
        porPagar: sumar(cxpUnidad, montoSaldo),
        produccionActiva: contarPorEstado(produccionUnidadLista, [
          'pendiente',
          'proceso',
          'produccion',
          'fabricacion',
          'activo',
        ]),
        comisiones: comisionTotal,
        utilidad: ventas - comprasTotal - comisionTotal,
      };
    }).sort((a, b) => b.ventas - a.ventas);

    return {
      ventasTotales,
      cobrado,
      comprasTotales,
      porCobrar,
      porPagar,
      comisionesTotales,
      ingresosFlujo,
      egresosFlujo,
      flujoNeto,
      utilidadBruta,
      utilidadNeta,
      ivaDebitoTotal,
      ivaCreditoTotal,
      ivaNeto: ivaDebitoTotal - ivaCreditoTotal,
      unidades,
      topClientes: rankingClientes(cobros, cuentasPorCobrar),
    };
  }, [
    cobros,
    compras,
    cuentasPorCobrar,
    cuentasPorPagar,
    comisiones,
    flujoCaja,
    produccion,
  ]);

  const cotizacionesAbiertas = contarPorEstado(cotizaciones, [
    'abierta',
    'pendiente',
    'enviada',
    'revision',
  ]);

  const pedidosActivos = contarPorEstado(pedidos, [
    'activo',
    'pendiente',
    'aprobado',
    'proceso',
  ]);

  const otPendientes = contarPorEstado(ordenesTrabajo, [
    'pendiente',
    'proceso',
    'abierta',
    'produccion',
  ]);

  const produccionActiva = contarPorEstado(produccion, [
    'pendiente',
    'proceso',
    'produccion',
    'fabricacion',
    'activo',
  ]);

  const cobrosPendientes = contarPorEstado(cobros, [
    'pendiente',
    'parcial',
    'credito',
    'por cobrar',
  ]);

  const kpisFinancieros = [
    {
      titulo: 'Ventas totales',
      valor: moneda(metricas.ventasTotales),
      descripcion: 'Total facturado o registrado en cobros',
      icono: 'ðŸ“ˆ',
      color: '#059669',
      fondo: '#ECFDF5',
    },
    {
      titulo: 'Cobrado',
      valor: moneda(metricas.cobrado),
      descripcion: 'Dinero recuperado segun cobros',
      icono: 'ðŸ’°',
      color: '#16A34A',
      fondo: '#F0FDF4',
    },
    {
      titulo: 'Por cobrar',
      valor: moneda(metricas.porCobrar),
      descripcion: 'Saldo pendiente de clientes',
      icono: 'ðŸ“Œ',
      color: '#D97706',
      fondo: '#FFFBEB',
    },
    {
      titulo: 'Por pagar',
      valor: moneda(metricas.porPagar),
      descripcion: 'Compromisos pendientes con proveedores',
      icono: 'ðŸ“‰',
      color: '#DC2626',
      fondo: '#FEF2F2',
    },
    {
      titulo: 'Utilidad bruta',
      valor: moneda(metricas.utilidadBruta),
      descripcion: 'Ventas menos compras registradas',
      icono: 'ðŸ—ï¸',
      color: '#2563EB',
      fondo: '#EFF6FF',
    },
    {
      titulo: 'Utilidad neta',
      valor: moneda(metricas.utilidadNeta),
      descripcion: 'Bruta + flujo - egresos - comisiones',
      icono: 'âœ…',
      color: '#7C3AED',
      fondo: '#F5F3FF',
    },
    {
      titulo: 'IVA neto estimado',
      valor: moneda(metricas.ivaNeto),
      descripcion: 'Debito fiscal menos credito fiscal',
      icono: 'ðŸ§¾',
      color: '#9333EA',
      fondo: '#FAF5FF',
    },
    {
      titulo: 'Produccion activa',
      valor: formatoNumero(produccionActiva),
      descripcion: 'Trabajos en proceso o pendientes',
      icono: 'ðŸ­',
      color: '#EA580C',
      fondo: '#FFF7ED',
    },
  ];

  const kpisOperativos = [
    { titulo: 'Empresas', valor: empresas.length, icono: 'ðŸ¢', area: 'CRM' },
    { titulo: 'Contactos', valor: contactos.length, icono: 'ðŸ‘¤', area: 'CRM' },
    { titulo: 'Cotizaciones', valor: cotizaciones.length, icono: 'ðŸ“„', area: 'Ventas' },
    { titulo: 'Pedidos', valor: pedidos.length, icono: 'ðŸ›’', area: 'Ventas' },
    { titulo: 'Ã“rdenes Trabajo', valor: ordenesTrabajo.length, icono: 'ðŸ”§', area: 'Operacion' },
    { titulo: 'Produccion', valor: produccion.length, icono: 'ðŸ­', area: 'Operacion' },
    { titulo: 'Cobros', valor: cobros.length, icono: 'ðŸ’°', area: 'Finanzas' },
    { titulo: 'Compras', valor: compras.length, icono: 'ðŸ§¾', area: 'ERP' },
    { titulo: 'CxC', valor: cuentasPorCobrar.length, icono: 'ðŸ“ˆ', area: 'Finanzas' },
    { titulo: 'CxP', valor: cuentasPorPagar.length, icono: 'ðŸ“‰', area: 'Finanzas' },
    { titulo: 'Inventario', valor: inventario.length, icono: 'ðŸ“¦', area: 'Inventario' },
    { titulo: 'Materiales', valor: materiales.length, icono: 'ðŸ§±', area: 'Inventario' },
  ];

  const indicadores = [
    {
      titulo: 'Cotizaciones abiertas',
      valor: cotizacionesAbiertas,
      descripcion: 'Pendientes de aprobacion o revision',
      icono: 'ðŸ“Œ',
    },
    {
      titulo: 'Pedidos activos',
      valor: pedidosActivos,
      descripcion: 'Pedidos en seguimiento operativo',
      icono: 'ðŸ§¾',
    },
    {
      titulo: 'OT pendientes',
      valor: otPendientes,
      descripcion: 'Ã“rdenes listas para taller o instalacion',
      icono: 'ðŸ› ï¸',
    },
    {
      titulo: 'Produccion activa',
      valor: produccionActiva,
      descripcion: 'Trabajos en proceso de fabricacion',
      icono: 'ðŸ—ï¸',
    },
    {
      titulo: 'Cobros pendientes',
      valor: cobrosPendientes,
      descripcion: 'Cuentas por cobrar o pagos parciales',
      icono: 'ðŸ’³',
    },
  ];

  const actividades = ordenarRecientes([
    ...empresas.map((item) => ({ ...item, modulo: 'Empresa', icono: 'ðŸ¢' })),
    ...contactos.map((item) => ({ ...item, modulo: 'Contacto', icono: 'ðŸ‘¤' })),
    ...cotizaciones.map((item) => ({ ...item, modulo: 'Cotizacion', icono: 'ðŸ“„' })),
    ...pedidos.map((item) => ({ ...item, modulo: 'Pedido', icono: 'ðŸ›’' })),
    ...ordenesTrabajo.map((item) => ({ ...item, modulo: 'Orden de Trabajo', icono: 'ðŸ”§' })),
    ...produccion.map((item) => ({ ...item, modulo: 'Produccion', icono: 'ðŸ­' })),
    ...cobros.map((item) => ({ ...item, modulo: 'Cobro', icono: 'ðŸ’°' })),
    ...compras.map((item) => ({ ...item, modulo: 'Compra', icono: 'ðŸ§¾' })),
    ...cuentasPorCobrar.map((item) => ({ ...item, modulo: 'Cuenta por Cobrar', icono: 'ðŸ“ˆ' })),
    ...cuentasPorPagar.map((item) => ({ ...item, modulo: 'Cuenta por Pagar', icono: 'ðŸ“‰' })),
    ...comisiones.map((item) => ({ ...item, modulo: 'Comision', icono: 'ðŸ’µ' })),
    ...inventario.map((item) => ({ ...item, modulo: 'Inventario', icono: 'ðŸ“¦' })),
    ...materiales.map((item) => ({ ...item, modulo: 'Material', icono: 'ðŸ§±' })),
  ]).slice(0, 8);

  const alertas = [
    totalRegistros === 0
      ? 'El CRM esta listo, pero todavia no hay registros operativos.'
      : null,
    empresas.length > 0 && contactos.length === 0
      ? 'Hay empresas registradas sin contactos asociados.'
      : null,
    cotizaciones.length > 0 && pedidos.length === 0
      ? 'Hay cotizaciones registradas, pero todavia no se han convertido en pedidos.'
      : null,
    pedidos.length > 0 && ordenesTrabajo.length === 0
      ? 'Hay pedidos registrados pendientes de orden de trabajo.'
      : null,
    ordenesTrabajo.length > 0 && produccion.length === 0
      ? 'Hay ordenes de trabajo pendientes de produccion.'
      : null,
    produccion.length > 0 && cobros.length === 0
      ? 'Hay produccion registrada sin cobros asociados.'
      : null,
    metricas.porCobrar > 0
      ? `Hay ${moneda(metricas.porCobrar)} pendiente por cobrar.`
      : null,
    metricas.porPagar > 0
      ? `Hay ${moneda(metricas.porPagar)} pendiente por pagar.`
      : null,
    metricas.ivaNeto > 0
      ? `IVA neto estimado a favor de DGI: ${moneda(metricas.ivaNeto)}.`
      : null,
  ].filter(Boolean);

  const unidades = [
    { nombre: 'ELANVISUAL', estado: 'Publicado / operativo', icono: 'ðŸ¾' },
    { nombre: 'ELANVISUAL', estado: 'Rotulacion, impresion y publicidad visual', icono: 'ðŸŽ¨' },
    { nombre: 'ELANKAV CENTER', estado: 'Construccion, remodelacion y proyectos especiales', icono: 'ðŸ—ï¸' },
    { nombre: 'ELANHOME', estado: 'Energia solar y bombeo', icono: 'â˜€ï¸' },
    { nombre: 'ELAN AI', estado: 'CRM, ERP, IA y automatizacion', icono: 'ðŸ¤–' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.preTitulo}>FASE 5.3 - Dashboard Ejecutivo Corporativo</p>
          <h1 style={styles.titulo}>CRM CENTRAL ELANKAV</h1>
          <p style={styles.subtitulo}>
            Control maestro de ventas, cobros, cuentas, utilidad, fiscalidad, produccion y unidades oficiales de ELANKAV GROUP.
          </p>
        </div>

        <div style={styles.resumenPrincipal}>
          <span style={styles.resumenLabel}>Registros totales</span>
          <strong style={styles.resumenNumero}>{formatoNumero(totalRegistros)}</strong>
          <span style={styles.resumenTexto}>Base operativa activa</span>
        </div>
      </div>

      <div style={styles.finanzasGrid}>
        {kpisFinancieros.map((card) => (
          <div
            key={card.titulo}
            style={{
              ...styles.kpiFinanciero,
              background: card.fondo,
              borderLeft: `5px solid ${card.color}`,
            }}
          >
            <div style={styles.kpiTop}>
              <span style={styles.kpiIcono}>{card.icono}</span>
              <span style={{ ...styles.kpiArea, color: card.color }}>Ejecutivo</span>
            </div>
            <div style={styles.kpiTitulo}>{card.titulo}</div>
            <div style={{ ...styles.kpiValorMoneda, color: card.color }}>{card.valor}</div>
            <p style={styles.kpiDescripcion}>{card.descripcion}</p>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        <section style={styles.panelGrande}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Cadena Operativa</h2>
              <p style={styles.sectionText}>Flujo completo desde cliente hasta comision.</p>
            </div>
          </div>

          <div style={styles.flujo}>
            {[
              ['ðŸ¢', 'Empresa'],
              ['ðŸ‘¤', 'Contacto'],
              ['ðŸ“„', 'Cotizacion'],
              ['ðŸ›’', 'Pedido'],
              ['ðŸ”§', 'OT'],
              ['ðŸ­', 'Produccion'],
              ['ðŸ’°', 'Cobro'],
              ['ðŸ’µ', 'Comision'],
            ].map((paso, index, lista) => (
              <React.Fragment key={paso[1]}>
                <div style={styles.pasoFlujo}>
                  <span style={styles.pasoIcono}>{paso[0]}</span>
                  <span>{paso[1]}</span>
                </div>
                {index < lista.length - 1 && <span style={styles.flecha}>â†’</span>}
              </React.Fragment>
            ))}
          </div>

          <div style={styles.indicadorGrid}>
            {indicadores.map((item) => (
              <div key={item.titulo} style={styles.indicadorCard}>
                <span style={styles.indicadorIcono}>{item.icono}</span>
                <div>
                  <strong style={styles.indicadorValor}>{formatoNumero(item.valor)}</strong>
                  <p style={styles.indicadorTitulo}>{item.titulo}</p>
                  <small style={styles.indicadorDescripcion}>{item.descripcion}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside style={styles.panel}>
          <h2 style={styles.sectionTitle}>Alertas Ejecutivas</h2>
          <p style={styles.sectionText}>Lectura rapida de riesgo operativo, financiero y fiscal.</p>

          <div style={styles.alertasBox}>
            {alertas.length === 0 ? (
              <div style={styles.alertaOk}>âœ… No hay alertas criticas por ahora.</div>
            ) : (
              alertas.map((alerta) => (
                <div key={alerta} style={styles.alertaItem}>
                  âš ï¸ {alerta}
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <div style={styles.panel}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Ranking por Unidad de Negocio</h2>
            <p style={styles.sectionText}>Comparativo ejecutivo por ventas, cobros, cuentas, produccion y utilidad.</p>
          </div>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Unidad</th>
                <th style={styles.th}>Ventas</th>
                <th style={styles.th}>Cobrado</th>
                <th style={styles.th}>Compras</th>
                <th style={styles.th}>Por cobrar</th>
                <th style={styles.th}>Por pagar</th>
                <th style={styles.th}>Produccion activa</th>
                <th style={styles.th}>Comisiones</th>
                <th style={styles.th}>Utilidad estimada</th>
              </tr>
            </thead>
            <tbody>
              {metricas.unidades.map((item) => (
                <tr key={item.unidad}>
                  <td style={styles.td}><strong>{item.unidad}</strong></td>
                  <td style={styles.td}>{moneda(item.ventas)}</td>
                  <td style={styles.td}>{moneda(item.cobrado)}</td>
                  <td style={styles.td}>{moneda(item.compras)}</td>
                  <td style={styles.td}>{moneda(item.porCobrar)}</td>
                  <td style={styles.td}>{moneda(item.porPagar)}</td>
                  <td style={styles.td}>{formatoNumero(item.produccionActiva)}</td>
                  <td style={styles.td}>{moneda(item.comisiones)}</td>
                  <td style={styles.td}><strong>{moneda(item.utilidad)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        {kpisOperativos.map((card) => (
          <div key={card.titulo} style={styles.kpiCard}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiIcono}>{card.icono}</span>
              <span style={styles.kpiArea}>{card.area}</span>
            </div>

            <div style={styles.kpiTitulo}>{card.titulo}</div>
            <div style={styles.kpiValor}>{formatoNumero(card.valor)}</div>
          </div>
        ))}
      </div>

      <div style={styles.bottomGrid}>
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Top Clientes</h2>
          <p style={styles.sectionText}>Clientes con mayor movimiento registrado.</p>

          <div style={styles.actividadLista}>
            {metricas.topClientes.length === 0 ? (
              <p style={styles.vacio}>Todavia no hay clientes con ventas registradas.</p>
            ) : (
              metricas.topClientes.map((cliente, index) => (
                <div key={cliente.nombre} style={styles.actividadItem}>
                  <span style={styles.actividadIcono}>#{index + 1}</span>
                  <div>
                    <strong>{cliente.nombre}</strong>
                    <p style={styles.actividadTexto}>{moneda(cliente.total)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Ãšltimas actividades</h2>
          <p style={styles.sectionText}>Preparado para auditoria y seguimiento multiusuario.</p>

          <div style={styles.actividadLista}>
            {actividades.length === 0 ? (
              <p style={styles.vacio}>Todavia no hay actividad registrada.</p>
            ) : (
              actividades.map((actividad, index) => (
                <div key={`${actividad.id || actividad.modulo}-${index}`} style={styles.actividadItem}>
                  <span style={styles.actividadIcono}>{actividad.icono}</span>
                  <div>
                    <strong>{actividad.modulo}</strong>
                    <p style={styles.actividadTexto}>
                      {obtenerNombre(actividad, `Registro ${index + 1}`)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>Unidades ELANKAV</h2>
          <p style={styles.sectionText}>Estructura oficial activa del grupo empresarial.</p>

          <div style={styles.unidadesLista}>
            {unidades.map((unidad) => (
              <div key={unidad.nombre} style={styles.unidadItem}>
                <span style={styles.unidadIcono}>{unidad.icono}</span>
                <div>
                  <strong>{unidad.nombre}</strong>
                  <p style={styles.unidadEstado}>{unidad.estado}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: '22px',
    background: '#F3F4F6',
    minHeight: '100vh',
    color: '#111827',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: '18px',
    flexWrap: 'wrap',
    marginBottom: '18px',
  },
  preTitulo: {
    margin: '0 0 6px',
    color: '#6B7280',
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  titulo: {
    margin: 0,
    fontSize: '30px',
    lineHeight: 1.1,
  },
  subtitulo: {
    margin: '8px 0 0',
    color: '#6B7280',
    maxWidth: '780px',
  },
  resumenPrincipal: {
    background: '#111827',
    color: '#fff',
    borderRadius: '18px',
    padding: '18px 22px',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    boxShadow: '0 12px 30px rgba(17,24,39,0.18)',
  },
  resumenLabel: {
    fontSize: '12px',
    color: '#D1D5DB',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  resumenNumero: {
    fontSize: '34px',
    marginTop: '4px',
  },
  resumenTexto: {
    color: '#D1D5DB',
    fontSize: '13px',
  },
  finanzasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  kpiFinanciero: {
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 8px 22px rgba(15,23,42,0.07)',
    minHeight: '148px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  kpiCard: {
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 8px 22px rgba(15,23,42,0.07)',
    minHeight: '126px',
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  kpiIcono: {
    fontSize: '25px',
  },
  kpiArea: {
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#6B7280',
  },
  kpiTitulo: {
    fontSize: '13px',
    color: '#4B5563',
    fontWeight: 700,
  },
  kpiValor: {
    fontSize: '31px',
    fontWeight: 900,
    marginTop: '3px',
    color: '#111827',
  },
  kpiValorMoneda: {
    fontSize: '24px',
    fontWeight: 950,
    marginTop: '5px',
  },
  kpiDescripcion: {
    margin: '7px 0 0',
    color: '#6B7280',
    fontSize: '12px',
    lineHeight: 1.35,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 0.8fr)',
    gap: '18px',
    marginBottom: '18px',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
  },
  panelGrande: {
    background: '#fff',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
  },
  panel: {
    background: '#fff',
    borderRadius: '18px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
    marginBottom: '18px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
  },
  sectionText: {
    margin: '6px 0 16px',
    color: '#6B7280',
    fontSize: '13px',
  },
  flujo: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '18px',
  },
  pasoFlujo: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '999px',
    padding: '9px 12px',
    fontSize: '13px',
    fontWeight: 700,
  },
  pasoIcono: {
    fontSize: '18px',
  },
  flecha: {
    color: '#9CA3AF',
    fontWeight: 900,
  },
  indicadorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '12px',
  },
  indicadorCard: {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '14px',
    padding: '14px',
    display: 'flex',
    gap: '12px',
  },
  indicadorIcono: {
    fontSize: '23px',
  },
  indicadorValor: {
    fontSize: '24px',
    color: '#111827',
  },
  indicadorTitulo: {
    margin: '2px 0',
    fontWeight: 800,
    fontSize: '13px',
  },
  indicadorDescripcion: {
    color: '#6B7280',
    fontSize: '12px',
  },
  alertasBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  alertaItem: {
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    color: '#92400E',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '13px',
    lineHeight: 1.35,
  },
  alertaOk: {
    background: '#ECFDF5',
    border: '1px solid #A7F3D0',
    color: '#047857',
    borderRadius: '12px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1040px',
  },
  th: {
    textAlign: 'left',
    padding: '11px',
    background: '#F3F6FB',
    color: '#374151',
    fontSize: '12px',
    borderBottom: '1px solid #E5E7EB',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px',
    borderBottom: '1px solid #E5E7EB',
    fontSize: '13px',
    verticalAlign: 'top',
    whiteSpace: 'nowrap',
  },
  actividadLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  actividadItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '11px',
    borderRadius: '12px',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
  },
  actividadIcono: {
    fontSize: '20px',
    minWidth: '34px',
    fontWeight: 900,
    color: '#123F7A',
  },
  actividadTexto: {
    margin: '3px 0 0',
    color: '#6B7280',
    fontSize: '13px',
  },
  vacio: {
    margin: 0,
    color: '#6B7280',
    fontSize: '13px',
  },
  unidadesLista: {
    display: 'grid',
    gap: '10px',
  },
  unidadItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '11px',
  },
  unidadIcono: {
    fontSize: '20px',
  },
  unidadEstado: {
    margin: '2px 0 0',
    color: '#6B7280',
    fontSize: '12px',
  },
};

