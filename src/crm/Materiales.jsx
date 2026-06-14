import React, { useMemo, useState } from 'react';
import { useCore } from '../core/context/CoreContext';

const CATEGORIAS = [
  'AcrÃ­lico',
  'PVC',
  'Vinil',
  'Lona',
  'LED',
  'Metal',
  'Madera',
  'Policarbonato',
  'Pintura',
  'Insumo',
  'Otro',
];

const UNIDADES = ['LÃ¡mina', 'Rollo', 'Metro', 'Metro cuadrado', 'Unidad', 'GalÃ³n', 'Caja'];
const MONEDAS = ['C$', 'USD'];

const numero = (valor) => Number(valor || 0);

const dinero = (valor, moneda = 'C$') => {
  const currency = moneda === 'USD' ? 'USD' : 'NIO';

  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numero(valor));
};

const formInicial = () => ({
  codigo: '',
  nombre: '',
  categoria: 'AcrÃ­lico',
  tipo: '',
  espesor: '',
  medida: '',
  unidad: 'LÃ¡mina',
  costo: '',
  costoPromedio: '',
  moneda: 'C$',
  proveedor: '',
  uso: '',
  stock: '',
  stockMinimo: '',
  rendimiento: '',
  costoPorUnidadUso: '',
  estado: 'Activo',
  observaciones: '',
});

