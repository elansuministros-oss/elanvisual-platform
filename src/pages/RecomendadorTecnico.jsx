import React, { useMemo, useState } from "react";
import { CheckCircle2, Lightbulb, ShieldCheck } from "lucide-react";
import { opcionesRecomendador } from "../data/recomendaciones";
import { recomendarSoluciones } from "../services/motorRecomendacion";

const inicial = {
  entorno: "exterior",
  sol: "alto",
  humedad: "media",
  superficie: "concreto",
  prioridad: "duradero",
  iluminado: false,
  dobleCara: false,
};

export default function RecomendadorTecnico() {
  const [form, setForm] = useState(inicial);
  const [analizado, setAnalizado] = useState(false);

  const resultado = useMemo(() => recomendarSoluciones(form), [form]);
  const principal = resultado.principal;

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  return (
    <main className="mm3-page">
      <section className="mm3-hero">
        <span>ELANVISIÓN · CI-16C</span>
        <h1>Recomendador Técnico IA</h1>
        <p>Analiza condiciones reales y recomienda una solución técnica. No calcula costos, utilidad, comisión ni PDF.</p>
      </section>

      <section className="mm3-grid">
        <form className="mm3-card" onSubmit={(e) => { e.preventDefault(); setAnalizado(true); }}>
          <div className="title"><Lightbulb size={20} /><h2>Condiciones del proyecto</h2></div>

          <select value={form.entorno} onChange={(e) => cambiar("entorno", e.target.value)}>
            {opcionesRecomendador.entorno.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>

          <select value={form.sol} onChange={(e) => cambiar("sol", e.target.value)}>
            {opcionesRecomendador.sol.map((x) => <option key={x} value={x}>Sol {x}</option>)}
          </select>

          <select value={form.humedad} onChange={(e) => cambiar("humedad", e.target.value)}>
            {opcionesRecomendador.humedad.map((x) => <option key={x} value={x}>Humedad {x}</option>)}
          </select>

          <select value={form.superficie} onChange={(e) => cambiar("superficie", e.target.value)}>
            {opcionesRecomendador.superficie.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>

          <select value={form.prioridad} onChange={(e) => cambiar("prioridad", e.target.value)}>
            {opcionesRecomendador.prioridad.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>

          <label><input type="checkbox" checked={form.iluminado} onChange={(e) => cambiar("iluminado", e.target.checked)} /> Iluminado</label>
          <label><input type="checkbox" checked={form.dobleCara} onChange={(e) => cambiar("dobleCara", e.target.checked)} /> Doble cara</label>

          <button className="primary" type="submit"><CheckCircle2 size={18} /> Analizar recomendación</button>
        </form>

        <section className="mm3-card">
          <div className="title"><ShieldCheck size={20} /><h2>Resultado técnico</h2></div>

          {!analizado && <p className="note">Ingresá las condiciones y analizá la recomendación.</p>}

          {analizado && principal && (
            <div className="list">
              <article className="row">
                <div>
                  <h3>{principal.nombre}</h3>
                  <p>{principal.descripcion}</p>
                  <span>{principal.nivel} · {principal.puntos} puntos · {principal.tecnologia}</span>
                </div>
              </article>

              <article className="row">
                <div>
                  <h3>Materiales sugeridos</h3>
                  <p>{principal.materiales.join(" · ")}</p>
                </div>
              </article>

              <article className="row">
                <div>
                  <h3>Fabricación</h3>
                  <p>{principal.fabricacion.join(" · ")}</p>
                </div>
              </article>

              <article className="row">
                <div>
                  <h3>Instalación</h3>
                  <p>{principal.instalacion.join(" · ")}</p>
                </div>
              </article>

              <article className="row">
                <div>
                  <h3>Validaciones</h3>
                  <p>{principal.advertencias.join(" · ")}</p>
                </div>
              </article>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
