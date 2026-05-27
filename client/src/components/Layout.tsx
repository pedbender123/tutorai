import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Settings, LogOut, Menu, X, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, FlaskConical,
  Home, ChevronDown, Monitor, Users2, Sparkles, MessageSquare,
} from 'lucide-react';
import { cn } from '../lib/utils';

type SectionId = 'home' | 'lab' | 'class';

export default function Layout() {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(['home']));

  // Auto-open section based on current route
  useEffect(() => {
    if (location.pathname.startsWith('/lab')) {
      setOpenSections(prev => new Set([...prev, 'lab']));
    } else if (location.pathname === '/class') {
      setOpenSections(prev => new Set([...prev, 'class']));
    } else {
      setOpenSections(prev => new Set([...prev, 'home']));
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSection = (id: SectionId) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isActive = (path: string) =>
    path === '/lab'
      ? location.pathname.startsWith('/lab')
      : location.pathname === path || location.pathname.startsWith(path + '/');

  const SubLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ml-2',
        isActive(to)
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50',
      )}
    >
      <Icon size={15} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );

  const SectionHeader = ({ id, icon: Icon, label }: { id: SectionId; icon: React.ElementType; label: string }) => {
    const open = openSections.has(id);
    return (
      <button
        onClick={() => toggleSection(id)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all',
          isCollapsed ? 'md:justify-center' : 'justify-between',
          'text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40',
        )}
        title={isCollapsed ? label : undefined}
      >
        <div className="flex items-center gap-3">
          <Icon size={17} className="shrink-0 text-primary" />
          {!isCollapsed && <span>{label}</span>}
        </div>
        {!isCollapsed && (
          <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-50">

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
        isCollapsed ? 'md:w-20' : 'md:w-64',
      )}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 h-16 shrink-0">
          <Link to="/" className={cn('flex items-center gap-3 text-primary font-bold text-xl tracking-wider', isCollapsed && 'md:hidden')}>
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shrink-0">
              <FlaskConical size={20} />
            </div>
            <span className="font-display tracking-tight font-black scaffl-logo-text">SCAFFL</span>
          </Link>
          {isCollapsed && (
            <Link to="/" className="hidden md:flex bg-primary text-primary-foreground p-1.5 rounded-xl shrink-0 mx-auto">
              <FlaskConical size={20} />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <button className="hidden md:flex text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1" onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button className="md:hidden text-slate-500 p-1" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-1">

          {/* ── HOME ── */}
          <SectionHeader id="home" icon={Home} label="Home" />
          {openSections.has('home') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/chat" icon={MessageSquare} label="Chat" />
              {!!userData?.isAdmin && (
                <>
                  <SubLink to="/mural" icon={Users2} label="Professores" />
                  <SubLink to="/disciplinas" icon={BookOpen} label="Disciplinas" />
                </>
              )}
            </div>
          )}

          {/* ── LAB ── */}
          <SectionHeader id="lab" icon={FlaskConical} label="Lab" />
          {openSections.has('lab') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/lab" icon={Monitor} label="Simuladores" />
            </div>
          )}

          {/* ── CLASS ── */}
          <SectionHeader id="class" icon={GraduationCap} label="Class" />
          {openSections.has('class') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/class" icon={Sparkles} label="Em Breve" />
            </div>
          )}

          {/* Collapsed: direct icon nav */}
          {isCollapsed && (
            <div className="hidden md:flex flex-col items-center gap-2 mt-2">
              <Link to="/chat" className={cn('p-2 rounded-xl transition-all', isActive('/chat') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-slate-800/50')} title="Chat">
                <MessageSquare size={18} />
              </Link>
              <Link to="/lab" className={cn('p-2 rounded-xl transition-all', isActive('/lab') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-slate-800/50')} title="Simuladores">
                <Monitor size={18} />
              </Link>
              <Link to="/class" className={cn('p-2 rounded-xl transition-all', isActive('/class') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-slate-800/50')} title="Class">
                <Sparkles size={18} />
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
          <button
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm',
              location.pathname === '/settings'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50',
              isCollapsed && 'md:justify-center',
            )}
            title={isCollapsed ? 'Configurações' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && <span>Configurações</span>}
          </button>

          <div className={cn('flex items-center gap-3 p-3 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl mt-2', isCollapsed && 'md:justify-center md:px-0')}>
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">{userData?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0" title="Sair">
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
          {isCollapsed && (
            <button onClick={handleLogout} className="w-full hidden md:flex items-center justify-center p-2 mt-1 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Sair">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-500 p-1">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-display tracking-tight font-black scaffl-logo-text">SCAFFL</span>
        </header>
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
