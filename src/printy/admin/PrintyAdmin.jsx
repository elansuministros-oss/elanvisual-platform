import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard.jsx";
import "./printyAdmin.css";

export default function PrintyAdmin() {

  const [page, setPage] = useState("dashboard");

  const renderPage = () => {

    switch(page){

      case "dashboard":
        return <Dashboard />;

      default:
        return <Dashboard />;

    }

  };

  return (

    <div className="printy-admin-layout">

      <Sidebar page={page} setPage={setPage} />

      <main className="printy-admin-content">

        {renderPage()}

      </main>

    </div>

  );

}
