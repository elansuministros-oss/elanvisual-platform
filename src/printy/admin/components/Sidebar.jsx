import React from "react";

export default function Sidebar({ page, setPage }) {
  const items = [
    { id: "dashboard", label: "Dashboard" },
    { id: "hero", label: "Hero" },
    { id: "header", label: "Header" },
    { id: "megamenu", label: "Mega Menú" },
    { id: "categorias", label: "Categorías" },
    { id: "productos", label: "Productos" },
    { id: "media", label: "Media Center" },
    { id: "configuracion", label: "Configuración" }
  ];

  return (
    <aside className="printy-admin-sidebar">
      <div className="printy-admin-sidebar-title">
        PRINTY CMS
      </div>

      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => setPage(item.id)}
          className={page === item.id ? "active" : ""}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}
