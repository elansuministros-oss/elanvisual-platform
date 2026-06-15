import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const UNIDADES_NEGOCIO = [
  'ELANVISUAL',
  'ELANVISUAL',
  'ELANKAV CENTER',
  'ELANHOME',
  'ELAN AI',
];

const MONEDAS = ['C$', 'USD'];

const fechaActual = () => new Date().toISOString().slice(0, 10);

const numero = (valor) => Number(valor || 0);

const dinero = (valor, moneda = 'C$') => {
  const currency = moneda === 'USD' ? 'USD' : 'NIO';

  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numero(valor));
};

const porcentaje = (valor) => `${numero(valor).toFixed(2)}%`;

const calcularCostos = (datos = {}) => {
  const venta = numero(datos.total || datos.valorVenta || datos.precioVenta);
  const materiales = numero(datos.costoMateriales);
  const manoObra = numero(datos.costoManoObra);
  const transporte = numero(datos.costoTransporte);
  const instalacion = numero(datos.costoInstalacion);
  const otros = numero(datos.otrosCostos);

  const costoTotal = materiales + manoObra + transporte + instalacion + otros;
  const utilidad = venta - costoTotal;
  const margen = venta > 0 ? (utilidad / venta) * 100 : 0;

  return {
    venta,
    costoTotal,
    utilidad,
    margen,
  };
};

const formInicial = () => ({
  codigo: '',
  pedidoId: '',
  pedidoCodigo: '',
  cotizacionId: '',
  cotizacionCodigo: '',
  empresaId: '',
  empresaNombre: '',
  contactoId: '',
  contactoNombre: '',
  cliente: '',
  telefono: '',
  producto: '',
  unidadNegocio: 'ELANVISUAL',
  cantidad: '',
  total: '',
  moneda: 'C$',
  responsable: '',
  area: 'Produccion',
  prioridad: 'Media',
  estado: 'Pendiente',
  fechaInicio: fechaActual(),
  fechaEntrega: '',
  descripcion: '',
  materiales: '',
  medidas: '',
  costoMateriales: '',
  costoManoObra: '',
  costoTransporte: '',
  costoInstalacion: '',
  otrosCostos: '',
  observaciones: '',
});

