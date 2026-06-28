export default function PrintyHeader() {
  return (
    <header className="printy-header">
      <a className="printy-logo" href="/printy">
        <img src="/assets/branding/visualkav.svg" alt="Visual KAV" />
      </a>

      <nav className="printy-nav">
        <a href="/printy">Catalogo</a>
        <a href="/printy">Personaliza</a>
        <a href="/printy">Espejos</a>
        <a href="/printy">Interior</a>
        <a href="/printy">Exterior</a>
      </nav>

      <a className="printy-track" href="#tracking">Sign Tracking</a>
    </header>
  );
}
