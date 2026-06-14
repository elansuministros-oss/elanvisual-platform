import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'elanvisual';

function limpiarNombreArchivo(nombre = '') {
  return String(nombre)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

export default function ImageUploader({
  label = 'Imagen',
  value = '',
  onChange,
}) {
  const [preview, setPreview] = useState(value || '');
  const [mensaje, setMensaje] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMensaje('Archivo no válido.');
      return;
    }

    if (!supabase) {
      setMensaje('Supabase no está configurado.');
      return;
    }

    try {
      setSubiendo(true);
      setMensaje('Subiendo imagen a Supabase...');

      const extension = file.name.split('.').pop() || 'png';
      const nombreLimpio = limpiarNombreArchivo(file.name);
      const ruta = `elanvisual/${Date.now()}-${nombreLimpio || `imagen.${extension}`}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(ruta, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
      const urlPublica = data?.publicUrl || '';

      if (!urlPublica) throw new Error('No se pudo generar URL pública.');

      setPreview(urlPublica);
      onChange?.(urlPublica);
      setMensaje('Imagen subida correctamente.');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setMensaje('No se pudo subir la imagen a Supabase.');
    } finally {
      setSubiendo(false);
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

      <input type="file" accept="image/*" onChange={handleFile} disabled={subiendo} />

      {mensaje && <small className="note">{mensaje}</small>}

      {preview && (
        <button type="button" className="btn-outline" onClick={quitarImagen}>
          Quitar imagen
        </button>
      )}
    </div>
  );
}