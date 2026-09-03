import React, { useEffect, useRef, useState } from 'react';
import { Camera as FieldCamera } from 'react-webcam-pro';
import {
  BarChart3,
  Bell,
  Boxes,
  Camera,
  ChevronDown,
  ChevronLeft,
  Eye,
  Factory,
  FileText,
  Flashlight,
  FolderKanban,
  Home,
  Mail,
  Menu,
  MessageSquare,
  Mic,
  MicOff,
  PackageOpen,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Settings,
  Square,
  Truck,
  Users,
  Video,
  X,
} from 'lucide-react';
import ELANFieldThread from './ELANFieldThread';
import './ELANLive.css';

const ELAN_API = '/api/elan-ai';
const REALTIME_TOKEN_API = '/api/elan-realtime-token';
const OPENAI_REALTIME_CALLS = 'https://api.openai.com/v1/realtime/calls';
const LIVE_TOKEN_KEY = 'elan-live-token';
const OWNER_PLATFORMS = ['ELANVISUAL'];
function normalizePlatformId(value) { return String(value || 'ELANVISUAL').trim().toUpperCase().replace(/[ -]+/g, '_'); }
function platformTitle(value) { const id = normalizePlatformId(value); return id === 'ELAN_GO' ? 'ELAN GO' : id; }
function payloadRows(payload) {
  const data = payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.results)) return data.results;
  return [];
}
function quotationProjectId(row = {}) { return String(row.projectId || row.project_id || row.id || '').trim(); }
function quotationNumber(row = {}) { return String(row.quotationNumber || row.quotation_number || row.projectNumber || row.project_number || 'Cotización').trim(); }
function quotationCustomer(row = {}) {
  const doc = row.quotation_document && typeof row.quotation_document === 'object' ? row.quotation_document : {};
  const pub = doc.publicDocument && typeof doc.publicDocument === 'object' ? doc.publicDocument : {};
  const customer = pub.customer && typeof pub.customer === 'object' ? pub.customer : {};
  return String(row.customerName || row.customer_name || customer.name || customer.companyName || 'Cliente').trim();
}
function quotationTotal(row = {}) {
  const direct = Number(row.totalUsd ?? row.total_usd);
  if (Number.isFinite(direct)) return direct;
  const doc = row.quotation_document && typeof row.quotation_document === 'object' ? row.quotation_document : {};
  const pub = doc.publicDocument && typeof doc.publicDocument === 'object' ? doc.publicDocument : {};
  const totals = pub.totals && typeof pub.totals === 'object' ? pub.totals : {};
  const value = Number(totals.totalUsd ?? totals.total_usd ?? totals.total);
  return Number.isFinite(value) ? value : 0;
}
function quotationItems(row = {}) {
  const doc = row.quotation_document && typeof row.quotation_document === 'object' ? row.quotation_document : {};
  const pub = doc.publicDocument && typeof doc.publicDocument === 'object' ? doc.publicDocument : {};
  return Array.isArray(pub.items) ? pub.items : Array.isArray(doc.items) ? doc.items : [];
}


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
  const [chatOpen, setChatOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState('ELANVISUAL');
  const [activeView, setActiveView] = useState('inicio');
  const [moduleData, setModuleData] = useState({});
  const [moduleBusy, setModuleBusy] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [lastCapture, setLastCapture] = useState('');
  const [captureAnalysis, setCaptureAnalysis] = useState('');
  const [captureBusy, setCaptureBusy] = useState(false);
  const [recordingState, setRecordingState] = useState('idle');
  const [recordingNote, setRecordingNote] = useState('');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');

  const audioRef = useRef(null);
  const peerRef = useRef(null);
  const dataChannelRef = useRef(null);
  const micStreamRef = useRef(null);
  const cameraRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const mountedRef = useRef(true);
  const realtimeActiveRef = useRef(false);
  const pendingVoiceContextRef = useRef('');

  const recordingActive = recordingState === 'opening' || recordingState === 'recording' || recordingState === 'paused';
  const recordingRunning = recordingState === 'recording';
  const recordingPaused = recordingState === 'paused';

  useEffect(() => {
    realtimeActiveRef.current = realtimeActive;
  }, [realtimeActive]);

  useEffect(() => {
    if (!sessionToken || phase === 'locked') return;
    void loadModule(activeView, activePlatform);
  }, [sessionToken, activePlatform, activeView]);

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
        setActivePlatform(normalizePlatformId(data.platform || data.session?.activePlatform || data.session?.platform || 'ELANVISUAL'));
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
      try { videoRecorderRef.current?.stop?.(); } catch {}
      videoStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      videoStreamRef.current = null;
      if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
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
        platform: activePlatform,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error?.message || data?.error || 'CONNECT no confirmó la memoria unificada.');
    }
  }

  async function callLiveTool(tool, args = {}, platform = activePlatform) {
    if (!sessionToken) throw new Error('La sesión segura no está activa.');
    const response = await fetch(ELAN_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'live-tool',
        live_session_token: sessionToken,
        platform,
        tool,
        arguments: args,
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error?.message || data?.error || 'CONNECT no pudo ejecutar la herramienta solicitada.');
    }
    return data.result ?? data;
  }

  function applyToolResult(tool, output) {
    if (tool === 'buscar_cotizacion') setModuleData((current) => ({ ...current, quotations: payloadRows(output) }));
    if (tool === 'buscar_cliente') setModuleData((current) => ({ ...current, customers: payloadRows(output) }));
    if (tool === 'resumen_comercial') setModuleData((current) => ({ ...current, report: output?.data || output }));
    if (tool === 'buscar_orden_trabajo') setModuleData((current) => ({ ...current, workOrders: payloadRows(output) }));
    if (tool === 'buscar_vendedor') setModuleData((current) => ({ ...current, sellers: payloadRows(output) }));
    if (tool === 'buscar_familiar') setModuleData((current) => ({ ...current, family: payloadRows(output) }));
    if (tool === 'buscar_contacto') setModuleData((current) => ({ ...current, contacts: payloadRows(output) }));
    if (tool === 'marketplace_listar_necesidades') setModuleData((current) => ({ ...current, demands: payloadRows(output) }));
    if (tool === 'marketplace_listar_descubrimientos') setModuleData((current) => ({ ...current, discoveries: payloadRows(output) }));
    if (tool === 'abrir_cotizacion') {
      const candidate = output?.data || output;
      if (candidate && typeof candidate === 'object') setSelectedQuote(candidate);
    }
    if (tool === 'enviar_cotizacion_cliente') setActionNotice('Cotización enviada por WhatsApp y confirmada por CONNECT.');
    if (tool === 'enviar_cotizacion_email') setActionNotice('Cotización enviada por correo y confirmada por CONNECT.');
  }

  async function executeRealtimeTool(event) {
    const tool = String(event?.name || '').trim();
    let args = {};
    try { args = JSON.parse(String(event?.arguments || '{}')); }
    catch { args = {}; }
    const output = await callLiveTool(tool, args);
    applyToolResult(tool, output);
    return output;
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
        body: JSON.stringify({ live_session_token: sessionToken, platform: activePlatform }),
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
          const pendingContext = String(pendingVoiceContextRef.current || '').trim();
          if (pendingContext) {
            injectRealtimeText(dataChannel, 'user', pendingContext);
            pendingVoiceContextRef.current = '';
          }
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
          unidad: activePlatform,
          platform: activePlatform,
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
      if (recordingActive && videoPreviewRef.current) {
        const video = videoPreviewRef.current;
        const width = Number(video.videoWidth || 0);
        const height = Number(video.videoHeight || 0);
        if (width > 0 && height > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          context?.drawImage(video, 0, 0, width, height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.86);
        }
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
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador no soporta grabación de video.');
      return;
    }

    try {
      setCameraOn(false);
      setTorchOn(false);
      setRecordingNote('');
      setRecordingState('opening');
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl('');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      videoStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play?.().catch(() => {});
      }

      const mimeType = [
        'video/webm;codecs=vp8',
        'video/webm',
      ].find((value) => MediaRecorder.isTypeSupported(value)) || '';
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      videoChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size) videoChunksRef.current.push(event.data);
      };
      mediaRecorder.onerror = (event) => {
        const message = event?.error?.message || 'La grabación de video tuvo un error.';
        setError(message);
      };
      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || 'video/webm';
        const blob = new Blob(videoChunksRef.current, { type });
        videoChunksRef.current = [];
        videoStreamRef.current?.getTracks?.().forEach((track) => track.stop());
        videoStreamRef.current = null;
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);
          setRecordingNote('Grabación terminada y disponible para revisar o guardar.');
          setRecordingState('stopped');
        } else {
          setRecordingState('idle');
          setError('La grabación terminó sin generar un archivo de video.');
        }
      };

      videoRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setRecordingState('recording');
      setPhase(realtimeActiveRef.current ? 'listening' : 'seeing');
      setError('');
    } catch (recordError) {
      videoStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      videoStreamRef.current = null;
      setRecordingState('idle');
      setError(recordError.name === 'NotAllowedError'
        ? 'Necesito permiso de cámara para grabar.'
        : (recordError.message || 'No pude iniciar la grabación.'));
    }
  }

  async function toggleRecordingPause() {
    const mediaRecorder = videoRecorderRef.current;
    if (!mediaRecorder) return;
    try {
      if (recordingPaused && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        setRecordingState('recording');
      } else if (recordingRunning && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        setRecordingState('paused');
      }
    } catch (recordError) {
      setError(recordError.message || 'No pude pausar/reanudar la grabación.');
    }
  }

  async function stopVisitRecording() {
    const mediaRecorder = videoRecorderRef.current;
    if (!mediaRecorder) return;
    try {
      if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      videoRecorderRef.current = null;
      await persistRealtimeMemory(
        'inbound',
        'Grabación de visita técnica terminada en ELAN Copiloto.',
        `field-recording:${Date.now()}`,
        'video',
      );
      setPhase(realtimeActiveRef.current ? 'listening' : 'idle');
    } catch (recordError) {
      setError(recordError.message || 'No pude detener la grabación.');
    }
  }

  function saveRecordedVideo() {
    if (!recordedVideoUrl) return;
    const link = document.createElement('a');
    link.href = recordedVideoUrl;
    link.download = `ELAN-visita-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function closeRecordedVideo() {
    if (recordedVideoUrl) URL.revokeObjectURL(recordedVideoUrl);
    setRecordedVideoUrl('');
    setRecordingState('idle');
    setRecordingNote('');
  }

  function hasRuntimeTool(name) {
    return Array.isArray(runtimeInfo?.tools) && runtimeInfo.tools.includes(name);
  }

  async function switchPlatform(nextPlatform) {
    const next = normalizePlatformId(nextPlatform);
    if (!sessionToken || next === activePlatform) return;
    setModuleBusy(true);
    setError('');
    setActionNotice('');
    try {
      stopRealtime(true);
      const response = await fetch(ELAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'live-session-verify', token: sessionToken, platform: next }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.session) throw new Error(data?.error?.message || data?.error || 'La plataforma no está disponible para este usuario.');
      setSession(data.session);
      setCapabilities(data.capabilities || {});
      setRuntimeInfo(data.runtime || null);
      setPublishedRuntime(data.publishedRuntime || null);
      setActivePlatform(normalizePlatformId(data.platform || next));
      setActiveView('inicio');
      setModuleData({});
      setSelectedQuote(null);
      setMobileNavOpen(false);
    } catch (platformError) {
      setError(platformError.message || 'No pude cambiar de plataforma.');
    } finally {
      setModuleBusy(false);
    }
  }

  async function loadModule(view = activeView, platform = activePlatform) {
    if (!sessionToken || phase === 'locked') return;
    const currentPlatform = normalizePlatformId(platform);
    setModuleBusy(true);
    setError('');
    try {
      if (currentPlatform === 'ELANVISUAL') {
        if (view === 'inicio') {
          const [quotations, report] = await Promise.all([
            callLiveTool('buscar_cotizacion', {}, currentPlatform),
            callLiveTool('resumen_comercial', {}, currentPlatform),
          ]);
          setModuleData((current) => ({ ...current, quotations: payloadRows(quotations), report: report?.data || report }));
        } else if (view === 'proyectos' || view === 'cotizaciones' || view === 'produccion') {
          const quotations = await callLiveTool('buscar_cotizacion', {}, currentPlatform);
          setModuleData((current) => ({ ...current, quotations: payloadRows(quotations), workOrders: [] }));
        } else if (view === 'clientes') {
          const customers = await callLiveTool('buscar_cliente', {}, currentPlatform);
          setModuleData((current) => ({ ...current, customers: payloadRows(customers) }));
        } else if (view === 'reportes') {
          const report = await callLiveTool('resumen_comercial', {}, currentPlatform);
          setModuleData((current) => ({ ...current, report: report?.data || report }));
        } else if (view === 'proveedores' && hasRuntimeTool('buscar_proveedor')) {
          const providers = await callLiveTool('buscar_proveedor', {}, currentPlatform);
          setModuleData((current) => ({ ...current, providers: payloadRows(providers) }));
        } else if (view === 'inventario' && hasRuntimeTool('listar_precios_autorizados')) {
          const prices = await callLiveTool('listar_precios_autorizados', {}, currentPlatform);
          setModuleData((current) => ({ ...current, prices: payloadRows(prices) }));
        }
      } else if (currentPlatform === 'CONNECT') {
        if (view === 'vendedores' || view === 'inicio') {
          const sellers = await callLiveTool('buscar_vendedor', {}, currentPlatform);
          setModuleData((current) => ({ ...current, sellers: payloadRows(sellers) }));
        } else if (view === 'familia') {
          const family = await callLiveTool('buscar_familiar', {}, currentPlatform);
          setModuleData((current) => ({ ...current, family: payloadRows(family) }));
        } else if (view === 'contactos') {
          const contacts = await callLiveTool('buscar_contacto', {}, currentPlatform);
          setModuleData((current) => ({ ...current, contacts: payloadRows(contacts) }));
        }
      } else if (currentPlatform === 'ELAN_GO') {
        if (view === 'descubrimientos') {
          const discoveries = await callLiveTool('marketplace_listar_descubrimientos', {}, currentPlatform);
          setModuleData((current) => ({ ...current, discoveries: payloadRows(discoveries) }));
        } else {
          const demands = await callLiveTool('marketplace_listar_necesidades', {}, currentPlatform);
          setModuleData((current) => ({ ...current, demands: payloadRows(demands) }));
        }
      }
    } catch (loadError) {
      setError(loadError.message || 'No pude cargar la información de CONNECT.');
    } finally {
      setModuleBusy(false);
    }
  }

  async function changeView(view) {
    setActiveView(view);
    setMobileNavOpen(false);
    setActionNotice('');
  }

  function beginVoiceTask(context, notice) {
    pendingVoiceContextRef.current = String(context || '').trim();
    setActionNotice(notice || 'Hablá con ELAN para continuar.');
    const channel = dataChannelRef.current;
    if (realtimeActiveRef.current && channel?.readyState === 'open') {
      injectRealtimeText(channel, 'user', pendingVoiceContextRef.current);
      pendingVoiceContextRef.current = '';
      return;
    }
    void startRealtime();
  }

  function newQuotationByVoice() {
    beginVoiceTask(
      `Contexto de interfaz: el usuario quiere crear una nueva cotización en ${activePlatform}. Esperá su siguiente instrucción de voz y usá solamente datos, clientes y precios autorizados por CONNECT.`,
      'Voz activada: decime el cliente y qué necesitás cotizar.'
    );
  }

  function newCustomerByVoice() {
    beginVoiceTask(
      `Contexto de interfaz: el usuario quiere registrar un nuevo cliente en ${activePlatform}. Esperá su siguiente instrucción de voz y solicitá únicamente los datos indispensables que falten.`,
      'Voz activada: decime los datos del nuevo cliente.'
    );
  }

  function editQuotationByVoice(row) {
    const projectId = quotationProjectId(row);
    if (!projectId) return;
    setSelectedQuote(row);
    beginVoiceTask(
      `Contexto de interfaz: está seleccionada la cotización ${quotationNumber(row)} con projectId ${projectId}. La siguiente instrucción de voz se refiere a esa cotización. Antes de editar, recuperala con abrir_cotizacion y conservá los datos que el usuario no pida cambiar.`,
      `Voz activada para ${quotationNumber(row)}: decime qué querés modificar.`
    );
  }

  async function openQuotation(row) {
    const projectId = quotationProjectId(row);
    if (!projectId) return;
    setModuleBusy(true);
    try {
      const quote = await callLiveTool('abrir_cotizacion', { projectId });
      const candidate = quote?.data || quote;
      setSelectedQuote(candidate && typeof candidate === 'object' ? candidate : row);
      setActionNotice('');
    } catch (openError) {
      setError(openError.message || 'No pude abrir la cotización.');
    } finally {
      setModuleBusy(false);
    }
  }

  async function sendQuotation(row, channel) {
    const projectId = quotationProjectId(row);
    if (!projectId) return;
    setModuleBusy(true);
    setError('');
    setActionNotice('');
    try {
      const tool = channel === 'email' ? 'enviar_cotizacion_email' : 'enviar_cotizacion_cliente';
      const result = await callLiveTool(tool, { projectId });
      applyToolResult(tool, result);
    } catch (sendError) {
      setError(sendError.message || `No pude enviar la cotización por ${channel === 'email' ? 'correo' : 'WhatsApp'}.`);
    } finally {
      setModuleBusy(false);
    }
  }

  async function loadWorkOrders(row) {
    const projectId = quotationProjectId(row);
    if (!projectId) return;
    setModuleBusy(true);
    try {
      const result = await callLiveTool('buscar_orden_trabajo', { projectId });
      setModuleData((current) => ({ ...current, workOrders: payloadRows(result), workOrderProjectId: projectId }));
    } catch (workError) {
      setError(workError.message || 'No pude consultar producción.');
    } finally {
      setModuleBusy(false);
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
  const isOwner = String(session?.role || '').toLowerCase() === 'owner' || String(session?.authority || '').toLowerCase() === 'owner_identity';
  const platformLabel = platformTitle(activePlatform);
  const memoryCount = memoryHistory.length;
  const channelLabel = session?.phone ? 'WHATSAPP VINCULADO' : 'SESIÓN SEGURA';
  const availablePlatforms = isOwner
    ? OWNER_PLATFORMS
    : Array.from(new Set((Array.isArray(session?.platforms) ? session.platforms : [session?.platform || 'ELANVISUAL']).map(normalizePlatformId)));
  const runtimeTools = new Set(Array.isArray(runtimeInfo?.tools) ? runtimeInfo.tools : []);
  const navItems = activePlatform === 'CONNECT'
    ? [
        { id: 'inicio', label: 'Inicio', icon: Home },
        { id: 'vendedores', label: 'Vendedores', icon: Users },
        { id: 'familia', label: 'Miembros', icon: Users },
        { id: 'contactos', label: 'Contactos', icon: MessageSquare },
        { id: 'ajustes', label: 'Ajustes', icon: Settings },
      ]
    : activePlatform === 'ELAN_GO'
      ? [
          { id: 'inicio', label: 'Inicio', icon: Home },
          { id: 'necesidades', label: 'Necesidades', icon: FolderKanban },
          { id: 'descubrimientos', label: 'Descubrimientos', icon: PackageOpen },
          { id: 'ajustes', label: 'Ajustes', icon: Settings },
        ]
      : [
          { id: 'inicio', label: 'Inicio', icon: Home },
          { id: 'proyectos', label: 'Proyectos', icon: FolderKanban },
          { id: 'cotizaciones', label: 'Cotizaciones', icon: FileText },
          { id: 'clientes', label: 'Clientes', icon: Users },
          ...(runtimeTools.has('buscar_orden_trabajo') ? [{ id: 'produccion', label: 'Producción', icon: Factory }] : []),
          ...(runtimeTools.has('listar_precios_autorizados') ? [{ id: 'inventario', label: 'Inventario', icon: Boxes }] : []),
          ...(runtimeTools.has('buscar_proveedor') ? [{ id: 'proveedores', label: 'Proveedores', icon: Truck }] : []),
          ...(runtimeTools.has('resumen_comercial') ? [{ id: 'reportes', label: 'Reportes', icon: BarChart3 }] : []),
          { id: 'ajustes', label: 'Ajustes', icon: Settings },
        ];
  const quotations = Array.isArray(moduleData.quotations) ? moduleData.quotations : [];
  const customers = Array.isArray(moduleData.customers) ? moduleData.customers : [];
  const workOrders = Array.isArray(moduleData.workOrders) ? moduleData.workOrders : [];
  const providers = Array.isArray(moduleData.providers) ? moduleData.providers : [];
  const prices = Array.isArray(moduleData.prices) ? moduleData.prices : [];
  const sellers = Array.isArray(moduleData.sellers) ? moduleData.sellers : [];
  const family = Array.isArray(moduleData.family) ? moduleData.family : [];
  const contacts = Array.isArray(moduleData.contacts) ? moduleData.contacts : [];
  const demands = Array.isArray(moduleData.demands) ? moduleData.demands : [];
  const discoveries = Array.isArray(moduleData.discoveries) ? moduleData.discoveries : [];
  const report = moduleData.report && typeof moduleData.report === 'object' ? moduleData.report : {};


  return (
    <main className={`elan-copilot elan-copilot--${phase} ${cameraOn || recordingActive ? 'elan-copilot--camera' : ''}`}>
      <audio ref={audioRef} playsInline />

      <header className="elan-copilot__topbar">
        <div className="elan-copilot__brand">
          <button type="button" className="elan-copilot__menu-button" onClick={() => setMobileNavOpen((value) => !value)} aria-label="Menú">
            <Menu size={20} />
          </button>
          <div className="elan-copilot__brand-bot" aria-hidden="true"><span /></div>
          <div className="elan-copilot__brand-name">ELAN <strong>AI</strong></div>
          {!locked && (
            <label className="elan-copilot__platform-select">
              <span>{platformLabel}</span>
              <ChevronDown size={14} />
              <select value={activePlatform} onChange={(event) => void switchPlatform(event.target.value)} disabled={moduleBusy}>
                {availablePlatforms.map((platform) => <option key={platform} value={platform}>{platformTitle(platform)}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="elan-copilot__top-actions">
          {!locked && (
            <>
              <button type="button" className={`elan-copilot__top-icon ${active ? 'is-active' : ''}`} onClick={toggleConversation} title="Voz">
                {active ? <MicOff size={19} /> : <Mic size={19} />}
              </button>
              <button type="button" className={`elan-copilot__top-icon ${cameraOn ? 'is-active' : ''}`} onClick={toggleCamera} disabled={!capabilities?.canUseCamera || recordingActive} title="Cámara">
                <Camera size={19} />
              </button>
              <button type="button" className={`elan-copilot__top-icon ${chatOpen ? 'is-active' : ''}`} onClick={() => setChatOpen((value) => !value)} title="Chat">
                <MessageSquare size={19} />
              </button>
              <button type="button" className="elan-copilot__top-icon" title="Notificaciones">
                <Bell size={18} />
              </button>
            </>
          )}
          <div className="elan-copilot__user">
            <div className="elan-copilot__avatar">{String(actorLabel || 'E').slice(0, 2).toUpperCase()}</div>
            <div><strong>{actorLabel}</strong><span>{isOwner ? 'Jefe / Owner' : session?.role || 'Miembro'}</span></div>
          </div>
        </div>
      </header>

      {locked ? (
        <section className="elan-copilot__locked">
          <div className="elan-copilot__locked-card">
            <div className="elan-copilot__brand-bot elan-copilot__brand-bot--large"><span /></div>
            <h1>ELAN AI</h1>
            <p>Acceso privado para miembros.</p>
            <strong>Abrí el enlace de un solo uso enviado por WhatsApp.</strong>
            {error && <div className="elan-copilot__locked-error">{error}</div>}
          </div>
        </section>
      ) : (
        <section className="elan-copilot__shell">
          <aside className={`elan-copilot__sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
            <nav>
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" className={activeView === id ? 'active' : ''} onClick={() => void changeView(id)}>
                  <Icon size={21} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <div className="elan-copilot__assistant-card">
              <div className="elan-copilot__brand-bot"><span /></div>
              <div><strong>ELAN AI</strong><small>{phaseLabel(phase, active)}</small></div>
            </div>
          </aside>

          <section className="elan-copilot__workspace">
            {(cameraOn || recordingActive) ? (
              <div className="elan-copilot__camera-stage">
                {cameraOn && !recordingActive && (
                  <FieldCamera
                    ref={cameraRef}
                    className="elan-field__camera"
                    facingMode="environment"
                    aspectRatio="cover"
                    numberOfCamerasCallback={setCameraCount}
                    videoConstraints={{ width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } }}
                  />
                )}
                {recordingActive && <video ref={videoPreviewRef} className="elan-field__camera" autoPlay muted playsInline />}
                <div className="elan-copilot__camera-head">
                  <button type="button" onClick={toggleCamera}><ChevronLeft size={18} /> Volver</button>
                  <span>{recordingRunning ? '● REC' : recordingPaused ? 'PAUSA' : 'VISIÓN DE CAMPO'}</span>
                </div>
                <div className="elan-copilot__camera-actions">
                  <button type="button" onClick={() => void captureFieldFrame('button')} disabled={captureBusy}><span className="elan-field__shutter" /><small>Capturar</small></button>
                  {!recordingActive ? (
                    <button type="button" onClick={() => void startVisitRecording()}><Video size={22} /><small>Grabar</small></button>
                  ) : (
                    <>
                      <button type="button" onClick={() => void toggleRecordingPause()}>{recordingPaused ? <Play size={22} /> : <Pause size={22} />}<small>{recordingPaused ? 'Seguir' : 'Pausa'}</small></button>
                      <button type="button" onClick={() => void stopVisitRecording()}><Square size={20} /><small>Detener</small></button>
                    </>
                  )}
                  {cameraOn && cameraCount > 1 && <button type="button" onClick={switchCamera}><RotateCcw size={22} /><small>Cambiar</small></button>}
                  {cameraOn && cameraRef.current?.torchSupported && <button type="button" onClick={toggleTorch}><Flashlight size={22} /><small>Linterna</small></button>}
                  <button type="button" onClick={() => setChatOpen(true)}><MessageSquare size={22} /><small>Notas</small></button>
                </div>
              </div>
            ) : (
              <div className="elan-copilot__dashboard">
                <section className="elan-copilot__assistant-zone">
                  <div className="elan-copilot__assistant-glow" />
                  <div className="elan-copilot__assistant-identity">
                    <div className="elan-copilot__assistant-emblem">
                      <div className="elan-copilot__brand-bot elan-copilot__brand-bot--hero"><span /></div>
                    </div>
                    <strong>ELAN AI</strong>
                    <span>{platformLabel}</span>
                  </div>
                  <button type="button" className={`elan-copilot__voice-core ${active ? 'is-active' : ''}`} onClick={toggleConversation} aria-label="Hablar con ELAN">
                    <div className="elan-copilot__wave">{Array.from({ length: 7 }).map((_, index) => <i key={index} />)}</div>
                  </button>
                  <div className="elan-copilot__assistant-state"><i /> {phaseLabel(phase, active)}</div>
                  <p>{actionNotice || 'Hablá con ELAN para trabajar sin escribir.'}</p>
                  <div className="elan-copilot__assistant-meta"><span>{channelLabel}</span><span>{memoryCount} eventos</span></div>
                </section>

                <main className="elan-copilot__content">
                  <div className="elan-copilot__content-head">
                    <div>
                      <small>{platformLabel}</small>
                      <h1>{activeView === 'inicio' ? `¡Hola ${actorLabel}!` : navItems.find((item) => item.id === activeView)?.label || 'ELAN AI'}</h1>
                      <p>{activePlatform === 'ELANVISUAL' ? 'Proyectos, cotizaciones, clientes, producción y reportes con tus permisos reales.' : activePlatform === 'CONNECT' ? 'Administración interna autorizada de miembros y contactos.' : 'Operación comercial de ELAN GO desde el mismo Copiloto.'}</p>
                    </div>
                    <button type="button" className="elan-copilot__refresh" onClick={() => void loadModule(activeView, activePlatform)} disabled={moduleBusy}>
                      <RefreshCw size={17} className={moduleBusy ? 'spin' : ''} /> Actualizar
                    </button>
                  </div>

                  {activePlatform === 'ELANVISUAL' && activeView === 'inicio' && (
                    <>
                      <section className="elan-copilot__hero-card">
                        <div>
                          <h2>Soy <span>ELAN AI</span>, tu asistente virtual.</h2>
                          <p>Podés hablarme para crear o editar cotizaciones, registrar clientes, consultar información y ejecutar las funciones autorizadas.</p>
                        </div>
                        <button type="button" className="elan-copilot__hero-voice" onClick={toggleConversation}><Mic size={27} /></button>
                      </section>

                      <section>
                        <h3 className="elan-copilot__section-title">Acciones rápidas</h3>
                        <div className="elan-copilot__quick-grid">
                          <button type="button" onClick={() => beginVoiceTask('Contexto de interfaz: el usuario quiere iniciar un proyecto nuevo en ELANVISUAL. Esperá su instrucción de voz y usá las herramientas autorizadas.', 'Voz activada: contame el proyecto nuevo.')}><FolderKanban /><span>Nuevo<br />Proyecto</span></button>
                          <button type="button" onClick={newQuotationByVoice}><FileText /><span>Nueva<br />Cotización</span></button>
                          <button type="button" onClick={newCustomerByVoice}><Plus /><span>Nuevo<br />Cliente</span></button>
                          <button type="button" onClick={() => void changeView('reportes')}><BarChart3 /><span>Ver<br />Reportes</span></button>
                        </div>
                      </section>

                      <section>
                        <h3 className="elan-copilot__section-title">Actividad reciente</h3>
                        <div className="elan-copilot__activity-list">
                          {quotations.slice(0, 4).map((row) => (
                            <button type="button" key={quotationProjectId(row) || quotationNumber(row)} onClick={() => void openQuotation(row)}>
                              <div className="elan-copilot__activity-icon"><FileText size={19} /></div>
                              <div><strong>{quotationNumber(row)}</strong><span>{quotationCustomer(row)}</span></div>
                              <em>{String(row.status || 'activo').toUpperCase()}</em>
                            </button>
                          ))}
                          {!quotations.length && <div className="elan-copilot__empty">{moduleBusy ? 'Cargando actividad…' : 'No hay cotizaciones visibles para este usuario.'}</div>}
                        </div>
                      </section>
                    </>
                  )}

                  {activePlatform === 'ELANVISUAL' && (activeView === 'cotizaciones' || activeView === 'proyectos') && (
                    <section>
                      <div className="elan-copilot__module-toolbar">
                        <h3>{activeView === 'cotizaciones' ? 'Cotizaciones' : 'Proyectos'}</h3>
                        <button type="button" onClick={newQuotationByVoice}><Plus size={16} /> Nueva por voz</button>
                      </div>
                      <div className="elan-copilot__cards-grid">
                        {quotations.map((row) => (
                          <article className="elan-copilot__record-card" key={quotationProjectId(row) || quotationNumber(row)}>
                            <div className="elan-copilot__record-head"><span>{quotationNumber(row)}</span><em>{String(row.status || 'activo')}</em></div>
                            <h4>{quotationCustomer(row)}</h4>
                            <p>{String(row.projectTitle || row.project_title || row.title || row.projectNumber || 'Proyecto ELANVISUAL')}</p>
                            <strong className="elan-copilot__money">US$ {quotationTotal(row).toFixed(2)}</strong>
                            <div className="elan-copilot__record-actions">
                              <button type="button" onClick={() => void openQuotation(row)} title="Abrir"><Eye size={16} /></button>
                              <button type="button" onClick={() => editQuotationByVoice(row)} title="Editar por voz"><Pencil size={16} /></button>
                              <button type="button" onClick={() => void sendQuotation(row, 'whatsapp')} title="Enviar WhatsApp"><Send size={16} /></button>
                              <button type="button" onClick={() => void sendQuotation(row, 'email')} title="Enviar correo"><Mail size={16} /></button>
                            </div>
                          </article>
                        ))}
                        {!quotations.length && <div className="elan-copilot__empty">No hay registros visibles en tu alcance.</div>}
                      </div>
                    </section>
                  )}

                  {activePlatform === 'ELANVISUAL' && activeView === 'clientes' && (
                    <section>
                      <div className="elan-copilot__module-toolbar"><h3>Clientes</h3><button type="button" onClick={newCustomerByVoice}><Plus size={16} /> Agregar por voz</button></div>
                      <div className="elan-copilot__table-list">
                        {customers.map((row, index) => (
                          <div key={row.customerId || row.id || index}><div className="elan-copilot__table-icon"><Users size={18} /></div><div><strong>{row.name || row.companyName || row.display_name || 'Cliente'}</strong><span>{row.phone || row.whatsapp || row.email || 'Sin contacto visible'}</span></div><em>{row.status || 'activo'}</em></div>
                        ))}
                        {!customers.length && <div className="elan-copilot__empty">No hay clientes visibles para este usuario.</div>}
                      </div>
                    </section>
                  )}

                  {activePlatform === 'ELANVISUAL' && activeView === 'produccion' && (
                    <section>
                      <h3 className="elan-copilot__section-title">Producción</h3>
                      <div className="elan-copilot__table-list">
                        {quotations.map((row) => (
                          <div key={quotationProjectId(row) || quotationNumber(row)}>
                            <div className="elan-copilot__table-icon"><Factory size={18} /></div>
                            <div><strong>{quotationNumber(row)}</strong><span>{quotationCustomer(row)}</span></div>
                            <button type="button" onClick={() => void loadWorkOrders(row)}>Ver OT</button>
                          </div>
                        ))}
                      </div>
                      {!!workOrders.length && (
                        <div className="elan-copilot__subpanel">
                          <h4>Órdenes de trabajo</h4>
                          {workOrders.map((row, index) => <div key={row.id || index}><strong>{row.work_order_number || row.workOrderNumber || 'OT'}</strong><span>{row.status || 'sin estado'}</span></div>)}
                        </div>
                      )}
                    </section>
                  )}

                  {activePlatform === 'ELANVISUAL' && activeView === 'reportes' && (
                    <section>
                      <h3 className="elan-copilot__section-title">Reporte autorizado</h3>
                      <div className="elan-copilot__metric-grid">
                        <article><span>Clientes</span><strong>{Number(report.customers || 0)}</strong></article>
                        <article><span>Cotizaciones</span><strong>{Number(report.quotations || 0)}</strong></article>
                        <article><span>Total cotizado</span><strong>US$ {Number(report.quotedUsd || 0).toFixed(2)}</strong></article>
                        <article><span>Alcance</span><strong>{report.dataScope === 'ALL' ? 'GLOBAL' : 'PROPIO'}</strong></article>
                      </div>
                      <div className="elan-copilot__subpanel">
                        <h4>Por estado</h4>
                        {Object.entries(report.quotationsByStatus || {}).map(([status, count]) => <div key={status}><strong>{status}</strong><span>{count}</span></div>)}
                      </div>
                    </section>
                  )}

                  {activePlatform === 'ELANVISUAL' && activeView === 'inventario' && (
                    <section><h3 className="elan-copilot__section-title">Inventario / precios autorizados</h3><div className="elan-copilot__table-list">{prices.map((row,index)=><div key={row.id||row.code||index}><div className="elan-copilot__table-icon"><Boxes size={18}/></div><div><strong>{row.name||row.product_name||row.code||'Ítem'}</strong><span>{row.description||row.unit||''}</span></div><em>{row.unitPrice||row.price||''}</em></div>)}</div></section>
                  )}

                  {activePlatform === 'ELANVISUAL' && activeView === 'proveedores' && (
                    <section><h3 className="elan-copilot__section-title">Proveedores</h3><div className="elan-copilot__table-list">{providers.map((row,index)=><div key={row.id||index}><div className="elan-copilot__table-icon"><Truck size={18}/></div><div><strong>{row.trade_name||row.legal_name||row.name||'Proveedor'}</strong><span>{row.phone||row.whatsapp||row.email||''}</span></div><em>{row.status||'activo'}</em></div>)}</div></section>
                  )}

                  {activePlatform === 'CONNECT' && (activeView === 'inicio' || activeView === 'vendedores') && (
                    <section><div className="elan-copilot__module-toolbar"><h3>Vendedores / Ejecutivos</h3><span>{sellers.length} visibles</span></div><div className="elan-copilot__table-list">{sellers.map((row,index)=><div key={row.id||index}><div className="elan-copilot__table-icon"><Users size={18}/></div><div><strong>{row.display_name||row.name||row.legal_name||'Ejecutivo'}</strong><span>{row.whatsapp||row.phone||''}</span></div><em>{row.status||'activo'}</em></div>)}</div></section>
                  )}

                  {activePlatform === 'CONNECT' && activeView === 'familia' && (
                    <section><h3 className="elan-copilot__section-title">Miembros autorizados</h3><div className="elan-copilot__table-list">{family.map((row,index)=><div key={row.id||index}><div className="elan-copilot__table-icon"><Users size={18}/></div><div><strong>{row.display_name||row.name||'Miembro'}</strong><span>{row.role||''}</span></div><em>{row.status||'activo'}</em></div>)}</div></section>
                  )}

                  {activePlatform === 'CONNECT' && activeView === 'contactos' && (
                    <section><h3 className="elan-copilot__section-title">Contactos</h3><div className="elan-copilot__table-list">{contacts.map((row,index)=><div key={row.id||index}><div className="elan-copilot__table-icon"><MessageSquare size={18}/></div><div><strong>{row.name||row.display_name||row.companyName||'Contacto'}</strong><span>{row.phone||row.whatsapp||row.email||''}</span></div><em>{row.type||row.role||''}</em></div>)}</div></section>
                  )}

                  {activePlatform === 'ELAN_GO' && (activeView === 'inicio' || activeView === 'necesidades') && (
                    <section><div className="elan-copilot__module-toolbar"><h3>Necesidades</h3><button type="button" onClick={() => beginVoiceTask('Contexto de interfaz: el usuario quiere registrar una nueva necesidad en ELAN GO. Esperá su instrucción de voz y usá marketplace_gestionar_necesidad.', 'Voz activada: decime qué necesitás buscar o conseguir.')}><Plus size={16}/> Nueva por voz</button></div><div className="elan-copilot__cards-grid">{demands.map((row,index)=><article className="elan-copilot__record-card" key={row.id||row.code||index}><div className="elan-copilot__record-head"><span>{row.code||row.demandCode||'Necesidad'}</span><em>{row.status||'activa'}</em></div><h4>{row.title||'Necesidad'}</h4><p>{row.description||row.category||''}</p></article>)}</div></section>
                  )}

                  {activePlatform === 'ELAN_GO' && activeView === 'descubrimientos' && (
                    <section><h3 className="elan-copilot__section-title">Descubrimientos</h3><div className="elan-copilot__cards-grid">{discoveries.map((row,index)=><article className="elan-copilot__record-card" key={row.id||row.code||index}><div className="elan-copilot__record-head"><span>{row.source||'Fuente'}</span><em>{row.status||'activo'}</em></div><h4>{row.title||row.name||'Opción encontrada'}</h4><p>{row.description||row.url||''}</p></article>)}</div></section>
                  )}

                  {activeView === 'ajustes' && (
                    <section>
                      <h3 className="elan-copilot__section-title">Sesión y permisos</h3>
                      <div className="elan-copilot__settings-card">
                        <div><span>Usuario</span><strong>{actorLabel}</strong></div>
                        <div><span>Rol</span><strong>{session?.role || 'miembro'}</strong></div>
                        <div><span>Plataforma</span><strong>{platformLabel}</strong></div>
                        <div><span>Entrada</span><strong>WhatsApp · enlace de un solo uso</strong></div>
                        <div><span>Herramientas</span><strong>{runtimeTools.size}</strong></div>
                      </div>
                    </section>
                  )}
                </main>
              </div>
            )}

            {lastCapture && (
              <div className="elan-field__capture-card">
                <img src={lastCapture} alt="Última captura de campo" />
                <div><strong>{captureBusy ? 'Analizando captura…' : 'Última captura'}</strong>{captureAnalysis && <p>{captureAnalysis}</p>}</div>
                <button type="button" onClick={() => { setLastCapture(''); setCaptureAnalysis(''); }}><X size={16} /></button>
              </div>
            )}

            {recordedVideoUrl && (
              <div className="elan-field__recording-preview">
                <video src={recordedVideoUrl} controls playsInline />
                <div className="elan-field__recording-actions"><button type="button" onClick={saveRecordedVideo}>Guardar video</button><button type="button" onClick={closeRecordedVideo}>Cerrar video</button></div>
              </div>
            )}

            {recordingNote && <div className="elan-field__note">{recordingNote}</div>}
            {error && <div className="elan-field__error">{error}</div>}
            {actionNotice && !error && <div className="elan-copilot__notice">{actionNotice}</div>}
          </section>
        </section>
      )}

      {chatOpen && sessionToken && !locked && (
        <aside className="elan-field__chat-panel elan-copilot__chat-panel">
          <div className="elan-field__chat-head">
            <div><strong>Chat con ELAN AI</strong><span>{platformLabel} · misma memoria y permisos</span></div>
            <button type="button" onClick={() => setChatOpen(false)}><X size={18} /></button>
          </div>
          <ELANFieldThread sessionToken={sessionToken} platform={activePlatform} memoryHistory={memoryHistory} onResponse={syncTextTurnWithRealtime} />
        </aside>
      )}

      {selectedQuote && (
        <aside className="elan-copilot__document">
          <div className="elan-copilot__document-head">
            <div><small>DOCUMENTO OFICIAL</small><strong>{quotationNumber(selectedQuote)}</strong><span>{quotationCustomer(selectedQuote)}</span></div>
            <button type="button" onClick={() => setSelectedQuote(null)}><X size={19} /></button>
          </div>
          <div className="elan-copilot__document-body">
            <div className="elan-copilot__document-total"><span>Total</span><strong>US$ {quotationTotal(selectedQuote).toFixed(2)}</strong></div>
            <div className="elan-copilot__document-items">
              {quotationItems(selectedQuote).map((item, index) => (
                <div key={item.id || index}><div><strong>{item.name || item.title || item.description || `Ítem ${index + 1}`}</strong><span>{item.description || item.specification || ''}</span></div><em>{Number(item.total || item.subtotal || 0) ? `US$ ${Number(item.total || item.subtotal).toFixed(2)}` : ''}</em></div>
              ))}
              {!quotationItems(selectedQuote).length && <div className="elan-copilot__empty">El documento está abierto. Los detalles completos permanecen en CONNECT.</div>}
            </div>
          </div>
          <div className="elan-copilot__document-actions">
            <button type="button" onClick={() => editQuotationByVoice(selectedQuote)}><Pencil size={16} /> Editar por voz</button>
            <button type="button" onClick={() => void sendQuotation(selectedQuote, 'whatsapp')}><Send size={16} /> WhatsApp</button>
            <button type="button" onClick={() => void sendQuotation(selectedQuote, 'email')}><Mail size={16} /> Correo</button>
            {selectedQuote.pdfUrl && <a href={selectedQuote.pdfUrl} target="_blank" rel="noreferrer"><FileText size={16} /> Abrir PDF</a>}
            {selectedQuote.publicUrl && <a href={selectedQuote.publicUrl} target="_blank" rel="noreferrer"><Eye size={16} /> Abrir oficial</a>}
          </div>
        </aside>
      )}

      {!locked && (
        <button type="button" className={`elan-copilot__mic-fab ${active ? 'is-active' : ''}`} onClick={toggleConversation} title="Hablar con ELAN">
          {active ? <MicOff size={29} /> : <Mic size={29} />}
        </button>
      )}
    </main>
  );

}
