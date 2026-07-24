import React from 'react';
import { cn } from '../lib/utils';

export interface ProfessorPublic {
  id: string;
  nome: string;
  area: string;
  frase_destaque: string;
  emoji_avatar: string;
  saudacao: string;
}

interface ProfessorCardProps {
  professor: ProfessorPublic;
  isActive?: boolean;
  variant?: 'sidebar' | 'gallery';
  onClick: () => void;
}

export default function ProfessorCard({ professor, isActive, variant = 'gallery', onClick }: ProfessorCardProps) {
  if (variant === 'sidebar') {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
          isActive
            ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
            : 'text-slate-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5'
        )}
      >
        <div className={cn(
          'w-9 h-9 rounded-full flex items-center justify-center text-xl shrink-0',
          isActive ? 'bg-primary/20' : 'bg-slate-200 dark:bg-slate-700'
        )}>
          {professor.emoji_avatar}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{professor.nome.replace('Professor ', 'Prof. ')}</p>
          <p className="text-xs text-slate-500 truncate">{professor.area}</p>
        </div>
      </button>
    );
  }

  // Gallery variant
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-4 p-6 rounded-2xl border-2 text-center transition-all hover:shadow-lg',
        isActive
          ? 'border-primary bg-primary/5 shadow-md'
          : 'glasscard hover:border-primary/50'
      )}
    >
      <div className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center text-4xl transition-transform group-hover:scale-110',
        isActive ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-800'
      )}>
        {professor.emoji_avatar}
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-base">{professor.nome}</h3>
        <p className="text-xs font-medium text-primary mt-0.5">{professor.area}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          "{professor.frase_destaque}"
        </p>
      </div>
      <span
        style={isActive ? { backgroundImage: 'linear-gradient(120deg, var(--color-a1), var(--color-a2), var(--color-a3))' } : undefined}
        className={cn(
          'text-xs px-3 py-1.5 rounded-full font-medium transition-colors',
          isActive
            ? 'text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
        )}>
        {isActive ? 'Conversando' : 'Conversar'}
      </span>
    </button>
  );
}
