// Bus de eventos simples pra sincronizar páginas que já estão montadas em
// segundo plano (ex: o Lab mural aberto atrás do mini-chat flutuante do Levy)
// sem precisar de um state manager global.
export const LAB_PROJECTS_CHANGED = 'levy:lab-projects-changed';

export function notifyLabProjectsChanged() {
  window.dispatchEvent(new CustomEvent(LAB_PROJECTS_CHANGED));
}
