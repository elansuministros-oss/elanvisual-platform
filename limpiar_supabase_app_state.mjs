import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf8');

const getEnv = (name) => {
  const line = env.split(/\r?\n/).find((x) => x.startsWith(name + '='));
  return line ? line.split('=').slice(1).join('=').trim() : '';
};

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('VITE_SUPABASE_ANON_KEY');

if (!url || !key) {
  console.error('No se pudieron leer VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY desde .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('elanvisual_app_state')
  .select('data')
  .eq('id', 'global')
  .maybeSingle();

if (error) throw error;

const actual = data?.data || {};

console.log('ANTES');
console.log('productos:', Array.isArray(actual.productos) ? actual.productos.length : 'no array');
console.log('trabajos:', Array.isArray(actual.trabajos) ? actual.trabajos.length : 'no array');
console.log('banners:', Array.isArray(actual.banners) ? actual.banners.length : 'no array');
console.log('imagenes:', Array.isArray(actual.imagenes) ? actual.imagenes.length : 'no array');

const limpio = {
  ...actual,
  productos: [],
  trabajos: [],
  banners: [],
  imagenes: [],
};

const { error: upsertError } = await supabase
  .from('elanvisual_app_state')
  .upsert({
    id: 'global',
    data: limpio,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

if (upsertError) throw upsertError;

console.log('DESPUES');
console.log('productos:', limpio.productos.length);
console.log('trabajos:', limpio.trabajos.length);
console.log('banners:', limpio.banners.length);
console.log('imagenes:', limpio.imagenes.length);
console.log('OK SUPABASE LIMPIO');
