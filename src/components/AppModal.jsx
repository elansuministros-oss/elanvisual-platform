export default function AppModal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="app-modal-backdrop">
      <section className="app-modal">
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>×</button>
        </header>
        {children}
      </section>
    </div>
  );
}