export default function OrdenesTrabajo() {
  const {
    pedidos,
    ordenesTrabajo,
    crearOrdenTrabajo,
    actualizarOrdenTrabajo,
    eliminarOrdenTrabajo,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formInicial());
  const [busqueda, setBusqueda] = useState('');

  const pedidosDisponibles = useMemo(() => {
    return pedidos.filter((pedido) => {
      const estado = pedido.estado || '';
      return estado !== 'Cancelado' && estado !== 'Anulado';
    });
  }, [pedidos]);

  const resumen = useMemo(() => {
    return ordenesTrabajo.reduce(
      (acc, item) => {
        const calculo = calcularCostos(item);
        acc.venta += calculo.venta;
        acc.costo += calculo.costoTotal;
        acc.utilidad += calculo.utilidad;

        if (['Pendiente', 'En proceso', 'Produccion'].includes(item.estado)) {
          acc.activas += 1;
        }

        if (item.estado === 'Terminada') {
          acc.terminadas += 1;
        }

        return acc;
      },
      { venta: 0, costo: 0, utilidad: 0, activas: 0, terminadas: 0 }
    );
  }, [ordenesTrabajo]);

  const ordenesFiltradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return ordenesTrabajo;

    return ordenesTrabajo.filter((item) => {
      return [
        item.codigo,
        item.cliente,
        item.empresaNombre,
        item.producto,
        item.unidadNegocio,
        item.estado,
        item.responsable,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });
  }, [ordenesTrabajo, busqueda]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      if (name === 'pedidoId') {
        const pedidoSeleccionado = pedidos.find((pedido) => pedido.id === value);

        if (!pedidoSeleccionado) {
          return {
            ...prev,
            pedidoId: '',
            pedidoCodigo: '',
            cotizacionId: '',
            cotizacionCodigo: '',
            empresaId: '',
            empresaNombre: '',
            contactoId: '',
            contactoNombre: '',
            cliente: '',
            telefono: '',
            producto: '',
            total: '',
          };
        }

        return {
          ...prev,
          pedidoId: pedidoSeleccionado.id,
          pedidoCodigo: pedidoSeleccionado.codigo || '',
          cotizacionId: pedidoSeleccionado.cotizacionId || '',
          cotizacionCodigo: pedidoSeleccionado.cotizacionCodigo || '',
          empresaId: pedidoSeleccionado.empresaId || '',
          empresaNombre:
            pedidoSeleccionado.empresaNombre ||
            pedidoSeleccionado.cliente ||
            pedidoSeleccionado.empresa ||
            '',
          contactoId: pedidoSeleccionado.contactoId || '',
          contactoNombre: pedidoSeleccionado.contactoNombre || pedidoSeleccionado.contacto || '',
          cliente:
            pedidoSeleccionado.cliente ||
            pedidoSeleccionado.empresaNombre ||
            pedidoSeleccionado.empresa ||
            '',
          telefono: pedidoSeleccionado.telefono || pedidoSeleccionado.whatsapp || '',
          producto: pedidoSeleccionado.producto || pedidoSeleccionado.descripcion || '',
          unidadNegocio: pedidoSeleccionado.unidadNegocio || prev.unidadNegocio,
          cantidad: pedidoSeleccionado.cantidad || prev.cantidad,
          total: pedidoSeleccionado.total || pedidoSeleccionado.monto || prev.total,
          moneda: pedidoSeleccionado.moneda || prev.moneda,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const limpiar = () => {
    setForm(formInicial());
    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.producto.trim() && !form.descripcion.trim()) return;

    const calculo = calcularCostos(form);

    const datos = {
      ...form,
      id: editandoId || form.id,
      codigo: form.codigo.trim() || `OT-${Date.now()}`,
      cliente: form.cliente.trim(),
      producto: form.producto.trim(),
      descripcion: form.descripcion.trim(),
      responsable: form.responsable.trim(),
      materiales: form.materiales.trim(),
      medidas: form.medidas.trim(),
      observaciones: form.observaciones.trim(),
      cantidad: numero(form.cantidad),
      total: numero(form.total),
      costoMateriales: numero(form.costoMateriales),
      costoManoObra: numero(form.costoManoObra),
      costoTransporte: numero(form.costoTransporte),
      costoInstalacion: numero(form.costoInstalacion),
      otrosCostos: numero(form.otrosCostos),
      costoTotal: calculo.costoTotal,
      utilidadEstimada: calculo.utilidad,
      margenEstimado: calculo.margen,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarOrdenTrabajo(editandoId, datos);
    } else {
      crearOrdenTrabajo(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm({
      ...formInicial(),
      ...item,
      total: item.total ?? '',
      cantidad: item.cantidad ?? '',
      costoMateriales: item.costoMateriales ?? '',
      costoManoObra: item.costoManoObra ?? '',
      costoTransporte: item.costoTransporte ?? '',
      costoInstalacion: item.costoInstalacion ?? '',
      otrosCostos: item.otrosCostos ?? '',
    });
  };

  const eliminar = (id) => {
    eliminarOrdenTrabajo(id);
    if (editandoId === id) limpiar();
  };

  const margenGeneral = resumen.venta > 0 ? (resumen.utilidad / resumen.venta) * 100 : 0;

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Ã“rdenes de Trabajo</h2>
          <p>Control operativo con costos estimados, utilidad y margen por proyecto.</p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Venta estimada</span>
          <strong>{dinero(resumen.venta)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Costo estimado</span>
          <strong>{dinero(resumen.costo)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Utilidad estimada</span>
          <strong>{dinero(resumen.utilidad)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Margen general</span>
          <strong>{porcentaje(margenGeneral)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Activas</span>
          <strong>{resumen.activas}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Terminadas</span>
          <strong>{resumen.terminadas}</strong>
        </div>
      </div>

      <div className="crm-card">
        <h3>{editandoId ? 'Editar orden de trabajo' : 'Nueva orden de trabajo'}</h3>

        <form onSubmit={guardar} className="crm-form-grid">
          <label>
            Pedido relacionado
            <select name="pedidoId" value={form.pedidoId} onChange={cambiar}>
              <option value="">Sin pedido relacionado</option>
              {pedidosDisponibles.map((pedido) => (
                <option key={pedido.id} value={pedido.id}>
                  {pedido.codigo || pedido.id} - {pedido.cliente || pedido.empresaNombre || 'Sin cliente'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Codigo OT
            <input name="codigo" value={form.codigo} onChange={cambiar} placeholder="Automatico" />
          </label>

          <label>
            Unidad de negocio
            <select name="unidadNegocio" value={form.unidadNegocio} onChange={cambiar}>
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </label>

          <label>
            Cliente
            <input name="cliente" value={form.cliente} onChange={cambiar} />
          </label>

          <label>
            Producto / trabajo
            <input name="producto" value={form.producto} onChange={cambiar} />
          </label>

          <label>
            Cantidad
            <input name="cantidad" type="number" step="0.01" value={form.cantidad} onChange={cambiar} />
          </label>

          <label>
            Moneda
            <select name="moneda" value={form.moneda} onChange={cambiar}>
              {MONEDAS.map((moneda) => (
                <option key={moneda} value={moneda}>{moneda}</option>
              ))}
            </select>
          </label>

          <label>
            Venta total
            <input name="total" type="number" step="0.01" value={form.total} onChange={cambiar} />
          </label>

          <label>
            Materiales
            <input name="costoMateriales" type="number" step="0.01" value={form.costoMateriales} onChange={cambiar} />
          </label>

          <label>
            Mano de obra
            <input name="costoManoObra" type="number" step="0.01" value={form.costoManoObra} onChange={cambiar} />
          </label>

          <label>
            Transporte
            <input name="costoTransporte" type="number" step="0.01" value={form.costoTransporte} onChange={cambiar} />
          </label>

          <label>
            Instalacion
            <input name="costoInstalacion" type="number" step="0.01" value={form.costoInstalacion} onChange={cambiar} />
          </label>

          <label>
            Otros costos
            <input name="otrosCostos" type="number" step="0.01" value={form.otrosCostos} onChange={cambiar} />
          </label>

          <label>
            Responsable
            <input name="responsable" value={form.responsable} onChange={cambiar} />
          </label>

          <label>
            Ãrea
            <select name="area" value={form.area} onChange={cambiar}>
              <option value="Diseno">Diseno</option>
              <option value="Produccion">Produccion</option>
              <option value="Instalacion">Instalacion</option>
              <option value="Administracion">Administracion</option>
            </select>
          </label>

          <label>
            Prioridad
            <select name="prioridad" value={form.prioridad} onChange={cambiar}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Produccion">Produccion</option>
              <option value="Terminada">Terminada</option>
              <option value="Entregada">Entregada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </label>

          <label>
            Fecha inicio
            <input name="fechaInicio" type="date" value={form.fechaInicio} onChange={cambiar} />
          </label>

          <label>
            Fecha entrega
            <input name="fechaEntrega" type="date" value={form.fechaEntrega} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Descripcion
            <textarea name="descripcion" value={form.descripcion} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Materiales previstos
            <textarea name="materiales" value={form.materiales} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Medidas
            <textarea name="medidas" value={form.medidas} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={cambiar} />
          </label>

          <div className="crm-field-full crm-cost-box">
            <strong>Resumen de costos</strong>
            <span>Venta: {dinero(calcularCostos(form).venta, form.moneda)}</span>
            <span>Costo: {dinero(calcularCostos(form).costoTotal, form.moneda)}</span>
            <span>Utilidad: {dinero(calcularCostos(form).utilidad, form.moneda)}</span>
            <span>Margen: {porcentaje(calcularCostos(form).margen)}</span>
          </div>

          <div className="crm-actions crm-field-full">
            <button type="submit">{editandoId ? 'Actualizar orden' : 'Crear orden'}</button>
            {editandoId && (
              <button type="button" onClick={limpiar} className="btn-secondary">
                Cancelar edicion
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="crm-card">
        <div className="crm-page-header">
          <div>
            <h3>Listado de ordenes</h3>
            <p>Seguimiento de venta, costo, utilidad y margen.</p>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar orden..."
          />
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Cliente</th>
                <th>Trabajo</th>
                <th>Unidad</th>
                <th>Venta</th>
                <th>Costo</th>
                <th>Utilidad</th>
                <th>Margen</th>
                <th>Estado</th>
                <th>Entrega</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((item) => {
                const calculo = calcularCostos(item);

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>{item.cliente || item.empresaNombre || 'Sin cliente'}</td>
                    <td>{item.producto || item.descripcion || 'Sin descripcion'}</td>
                    <td>{item.unidadNegocio || 'ELANVISUAL'}</td>
                    <td>{dinero(calculo.venta, item.moneda)}</td>
                    <td>{dinero(calculo.costoTotal, item.moneda)}</td>
                    <td>{dinero(calculo.utilidad, item.moneda)}</td>
                    <td>{porcentaje(calculo.margen)}</td>
                    <td>{item.estado || 'Pendiente'}</td>
                    <td>{item.fechaEntrega || 'Sin fecha'}</td>
                    <td>
                      <button type="button" onClick={() => editar(item)}>Editar</button>
                      <button type="button" className="btn-danger" onClick={() => eliminar(item.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {ordenesFiltradas.length === 0 && (
                <tr>
                  <td colSpan="11">No hay ordenes registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .crm-cost-box {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 14px;
        }
      `}</style>
    </div>
  );
}

