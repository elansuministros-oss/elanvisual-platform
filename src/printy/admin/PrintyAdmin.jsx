import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard.jsx";
import HeroManager from "./pages/HeroManager.jsx";
import HeaderManager from "./pages/HeaderManager.jsx";
import MegaMenuManager from "./pages/MegaMenuManager.jsx";
import CategoriaManager from "./pages/CategoriaManager.jsx";
import ProductoManager from "./pages/ProductoManager.jsx";
import MediaManager from "./pages/MediaManager.jsx";
import ConfiguracionManager from "./pages/ConfiguracionManager.jsx";
import "./printyAdmin.css";

export default function PrintyAdmin() {
  const [page, setPage] = useState("dashboard");

  const pages = {
    dashboard: <Dashboard />,
    hero: <HeroManager />,
    header: <HeaderManager />,
    megamenu: <MegaMenuManager />,
    categorias: <CategoriaManager />,
    productos: <ProductoManager />,
    media: <MediaManager />,
    configuracion: <ConfiguracionManager />
  };

  return (
    <div className="printy-admin-layout">
      <Sidebar page={page} setPage={setPage} />

      <main className="printy-admin-content">
        {pages[page] || <Dashboard />}
      </main>
    </div>
  );
}
