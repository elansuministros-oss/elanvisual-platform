import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY');
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

const limpio = {
  ...actual,
  productos: [],
  trabajos: [],
  banners: [],
};

const { error: upsertError } = await supabase
  .from('elanvisual_app_state')
  .upsert({
    id: 'global',
    data: limpio,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

if (upsertError) throw upsertError;

console.log('SUPABASE LIMPIO: productos, trabajos y banners vaciados en elanvisual_app_state/global');
