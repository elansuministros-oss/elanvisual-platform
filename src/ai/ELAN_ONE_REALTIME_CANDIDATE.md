# ELAN ONE — Realtime Voice Candidate

Estado: CANDIDATO / LAB
Fecha: 2026-09-04

## Objetivo

Rescatar y validar, sin reprogramar, el componente Realtime/WebRTC existente de ELAN para reutilizarlo en ELAN ONE.

## Componentes existentes reutilizados sin modificación funcional

Frontend:
- `src/ai/ELANLive.jsx`
- `src/ai/ELANLive.css`

Endpoint de autorización Realtime:
- `api/elan-realtime-token.js`

Backend emparejado:
- repositorio `elansuministros-oss/elankav-connect`
- rama `elan-one/realtime-candidate-20260904`
- `src/modules/copilot/copilot.routes.ts`

## Capacidades ya presentes en el componente

- WebRTC mediante `RTCPeerConnection`
- micrófono continuo con `getUserMedia`
- OpenAI Realtime
- token efímero
- server VAD
- interrupción de respuesta
- transcripción de turnos
- memoria compartida
- runtime tools
- cámara/captura
- identidad y permisos provenientes de CONNECT

## Regla de ELAN ONE

Esta rama no autoriza despliegue a producción.
WAHA, Orchestrator, CONNECT producción y demás componentes protegidos no se modifican.
La validación inicial de esta rama consiste únicamente en contrato Copilot + build del frontend existente.
