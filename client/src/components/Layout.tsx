import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, LogOut, Menu, X, GraduationCap, LayoutGrid, BookOpen, MessageSquare, Plus, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import { cn } from '../lib/utils';
import UpdateNotification from './UpdateNotification';
import { api, Chat } from '../lib/api';

export default function Layout() {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);

  useEffect(() => {
    if (user) {
      api.get<Chat[]>('/api/chats')
        .then(data => setChats(data))
        .catch(err => console.error('Failed to fetch chats:', err));
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Lab', icon: FlaskConical, path: '/lab', adminOnly: false },
    { label: 'Mural de Personas', icon: LayoutGrid, path: '/mural', adminOnly: true },
    { label: 'Disciplinas', icon: BookOpen, path: '/disciplinas', adminOnly: true },
  ].filter(item => !item.adminOnly || userData?.isAdmin);

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 overflow-hidden font-sans text-zinc-900 dark:text-zinc-50">
      <UpdateNotification />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
        isCollapsed ? 'md:w-20' : 'md:w-64'
      )}>
        {/* Logo and Collapse Toggle */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 h-16 shrink-0">
          <Link to="/" className={cn("flex items-center gap-3 text-primary font-bold text-xl tracking-tight", isCollapsed && "md:hidden")}>
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shrink-0">
              <GraduationCap size={20} />
            </div>
            <span className="truncate">TutorAI</span>
          </Link>
          
          {/* Icon only on collapsed state */}
          {isCollapsed && (
            <Link to="/" className="hidden md:flex bg-primary text-primary-foreground p-1.5 rounded-xl shrink-0 mx-auto">
              <GraduationCap size={20} />
            </Link>
          )}

          <div className="flex items-center gap-2">
            <button className="hidden md:flex text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button className="md:hidden text-zinc-500 p-1" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 shrink-0">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm',
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50',
                isCollapsed && "md:justify-center"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Chats Section */}
        <div className="flex-1 flex flex-col min-h-0 px-3 mt-4">
          <div className={cn("flex items-center px-1 mb-2 shrink-0", isCollapsed ? "md:justify-center" : "justify-between")}>
            {!isCollapsed && <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">Meus Chats</h3>}
            <button 
              onClick={() => navigate('/chat')}
              className={cn("p-1.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all shadow-sm shrink-0", isCollapsed && "md:mx-auto")}
              title="Novo Chat"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1 pb-4 custom-scrollbar">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/chat/${chat.id}`}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group',
                  chatId === chat.id
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold'
                    : 'text-zinc-500 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/30',
                  isCollapsed && "md:justify-center"
                )}
                title={isCollapsed ? chat.title : undefined}
              >
                <MessageSquare size={16} className={cn("shrink-0", chatId === chat.id ? "text-primary" : "text-zinc-400 group-hover:text-zinc-500")} />
                {!isCollapsed && <span className="truncate flex-1">{chat.title}</span>}
              </Link>
            ))}

            {chats.length === 0 && !isCollapsed && (
              <div className="px-3 py-6 text-center bg-zinc-100/50 dark:bg-zinc-800/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">Nenhum chat ativo.<br/>Inicie uma conversa no Mural.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
          <button
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm',
              location.pathname === '/settings'
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
              isCollapsed && "md:justify-center"
            )}
            title={isCollapsed ? 'Configurações' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          <div className={cn("flex items-center gap-3 p-3 bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-2", isCollapsed && "md:justify-center md:px-0")}>
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100 truncate">{userData?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
          {isCollapsed && (
             <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 mt-1 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hidden md:flex"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-14 shrink-0 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-zinc-500 p-1">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-semibold text-primary">TutorAI</span>
        </header>
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
