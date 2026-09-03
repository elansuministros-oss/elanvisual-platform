import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera as FieldCamera } from 'react-webcam-pro';
import { useRecordWebcam } from 'react-record-webcam';
import {
  Camera,
  ChevronLeft,
  Flashlight,
  MessageSquare,
  Mic,
  MicOff,
  Pause,
  Play,
  RotateCcw,
  Square,
  Video,
  X,
} from 'lucide-react';
import ELANFieldThread from './ELANFieldThread';
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
  if (phase === 'thinking') return 'ANALIZANDO';
  if (phase === 'speaking') return 'HABLANDO';
  if (phase === 'connecting') return 'CONECTANDO VOZ';
  if (phase === 'auth') return 'CONECTANDO';
  if (phase === 'seeing') return 'CÁMARA ACTIVA';
  if (active) return 'CONVERSACIÓN ACTIVA';
  return 'LISTO';
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

function isCaptureCommand(value) {
  const text = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\b(captura|captura esta|toma una foto|toma foto|saca una foto|sacale foto|guarda este cuadro|captura este cuadro|captura esta parte)\b/.test(text);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('No pude leer la captura.'));
    reader.readAsDataURL(blob);
  });
}

function injectRealtimeText(channel, role, text) {
  if (!channel || channel.readyState !== 'open' || !String(text || '').trim()) return;
  channel.send(JSON.stringify({
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role,
      content: [{
        type: role === 'assistant' ? 'output_text' : 'input_text',
        text: String(text).trim(),
      }],
    },
  }));
}

