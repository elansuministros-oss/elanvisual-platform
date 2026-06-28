export const PRINTY_MENU_KEY = "elanvisual_printy_menu";
export const PRINTY_PRODUCTS_KEY = "elanvisual_printy_products";

export const printyMenuDefault = [
  "LETREROS MINIS",
  "BELLEZA",
  "NEGOCIOS Y PROFESIONES",
  "EVENTOS",
  "FRASES",
  "CANVA LED",
  "CARTOONS",
  "COMIDA",
  "DEPORTES",
  "FESTIVIDADES",
  "GAMING",
  "HOGAR",
  "MUSICA",
];

export const printyProductsDefault = [
  {
    nombre: "Hello Mini",
    precio: "$ 620.00 MXN",
    precioAnterior: "",
    subtitulo: "",
    oferta: false,
    imagen: "https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "Love Mini",
    precio: "$ 599.00 MXN",
    precioAnterior: "",
    subtitulo: "",
    oferta: false,
    imagen: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=800&q=80",
  },
  {
    nombre: "Nails Beauty Salon",
    precio: "$ 530.00 MXN",
    precioAnterior: "$ 900.00 MXN",
    subtitulo: "Decoración cálida para salón de uñas",
    oferta: true,
    imagen: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
  },
];

export function cargarPrintyMenu() {
  try {
    const raw = localStorage.getItem(PRINTY_MENU_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) && data.length ? data : printyMenuDefault;
  } catch {
    return printyMenuDefault;
  }
}

export function guardarPrintyMenu(items) {
  const limpio = items.map((x) => String(x || "").trim().toUpperCase()).filter(Boolean);
  localStorage.setItem(PRINTY_MENU_KEY, JSON.stringify(limpio));
  window.dispatchEvent(new Event("printy-data-updated"));
  return limpio;
}

export function cargarPrintyProductos() {
  try {
    const raw = localStorage.getItem(PRINTY_PRODUCTS_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) && data.length ? data : printyProductsDefault;
  } catch {
    return printyProductsDefault;
  }
}

export function guardarPrintyProductos(items) {
  localStorage.setItem(PRINTY_PRODUCTS_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("printy-data-updated"));
  return items;
}
