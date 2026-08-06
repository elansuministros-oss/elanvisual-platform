import { supabase } from '../lib/supabase';
import {
  createCustomerDraftConnect,
  listCrmOrdersConnect,
  listQuotesConnect,
  searchCustomersConnect,
} from '../modules/connect/services/crmConnectClient.js';
import { isConnectUnavailableError } from '../modules/connect/services/connectCoreClient.js';

export async function buscarCliente(nombre, vendedorId = null) {
  try {
    const data = await searchCustomersConnect({ query: nombre, vendedorId });
    return {
      ok: true,
      data: data || [],
      source: 'connect',
    };
  } catch (error) {
    if (!isConnectUnavailableError(error)) {
      console.error(error);
      return {
        ok: false,
        mensaje: error.message,
        data: [],
      };
    }
  }

  try {
    let query = supabase
      .from('clientes')
      .select('*')
      .ilike('cliente', `%${nombre}%`);

    if (vendedorId) {
      query = query.eq('vendedor_id', vendedorId);
    }

    const { data, error } = await query.limit(20);

    if (error) throw error;

    return {
      ok: true,
      data: data || [],
    };
  } catch (error) {
    console.error(error);

    return {
      ok: false,
      mensaje: error.message,
      data: [],
    };
  }
}

export async function crearClienteBorrador(data) {
  try {
    const result = await createCustomerDraftConnect(data);
    return {
      ok: true,
      borrador: true,
      data: result,
      source: 'connect',
    };
  } catch (error) {
    if (!isConnectUnavailableError(error)) {
      return {
        ok: false,
        mensaje: error.message,
        data: null,
      };
    }
  }

  return {
    ok: true,
    borrador: true,
    data,
  };
}

export async function buscarCotizaciones(vendedorId = null) {
  try {
    return await listQuotesConnect({ vendedorId });
  } catch (error) {
    if (!isConnectUnavailableError(error)) {
      console.error(error);
      return [];
    }
  }

  try {
    let query = supabase
      .from('cotizaciones_inteligentes')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendedorId) {
      query = query.eq('vendedor_id', vendedorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function buscarPedidos(vendedorId = null) {
  try {
    return await listCrmOrdersConnect({ vendedorId });
  } catch (error) {
    if (!isConnectUnavailableError(error)) {
      console.error(error);
      return [];
    }
  }

  try {
    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (vendedorId) {
      query = query.eq('vendedor_id', vendedorId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function subirArchivo() {
  return {
    ok: false,
    mensaje: 'AI-04.4 pendiente'
  };
}
