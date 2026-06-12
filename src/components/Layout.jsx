<button
  type="button"
  className={`menu-toggle ${menuAbierto ? 'active' : ''}`}
  onClick={() => setMenuAbierto((prev) => !prev)}
  aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
  aria-expanded={menuAbierto}
  style={{
    width: 62,
    height: 62,
    minWidth: 62,
    minHeight: 62,
    fontSize: 38,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  }}
>
  ☰
</button>