export default function ELANLive() {
  const [phase, setPhase] = useState('auth');
  const [error, setError] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [session, setSession] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [runtimeInfo, setRuntimeInfo] = useState(null);
  const [publishedRuntime, setPublishedRuntime] = useState(null);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [lastCapture, setLastCapture] = useState('');
  const [captureAnalysis, setCaptureAnalysis] = useState('');
  const [captureBusy, setCaptureBusy] = useState(false);
  const [recordingId, setRecordingId] = useState('');
  const [recordingNote, setRecordingNote] = useState('');

  const audioRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraRef = useRef(null);
  const mountedRef = useRef(true);
  const realtimeActiveRef = useRef(false);

  const recorder = useRecordWebcam({
    quality: 'high',
    mediaTrackConstraints: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30 },
    },
  });

  const activeRecording = useMemo(
    () => recorder.activeRecordings.find((item) => item.id === recordingId) || null,
    [recorder.activeRecordings, recordingId],
  );
  const recordingActive = ['OPEN', 'RECORDING', 'PAUSED'].includes(String(activeRecording?.status || ''));
  const recordingRunning = activeRecording?.status === 'RECORDING';
  const recordingPaused = activeRecording?.status === 'PAUSED';

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
      setError('Abrí ELAN Copiloto desde el enlace seguro enviado por WhatsApp.');
      setPhase('locked');
      return undefined;
    }

    (async () => {
      try {
        const body = reusableToken
          ? { tipo: 'live-session-verify', token: reusableToken }
          : { tipo: 'live-code-exchange', code: shortCode };
        let response = await fetch(ELAN_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });
        let data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.session) {
          throw new Error(data?.error || 'La sesión ELAN Copiloto no es válida o ya venció.');
        }
        const token = reusableToken || String(data.token || '').trim();
        if (!token) throw new Error('CONNECT no devolvió una sesión utilizable.');

        if (!reusableToken) {
          response = await fetch(ELAN_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: 'live-session-verify', token }),
            signal: AbortSignal.timeout(15000),
          });
          data = await response.json().catch(() => ({}));
          if (!response.ok || !data?.session) throw new Error(data?.error || 'No pude cargar la memoria de ELAN.');
        }

        if (!active) return;
        persistSessionToken(token);
        setSessionToken(token);
        setSession(data.session);
        setCapabilities(data.capabilities || {});
        setRuntimeInfo(data.runtime || null);
        setPublishedRuntime(data.publishedRuntime || null);
        setError('');
        setPhase('idle');
        window.history.replaceState({}, '', '/elan-live');
      } catch (err) {
        if (!active) return;
        persistSessionToken('');
        setError(err.name === 'TimeoutError' ? 'CONNECT tardó demasiado en abrir ELAN Copiloto.' : (err.message || 'La sesión no es válida o ya venció.'));
        setPhase('locked');
      }
    })();

    return () => {
      active = false;
      mountedRef.current = false;
      stopRealtime(false);
      void recorder.clearAllRecordings?.();
    };
  }, []);

  async function persistRealtimeMemory(direction, text, externalMessageId, messageType = 'audio') {
    const content = String(text || '').trim();
    if (!content || !sessionToken) return;
    const response = await fetch(ELAN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'live-memory-event',
        live_session_token: sessionToken,
        direction,
        text: content,
        message_type: messageType,
        external_message_id: externalMessageId || undefined,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error?.message || data?.error || 'CONNECT no confirmó la memoria unificada.');
    }
  }

  async function executeRealtimeTool(event) {
    const tool = String(event?.name || '').trim();
    let args = {};
    try { args = JSON.parse(String(event?.arguments || '{}')); }
    catch { args = {}; }

    const response = await fetch(ELAN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'live-tool',
        live_session_token: sessionToken,
        tool,
        arguments: args,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error?.message || data?.error || 'CONNECT no pudo ejecutar la herramienta solicitada.');
    }
    return data.result ?? data;
  }

  async function handleRealtimeToolCall(event) {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    setPhase('thinking');

    let output;
    try {
      output = await executeRealtimeTool(event);
    } catch (toolError) {
      output = { ok: false, error: toolError?.message || 'No fue posible consultar CONNECT.' };
    }

    const liveChannel = dataChannelRef.current;
    if (!liveChannel || liveChannel.readyState !== 'open') return;
    liveChannel.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: event.call_id,
        output: JSON.stringify(output),
      },
    }));
    liveChannel.send(JSON.stringify({ type: 'response.create' }));
  }

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
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = String(event?.transcript || '').trim();
        void persistRealtimeMemory('inbound', transcript, event?.item_id ? `live-in:${event.item_id}` : undefined, 'audio')
          .catch((memoryError) => setError(memoryError.message || 'No pude guardar el contexto de voz.'));
        if (isCaptureCommand(transcript)) void captureFieldFrame('voice');
        break;
      }
      case 'response.output_audio_transcript.done':
        void persistRealtimeMemory('outbound', event?.transcript, event?.item_id ? `live-out:${event.item_id}` : (event?.response_id ? `live-out:${event.response_id}` : undefined), 'audio')
          .catch((memoryError) => setError(memoryError.message || 'No pude guardar la respuesta de voz.'));
        break;
      case 'output_audio_buffer.started':
        setPhase('speaking');
        break;
      case 'output_audio_buffer.stopped':
      case 'output_audio_buffer.cleared':
        setPhase('listening');
        break;
      case 'response.function_call_arguments.done':
        void handleRealtimeToolCall(event);
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

    if (updateUi && mountedRef.current) setPhase(cameraOn || recordingActive ? 'seeing' : 'idle');
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
          setError('La conversación Realtime perdió conexión. Tocá el micrófono para reconectar.');
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
    void startRealtime();
  }

  function toggleCamera() {
    if (!capabilities?.canUseCamera) {
      setError('Tu usuario no tiene permiso camera.vision en CONNECT.');
      return;
    }
    if (recordingActive) {
      setError('Detené la grabación antes de volver al modo cámara.');
      return;
    }
    setCameraOn((value) => !value);
    setError('');
    setPhase(cameraOn ? (realtimeActiveRef.current ? 'listening' : 'idle') : 'seeing');
  }

  function switchCamera() {
    if (!cameraRef.current || cameraCount <= 1) return;
    try {
      cameraRef.current.switchCamera();
      setTorchOn(false);
    } catch {
      setError('No pude cambiar de cámara en este dispositivo.');
    }
  }

  function toggleTorch() {
    if (!cameraRef.current?.torchSupported) {
      setError('La linterna no está disponible con esta cámara.');
      return;
    }
    try {
      const enabled = cameraRef.current.toggleTorch();
      setTorchOn(Boolean(enabled));
      setError('');
    } catch {
      setError('No pude controlar la linterna.');
    }
  }

  async function analyzeCapture(dataUrl, source = 'camera') {
    setCaptureBusy(true);
    setCaptureAnalysis('');
    try {
      const response = await fetch(ELAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'copilot',
          unidad: 'ELANVISUAL',
          canal: 'web-live',
          live_session_token: sessionToken,
          client_message_id: `field-capture:${Date.now()}`,
          messages: [{
            role: 'user',
            content: 'Analizá esta captura de campo para el proyecto activo. Describí únicamente lo visible y útil para rotulación/instalación. No inventes medidas; si una medida no fue dada, indicá que falta.',
          }],
          archivos_temporales: [{
            nombre: `captura-${Date.now()}.jpg`,
            tipo: 'image/jpeg',
            dataUrl,
            temporal: true,
            guardar_permanente: false,
            metadata: { source },
          }],
          runtime_context: { surface: 'elan-field-camera', captureSource: source },
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message || data?.error || `CONNECT respondió ${response.status}`);
      const text = String(data?.texto || data?.respuesta || data?.message || data?.content || '').trim();
      if (!text) throw new Error('ELAN no devolvió análisis de la captura.');
      setCaptureAnalysis(text);
      injectRealtimeText(dataChannelRef.current, 'user', `Captura de campo analizada por CONNECT. Resultado verificado: ${text}`);
      return text;
    } catch (captureError) {
      setError(captureError.message || 'No pude analizar la captura.');
      return '';
    } finally {
      setCaptureBusy(false);
    }
  }

  async function captureFieldFrame(source = 'button') {
    if (!capabilities?.canUseCamera) {
      setError('Tu usuario no tiene permiso para usar cámara.');
      return;
    }
    try {
      let dataUrl = '';
      if (recordingActive && recordingId) {
        const blob = await recorder.captureScreenshot(recordingId);
        if (blob) dataUrl = await blobToDataUrl(blob);
      } else if (cameraOn && cameraRef.current) {
        dataUrl = String(cameraRef.current.takePhoto('base64url') || '');
      }
      if (!dataUrl) {
        setError('Encendé la cámara o iniciá una grabación antes de capturar.');
        return;
      }
      setLastCapture(dataUrl);
      setError('');
      await analyzeCapture(dataUrl, source);
    } catch (captureError) {
      setError(captureError.message || 'No pude capturar este momento.');
    }
  }

  async function startVisitRecording() {
    if (!capabilities?.canUseCamera) {
      setError('Tu usuario no tiene permiso para grabar cámara.');
      return;
    }
    try {
      setCameraOn(false);
      setTorchOn(false);
      setRecordingNote('');
      const recording = await recorder.createRecording();
      if (!recording) throw new Error('No pude crear la sesión de grabación.');
      setRecordingId(recording.id);
      await recorder.openCamera(recording.id);
      await recorder.startRecording(recording.id);
      setPhase(realtimeActiveRef.current ? 'listening' : 'seeing');
      setError('');
    } catch (recordError) {
      setError(recordError.message || recorder.errorMessage || 'No pude iniciar la grabación.');
    }
  }

  async function toggleRecordingPause() {
    if (!recordingId) return;
    try {
      if (recordingPaused) await recorder.resumeRecording(recordingId);
      else if (recordingRunning) await recorder.pauseRecording(recordingId);
    } catch (recordError) {
      setError(recordError.message || 'No pude pausar/reanudar la grabación.');
    }
  }

  async function stopVisitRecording() {
    if (!recordingId) return;
    try {
      await recorder.stopRecording(recordingId);
      setRecordingNote('Grabación terminada. Podés revisar el video y seguir capturando fotos del proyecto.');
      await persistRealtimeMemory('inbound', 'Grabación de visita técnica terminada en ELAN Copiloto.', `field-recording:${recordingId}`, 'video');
      setPhase(realtimeActiveRef.current ? 'listening' : 'idle');
    } catch (recordError) {
      setError(recordError.message || 'No pude detener la grabación.');
    }
  }

  function syncTextTurnWithRealtime(responseText, _data, userText) {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    injectRealtimeText(channel, 'user', userText);
    injectRealtimeText(channel, 'assistant', responseText);
  }

  const locked = phase === 'locked';
  const active = realtimeActive;
  const memoryHistory = Array.isArray(runtimeInfo?.memory?.history) ? runtimeInfo.memory.history : [];
  const actorLabel = session?.displayName || session?.name || session?.role || 'Usuario';
  const platformLabel = String(publishedRuntime?.platform?.platformId || session?.platform || 'ELANVISUAL').toUpperCase();

  return (
    <main className={`elan-field elan-field--${phase}`}>
      <audio ref={audioRef} playsInline />

      <header className="elan-field__topbar">
        <div className="elan-field__brand">
          <button type="button" className="elan-field__icon-button elan-field__back" onClick={() => window.history.back()} aria-label="Volver">
            <ChevronLeft size={20} />
          </button>
          <div className="elan-field__mark">E</div>
          <div>
            <div className="elan-field__title">ELAN</div>
            <div className="elan-field__subtitle">{platformLabel} · {actorLabel}</div>
          </div>
        </div>
        <div className={`elan-field__status elan-field__status--${phase}`}>
          <span className="elan-field__status-dot" />
          {phaseLabel(phase, active)}
        </div>
      </header>

      <section className={`elan-field__workspace ${chatOpen ? 'elan-field__workspace--chat' : ''}`}>
        <div className="elan-field__stage">
          {cameraOn && !recordingActive && (
            <FieldCamera
              ref={cameraRef}
              className="elan-field__camera"
              facingMode="environment"
              aspectRatio="cover"
              numberOfCamerasCallback={setCameraCount}
              videoConstraints={{
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
              }}
            />
          )}

          {recordingActive && activeRecording && (
            <video
              ref={activeRecording.webcamRef}
              className="elan-field__camera"
              autoPlay
              muted
              playsInline
            />
          )}

          {!cameraOn && !recordingActive && (
            <div className="elan-field__idle">
              <div className={`elan-field__signal elan-field__signal--${phase}`}>
                <span /><span /><span /><span /><span />
              </div>
              <h1>ELAN COPILOTO</h1>
              <p>Voz, cámara, memoria y operación en un solo contexto.</p>
            </div>
          )}

          <div className="elan-field__hud">
            {recordingRunning && <div className="elan-field__rec"><span /> REC</div>}
            {recordingPaused && <div className="elan-field__rec elan-field__rec--paused">PAUSA</div>}
            {cameraOn && <div className="elan-field__vision">VISIÓN DE CAMPO</div>}
          </div>

          {lastCapture && (
            <div className="elan-field__capture-card">
              <img src={lastCapture} alt="Última captura de campo" />
              <div>
                <strong>{captureBusy ? 'Analizando captura…' : 'Última captura'}</strong>
                {captureAnalysis && <p>{captureAnalysis}</p>}
              </div>
              <button type="button" onClick={() => { setLastCapture(''); setCaptureAnalysis(''); }} aria-label="Cerrar captura">
                <X size={16} />
              </button>
            </div>
          )}

          {activeRecording?.status === 'STOPPED' && activeRecording?.previewRef && (
            <div className="elan-field__recording-preview">
              <video ref={activeRecording.previewRef} controls playsInline />
              <button type="button" onClick={() => { void recorder.clearPreview(recordingId); setRecordingId(''); setRecordingNote(''); }}>
                Cerrar video
              </button>
            </div>
          )}

          {recordingNote && <div className="elan-field__note">{recordingNote}</div>}
          {error && <div className="elan-field__error">{error}</div>}

          {!locked && (
            <div className="elan-field__controls">
              <button
                type="button"
                className={`elan-field__control ${active ? 'elan-field__control--active' : ''}`}
                onClick={toggleConversation}
                title={active ? 'Detener conversación' : 'Hablar con ELAN'}
              >
                {active ? <MicOff size={21} /> : <Mic size={21} />}
                <span>{active ? 'Voz ON' : 'Hablar'}</span>
              </button>

              <button
                type="button"
                className={`elan-field__control ${cameraOn ? 'elan-field__control--active' : ''}`}
                onClick={toggleCamera}
                disabled={!capabilities?.canUseCamera || recordingActive}
                title="Cámara"
              >
                <Camera size={21} />
                <span>Cámara</span>
              </button>

              <button
                type="button"
                className="elan-field__control elan-field__control--primary"
                onClick={() => void captureFieldFrame('button')}
                disabled={!capabilities?.canUseCamera || captureBusy || (!cameraOn && !recordingActive)}
                title="Capturar este momento"
              >
                <span className="elan-field__shutter" />
                <span>Capturar</span>
              </button>

              {!recordingActive ? (
                <button
                  type="button"
                  className="elan-field__control"
                  onClick={() => void startVisitRecording()}
                  disabled={!capabilities?.canUseCamera}
                  title="Grabar visita"
                >
                  <Video size={21} />
                  <span>Grabar</span>
                </button>
              ) : (
                <>
                  <button type="button" className="elan-field__control" onClick={() => void toggleRecordingPause()}>
                    {recordingPaused ? <Play size={20} /> : <Pause size={20} />}
                    <span>{recordingPaused ? 'Seguir' : 'Pausa'}</span>
                  </button>
                  <button type="button" className="elan-field__control elan-field__control--danger" onClick={() => void stopVisitRecording()}>
                    <Square size={18} />
                    <span>Detener</span>
                  </button>
                </>
              )}

              {cameraOn && cameraCount > 1 && (
                <button type="button" className="elan-field__control elan-field__control--icon" onClick={switchCamera} title="Cambiar cámara">
                  <RotateCcw size={20} />
                </button>
              )}

              {cameraOn && cameraRef.current?.torchSupported && (
                <button type="button" className={`elan-field__control elan-field__control--icon ${torchOn ? 'elan-field__control--active' : ''}`} onClick={toggleTorch} title="Linterna">
                  <Flashlight size={20} />
                </button>
              )}

              <button
                type="button"
                className={`elan-field__control elan-field__control--icon ${chatOpen ? 'elan-field__control--active' : ''}`}
                onClick={() => setChatOpen((value) => !value)}
                title="Texto e historial"
              >
                <MessageSquare size={20} />
              </button>
            </div>
          )}
        </div>

        {chatOpen && sessionToken && !locked && (
          <aside className="elan-field__chat-panel">
            <div className="elan-field__chat-head">
              <div>
                <strong>Conversación unificada</strong>
                <span>{memoryHistory.length} mensajes recuperados · mismos permisos y memoria</span>
              </div>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Cerrar chat"><X size={18} /></button>
            </div>
            <ELANFieldThread
              sessionToken={sessionToken}
              memoryHistory={memoryHistory}
              onResponse={syncTextTurnWithRealtime}
            />
          </aside>
        )}
      </section>
    </main>
  );
}
