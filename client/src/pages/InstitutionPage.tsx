import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api, Classroom } from '../lib/api';
import {
  Building2, School, Users2, Plus, Copy, Check, Shield, GraduationCap, QrCode, X,
} from 'lucide-react';

interface MyInstitution {
  id: string;
  name: string;
  domain: string;
  role: 'member' | 'admin';
}

interface ClassUser {
  id: string;
  name: string;
  email: string;
  role: string;
  classRole?: 'student' | 'teacher';
}

export default function InstitutionPage() {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [institutions, setInstitutions] = useState<MyInstitution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [usersInClass, setUsersInClass] = useState<ClassUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [creatingClass, setCreatingClass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setLoading(true);
      const mine = await api.institutions.mine();
      setInstitutions(mine);
      if (mine.length > 0) {
        setSelectedInstId(mine[0].id);
        await loadClassrooms(mine[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar instituições:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassrooms = async (instId: string) => {
    try {
      const classes = await api.admin.classrooms.getByInstitution(instId);
      setClassrooms(classes);
      if (classes.length > 0) {
        setSelectedClassroomId(classes[0].id);
        await loadClassUsers(classes[0].id);
      } else {
        setSelectedClassroomId('');
        setUsersInClass([]);
      }
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
    }
  };

  const loadClassUsers = async (classId: string) => {
    try {
      setLoadingUsers(true);
      const res = await api.admin.classrooms.getUsers(classId);
      setUsersInClass(res.usersInClass);
    } catch (err) {
      console.error('Erro ao carregar usuários da sala:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInstChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const instId = e.target.value;
    setSelectedInstId(instId);
    await loadClassrooms(instId);
  };

  const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClassroomId(classId);
    if (classId) await loadClassUsers(classId);
    else setUsersInClass([]);
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId || !newClassName.trim()) return;
    try {
      setCreatingClass(true);
      await api.admin.classrooms.create(selectedInstId, newClassName.trim());
      setNewClassName('');
      await loadClassrooms(selectedInstId);
    } catch (err) {
      console.error('Erro ao criar sala:', err);
      alert('Erro ao criar sala de aula.');
    } finally {
      setCreatingClass(false);
    }
  };

  const inviteUrl = `${window.location.origin}/login?invite=${selectedClassroomId}`;
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const canManage = !!userData?.isAdmin || !!userData?.isInstitutionAdmin;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!canManage || institutions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center max-w-sm glasscard p-8">
          <Shield className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-lg font-black font-display text-slate-800 dark:text-white mb-2">Acesso Restrito</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Esta área é reservada a administradores de instituição, para gerenciar salas e matrículas.
          </p>
        </div>
      </div>
    );
  }

  const teacherCount = usersInClass.filter(u => u.classRole === 'teacher').length;
  const studentCount = usersInClass.filter(u => u.classRole !== 'teacher').length;

  return (
    <div className="min-h-full p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-800 dark:text-white flex items-center gap-2.5">
            <Building2 className="text-primary" />
            Institucional
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão interna da sua instituição — salas, matrículas e convites, sem depender do admin global.
          </p>
        </div>

        {institutions.length > 1 && (
          <select
            value={selectedInstId}
            onChange={handleInstChange}
            className="text-sm glasscard px-4 py-2.5 focus:outline-none text-slate-800 dark:text-slate-100 font-medium"
          >
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glasscard p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <School size={20} />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-white leading-none">{classrooms.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Salas de aula</p>
          </div>
        </div>
        <div className="glasscard p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-white leading-none">{studentCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Estudantes (sala atual)</p>
          </div>
        </div>
        <div className="glasscard p-5 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users2 size={20} />
          </div>
          <div>
            <p className="text-2xl font-black font-mono text-slate-800 dark:text-white leading-none">{teacherCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Professores (sala atual)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seletor de sala + criação */}
        <div className="lg:col-span-2 glasscard p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wide">Sala de aula</label>
            <select
              value={selectedClassroomId}
              onChange={handleClassChange}
              disabled={classrooms.length === 0}
              className="w-full text-sm bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 disabled:opacity-50"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              {classrooms.length === 0 && <option value="">Nenhuma sala cadastrada</option>}
            </select>
          </div>
          <form onSubmit={handleCreateClassroom} className="w-full md:w-1/2 space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wide">Nova sala</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Turma 2026/1"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                className="flex-1 text-sm bg-white/50 dark:bg-white/5 border border-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                required
              />
              <button
                type="submit"
                disabled={creatingClass || !newClassName.trim()}
                style={{ backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' }}
                className="px-4 text-white font-bold rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <Plus size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* Link de convite */}
        <div className="glasscard p-6 flex flex-col justify-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wide flex items-center gap-1.5">
            <QrCode size={14} /> Convite de matrícula
          </label>
          {selectedClassroomId ? (
            <>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteUrl}
                  className="flex-1 min-w-0 text-xs font-mono px-3 py-2.5 bg-white/50 dark:bg-white/5 border border-white/20 rounded-xl select-all outline-none text-slate-700 dark:text-slate-300"
                />
                <button
                  onClick={handleCopyInvite}
                  className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                  title="Copiar link"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => setShowQr(true)}
                  className="p-2.5 glasscard text-slate-600 dark:text-slate-300 rounded-xl hover:opacity-90 active:scale-95 transition-all shrink-0"
                  title="Ver QR Code"
                >
                  <QrCode size={14} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Funciona tanto para quem ainda não tem conta (leva ao cadastro) quanto para quem já está logado (vincula direto à sala).
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400">Crie ou selecione uma sala para gerar o link.</p>
          )}
        </div>
      </div>

      {/* Lista de matriculados */}
      <div className="glasscard p-6 flex-1 flex flex-col min-h-[300px]">
        <h2 className="text-sm font-black font-display text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Users2 className="text-primary" size={18} />
          Matriculados nesta sala ({usersInClass.length})
        </h2>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {loadingUsers ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : usersInClass.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 select-none py-10">
              <Users2 size={32} className="opacity-30 mb-2" />
              <p className="text-sm">Nenhum usuário matriculado ainda. Compartilhe o link de convite acima.</p>
            </div>
          ) : (
            usersInClass.map(user => (
              <div
                key={user.id}
                className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {user.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      {user.name}
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        user.classRole === 'teacher'
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'bg-white/40 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-white/10'
                      }`}>
                        {user.classRole === 'teacher' ? 'Professor' : 'Estudante'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{user.email}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel p-6 max-w-xs w-full text-center space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono">QR de Convite</span>
              <button onClick={() => setShowQr(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={16} />
              </button>
            </div>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteUrl)}`}
              alt="QR Code de convite"
              className="w-48 h-48 mx-auto rounded-xl shadow-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
