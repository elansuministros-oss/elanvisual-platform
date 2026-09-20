import React, { useMemo } from 'react';
import {
  AuiIf,
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePartPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useLocalRuntime,
} from '@assistant-ui/react';
import { Send, Sparkles } from 'lucide-react';

const ELAN_API = '/api/elan-ai';

function textFromPart(part) {
  if (!part || typeof part !== 'object') return '';
  if (part.type === 'text') return String(part.text || '').trim();
  return '';
}

function serializeMessages(messages = []) {
  return messages
    .map((message) => {
      const content = Array.isArray(message?.content)
        ? message.content.map(textFromPart).filter(Boolean).join('\n')
        : String(message?.content || '').trim();
      return content ? { role: message.role === 'assistant' ? 'assistant' : 'user', content } : null;
    })
    .filter(Boolean);
}

function initialMessagesFromMemory(history = []) {
  return history
    .map((item, index) => {
      const text = String(item?.content || '').trim();
      if (!text) return null;
      return {
        id: `memory-${index}-${String(item?.createdAt || index)}`,
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: [{ type: 'text', text }],
      };
    })
    .filter(Boolean);
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="elan-field-chat__row elan-field-chat__row--user">
      <div className="elan-field-chat__bubble elan-field-chat__bubble--user">
        <MessagePrimitive.Parts>
          {({ part }) => part.type === 'text' ? <MessagePartPrimitive.Text /> : null}
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="elan-field-chat__row elan-field-chat__row--assistant">
      <div className="elan-field-chat__avatar"><Sparkles size={14} /></div>
      <div className="elan-field-chat__bubble elan-field-chat__bubble--assistant">
        <MessagePrimitive.Parts>
          {({ part }) => part.type === 'text' ? <MessagePartPrimitive.Text /> : (part.toolUI ?? null)}
        </MessagePrimitive.Parts>
      </div>
    </MessagePrimitive.Root>
  );
}

function FieldThread() {
  return (
    <ThreadPrimitive.Root className="elan-field-chat">
      <ThreadPrimitive.Viewport className="elan-field-chat__viewport">
        <AuiIf condition={(state) => state.thread.isEmpty}>
          <div className="elan-field-chat__empty">
            <Sparkles size={18} />
            <div>
              <strong>ELAN listo.</strong>
              <span>Escribí o hablá. La memoria es la misma que usa WhatsApp.</span>
            </div>
          </div>
        </AuiIf>

        <ThreadPrimitive.Messages>
          {({ message }) => message.role === 'user' ? <UserMessage /> : <AssistantMessage />}
        </ThreadPrimitive.Messages>

        <ThreadPrimitive.ViewportFooter className="elan-field-chat__footer">
          <ComposerPrimitive.Root className="elan-field-chat__composer">
            <ComposerPrimitive.Input
              className="elan-field-chat__input"
              placeholder="Escribile a ELAN..."
              rows={1}
            />
            <ComposerPrimitive.Send className="elan-field-chat__send" aria-label="Enviar">
              <Send size={17} />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}

export default function ELANFieldThread({ sessionToken, memoryHistory = [], onResponse }) {
  const initialMessages = useMemo(() => initialMessagesFromMemory(memoryHistory), [memoryHistory]);

  const modelAdapter = useMemo(() => ({
    async run({ messages, abortSignal, unstable_assistantMessageId }) {
      const serialized = serializeMessages(messages);
      const response = await fetch(ELAN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'copilot',
          unidad: 'ELANVISUAL',
          canal: 'web-live',
          live_session_token: sessionToken,
          client_message_id: unstable_assistantMessageId ? `copilot-user:${unstable_assistantMessageId}` : undefined,
          messages: serialized,
          runtime_context: { surface: 'elan-field-copilot' },
        }),
        signal: abortSignal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || `CONNECT respondió ${response.status}`);
      }
      const text = String(data?.texto || data?.respuesta || data?.message || data?.content || '').trim();
      if (!text) throw new Error('ELAN respondió sin texto utilizable.');
      const lastUser = [...serialized].reverse().find((item) => item.role === 'user')?.content || '';
      onResponse?.(text, data, lastUser);
      return { content: [{ type: 'text', text }] };
    },
  }), [sessionToken, onResponse]);

  const runtime = useLocalRuntime(modelAdapter, {
    initialMessages,
    maxSteps: 1,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <FieldThread />
    </AssistantRuntimeProvider>
  );
}
