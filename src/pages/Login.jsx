import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <main className="page-shell">
      <section className="app-card">
        <p className="eyebrow">Sistema</p>
        <h1>Acceso administrativo</h1>

        <p className="muted">
          Entrada al panel interno de ELANVISUAL.
        </p>

        <div className="form-actions">
          <Link className="cart-link" to="/admin/dashboard">
            Entrar al Admin
          </Link>

          <Link className="cart-link" to="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
