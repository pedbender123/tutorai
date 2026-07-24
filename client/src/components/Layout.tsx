import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import LevyMiniChat from './LevyMiniChat';
import { useAuth } from '../contexts/AuthContext';
import { useT } from '../contexts/LanguageContext';
import { api, AppNotification } from '../lib/api';
import {
  Settings, LogOut, Menu, X, GraduationCap, BookOpen,
  ChevronLeft, ChevronRight, FlaskConical,
  Home, ChevronDown, Monitor, Users2, Sparkles, MessageSquare,
  Bell, BellRing, Check, Calendar, AlertCircle, Info, School, Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';

type SectionId = 'home' | 'lab' | 'class' | 'institution';

export default function Layout() {
  const { user, logout, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams<{ chatId: string }>();
  const t = useT('layout');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(['home']));

  const canSeeInstitution = !!userData?.isAdmin || !!userData?.isInstitutionAdmin;

  // States de Notificações
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [alertNotifs, setAlertNotifs] = useState<AppNotification[]>([]); // Notificações pendentes de pop-up invasivo

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar o dropdown de notificações se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar notificações na inicialização
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, location.pathname]);

  const fetchNotifications = async () => {
    try {
      const list = await api.notifications.getAll();
      setNotifications(list);

      // Filtra as que o usuário ainda não viu no pop-up invasivo
      const unseen = list.filter(n => n.seen === 0);
      if (unseen.length > 0) {
        setAlertNotifs(unseen);
      }
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  };

  // Marca notificação como visualizada no pop-up invasivo
  const handleDismissAlert = async () => {
    try {
      for (const n of alertNotifs) {
        await api.notifications.markAsSeen(n.id);
      }
      setAlertNotifs([]);
      // Atualiza lista local de notificações
      fetchNotifications();
    } catch (err) {
      console.error('Erro ao marcar alertas como vistos:', err);
    }
  };

  // Descartar notificação individualmente da lista flutuante (arquivar/limpar)
  const handleDismissSingleNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.dismiss(id);
      // Remove do estado local
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Erro ao descartar notificação:', err);
    }
  };

  // Auto-open section based on current route
  useEffect(() => {
    if (location.pathname.startsWith('/lab')) {
      setOpenSections(prev => new Set([...prev, 'lab']));
    } else if (location.pathname.startsWith('/class')) {
      setOpenSections(prev => new Set([...prev, 'class']));
    } else if (location.pathname.startsWith('/institution')) {
      setOpenSections(prev => new Set([...prev, 'institution']));
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

  const auroraGradient = 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))';

  const SubLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <Link
      to={to}
      onClick={() => setSidebarOpen(false)}
      style={isActive(to) ? { backgroundImage: auroraGradient } : undefined}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ml-2',
        isActive(to)
          ? 'text-white shadow-md shadow-primary/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5',
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
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all font-mono',
          isCollapsed ? 'md:justify-center' : 'justify-between',
          'text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5',
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

  // Notificações não descartadas (dismissed = 0)
  const activeNotifications = notifications.filter(n => n.dismissed === 0);

  return (
    <div className="flex h-screen aurora-bg overflow-hidden font-sans text-slate-900 dark:text-slate-50 relative">
      <div className="aurora-orb" style={{ width: 560, height: 560, top: '-12%', right: '-8%' }} />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed md:static inset-y-0 left-0 z-50 glass-panel md:rounded-none md:border-y-0 md:border-l-0 flex flex-col transition-all duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
        isCollapsed ? 'md:w-20' : 'md:w-[230px]',
      )}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 h-[62px] shrink-0">
          <Link to="/" className={cn('flex items-center gap-3 text-primary font-bold text-xl tracking-wider', isCollapsed && 'md:hidden')}>
            <div className="bg-primary text-primary-foreground p-1.5 rounded-xl shrink-0">
              <FlaskConical size={20} />
            </div>
            <span className="font-display tracking-tight font-black scaffl-logo-text">SCAFFL</span>
          </Link>
          <div className={cn('flex items-center gap-2', isCollapsed && 'md:w-full md:justify-center')}>
            <button className="hidden md:flex text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
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
          {!isCollapsed && <SectionHeader id="home" icon={Home} label={t('navHome')} />}
          {openSections.has('home') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/levy" icon={MessageSquare} label={t('navChat')} />
              {!!userData?.isAdmin && (
                <>
                  <SubLink to="/mural" icon={Users2} label={t('navProfessors')} />
                  <SubLink to="/disciplinas" icon={BookOpen} label={t('navDisciplinas')} />
                  <SubLink to="/activities-admin" icon={Calendar} label={t('navActivitiesAdmin')} />
                  <SubLink to="/classrooms-admin" icon={School} label={t('navClassroomsAdmin')} />
                  <SubLink to="/ia-usage-admin" icon={Sparkles} label={t('navAiUsage')} />
                </>
              )}
            </div>
          )}

          {/* ── LAB ── */}
          {!isCollapsed && <SectionHeader id="lab" icon={FlaskConical} label={t('navLab')} />}
          {openSections.has('lab') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/lab" icon={Monitor} label={t('navSimulators')} />
            </div>
          )}

          {/* ── CLASS ── */}
          {!isCollapsed && <SectionHeader id="class" icon={GraduationCap} label={t('navClass')} />}
          {openSections.has('class') && !isCollapsed && (
            <div className="space-y-1 mb-1">
              <SubLink to="/class" icon={GraduationCap} label={t('navMural')} />
            </div>
          )}

          {/* ── INSTITUCIONAL ── */}
          {canSeeInstitution && (
            <>
              {!isCollapsed && <SectionHeader id="institution" icon={Building2} label={t('navInstitution')} />}
              {openSections.has('institution') && !isCollapsed && (
                <div className="space-y-1 mb-1">
                  <SubLink to="/institution" icon={Building2} label={t('navInstitutionMine')} />
                </div>
              )}
            </>
          )}

          {/* Collapsed: direct icon nav */}
          {isCollapsed && (
            <div className="hidden md:flex flex-col items-center gap-2 mt-2">
              <Link to="/levy" className={cn('p-2 rounded-xl transition-all', isActive('/levy') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-white/10')} title={t('navChat')}>
                <MessageSquare size={18} />
              </Link>
              <Link to="/lab" className={cn('p-2 rounded-xl transition-all', isActive('/lab') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-white/10')} title={t('navSimulators')}>
                <Monitor size={18} />
              </Link>
              <Link to="/class" className={cn('p-2 rounded-xl transition-all', isActive('/class') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-white/10')} title={t('navMural')}>
                <GraduationCap size={18} />
              </Link>
              {canSeeInstitution && (
                <Link to="/institution" className={cn('p-2 rounded-xl transition-all', isActive('/institution') ? 'bg-primary text-primary-foreground' : 'text-slate-400 hover:bg-white/10')} title={t('navInstitution')}>
                  <Building2 size={18} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 space-y-2 shrink-0">
          <button
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all text-sm cursor-pointer',
              location.pathname === '/settings'
                ? 'bg-white/10 text-slate-900 dark:text-slate-100'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5',
              isCollapsed && 'md:justify-center',
            )}
            title={isCollapsed ? t('settings') : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!isCollapsed && <span>{t('settings')}</span>}
          </button>

          <div className={cn('flex items-center gap-3 p-3 glasscard mt-2', isCollapsed && 'md:justify-center md:px-0')}>
            <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
              {userData?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">{userData?.name || 'Usuário'}</p>
                  <p className="text-[11px] text-slate-500 truncate font-mono">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/10 shrink-0 cursor-pointer" title={t('logout')}>
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
          {isCollapsed && (
            <button onClick={handleLogout} className="w-full hidden md:flex items-center justify-center p-2 mt-1 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-white/10 cursor-pointer" title={t('logout')}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-[1]">
        {/* Global Unified Header */}
        <header className="h-[62px] shrink-0 border-b border-white/10 flex items-center justify-between px-6 backdrop-blur-xl bg-white/60 dark:bg-[#080c18]/80 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-500 p-1 md:hidden cursor-pointer">
              <Menu size={22} />
            </button>
            <span className="font-display tracking-tight font-black text-slate-800 dark:text-white text-lg">
              {location.pathname === '/class' ? t('titleClass') :
               location.pathname === '/levy' ? t('titleChat') :
               location.pathname.startsWith('/lab') ? t('titleLab') :
               location.pathname === '/settings' ? t('titleSettings') :
               location.pathname === '/mural' ? t('titleMural') :
               location.pathname === '/disciplinas' ? t('titleDisciplinas') :
               location.pathname.startsWith('/institution') ? t('titleInstitution') :
               location.pathname === '/activities-admin' ? t('titleActivities') : 'SCAFFL'}
            </span>
          </div>

          {/* Notifications area */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className={cn(
                "relative w-10 h-10 rounded-xl glasscard flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer",
                activeNotifications.length > 0 && "text-primary dark:text-primary-light"
              )}
            >
              {activeNotifications.length > 0 ? (
                <>
                  <BellRing size={18} className="animate-wiggle" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border border-white dark:border-slate-900 text-[10px] font-black text-white flex items-center justify-center shadow-md animate-pulse">
                    {activeNotifications.length}
                  </span>
                </>
              ) : (
                <Bell size={18} />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 glass-panel shadow-2xl overflow-hidden z-50 animate-slideUp">
                <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider font-mono">
                    {t('notifications')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {activeNotifications.length} {t('notificationsActive')}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-white/10">
                  {activeNotifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-slate-550">
                      <Bell size={24} className="mx-auto mb-2 opacity-35" />
                      <p className="text-xs font-semibold">{t('notificationsEmpty')}</p>
                    </div>
                  ) : (
                    activeNotifications.map(n => (
                      <div
                        key={n.id}
                        className="p-4 flex gap-3 hover:bg-white/5 transition-colors group relative"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                          <Calendar size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-450 leading-relaxed mt-0.5 break-words">
                            {n.content}
                          </p>
                          <span className="text-[9px] text-slate-400 dark:text-slate-600 block mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleDismissSingleNotification(n.id, e)}
                          className="absolute right-2 top-2 w-6 h-6 rounded-md bg-white/10 hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Limpar Notificação"
                        >
                          <Check size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-white/10 bg-white/5 text-center">
                  <Link
                    to="/class"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[10px] font-bold text-primary hover:underline block py-1"
                  >
                    {t('notificationsSeeAll')}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </main>

      {/* Levy Mega-Agent — mini chat flutuante (hidden on /chat routes) */}
      <LevyMiniChat />

      {/* Modal de Alerta Invasivo / Primeiras Notificações */}
      {alertNotifs.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md glass-panel shadow-2xl overflow-hidden p-6 text-center animate-slideUp">

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-4 animate-bounce">
              <AlertCircle size={28} />
            </div>

            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              {t('newActivitiesTitle')}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed mb-6">
              {t('newActivitiesBody', {
                count: String(alertNotifs.length),
                activityWord: alertNotifs.length === 1 ? t('activityWordSingular') : t('activityWordPlural'),
              })}
            </p>

            {/* Listagem rápida no modal */}
            <div className="space-y-3 mb-6 max-h-40 overflow-y-auto p-2 bg-white/5 rounded-2xl border border-white/10">
              {alertNotifs.map(n => (
                <div key={n.id} className="p-3 text-left glasscard flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Calendar size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{n.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleDismissAlert}
              style={{ backgroundImage: auroraGradient }}
              className="w-full py-3 text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              {t('acknowledge')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
