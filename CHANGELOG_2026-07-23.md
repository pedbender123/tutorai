# Scaffl — Mudanças de 23/07/2026

Documento-guia do que foi feito hoje na plataforma cloud e por quê. Serve como referência para continuar o trabalho e para decisões futuras de produto.

---

## 1. Abertura pública da plataforma (reforma de acesso)

Antes só era possível se cadastrar com um código de convite obrigatório. Hoje isso mudou pra permitir lançar oficialmente pra UCS e CETEC:

- **Cadastro individual sem convite** — convite virou opcional; se informado, ainda é validado.
- **Link de convite com dois modos**: quem não tem conta vai pro cadastro já vinculado à sala; quem já está logado vê uma tela pra vincular a conta atual à sala (`POST /api/institutions/join`).
- **Admin por instituição** (novo papel, distinto do admin global): delega a gestão interna (salas, disciplinas, personas, atividades, membros) sem exigir acesso total à plataforma. Criar/excluir a instituição em si continua exclusivo do admin global.
- **Papel "teacher" ativado de verdade**: antes existia no schema mas não tinha poder nenhum; agora um professor pode criar/gerenciar atividades da própria sala.
- **Segurança do cadastro aberto**: rate limit por IP no registro (5/hora) + estrutura de verificação de e-mail pronta (endpoints, tokens, templates) — hoje em modo no-op porque ainda não configuramos um provedor de e-mail real no servidor.
- **Lógica de tier unificada**: existiam duas implementações divergentes (`quota.ts` e `ai.ts`) decidindo se um usuário é free/pro/institucional. Agora há uma única fonte de verdade.
- Upgrade de plano self-service ficou **fora de escopo** por decisão explícita — não implementado.

**Nova página "Institucional"** (`/institution`, no menu lateral, não em Configurações): admins de instituição veem estatísticas, gerenciam salas e geram links de convite, sem precisar do admin global.

---

## 2. Sistema de créditos (cota de IA)

Voltamos a um modelo de **crédito único compartilhado** entre Lab + Levy + chat (como o plano da Anthropic) em vez de limites separados por ferramenta:

- Teto **semanal** (500k créditos, free) é só um freio anti-explosão — não é o limite real.
- Teto **mensal** (2M, free) é o limite de verdade.
- Corrigido um bug real: os *tokens de "pensamento"* (thinking/reasoning) do Gemini não estavam sendo contados nos créditos — a Google cobra por eles como se fossem output, então o sistema estava subestimando o custo real.

**Fallback de chave gratuita**: antes de usar a chave paga, o sistema tenta a chave free-tier do Google AI Studio pros modelos mais baratos (`gemini-3.1-flash-lite` no Levy, `gemini-3.5-flash-lite` no Lab), respeitando os limites reais (15 RPM / 500 RPD / 250k TPM por modelo). Testado ponta a ponta com chamadas reais — funcionando, com `$0` de custo registrado quando usa a chave free.

---

## 3. Reforma visual "Aurora" (diferenciação cloud vs self-hosted)

A versão **self-hosted continua com o visual antigo**. A versão **cloud** ganhou uma identidade nova, inspirada na landing page:

- Tipografia: Space Grotesk (display) + JetBrains Mono (dados/números) + Inter (corpo).
- Sistema de cor: gradiente de 3 tons (`--color-a1/a2/a3`) por tema (teal/lilac/blue/neutral), com migração automática das cores antigas salvas no banco.
- Vidro fosco (glassmorphism), fundo com textura de pontos + linhas diagonais sutis, orbs de brilho.
- Reskin aplicado em **toda a plataforma**: menu lateral, cabeçalhos, Chat, Lab (mural + editor), Sala de Aula, Configurações, Login, todas as páginas administrativas e componentes menores.
- Removidos elementos que faziam sentido só na landing (as "marcas de registro" nos cantos) e o banner de desculpas antigo (não era mais necessário).

## 4. Idioma real (i18n)

A plataforma não tinha nenhum sistema de tradução real (só a landing page traduzia). Agora:

- Idioma configurável em Configurações (PT/EN/ES), afetando **interface inteira e a língua de resposta dos agentes de IA**.
- Traduções de EN/ES são **geradas pela própria API do Gemini** (tier free), não escritas à mão — script `npm run i18n:gen`, roda manualmente quando um texto novo é adicionado.
- Já convertido: menu lateral, cabeçalhos, notificações, aba de Aparência das Configurações.
- **Pendente**: extrair o texto fixo das páginas restantes (Chat, Lab, Sala de Aula, Configurações completo, telas de admin) pros arquivos de tradução — a estrutura já existe e funciona, falta aplicar em cada tela.

