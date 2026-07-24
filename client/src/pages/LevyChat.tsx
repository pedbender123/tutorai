import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Markdown from 'react-markdown';
import { Send, Zap, ZapOff, Loader2, Sparkles, ChevronDown, Plus, Check } from 'lucide-react';
import { api, LevyChat as LevyChatType, LevyMessage } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { substitutePiiTags } from '../lib/piiTags';
import { notifyLabProjectsChanged } from '../lib/events';
import { cn } from '../lib/utils';

export default function LevyChat() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { userData, refreshUserData } = useAuth();

  const [allChats, setAllChats] = useState<LevyChatType[]>([]);
  const [messages, setMessages] = useState<LevyMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [agenticMode, setAgenticMode] = useState(false);
  const [queueWarning, setQueueWarning] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [institutionName, setInstitutionName] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolvingRef = useRef(false);

  // Nome da instituição — só pra exibição local, nunca enviado pro modelo (ver piiTags.ts)
  useEffect(() => {
    api.institutions.mine().then(list => setInstitutionName(list[0]?.name)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Carrega a lista de conversas; se não houver chatId na rota, resolve pra uma
  // (retoma a mais recente, ou cria uma nova se o usuário nunca conversou com o Levy).
  useEffect(() => {
    let cancelled = false;
    api.levy.chats.getAll().then(async list => {
      if (cancelled) return;
      setAllChats(list);
      if (!chatId) {
        if (resolvingRef.current) return;
        resolvingRef.current = true;
        if (list.length > 0) {
          navigate(`/levy/${list[0].id}`, { replace: true });
        } else {
          const { chat } = await api.levy.chats.create();
          navigate(`/levy/${chat.id}`, { replace: true });
        }
      }
    }).catch(console.error);
    return () => { cancelled = true; };
  }, [chatId, navigate]);

  useEffect(() => {
    if (!chatId) return;
    setInitializing(true);
    api.levy.chats.getMessages(chatId)
      .then(setMessages)
      .catch(() => navigate('/levy', { replace: true }))
      .finally(() => setInitializing(false));
  }, [chatId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const autoResizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !chatId) return;

    const tempId = crypto.randomUUID();
    setMessages(prev => [...prev, { id: tempId, chatId, role: 'user', content: text, creditsUsed: 0, createdAt: new Date().toISOString() }]);
    setInput('');
    requestAnimationFrame(autoResizeTextarea);
    setLoading(true);
    setQueueWarning(false);

    queueTimerRef.current = setTimeout(() => setQueueWarning(true), 30_000);

    try {
      const { userMessage, modelMessage, chatTitle } = await api.levy.chats.sendMessage(chatId, text, agenticMode);
      setMessages(prev => [...prev.filter(m => m.id !== tempId), userMessage, modelMessage]);
      setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, title: chatTitle || c.title, hasUserMessage: 1, updatedAt: new Date().toISOString() } : c));
      refreshUserData().catch(() => {});
      // Só o modo agentic pode ter criado um projeto no Lab — avisa páginas já montadas.
      if (agenticMode) notifyLabProjectsChanged();
    } catch (err: any) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        { id: crypto.randomUUID(), chatId, role: 'model', content: `Erro: ${err.message || 'Falha ao conectar com o Levy.'}`, creditsUsed: 0, createdAt: new Date().toISOString() },
      ]);
      setInput(text);
    } finally {
      setLoading(false);
      setQueueWarning(false);
      if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    }
  }, [input, loading, chatId, agenticMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = async () => {
    setSwitcherOpen(false);
    // Reaproveita uma conversa vazia já existente em vez de criar mais uma em branco.
    const reusable = allChats.find(c => !c.hasUserMessage);
    if (reusable) {
      navigate(`/levy/${reusable.id}`);
      return;
    }
    const { chat } = await api.levy.chats.create();
    setAllChats(prev => [{ ...chat, hasUserMessage: 0 }, ...prev]);
    navigate(`/levy/${chat.id}`);
  };

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
    <div className="flex flex-col h-full font-sans">
      {/* Header com switcher de conversas */}
      <div className="flex items-center gap-3 h-[62px] px-5 border-b border-white/10 backdrop-blur-xl bg-white/60 dark:bg-white/[0.03] shrink-0">
        <div className="relative flex-1 min-w-0" ref={switcherRef}>
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            className="flex items-center gap-3 max-w-sm hover:bg-white/40 dark:hover:bg-white/5 rounded-2xl px-2 py-1.5 -mx-2 transition-all group"
          >
            <div
              style={{ backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
            >
              <Sparkles size={18} />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-black text-slate-900 dark:text-slate-100 truncate leading-tight font-display">Levy</p>
              <p className="text-[11px] text-slate-400 truncate">Suporte e assistente da plataforma</p>
            </div>
            <ChevronDown size={15} className={cn('text-slate-400 shrink-0 transition-transform', switcherOpen && 'rotate-180')} />
          </button>

          {switcherOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 glass-panel shadow-xl shadow-black/10 z-50 overflow-hidden">
              <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 font-mono">Conversas</p>
                {allChats.map(c => {
                  const isCurrent = c.id === chatId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => { navigate(`/levy/${c.id}`); setSwitcherOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all',
                        isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-white/40 dark:hover:bg-white/5'
                      )}
                    >
                      <span className="text-sm font-bold truncate flex-1">{c.title}</span>
                      {isCurrent && <Check size={14} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
                {allChats.length === 0 && (
                  <p className="text-xs text-slate-400 px-2 py-3 text-center">Nenhuma conversa ainda</p>
                )}
              </div>
              <div className="border-t border-white/10 p-2">
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-primary hover:bg-primary/10 transition-all"
                >
                  <Plus size={16} />
                  Nova conversa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {initializing ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <div className="px-4 py-6">
            <div className="max-w-3xl mx-auto w-full space-y-5">
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('shrink-0 mt-1 w-8 h-8 rounded-xl flex items-center justify-center', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'glasscard text-primary')}>
                    <Sparkles size={14} />
                  </div>
                  <div
                    style={msg.role === 'user' ? { backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' } : undefined}
                    className={cn(
                      'max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      msg.role === 'user' ? 'text-white rounded-tr-sm' : 'glasscard text-slate-900 dark:text-slate-100 rounded-tl-sm',
                    )}
                  >
                    {msg.role === 'model' ? (
                      <div className="markdown-body prose dark:prose-invert prose-primary max-w-none text-sm leading-relaxed">
                        {renderMessage(msg.content)}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                    )}
                    {msg.role === 'model' && msg.creditsUsed > 0 && (
                      <div className="flex justify-end mt-2">
                        <span className="text-[9px] font-semibold text-slate-400/85 dark:text-slate-500/80 tracking-wide">
                          Custo: {msg.creditsUsed.toLocaleString('pt-BR')} créditos
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-xl glasscard flex items-center justify-center text-primary shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <div className="glasscard rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-1.5 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      <span className="text-xs text-slate-400">Levy está pensando…</span>
                    </div>
                    {queueWarning && (
                      <p className="text-[11px] text-amber-500 leading-snug">
                        Demorando mais que o esperado — aguarde, já está sendo processado.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/10 backdrop-blur-xl bg-white/60 dark:bg-white/[0.03]">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResizeTextarea(); }}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Levy…"
              disabled={initializing || !chatId}
              className="flex-1 min-w-0 max-h-48 min-h-[52px] bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl px-5 py-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-slate-900 dark:text-slate-100 text-sm leading-relaxed disabled:opacity-50"
              rows={1}
            />
            <button
              type="button"
              onClick={() => setAgenticMode(v => !v)}
              title={agenticMode ? 'Modo Agêntico ativo — consome mais créditos' : 'Ativar Modo Agêntico (criar projetos, consultar cotas)'}
              className={cn(
                'shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                agenticMode
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5',
              )}
            >
              {agenticMode ? <Zap size={16} fill="currentColor" /> : <ZapOff size={16} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading || initializing || !chatId}
              style={!(!input.trim() || loading || initializing || !chatId) ? { backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' } : undefined}
              className={cn(
                'shrink-0 w-11 h-11 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed',
                (!input.trim() || loading || initializing || !chatId) && 'bg-primary',
              )}
            >
              <Send size={18} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
