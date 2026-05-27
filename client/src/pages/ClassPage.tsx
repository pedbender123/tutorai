import React from 'react';
import { GraduationCap, BookOpen, Video, Users, Clock, Sparkles } from 'lucide-react';

const features = [
  { icon: Video, label: 'Aulas ao Vivo', desc: 'Sessões interativas com professores em tempo real.' },
  { icon: BookOpen, label: 'Material Didático', desc: 'Apostilas, slides e exercícios organizados por disciplina.' },
  { icon: Users, label: 'Turmas Colaborativas', desc: 'Trabalhe junto com sua turma em atividades e projetos.' },
  { icon: Clock, label: 'Histórico de Aulas', desc: 'Reveja aulas gravadas no seu ritmo, quando quiser.' },
];

export default function ClassPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 select-none">
      {/* Glow decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-8 max-w-2xl w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
          <Sparkles size={12} />
          Em Desenvolvimento
        </div>

        {/* Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-xl shadow-primary/10">
            <GraduationCap size={44} className="text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary animate-ping opacity-40" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Class
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
            O ambiente de sala de aula virtual do SCAFI está chegando — projetado para tornar o aprendizado mais confortável, bonito e eficaz.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          {features.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="relative flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left overflow-hidden group"
            >
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/[0.03] transition-colors" />
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
          Fique de olho — grandes novidades estão a caminho. 🚀
        </p>
      </div>
    </div>
  );
}
