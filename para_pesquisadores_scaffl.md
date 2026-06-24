# Para Pesquisadores

## Scaffl — Andaime Cognitivo Científico

> *"A ciência não é feita para ser assistida. É feita para ser construída."*

A Scaffl é uma plataforma educacional de pesquisa na qual estudantes **constroem** simuladores de fenômenos científicos em diálogo com uma Inteligência Artificial Generativa, em vez de apenas consumir conteúdos prontos. Cada interação entre o estudante e a IA é registrada de forma íntegra, constituindo um corpus privilegiado para a investigação dos processos de aprendizagem mediados por IA.

Esta página destina-se a pesquisadores, professores e colaboradores interessados nos fundamentos teóricos, no desenho metodológico e nos resultados parciais do programa de pesquisa que sustenta a plataforma.

---

## 1. Contexto institucional e do projeto

A Scaffl é desenvolvida no âmbito do **Programa de Pós-Graduação em Ensino de Ciências e Matemática (PPGECiMa)** da **Universidade de Caxias do Sul (UCS)**, vinculada ao projeto guarda-chuva *"A Inteligência Artificial Generativa e o Ensino de Ciências e Matemática: uma análise sob a Teoria da Mediação Cognitiva em Redes"* (IAGENEduc), coordenado pelo **Prof. Dr. Agostinho Serrano de Andrade Neto**.

O desenvolvimento conta com financiamento da **FAPERGS**, por meio do programa de Iniciação Científica **PROBIC/FAPERGS**, e tem como campo de aplicação previsto o ensino médio do **CETEC/UCS**.

A pergunta que organiza o programa de pesquisa é: *de que modo ambientes educacionais baseados em IA Generativa, simuladores interativos e arquiteturas multiagente podem apoiar a aprendizagem de Ciências e Matemática quando desenvolvidos, aplicados e analisados em contexto real de sala de aula?*

---

## 2. Posicionamento: da assistência à construção

A maior parte das aplicações de IA na educação posiciona o modelo de linguagem como **fonte de respostas** ou tutor que entrega conteúdo. Plataformas de simulação consagradas, como o PhET (Perkins *et al.*, 2006), oferecem modelos interativos de alta qualidade, mas mantêm o estudante em um papel essencialmente **receptivo**: ele manipula um artefato construído por especialistas.

A Scaffl propõe uma **inversão de perspectiva**, fundamentada no Construcionismo de Papert (1980): o aprendizado mais profundo ocorre quando o estudante não apenas consome artefatos digitais, mas os **constrói**. Construir um simulador obriga o aluno a formalizar suas concepções, transformando modelos mentais implícitos em regras explícitas.

A barreira histórica dessa proposta sempre foi a exigência de conhecimentos avançados de programação. Os Grandes Modelos de Linguagem (LLMs) alteram esse cenário: capazes de gerar código a partir de linguagem natural, funcionam como **tradutores** entre a intenção do estudante e a sintaxe computacional. Nessa configuração, a IA não substitui o raciocínio do aluno — exige que ele articule com clareza as regras do fenômeno que deseja modelar. O *prompting* torna-se, assim, uma atividade cognitiva de alto nível.

---

## 3. Fundamentação teórica

O programa de pesquisa articula referenciais consolidados do Ensino de Ciências com teorias da cognição mediada por tecnologia. Os eixos teóricos distribuem-se de acordo com o objeto de cada manuscrito.

### 3.1 Os três níveis de representação de Johnstone

A compreensão de um fenômeno químico exige o trânsito entre três domínios (Johnstone, 1982; 1991; 2000): o **macroscópico** (o observável — cor, gás, temperatura, precipitados), o **submicroscópico** (átomos, moléculas, íons e suas interações) e o **simbólico** (equações, fórmulas, gráficos e relações matemáticas). A dificuldade central da aprendizagem em Química não está em cada nível isolado, mas nas **transições** entre eles (Treagust; Chandrasegaran, 2009; Gilbert; Treagust, 2009), que geram sobrecarga na memória de trabalho.

### 3.2 Aprendizagem Significativa e Aprendizagem Significativa Crítica

A teoria de Ausubel (1968; 2000) estabelece que a aprendizagem é significativa na medida em que o novo conhecimento se relaciona, de modo não arbitrário e substantivo, com conhecimentos prévios (*subsunçores*). O conceito de **organizador prévio** orienta a sequência didática: a experimentação prática funciona como ancoragem concreta para a modelagem posterior. Moreira (1999; 2011) acrescenta a **Aprendizagem Significativa Crítica**, que exige questionamento, diálogo e reconhecimento da provisoriedade dos modelos — processos ativados quando o estudante precisa negociar suas concepções com a IA. Novak (2010) complementa o eixo ao tratar das ferramentas de externalização do conhecimento.

