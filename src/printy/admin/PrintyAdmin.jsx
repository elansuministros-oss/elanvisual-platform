import { useEffect, useState } from "react";
import {
  cargarPrintyMenu,
  guardarPrintyMenu,
  cargarPrintyProductos,
  guardarPrintyProductos,
} from "../data/printyStore";
import "./printyAdmin.css";

const productoVacio = {
  nombre: "",
  subtitulo: "",
  precioAnterior: "",
  precio: "",
  oferta: false,
  imagen: "",
};

export default function PrintyAdmin() {
  const [menu, setMenu] = useState([]);
  const [productos, setProductos] = useState([]);
  const [nuevoMenu, setNuevoMenu] = useState("");

  useEffect(() => {
    setMenu(cargarPrintyMenu());
    setProductos(cargarPrintyProductos());
  }, []);

  const guardarMenu = (lista) => setMenu(guardarPrintyMenu(lista));
  const guardarProductos = (lista) => setProductos(guardarPrintyProductos(lista));

  const agregarMenu = () => {
    if (!nuevoMenu.trim()) return;
    guardarMenu([...menu, nuevoMenu]);
    setNuevoMenu("");
  };

  const cambiarProducto = (index, campo, valor) => {
    const copia = [...productos];
    copia[index] = { ...copia[index], [campo]: valor };
    setProductos(copia);
  };

  return (
    <main className="printy-admin">
      <section className="printy-admin-panel">
        <div className="printy-admin-head">
          <div>
            <p>ELANVISUAL / PRINTY</p>
            <h1>Administrador de tienda</h1>
          </div>
          <a href="/printy" target="_blank" rel="noreferrer">Ver tienda</a>
        </div>

        <h2>Menú desplegable</h2>

        <div className="printy-admin-add">
          <input value={nuevoMenu} onChange={(e) => setNuevoMenu(e.target.value)} placeholder="Nueva categoría" />
          <button type="button" onClick={agregarMenu}>Agregar</button>
        </div>

        <div className="printy-admin-list">
          {menu.map((item, index) => (
            <div className="printy-admin-row" key={`${item}-${index}`}>
              <input value={item} onChange={(e) => {
                const copia = [...menu];
                copia[index] = e.target.value.toUpperCase();
                setMenu(copia);
              }} />
              <button type="button" onClick={() => guardarMenu(menu.filter((_, i) => i !== index))}>Eliminar</button>
            </div>
          ))}
        </div>

        <button className="printy-admin-save" type="button" onClick={() => guardarMenu(menu)}>
          Guardar menú
        </button>

        <h2>Productos</h2>

        <button className="printy-admin-save" type="button" onClick={() => setProductos([...productos, productoVacio])}>
          Agregar producto
        </button>

        <div className="printy-products-editor">
          {productos.map((producto, index) => (
            <article className="printy-product-editor" key={`${producto.nombre}-${index}`}>
              <input placeholder="Nombre" value={producto.nombre} onChange={(e) => cambiarProducto(index, "nombre", e.target.value)} />
              <input placeholder="Subtítulo" value={producto.subtitulo || ""} onChange={(e) => cambiarProducto(index, "subtitulo", e.target.value)} />
              <input placeholder="Precio anterior" value={producto.precioAnterior || ""} onChange={(e) => cambiarProducto(index, "precioAnterior", e.target.value)} />
              <input placeholder="Precio actual" value={producto.precio || ""} onChange={(e) => cambiarProducto(index, "precio", e.target.value)} />
              <input placeholder="URL imagen" value={producto.imagen || ""} onChange={(e) => cambiarProducto(index, "imagen", e.target.value)} />

              <label>
                <input type="checkbox" checked={!!producto.oferta} onChange={(e) => cambiarProducto(index, "oferta", e.target.checked)} />
                Oferta
              </label>

              <button type="button" onClick={() => guardarProductos(productos.filter((_, i) => i !== index))}>
                Eliminar producto
              </button>
            </article>
          ))}
        </div>

        <button className="printy-admin-save" type="button" onClick={() => guardarProductos(productos)}>
          Guardar productos
        </button>
      </section>
    </main>
  );
}
