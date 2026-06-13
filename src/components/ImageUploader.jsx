import React, { useEffect, useState } from 'react';

const MAX_WIDTH = 900;
const MAX_HEIGHT = 900;
const QUALITY = 0.72;

function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Archivo no válido'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error('No se pudo cargar el archivo'));
    reader.readAsDataURL(file);
  });
}

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

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMensaje('Procesando imagen...');

    try {
      const imagenComprimida = await comprimirImagen(file);
      setPreview(imagenComprimida);
      onChange?.(imagenComprimida);
      setMensaje('Imagen lista y optimizada.');
    } catch {
      setMensaje('No se pudo cargar la imagen.');
    }
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

      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
      />

      {mensaje && <small className="note">{mensaje}</small>}

      {preview && (
        <button
          type="button"
          className="btn-outline"
          onClick={quitarImagen}
        >
          Quitar imagen
        </button>
      )}
    </div>
  );
}