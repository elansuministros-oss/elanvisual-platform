from pathlib import Path
import unicodedata

ROOT = Path("src")
EXTS = {".js", ".jsx"}

def fix_mojibake(text):
    old = None
    new = text
    for _ in range(3):
        old = new
        try:
            candidate = old.encode("latin1").decode("utf-8")
            new = candidate
        except Exception:
            break
        if new == old:
            break
    return new

def remove_emoji(text):
    out = []
    for ch in text:
        code = ord(ch)
        cat = unicodedata.category(ch)

        if code > 0xFFFF:
            continue

        if 0x2600 <= code <= 0x27BF:
            continue

        if code == 0xFE0F:
            continue

        out.append(ch)

    return "".join(out)

replacements = {
    "Ã“": "Ó",
    "Ãš": "Ú",
    "Ã": "Á",
    "Ã‰": "É",
    "Ã": "Í",
    "Ã¡": "á",
    "Ã©": "é",
    "Ã­": "í",
    "Ã³": "ó",
    "Ãº": "ú",
    "Ã±": "ñ",
    "Â·": "-",
    "Ã—": "x",
    "â†’": "-",
    "â€”": "-",
    "âœ“": "OK",
    "âœ…": "OK",
}

changed = []

for path in ROOT.rglob("*"):
    if path.suffix.lower() not in EXTS:
        continue

    text = path.read_text(encoding="utf-8", errors="replace")
    original = text

    text = fix_mojibake(text)

    for a, b in replacements.items():
        text = text.replace(a, b)

    text = remove_emoji(text)

    text = text.replace("Ordenes", "Órdenes")
    text = text.replace("Ultimas", "Últimas")
    text = text.replace("Produccion", "Producción")
    text = text.replace("Cotizacion", "Cotización")
    text = text.replace("Comision", "Comisión")
    text = text.replace("Operacion", "Operación")
    text = text.replace("Impresion", "Impresión")
    text = text.replace("Instalacion", "Instalación")
    text = text.replace("Categoria", "Categoría")
    text = text.replace("Direccion", "Dirección")
    text = text.replace("Ubicacion", "Ubicación")
    text = text.replace("Telefono", "Teléfono")
    text = text.replace("Credito", "Crédito")
    text = text.replace("Dias", "Días")
    text = text.replace("Aprobacion", "Aprobación")
    text = text.replace("Revision", "Revisión")
    text = text.replace("Fabricacion", "Fabricación")
    text = text.replace("Rapida", "Rápida")
    text = text.replace("Criticas", "Críticas")
    text = text.replace("todavia", "todavía")

    if text != original:
        path.write_text(text, encoding="utf-8")
        changed.append(str(path))

print("FILES_CHANGED:")
for p in changed:
    print(p)
