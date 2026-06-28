/* ==========================================================
   PRINTY CMS STORE
   AI-20
   Fuente única de datos para Printy
   Actualmente: localStorage
   Futuro: Supabase
========================================================== */

const STORAGE_KEY = "printy_cms_v1";

/* ==========================================================
   MODELOS
========================================================== */

const defaultData = {

    configuracion:{

        nombreEmpresa:"PRINTY",

        logo:"",

        favicon:"",

        whatsapp:"",

        telefono:"",

        email:"",

        facebook:"",

        instagram:"",

        tiktok:"",

        youtube:"",

        colorPrimario:"#FFD400",

        colorSecundario:"#111111",

        colorTexto:"#111111",

        seoTitle:"",

        seoDescription:""

    },



    hero:{

        activo:true,

        desktop:"",

        mobile:"",

        boton1:{

            texto:"Cotizar ahora",

            link:"/contacto"

        },

        boton2:{

            texto:"Ver catálogo",

            link:"/printy"

        }

    },



    header:{

        logo:"",

        items:[

            {

                id:1,

                nombre:"CATÁLOGO",

                tipo:"mega",

                visible:true,

                orden:1

            },

            {

                id:2,

                nombre:"PERSONALIZA",

                tipo:"link",

                link:"#",

                visible:true,

                orden:2

            }

        ]

    },



    megaMenu:{

        titulo:"",

        descripcion:"",

        imagen:"",

        boton:"",

        link:""

    },



    categorias:[],



    productos:[],



    media:[],



    banners:[],



    paginas:[],



    auditoria:[]

};

/* ==========================================================
   UTILIDADES
========================================================== */

function clone(data){

    return JSON.parse(JSON.stringify(data));

}

function save(data){

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(data)

    );



    window.dispatchEvent(

        new Event("printy-data-updated")

    );

}

function load(){

    try{

        const raw=localStorage.getItem(STORAGE_KEY);

        if(!raw){

            save(defaultData);

            return clone(defaultData);

        }

        return {

            ...clone(defaultData),

            ...JSON.parse(raw)

        };

    }

    catch{

        save(defaultData);

        return clone(defaultData);

    }

}

/* ==========================================================
   STORE
========================================================== */

export function getStore(){

    return load();

}

export function saveStore(store){

    save(store);

}

/* ==========================================================
   HERO
========================================================== */

export function getHero(){

    return load().hero;

}

export function saveHero(hero){

    const db=load();

    db.hero=hero;

    save(db);

}

/* ==========================================================
   HEADER
========================================================== */

export function getHeader(){

    return load().header;

}

export function saveHeader(header){

    const db=load();

    db.header=header;

    save(db);

}

/* ==========================================================
   MEGA MENU
========================================================== */

export function getMegaMenu(){

    return load().megaMenu;

}

export function saveMegaMenu(menu){

    const db=load();

    db.megaMenu=menu;

    save(db);

}

/* ==========================================================
   CATEGORIAS
========================================================== */

export function getCategorias(){

    return load().categorias;

}

export function saveCategorias(lista){

    const db=load();

    db.categorias=lista;

    save(db);

}

/* ==========================================================
   PRODUCTOS
========================================================== */

export function getProductos(){

    return load().productos;

}

export function saveProductos(lista){

    const db=load();

    db.productos=lista;

    save(db);

}

/* ==========================================================
   MEDIA CENTER
========================================================== */

export function getMedia(){

    return load().media;

}

export function saveMedia(lista){

    const db=load();

    db.media=lista;

    save(db);

}

/* ==========================================================
   CONFIGURACION
========================================================== */

export function getConfiguracion(){

    return load().configuracion;

}

export function saveConfiguracion(config){

    const db=load();

    db.configuracion=config;

    save(db);

}

/* ==========================================================
   RESET
========================================================== */

export function resetPrintyCMS(){

    localStorage.removeItem(STORAGE_KEY);

    save(defaultData);

}