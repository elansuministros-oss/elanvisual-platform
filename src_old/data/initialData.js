export const categoriasIniciales=[
{id:'cat-rot',nombre:'ROTULACIÓN',estado:'Activo',subcategorias:['Letras 3D','Fachadas','Jalavistas','Señalización','Tótems','Letras PVC','Letras acrílicas']},
{id:'cat-imp',nombre:'IMPRESIÓN DIGITAL',estado:'Activo',subcategorias:['Lonas','Vinil adhesivo','Microperforado','Backlight','Vinil vehicular','Vinil de corte']},
{id:'cat-dis',nombre:'DISPLAYS Y EVENTOS',estado:'Activo',subcategorias:['Roll Up','X Banner','Backing','Pop Up','Display de mesa','Exhibiciones']},
{id:'cat-com',nombre:'IMPRESIÓN COMERCIAL',estado:'Activo',subcategorias:['Tarjetas','Volantes','Stickers','Menús','Catálogos','Brochures']},
{id:'cat-cnc',nombre:'ACRÍLICOS / PVC / CNC',estado:'Activo',subcategorias:['Placas acrílicas','Letras PVC','Corte CNC','Corte láser','Displays acrílicos','Señalética']},
{id:'cat-pro',nombre:'PROYECTOS ESPECIALES',estado:'Activo',subcategorias:['Stands','Fachadas especiales','Mobiliario comercial','Decoración comercial','Exhibidores','Instalaciones especiales']}
];

export const proveedoresIniciales=[
{id:'prov-elan',nombre:'Producción ELANVISUAL',tipo:'Interno',whatsapp:'',correo:'',categorias:['IMPRESIÓN DIGITAL','ROTULACIÓN'],productosAsociados:['Lona Front','Vinil adhesivo','Microperforado'],estado:'Activo'},
{id:'prov-play',nombre:'Play Marketing',tipo:'Externo',whatsapp:'',correo:'',categorias:['DISPLAYS Y EVENTOS'],productosAsociados:['Roll Up','X Banner'],estado:'Activo'},
{id:'prov-imprenta',nombre:'Imprenta General',tipo:'Externo',whatsapp:'',correo:'',categorias:['IMPRESIÓN COMERCIAL'],productosAsociados:['Tarjetas','Volantes'],estado:'Activo'},
{id:'prov-especial',nombre:'Presupuesto Especial',tipo:'Validación',whatsapp:'',correo:'',categorias:['PROYECTOS ESPECIALES','ROTULACIÓN'],productosAsociados:['Fachada','Letras 3D','Stand'],estado:'Activo'}
];

