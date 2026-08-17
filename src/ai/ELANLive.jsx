import React, { useEffect, useRef, useState } from 'react';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';
const REALTIME_TOKEN_API = '/api/elan-realtime-token';
const OPENAI_REALTIME_CALLS = 'https://api.openai.com/v1/realtime/calls';
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

function realtimeErrorMessage(text, status) {
  try {
    const data = JSON.parse(text);
    return data?.error?.message || data?.error || data?.message || `OpenAI Realtime respondió ${status}`;
  } catch {
    return text || `OpenAI Realtime respondió ${status}`;
  }
}

function waitForIceGatheringComplete(peer, timeoutMs = 5000) {
  if (!peer || peer.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      peer.removeEventListener('icegatheringstatechange', check);
      resolve();
    };
    const check = () => {
      if (peer.iceGatheringState === 'complete') finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    peer.addEventListener('icegatheringstatechange', check);
  });
}

function buildRealtimeMultipartSdp(offerSdp) {
  const boundary = `----elanrealtime${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const body = [
    `--${boundary}\r\n`,
    'Content-Disposition: form-data; name="sdp"\r\n',
    'Content-Type: application/sdp\r\n\r\n',
    offerSdp,
    '\r\n',
    `--${boundary}--\r\n`,
  ].join('');
  return { boundary, body };
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
      const tokenResponse = await fetch(REALTIME_TOKEN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_session_token: sessionToken }),
        signal: AbortSignal.timeout(18000),
      });
      const tokenData = await tokenResponse.json().catch(() => ({}));
      const ephemeralKey = String(tokenData?.value || '').trim();
      if (!tokenResponse.ok || !ephemeralKey) {
        throw new Error(tokenData?.error || `No pude autorizar ELAN Realtime (${tokenResponse.status}).`);
      }

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
      await waitForIceGatheringComplete(peer);
      const offerSdp = String(peer.localDescription?.sdp || '');
      if (!offerSdp.startsWith('v=0')) throw new Error('Chrome no generó una oferta WebRTC válida.');

      const { boundary, body: multipartBody } = buildRealtimeMultipartSdp(offerSdp);
      const sdpResponse = await fetch(OPENAI_REALTIME_CALLS, {
        method: 'POST',
        body: multipartBody,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        signal: AbortSignal.timeout(25000),
      });
      const answerSdp = await sdpResponse.text();
      if (!sdpResponse.ok || !answerSdp.trim().startsWith('v=')) {
        throw new Error(realtimeErrorMessage(answerSdp, sdpResponse.status));
      }

      await peer.setRemoteDescription({ type: 'answer', sdp: answerSdp });
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
      setPhase(realtimeActiveRef.current ? 'listening' : 'idle');
      return;
    }

    try {
      cameraStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false,
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play?.().catch(() => {});
      }
      setFacingMode(nextFacing);
      setCameraOn(true);
      setError('');
      if (!realtimeActiveRef.current) setPhase('seeing');
    } catch (err) {
      setError(err.name === 'NotAllowedError' ? 'Necesito permiso de cámara para ver.' : 'No pude activar la cámara.');
    }
  }

  const locked = phase === 'locked';
  const active = realtimeActive;

  return (
    <main className={`elan-live elan-live--${phase}`}>
      <audio ref={audioRef} playsInline />
      {cameraOn && <video ref={videoRef} className="elan-live__camera" playsInline muted />}
      <div className="elan-live__veil" />

      <section className="elan-live__center">
        <button
          type="button"
          className={`elan-live__orb ${active ? 'elan-live__orb--active' : ''}`}
          onClick={toggleConversation}
          disabled={locked || phase === 'auth'}
          aria-label={active ? 'Cerrar conversación con ELAN' : 'Conversar con ELAN'}
        >
          <span className="elan-live__orb-core" />
        </button>
        <div className="elan-live__phase">{phaseLabel(phase, active)}</div>
      </section>

      {capabilities?.canUseCamera && !locked && (
        <div className="elan-live__camera-controls">
          <button type="button" onClick={() => setCamera(!cameraOn)}>{cameraOn ? 'Apagar cámara' : 'Cámara'}</button>
          {cameraOn && (
            <button type="button" onClick={() => setCamera(true, facingMode === 'environment' ? 'user' : 'environment')}>Cambiar</button>
          )}
        </div>
      )}

      {error && <div className="elan-live__error">{error}</div>}
    </main>
  );
}
