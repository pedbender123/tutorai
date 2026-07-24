import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { X, Send, Zap, ZapOff, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { substitutePiiTags } from '../lib/piiTags';
import { notifyLabProjectsChanged } from '../lib/events';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const GREETING: ChatMessage = {
  role: 'model',
  content: 'Oi! Sou o Levy, o guia pedagógico da Scaffl. Mais do que responder, eu te ajudo a pensar — me conte onde você travou.',
};

export default function LevyMiniChat() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on the full Levy chat page — user já está falando com ele ali, direto
  if (location.pathname.startsWith('/levy') || location.pathname.startsWith('/chat')) return null;

  return <MiniChatWidget navigate={navigate} />;
}

const DEFAULT_SIZE = { width: 380, height: 620 };
const MIN_SIZE = { width: 320, height: 400 };
const MAX_SIZE = { width: 640, height: 900 };

function loadSavedSize(): { width: number; height: number } {
  try {
    const raw = localStorage.getItem('levy_mini_size');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.width === 'number' && typeof parsed.height === 'number') return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_SIZE;
}

function MiniChatWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const { userData } = useAuth();
  const [open, setOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agenticMode, setAgenticMode] = useState(false);
  const [queueWarning, setQueueWarning] = useState(false);
  const [showAgenticTip, setShowAgenticTip] = useState(false);
  const [size, setSize] = useState(loadSavedSize);
  const [resizing, setResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    resizeStartRef.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    setResizing(true);
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: PointerEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const nextWidth = Math.min(MAX_SIZE.width, Math.max(MIN_SIZE.width, start.width - (e.clientX - start.x)));
      const nextHeight = Math.min(MAX_SIZE.height, Math.max(MIN_SIZE.height, start.height - (e.clientY - start.y)));
      setSize({ width: nextWidth, height: nextHeight });
    };
    const onUp = () => {
      setResizing(false);
      setSize(prev => {
        localStorage.setItem('levy_mini_size', JSON.stringify(prev));
        return prev;
      });
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [resizing]);

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
      if (institutionName === undefined) {
        api.institutions.mine().then(list => setInstitutionName(list[0]?.name ?? '')).catch(() => {});
      }
    }
  }, [open, messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);
    setQueueWarning(false);

    queueTimerRef.current = setTimeout(() => setQueueWarning(true), 30_000);

    try {
      const historyForApi = updatedHistory.slice(0, -1); // exclude the message we just added
      const result = await api.levy.support(historyForApi, text, agenticMode);
      setMessages(prev => [...prev, { role: 'model', content: result.text }]);
      // Só o modo agentic pode ter criado um projeto no Lab — avisa páginas já montadas.
      if (agenticMode) notifyLabProjectsChanged();
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'model', content: `Erro: ${err.message || 'Falha ao conectar com o Levy.'}` },
      ]);
    } finally {
      setLoading(false);
      setQueueWarning(false);
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    }
  }, [input, loading, messages, agenticMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Detect internal navigation links in model messages (/lab/xxx etc.)
  const renderMessage = (content: string) => {
    const display = substitutePiiTags(content, { nome: userData?.name, instituicao: institutionName });
    return (
      <Markdown
        components={{
          a: ({ href, children }) => {
            const isInternal = href?.startsWith('/');
            if (isInternal) {
              return (
                <button
                  onClick={() => navigate(href!)}
                  className="text-primary underline hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {children}
                </button>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline">{children}</a>;
          },
        }}
      >
        {display}
      </Markdown>
    );
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{ backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' }}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl text-white shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Levy — Suporte"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* Mini chat panel */}
      {open && (
        <div
          style={{ width: size.width, height: size.height }}
          className={cn(
            'fixed bottom-6 right-6 z-40 flex flex-col glass-panel shadow-2xl shadow-slate-900/20 overflow-hidden',
            !resizing && 'animate-slideUp',
          )}
        >
          {/* Alça de redimensionamento (canto superior esquerdo — painel ancorado no canto inferior direito) */}
          <div
            onPointerDown={handleResizeStart}
            className="absolute top-0 left-0 w-5 h-5 z-20 cursor-nwse-resize flex items-center justify-center touch-none"
            title="Arrastar para redimensionar"
          >
            <div className="w-2.5 h-2.5 border-t-2 border-l-2 border-slate-400/50 dark:border-slate-500/50 rounded-tl-sm" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Levy</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Suporte Scaffl</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Agentic toggle */}
              <div className="relative">
                <button
                  onClick={() => setAgenticMode(m => !m)}
                  onMouseEnter={() => setShowAgenticTip(true)}
                  onMouseLeave={() => setShowAgenticTip(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer',
                    agenticMode
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-white/40 dark:bg-white/5 text-slate-400 border border-transparent hover:border-primary/20',
                  )}
                  title="Modo Agentic"
                >
                  {agenticMode ? <Zap size={12} className="fill-current" /> : <ZapOff size={12} />}
                  <span>Agentic</span>
                </button>

                {showAgenticTip && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl leading-relaxed pointer-events-none z-50">
                    <div className="absolute bottom-full right-4 -mb-px border-4 border-transparent border-b-slate-900" />
                    {agenticMode
                      ? 'Modo Agentic ativo — o Levy pode criar projetos na sua conta. Consome mais créditos do Levy.'
                      : 'Ativar Modo Agentic: o Levy poderá agir na sua conta (criar projetos etc.). Consome mais créditos.'}
                  </div>
                )}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  style={msg.role === 'user' ? { backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' } : undefined}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'glasscard text-slate-800 dark:text-slate-100 rounded-bl-sm',
                  )}
                >
                  {msg.role === 'model'
                    ? <div className="markdown-body prose prose-sm dark:prose-invert prose-primary max-w-none text-sm [&>p]:mb-1 [&>p:last-child]:mb-0">
                        {renderMessage(msg.content)}
                      </div>
                    : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glasscard rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-xs">Levy está pensando…</span>
                  </div>
                  {queueWarning && (
                    <p className="text-[11px] text-amber-500 mt-1.5 leading-snug">
                      Demorando mais que o esperado — aguarde, já está sendo processado.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2 bg-white/40 dark:bg-white/5 border border-white/20 rounded-2xl px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte ao Levy…"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                style={!(loading || !input.trim()) ? { backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' } : undefined}
                className={cn(
                  'p-1.5 rounded-xl text-white active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
                  (loading || !input.trim()) && 'bg-primary',
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
