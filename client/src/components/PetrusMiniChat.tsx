import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { X, Send, Zap, ZapOff, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const GREETING: ChatMessage = {
  role: 'model',
  content: 'Oi! Sou o Petrus, seu assistente no Scaffl. Posso ajudar com a plataforma, seus simuladores, atividades e muito mais.',
};

export default function PetrusMiniChat() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on full chat page — user talks there directly
  if (location.pathname.startsWith('/chat')) return null;

  return <MiniChatWidget navigate={navigate} />;
}

function MiniChatWidget({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agenticMode, setAgenticMode] = useState(false);
  const [queueWarning, setQueueWarning] = useState(false);
  const [showAgenticTip, setShowAgenticTip] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      inputRef.current?.focus();
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
      const result = await api.petrus.support(historyForApi, text, agenticMode);
      setMessages(prev => [...prev, { role: 'model', content: result.text }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'model', content: `Erro: ${err.message || 'Falha ao conectar com o Petrus.'}` },
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
  const renderMessage = (content: string) => (
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
      {content}
    </Markdown>
  );

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Petrus — Suporte"
        >
          <Sparkles size={22} />
        </button>
      )}

      {/* Mini chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 w-[360px] max-h-[520px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/20 animate-slideUp overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Petrus</p>
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
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
                  )}
                  title="Modo Agentic"
                >
                  {agenticMode ? <Zap size={12} className="fill-current" /> : <ZapOff size={12} />}
                  <span>Agentic</span>
                </button>

                {showAgenticTip && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-900 text-white text-[11px] rounded-xl px-3 py-2 shadow-xl leading-relaxed pointer-events-none z-50">
                    {agenticMode
                      ? 'Modo Agentic ativo — o Petrus pode criar projetos na sua conta. Consome mais créditos do Petrus.'
                      : 'Ativar Modo Agentic: o Petrus poderá agir na sua conta (criar projetos etc.). Consome mais créditos.'}
                    <div className="absolute top-full right-4 -mt-px border-4 border-transparent border-t-slate-900" />
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
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-sm',
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
                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 size={13} className="animate-spin" />
                    <span className="text-xs">Petrus está pensando…</span>
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
          <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte ao Petrus…"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-1.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