### 3.3 Construcionismo e Mindtools

Para Papert (1980), construir um artefato externo e compartilhável não é consequência, mas **motor** da aprendizagem. Jonassen (2000) sistematiza essa ideia no conceito de **Mindtools** — ferramentas computacionais que funcionam como parceiras intelectuais, exigindo do aprendiz organização, representação e reflexão. Na Scaffl, a LLM é tomada como Mindtool: não um oráculo, mas um copiloto cognitivo que só produz o artefato desejado se o estudante souber explicitar a ciência envolvida.

### 3.4 Teoria da Mediação Cognitiva em Redes (TMC)

A TMC fundamenta *por que* a IA pode atuar como um **mediador cognitivo extracerebral** em redes sociotécnicas, aliviando a carga da memória de trabalho do estudante e redistribuindo o processamento cognitivo. O trabalho de Souza, Andrade Neto e Roazzi (2024) propõe a noção de **Mediação Sofotécnica** e discute o surgimento de um novo modo de funcionamento mental associado à IA generativa.

### 3.5 Perfis conceituais, mediação semiótica e análise discursiva

Para a análise da construção conceitual na interação aluno–IA, o programa mobiliza ainda: os **perfis e obstáculos epistemológicos** de Bachelard; os **perfis conceituais** de Mortimer; a **mediação semiótica** e a **Zona de Desenvolvimento Proximal** de Vygotsky; o **dialogismo** e a **polifonia** de Bakhtin (operacionalizados via Mortimer e Scott); a **Teoria dos Modelos Mentais** (Johnson-Laird; Greca; Moreira); e a **Teoria dos Campos Conceituais** de Vergnaud.

---

## 4. Eixos de pesquisa

O programa estrutura-se em quatro frentes articuladas.

### 4.1 Extração de perfis didático-pedagógicos e clones de professores

Investiga-se a hipótese de que o **método de ensino pode ser desacoplado do conteúdo disciplinar** e transferido para domínios inéditos. Por meio de *meta-prompts* (engenharia de prompt reverso), o modelo analisa transcrições e materiais de aulas e gera um **perfil pedagógico estruturado** (JSON) — frequência de perguntas retóricas, tipologia de analogias, estrutura de *scaffolding* —, posteriormente reaplicado via *style transfer* e ancorado por RAG. Resultado preliminar relevante: a persona de um professor de Física preservou traços de seu estilo didático ao explicar conteúdos de Química, fornecendo evidência inicial do desacoplamento forma–conteúdo.

### 4.2 Atomicidade cognitiva em grafos para SLMs

Frente teórica que busca formalizar o conceito de **atomicidade cognitiva** como critério de granularidade ótima dos nós em grafos de conhecimento manipuláveis por modelos de linguagem de pequeno porte (SLMs, abaixo de 7 bilhões de parâmetros).

### 4.3 Simuladores de Química mediados por IA e a plataforma Scaffl

Frente aplicada central. Estudantes constroem simuladores que articulam os três níveis de Johnstone, em uma sequência didática que parte da experimentação prática. A plataforma integra um ambiente de programação assistido por LLM, uma galeria de simuladores e o registro sistemático das interações.

### 4.4 Projeto Petrus: orquestração multiagente e modelos compactos

O **Petrus** é um sistema de orquestração multiagente de inspiração biológica, voltado a investigar a emergência de comportamentos adaptativos a partir de agentes especializados assíncronos. Na dimensão técnica, testes comparativos com modelos compactos (Llama, Phi-2, Gemma, Qwen2.5) indicaram que um modelo de **7B parâmetros equipado com banco vetorial de consulta** apresentou desempenho qualitativamente comparável ao de um modelo de **32B** em tarefas selecionadas — princípio análogo ao de uma "prova com consulta", que reduz alucinações e compensa a limitação paramétrica. *Resultado preliminar, pendente de validação sistemática por métricas e rubricas.*

---

## 5. A plataforma como instrumento de pesquisa

A opção por uma plataforma própria, e não por ferramentas comerciais, justifica-se em dois planos. No plano **pedagógico**, permite delimitar o escopo de atuação da LLM, direcionando-a à modelagem de fenômenos e evitando que se torne mero gerador de respostas. No plano **metodológico**, garante o registro automático e íntegro de todas as interações, assegurando a rastreabilidade do processo cognitivo.

