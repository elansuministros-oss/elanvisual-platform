import React, { useEffect, useRef, useState } from 'react';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';
const REALTIME_API = '/api/elan-realtime';
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

function phaseLabel(phase, active) {
  if (phase === 'listening') return 'ESCUCHANDO';
  if (phase === 'thinking') return 'PENSANDO';
  if (phase === 'speaking') return 'HABLANDO';
  if (phase === 'connecting') return 'CONECTANDO VOZ';
  if (phase === 'auth') return 'CONECTANDO';
  if (active) return 'CONVERSACIÓN ACTIVA';
  return 'TOCÁ PARA CONVERSAR';
}

function waitForIceGathering(peer, timeoutMs = 2500) {
  if (peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      peer.removeEventListener('icegatheringstatechange', check);
      clearTimeout(timer);
      resolve();
    };
    const check = () => {
      if (peer.iceGatheringState === 'complete') finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    peer.addEventListener('icegatheringstatechange', check);
  });
}

export default function ELANLive() {
  const [phase, setPhase] = useState('auth');
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [session, setSession] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mountedRef = useRef(true);
  const realtimeActiveRef = useRef(false);

  useEffect(() => {
    realtimeActiveRef.current = realtimeActive;
  }, [realtimeActive]);

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
          signal: AbortSignal.timeout(15000),
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
      stopRealtime(false);
      cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, []);

  function handleRealtimeEvent(raw) {
    let event;
    try { event = typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return; }
    if (!event || !mountedRef.current) return;

    switch (event.type) {
      case 'session.created':
      case 'session.updated':
        setError('');
        setPhase('listening');
        break;
      case 'input_audio_buffer.speech_started':
        setError('');
        setPhase('listening');
        break;
      case 'input_audio_buffer.speech_stopped':
      case 'response.created':
        setPhase('thinking');
        break;
      case 'output_audio_buffer.started':
        setPhase('speaking');
        break;
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared':
        setPhase('listening');
        break;
      case 'response.done':
        setTimeout(() => {
          if (mountedRef.current && realtimeActiveRef.current) {
            setPhase((current) => current === 'speaking' ? current : 'listening');
          }
        }, 100);
        break;
      case 'error':
        setError(event?.error?.message || 'ELAN Realtime reportó un error recuperable.');
        break;
      default:
        break;
    }
  }

  function stopRealtime(updateUi = true) {
    realtimeActiveRef.current = false;
    if (updateUi) setRealtimeActive(false);

    try { dataChannelRef.current?.close?.(); } catch {}
    dataChannelRef.current = null;

    try { peerRef.current?.close?.(); } catch {}
    peerRef.current = null;

    micStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    micStreamRef.current = null;

    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.srcObject = null;
    }

    if (updateUi && mountedRef.current) setPhase(cameraOn ? 'seeing' : 'idle');
  }

  async function startRealtime() {
    if (!session || !sessionToken || !capabilities?.canUseAssistant) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      setError('Este navegador no soporta ELAN Realtime por WebRTC.');
      return;
    }

    stopRealtime(false);
    setError('');
    setRealtimeActive(true);
    realtimeActiveRef.current = true;
    setPhase('connecting');

    try {
      const mic = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      micStreamRef.current = mic;

      const peer = new RTCPeerConnection();
      peerRef.current = peer;

      peer.ontrack = (event) => {
        const stream = event.streams?.[0];
        if (!stream || !audioRef.current) return;
        audioRef.current.srcObject = stream;
        audioRef.current.autoplay = true;
        audioRef.current.play?.().catch(() => {});
      };

      peer.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        const state = peer.connectionState;
        if (state === 'connected') {
          setError('');
          setPhase('listening');
        } else if (state === 'failed' || state === 'disconnected') {
          setError('La conversación Realtime perdió conexión. Tocá el orbe para reconectar.');
          stopRealtime(true);
        }
      };

      mic.getAudioTracks().forEach((track) => peer.addTrack(track, mic));

      const dataChannel = peer.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;
      dataChannel.onopen = () => {
        if (mountedRef.current) {
          setError('');
          setPhase('listening');
        }
      };
      dataChannel.onmessage = (event) => handleRealtimeEvent(event.data);
      dataChannel.onerror = () => setError('El canal de eventos de ELAN Realtime tuvo un problema.');

      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);

      const response = await fetch(REALTIME_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          live_session_token: sessionToken,
          sdp: peer.localDescription?.sdp || offer.sdp,
        }),
        signal: AbortSignal.timeout(25000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.answerSdp) {
        throw new Error(data?.error || `ELAN Realtime respondió ${response.status}`);
      }

      await peer.setRemoteDescription({ type: 'answer', sdp: data.answerSdp });
      if (mountedRef.current) setPhase('listening');
    } catch (err) {
      stopRealtime(true);
      setError(err.name === 'NotAllowedError'
        ? 'Necesito permiso del micrófono para conversar.'
        : err.name === 'TimeoutError'
          ? 'ELAN Realtime tardó demasiado en conectar.'
          : (err.message || 'No pude abrir la conversación Realtime.'));
    }
  }

  function toggleConversation() {
    if (realtimeActiveRef.current) {
      stopRealtime(true);
      return;
    }
    startRealtime();
  }

  async function setCamera(enabled, nextFacing = facingMode) {
    if (!capabilities?.canUseCamera && enabled) {
      setError('Tu perfil no tiene permiso para usar cámara.');
      return;
    }
    if (!enabled) {
      cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraOn(false);
      return;
    }
    try {
      cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setFacingMode(nextFacing);
      setCameraOn(true);
      setError('');
    } catch {
      setError('No pude acceder a la cámara. Revisá el permiso del navegador.');
    }
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

  return <main className={`elan-live phase-${phase} ${realtimeActive ? 'hands-free realtime-active' : ''}`}>
    <audio ref={audioRef} autoPlay playsInline />
    <video ref={videoRef} className={`elan-live-camera ${cameraOn ? 'active' : ''}`} autoPlay muted playsInline />
    <div className="elan-live-shade" />
    <div className="elan-live-stage">
      <button
        type="button"
        className="elan-live-presence"
        onClick={toggleConversation}
        aria-label={realtimeActive ? 'Detener conversación Realtime con ELAN' : 'Iniciar conversación Realtime con ELAN'}
      >
        <span className="elan-live-orb">
          <span className="elan-live-core" />
          <span className="elan-live-glow" />
        </span>
      </button>
      <span className="elan-live-status">{phaseLabel(phase, realtimeActive)}</span>
    </div>
    {cameraOn && <button type="button" className="elan-live-camera-switch" onClick={() => setCamera(true, facingMode === 'environment' ? 'user' : 'environment')} aria-label="Cambiar cámara">↻</button>}
    {error && <div className="elan-live-error" onClick={() => setError('')}>{error}</div>}
  </main>;
}
