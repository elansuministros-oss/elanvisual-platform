export const recetasConstructivasBase = [
  {
    nombre: "Fachada ACM exterior",
    tipo_trabajo: "fachada-acm-exterior",
    descripcion: "Fachada exterior con ACM, estructura metálica, fijación mecánica y sellado.",
    compatible_con: ["exterior", "acm", "fachada", "sol alto", "humedad media"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: false,
    doble_cara: false,
    profundidad_cm: 8,
    componentes: [
      { nombre: "ACM", tipo: "Material", unidad: "m2", formula: "area", keywords: ["acm", "alucobond"] },
      { nombre: "Tubo metálico principal", tipo: "Estructura", unidad: "Metro lineal", formula: "perimetro_x_factor", factor: 1.2, keywords: ["tubo", "metal"] },
      { nombre: "Sellador y fijación", tipo: "Instalación", unidad: "Servicio", formula: "cantidad", keywords: ["sellador", "silicon", "tornillo"] }
    ]
  },
  {
    nombre: "Fascia lona tensada exterior",
    tipo_trabajo: "fascia-lona-tensada",
    descripcion: "Fascia comercial con lona impresa tensada sobre marco metálico.",
    compatible_con: ["exterior", "lona", "fachada", "impresion"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: false,
    doble_cara: false,
    profundidad_cm: 6,
    componentes: [
      { nombre: "Lona impresa", tipo: "Material", unidad: "m2", formula: "area", keywords: ["lona"] },
      { nombre: "Estructura metálica", tipo: "Estructura", unidad: "Metro lineal", formula: "perimetro", keywords: ["tubo", "metal"] },
      { nombre: "Fijación y tensado", tipo: "Instalación", unidad: "Servicio", formula: "cantidad", keywords: ["remache", "tornillo"] }
    ]
  },
  {
    nombre: "Rótulo luminoso doble cara",
    tipo_trabajo: "rotulo-luminoso-doble-cara",
    descripcion: "Rótulo luminoso doble cara con acrílico, LED, cajuela y estructura.",
    compatible_con: ["exterior", "iluminado", "doble cara", "poste"],
    requiere_instalacion: true,
    requiere_postes: true,
    requiere_iluminacion: true,
    doble_cara: true,
    profundidad_cm: 12,
    componentes: [
      { nombre: "Acrílico lechoso", tipo: "Material", unidad: "m2", formula: "area_x_factor", factor: 2, keywords: ["acrilico", "lechoso"] },
      { nombre: "LED y fuente", tipo: "Iluminación", unidad: "Servicio", formula: "area", keywords: ["led", "fuente"] },
      { nombre: "Cajuela metálica", tipo: "Estructura", unidad: "Metro lineal", formula: "perimetro", keywords: ["tubo", "lamina", "zinc"] },
      { nombre: "Postes metálicos", tipo: "Estructura", unidad: "Unidad", formula: "cantidad", factor: 2, keywords: ["poste", "tubo"] },
      { nombre: "Obra civil", tipo: "Obra civil", unidad: "Servicio", formula: "cantidad", keywords: ["concreto", "varilla", "arena", "piedrin"] }
    ]
  },
  {
    nombre: "Letras PVC interior",
    tipo_trabajo: "letras-pvc-interior",
    descripcion: "Letras en PVC para recepción o pared interior.",
    compatible_con: ["interior", "pvc", "letras", "sin iluminacion"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: false,
    doble_cara: false,
    profundidad_cm: 1,
    componentes: [
      { nombre: "PVC 10 mm", tipo: "Material", unidad: "m2", formula: "area", keywords: ["pvc", "10"] },
      { nombre: "Vinil o acabado superficial", tipo: "Material", unidad: "m2", formula: "area", keywords: ["vinil"] },
      { nombre: "Instalación liviana", tipo: "Instalación", unidad: "Servicio", formula: "cantidad", keywords: ["silicon", "vhb"] }
    ]
  },
  {
    nombre: "Letras acrílico premium interior",
    tipo_trabajo: "letras-acrilico-premium",
    descripcion: "Letras de acrílico sobre base PVC para interior premium.",
    compatible_con: ["interior", "acrilico", "premium", "letras"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: false,
    doble_cara: false,
    profundidad_cm: 1,
    componentes: [
      { nombre: "Acrílico", tipo: "Material", unidad: "m2", formula: "area", keywords: ["acrilico"] },
      { nombre: "PVC base", tipo: "Material", unidad: "m2", formula: "area", keywords: ["pvc"] },
      { nombre: "Corte CNC / láser", tipo: "Mano de obra", unidad: "Servicio", formula: "area", keywords: ["cnc", "laser", "corte"] }
    ]
  },
  {
    nombre: "Botón luminoso",
    tipo_trabajo: "boton-luminoso",
    descripcion: "Botón circular o forma especial con luz frontal o halo según diseño.",
    compatible_con: ["exterior", "interior", "iluminado", "acrilico"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: true,
    doble_cara: false,
    profundidad_cm: 8,
    componentes: [
      { nombre: "Acrílico", tipo: "Material", unidad: "m2", formula: "area", keywords: ["acrilico"] },
      { nombre: "PVC / ACM respaldo", tipo: "Material", unidad: "m2", formula: "area", keywords: ["pvc", "acm"] },
      { nombre: "LED y fuente", tipo: "Iluminación", unidad: "Servicio", formula: "area", keywords: ["led", "fuente"] }
    ]
  },
  {
    nombre: "Vinil para vidrio",
    tipo_trabajo: "vinil-vidrio",
    descripcion: "Vinil impreso, frost o corte para vidrio.",
    compatible_con: ["interior", "exterior", "vidrio", "impresion"],
    requiere_instalacion: true,
    requiere_postes: false,
    requiere_iluminacion: false,
    doble_cara: false,
    profundidad_cm: 0,
    componentes: [
      { nombre: "Vinil", tipo: "Material", unidad: "m2", formula: "area", keywords: ["vinil"] },
      { nombre: "Instalación sobre vidrio", tipo: "Instalación", unidad: "m2", formula: "area", keywords: ["instalacion"] }
    ]
  }
];
