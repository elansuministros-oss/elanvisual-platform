import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { buildAIRuntimeContext, getAICapabilitiesForRole } from './aiCapabilities';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';

export default function ELANLive() {
  const { usuario } = useApp();
  const [phase, setPhase] = useState('idle');
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const capabilities = getAICapabilitiesForRole(usuario?.rol);

  useEffect(() => () => {
    try { recognitionRef.current?.stop?.(); } catch {}
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    window.speechSynthesis?.cancel?.();
  }, []);

  async function setCamera(enabled, nextFacing = facingMode) {
    if (!enabled) {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      setPhase('idle');
      return;
    }
    try {
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: nextFacing } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setFacingMode(nextFacing);
      setCameraOn(true);
      setPhase('seeing');
      setError('');
    } catch {
      setError('No pude acceder a la cámara. Revisá el permiso del navegador.');
      setPhase('idle');
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!cameraOn || !video?.videoWidth) return null;
    const canvas = document.createElement('canvas');
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  function speak(text) {
    const clean = String(text || '').trim();
    if (!clean || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-NI';
    utterance.onstart = () => setPhase('speaking');
    utterance.onend = () => setPhase(cameraOn ? 'seeing' : 'idle');
    window.speechSynthesis.speak(utterance);
  }

  async function askELAN(text) {
    const command = String(text || '').trim();
    if (!command) return;
    const normalized = command.toLowerCase();
    if (normalized.includes('activa') && normalized.includes('cámara')) { await setCamera(true); speak('Cámara activada. Ya puedo ver lo que me mostrás.'); return; }
    if ((normalized.includes('apaga') || normalized.includes('desactiva')) && normalized.includes('cámara')) { await setCamera(false); speak('Cámara desactivada.'); return; }
    if ((normalized.includes('cambia') || normalized.includes('cambiar')) && normalized.includes('cámara')) { const next = facingMode === 'environment' ? 'user' : 'environment'; await setCamera(true, next); speak(next === 'environment' ? 'Cámara trasera activada.' : 'Cámara frontal activada.'); return; }

    setPhase('thinking');
    try {
      const frame = captureFrame();
      const runtime = buildAIRuntimeContext({ usuario, contextoAI: { mode: 'live', camera: cameraOn, facingMode } });
      const body = {
        modo: 'copilot', unidad: 'ELANVISUAL', canal: 'web-live',
        runtime_context: runtime,
        capabilities,
        messages: [{ role: 'user', content: command }],
        archivos_temporales: frame ? [{ nombre: 'elan-live-camera.jpg', tipo: 'image/jpeg', extension: 'jpg', dataUrl: frame, temporal: true, guardar_permanente: false }] : []
      };
      const response = await fetch(ELAN_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || `CONNECT respondió ${response.status}`);
      speak(data?.texto || data?.respuesta || data?.message || data?.content || 'Listo.');
      setError('');
    } catch (err) {
      setPhase(cameraOn ? 'seeing' : 'idle');
      setError(err.message || 'No pude comunicarme con CONNECT.');
      speak('No pude completar esa operación.');
    }
  }

  function listen() {
    if (!capabilities.canUseAssistant) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setError('Este navegador no ofrece reconocimiento de voz compatible.'); return; }
    try { recognitionRef.current?.stop?.(); } catch {}
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-NI';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setPhase('listening'); setError(''); };
    recognition.onresult = (event) => { const text = event.results?.[0]?.[0]?.transcript || ''; if (text) askELAN(text); };
    recognition.onerror = (event) => { if (event.error !== 'aborted') setError('No pude escuchar. Tocá ELAN e intentá nuevamente.'); setPhase(cameraOn ? 'seeing' : 'idle'); };
    recognition.onend = () => setPhase((current) => current === 'listening' ? (cameraOn ? 'seeing' : 'idle') : current);
    recognitionRef.current = recognition;
    recognition.start();
  }

  if (!usuario || !capabilities.canUseAssistant) return <div className="elan-live elan-live-locked"><div className="elan-live-orb" /></div>;

  return <main className={`elan-live phase-${phase}`}>
    <video ref={videoRef} className={`elan-live-camera ${cameraOn ? 'active' : ''}`} autoPlay muted playsInline />
    <div className="elan-live-shade" />
    <button type="button" className="elan-live-presence" onClick={listen} aria-label="Hablar con ELAN">
      <span className="elan-live-orb"><span className="elan-live-core" /><span className="elan-live-ring ring-one" /><span className="elan-live-ring ring-two" /></span>
    </button>
    {cameraOn && <button type="button" className="elan-live-camera-switch" onClick={() => setCamera(true, facingMode === 'environment' ? 'user' : 'environment')} aria-label="Cambiar cámara">↻</button>}
    {error && <div className="elan-live-error" onClick={() => setError('')}>{error}</div>}
  </main>;
}
