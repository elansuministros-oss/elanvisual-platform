import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAIAssistant } from "./AIAssistantProvider";
import { useApp } from "../context/AppContext";
import { prepararArchivosTemporalesAI, construirResumenArchivosTemporales } from "../services/aiTemporalService";
import { buildAIRuntimeContext, getAICapabilitiesForRole } from "./aiCapabilities";
import "./AIAssistant.css";

const ELAN_API = "/api/elan-ai";

export default function ELANCopilotPanel() {
  const { abierto, cerrarAI, contextoAI } = useAIAssistant();
  const { usuario } = useApp();
  const [mensaje, setMensaje] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [mensajesChat, setMensajesChat] = useState([{ rol:"assistant", texto:"Hola. Soy ELAN. Estoy conectado a CONNECT y puedo ayudarte con operación, análisis, diseño, imágenes y video según tus permisos." }]);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [vozSalida, setVozSalida] = useState(false);
  const recognitionRef = useRef(null);
  const capabilities = useMemo(() => getAICapabilitiesForRole(usuario?.rol), [usuario?.rol]);
  const runtimeContext = useMemo(() => buildAIRuntimeContext({ usuario, contextoAI }), [usuario, contextoAI, abierto]);

  useEffect(() => () => { try { recognitionRef.current?.stop?.(); } catch {} }, []);
  if (!abierto || !capabilities.canUseAssistant) return null;

  async function manejarArchivos(e){ const lista=Array.from(e.target.files||[]); if(!lista.length)return; setError(""); setEstado("Leyendo archivos..."); try{ const preparados=await prepararArchivosTemporalesAI(lista); setArchivos((prev)=>[...prev,...preparados]); setEstado(""); }catch(err){ setError(err.message||"No se pudieron preparar los archivos."); } e.target.value=""; }
  function hablar(texto){ if(!vozSalida||!window.speechSynthesis)return; const limpio=String(texto||"").trim(); if(!limpio)return; window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(limpio); u.lang="es-NI"; window.speechSynthesis.speak(u); }
  function alternarEscucha(){ if(!capabilities.canUseVoice)return; if(escuchando){ recognitionRef.current?.stop?.(); setEscuchando(false); setEstado(""); return; } const SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){ setError("Este navegador no ofrece reconocimiento de voz compatible. Podés seguir usando texto."); return; } const r=new SR(); r.lang="es-NI"; r.interimResults=true; r.continuous=false; r.onstart=()=>{setEscuchando(true);setEstado("Escuchando...");}; r.onresult=(event)=>{let texto="";for(let i=event.resultIndex;i<event.results.length;i+=1)texto+=event.results[i][0]?.transcript||"";if(texto.trim())setMensaje(texto.trim());}; r.onerror=(event)=>{setEscuchando(false);setEstado("");if(event.error!=="aborted")setError(`No se pudo usar el micrófono (${event.error||"error"}).`);}; r.onend=()=>{setEscuchando(false);setEstado("");}; recognitionRef.current=r; r.start(); }

  async function consultarVideo(videoId,messageIndex){ if(!videoId)return; setEstado("Consultando video..."); try{ const res=await fetch(ELAN_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipo:"video-status",videoId,capabilities})}); const data=await res.json(); if(!res.ok)throw new Error(data?.error||`CONNECT respondió ${res.status}`); const job=data?.video_job||null; setMensajesChat((prev)=>prev.map((item,index)=>index===messageIndex?{...item,videoJob:job,videoUrl:job?.status==="completed"?`${ELAN_API}?resource=video-content&id=${encodeURIComponent(job.id)}`:item.videoUrl||null}:item)); setEstado(""); }catch(err){setError(err.message||"No se pudo consultar el video.");setEstado("");} }

  async function enviarMensaje(){ if(!mensaje.trim()&&archivos.length===0)return; const resumen=construirResumenArchivosTemporales(archivos); const contenido=[mensaje.trim(),resumen?`\n\nARCHIVOS TEMPORALES ADJUNTOS:\n${resumen}`:""].join(""); const visible=mensaje.trim()||`Archivo adjunto: ${archivos.map((a)=>a.nombre).join(", ")}`; setMensajesChat((prev)=>[...prev,{rol:"user",texto:visible}]); setCargando(true);setError("");setEstado("Consultando ELAN..."); try{ const res=await fetch(ELAN_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({modo:"copilot",unidad:"ELANVISUAL",canal:"web",contexto:contextoAI,runtime_context:buildAIRuntimeContext({usuario,contextoAI}),capabilities,messages:[{role:"user",content:contenido}],archivos_temporales:archivos.filter((a)=>a.ok).map((a)=>({nombre:a.nombre,tipo:a.tipo,extension:a.extension,tamano:a.tamano,dataUrl:a.dataUrl,metadata:a.metadata,temporal:true,guardar_permanente:false}))})}); const data=await res.json(); if(!res.ok)throw new Error(data?.error||`CONNECT respondió ${res.status}`); const texto=data?.texto||data?.respuesta||data?.message||data?.content||"Respuesta recibida sin texto."; const videoJob=data?.video_job||null; setMensajesChat((prev)=>[...prev,{rol:"assistant",texto,media:Array.isArray(data?.media)?data.media:[],videoJob,videoUrl:videoJob?.status==="completed"?`${ELAN_API}?resource=video-content&id=${encodeURIComponent(videoJob.id)}`:null}]); hablar(texto); setMensaje("");setArchivos([]);setEstado(""); }catch(err){const t=err.message||"No se pudo consultar CONNECT.";setError(t);setMensajesChat((prev)=>[...prev,{rol:"assistant",texto:`No pude conectar con CONNECT. ${t}`,error:true}]);setEstado("");}finally{setCargando(false);} }
  function enviarConEnter(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviarMensaje();}}

  return <div className="elan-ai-panel">
    <div className="elan-ai-header"><div><h3>ELAN</h3><div className="elan-ai-context-line">{runtimeContext.capabilities.role==="owner"?"OWNER":"VENTAS"}<span>·</span>{runtimeContext.pathname}</div></div><div className="elan-ai-header-actions"><button type="button" className={`elan-ai-voice-toggle ${vozSalida?"active":""}`} onClick={()=>setVozSalida((v)=>!v)}>{vozSalida?"🔊":"🔈"}</button><button className="elan-ai-close" onClick={cerrarAI}>×</button></div></div>
    <div className="elan-ai-chat">{mensajesChat.map((m,index)=><div key={index} className={`elan-ai-row ${m.rol}`}>{m.rol==="assistant"&&<div className="elan-ai-avatar">✦</div>}<div className={`elan-ai-bubble ${m.rol} ${m.error?"error":""}`}><div>{m.texto}</div>{Array.isArray(m.media)&&m.media.map((media,i)=>{if(media?.kind!=="image")return null;const src=media.dataUrl||media.url;return src?<img key={i} className="elan-ai-generated-image" src={src} alt="Generado por ELAN"/>:null;})}{m.videoJob&&<div className="elan-ai-video-card"><div className="elan-ai-video-meta">Video · {m.videoJob.status||"procesando"}{m.videoJob.progress!=null?` · ${m.videoJob.progress}%`:""}</div>{m.videoUrl?<video className="elan-ai-generated-video" controls playsInline src={m.videoUrl}/>:<button type="button" className="elan-ai-video-check" onClick={()=>consultarVideo(m.videoJob.id,index)}>Actualizar estado</button>}</div>}</div></div>)}{cargando&&<div className="elan-ai-row assistant"><div className="elan-ai-avatar">✦</div><div className="elan-ai-bubble assistant">Analizando...</div></div>}</div>
    <div className="elan-ai-composer">{archivos.length>0&&<div className="elan-ai-files">{archivos.map((archivo,i)=><span key={`${archivo.nombre}-${i}`} className="elan-ai-file-chip">{archivo.ok?"📎":"⚠"} {archivo.nombre}<button type="button" onClick={()=>setArchivos((prev)=>prev.filter((_,x)=>x!==i))}>×</button></span>)}</div>}{error&&<div className="elan-ai-error">{error}</div>}{estado&&<div className="elan-ai-status">{estado}</div>}<div className="elan-ai-inputbar"><label className="elan-ai-attach">📎<input type="file" multiple accept=".jpg,.jpeg,.png,.svg,.pdf" onChange={manejarArchivos}/></label><button type="button" className={`elan-ai-mic ${escuchando?"listening":""}`} onClick={alternarEscucha} disabled={!capabilities.canUseVoice||cargando}>{escuchando?"●":"🎙"}</button><textarea value={mensaje} onChange={(e)=>setMensaje(e.target.value)} onKeyDown={enviarConEnter} placeholder="Pedile algo a ELAN..." rows={1}/><button type="button" className="elan-ai-send" onClick={enviarMensaje} disabled={cargando}>➤</button></div></div>
  </div>;
}
