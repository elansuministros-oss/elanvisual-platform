import React, { useEffect, useState } from 'react';

export default function ImageUploader({
  label = 'Imagen',
  value = '',
  onChange,
}) {
  const [preview, setPreview] = useState(value || '');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensaje('Archivo no válido.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const original = reader.result;
      setPreview(original);
      onChange?.(original);
      setMensaje('Imagen cargada sin compresión.');
    };

    reader.onerror = () => {
      setMensaje('No se pudo cargar la imagen.');
    };

    reader.readAsDataURL(file);
  };

  const quitarImagen = () => {
    setPreview('');
    onChange?.('');
    setMensaje('');
  };

  return (
    <div className="image-uploader">
      <label>{label}</label>

      {preview && (
        <div className="image-preview">
          <img src={preview} alt={label} />
        </div>
      )}

      <input type="file" accept="image/*" onChange={handleFile} />

      {mensaje && <small className="note">{mensaje}</small>}

      {preview && (
        <button type="button" className="btn-outline" onClick={quitarImagen}>
          Quitar imagen
        </button>
      )}
    </div>
  );
}