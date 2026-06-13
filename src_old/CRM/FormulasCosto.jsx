import React, { useEffect, useMemo, useState } from 'react';

const KEY = 'elanvisual_formulas_costo_v1';

export const formulasBaseElanvisual = {
  margenDefault: 35,
  desperdicioMaterial: 10,
  horasProduccionPorM2: 1,
  horasInstalacionPorM2: 1,
  distanciaKmDefault: 0,
  tecnicoInstalacion: 1,
  ayudantesInstalacion: 1,
  factorComplejidad: 1,
  estado: 'Activo',
};

export function leerFormulasCosto() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');

    if (data && typeof data === 'object') {
      return {
        ...formulasBaseElanvisual,
        ...data,
      };
    }

    localStorage.setItem(KEY, JSON.stringify(formulasBaseElanvisual));
    return formulasBaseElanvisual;
  } catch {
    return formulasBaseElanvisual;
  }
}

export function guardarFormulasCosto(formulas) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...formulasBaseElanvisual,
      ...formulas,
    })
  );
}

export function calcularPrecioVenta({
  materiales = 0,
  produccion = 0,
  instalacion = 0,
  transporte = 0,
  margen = formulasBaseElanvisual.margenDefault,
}) {
  const costoMateriales = Number(materiales || 0);
  const costoProduccion = Number(produccion || 0);
  const costoInstalacion = Number(instalacion || 0);
  const costoTransporte = Number(transporte || 0);
  const margenAplicado = Number(margen || 0);

  const costoBase =
    costoMateriales +
    costoProduccion +
    costoInstalacion +
    costoTransporte;

  const utilidad = (costoBase * margenAplicado) / 100;
  const precioVenta = costoBase + utilidad;

  return {
    costoMateriales,
    costoProduccion,
    costoInstalacion,
    costoTransporte,
    costoBase,
    margenAplicado,
    utilidad,
    precioVenta,
  };
}

export default function FormulasCosto() {
  const [form, setForm] = useState(() => leerFormulasCosto());

  useEffect(() => {
    guardarFormulasCosto(form);
  }, [form]);

  const cambiar = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'estado' ? value : Number(value || 0),
    }));
  };

  const calculo = useMemo(() => {
    const areaPrueba = 1;

    const materialesBase = 34;
    const desperdicio =
      (materialesBase * Number(form.desperdicioMaterial || 0)) / 100;

    const materiales = materialesBase + desperdicio;

    const produccion =
      Number(form.horasProduccionPorM2 || 0) *
      5 *
      Number(form.factorComplejidad || 1) *
      areaPrueba;

    const instalacion =
      (Number(form.tecnicoInstalacion || 0) * 5 +
        Number(form.ayudantesInstalacion || 0) * 3) *
      Number(form.horasInstalacionPorM2 || 0) *
      areaPrueba;

    const transporte = Number(form.distanciaKmDefault || 0) * 1;

    return calcularPrecioVenta({
      materiales,
      produccion,
      instalacion,
      transporte,
      margen: form.margenDefault,
    });
  }, [form]);

  const restaurarBase = () => {
    const confirmar = window.confirm(
      '¿Restaurar las fórmulas base de costeo?'
    );

    if (!confirmar) return;

    setForm(formulasBaseElanvisual);
  };

  return (
    <main>
      <h1>Fórmulas de Costeo</h1>

      <section className="card">
        <p>
          Motor de reglas para calcular precio de venta desde materiales,
          producción, instalación, transporte, desperdicio y margen.
        </p>
      </section>

      <section className="card form">
        <h2>Reglas generales</h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
            gap: 10,
          }}
        >
          <label>
            Margen default %
            <input
              type="number"
              name="margenDefault"
              value={form.margenDefault}
              onChange={cambiar}
            />
          </label>

          <label>
            Desperdicio material %
            <input
              type="number"
              name="desperdicioMaterial"
              value={form.desperdicioMaterial}
              onChange={cambiar}
            />
          </label>

          <label>
            Factor complejidad
            <input
              type="number"
              step="0.1"
              name="factorComplejidad"
              value={form.factorComplejidad}
              onChange={cambiar}
            />
          </label>

          <label>
            Horas producción por m²
            <input
              type="number"
              step="0.1"
              name="horasProduccionPorM2"
              value={form.horasProduccionPorM2}
              onChange={cambiar}
            />
          </label>

          <label>
            Horas instalación por m²
            <input
              type="number"
              step="0.1"
              name="horasInstalacionPorM2"
              value={form.horasInstalacionPorM2}
              onChange={cambiar}
            />
          </label>

          <label>
            Distancia default km
            <input
              type="number"
              step="0.1"
              name="distanciaKmDefault"
              value={form.distanciaKmDefault}
              onChange={cambiar}
            />
          </label>

          <label>
            Técnicos instalación
            <input
              type="number"
              name="tecnicoInstalacion"
              value={form.tecnicoInstalacion}
              onChange={cambiar}
            />
          </label>

          <label>
            Ayudantes instalación
            <input
              type="number"
              name="ayudantesInstalacion"
              value={form.ayudantesInstalacion}
              onChange={cambiar}
            />
          </label>

          <label>
            Estado
            <select
              name="estado"
              value={form.estado}
              onChange={cambiar}
            >
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={restaurarBase}>
            Restaurar fórmulas base
          </button>
        </div>
      </section>

      <section className="kpis">
        <div className="kpi">
          <b>{Number(form.margenDefault || 0)}%</b>
          <span>Margen</span>
        </div>

        <div className="kpi">
          <b>{Number(form.desperdicioMaterial || 0)}%</b>
          <span>Desperdicio</span>
        </div>

        <div className="kpi">
          <b>{Number(form.factorComplejidad || 1).toFixed(1)}</b>
          <span>Complejidad</span>
        </div>

        <div className="kpi">
          <b>US$ {calculo.precioVenta.toFixed(2)}</b>
          <span>Prueba 1 m²</span>
        </div>
      </section>

      <section className="card">
        <h2>Simulación técnica 1 m²</h2>

        <table className="crm-table">
          <tbody>
            <tr>
              <td>Materiales + desperdicio</td>
              <td>US$ {calculo.costoMateriales.toFixed(2)}</td>
            </tr>

            <tr>
              <td>Producción</td>
              <td>US$ {calculo.costoProduccion.toFixed(2)}</td>
            </tr>

            <tr>
              <td>Instalación</td>
              <td>US$ {calculo.costoInstalacion.toFixed(2)}</td>
            </tr>

            <tr>
              <td>Transporte</td>
              <td>US$ {calculo.costoTransporte.toFixed(2)}</td>
            </tr>

            <tr>
              <td>Costo base</td>
              <td>US$ {calculo.costoBase.toFixed(2)}</td>
            </tr>

            <tr>
              <td>Utilidad</td>
              <td>US$ {calculo.utilidad.toFixed(2)}</td>
            </tr>

            <tr>
              <td>
                <strong>Precio venta sugerido</strong>
              </td>
              <td>
                <strong>US$ {calculo.precioVenta.toFixed(2)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}