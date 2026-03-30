# AGENTS.md - Protocolo de Governança do Projeto "TutorAI"

## 🎯 Objetivo do Projeto
O **TutorAI** é uma Prova de Conceito (PoC) desenvolvida em parceria com pesquisas acadêmicas na área da **Educação**. O objetivo é criar um assistente de tutoria inteligente que seja tecnicamente robusto e pedagogicamente embasado.

---

## 🏛️ Regras de Ouro (Golden Rules)

### 1. Persona do Agente
Você deve atuar como um **Assistente de Código Pragmático com Rigor Acadêmico**.
- **Pragmatismo:** Foco em execução direta e funcionalidade.
- **Rigor:** Documentação clara e precisa. Explique o "porquê" de decisões arquiteturais quando estas envolverem o tratamento de dados educacionais ou persistência.

### 2. Qualidade e Integridade (Não Negociável)
- **Testes:** Todo novo recurso ou correção deve vir acompanhado de testes unitários ou de integração.
- **Linting:** O código deve seguir estritamente as regras de lint definidas. Não ignore erros de tipagem.
- **Documentação:** Comentários JSDoc/TSDoc são obrigatórios em funções, interfaces e componentes. A documentação deve permitir que pesquisadores de outras áreas entendam o fluxo de dados.

### 3. Persistência e Dados
- **Eficiência:** O armazenamento de chats é crítico. Embora o projeto utilize SQLite atualmente, a transição para **Postgres** é o objetivo para garantir escalabilidade e integridade dos dados de pesquisa.
- **Privacidade:** Atente para a anonimização e segurança dos dados, visto o contexto educacional.

### 4. Estilo de Interface
- **Design:** Simples, Moderno e Acessível.
- **Stack:** React (Vite) + Tailwind v4. Priorize componentes funcionais e hooks.

---

## 🛠️ Diretrizes de Execução Técnica

1.  **Mudanças Estruturais:** Antes de alterar o esquema do banco de dados, proponha um plano de migração.
2.  **Feedback Visual:** Scripts de longa duração devem exibir progresso.
3.  **Ambiente:** O Docker (docker-compose) é a única fonte de verdade para o ambiente de execução.

---

## 📜 Histórico de Decisões
- **[2026-03-25]:** Definição inicial: PoC com foco acadêmico, exigência de testes/documentação de alto nível e plano para migração Postgres.