---

## 5. De "Petrus" pra "Levy"

Trocamos a identidade do assistente de IA da plataforma. Não foi só cosmético — a missão mudou de "responder perguntas" pra **ensinar a pensar**, inspirada explicitamente em Lev Vygotsky (zona de desenvolvimento proximal, scaffolding):

> "Mais do que um assistente que responde perguntas, ele é um guia pedagógico desenhado para ensinar você a pensar. Inspirado na teoria do suporte gradual (scaffolding), o Levy identifica exatamente onde você está travado e constrói a ponte até a compreensão."

- Renomeado em todo o código: arquivos, endpoints (`/api/levy/support`), rotas (`/levy`), textos de interface, prompt do agente, landing page (PT/EN/ES).
- Links antigos (`/chat`, `/petrus`) continuam funcionando via redirecionamento — nada quebra pra quem tinha salvo o link antigo.
- **O antigo sistema de chat com múltiplos "professores" (personas) foi aposentado** — não fazia mais sentido ter duas telas de chat quando só existia o Levy nele. O Chat agora **é** o Levy, direto.

## 6. Chat do Levy: de mini-widget pra experiência completa

- Nova página cheia (`/levy`), responsiva, no lugar do antigo Chat — reaproveitando o mesmo padrão visual das outras telas.
- **Conversas com o Levy agora ficam salvas e são retomáveis** — antes eram perdidas ao recarregar a página. Existe um seletor no topo (igual o antigo Chat) pra ver e voltar a conversas antigas, e a mais recente é retomada automaticamente ao entrar em `/levy`.
- **Título automático por IA**: depois da primeira mensagem, um modelo barato gera um título curto pra conversa (em vez de nome genérico), pra ficar fácil identificar na lista.
- O mini-chat flutuante continua existindo em todas as outras páginas pra acesso rápido, mas some sozinho quando você já está na página cheia do Levy.
- Corrigido: pedir pro Levy criar um projeto no Lab enquanto o Lab já estava aberto em outra aba/mini-chat exigia recarregar a página pra aparecer — agora atualiza sozinho.

## 7. Privacidade: dados pessoais nunca vão pra API externa

Mudança de arquitetura pedida explicitamente: **o nome do usuário (e o nome da instituição) nunca são enviados como texto para a API do Gemini**.

- O modelo recebe uma instrução pra usar um token literal tipo `<nome>` no texto quando quiser se dirigir ao usuário — ele nunca vê o valor real.
- A substituição do token pelo nome de verdade acontece **só no navegador**, na hora de mostrar a mensagem — usando um dado que o cliente já tinha localmente.
- Isso vale também pro histórico da conversa: como o que fica salvo/reenviado como contexto continua com o token (não substituído), o nome real nunca "vaza" de volta pro modelo em mensagens futuras, mesmo em conversas longas.
- Padrão pensado pra ser reaproveitado com outros dados sensíveis no futuro, não só nome/instituição.

---

## Bugs corrigidos ao longo do dia (avulsos)

- Um bug sério e prévio ao trabalho de hoje: qualquer boot do servidor disparava a suíte inteira de testes de segurança e depois **matava o próprio processo** (import sem guarda de execução direta). Corrigido — o servidor agora sobe normalmente.
- Scrollbar nativa (feia, cinza) aparecendo em várias telas porque a classe `.custom-scrollbar`, usada em uns 15 lugares, nunca tinha sido definida de verdade — agora existe, fina e na cor do tema.
- Barra de rolagem aparecendo mesmo em telas vazias (bug de padding/overflow no Lab).
- Badge de feedback aparecendo em projetos do Lab que nunca receberam feedback (bug `null !== 0`).
- Mensagens de erro do Lab mostrando "0 tkn • 0 crd" à toa.
- Página de "Uso" nas Configurações ficando em branco sem explicação quando não há cota pra mostrar.
- Alinhamento e responsividade dos campos de mensagem (Chat e Lab): texto não crescia com múltiplas linhas, botões desalinhados — corrigido em ambos.

---

## O que fica pendente pra próximas sessões

1. **Extrair o texto fixo restante pra tradução** (Chat/Lab/Sala de Aula/admin) — mecânico, sem risco técnico.
2. **Configurar um provedor de e-mail real** (a estrutura de verificação já existe, rodando em modo no-op).
3. **Testar de ponta a ponta** a navegação completa no navegador (feito parcialmente via curl/typecheck/build, não clique-a-clique).
4. Nenhuma dessas mudanças foi **deployada na VPS de produção** — tudo rodou e foi testado só em localhost até agora.
