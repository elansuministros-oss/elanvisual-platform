const fs = require("fs");

const directoPath = "src/pages/CotizadorDirecto.jsx";
const inteligentesPath = "src/pages/CotizacionesInteligentes.jsx";

let directo = fs.readFileSync(directoPath, "utf8");
let inteligentes = fs.readFileSync(inteligentesPath, "utf8");

/* 1. CotizacionesInteligentes: quitar localStorage y mandar ?id=UUID */
inteligentes = inteligentes.replace(
`  const editarEnCotizador = (cotizacion) => {
    if (!cotizacion) return;

    localStorage.setItem(
      'elanvisual_cotizacion_item_activo',
      JSON.stringify(cotizacion)
    );

    window.location.href = '/cotizador';
  };`,
`  const editarEnCotizador = (cotizacion) => {
    if (!cotizacion?.id) {
      alert('No se puede editar esta cotización porque no tiene ID.');
      return;
    }

    window.location.href = \`/cotizador?id=\${cotizacion.id}\`;
  };`
);

/* 2. CotizadorDirecto: agregar estado modo edición */
directo = directo.replace(
`  const [clientes, setClientes] = useState([]);`,
`  const [clientes, setClientes] = useState([]);
  const [cotizacionEdicion, setCotizacionEdicion] = useState(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const cotizacionIdEdicion = params.get('id');
  const modoEdicion = Boolean(cotizacionIdEdicion);`
);

/* 3. CotizadorDirecto: agregar carga desde cotizaciones_inteligentes */
directo = directo.replace(
`  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));`,
`  useEffect(() => {
    const cargarCotizacionEdicion = async () => {
      if (!cotizacionIdEdicion || !supabase) return;

      setCargandoEdicion(true);

      const { data, error } = await supabase
        .from('cotizaciones_inteligentes')
        .select('*')
        .eq('id', cotizacionIdEdicion)
        .maybeSingle();

      if (error) {
        console.error('Error cargando cotización inteligente para edición:', error);
        setMensaje('No se pudo cargar la cotización inteligente para edición.');
        setCargandoEdicion(false);
        return;
      }

      if (!data) {
        setMensaje('No se encontró la cotización inteligente indicada.');
        setCargandoEdicion(false);
        return;
      }

      setCotizacionEdicion(data);

      const descripcion =
        data.descripcion ||
        data.biblioteca_nombre ||
        data.codigo ||
        'Cotización inteligente';

      const precioBase = Number(data.precio_b || 0);
      const costoBase =
        Number(data.costo_produccion || 0) +
        Number(data.costo_instalacion || 0) +
        Number(data.costo_transporte || 0) +
        Number(data.costo_viaticos || 0) +
        Number(data.costo_equipo || 0) +
        Number(data.costo_empresa || 0);

      const lineaEdicion = {
        id: \`ci17-\${data.id}\`,
        nombre: data.biblioteca_nombre || descripcion,
        tipo: 'Cotización inteligente',
        unidad: 'servicio',
        cantidad: Number(data.cantidad || 1),
        costoUnitario: costoBase > 0 ? costoBase : precioBase,
        origen: 'cotizaciones_inteligentes',
      };

      setForm((prev) => ({
        ...prev,
        buscarCliente: '',
        cliente: data.cliente_nombre || '',
        empresa: data.cliente_nombre || '',
        whatsapp: data.celular || '',
        correo: '',
        direccion: data.ubicacion || '',
        ciudad: data.ubicacion || '',
        descripcion,
        ancho: Number(data.ancho || 1),
        alto: Number(data.alto || 1),
        cantidad: Number(data.cantidad || 1),
        precioElegido: 'recomendado',
        descuento: 0,
        usaIVA: false,
        formaPago: '6040',
        p1: 60,
        p2: 40,
        p3: 0,
      }));

      setItems([lineaEdicion]);
      setMensaje(\`Modo edición activo: \${data.codigo || data.id}\`);
      setCargandoEdicion(false);
    };

    cargarCotizacionEdicion();
  }, [cotizacionIdEdicion]);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));`
);

/* 4. CotizadorDirecto: cambiar guardar para UPDATE si viene ?id= */
directo = directo.replace(
`    try {
      const { error } = await supabase.from('pedidos').insert({
        numero: payload.id,
        cliente_nombre: form.cliente || form.empresa || 'Cliente',
        cliente_telefono: form.whatsapp || '',
        estado: 'cotizacion_guardada',
        estado_produccion: 'pendiente',
        unidad_negocio: 'ELANVISUAL',
        total: Number(total.totalCliente || 0),
        data: payload,
      });

      if (error) {
        console.error('Error guardando cotización directa en Supabase:', error);
        setMensaje('Cotización guardada localmente. No se pudo guardar en Supabase.');
        return payload;
      }

      setMensaje(clienteSupabaseOk ? 'Cotización y cliente guardados en Supabase.' : 'Cotización guardada en Supabase. Cliente pendiente de sincronizar.');
      return payload;
    } catch (error) {`,
`    try {
      if (modoEdicion && cotizacionIdEdicion) {
        const updatePayload = {
          cliente_nombre: form.cliente || form.empresa || 'Cliente',
          celular: form.whatsapp || '',
          ubicacion: form.direccion || form.ciudad || '',
          descripcion: form.descripcion || '',
          ancho: Number(form.ancho || 0),
          alto: Number(form.alto || 0),
          cantidad: Number(form.cantidad || 1),
          precio_b: Number(total.totalCliente || 0),
          actualizado_en: new Date().toISOString(),
          editado_desde_cotizador_directo: true,
          cotizador_directo_data: payload,
        };

        const { error } = await supabase
          .from('cotizaciones_inteligentes')
          .update(updatePayload)
          .eq('id', cotizacionIdEdicion);

        if (error) {
          console.error('Error actualizando cotización inteligente:', error);
          setMensaje('No se pudo actualizar la cotización inteligente.');
          return payload;
        }

        setMensaje(clienteSupabaseOk ? 'Cotización inteligente actualizada y cliente guardado.' : 'Cotización inteligente actualizada. Cliente pendiente de sincronizar.');
        return payload;
      }

      const { error } = await supabase.from('pedidos').insert({
        numero: payload.id,
        cliente_nombre: form.cliente || form.empresa || 'Cliente',
        cliente_telefono: form.whatsapp || '',
        estado: 'cotizacion_guardada',
        estado_produccion: 'pendiente',
        unidad_negocio: 'ELANVISUAL',
        total: Number(total.totalCliente || 0),
        data: payload,
      });

      if (error) {
        console.error('Error guardando cotización directa en Supabase:', error);
        setMensaje('Cotización guardada localmente. No se pudo guardar en Supabase.');
        return payload;
      }

      setMensaje(clienteSupabaseOk ? 'Cotización y cliente guardados en Supabase.' : 'Cotización guardada en Supabase. Cliente pendiente de sincronizar.');
      return payload;
    } catch (error) {`
);

fs.writeFileSync(directoPath, directo, "utf8");
fs.writeFileSync(inteligentesPath, inteligentes, "utf8");

console.log("CI-17 aplicado.");
console.log("- CotizacionesInteligentes ahora abre /cotizador?id=UUID");
console.log("- CotizadorDirecto ahora carga cotizaciones_inteligentes por ID");
console.log("- CotizadorDirecto ahora hace UPDATE en modo edición");
