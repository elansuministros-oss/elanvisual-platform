const fs = require("fs");

const path = "src/pages/CotizadorDirecto.jsx";
let txt = fs.readFileSync(path, "utf8");

txt = txt.replace(
`      const lineaEdicion = {
        id: \`ci17-\${data.id}\`,
        nombre: data.biblioteca_nombre || descripcion,
        tipo: 'Cotización inteligente',
        unidad: 'servicio',
        cantidad: Number(data.cantidad || 1),
        costoUnitario: costoBase > 0 ? costoBase : precioBase,
        origen: 'cotizaciones_inteligentes',
      };`,
`      const lineaEdicion = {
        id: \`ci17-linea-\${data.id}\`,
        nombre: data.biblioteca_nombre || descripcion,
        tipo: 'Cotización inteligente',
        unidad: 'servicio',
        cantidad: Number(data.cantidad || 1),
        costoUnitario: costoBase > 0 ? costoBase : precioBase,
        origen: 'cotizaciones_inteligentes',
      };

      const resumenEdicion = resumenItem([lineaEdicion], 'recomendado');

      const itemEdicion = {
        id: \`ci17-item-\${data.id}\`,
        descripcion,
        ancho: Number(data.ancho || 1),
        alto: Number(data.alto || 1),
        cantidad: Number(data.cantidad || 1),
        precioElegido: 'recomendado',
        lineas: [lineaEdicion],
        resumen: resumenEdicion,
        archivos: [],
      };`
);

txt = txt.replace(
`      setItems([lineaEdicion]);`,
`      setLineasPreview([lineaEdicion]);
      setItems([itemEdicion]);`
);

fs.writeFileSync(path, txt, "utf8");

console.log("CI-17.1 aplicado: estructura itemEdicion corregida.");
