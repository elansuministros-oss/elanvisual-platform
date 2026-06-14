[1mdiff --git a/src/components/Header.jsx b/src/components/Header.jsx[m
[1mindex 0cd6ed5..6384823 100644[m
[1m--- a/src/components/Header.jsx[m
[1m+++ b/src/components/Header.jsx[m
[36m@@ -1,4 +1,4 @@[m
[31m-import React, { useState } from 'react';[m
[32m+[m[32m﻿import React, { useState } from 'react';[m
 import { Building2, Menu, X, Home, BriefcaseBusiness, Image, ClipboardList, Phone, LayoutDashboard, Factory } from 'lucide-react';[m
 import { useApp } from '../context/AppContext';[m
 [m
[36m@@ -29,7 +29,7 @@[m [mexport default function Header({ page, setPage }) {[m
       ? [['crm', 'CRM', <LayoutDashboard size={22} />]][m
       : []),[m
     ...(usuario?.rol === 'admin' || usuario?.rol === 'produccion'[m
[31m-      ? [['produccion', 'Producción', <Factory size={22} />]][m
[32m+[m[32m      ? [['produccion', 'ProducciÃ³n', <Factory size={22} />]][m
       : []),[m
   ];[m
 [m
[36m@@ -87,7 +87,7 @@[m [mexport default function Header({ page, setPage }) {[m
             type="button"[m
             className="mobile-menu-btn app-menu-btn"[m
             onClick={() => setOpen(!open)}[m
[31m-            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}[m
[32m+[m[32m            aria-label={open ? 'Cerrar menÃº' : 'Abrir menÃº'}[m
           >[m
             {open ? <X size={38} /> : <Menu size={38} />}[m
           </button>[m
[36m@@ -125,4 +125,4 @@[m [mexport default function Header({ page, setPage }) {[m
       </header>[m
     </>[m
   );[m
[31m-}[m
\ No newline at end of file[m
[32m+[m[32m}[m
[1mdiff --git a/src/crm/CentroWhatsApp.jsx b/src/crm/CentroWhatsApp.jsx[m
[1mindex 7d0f011..5a9b525 100644[m
[1m--- a/src/crm/CentroWhatsApp.jsx[m
[1m+++ b/src/crm/CentroWhatsApp.jsx[m
[36m@@ -1,52 +1,52 @@[m
[31m-import React, { useMemo, useState } from 'react';[m
[32m+[m[32m﻿import React, { useMemo, useState } from 'react';[m
 import { useCore } from '../core/context/CoreContext';[m
 [m
 const UNIDADES_NEGOCIO = [[m
[31m-  'ELANPET',[m
[31m-  'ELANKAV VISUAL',[m
[32m+[m[32m  'ELANVISUAL',[m
[32m+[m[32m  'ELANVISUAL',[m
   'ELANKAV CENTER',[m
[31m-  'ELANKAV SOLAR',[m
[32m+[m[32m  'ELANHOME',[m
   'ELAN AI',[m
 ];[m
 [m
 const ORIGENES_MENSAJE = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Referido', 'Web', 'Llamada'];[m
 const TIPOS_CLIENTE = ['Nuevo', 'Recurrente', 'Empresa', 'Veterinaria', 'Afiliado', 'Proveedor', 'Aliado'];[m
 const ESTADOS_LEAD = ['Nuevo', 'Respondido', 'Cotizado', 'Ganado', 'Perdido'];[m
[31m-const CLASIFICACIONES = ['Precio', 'Información', 'Ubicación', 'Catálogo', 'Cotización', 'Seguimiento'];[m
[32m+[m[32mconst CLASIFICACIONES = ['Precio', 'InformaciÃ³n', 'UbicaciÃ³n', 'CatÃ¡logo', 'CotizaciÃ³n', 'Seguimiento'];[m
 [m
 const SERVICIOS_POR_UNIDAD = {[m
[31m-  ELANPET: [[m
[31m-    'Catálogo de productos para mascotas',[m
[31m-    'Pedido ELANPET',[m
[31m-    'Afiliación veterinaria',[m
[32m+[m[32m  ELANVISUAL: [[m
[32m+[m[32m    'CatÃ¡logo de productos para mascotas',[m
[32m+[m[32m    'Pedido ELANVISUAL',[m
[32m+[m[32m    'AfiliaciÃ³n veterinaria',[m
     'Seguimiento de pedido',[m
[31m-    'Consulta general ELANPET',[m
[32m+[m[32m    'Consulta general ELANVISUAL',[m
   ],[m
[31m-  'ELANKAV VISUAL': [[m
[31m-    'Rotulación',[m
[31m-    'Impresión digital',[m
[31m-    'Rótulo 3D',[m
[32m+[m[32m  'ELANVISUAL': [[m
[32m+[m[32m    'RotulaciÃ³n',[m
[32m+[m[32m    'ImpresiÃ³n digital',[m
[32m+[m[32m    'RÃ³tulo 3D',[m
     'Caja de luz',[m
     'Fachada comercial',[m
[31m-    'Acrílico / PVC / CNC / Láser',[m
[32m+[m[32m    'AcrÃ­lico / PVC / CNC / LÃ¡ser',[m
     'Displays y material POP',[m
   ],[m
   'ELANKAV CENTER': [[m
[31m-    'Centro de cómputo',[m
[31m-    'Diseño gráfico',[m
[31m-    'Capacitación',[m
[32m+[m[32m    'Centro de cÃ³mputo',[m
[32m+[m[32m    'DiseÃ±o grÃ¡fico',[m
[32m+[m[32m    'CapacitaciÃ³n',[m
     'Servicio empresarial',[m
     'Consulta general CENTER',[m
   ],[m
[31m-  'ELANKAV SOLAR': [[m
[32m+[m[32m  'ELANHOME': [[m
     'Paneles solares',[m
[31m-    'Cotización solar',[m
[31m-    'Diagnóstico energético',[m
[31m-    'Instalación solar',[m
[32m+[m[32m    'CotizaciÃ³n solar',[m
[32m+[m[32m    'DiagnÃ³stico energÃ©tico',[m
[32m+[m[32m    'InstalaciÃ³n solar',[m
     'Mantenimiento solar',[m
   ],[m
   'ELAN AI': [[m
[31m-    'Automatización con IA',[m
[32m+[m[32m    'AutomatizaciÃ³n con IA',[m
     'Asistente para negocio',[m
     'CRM / ERP / Sistema web',[m
     'Contenido con IA',[m
[36m@@ -54,7 +54,7 @@[m [mconst SERVICIOS_POR_UNIDAD = {[m
   ],[m
 };[m
 [m
[31m-const RESPUESTA_BASE = `Hola, gracias por escribirnos 😊[m
[32m+[m[32mconst RESPUESTA_BASE = `Hola, gracias por escribirnos ðŸ˜Š[m
 [m
 Con gusto te ayudo.[m
 [m
[36m@@ -62,7 +62,7 @@[m [mPara cotizarte correctamente necesito:[m
 [m
 1. Medida aproximada[m
 2. Foto del lugar[m
[31m-3. Ciudad o ubicación[m
[32m+[m[32m3. Ciudad o ubicaciÃ³n[m
 4. Tipo de trabajo que necesitas[m
 [m
 Con eso te preparo una propuesta clara y detallada.`;[m
[36m@@ -73,20 +73,20 @@[m [mconst PLANTILLAS_RAPIDAS = [[m
     texto: RESPUESTA_BASE,[m
   },[m
   {[m
[31m-    nombre: 'Enviar catálogo',[m
[31m-    texto: 'Claro 😊 te puedo enviar el catálogo. Decime por favor qué tipo de producto o servicio estás buscando para mandarte la información correcta.',[m
[32m+[m[32m    nombre: 'Enviar catÃ¡logo',[m
[32m+[m[32m    texto: 'Claro ðŸ˜Š te puedo enviar el catÃ¡logo. Decime por favor quÃ© tipo de producto o servicio estÃ¡s buscando para mandarte la informaciÃ³n correcta.',[m
   },[m
   {[m
[31m-    nombre: 'Ubicación y visita técnica',[m
[31m-    texto: 'Para revisar bien el trabajo necesito la ubicación exacta o una referencia del lugar. Si amerita visita técnica, te confirmo disponibilidad y costo antes de programarla.',[m
[32m+[m[32m    nombre: 'UbicaciÃ³n y visita tÃ©cnica',[m
[32m+[m[32m    texto: 'Para revisar bien el trabajo necesito la ubicaciÃ³n exacta o una referencia del lugar. Si amerita visita tÃ©cnica, te confirmo disponibilidad y costo antes de programarla.',[m
   },[m
   {[m
     nombre: 'Seguimiento comercial',[m
[31m-    texto: 'Hola 😊 solo te doy seguimiento a la solicitud. Si todavía estás interesado, puedo prepararte la propuesta o ajustar la cotización según lo que necesités.',[m
[32m+[m[32m    texto: 'Hola ðŸ˜Š solo te doy seguimiento a la solicitud. Si todavÃ­a estÃ¡s interesado, puedo prepararte la propuesta o ajustar la cotizaciÃ³n segÃºn lo que necesitÃ©s.',[m
   },[m
   {[m
     nombre: 'Cierre ganado',[m
[31m-    texto: 'Perfecto, gracias por confirmar 😊 Para iniciar el trabajo dejamos registrado el pedido y coordinamos anticipo, medidas finales y fecha de entrega.',[m
[32m+[m[32m    texto: 'Perfecto, gracias por confirmar ðŸ˜Š Para iniciar el trabajo dejamos registrado el pedido y coordinamos anticipo, medidas finales y fecha de entrega.',[m
   },[m
 ];[m
 [m
[36m@@ -94,12 +94,12 @@[m [mconst formInicial = {[m
   nombre: '',[m
   whatsapp: '',[m
   mensaje: '',[m
[31m-  unidadNegocio: 'ELANKAV VISUAL',[m
[31m-  servicioSolicitado: 'Rotulación',[m
[32m+[m[32m  unidadNegocio: 'ELANVISUAL',[m
[32m+[m[32m  servicioSolicitado: 'RotulaciÃ³n',[m
   origenMensaje: 'WhatsApp',[m
   tipoCliente: 'Nuevo',[m
   estadoLead: 'Nuevo',[m
[31m-  clasificacion: 'Información',[m
[32m+[m[32m  clasificacion: 'InformaciÃ³n',[m
   seguimiento: '',[m
   responsable: '',[m
 };[m
[36m@@ -192,12 +192,12 @@[m [mexport default function CentroWhatsApp() {[m
       nombre: lead.nombre || '',[m
       whatsapp: lead.whatsapp || '',[m
       mensaje: lead.mensaje || '',[m
[31m-      unidadNegocio: lead.unidadNegocio || 'ELANKAV VISUAL',[m
[31m-      servicioSolicitado: lead.servicioSolicitado || 'Rotulación',[m
[32m+[m[32m      unidadNegocio: lead.unidadNegocio || 'ELANVISUAL',[m
[32m+[m[32m      servicioSolicitado: lead.servicioSolicitado || 'RotulaciÃ³n',[m
       origenMensaje: lead.origenMensaje || 'WhatsApp',[m
       tipoCliente: lead.tipoCliente || 'Nuevo',[m
       estadoLead: lead.estadoLead || 'Nuevo',[m
[31m-      clasificacion: lead.clasificacion || 'Información',[m
[32m+[m[32m      clasificacion: lead.clasificacion || 'InformaciÃ³n',[m
       seguimiento: lead.seguimiento || '',[m
       responsable: lead.responsable || '',[m
     });[m
[36m@@ -473,7 +473,7 @@[m [mexport default function CentroWhatsApp() {[m
       <div className="page-header">[m
         <div>[m
           <h2>Centro de WhatsApp y Leads</h2>[m
[31m-          <p>Clasificación multinegocio para mensajes de WhatsApp, redes sociales, referidos y seguimiento comercial.</p>[m
[32m+[m[32m          <p>ClasificaciÃ³n multinegocio para mensajes de WhatsApp, redes sociales, referidos y seguimiento comercial.</p>[m
         </div>[m
       </div>[m
 [m
[36m@@ -527,7 +527,7 @@[m [mexport default function CentroWhatsApp() {[m
               </label>[m
 [m
               <label>[m
[31m-                Clasificación[m
[32m+[m[32m                ClasificaciÃ³n[m
                 <select name="clasificacion" value={form.clasificacion} onChange={cambiar}>[m
                   {CLASIFICACIONES.map((item) => <option key={item} value={item}>{item}</option>)}[m
                 </select>[m
[36m@@ -545,30 +545,30 @@[m [mexport default function CentroWhatsApp() {[m
 [m
               <label className="wa-full">[m
                 Mensaje recibido[m
[31m-                <textarea name="mensaje" value={form.mensaje} onChange={cambiar} placeholder="Copiar aquí lo que escribió el cliente" />[m
[32m+[m[32m                <textarea name="mensaje" value={form.mensaje} onChange={cambiar} placeholder="Copiar aquÃ­ lo que escribiÃ³ el cliente" />[m
               </label>[m
 [m
               <label className="wa-full">[m
                 Seguimiento comercial[m
[31m-                <textarea name="seguimiento" value={form.seguimiento} onChange={cambiar} placeholder="Pendiente, próxima acción, observaciones o acuerdo" />[m
[32m+[m[32m                <textarea name="seguimiento" value={form.seguimiento} onChange={cambiar} placeholder="Pendiente, prÃ³xima acciÃ³n, observaciones o acuerdo" />[m
               </label>[m
 [m
               <label className="wa-full">[m
                 Responsable[m
[31m-                <input name="responsable" value={form.responsable} onChange={cambiar} placeholder="Persona que dará seguimiento" />[m
[32m+[m[32m                <input name="responsable" value={form.responsable} onChange={cambiar} placeholder="Persona que darÃ¡ seguimiento" />[m
               </label>[m
             </div>[m
 [m
             <div className="wa-actions">[m
               <button type="submit" className="wa-btn primary">{editandoId ? 'Guardar cambios' : 'Guardar lead'}</button>[m
[31m-              {editandoId && <button type="button" className="wa-btn" onClick={limpiar}>Cancelar edición</button>}[m
[32m+[m[32m              {editandoId && <button type="button" className="wa-btn" onClick={limpiar}>Cancelar ediciÃ³n</button>}[m
             </div>[m
           </form>[m
         </div>[m
 [m
         <div>[m
           <div className="wa-card" style={{ marginBottom: '18px' }}>[m
[31m-            <h3>Respuestas rápidas</h3>[m
[32m+[m[32m            <h3>Respuestas rÃ¡pidas</h3>[m
             <label>[m
               Plantilla[m
               <select[m
[36m@@ -616,7 +616,7 @@[m [mexport default function CentroWhatsApp() {[m
 [m
               <label>[m
                 Buscar[m
[31m-                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, número o servicio" />[m
[32m+[m[32m                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre, nÃºmero o servicio" />[m
               </label>[m
             </div>[m
 [m
[36m@@ -637,21 +637,21 @@[m [mexport default function CentroWhatsApp() {[m
                   <div className="wa-tags">[m
                     <span className="wa-tag">{lead.unidadNegocio || 'Sin unidad'}</span>[m
                     <span className="wa-tag">{lead.origenMensaje || 'Sin origen'}</span>[m
[31m-                    <span className="wa-tag orange">{lead.clasificacion || 'Sin clasificación'}</span>[m
[32m+[m[32m                    <span className="wa-tag orange">{lead.clasificacion || 'Sin clasificaciÃ³n'}</span>[m
                     <span className="wa-tag">{lead.tipoCliente || 'Sin tipo'}</span>[m
                   </div>[m
 [m
                   {lead.mensaje && <p><strong>Mensaje:</strong> {lead.mensaje}</p>}[m
                   {lead.seguimiento && <p><strong>Seguimiento:</strong> {lead.seguimiento}</p>}[m
[31m-                  <p><strong>Último movimiento:</strong> {fechaLegible(lead.actualizado || lead.fechaRegistro)}</p>[m
[31m-                  {lead.contactoId && <p><strong>Contacto creado:</strong> Sí</p>}[m
[31m-                  {lead.cotizacionId && <p><strong>Cotización creada:</strong> Sí</p>}[m
[32m+[m[32m                  <p><strong>Ãšltimo movimiento:</strong> {fechaLegible(lead.actualizado || lead.fechaRegistro)}</p>[m
[32m+[m[32m                  {lead.contactoId && <p><strong>Contacto creado:</strong> SÃ­</p>}[m
[32m+[m[32m                  {lead.cotizacionId && <p><strong>CotizaciÃ³n creada:</strong> SÃ­</p>}[m
 [m
                   <div className="wa-actions">[m
                     <button type="button" className="wa-btn" onClick={() => editar(lead)}>Editar</button>[m
                     <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Respondido')}>Respondido</button>[m
                     <button type="button" className="wa-btn primary" onClick={() => crearContacto(lead)}>Crear contacto</button>[m
[31m-                    <button type="button" className="wa-btn blue" onClick={() => crearCotizacion(lead)}>Crear cotización</button>[m
[32m+[m[32m                    <button type="button" className="wa-btn blue" onClick={() => crearCotizacion(lead)}>Crear cotizaciÃ³n</button>[m
                     <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Ganado')}>Ganado</button>[m
                     <button type="button" className="wa-btn" onClick={() => cambiarEstadoRapido(lead, 'Perdido')}>Perdido</button>[m
                     <button type="button" className="wa-btn danger" onClick={() => eliminarLeadWhatsApp(lead.id)}>Eliminar</button>[m
[36m@@ -665,3 +665,4 @@[m [mexport default function CentroWhatsApp() {[m
     </div>[m
   );[m
 }[m
[41m+[m
[1mdiff --git a/src/pages/ProduccionPanel.jsx b/src/pages/ProduccionPanel.jsx[m
[1mindex 049e789..d872218 100644[m
[1m--- a/src/pages/ProduccionPanel.jsx[m
[1m+++ b/src/pages/ProduccionPanel.jsx[m
[36m@@ -1,40 +1,116 @@[m
[31m-import React, { useMemo, useState } from 'react';[m
[31m-import { Camera, ClipboardList, ExternalLink, PackageCheck, Save, Send, Video } from 'lucide-react';[m
[31m-import { estadosProduccion, etiquetasEstado, useApp } from '../context/AppContext';[m
[32m+[m[32m﻿import React, { useMemo, useState } from 'react';[m
[32m+[m[32mimport {[m
[32m+[m[32m  Camera,[m
[32m+[m[32m  ClipboardList,[m
[32m+[m[32m  ExternalLink,[m
[32m+[m[32m  PackageCheck,[m
[32m+[m[32m  Save,[m
[32m+[m[32m  Send,[m
[32m+[m[32m  Video,[m
[32m+[m[32m} from 'lucide-react';[m
[32m+[m[32mimport { useApp } from '../context/AppContext';[m
[32m+[m
[32m+[m[32mconst ESTADOS_PRODUCCION_VISUAL = [[m
[32m+[m[32m  'pendiente',[m
[32m+[m[32m  'diseno',[m
[32m+[m[32m  'aprobacion_cliente',[m
[32m+[m[32m  'produccion',[m
[32m+[m[32m  'instalacion',[m
[32m+[m[32m  'entregado',[m
[32m+[m[32m  'cerrado',[m
[32m+[m[32m];[m
[32m+[m
[32m+[m[32mconst ETIQUETAS_ESTADO_VISUAL = {[m
[32m+[m[32m  pendiente: 'Pendiente',[m
[32m+[m[32m  diseno: 'Diseño',[m
[32m+[m[32m  aprobacion_cliente: 'Aprobación cliente',[m
[32m+[m[32m  produccion: 'Producción',[m
[32m+[m[32m  instalacion: 'Instalación',[m
[32m+[m[32m  entregado: 'Entregado',[m
[32m+[m[32m  cerrado: 'Cerrado',[m
[32m+[m[32m};[m
 [m
 const evidenciaLabels = {[m
   inicial: 'Evidencia inicial',[m
[31m-  proceso: 'Evidencia proceso',[m
[31m-  terminado: 'Evidencia terminado',[m
[31m-  entrega: 'Evidencia entrega',[m
[32m+[m[32m  diseno: 'Diseño aprobado',[m
[32m+[m[32m  proceso: 'Evidencia de producción',[m
[32m+[m[32m  instalacion: 'Evidencia de instalación',[m
[32m+[m[32m  entrega: 'Evidencia de entrega',[m
 };[m
 [m
 const estadoDefault = 'pendiente';[m
[31m-const seguimientoUrl = 'https://pet.elankav.com/seguimiento';[m
[32m+[m[32mconst seguimientoUrl = 'https://visual.elankav.com/seguimiento';[m
 [m
 function estadoPedido(pedido) {[m
   return pedido.estadoProduccion || pedido.ordenTrabajo?.estadoProduccion || estadoDefault;[m
 }[m
 [m
[32m+[m[32mfunction limpiarNumero(valor) {[m
[32m+[m[32m  return String(valor || '').replace(/[^0-9]/g, '');[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction numeroWhatsApp(numero) {[m
[32m+[m[32m  const limpio = limpiarNumero(numero);[m
[32m+[m[32m  if (limpio.length === 8) return `505${limpio}`;[m
[32m+[m[32m  return limpio;[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction obtenerMonto(pedido) {[m
[32m+[m[32m  return Number([m
[32m+[m[32m    pedido.total ||[m
[32m+[m[32m      pedido.monto ||[m
[32m+[m[32m      pedido.resumen?.total ||[m
[32m+[m[32m      pedido.cotizacion?.total ||[m
[32m+[m[32m      0[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m
[32m+[m[32mfunction obtenerAnticipo(pedido) {[m
[32m+[m[32m  return Number([m
[32m+[m[32m    pedido.anticipo ||[m
[32m+[m[32m      pedido.montoAnticipo ||[m
[32m+[m[32m      pedido.pago?.anticipo ||[m
[32m+[m[32m      pedido.resumen?.anticipo ||[m
[32m+[m[32m      obtenerMonto(pedido) * 0.6 ||[m
[32m+[m[32m      0[m
[32m+[m[32m  );[m
[32m+[m[32m}[m
[32m+[m
 function crearOTBase(pedido) {[m
[31m-  const items = pedido.items || [];[m
[32m+[m[32m  const items = Array.isArray(pedido.items) ? pedido.items : [];[m
[32m+[m[32m  const monto = obtenerMonto(pedido);[m
[32m+[m[32m  const anticipo = obtenerAnticipo(pedido);[m
[32m+[m[32m  const saldo = Math.max(monto - anticipo, 0);[m
[32m+[m
   return {[m
     codigoOT:[m
       pedido.ordenTrabajo?.codigoOT ||[m
[31m-      `OT-${String(pedido.codigoSeguimiento || pedido.numero || pedido.id || Date.now()).replace(/[^0-9]/g, '').slice(-6)}`,[m
[32m+[m[32m      `OTV-${String([m
[32m+[m[32m        pedido.codigoSeguimiento || pedido.numero || pedido.id || Date.now()[m
[32m+[m[32m      )[m
[32m+[m[32m        .replace(/[^0-9]/g, '')[m
[32m+[m[32m        .slice(-6)}`,[m
     pedido: pedido.codigoSeguimiento || pedido.numero || '',[m
[31m-    cliente: pedido.cliente?.nombre || '',[m
[31m-    veterinaria: pedido.veterinaria?.nombre || pedido.veterinariaNombre || '',[m
[31m-    producto: items.map((item) => item.nombre).join(', '),[m
[31m-    cantidad: items.reduce((total, item) => total + Number(item.cantidad || 0), 0),[m
[32m+[m[32m    cliente: pedido.cliente?.nombre || pedido.clienteNombre || '',[m
[32m+[m[32m    vendedor: pedido.vendedor || pedido.vendedorNombre || '',[m
[32m+[m[32m    fecha: pedido.ordenTrabajo?.fecha || pedido.createdAt || new Date().toISOString(),[m
[32m+[m[32m    servicio:[m
[32m+[m[32m      pedido.ordenTrabajo?.servicio ||[m
[32m+[m[32m      pedido.servicio ||[m
[32m+[m[32m      pedido.tipoServicio ||[m
[32m+[m[32m      items.map((item) => item.nombre).join(', ') ||[m
[32m+[m[32m      'Servicio ELANVISUAL',[m
[32m+[m[32m    monto: pedido.ordenTrabajo?.monto ?? monto,[m
[32m+[m[32m    anticipo: pedido.ordenTrabajo?.anticipo ?? anticip