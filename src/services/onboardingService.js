import { supabase } from '../lib/supabase';

export async function obtenerOnboarding(usuario) {
  if (!usuario?.id) return null;

  const { data } = await supabase
    .from('onboarding_vendedores')
    .select('*')
    .eq('usuario_id', usuario.id)
    .maybeSingle();

  return data;
}

export async function crearOnboarding(usuario, firma) {
  const payload = {
    usuario_id: usuario?.id,
    vendedor_id: firma?.vendedor_id,
    codigo_vendedor: firma?.codigo_vendedor,
  };

  const { data } = await supabase
    .from('onboarding_vendedores')
    .insert(payload)
    .select()
    .single();

  return data;
}

export async function descontarSesion(id, sesionesRestantes) {
  return supabase
    .from('onboarding_vendedores')
    .update({
      sesiones_restantes: Math.max(0, sesionesRestantes - 1),
      modo_aprendizaje: sesionesRestantes - 1 > 0,
      tutorial_completado: sesionesRestantes - 1 <= 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}