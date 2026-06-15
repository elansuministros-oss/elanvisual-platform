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
  ordenTrabajoId: '',
  ordenTrabajoCodigo: '',
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
  material: '',
  materiales: '',
  medidas: '',
  responsable: '',
  fechaInicio: fechaActual(),
  fechaEntrega: '',
  etapa: 'Pendiente',
  prioridad: 'Media',
  avance: '',
  costoMateriales: '',
  costoManoObra: '',
  costoTransporte: '',
  costoInstalacion: '',
  otrosCostos: '',
  nota: '',
});

export default function Produccion() {
  const {
    ordenesTrabajo,
    produccion,
    crearProduccion,
    actualizarProduccion,
    eliminarProduccion,
  } = useCore();

  const [formulario, setFormulario] = useState(formInicial());
  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  const ordenesTrabajoDisponibles = useMemo(() => {
    return ordenesTrabajo.filter((orden) => {
      const estado = orden.estado || '';
      return estado !== 'Cancelada' && estado !== 'Anulada';
    });
  }, [ordenesTrabajo]);

  const resumen = useMemo(() => {
    return produccion.reduce(
      (acc, item) => {
        const calculo = calcularCostos(item);
        acc.venta += calculo.venta;
        acc.costo += calculo.costoTotal;
        acc.utilidad += calculo.utilidad;

        if (['Pendiente', 'En proceso', 'Produccion', 'Fabricacion'].includes(item.etapa)) {
          acc.activa += 1;
        }

        if (['Terminada', 'Finalizada', 'Entregada'].includes(item.etapa)) {
          acc.terminada += 1;
        }

        return acc;
      },
      { venta: 0, costo: 0, utilidad: 0, activa: 0, terminada: 0 }
    );
  }, [produccion]);

  const produccionFiltrada = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return produccion;

    return produccion.filter((item) => {
      return [
        item.codigo,
        item.ordenTrabajoCodigo,
        item.cliente,
        item.empresaNombre,
        item.producto,
        item.unidadNegocio,
        item.etapa,
        item.responsable,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });
  }, [produccion, busqueda]);

  const cambiarFormulario = (e) => {
    const { name, value } = e.target;

    setFormulario((prev) => {
      if (name === 'ordenTrabajoId') {
        const ordenSeleccionada = ordenesTrabajo.find((orden) => orden.id === value);

        if (!ordenSeleccionada) {
          return {
            ...prev,
            ordenTrabajoId: '',
            ordenTrabajoCodigo: '',
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
            costoMateriales: '',
            costoManoObra: '',
            costoTransporte: '',
            costoInstalacion: '',
            otrosCostos: '',
          };
        }

        return {
          ...prev,
          ordenTrabajoId: ordenSeleccionada.id,
          ordenTrabajoCodigo: ordenSeleccionada.codigo || '',
          pedidoId: ordenSeleccionada.pedidoId || '',
          pedidoCodigo: ordenSeleccionada.pedidoCodigo || '',
          cotizacionId: ordenSeleccionada.cotizacionId || '',
          cotizacionCodigo: ordenSeleccionada.cotizacionCodigo || '',
          empresaId: ordenSeleccionada.empresaId || '',
          empresaNombre: ordenSeleccionada.empresaNombre || ordenSeleccionada.cliente || '',
          contactoId: ordenSeleccionada.contactoId || '',
          contactoNombre: ordenSeleccionada.contactoNombre || '',
          cliente: ordenSeleccionada.cliente || ordenSeleccionada.empresaNombre || '',
          telefono: ordenSeleccionada.telefono || '',
          producto: ordenSeleccionada.producto || ordenSeleccionada.descripcion || '',
          unidadNegocio: ordenSeleccionada.unidadNegocio || prev.unidadNegocio,
          cantidad: ordenSeleccionada.cantidad || prev.cantidad,
          total: ordenSeleccionada.total || prev.total,
          moneda: ordenSeleccionada.moneda || prev.moneda,
          materiales: ordenSeleccionada.materiales || prev.materiales,
          medidas: ordenSeleccionada.medidas || prev.medidas,
          costoMateriales: ordenSeleccionada.costoMateriales || prev.costoMateriales,
          costoManoObra: ordenSeleccionada.costoManoObra || prev.costoManoObra,
          costoTransporte: ordenSeleccionada.costoTransporte || prev.costoTransporte,
          costoInstalacion: ordenSeleccionada.costoInstalacion || prev.costoInstalacion,
          otrosCostos: ordenSeleccionada.otrosCostos || prev.otrosCostos,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const limpiar = () => {
    setFormulario(formInicial());
    setEditandoId(null);
  };

  const guardarProduccion = (e) => {
    e.preventDefault();

    if (!formulario.producto.trim()) return;

    const calculo = calcularCostos(formulario);

    const datos = {
      ...formulario,
      id: editandoId || formulario.id,
      codigo: formulario.codigo.trim() || `PROD-${Date.now()}`,
      cliente: formulario.cliente.trim(),
      producto: formulario.producto.trim(),
      responsable: formulario.responsable.trim(),
      material: formulario.material.trim(),
      materiales: formulario.materiales.trim(),
      medidas: formulario.medidas.trim(),
      nota: formulario.nota.trim(),
      cantidad: numero(formulario.cantidad),
      total: numero(formulario.total),
      avance: numero(formulario.avance),
      costoMateriales: numero(formulario.costoMateriales),
      costoManoObra: numero(formulario.costoManoObra),
      costoTransporte: numero(formulario.costoTransporte),
      costoInstalacion: numero(formulario.costoInstalacion),
      otrosCostos: numero(formulario.otrosCostos),
      costoTotal: calculo.costoTotal,
      utilidadReal: calculo.utilidad,
      margenReal: calculo.margen,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarProduccion(editandoId, datos);
    } else {
      crearProduccion(datos);
    }

    limpiar();
  };

  const editarOrden = (orden) => {
    setEditandoId(orden.id);
    setFormulario({
      ...formInicial(),
      ...orden,
      cantidad: orden.cantidad ?? '',
      total: orden.total ?? '',
      avance: orden.avance ?? '',
      costoMateriales: orden.costoMateriales ?? '',
      costoManoObra: orden.costoManoObra ?? '',
      costoTransporte: orden.costoTransporte ?? '',
      costoInstalacion: orden.costoInstalacion ?? '',
      otrosCostos: orden.otrosCostos ?? '',
    });
  };

  const eliminarOrden = (id) => {
    eliminarProduccion(id);
    if (editandoId === id) limpiar();
  };

  const margenGeneral = resumen.venta > 0 ? (resumen.utilidad / resumen.venta) * 100 : 0;

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Produccion</h2>
          <p>Control de fabricacion con costos reales, utilidad y margen por trabajo.</p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Venta producida</span>
          <strong>{dinero(resumen.venta)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Costo real</span>
          <strong>{dinero(resumen.costo)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Utilidad real</span>
          <strong>{dinero(resumen.utilidad)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Margen real</span>
          <strong>{porcentaje(margenGeneral)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Produccion activa</span>
          <strong>{resumen.activa}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Terminada</span>
          <strong>{resumen.terminada}</strong>
        </div>
      </div>

      <div className="crm-card">
        <h3>{editandoId ? 'Editar produccion' : 'Nueva produccion'}</h3>

        <form onSubmit={guardarProduccion} className="crm-form-grid">
          <label>
            Orden de trabajo
            <select name="ordenTrabajoId" value={formulario.ordenTrabajoId} onChange={cambiarFormulario}>
              <option value="">Sin orden relacionada</option>
              {ordenesTrabajoDisponibles.map((orden) => (
                <option key={orden.id} value={orden.id}>
                  {orden.codigo || orden.id} - {orden.cliente || orden.empresaNombre || 'Sin cliente'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Codigo produccion
            <input name="codigo" value={formulario.codigo} onChange={cambiarFormulario} placeholder="Automatico" />
          </label>

          <label>
            Unidad de negocio
            <select name="unidadNegocio" value={formulario.unidadNegocio} onChange={cambiarFormulario}>
              {UNIDADES_NEGOCIO.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
          </label>

          <label>
            Cliente
            <input name="cliente" value={formulario.cliente} onChange={cambiarFormulario} />
          </label>

          <label>
            Producto / trabajo
            <input name="producto" value={formulario.producto} onChange={cambiarFormulario} />
          </label>

          <label>
            Cantidad
            <input name="cantidad" type="number" step="0.01" value={formulario.cantidad} onChange={cambiarFormulario} />
          </label>

          <label>
            Moneda
            <select name="moneda" value={formulario.moneda} onChange={cambiarFormulario}>
              {MONEDAS.map((moneda) => (
                <option key={moneda} value={moneda}>{moneda}</option>
              ))}
            </select>
          </label>

          <label>
            Venta total
            <input name="total" type="number" step="0.01" value={formulario.total} onChange={cambiarFormulario} />
          </label>

          <label>
            Costo materiales
            <input name="costoMateriales" type="number" step="0.01" value={formulario.costoMateriales} onChange={cambiarFormulario} />
          </label>

          <label>
            Mano de obra
            <input name="costoManoObra" type="number" step="0.01" value={formulario.costoManoObra} onChange={cambiarFormulario} />
          </label>

          <label>
            Transporte
            <input name="costoTransporte" type="number" step="0.01" value={formulario.costoTransporte} onChange={cambiarFormulario} />
          </label>

          <label>
            Instalacion
            <input name="costoInstalacion" type="number" step="0.01" value={formulario.costoInstalacion} onChange={cambiarFormulario} />
          </label>

          <label>
            Otros costos
            <input name="otrosCostos" type="number" step="0.01" value={formulario.otrosCostos} onChange={cambiarFormulario} />
          </label>

          <label>
            Responsable
            <input name="responsable" value={formulario.responsable} onChange={cambiarFormulario} />
          </label>

          <label>
            Etapa
            <select name="etapa" value={formulario.etapa} onChange={cambiarFormulario}>
              <option value="Pendiente">Pendiente</option>
              <option value="Diseno">Diseno</option>
              <option value="Produccion">Produccion</option>
              <option value="Fabricacion">Fabricacion</option>
              <option value="Instalacion">Instalacion</option>
              <option value="Terminada">Terminada</option>
              <option value="Entregada">Entregada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </label>

          <label>
            Prioridad
            <select name="prioridad" value={formulario.prioridad} onChange={cambiarFormulario}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </label>

          <label>
            Avance %
            <input name="avance" type="number" step="1" min="0" max="100" value={formulario.avance} onChange={cambiarFormulario} />
          </label>

          <label>
            Fecha inicio
            <input name="fechaInicio" type="date" value={formulario.fechaInicio} onChange={cambiarFormulario} />
          </label>

          <label>
            Fecha entrega
            <input name="fechaEntrega" type="date" value={formulario.fechaEntrega} onChange={cambiarFormulario} />
          </label>

          <label className="crm-field-full">
            Materiales usados
            <textarea name="materiales" value={formulario.materiales} onChange={cambiarFormulario} />
          </label>

          <label className="crm-field-full">
            Medidas
            <textarea name="medidas" value={formulario.medidas} onChange={cambiarFormulario} />
          </label>

          <label className="crm-field-full">
            Nota de produccion
            <textarea name="nota" value={formulario.nota} onChange={cambiarFormulario} />
          </label>

          <div className="crm-field-full crm-cost-box">
            <strong>Resultado real del trabajo</strong>
            <span>Venta: {dinero(calcularCostos(formulario).venta, formulario.moneda)}</span>
            <span>Costo: {dinero(calcularCostos(formulario).costoTotal, formulario.moneda)}</span>
            <span>Utilidad: {dinero(calcularCostos(formulario).utilidad, formulario.moneda)}</span>
            <span>Margen: {porcentaje(calcularCostos(formulario).margen)}</span>
          </div>

          <div className="crm-actions crm-field-full">
            <button type="submit">{editandoId ? 'Actualizar produccion' : 'Crear produccion'}</button>
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
            <h3>Listado de produccion</h3>
            <p>Control real de fabricacion y rentabilidad.</p>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar produccion..."
          />
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>OT</th>
                <th>Cliente</th>
                <th>Trabajo</th>
                <th>Unidad</th>
                <th>Venta</th>
                <th>Costo</th>
                <th>Utilidad</th>
                <th>Margen</th>
                <th>Etapa</th>
                <th>Avance</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {produccionFiltrada.map((item) => {
                const calculo = calcularCostos(item);

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>{item.ordenTrabajoCodigo || 'Sin OT'}</td>
                    <td>{item.cliente || item.empresaNombre || 'Sin cliente'}</td>
                    <td>{item.producto || 'Sin producto'}</td>
                    <td>{item.unidadNegocio || 'ELANVISUAL'}</td>
                    <td>{dinero(calculo.venta, item.moneda)}</td>
                    <td>{dinero(calculo.costoTotal, item.moneda)}</td>
                    <td>{dinero(calculo.utilidad, item.moneda)}</td>
                    <td>{porcentaje(calculo.margen)}</td>
                    <td>{item.etapa || 'Pendiente'}</td>
                    <td>{numero(item.avance)}%</td>
                    <td>
                      <button type="button" onClick={() => editarOrden(item)}>Editar</button>
                      <button type="button" className="btn-danger" onClick={() => eliminarOrden(item.id)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {produccionFiltrada.length === 0 && (
                <tr>
                  <td colSpan="12">No hay produccion registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="crm-note">
          Produccion queda conectada con ordenes de trabajo y ahora controla costo real, utilidad real y margen.
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

