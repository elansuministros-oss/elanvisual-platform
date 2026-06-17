import { recomendacionesTecnicas } from "../data/recomendaciones";

const incluye = (lista, valor) => Array.isArray(lista) && lista.includes(valor);

export function recomendarSoluciones(condiciones = {}) {
  const {
    entorno = "interior",
    sol = "medio",
    humedad = "media",
    superficie = "lisa",
    prioridad = "duradero",
    iluminado = false,
    dobleCara = false,
  } = condiciones;

  const resultados = recomendacionesTecnicas
    .map((r) => {
      let puntos = 0;
      const razones = [];

      if (incluye(r.entorno, entorno)) {
        puntos += 25;
        razones.push("Compatible con el entorno.");
      }

      if (incluye(r.sol, sol)) {
        puntos += 20;
        razones.push("Responde al nivel de sol indicado.");
      }

      if (incluye(r.humedad, humedad)) {
        puntos += 20;
        razones.push("Adecuado para la humedad del sitio.");
      }

      if (incluye(r.superficies, superficie)) {
        puntos += 25;
        razones.push("Compatible con la superficie de instalación.");
      }

      if (iluminado && r.categoria.toLowerCase().includes("luminos")) puntos += 15;
      if (dobleCara && r.nombre.toLowerCase().includes("doble cara")) puntos += 15;
      if (prioridad === "premium" && r.categoria.toLowerCase().includes("premium")) puntos += 10;

      return {
        ...r,
        puntos,
        nivel: puntos >= 80 ? "Recomendado" : puntos >= 55 ? "Viable" : "Revisar",
        razones,
      };
    })
    .sort((a, b) => b.puntos - a.puntos);

  return {
    principal: resultados[0] || null,
    alternativas: resultados.slice(1, 4),
    resultados,
  };
}
