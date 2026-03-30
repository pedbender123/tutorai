import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, LabProject, LabMessage } from '../lib/api';
import { Send, Loader2, User as UserIcon, Bot, FlaskConical, ArrowLeft, Pencil, Check, X, RefreshCw, PanelLeftClose, PanelLeftOpen, Maximize2, Minimize2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';

export default function LabEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<LabProject | null>(null);
  const [messages, setMessages] = useState<LabMessage[]>([]);
  const [htmlContent, setHtmlContent] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [chatHidden, setChatHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!projectId) return;
    api.lab.getProject(projectId)
      .then(data => {
        const { messages: msgs, ...proj } = data;
        setProject(proj);
        setMessages(msgs);
        setHtmlContent(proj.htmlContent || '');
        setTitleInput(proj.title);
      })
      .catch(() => navigate('/lab'))
      .finally(() => setInitializing(false));
  }, [projectId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !projectId || !user) return;

    const currentInput = input;
    setInput('');
    setLoading(true);

    const tempId = crypto.randomUUID();
    const optimisticMsg: LabMessage = {
      id: tempId,
      projectId: projectId!,
      userId: user.id,
      role: 'user',
      content: currentInput,
      tokensUsed: 0,
      creditsUsed: 0,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { userMessage, assistantMessage, htmlContent: newHtml } = await api.lab.sendMessage(projectId!, currentInput);
      setMessages(prev => [...prev.filter(m => m.id !== tempId), userMessage, assistantMessage]);
      if (newHtml !== htmlContent) {
        setHtmlContent(newHtml);
        setPreviewKey(k => k + 1);
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao enviar mensagem.');
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(currentInput);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleInput.trim() || !projectId) return;
    try {
      await api.lab.renameProject(projectId, titleInput.trim());
      setProject(prev => prev ? { ...prev, title: titleInput.trim() } : prev);
      setEditingTitle(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao renomear projeto.');
    }
  };

  const handleCancelTitle = () => {
    setTitleInput(project?.title || '');
    setEditingTitle(false);
  };

  const isOwner = project?.userId === user?.id;

  const handleFullscreen = () => {
    if (!fullscreen) {
      previewRef.current?.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (initializing) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950 font-sans overflow-hidden">
      {/* ====== LEFT: Chat ====== */}
      <div className={cn(
        'shrink-0 flex flex-col border-r border-zinc-100 dark:border-zinc-800 transition-all duration-300 overflow-hidden',
        chatHidden ? 'w-0 border-r-0' : 'w-[420px]'
      )}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0">
          <button
            onClick={() => navigate('/lab')}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FlaskConical size={18} />
          </div>

          <div className="flex-1 min-w-0">
            {editingTitle && isOwner ? (
              <div className="flex items-center gap-1">
                <input
                  ref={titleInputRef}
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelTitle();
                  }}
                  className="flex-1 text-sm font-black bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={handleSaveTitle} className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={handleCancelTitle} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title">
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate">{project?.title || 'Projeto'}</p>
                {isOwner && (
                  <button
                    onClick={() => setEditingTitle(true)}
                    className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-300 hover:text-zinc-500 transition-all rounded"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>
            )}
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Lab Agent</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FlaskConical size={32} />
              </div>
              <div>
                <p className="font-black text-zinc-700 dark:text-zinc-300">Descreva sua simulação</p>
                <p className="text-sm text-zinc-400 mt-1">Ex: "Crie um simulador de lançamento de projétil onde posso ajustar o ângulo e a velocidade inicial"</p>
              </div>
            </div>
          )}

          {messages.map(msg => (
            <LabMessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                </div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Gerando simulação...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-end gap-2">
            <div className="relative flex-1 group">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
                placeholder={isOwner ? 'Descreva o que quer criar ou modificar...' : 'Apenas o criador pode editar este projeto.'}
                disabled={loading || !isOwner}
                className="w-full max-h-40 min-h-[52px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 pr-14 resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-zinc-900 dark:text-zinc-100 font-medium text-sm leading-relaxed disabled:opacity-50"
                rows={1}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || !isOwner}
                className="absolute right-2 bottom-2 w-9 h-9 bg-primary text-primary-foreground rounded-[1rem] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          </form>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 px-1">
            Lab Agent · Gemini 2.5 Flash
          </p>
        </div>
      </div>

      {/* ====== RIGHT: Preview ====== */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-100 dark:bg-zinc-900">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setChatHidden(h => !h)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title={chatHidden ? 'Mostrar chat' : 'Esconder chat'}
            >
              {chatHidden ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              {chatHidden ? 'Chat' : 'Esconder'}
            </button>
            <p className="text-xs font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Preview</p>
          </div>
          <div className="flex items-center gap-1">
            {htmlContent && (
              <button
                onClick={() => setPreviewKey(k => k + 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                <RefreshCw size={12} />
                Reiniciar
              </button>
            )}
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-widest rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {fullscreen ? 'Sair' : 'Tela Cheia'}
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div ref={previewRef} className="flex-1 relative overflow-hidden">
          {htmlContent ? (
            <iframe
              key={previewKey}
              srcDoc={htmlContent}
              sandbox="allow-scripts allow-forms"
              className="w-full h-full border-0"
              title="Preview da simulação"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-5 text-center px-8">
              <div className="w-20 h-20 rounded-3xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <FlaskConical size={40} />
              </div>
              <div>
                <p className="text-lg font-black text-zinc-500 dark:text-zinc-400">Nenhuma simulação ainda</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2 max-w-sm">
                  Descreva o que você quer criar no chat ao lado e o Lab Agent irá gerar a simulação aqui.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LabMessageBubble({ msg }: { msg: LabMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-primary'
      )}>
        {isUser ? <UserIcon size={15} /> : <Bot size={16} />}
      </div>
      <div className={cn(
        'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap font-medium leading-relaxed">{msg.content}</p>
        ) : (
          <div className="markdown-body prose dark:prose-invert prose-primary max-w-none text-[14px] leading-relaxed font-medium">
            <Markdown>{msg.content}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