A plataforma organiza-se em torno de três funções: gestão de **personas/tutores**, um **laboratório** de construção e compartilhamento de simuladores, e um **chat** que integra interação textual e registro. Tecnicamente, é **auto-hospedável** (modelo *bring-your-own-key*, com a chave de IA sob controle da escola e criptografada em repouso), o que evita o envio de dados de alunos a terceiros não controlados pela instituição.

O **dado de ouro** da pesquisa é o turno discursivo completo da díade aluno–IA: prompt exato com *timestamp*, resposta do modelo, e as **versões intermediárias** do código produzido (e não apenas o simulador final), pois é nelas que se observa a emergência conceitual. Mecanismos de verificação de integridade (completude de sessões, *checksums*, exportação anonimizada) preservam a auditabilidade científica do corpus.

---

## 6. Desenho metodológico

A pesquisa é de natureza **qualitativa** e adota o delineamento de **Design-Based Research (DBR)**, caracterizado pela iteração entre o desenvolvimento da intervenção e a investigação sistemática de seus efeitos em contexto real.

A **sequência didática** organiza-se em três etapas:

1. **O fenômeno tangível** — experimento em laboratório (nível macroscópico), funcionando como organizador prévio ausubeliano.
2. **A ferramenta e a mediação** — demonstração guiada da plataforma e do *prompting* direcionado à modelagem.
3. **A modelagem do modelo mental** — construção autônoma do simulador e publicação na galeria.

**Instrumentos de coleta:** logs da plataforma (prompts, respostas e código), análise dos simuladores por **rubrica baseada nos níveis de Johnstone**, e entrevistas semiestruturadas. A triangulação entre as três fontes fortalece a validade interpretativa.

**Análise dos dados:** a Análise de Conteúdo de Bardin sustenta o eixo aplicado (categorias *a priori* derivadas da Aprendizagem Significativa Crítica e categorias emergentes); para o eixo discursivo, mobiliza-se a **Análise Textual Discursiva** (Moraes; Galiazzi), em suas etapas de unitarização, categorização e captura do novo emergente.

**Ética em pesquisa:** a coleta de dados empíricos com participantes em ambiente escolar está condicionada à aprovação pelo **Comitê de Ética em Pesquisa (CEP/UCS)** e à formalização de **TCLE** e **TALE**, com pseudonimização de todos os sujeitos.

---

## 7. Produção científica (em preparação)

- **Artigo de prática aplicada (QNEsc):** sequência didática de construção de simuladores; eixo Ausubel–Papert–Johnstone.
- **Artigo da plataforma como instrumento + análise discursiva:** o Scaffl como ambiente de pesquisa e a construção conceitual na interação aluno–IA; eixo Bachelard–Mortimer–TMC–Bakhtin/Vygotsky (revistas-alvo de perfil teórico).
- **Manuscrito sobre extração de perfis didático-pedagógicos e clones de professores:** metodologia em três fases (coleta, extração via meta-prompt, validação por transferência de domínio e reconhecimento pelo professor).
- **Manuscrito teórico sobre atomicidade cognitiva** em grafos para SLMs.
- **Revisão sistemática e crítica (2020–2025)** sobre LLMs, modelagem docente e personalização do ensino.

A revisão de literatura situa o campo em transição — de agentes que *entregam* conteúdo para agentes que *modelam* a interação humana, atuando como "gêmeos digitais" de educadores —, dialogando com trabalhos como Ruffle&Riley (Schmucker *et al.*, 2024), SocratiQ (Jabbour *et al.*, 2025), SimClass (Zhang *et al.*, 2024) e HiTA (Liu *et al.*, 2024).

---

## 8. Colaboração

Pesquisadores e instituições interessados em colaborar, replicar a metodologia, hospedar a plataforma ou discutir parcerias podem entrar em contato com o grupo de pesquisa do PPGECiMa/UCS. A Scaffl é distribuída em formato auto-hospedável, e protocolos, rubricas e documentação técnica estão sendo organizados para uso por terceiros mediante os devidos cuidados éticos.

---

## Referências

AUSUBEL, D. P. **Educational psychology:** a cognitive view. New York: Holt, Rinehart and Winston, 1968.

AUSUBEL, D. P. **The acquisition and retention of knowledge:** a cognitive view. Dordrecht: Springer, 2000.