export const productosIniciales=[
{id:'p-lona',categoria:'IMPRESIÓN DIGITAL',subcategoria:'Lonas',nombre:'Lona Front',tipo:'estandar',calculo:'area',precioVenta:25,costo:14,unidadPrecio:'m2',proveedorId:'prov-elan',estado:'Activo',imagen:'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200'},
{id:'p-vinil',categoria:'IMPRESIÓN DIGITAL',subcategoria:'Vinil adhesivo',nombre:'Vinil adhesivo impreso',tipo:'estandar',calculo:'area',precioVenta:25,costo:13,unidadPrecio:'m2',proveedorId:'prov-elan',estado:'Activo',imagen:'https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?q=80&w=1200'},
{id:'p-micro',categoria:'IMPRESIÓN DIGITAL',subcategoria:'Microperforado',nombre:'Microperforado impreso',tipo:'estandar',calculo:'area',precioVenta:25,costo:13,unidadPrecio:'m2',proveedorId:'prov-elan',estado:'Activo',imagen:'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200'},
{id:'p-roll',categoria:'DISPLAYS Y EVENTOS',subcategoria:'Roll Up',nombre:'Roll Up 85×200',tipo:'estandar',calculo:'unidad',precioVenta:55,costo:35,unidadPrecio:'unidad',proveedorId:'prov-play',estado:'Activo',imagen:'https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1200'},
{id:'p-xbanner',categoria:'DISPLAYS Y EVENTOS',subcategoria:'X Banner',nombre:'X Banner estándar',tipo:'estandar',calculo:'unidad',precioVenta:35,costo:22,unidadPrecio:'unidad',proveedorId:'prov-play',estado:'Activo',imagen:'https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200'},
{id:'p-tarjetas',categoria:'IMPRESIÓN COMERCIAL',subcategoria:'Tarjetas',nombre:'Tarjetas presentación 1000 uds',tipo:'estandar',calculo:'unidad',precioVenta:45,costo:28,unidadPrecio:'paquete',proveedorId:'prov-imprenta',estado:'Activo',imagen:'https://images.unsplash.com/photo-1586953208448-b95a79798f07?q=80&w=1200'},
{id:'p-fachada',categoria:'ROTULACIÓN',subcategoria:'Fachadas',nombre:'Fachada comercial',tipo:'especial',calculo:'especial',precioVenta:0,costo:0,unidadPrecio:'proyecto',proveedorId:'prov-especial',estado:'Activo',imagen:'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200'},
{id:'p-letras3d',categoria:'ROTULACIÓN',subcategoria:'Letras 3D',nombre:'Letras 3D luminosas',tipo:'especial',calculo:'especial',precioVenta:0,costo:0,unidadPrecio:'proyecto',proveedorId:'prov-especial',estado:'Activo',imagen:'https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=1200'},
{id:'p-stand',categoria:'PROYECTOS ESPECIALES',subcategoria:'Stands',nombre:'Stand para evento',tipo:'especial',calculo:'especial',precioVenta:0,costo:0,unidadPrecio:'proyecto',proveedorId:'prov-especial',estado:'Activo',imagen:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200'}
];

export const materialesIniciales=[
{id:'mat-lona',nombre:'Lona front 13 oz',unidad:'m2',stock:80,stockMinimo:20,costo:6,proveedor:'LG Multiservicio'},
{id:'mat-vinil',nombre:'Vinil adhesivo blanco',unidad:'m2',stock:55,stockMinimo:15,costo:5,proveedor:'LG Multiservicio'},
{id:'mat-pvc10',nombre:'PVC 10 mm 122×244',unidad:'lámina',stock:10,stockMinimo:3,costo:34,proveedor:'Scolor'},
{id:'mat-acrilico',nombre:'Acrílico lechoso 3 mm 122×244',unidad:'lámina',stock:6,stockMinimo:2,costo:65,proveedor:'Scolor'},
{id:'mat-led',nombre:'Módulo LED 110V',unidad:'unidad',stock:300,stockMinimo:80,costo:1.73,proveedor:'Importado'}
];

export const vendedoresIniciales=[
{id:'vend-001',nombre:'Vendedor Principal',codigo:'V001',comision:10,estado:'Activo',whatsapp:'',correo:''}
];

export const bannersIniciales=[
{
id:'ban-001',
titulo:'Soluciones visuales para marcas, espacios y negocios.',
subtitulo:'Rotulación, impresión digital, fachadas, displays, acrílicos, PVC y proyectos especiales.',
boton:'Ver Catálogo',
enlace:'/catalogo',
estado:'Activo',
orden:1,
imagen:'/banners/banner-desktop.jpg',
imagenDesktop:'/banners/banner-desktop.jpg',
imagenMobile:'/banners/banner-mobile.jpg'
}
];

export const bancosIniciales=[
{id:'bank-001',banco:'BAC',titular:'ELANVISUAL',numero:'000-000000-000',moneda:'USD',tipoCuenta:'Cuenta corriente',estado:'Activo'}
];

export const estadosProduccion=['Pago validado','Diseño pendiente','Diseño aprobado','Materiales listos','En producción','Listo para instalación','En instalación','Entregado','Cerrado'];

export const usuariosIniciales=[
{id:'u-admin',nombre:'Administrador',correo:'admin@elanvisual.com',password:'admin123',rol:'admin'},
{id:'u-vend',nombre:'Vendedor',correo:'vendedor@elanvisual.com',password:'vend123',rol:'vendedor',vendedorId:'vend-001'},
{id:'u-prod',nombre:'Producción',correo:'produccion@elanvisual.com',password:'prod123',rol:'produccion'}
];