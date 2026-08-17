import React, { useEffect, useRef, useState } from 'react';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';
const LIVE_TOKEN_KEY = 'elan-live-token';

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

function storedSessionToken() {
  try { return String(sessionStorage.getItem(LIVE_TOKEN_KEY) || '').trim(); }
  catch { return ''; }
}

function persistSessionToken(token) {
  try {
    if (token) sessionStorage.setItem(LIVE_TOKEN_KEY, token);
    else sessionStorage.removeItem(LIVE_TOKEN_KEY);
  } catch {}
}

function phaseLabel(phase, cameraOn, handsFree) {
  if (phase === 'listening') return 'ESCUCHANDO';
  if (phase === 'thinking') return 'PENSANDO';
  if (phase === 'speaking') return 'RESPONDIENDO';
  if (phase === 'auth') return 'CONECTANDO';
  if (cameraOn || phase === 'seeing') return 'VIENDO';
  if (handsFree) return 'CONVERSACIÓN ACTIVA';
  return 'TOCÁ PARA CONVERSAR';
}

function extractAssistantText(data) {
  return String(
    data?.texto ||
    data?.respuesta ||
    data?.message ||
    data?.content ||
    data?.data?.texto ||
    data?.data?.respuesta ||
    data?.data?.message ||
    data?.data?.content ||
    data?.result?.texto ||
    data?.result?.respuesta ||
    ''
  ).trim();
}