BAIDOO-ANU, D.; OWUSU ANSAH, L. Education in the era of generative artificial intelligence (AI): understanding the potential benefits of ChatGPT in promoting teaching and learning. **Journal of AI**, v. 7, n. 1, p. 52-62, 2023.

CHEN, L. *et al.* Artificial intelligence in education: a review. **IEEE Access**, v. 8, p. 75264-75278, 2020.

GILBERT, J. K.; TREAGUST, D. F. (Eds.). **Multiple representations in chemical education**. Dordrecht: Springer, 2009.

HAY, K. E. *et al.* Students as multimedia composers. **Computers & Education**, v. 23, n. 4, p. 301-317, 1994.

HWANG, G. J.; CHEN, N. S. Editorial position paper: exploring the potential of generative artificial intelligence in education. **Educational Technology & Society**, v. 26, n. 2, 2023.

JABBOUR, J. *et al.* SocratiQ: a generative AI-powered learning companion. **arXiv preprint**, 2025.

JOHNSTONE, A. H. Macro- and microchemistry. **School Science Review**, v. 64, n. 227, p. 377-379, 1982.

JOHNSTONE, A. H. Why is science difficult to learn? Things are seldom what they seem. **Journal of Computer Assisted Learning**, v. 7, n. 2, p. 75-83, 1991.

JOHNSTONE, A. H. Teaching of chemistry – logical or psychological? **Chemistry Education Research and Practice**, v. 1, n. 1, p. 9-15, 2000.

JONASSEN, D. H. **Computers as mindtools for schools:** engaging critical thinking. 2. ed. Upper Saddle River: Prentice Hall, 2000.

LIU, C. *et al.* HiTA: a RAG-based educational platform. In: **Proceedings of EMNLP**, 2024.

MOLENAAR, I. The concept of hybrid human-AI regulation: exemplifying how to support young learners' self-regulated learning. **Computers and Education: Artificial Intelligence**, v. 3, p. 100070, 2022.

MORAES, R.; GALIAZZI, M. C. **Análise textual discursiva**. Ijuí: Editora Unijuí, 2007.

MOREIRA, M. A. **Aprendizagem significativa**. Brasília: Editora da UnB, 1999.

MOREIRA, M. A. Aprendizagem significativa crítica. **Retratos da Escola**, v. 5, n. 8, p. 89-101, 2011.

NOVAK, J. D. **Learning, creating, and using knowledge:** concept maps as facilitative tools in schools and corporations. 2. ed. New York: Routledge, 2010.

PAPERT, S. **Mindstorms:** children, computers, and powerful ideas. New York: Basic Books, 1980.

PERKINS, K. *et al.* PhET: interactive simulations for teaching and learning physics. **The Physics Teacher**, v. 44, n. 1, p. 18-23, 2006.

SCHMUCKER, R. *et al.* Ruffle&Riley: insights from designing a LLM-based conversational tutoring system. In: **Proceedings of EDM**, 2024.

SENGUPTA, P. *et al.* Integrating computational thinking with K-12 science education using agent-based computation: a theoretical framework. **Education and Information Technologies**, v. 18, n. 2, p. 351-380, 2013.

SOUZA, B. C.; ANDRADE NETO, A. S.; ROAZZI, A. The generative AI revolution, cognitive mediation networks theory and the emergence of a new mode of mental functioning: introducing the Sophotechnic Mediation scale. **Computers in Human Behavior: Artificial Humans**, v. 2, n. 1, 100042, 2024.

TABER, K. S. Models and modelling in science and chemistry education. In: BENTLEY, D.; WATTS, M. (Eds.). **Chemistry education**. Dordrecht: Springer, 2009.

TREAGUST, D. F.; CHANDRASEGARAN, A. L. The Johnstone triangle: the key to understanding chemistry. In: BENTLEY, D.; WATTS, M. (Eds.). **Chemistry education**. Dordrecht: Springer, 2009. p. 153-172.

ZAWACKI-RICHTER, O. *et al.* Systematic review of research on artificial intelligence applications in higher education – where are the educators? **International Journal of Educational Technology in Higher Education**, v. 16, n. 1, p. 1-27, 2019.

ZHANG, Z. *et al.* Simulating classroom education with LLM-empowered agents. **arXiv preprint**, 2024.

---

*Conteúdo destinado à página "Para Pesquisadores" da plataforma Scaffl. Resultados identificados como preliminares dependem de validação empírica e da aprovação ética em curso.*
