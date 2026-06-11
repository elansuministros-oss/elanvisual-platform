
const BRIDGE_KEY='elanvisual_crm_events';
export function emitirEventoCRM(tipo,payload={},origen='web_admin'){
 const evento={unidad:'ELANVISUAL',origen,tipo:'evento',nombre:tipo,fecha:new Date().toISOString(),payload};
 const modo=localStorage.getItem('elanvisual_bridge_mode')||'local';
 if(modo==='api'){ const endpoint=localStorage.getItem('elanvisual_bridge_endpoint'); if(endpoint) fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(evento)}).catch(()=>guardarLocal(evento)); else guardarLocal(evento); }
 else guardarLocal(evento);
 return evento;
}
export function guardarLocal(evento){const data=JSON.parse(localStorage.getItem(BRIDGE_KEY)||'[]');data.unshift(evento);localStorage.setItem(BRIDGE_KEY,JSON.stringify(data));}
export function leerEventosCRM(){return JSON.parse(localStorage.getItem(BRIDGE_KEY)||'[]')}
export function configurarBridge({modo='local',endpoint=''}){localStorage.setItem('elanvisual_bridge_mode',modo);localStorage.setItem('elanvisual_bridge_endpoint',endpoint)}
