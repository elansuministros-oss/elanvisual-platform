export const recomendacionesTecnicas = [
  {
    id: "rotulo-pvc-interior",
    nombre: "Rótulo PVC interior",
    categoria: "Rotulación",
    entorno: ["interior"],
    sol: ["bajo", "medio"],
    humedad: ["baja", "media"],
    superficies: ["lisa", "gypsum", "madera", "concreto"],
    descripcion: "Solución liviana para interior con PVC, vinil o acrílico según acabado.",
    materiales: ["PVC 6 mm / 10 mm", "Vinil impreso o corte", "Acrílico decorativo opcional"],
    tecnologia: "Vinil UV / corte / aplicación directa",
    fabricacion: ["Corte PVC", "Lijado de canto", "Aplicación gráfica", "Revisión de limpieza"],
    instalacion: ["Cinta VHB o silicón neutro", "Nivelación", "Fijación liviana según pared"],
    advertencias: ["No recomendado para sol alto directo sin protección UV."]
  }
];

export const opcionesRecomendador = {
  entorno: ["interior", "exterior"],
  sol: ["bajo", "medio", "alto"],
  humedad: ["baja", "media", "alta"],
  superficie: ["lisa", "corrugada", "irregular", "vidrio", "acm", "concreto", "gypsum", "madera", "metal"],
  prioridad: ["económico", "duradero", "premium"]
};
