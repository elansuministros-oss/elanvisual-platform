import { recetasConstructivasBase } from "../data/recetasConstructivasBase";

const txt = (v) => String(v || "").toLowerCase();

function buscarPorKeywords(lista = [], keywords = []) {
  return lista.find((item) => {
    const base = txt(`${item.nombre || ""} ${item.categoria || ""} ${item.descripcion || ""}`);
    return keywords.some((k) => base.includes(txt(k)));
  });
}

function payloadComponente(componente, bibliotecaId, materiales, combinaciones, tecnologias, orden) {
  const material = buscarPorKeywords(materiales, componente.keywords);
  const combinacion = buscarPorKeywords(combinaciones, componente.keywords);
  const tecnologia = buscarPorKeywords(tecnologias, componente.keywords);

  let tipoReferencia = "manual";
  let materialId = null;
  let combinacionId = null;
  let tecnologiaId = null;

  if (material) {
    tipoReferencia = "material";
    materialId = material.id;
  } else if (combinacion) {
    tipoReferencia = "combinacion";
    combinacionId = combinacion.id;
  } else if (tecnologia) {
    tipoReferencia = "tecnologia";
    tecnologiaId = tecnologia.id;
  }

  return {
    biblioteca_id: bibliotecaId,
    nombre: componente.nombre,
    tipo_componente: componente.tipo,
    unidad: componente.unidad,
    formula_calculo: componente.formula,
    tipo_referencia: tipoReferencia,
    material_id: materialId,
    combinacion_id: combinacionId,
    tecnologia_id: tecnologiaId,
    factor: Number(componente.factor || 1),
    desperdicio_extra: Number(componente.desperdicio_extra || 0),
    requiere_costo: true,
    es_zinc_doblado: txt(componente.nombre).includes("zinc"),
    es_estructura: txt(componente.tipo).includes("estructura"),
    es_obra_civil: txt(componente.tipo).includes("obra"),
    orden,
    notas: tipoReferencia === "manual" ? "Pendiente de vincular con Material Master." : "Vinculado automáticamente.",
    estado: "activo",
    actualizado_en: new Date().toISOString(),
  };
}

export async function sembrarBibliotecaTecnicaBase(supabase) {
  const [bt, mat, com, tec] = await Promise.all([
    supabase.from("biblioteca_tecnica").select("*"),
    supabase.from("materiales_master").select("*"),
    supabase.from("combinaciones_master").select("*"),
    supabase.from("tecnologias_impresion").select("*"),
  ]);

  if (bt.error) throw bt.error;

  const existentes = bt.data || [];
  const materiales = mat.data || [];
  const combinaciones = com.data || [];
  const tecnologias = tec.data || [];

  let creadas = 0;
  let componentes = 0;

  for (const receta of recetasConstructivasBase) {
    const existe = existentes.find((r) => r.tipo_trabajo === receta.tipo_trabajo);

    let bibliotecaId = existe?.id;

    if (!bibliotecaId) {
      const insert = await supabase
        .from("biblioteca_tecnica")
        .insert({
          nombre: receta.nombre,
          descripcion: receta.descripcion,
          tipo_trabajo: receta.tipo_trabajo,
          compatible_con: receta.compatible_con,
          requiere_medidas: true,
          requiere_instalacion: receta.requiere_instalacion,
          requiere_postes: receta.requiere_postes,
          requiere_iluminacion: receta.requiere_iluminacion,
          una_cara: !receta.doble_cara,
          doble_cara: receta.doble_cara,
          profundidad_cm: receta.profundidad_cm,
          estado: "activo",
          actualizado_en: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (insert.error) throw insert.error;
      bibliotecaId = insert.data.id;
      creadas += 1;
    }

    const compActuales = await supabase
      .from("biblioteca_componentes")
      .select("*")
      .eq("biblioteca_id", bibliotecaId);

    if (compActuales.error) throw compActuales.error;

    if ((compActuales.data || []).length === 0) {
      const payload = receta.componentes.map((c, index) =>
        payloadComponente(c, bibliotecaId, materiales, combinaciones, tecnologias, index + 1)
      );

      const insComp = await supabase.from("biblioteca_componentes").insert(payload);
      if (insComp.error) throw insComp.error;
      componentes += payload.length;
    }
  }

  return { recetasCreadas: creadas, componentesCreados: componentes };
}
