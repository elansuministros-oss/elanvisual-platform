import fs from 'node:fs';

const live = fs.readFileSync('src/ai/ELANLive.jsx', 'utf8');
const thread = fs.readFileSync('src/ai/ELANFieldThread.jsx', 'utf8');
const css = fs.readFileSync('src/ai/ELANLive.css', 'utf8');
const proxy = fs.readFileSync('api/elan-ai.js', 'utf8');
const realtime = fs.readFileSync('api/elan-realtime-token.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

function requireText(source, text, label) {
  if (!source.includes(text)) throw new Error(`MISSING_${label}: ${text}`);
}
function forbidText(source, text, label) {
  if (source.includes(text)) throw new Error(`FORBIDDEN_${label}: ${text}`);
}

requireText(pkg.dependencies?.['@assistant-ui/react'] || '', '0.15.17', 'ASSISTANT_UI');
requireText(pkg.dependencies?.['react-webcam-pro'] || '', '1.2.0', 'WEBCAM_PRO');

requireText(thread, 'useLocalRuntime', 'ASSISTANT_RUNTIME');
requireText(thread, "platform = 'ELANVISUAL'", 'TEXT_PLATFORM_PROP');
requireText(thread, 'unidad: platform', 'TEXT_ACTIVE_PLATFORM');
requireText(thread, "canal: 'web-live'", 'TEXT_UNIFIED_CHANNEL');

requireText(live, "const OWNER_PLATFORMS = ['ELANVISUAL'];", 'OWNER_PUBLIC_SURFACE');
requireText(live, 'elan-copilot__topbar', 'PLATFORM_DASHBOARD');
requireText(live, 'callLiveTool', 'DIRECT_TOOL_RUNTIME');
requireText(live, "callLiveTool('abrir_cotizacion'", 'OPEN_QUOTATION_TOOL');
requireText(live, "'enviar_cotizacion_email'", 'EMAIL_QUOTATION_TOOL');
requireText(live, "'enviar_cotizacion_cliente'", 'WHATSAPP_QUOTATION_TOOL');
requireText(live, 'selectedQuote.pdfUrl', 'OPEN_PDF_ACTION');
requireText(live, 'FieldCamera', 'FIELD_CAMERA');
requireText(live, 'MediaRecorder', 'FIELD_RECORDING');
requireText(live, "audio: false", 'VIDEO_ONLY_RECORDING');
requireText(live, "persistRealtimeMemory('inbound'", 'AUDIO_INBOUND_MEMORY');
requireText(live, "persistRealtimeMemory('outbound'", 'AUDIO_OUTBOUND_MEMORY');

requireText(css, '.elan-copilot__topbar', 'DASHBOARD_CSS');
requireText(css, '.elan-copilot__sidebar', 'SIDEBAR_CSS');
requireText(css, '.elan-copilot__mic-fab', 'VOICE_FAB_CSS');

requireText(proxy, "const PUBLIC_RUNTIME_PLATFORMS=new Set(['ELANVISUAL','ELANHOME','ELANPET']);", 'PUBLIC_RUNTIME_LOCK');
requireText(proxy, "LIVE_PLATFORM_NOT_PUBLIC", 'PUBLIC_RUNTIME_FAIL_CLOSED');
requireText(proxy, 'getPublishedAiRuntime', 'PUBLISHED_RUNTIME');
requireText(proxy, "direction:'inbound'", 'TEXT_INBOUND_MEMORY');
requireText(proxy, "direction:'outbound'", 'TEXT_OUTBOUND_MEMORY');

requireText(realtime, "const PUBLIC_RUNTIME_PLATFORMS=new Set(['ELANVISUAL','ELANHOME','ELANPET']);", 'REALTIME_PUBLIC_RUNTIME_LOCK');
requireText(realtime, 'publishedRuntime', 'REALTIME_PUBLISHED_RUNTIME');
requireText(realtime, 'runtimeMemory', 'REALTIME_MEMORY');

forbidText(live, "const OWNER_PLATFORMS = ['ELANVISUAL', 'ELAN_GO', 'CONNECT'];", 'NON_PUBLIC_OWNER_PLATFORM_SWITCH');

console.log('ELAN_COPILOT_UNIFIED_CONTEXT_OK');
