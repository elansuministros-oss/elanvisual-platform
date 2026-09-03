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
requireText(pkg.dependencies?.['react-record-webcam'] || '', '2.0.1', 'RECORD_WEBCAM');

requireText(thread, 'useLocalRuntime', 'ASSISTANT_RUNTIME');
requireText(thread, "canal: 'web-live'", 'TEXT_UNIFIED_CHANNEL');
requireText(live, 'FieldCamera', 'FIELD_CAMERA');
requireText(live, 'MediaRecorder', 'FIELD_RECORDING');
requireText(live, "audio: false", 'VIDEO_ONLY_RECORDING');
requireText(live, 'recordedVideoUrl', 'VIDEO_PREVIEW');
requireText(live, "persistRealtimeMemory('inbound'", 'AUDIO_INBOUND_MEMORY');
requireText(live, "persistRealtimeMemory('outbound'", 'AUDIO_OUTBOUND_MEMORY');
requireText(live, 'captureFieldFrame', 'CAPTURE_FRAME');
requireText(live, 'isCaptureCommand', 'VOICE_CAPTURE_COMMAND');
requireText(proxy, "canUseCamera:has('camera.vision')", 'CAMERA_SCOPE');
requireText(proxy, 'getPublishedAiRuntime', 'PUBLISHED_RUNTIME');
requireText(proxy, "direction:'inbound'", 'TEXT_INBOUND_MEMORY');
requireText(proxy, "direction:'outbound'", 'TEXT_OUTBOUND_MEMORY');
requireText(realtime, 'publishedRuntime', 'REALTIME_PUBLISHED_RUNTIME');
requireText(realtime, 'runtimeMemory', 'REALTIME_MEMORY');
forbidText(css, 'elan-live__orb', 'LEGACY_ORB');

console.log('ELAN_COPILOT_UNIFIED_CONTEXT_OK');
