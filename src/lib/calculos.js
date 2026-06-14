export function formatoC$ (n){return new Intl.NumberFormat('es-NI',{style:'currency',currency:'NIO'}).format(Number(n||0));}
export function calcularDescuento(cantidad){ if(cantidad>=4)return 15; if(cantidad===3)return 10; if(cantidad===2)return 5; return 0; }
export function resumenCarrito(items){
 const cantidad=items.reduce((a,i)=>a+i.cantidad,0);
 const subtotal=items.reduce((a,i)=>a+i.precio*i.cantidad,0);
 const descuentoPorcentaje=calcularDescuento(cantidad);
 const descuentoMonto=subtotal*(descuentoPorcentaje/100);
 const total=subtotal-descuentoMonto;
 const comision=total*0.10;
 return {cantidad,subtotal,descuentoPorcentaje,descuentoMonto,total,comision};
}

