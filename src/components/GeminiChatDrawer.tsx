import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import type { UserProfile } from '../types/studybook';

export type ChatPersona = 'mentor' | 'formula' | 'coach';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  persona: ChatPersona;
}

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  masteryPercent: number;
  mistakeCount: number;
}

const CHAT_STORAGE_KEY = 'studybook_ai_chat_history_v1';

const PERSONAS: {
  id: ChatPersona;
  label: string;
  subtitle: string;
  modelLabel: string;
}[] = [
  {
    id: 'mentor',
    label: 'Exam Mentor',
    subtitle: 'Concepts, numericals & study plans',
    modelLabel: 'Gemini 4 Flash',
  },
  {
    id: 'formula',
    label: 'Quick Formula',
    subtitle: 'Rapid IS codes, formulas & shortcuts',
    modelLabel: 'Flash Lite',
  },
  {
    id: 'coach',
    label: 'Mock Coach',
    subtitle: 'CBT timing, accuracy & negative marking',
    modelLabel: 'Gemini 4 Flash',
  },
];

export const GeminiChatDrawer: React.FC<GeminiChatDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  masteryPercent,
  mistakeCount,
}) => {
  const [persona, setPersona] = useState<ChatPersona>('mentor');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ChatMessage[];
      return Array.isArray(parsed) ? parsed.slice(-50) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, isOpen]);

  const starterPrompts = useMemo(() => {
    if (profile.branch === 'mechanical') {
      return [
        'Compare Otto, Diesel & Dual cycle efficiencies for same r vs same Pmax',
        'Give a rapid specific speed table for Pelton, Francis & Kaplan turbines',
        'How should I split 120 mins in SSC JE Mechanical CBT to avoid -0.25 traps?',
      ];
    }
    return [
      'Summarize IS 456:2000 limiting neutral axis & shear reinforcement clauses',
      'Explain Terzaghi bearing capacity factors and water table correction quickly',
      'How should I balance Reasoning speed and Civil technical accuracy in CBT?',
    ];
  }, [profile.branch]);

  const sendMessage = async (overrideText?: string) => {
    const promptText = (overrideText ?? input).trim();
    if (!promptText || isStreaming) return;

    setErrorMsg('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: promptText,
      timestamp: nowTime,
      persona,
    };
    const modelMsgId = `m_${Date.now() + 1}`;
    const placeholderModelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: nowTime,
      persona,
    };

    const historyToSend = messages.slice(-20).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg, placeholderModelMsg]);
    if (!overrideText) setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: historyToSend,
          message: promptText,
          persona,
          context: {
            aspirantName: profile.aspirantName,
            branch: profile.branch,
            targetExam: profile.targetExam,
            masteryPercent,
            mistakeCount,
          },
        }),
      });

      if (!response.ok || !response.body) {
        let errText = 'Unable to connect to StudyBook Mentor.';
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson.error) errText = errJson.error;
        } catch {
          // ignore JSON parse failure
        }
        throw new Error(errText);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const line = evt.trim();
          if (!line.startsWith('data:')) continue;
          const payloadStr = line.slice(5).trim();
          if (!payloadStr) continue;
          try {
            const payload = JSON.parse(payloadStr) as {
              chunk?: string;
              done?: boolean;
              error?: string;
            };
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.chunk) {
              accumulated += payload.chunk;
              setMessages((prev) =>
                prev.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m)),
              );
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              throw parseErr;
            }
          }
        }
      }

      if (!accumulated.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === modelMsgId
              ? { ...m, text: 'I could not generate a response right now. Please try again.' }
              : m,
          ),
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while replying.';
      setErrorMsg(msg);
      setMessages((prev) => prev.filter((m) => !(m.id === modelMsgId && !m.text.trim())));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleClearHistory = () => {
    if (isStreaming) return;
    setMessages([]);
    setErrorMsg('');
  };

  if (!isOpen) return null;

  const activePersonaMeta = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-label="StudyBook Mentor Chat"
        className="sb-surface w-full sm:max-w-lg h-full sm:h-[calc(100%-2rem)] sm:my-4 sm:mr-4 sm:rounded-3xl rounded-none flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-black/[0.08] dark:border-white/[0.09] space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 truncate">
                  StudyBook Mentor
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {activePersonaMeta.subtitle} · {activePersonaMeta.modelLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={isStreaming}
                  aria-label="Clear conversation"
                  title="Clear conversation"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Persona Role Selector */}
          <div
            role="tablist"
            aria-label="Mentor role"
            className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-black/[0.05] dark:bg-white/[0.07]"
          >
            {PERSONAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={persona === item.id}
                onClick={() => setPersona(item.id)}
                className={`min-h-[36px] px-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  persona === item.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Conversation Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center space-y-5 py-6">
              <div className="space-y-1.5 text-center">
                <p className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Ask anything about{' '}
                  {profile.branch === 'mechanical' ? 'Mechanical' : 'Civil'} JE
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Multi-turn mentor with memory of your conversation, IS codes, formulas, and CBT strategy.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 px-1">
                  Suggested prompts
                </p>
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt)}
                    className="w-full text-left rounded-2xl border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.025] dark:bg-white/[0.035] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] px-4 py-3 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-br-md'
                        : 'bg-black/[0.045] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                    }`}
                  >
                    {msg.text || (
                      <span className="inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Thinking...</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 px-1 tabular-nums">
                    {isUser ? 'You' : PERSONAS.find((p) => p.id === msg.persona)?.label || 'Mentor'} ·{' '}
                    {msg.timestamp}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mx-5 mb-2 flex items-center gap-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="break-words">{errorMsg}</span>
          </div>
        )}

        {/* Composer Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="px-4 py-3.5 pb-safe border-t border-black/[0.08] dark:border-white/[0.09] flex items-end gap-2 shrink-0"
        >
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={3000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              persona === 'formula'
                ? 'Ask for an IS code clause, formula, or unit...'
                : persona === 'coach'
                  ? 'Ask about CBT pacing, accuracy, or weak topics...'
                  : 'Ask a concept, numerical, or revision question...'
            }
            className="flex-1 min-h-[44px] max-h-32 resize-none rounded-2xl bg-black/[0.045] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-zinc-100/20"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40 shrink-0 transition-opacity"
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </section>
    </div>
  );
};