export default function Materiales() {
  const {
    materiales,
    crearMaterial,
    actualizarMaterial,
    eliminarMaterial,
  } = useCore();

  const [editandoId, setEditandoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState(formInicial());

  const resumen = useMemo(() => {
    return materiales.reduce(
      (acc, item) => {
        const stock = numero(item.stock);
        const costo = numero(item.costoPromedio || item.costo);
        const valor = stock * costo;

        acc.items += 1;
        acc.valor += valor;

        if (stock <= numero(item.stockMinimo)) {
          acc.stockBajo += 1;
        }

        return acc;
      },
      { items: 0, valor: 0, stockBajo: 0 }
    );
  }, [materiales]);

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return materiales;

    return materiales.filter((item) =>
      [item.codigo, item.nombre, item.categoria, item.tipo, item.proveedor, item.uso, item.estado]
        .join(' ')
        .toLowerCase()
        .includes(texto)
    );
  }, [materiales, busqueda]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const nuevo = { ...prev, [name]: value };

      const costo = numero(name === 'costo' ? value : nuevo.costo);
      const rendimiento = numero(name === 'rendimiento' ? value : nuevo.rendimiento);

      if (rendimiento > 0) {
        nuevo.costoPorUnidadUso = (costo / rendimiento).toFixed(2);
      }

      return nuevo;
    });
  };

  const limpiar = () => {
    setForm(formInicial());
    setEditandoId(null);
  };

  const guardar = (e) => {
    e.preventDefault();

    if (!form.nombre.trim()) return;

    const costo = numero(form.costo);
    const costoPromedio = numero(form.costoPromedio || form.costo);
    const stock = numero(form.stock);
    const rendimiento = numero(form.rendimiento);
    const costoPorUnidadUso = rendimiento > 0 ? costo / rendimiento : numero(form.costoPorUnidadUso);

    const datos = {
      ...form,
      id: editandoId || form.id,
      codigo: form.codigo.trim() || `MAT-${Date.now()}`,
      nombre: form.nombre.trim(),
      tipo: form.tipo.trim(),
      espesor: form.espesor.trim(),
      medida: form.medida.trim(),
      proveedor: form.proveedor.trim(),
      uso: form.uso.trim(),
      observaciones: form.observaciones.trim(),
      costo,
      costoPromedio,
      stock,
      stockMinimo: numero(form.stockMinimo),
      rendimiento,
      costoPorUnidadUso,
      valorInventario: stock * costoPromedio,
      actualizado: new Date().toISOString(),
    };

    if (editandoId) {
      actualizarMaterial(editandoId, datos);
    } else {
      crearMaterial(datos);
    }

    limpiar();
  };

  const editar = (item) => {
    setEditandoId(item.id);
    setForm({
      ...formInicial(),
      ...item,
      costo: item.costo ?? '',
      costoPromedio: item.costoPromedio ?? '',
      stock: item.stock ?? '',
      stockMinimo: item.stockMinimo ?? '',
      rendimiento: item.rendimiento ?? '',
      costoPorUnidadUso: item.costoPorUnidadUso ?? '',
    });
  };

  const eliminar = (id) => {
    eliminarMaterial(id);
    if (editandoId === id) limpiar();
  };

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div>
          <h2>Materiales</h2>
          <p>Base tÃ©cnica para costos de producciÃ³n, rendimiento y control de stock.</p>
        </div>
      </div>

      <div className="crm-stats">
        <div className="crm-stat-card">
          <span>Materiales</span>
          <strong>{resumen.items}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Valor estimado</span>
          <strong>{dinero(resumen.valor)}</strong>
        </div>
        <div className="crm-stat-card">
          <span>Stock bajo</span>
          <strong>{resumen.stockBajo}</strong>
        </div>
      </div>

      <div className="crm-card">
        <h3>{editandoId ? 'Editar material' : 'Nuevo material'}</h3>

        <form onSubmit={guardar} className="crm-form-grid">
          <label>
            CÃ³digo
            <input name="codigo" value={form.codigo} onChange={cambiar} placeholder="AutomÃ¡tico" />
          </label>

          <label>
            Nombre
            <input name="nombre" value={form.nombre} onChange={cambiar} />
          </label>

          <label>
            CategorÃ­a
            <select name="categoria" value={form.categoria} onChange={cambiar}>
              {CATEGORIAS.map((categoria) => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </label>

          <label>
            Tipo
            <input name="tipo" value={form.tipo} onChange={cambiar} placeholder="Ej. lechoso, transparente, adhesivo" />
          </label>

          <label>
            Espesor
            <input name="espesor" value={form.espesor} onChange={cambiar} placeholder="Ej. 3 mm, 10 mm" />
          </label>

          <label>
            Medida
            <input name="medida" value={form.medida} onChange={cambiar} placeholder="Ej. 1.22 x 2.44 m" />
          </label>

          <label>
            Unidad
            <select name="unidad" value={form.unidad} onChange={cambiar}>
              {UNIDADES.map((unidad) => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </select>
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
            Costo compra
            <input name="costo" type="number" step="0.01" value={form.costo} onChange={cambiar} />
          </label>

          <label>
            Costo promedio
            <input name="costoPromedio" type="number" step="0.01" value={form.costoPromedio} onChange={cambiar} />
          </label>

          <label>
            Rendimiento
            <input name="rendimiento" type="number" step="0.01" value={form.rendimiento} onChange={cambiar} placeholder="Ãrea o unidades que rinde" />
          </label>

          <label>
            Costo por unidad de uso
            <input name="costoPorUnidadUso" type="number" step="0.01" value={form.costoPorUnidadUso} onChange={cambiar} />
          </label>

          <label>
            Stock
            <input name="stock" type="number" step="0.01" value={form.stock} onChange={cambiar} />
          </label>

          <label>
            Stock mÃ­nimo
            <input name="stockMinimo" type="number" step="0.01" value={form.stockMinimo} onChange={cambiar} />
          </label>

          <label>
            Proveedor
            <input name="proveedor" value={form.proveedor} onChange={cambiar} />
          </label>

          <label>
            Estado
            <select name="estado" value={form.estado} onChange={cambiar}>
              <option value="Activo">Activo</option>
              <option value="Reservado">Reservado</option>
              <option value="Agotado">Agotado</option>
              <option value="Descontinuado">Descontinuado</option>
            </select>
          </label>

          <label className="crm-field-full">
            Uso recomendado
            <textarea name="uso" value={form.uso} onChange={cambiar} />
          </label>

          <label className="crm-field-full">
            Observaciones
            <textarea name="observaciones" value={form.observaciones} onChange={cambiar} />
          </label>

          <div className="crm-field-full crm-cost-box">
            <strong>Resumen tÃ©cnico</strong>
            <span>Valor stock: {dinero(numero(form.stock) * numero(form.costoPromedio || form.costo), form.moneda)}</span>
            <span>Costo por unidad de uso: {dinero(form.costoPorUnidadUso, form.moneda)}</span>
          </div>

          <div className="crm-actions crm-field-full">
            <button type="submit">{editandoId ? 'Actualizar material' : 'Crear material'}</button>
            {editandoId && (
              <button type="button" onClick={limpiar} className="btn-secondary">
                Cancelar ediciÃ³n
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="crm-card">
        <div className="crm-page-header">
          <div>
            <h3>Listado de materiales</h3>
            <p>Costos base para presupuestos y producciÃ³n.</p>
          </div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar material..."
          />
        </div>

        <div className="crm-table-wrap">
          <table className="crm-table">
            <thead>
              <tr>
                <th>CÃ³digo</th>
                <th>Material</th>
                <th>CategorÃ­a</th>
                <th>Medida</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>Costo uso</th>
                <th>Valor stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => {
                const bajoStock = numero(item.stock) <= numero(item.stockMinimo);
                const costo = numero(item.costoPromedio || item.costo);
                const valor = numero(item.stock) * costo;

                return (
                  <tr key={item.id}>
                    <td>{item.codigo}</td>
                    <td>
                      <strong>{item.nombre}</strong>
                      <br />
                      <small>{item.tipo || 'Sin tipo'} Â· {item.espesor || 'Sin espesor'}</small>
                    </td>
                    <td>{item.categoria}</td>
                    <td>{item.medida || '-'}</td>
                    <td>
                      {numero(item.stock)} {item.unidad}
                      {bajoStock && (
                        <>
                          <br />
                          <small>Stock bajo</small>
                        </>
                      )}
                    </td>
                    <td>{dinero(costo, item.moneda)}</td>
                    <td>{dinero(item.costoPorUnidadUso, item.moneda)}</td>
                    <td>{dinero(valor, item.moneda)}</td>
                    <td>{item.estado}</td>
                    <td>
                      <button type="button" onClick={() => editar(item)}>Editar</button>
                      <button type="button" onClick={() => eliminar(item.id)} className="btn-danger">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="10">No hay materiales registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .crm-cost-box {
          display: grid;
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

