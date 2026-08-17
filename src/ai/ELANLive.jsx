import React, { useEffect, useRef, useState } from 'react';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';

function sessionTokenFromHash() {
  const raw = String(window.location.hash || '').replace(/^#/, '');
  const params = new URLSearchParams(raw);
  return String(params.get('session') || '').trim();
}

function shortCodeFromPath() {
  const parts = String(window.location.pathname || '').split('/').filter(Boolean);
  const index = parts.findIndex((part) => part === 'elan-live' || part === 'live');
  return index >= 0 ? String(parts[index + 1] || '').trim() : '';
}

export default function ELANLive() {
  const [phase, setPhase] = useState('auth');
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [session, setSession] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    let active = true;
    const directToken = sessionTokenFromHash();
    const shortCode = shortCodeFromPath();
    if (!directToken && !shortCode) { setPhase('locked'); return undefined; }
    (async () => {
      try {
        const body = directToken
          ? { tipo:'live-session-verify', token:directToken }
          : { tipo:'live-code-exchange', code:shortCode };
        const response = await fetch(ELAN_API, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
        const data = await response.json();
        if (!response.ok || !data?.session) throw new Error(data?.error || 'Sesión inválida.');
        if (!active) return;
        const token = directToken || String(data.token || '');
        setSessionToken(token);
        setSession(data.session);
        setCapabilities(data.capabilities || {});
        setPhase('idle');
        window.history.replaceState({}, '', '/elan-live');
      } catch (err) {
        if (!active) return;
        setError(err.message || 'La sesión no es válida o ya venció.'); setPhase('locked');
      }
    })();
    return () => { active=false; try{recognitionRef.current?.stop?.()}catch{} streamRef.current?.getTracks?.().forEach((track)=>track.stop()); window.speechSynthesis?.cancel?.(); };
  }, []);

  async function setCamera(enabled, nextFacing = facingMode) {
    if (!capabilities?.canUseCamera && enabled) { speak('Tu perfil no tiene permiso para usar cámara.'); return; }
    if (!enabled) { streamRef.current?.getTracks?.().forEach((track)=>track.stop()); streamRef.current=null; if(videoRef.current)videoRef.current.srcObject=null; setCameraOn(false); setPhase('idle'); return; }
    try { streamRef.current?.getTracks?.().forEach((track)=>track.stop()); const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:nextFacing}},audio:false}); streamRef.current=stream; if(videoRef.current)videoRef.current.srcObject=stream; setFacingMode(nextFacing); setCameraOn(true); setPhase('seeing'); setError(''); }
    catch { setError('No pude acceder a la cámara. Revisá el permiso del navegador.'); setPhase('idle'); }
  }

  function captureFrame(){const video=videoRef.current;if(!cameraOn||!video?.videoWidth)return null;const canvas=document.createElement('canvas');const scale=Math.min(1,1280/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',0.82)}
  function speak(text){const clean=String(text||'').trim();if(!clean||!window.speechSynthesis)return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(clean);u.lang='es-NI';u.onstart=()=>setPhase('speaking');u.onend=()=>setPhase(cameraOn?'seeing':'idle');window.speechSynthesis.speak(u)}
  async function exitLive(){try{recognitionRef.current?.stop?.()}catch{}await setCamera(false);window.speechSynthesis?.cancel?.();sessionStorage.removeItem('elan-live-token');window.location.replace('https://www.elankav.com')}

  async function askELAN(text){
    const command=String(text||'').trim();if(!command||!session)return;const normalized=command.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    if(/^(elan[, ]*)?(salir|cerrar|terminar|finalizar)( sesion| modo copiloto| copiloto)?$/.test(normalized)){speak('Cerrando sesión.');setTimeout(()=>exitLive(),650);return;}
    if(normalized.includes('activa')&&normalized.includes('camara')){await setCamera(true);speak('Cámara activada. Ya puedo ver lo que me mostrás.');return;}
    if((normalized.includes('apaga')||normalized.includes('desactiva'))&&normalized.includes('camara')){await setCamera(false);speak('Cámara desactivada.');return;}
    if((normalized.includes('cambia')||normalized.includes('cambiar'))&&normalized.includes('camara')){const next=facingMode==='environment'?'user':'environment';await setCamera(true,next);speak(next==='environment'?'Cámara trasera activada.':'Cámara frontal activada.');return;}
    setPhase('thinking');
    try{
      const frame=captureFrame();
      const body={modo:'copilot',unidad:'ELANVISUAL',canal:'web-live',live_session_token:sessionToken,runtime_context:{mode:'live',camera:cameraOn,facingMode,pathname:window.location.pathname},messages:[{role:'user',content:command}],archivos_temporales:frame?[{nombre:'elan-live-camera.jpg',tipo:'image/jpeg',extension:'jpg',dataUrl:frame,temporal:true,guardar_permanente:false}]:[]};
      const response=await fetch(ELAN_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data?.error||`CONNECT respondió ${response.status}`);speak(data?.texto||data?.respuesta||data?.message||data?.content||'Listo.');setError('');
    }catch(err){setPhase(cameraOn?'seeing':'idle');setError(err.message||'No pude comunicarme con CONNECT.');speak('No pude completar esa operación.');}
  }

  function listen(){if(!session||!capabilities?.canUseAssistant)return;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setError('Este navegador no ofrece reconocimiento de voz compatible.');return;}try{recognitionRef.current?.stop?.()}catch{}const r=new SR();r.lang='es-NI';r.interimResults=false;r.continuous=false;r.onstart=()=>{setPhase('listening');setError('')};r.onresult=(event)=>{const text=event.results?.[0]?.[0]?.transcript||'';if(text)askELAN(text)};r.onerror=(event)=>{if(event.error!=='aborted')setError('No pude escuchar. Tocá ELAN e intentá nuevamente.');setPhase(cameraOn?'seeing':'idle')};r.onend=()=>setPhase((current)=>current==='listening'?(cameraOn?'seeing':'idle'):current);recognitionRef.current=r;r.start()}

  if(phase==='auth'||phase==='locked')return <main className="elan-live elan-live-locked"><span className="elan-live-orb"><span className="elan-live-core"/></span>{error&&<div className="elan-live-error">{error}</div>}</main>;
  return <main className={`elan-live phase-${phase}`}>
    <video ref={videoRef} className={`elan-live-camera ${cameraOn?'active':''}`} autoPlay muted playsInline/>
    <div className="elan-live-shade"/>
    <button type="button" className="elan-live-presence" onClick={listen} aria-label="Hablar con ELAN"><span className="elan-live-orb"><span className="elan-live-core"/><span className="elan-live-ring ring-one"/><span className="elan-live-ring ring-two"/></span></button>
    {cameraOn&&<button type="button" className="elan-live-camera-switch" onClick={()=>setCamera(true,facingMode==='environment'?'user':'environment')} aria-label="Cambiar cámara">↻</button>}
    {error&&<div className="elan-live-error" onClick={()=>setError('')}>{error}</div>}
  </main>;
}