export default function ELANLive() {
  const [phase, setPhase] = useState('auth');
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [session, setSession] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [handsFree, setHandsFree] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const handsFreeRef = useRef(false);
  const mountedRef = useRef(true);
  const listeningLockRef = useRef(false);

  useEffect(() => {
    handsFreeRef.current = handsFree;
  }, [handsFree]);

  useEffect(() => {
    let active = true;
    mountedRef.current = true;
    const directToken = sessionTokenFromHash();
    const shortCode = shortCodeFromPath();
    const storedToken = storedSessionToken();
    const reusableToken = directToken || storedToken;

    if (!reusableToken && !shortCode) {
      setError('Abrí ELAN Copiloto desde el enlace enviado por WhatsApp.');
      setPhase('locked');
      return undefined;
    }

    (async () => {
      try {
        const body = reusableToken
          ? { tipo: 'live-session-verify', token: reusableToken }
          : { tipo: 'live-code-exchange', code: shortCode };
        const response = await fetch(ELAN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.session) {
          throw new Error(data?.error || 'La sesión ELAN Live no es válida o ya venció.');
        }
        if (!active) return;

        const token = reusableToken || String(data.token || '').trim();
        if (!token) throw new Error('CONNECT no devolvió una sesión ELAN Live utilizable.');

        persistSessionToken(token);
        setSessionToken(token);
        setSession(data.session);
        setCapabilities(data.capabilities || {});
        setError('');
        setPhase('idle');
        window.history.replaceState({}, '', '/elan-live');
      } catch (err) {
        if (!active) return;
        persistSessionToken('');
        setError(err.name === 'TimeoutError' ? 'CONNECT tardó demasiado en abrir ELAN Live.' : (err.message || 'La sesión ELAN Live no es válida o ya venció.'));
        setPhase('locked');
      }
    })();

    return () => {
      active = false;
      mountedRef.current = false;
      handsFreeRef.current = false;
      try { recognitionRef.current?.abort?.(); } catch {}
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      window.speechSynthesis?.cancel?.();
    };
  }, []);

  function returnToListening(delay = 260) {
    if (!handsFreeRef.current || !mountedRef.current) {
      setPhase(cameraOn ? 'seeing' : 'idle');
      return;
    }
    setTimeout(() => {
      if (handsFreeRef.current && mountedRef.current) listen();
    }, delay);
  }

  async function setCamera(enabled, nextFacing = facingMode) {
    if (!capabilities?.canUseCamera && enabled) {
      speak('Tu perfil no tiene permiso para usar cámara.');
      return;
    }
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false
      });
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
    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  function speak(text) {
    const clean = String(text || '').trim();
    if (!clean) {
      returnToListening();
      return;
    }
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      setError('El navegador no pudo reproducir la respuesta por voz.');
      returnToListening();
      return;
    }

    try { recognitionRef.current?.abort?.(); } catch {}
    listeningLockRef.current = false;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'es-NI';
    utterance.rate = 1.04;

    // No dependemos de onstart: Android puede omitirlo y dejar la UI en PENSANDO.
    setPhase('speaking');
    utterance.onstart = () => setPhase('speaking');
    utterance.onend = () => returnToListening(220);
    utterance.onerror = () => {
      setError('No pude reproducir la voz. Continúo escuchando.');
      returnToListening(220);
    };

    window.speechSynthesis.speak(utterance);

    // Watchdog para motores TTS móviles que quedan en estado pending sin eventos.
    setTimeout(() => {
      if (!mountedRef.current) return;
      if (window.speechSynthesis.pending && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setError('La voz se demoró. Volví a escuchar.');
        returnToListening(120);
      }
    }, 3000);
  }

  async function exitLive() {
    handsFreeRef.current = false;
    setHandsFree(false);
    try { recognitionRef.current?.abort?.(); } catch {}
    await setCamera(false);
    window.speechSynthesis?.cancel?.();
    persistSessionToken('');
    window.location.replace('https://www.elankav.com');
  }

  async function askELAN(text) {
    const command = String(text || '').trim();
    if (!command || !session) {
      returnToListening();
      return;
    }
    const normalized = command.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    if (/^(elan[, ]*)?(salir|cerrar|terminar|finalizar)( sesion| modo copiloto| copiloto)?$/.test(normalized)) {
      handsFreeRef.current = false;
      setHandsFree(false);
      speak('Cerrando sesión.');
      setTimeout(() => exitLive(), 650);
      return;
    }
    if (normalized.includes('activa') && normalized.includes('camara')) {
      await setCamera(true);
      speak('Cámara activada. Ya puedo ver lo que me mostrás.');
      return;
    }
    if ((normalized.includes('apaga') || normalized.includes('desactiva')) && normalized.includes('camara')) {
      await setCamera(false);
      speak('Cámara desactivada.');
      return;
    }
    if ((normalized.includes('cambia') || normalized.includes('cambiar')) && normalized.includes('camara')) {
      const next = facingMode === 'environment' ? 'user' : 'environment';
      await setCamera(true, next);
      speak(next === 'environment' ? 'Cámara trasera activada.' : 'Cámara frontal activada.');
      return;
    }

    setPhase('thinking');
    try {
      const frame = captureFrame();
      const body = {
        modo: 'copilot',
        unidad: 'ELANVISUAL',
        canal: 'web-live',
        live_session_token: sessionToken,
        runtime_context: {
          mode: 'live',
          camera: cameraOn,
          facingMode,
          pathname: window.location.pathname
        },
        messages: [{ role: 'user', content: command }],
        archivos_temporales: frame ? [{
          nombre: 'elan-live-camera.jpg',
          tipo: 'image/jpeg',
          extension: 'jpg',
          dataUrl: frame,
          temporal: true,
          guardar_permanente: false
        }] : []
      };
      const response = await fetch(ELAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || `CONNECT respondió ${response.status}`);
      const answer = extractAssistantText(data) || 'Listo.';
      setError('');
      speak(answer);
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'ELAN tardó demasiado en responder. Volví a escuchar.' : (err.message || 'No pude comunicarme con CONNECT.'));
      speak('No pude completar esa operación. Intentemos otra vez.');
    }
  }

  function listen() {
    if (!session || !capabilities?.canUseAssistant || listeningLockRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Este navegador no ofrece reconocimiento de voz compatible.');
      handsFreeRef.current = false;
      setHandsFree(false);
      return;
    }

    try { recognitionRef.current?.abort?.(); } catch {}
    window.speechSynthesis?.cancel?.();

    const recognition = new SR();
    recognition.lang = 'es-NI';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    listeningLockRef.current = true;

    recognition.onstart = () => {
      setPhase('listening');
      setError('');
    };
    recognition.onresult = (event) => {
      listeningLockRef.current = false;
      const text = event.results?.[0]?.[0]?.transcript || '';
      if (text) askELAN(text);
      else returnToListening();
    };
    recognition.onerror = (event) => {
      listeningLockRef.current = false;
      if (event.error === 'no-speech') {
        returnToListening(180);
        return;
      }
      if (event.error !== 'aborted') setError('No pude escuchar. Intentando nuevamente.');
      if (event.error !== 'aborted') returnToListening(350);
    };
    recognition.onend = () => {
      listeningLockRef.current = false;
      setPhase((current) => current === 'listening' ? (cameraOn ? 'seeing' : 'idle') : current);
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      listeningLockRef.current = false;
      returnToListening(350);
    }
  }

  function toggleConversation() {
    if (handsFreeRef.current) {
      handsFreeRef.current = false;
      setHandsFree(false);
      listeningLockRef.current = false;
      try { recognitionRef.current?.abort?.(); } catch {}
      window.speechSynthesis?.cancel?.();
      setPhase(cameraOn ? 'seeing' : 'idle');
      return;
    }
    handsFreeRef.current = true;
    setHandsFree(true);
    setError('');
    listen();
  }

  if (phase === 'auth' || phase === 'locked') {
    return <main className="elan-live elan-live-locked">
      <div className="elan-live-stage">
        <span className="elan-live-orb"><span className="elan-live-core" /></span>
        <span className="elan-live-status">{phase === 'auth' ? 'CONECTANDO' : 'SESIÓN CERRADA'}</span>
      </div>
      {error && <div className="elan-live-error">{error}</div>}
    </main>;
  }

  return <main className={`elan-live phase-${phase} ${handsFree ? 'hands-free' : ''}`}>
    <video ref={videoRef} className={`elan-live-camera ${cameraOn ? 'active' : ''}`} autoPlay muted playsInline />
    <div className="elan-live-shade" />
    <div className="elan-live-stage">
      <button type="button" className="elan-live-presence" onClick={toggleConversation} aria-label={handsFree ? 'Detener conversación con ELAN' : 'Iniciar conversación con ELAN'}>
        <span className="elan-live-orb">
          <span className="elan-live-core" />
          <span className="elan-live-glow" />
        </span>
      </button>
      <span className="elan-live-status">{phaseLabel(phase, cameraOn, handsFree)}</span>
    </div>
    {cameraOn && <button type="button" className="elan-live-camera-switch" onClick={() => setCamera(true, facingMode === 'environment' ? 'user' : 'environment')} aria-label="Cambiar cámara">↻</button>}
    {error && <div className="elan-live-error" onClick={() => setError('')}>{error}</div>}
  </main>;
}
