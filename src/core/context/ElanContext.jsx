
import React,{createContext,useContext,useEffect,useMemo,useState}from'react';
import{categoriasIniciales,productosIniciales,proveedoresIniciales,materialesIniciales,vendedoresIniciales,bannersIniciales,bancosIniciales,estadosProduccion,usuariosIniciales}from'../../data/initialData.js';
import{emitirEventoCRM}from'../bridge/CentralBridge.js';
const Ctx=createContext(null);const key='elanvisual_state_v2';
const inicial={categorias:categoriasIniciales,productos:productosIniciales,proveedores:proveedoresIniciales,materiales:materialesIniciales,vendedores:vendedoresIniciales,banners:bannersIniciales,bancos:bancosIniciales,estadosProduccion,usuarios:usuariosIniciales,clientes:[],leads:[],cotizaciones:[],pedidos:[],pagos:[],ordenes:[],comisiones:[],showroom:[],carrito:[],sesion:null};
function load(){try{return{...inicial,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return inicial}}
function uid(p){return `${p}-${Date.now()}-${Math.random().toString(16).slice(2,7)}`}
export function convertirAMetros(v,u){const n=Number(v)||0;return u==='m'?n:u==='cm'?n/100:u==='mm'?n/1000:u==='pulgadas'?n*0.0254:u==='pies'?n*0.3048:n}
export function ElanProvider({children}){const[state,setState]=useState(load);useEffect(()=>localStorage.setItem(key,JSON.stringify(state)),[state]);
 const set=(patch)=>setState(s=>({...s,...(typeof patch==='function'?patch(s):patch)}));
 const login=(correo,password)=>{const u=state.usuarios.find(x=>x.correo===correo&&x.password===password); if(u){set({sesion:u});return u} return null};
 const logout=()=>set({sesion:null});
 const agregarCarrito=(producto,cantidad=1,medidas=null)=>set(s=>({carrito:[...s.carrito,{id:uid('cart'),productoId:producto.id,nombre:producto.nombre,cantidad,medidas,precioUnitario:producto.precioVenta,total:(producto.precioVenta||0)*cantidad,tipo:producto.tipo}]}));
 const confirmarPedido=(cliente)=>{const pedido={id:uid('ped'),codigo:`PED-ELV-${String(state.pedidos.length+1).padStart(6,'0')}`,cliente,items:state.carrito,total:state.carrito.reduce((a,i)=>a+i.total,0),estado:'Pendiente de Pago',fecha:new Date().toISOString()};set(s=>({pedidos:[pedido,...s.pedidos],pagos:[{id:uid('pay'),pedidoId:pedido.id,codigo:pedido.codigo,monto:pedido.total,estado:'Pendiente',fecha:new Date().toISOString()},...s.pagos],carrito:[]}));emitirEventoCRM('pedido_creado',pedido);emitirEventoCRM('pago_pendiente',pedido);return pedido};
 const crearLead=(lead)=>{const nuevo={id:uid('lead'),codigo:`LEAD-ELV-${String(state.leads.length+1).padStart(6,'0')}`,estado:'Nuevo',fecha:new Date().toISOString(),...lead};set(s=>({leads:[nuevo,...s.leads]}));emitirEventoCRM('lead_creado',nuevo);return nuevo};
 const guardarCotizacion=(cot)=>{const total=cot.items.reduce((a,i)=>a+(i.total||0),0);const nueva={id:uid('cot'),codigo:`COT-ELV-${String(state.cotizaciones.length+1).padStart(6,'0')}`,estado:'Borrador',fecha:new Date().toISOString(),total,...cot};set(s=>({cotizaciones:[nueva,...s.cotizaciones]}));emitirEventoCRM('cotizacion_creada',nueva);return nueva};
 const validarPago=(pagoId)=>{let orden=null;set(s=>{const pagos=s.pagos.map(p=>p.id===pagoId?{...p,estado:'Validado'}:p);const pago=s.pagos.find(p=>p.id===pagoId);orden={id:uid('ot'),codigo:`OT-ELV-${String(s.ordenes.length+1).padStart(6,'0')}`,origen:pago?.codigo||'Pago',estado:'Pago validado',fecha:new Date().toISOString(),fechaEstimada:'Por definir',historial:[{estado:'Pago validado',fecha:new Date().toISOString()}],seguimiento:`/seguimiento/OT-ELV-${String(s.ordenes.length+1).padStart(6,'0')}`};return{pagos,ordenes:[orden,...s.ordenes]}});emitirEventoCRM('pago_validado',{pagoId});emitirEventoCRM('orden_trabajo_creada',orden);return orden};
 const actualizarEstadoOT=(id,estado)=>set(s=>({ordenes:s.ordenes.map(o=>o.id===id?{...o,estado,historial:[...(o.historial||[]),{estado,fecha:new Date().toISOString()}]}:o)}));
 const crud=(col)=>(item)=>{const data=item.id?state[col].map(x=>x.id===item.id?item:x):[{...item,id:uid(col)},...state[col]];set({[col]:data})};
 const remove=(col,id)=>set(s=>({[col]:s[col].filter(x=>x.id!==id)}));
 const value={...state,set,login,logout,agregarCarrito,confirmarPedido,crearLead,guardarCotizacion,validarPago,actualizarEstadoOT,guardarProducto:crud('productos'),guardarCategoria:crud('categorias'),guardarProveedor:crud('proveedores'),guardarMaterial:crud('materiales'),guardarVendedor:crud('vendedores'),guardarBanco:crud('bancos'),remove};
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>}
export const useElan=()=>useContext(Ctx);
