import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Send, Loader2, User as UserIcon, GraduationCap, Bot, BookOpen, Plus } from 'lucide-react';
import Markdown from 'react-markdown';
import { cn } from '../lib/utils';
import { api, Chat as ChatType, Message, Persona, Disciplina } from '../lib/api';
import NewChatDialog from '../components/chat/NewChatDialog';

export default function Chat() {
 const { chatId } = useParams<{ chatId: string }>();
 const navigate = useNavigate();
 const { user, userData, refreshUserData } = useAuth();

 const [chat, setChat] = useState<ChatType | null>(null);
 const [persona, setPersona] = useState<Persona | null>(null);
 const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
 const [messages, setMessages] = useState<Message[]>([]);
 const [input, setInput] = useState('');
 const [loading, setLoading] = useState(false);
 const [initializing, setInitializing] = useState(false);
 const [isNewChatOpen, setIsNewChatOpen] = useState(false);
 const provider = 'google' as const; // GPT desabilitado temporariamente

 const messagesEndRef = useRef<HTMLDivElement>(null);

 const scrollToBottom = () => {
 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 };

 // Load chat data
 useEffect(() => {
 if (!chatId || !user) {
 setChat(null);
 setMessages([]);
 return;
 }

 const loadChat = async () => {
 setInitializing(true);
 try {
 const chats = await api.get<ChatType[]>('/api/chats');
 const currentChat = chats.find(c => c.id === chatId);
 
 if (!currentChat) {
 navigate('/mural');
 return;
 }

 setChat(currentChat);

 // Fetch persona and messages in parallel
 const [msgs, prs, dcs] = await Promise.all([
 api.get<Message[]>(`/api/chats/${chatId}/messages`),
 api.get<Persona[]>('/api/personas'),
 currentChat.disciplinaId ? api.get<Disciplina[]>('/api/disciplinas') : Promise.resolve([])
 ]);

 setMessages(msgs);
 setPersona(prs.find(p => p.id === currentChat.personaDbId) || null);
 if (currentChat.disciplinaId) {
 setDisciplina(dcs.find(d => d.id === currentChat.disciplinaId) || null);
 } else {
 setDisciplina(null);
 }

 } catch (err) {
 console.error('Failed to load chat:', err);
 navigate('/mural');
 } finally {
 setInitializing(false);
 }
 };

 loadChat();
 }, [chatId, user, navigate]);

 useEffect(() => {
 scrollToBottom();
 }, [messages]);

 const handleSend = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!input.trim() || loading || !chatId || !user) return;

 const currentInput = input;
 setInput('');
 setLoading(true);

 // Optimistic user message
 const tempId = crypto.randomUUID();
 const optimisticMsg: Message = {
 id: tempId,
 chatId,
 userId: user.id,
 role: 'user',
 content: currentInput,
 createdAt: new Date().toISOString(),
 tokensUsed: 0,
 creditsUsed: 0
 };
 setMessages(prev => [...prev, optimisticMsg]);

 try {
 const { userMessage, modelMessage } = await api.post<any>(`/api/chats/${chatId}/messages`, {
 content: currentInput,
 provider
 });
 
 setMessages(prev => [
 ...prev.filter(m => m.id !== tempId),
 userMessage,
 modelMessage
 ]);
 await refreshUserData();
 } catch (error: any) {
 alert(error.message || 'Erro ao enviar mensagem.');
 setMessages(prev => prev.filter(m => m.id !== tempId));
 setInput(currentInput);
 } finally {
 setLoading(false);
 }
 };

 const onStartChat = async (personaId: string, disciplinaId?: string) => {
 try {
 const { chat } = await api.post<any>('/api/chats', { 
 professorId: personaId, 
 disciplinaId 
 });
 setIsNewChatOpen(false);
 navigate(`/chat/${chat.id}`);
 } catch (err) {
 alert('Erro ao iniciar chat');
 }
 };

 if (!chatId && !initializing) {
 return (
 <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950 font-sans">
 <div className="w-24 h-24 bg-primary text-primary-foreground rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/40 animate-bounce-slow">
 <GraduationCap size={48} />
 </div>
 <h2 className="text-3xl font-black mb-4 text-zinc-900 dark:text-white tracking-tighter">Escolha seu Tutor</h2>
 <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-6 text-lg font-medium leading-relaxed">
 Selecione um professor virtual e uma disciplina para começar a "pensar junto".
 </p>
 <button
 onClick={() => setIsNewChatOpen(true)}
 className="group flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all"
 >
 <Plus size={24} />
 Iniciar Nova Conversa
 </button>
 <NewChatDialog 
 isOpen={isNewChatOpen} 
 onClose={() => setIsNewChatOpen(false)} 
 onStartChat={onStartChat} 
 />
 </div>
);
 }

 return (
 <div className="flex flex-col h-full bg-white dark:bg-zinc-950 font-sans">
 {/* Header */}
 <div className="flex items-center gap-4 px-8 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
 <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-primary/10 flex items-center justify-center text-primary dark:text-primary shrink-0 shadow-sm">
 <Bot size={28} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 truncate tracking-tight">{persona?.nome || 'Carregando...'}</p>
 {persona?.isGenerico ? (
 <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg">Generalista</span>
) : (
 <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary text-[10px] font-black uppercase rounded-lg">Especialista</span>
)}
 </div>
 {disciplina && (
 <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-xs font-bold">
 <BookOpen size={12} />
 <span className="truncate">{disciplina.nome}</span>
 </div>
)}
 </div>
 <button
 onClick={() => setIsNewChatOpen(true)}
 className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-sm hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-95"
 >
 <Plus size={18} />
 Novo Chat
 </button>
 </div>

 {/* Messages Area */}
 <div className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar">
 {initializing ? (
 <div className="h-full flex flex-col items-center justify-center gap-4">
 <Loader2 className="animate-spin text-primary"size={32} />
 <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Sincronizando Chat...</p>
 </div>
) : (
 <div className="max-w-4xl mx-auto w-full space-y-6">
 {messages.map((msg) => (
 <MessageBubble key={msg.id} msg={msg} persona={persona} />
))}
 
 {loading && persona && (
 <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="w-10 h-10 rounded-2xl bg-primary/10 dark:bg-primary/10 flex items-center justify-center text-primary dark:text-primary shrink-0">
 <Bot size={20} />
 </div>
 <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-3xl rounded-tl-sm px-6 py-4 flex items-center gap-3">
 <div className="flex gap-1">
 <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"/>
 <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"/>
 <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"/>
 </div>
 <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{persona.nome.split(' ')[persona.nome.split(' ').length - 1]} está analisando...</span>
 </div>
 </div>
)}
 <div ref={messagesEndRef} className="h-4"/>
 </div>
)}
 </div>

 {/* Input Area */}
 <div className="px-8 py-6 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
 <div className="max-w-4xl mx-auto">
 <form onSubmit={handleSend} className="relative flex items-end gap-3">
 <div className="relative flex-1 group">
 <textarea
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSend(e);
 }
 }}
 placeholder={persona ? `Pergunte sobre ${disciplina?.nome || 'estudos'} para o ${persona.nome.split(' ')[0]}...` : 'Digite sua mensagem...'}
 disabled={initializing || !chatId}
 className="w-full max-h-48 min-h-[64px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] px-6 py-5 pr-20 resize-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary group-hover:border-zinc-300 transition-all text-zinc-900 dark:text-zinc-100 font-medium leading-relaxed"
 rows={1}
 />
 <button
 type="submit"
 disabled={!input.trim() || loading || initializing || !chatId}
 className="absolute right-2 bottom-2 w-12 h-12 bg-primary text-primary-foreground rounded-[1.5rem] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group-hover:shadow-primary/40"
 >
 <Send size={22} className="ml-0.5"/>
 </button>
 </div>
 </form>
 <div className="flex items-center justify-between px-6 mt-4">
 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
 Protocolo Socrático Ativo
 </p>
 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
 Pressione Enter para enviar
 </p>
 </div>
 </div>
 </div>

 <NewChatDialog 
 isOpen={isNewChatOpen} 
 onClose={() => setIsNewChatOpen(false)} 
 onStartChat={onStartChat} 
 />
 </div>
);
}

function MessageBubble({ msg, persona }: { msg: Message; persona: Persona | null }) {
 const isUser = msg.role === 'user';

 return (
 <div className={cn('flex gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500', isUser ? 'flex-row-reverse' : 'flex-row')}>
 {/* Avatar */}
 <div className={cn(
 'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105',
 isUser
 ? 'bg-primary text-primary-foreground'
 : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-primary dark:text-primary'
)}>
 {isUser ? <UserIcon size={20} /> : <Bot size={22} />}
 </div>

 {/* Bubble */}
 <div className={cn(
 'max-w-[85%] sm:max-w-[75%] rounded-[2rem] px-7 py-5 shadow-sm',
 isUser
 ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-primary/10'
 : 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'
)}>
 {isUser ? (
 <p className="whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">{msg.content}</p>
) : (
 <div className="space-y-3">
 <div className="markdown-body prose dark:prose-invert prose-primary max-w-none text-[15px] leading-relaxed font-medium">
 <Markdown>{msg.content}</Markdown>
 </div>
 <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
 <span className="text-[9px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
 <span className="text-[9px] font-black text-primary/50 uppercase tracking-widest">Residência Pedagógica</span>
 </div>
 </div>
)}
 </div>
 </div>
);
}
