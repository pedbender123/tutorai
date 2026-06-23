import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Sun, Moon, Menu, X, ArrowRight, ChevronRight,
  Check, Server, Book, Cpu, Shield, Sliders, DollarSign,
  GraduationCap, Quote, Copy, ExternalLink, MessageSquare, Code2,
  BookOpen, Layers, Network, Atom,
} from 'lucide-react';

/* ─── Font injection ─── */
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';

/* ─── Self-contained theme system ─── */
const THEMES = {
  teal:    { a1:'#22D3EE', a2:'#14B8A6', a3:'#10B981' },
  lilac:   { a1:'#DDD6FE', a2:'#A78BFA', a3:'#8B5CF6' },
  blue:    { a1:'#93C5FD', a2:'#60A5FA', a3:'#3B82F6' },
  neutral: { a1:'#CBD5E1', a2:'#94A3B8', a3:'#475569' }, // branco/preto conforme modo
} as const;
type ThemeName = keyof typeof THEMES;
type Mode = 'dark' | 'light';
type Lang  = 'pt' | 'en' | 'es';
type Page  = 'home' | 'examples' | 'about' | 'self' | 'docs' | 'researchers';

/* ─── i18n — translated by the author ─── */
const T = {
  pt: {
    navHome:'Início', navEx:'Exemplos', navAbout:'Sobre', navSelf:'Self-Hosted', navDocs:'Docs', navResearchers:'Pesquisadores', navLogin:'Entrar na Plataforma',
    heroBadge:'IA educacional de pesquisa · CIAGE / UCS',
    heroTitle:'Dois agentes.', heroGrad:'Um percurso de aprendizagem.',
    heroSub:'SCAFFL une um tutor socrático que ajuda o estudante a pensar e um agente que constrói simuladores de química a partir das suas próprias palavras. Tudo registrado, do primeiro prompt ao artefato final.',
    heroCta1:'Acessar Plataforma', heroCta2:'Como funciona',
    hm1:'agentes de IA', hm2:'interações registradas', hm3:'simuladores criados', hm4:'estudantes',
    agKicker:'Arquitetura dual', agTitle:'Conversar é diferente de construir.',
    agLead:'A plataforma separa, de propósito, duas naturezas comunicativas. Um agente medeia o pensamento; o outro executa o artefato. A passagem de um para o outro é onde a aprendizagem acontece.',
    ptTag:'Tutor pedagógico', ptName:'Petrus', ptRole:'Mediação socrática · andaimamento cognitivo',
    ptDesc:'Petrus não escreve código. Ele devolve perguntas, propõe decomposições e empurra o estudante a nomear o mecanismo por trás do fenômeno antes de ir ao laboratório.',
    ptB1:'Perguntas orientadoras em vez de respostas prontas', ptB2:'Devoluções reflexivas que expandem o perfil conceitual', ptB3:'Externalização do modelo mental do estudante',
    lbTag:'Agente de código', lbName:'Lab Agent', lbRole:'Geração de simuladores · execução',
    lbDesc:'O Lab Agent recebe instruções em linguagem natural e gera simuladores interativos em HTML/JS. A resposta é executiva — o simulador aparece na tela em segundos.',
    lbB1:'Do prompt ao artefato renderizável em segundos', lbB2:'Ciclo iterativo: pedir → gerar → testar → refinar', lbB3:'O prompt cru revela a zona conceitual ativa',
    modKicker:'Três espaços, um fluxo', modTitle:'Da sala de aula ao simulador funcionando.',
    modLead:'Cada módulo tem um papel no percurso do estudante. O professor acompanha em tempo real; a plataforma registra tudo.',
    chatK:'Home · Chat', chatT:'Monitoria', chatD:'O estudante conversa com Petrus para planejar e refinar a ideia antes de construir.',
    labK:'Lab · Simuladores', labT:'Laboratório', labD:'Galeria de simuladores interativos criados pela turma com o Lab Agent.',
    clsK:'Class · Mural', clsT:'Mural Virtual', clsD:'Sala de aula com disciplinas, atividades e cronograma compartilhado.',
    stKicker:'Corpus piloto', stTitle:'Dados do estudo piloto',
    stCap:'CETEC — Sala Delta 2 · 27 mai – 06 jun 2026 · sujeitos pseudonimizados E1–E19',
    s1:'interações registradas', s2:'monitoria / laboratório', s3:'projetos de simulador', s4:'estudantes',
    reKicker:'Fundamentação de pesquisa', reTitle:'Uma plataforma que também é instrumento de pesquisa.',
    reP1:'Por exigir que o estudante descreva em linguagem natural aquilo que a IA vai construir, a SCAFFL funciona como dispositivo de externalização de modelos mentais. O prompt enviado ao Lab Agent é um registro direto da zona conceitual mobilizada naquele momento.',
    reP2:'A captura total da mediação — incluindo falhas, silêncios e cadeias abandonadas — permite tratar discursivamente o registro completo de um episódio de aprendizagem, algo metodologicamente novo para a Educação em Ciências.',
    rePk:'Artigo em desenvolvimento', rePdesc:'Mediação discursiva e instalação de driver cognitivo na interação estudante–IA durante a construção de simuladores de ciência.', rePmeta:'→ Research in Science Education (Springer)',
    reTg1:'Perfis Conceituais · Mortimer', reTg2:'Perfis Epistemológicos · Bachelard', reTg3:'TMCR · sophotechnia', reTg4:'Escala de apropriação discursiva',
    // Examples
    exKicker:'Demonstração', exTitle:'A plataforma em ação.',
    exLead:'Do diálogo socrático à simulação interativa — cada etapa do percurso de aprendizagem registrada e acessível ao professor em tempo real.',
    ex1Title:'Chat com Petrus', ex1Lead:'O estudante descreve o que quer simular. Petrus não entrega o código — devolve perguntas que ampliam a compreensão conceitual antes de ir ao laboratório.',
    ex2Title:'Lab Agent em ação', ex2Lead:'Com o conceito mapeado, o estudante pede ao Lab Agent em linguagem natural. O agente gera código HTML/JS executável na hora, com prévia imediata.',
    ex3Title:'Mural da turma', ex3Lead:'Os simuladores ficam em galeria compartilhada. O professor acompanha a evolução de cada estudante e pode comentar diretamente no projeto.',
    exPrivacy:'Todos os registros são anonimizados. Os estudantes são identificados por códigos (E1–E19) e nenhum dado pessoal é armazenado além do necessário para a pesquisa.',
    // About
    abKicker:'Sobre o projeto', abTitle:'Uma pesquisa que virou plataforma.',
    abP1:'A SCAFFL nasceu como instrumento de uma Iniciação Científica sobre mediação discursiva na interação estudante–IA no ensino de química. A necessidade de capturar e analisar essa mediação levou ao desenvolvimento de uma plataforma completa.',
    abP2:'O nome SCAFFL vem de scaffolding — andaimamento cognitivo, o processo pelo qual um mediador oferece suporte temporário para que o aprendiz avance além do que conseguiria sozinho.',
    abMissionTitle:'Missão', abMission:'Oferecer suporte estruturado à construção de conhecimento científico através da mediação inteligente entre estudante, professor e tecnologia.',
    abTeam:'Equipe', abResearcher:'Pesquisador', abAdvisor:'Orientador', abGroup:'Grupo de Pesquisa',
    abArchTitle:'Arquitetura', abResTitle:'Base teórica', abStack:'Stack tecnológica',
    q1:'O obstáculo epistemológico não está no objeto de conhecimento, mas no próprio ato de conhecer.',
    q1a:'Gaston Bachelard, A Formação do Espírito Científico, 1938',
    q2:'O perfil conceitual de um indivíduo é o conjunto de formas de pensar sobre um conceito que coexistem.',
    q2a:'Eduardo Mortimer, Linguagem e Formação de Conceitos no Ensino de Ciências, 2000',
    // Self
    slKicker:'Instalação própria', slTitle:'Rode a SCAFFL na sua infraestrutura.',
    slLead:'A SCAFFL é open-source e pode ser instalada em qualquer servidor Linux. Você mantém o controle total dos dados dos seus estudantes.',
    slW1T:'Privacidade total', slW1D:'Todos os dados ficam no seu servidor. Nenhuma interação sai para terceiros além das APIs de IA.',
    slW2T:'Customizável', slW2D:'Modifique o prompt do Petrus, ajuste as regras do Lab Agent, personalize o visual para sua instituição.',
    slW3T:'Sem mensalidade', slW3D:'Você paga apenas pelas chamadas de API (Anthropic + Gemini). A plataforma em si é gratuita.',
    slReq:'Requisitos', slDocker:'Via Docker (recomendado)', slManual:'Instalação manual', slEnv:'Variáveis de ambiente',
    slDlTitle:'Downloads', slGit:'GitHub — Código-fonte', slDockerHub:'Docker Hub', slVideo:'Tutorial em vídeo (em breve)',
    // Docs
    dcKicker:'Documentação', dcTitle:'Referência da plataforma.',
    dcLead:'Tudo o que você precisa para entender, configurar e estender a SCAFFL.',
    dcOvTitle:'Visão geral', dcOvDesc:'A SCAFFL é uma aplicação Node.js + React. O servidor expõe uma API REST e gerencia sessões com PostgreSQL.',
    dcPtTitle:'Agente Petrus', dcPtDesc:'Petrus é implementado como chamada streaming ao modelo Claude (Anthropic). O system prompt define o papel socrático e as regras de mediação.',
    dcLbTitle:'Lab Agent', dcLbDesc:'O Lab Agent usa o modelo Gemini (Google) para geração de código. Cada turno recebe o histórico comprimido dos simuladores anteriores do estudante.',
    dcApiTitle:'API REST', dcApiDesc:'Todos os endpoints requerem autenticação Bearer JWT obtido via POST /api/auth/login.',
    dcCfgTitle:'Configuração', dcCfgDesc:'Todas as opções são definidas via variáveis de ambiente no arquivo .env do servidor.',
    dcEndpoints:'Endpoints principais',
    // Footer
    ftTagline:'Plataforma de tutoria inteligente para o ensino de ciências.',
    ftRights:'Todos os direitos reservados.',
    ftResearcher:'Pesquisador', ftAdvisor:'Orientador', ftInst:'CIAGE · Universidade de Caxias do Sul',
    ftVersion:'Versão Experimental 2026',
  },
  en: {
    navHome:'Home', navEx:'Examples', navAbout:'About', navSelf:'Self-Hosted', navDocs:'Docs', navResearchers:'Researchers', navLogin:'Access Platform',
    heroBadge:'Research AI educational platform · CIAGE / UCS',
    heroTitle:'Two agents.', heroGrad:'One learning journey.',
    heroSub:'SCAFFL combines a Socratic tutor that helps students think and an agent that builds chemistry simulations from the student\'s own words. Everything recorded, from first prompt to final artifact.',
    heroCta1:'Access Platform', heroCta2:'How it works',
    hm1:'AI agents', hm2:'interactions recorded', hm3:'simulations built', hm4:'students',
    agKicker:'Dual architecture', agTitle:'Talking is different from building.',
    agLead:'The platform intentionally separates two communicative natures. One agent mediates thought; the other executes the artifact. The transition between them is where learning happens.',
    ptTag:'Pedagogical tutor', ptName:'Petrus', ptRole:'Socratic mediation · cognitive scaffolding',
    ptDesc:'Petrus does not write code. It returns questions, proposes decompositions and pushes the student to name the mechanism behind the phenomenon before going to the lab.',
    ptB1:'Guiding questions instead of ready-made answers', ptB2:'Reflective responses that expand the conceptual profile', ptB3:'Externalization of the student\'s mental model',
    lbTag:'Code agent', lbName:'Lab Agent', lbRole:'Simulator generation · execution',
    lbDesc:'The Lab Agent receives instructions in natural language and generates interactive HTML/JS simulators. The response is executive — the simulator appears on screen in seconds.',
    lbB1:'From prompt to renderable artifact in seconds', lbB2:'Iterative cycle: request → generate → test → refine', lbB3:'The raw prompt reveals the active conceptual zone',
    modKicker:'Three spaces, one flow', modTitle:'From the classroom to a working simulator.',
    modLead:'Each module plays a role in the student\'s journey. The teacher monitors in real time; the platform records everything.',
    chatK:'Home · Chat', chatT:'Tutoring', chatD:'The student talks with Petrus to plan and refine the idea before building.',
    labK:'Lab · Simulators', labT:'Laboratory', labD:'Gallery of interactive simulations created by the class using Lab Agent.',
    clsK:'Class · Board', clsT:'Virtual Board', clsD:'Classroom with disciplines, activities and shared schedule.',
    stKicker:'Pilot corpus', stTitle:'Pilot study data',
    stCap:'CETEC — Delta 2 Class · May 27 – Jun 6, 2026 · pseudonymized subjects E1–E19',
    s1:'interactions recorded', s2:'tutoring / laboratory', s3:'simulator projects', s4:'students',
    reKicker:'Research foundation', reTitle:'A platform that is also a research instrument.',
    reP1:'By requiring students to describe in natural language what the AI will build, SCAFFL works as an externalization device for mental models. The prompt sent to Lab Agent is a direct record of the conceptual zone mobilized at that moment.',
    reP2:'Total capture of mediation — including failures, silences and abandoned chains — enables a fully discursive treatment of a complete learning episode, something methodologically novel for Science Education.',
    rePk:'Article in development', rePdesc:'Discursive mediation and cognitive driver installation in student–AI interaction during the construction of science simulations.', rePmeta:'→ Research in Science Education (Springer)',
    reTg1:'Conceptual Profiles · Mortimer', reTg2:'Epistemological Profiles · Bachelard', reTg3:'TMCR · sophotechnia', reTg4:'Discursive appropriation scale',
    exKicker:'Demo', exTitle:'The platform in action.',
    exLead:'From Socratic dialogue to interactive simulation — every step of the learning journey recorded and accessible to the teacher in real time.',
    ex1Title:'Chat with Petrus', ex1Lead:'The student describes what they want to simulate. Petrus doesn\'t deliver code — it returns questions that broaden conceptual understanding before going to the lab.',
    ex2Title:'Lab Agent in action', ex2Lead:'With the concept mapped, the student asks Lab Agent in natural language. The agent generates executable HTML/JS code immediately, with instant preview.',
    ex3Title:'Class board', ex3Lead:'Simulators are displayed in a shared gallery. The teacher monitors each student\'s progress and can comment directly on their project.',
    exPrivacy:'All records are anonymized. Students are identified by codes (E1–E19) and no personal data is stored beyond what is necessary for research.',
    abKicker:'About the project', abTitle:'A research project that became a platform.',
    abP1:'SCAFFL was born as an instrument for an undergraduate research project on discursive mediation in student–AI interaction in chemistry education. The need to capture and analyze this mediation led to the development of a complete platform.',
    abP2:'The name SCAFFL comes from scaffolding — the cognitive support process by which a mediator provides temporary assistance for the learner to advance beyond what they could achieve alone.',
    abMissionTitle:'Mission', abMission:'Provide structured support for the construction of scientific knowledge through intelligent mediation between student, teacher and technology.',
    abTeam:'Team', abResearcher:'Researcher', abAdvisor:'Advisor', abGroup:'Research Group',
    abArchTitle:'Architecture', abResTitle:'Theoretical foundation', abStack:'Technology stack',
    q1:'The epistemological obstacle does not lie in the object of knowledge, but in the very act of knowing.',
    q1a:'Gaston Bachelard, The Formation of the Scientific Mind, 1938',
    q2:'An individual\'s conceptual profile is the set of ways of thinking about a concept that coexist.',
    q2a:'Eduardo Mortimer, Language and Concept Formation in Science Teaching, 2000',
    slKicker:'Self-hosted', slTitle:'Run SCAFFL on your own infrastructure.',
    slLead:'SCAFFL is open-source and can be installed on any Linux server. You maintain full control of your students\' data.',
    slW1T:'Full privacy', slW1D:'All data stays on your server. No interactions are sent to third parties beyond the AI APIs.',
    slW2T:'Customizable', slW2D:'Modify Petrus\' prompt, adjust Lab Agent rules, personalize the look for your institution.',
    slW3T:'No monthly fee', slW3D:'You only pay for API calls (Anthropic + Gemini). The platform itself is free.',
    slReq:'Requirements', slDocker:'Via Docker (recommended)', slManual:'Manual installation', slEnv:'Environment variables',
    slDlTitle:'Downloads', slGit:'GitHub — Source code', slDockerHub:'Docker Hub', slVideo:'Video tutorial (coming soon)',
    dcKicker:'Documentation', dcTitle:'Platform reference.',
    dcLead:'Everything you need to understand, configure and extend SCAFFL.',
    dcOvTitle:'Overview', dcOvDesc:'SCAFFL is a Node.js + React application. The server exposes a REST API and manages sessions with PostgreSQL.',
    dcPtTitle:'Petrus Agent', dcPtDesc:'Petrus is implemented as a streaming call to the Claude model (Anthropic). The system prompt defines the Socratic role and mediation rules.',
    dcLbTitle:'Lab Agent', dcLbDesc:'Lab Agent uses the Gemini model (Google) for code generation. Each turn receives the compressed history of the student\'s previous simulators.',
    dcApiTitle:'REST API', dcApiDesc:'All endpoints require Bearer JWT authentication obtained via POST /api/auth/login.',
    dcCfgTitle:'Configuration', dcCfgDesc:'All options are defined via environment variables in the server\'s .env file.',
    dcEndpoints:'Main endpoints',
    ftTagline:'Intelligent tutoring platform for science education.',
    ftRights:'All rights reserved.',
    ftResearcher:'Researcher', ftAdvisor:'Advisor', ftInst:'CIAGE · University of Caxias do Sul',
    ftVersion:'Experimental Version 2026',
  },
  es: {
    navHome:'Inicio', navEx:'Ejemplos', navAbout:'Acerca de', navSelf:'Self-Hosted', navDocs:'Docs', navResearchers:'Investigadores', navLogin:'Entrar a la Plataforma',
    heroBadge:'Plataforma IA educativa de investigación · CIAGE / UCS',
    heroTitle:'Dos agentes.', heroGrad:'Un recorrido de aprendizaje.',
    heroSub:'SCAFFL combina un tutor socrático que ayuda al estudiante a pensar y un agente que construye simuladores de química a partir de sus propias palabras. Todo registrado, desde el primer prompt hasta el artefacto final.',
    heroCta1:'Acceder a la Plataforma', heroCta2:'Cómo funciona',
    hm1:'agentes de IA', hm2:'interacciones registradas', hm3:'simuladores creados', hm4:'estudiantes',
    agKicker:'Arquitectura dual', agTitle:'Conversar es diferente de construir.',
    agLead:'La plataforma separa, a propósito, dos naturalezas comunicativas. Un agente media el pensamiento; el otro ejecuta el artefacto. La transición entre uno y otro es donde ocurre el aprendizaje.',
    ptTag:'Tutor pedagógico', ptName:'Petrus', ptRole:'Mediación socrática · andamiaje cognitivo',
    ptDesc:'Petrus no escribe código. Devuelve preguntas, propone descomposiciones y empuja al estudiante a nombrar el mecanismo detrás del fenómeno antes de ir al laboratorio.',
    ptB1:'Preguntas orientadoras en lugar de respuestas directas', ptB2:'Respuestas reflexivas que amplían el perfil conceptual', ptB3:'Externalización del modelo mental del estudiante',
    lbTag:'Agente de código', lbName:'Lab Agent', lbRole:'Generación de simuladores · ejecución',
    lbDesc:'El Lab Agent recibe instrucciones en lenguaje natural y genera simuladores interactivos en HTML/JS. La respuesta es ejecutiva — el simulador aparece en pantalla en segundos.',
    lbB1:'Del prompt al artefacto renderizable en segundos', lbB2:'Ciclo iterativo: pedir → generar → probar → refinar', lbB3:'El prompt crudo revela la zona conceptual activa',
    modKicker:'Tres espacios, un flujo', modTitle:'Del aula al simulador funcionando.',
    modLead:'Cada módulo tiene un papel en el recorrido del estudiante. El docente monitorea en tiempo real; la plataforma registra todo.',
    chatK:'Home · Chat', chatT:'Tutoría', chatD:'El estudiante conversa con Petrus para planificar y refinar la idea antes de construir.',
    labK:'Lab · Simuladores', labT:'Laboratorio', labD:'Galería de simuladores interactivos creados por la clase con el Lab Agent.',
    clsK:'Class · Mural', clsT:'Mural Virtual', clsD:'Aula con disciplinas, actividades y cronograma compartido.',
    stKicker:'Corpus piloto', stTitle:'Datos del estudio piloto',
    stCap:'CETEC — Sala Delta 2 · 27 may – 06 jun 2026 · sujetos seudonimizados E1–E19',
    s1:'interacciones registradas', s2:'tutoría / laboratorio', s3:'proyectos de simulador', s4:'estudiantes',
    reKicker:'Fundamento de investigación', reTitle:'Una plataforma que también es instrumento de investigación.',
    reP1:'Al exigir que el estudiante describa en lenguaje natural lo que la IA construirá, la SCAFFL funciona como dispositivo de externalización de modelos mentales. El prompt enviado al Lab Agent es un registro directo de la zona conceptual movilizada en ese momento.',
    reP2:'La captura total de la mediación — incluyendo fallos, silencios y cadenas abandonadas — permite tratar discursivamente el registro completo de un episodio de aprendizaje.',
    rePk:'Artículo en desarrollo', rePdesc:'Mediación discursiva e instalación de driver cognitivo en la interacción estudiante–IA durante la construcción de simuladores de ciencia.', rePmeta:'→ Research in Science Education (Springer)',
    reTg1:'Perfiles Conceptuales · Mortimer', reTg2:'Perfiles Epistemológicos · Bachelard', reTg3:'TMCR · sophotechnia', reTg4:'Escala de apropiación discursiva',
    exKicker:'Demostración', exTitle:'La plataforma en acción.',
    exLead:'Del diálogo socrático a la simulación interactiva — cada paso del recorrido de aprendizaje registrado y accesible para el docente en tiempo real.',
    ex1Title:'Chat con Petrus', ex1Lead:'El estudiante describe lo que quiere simular. Petrus no entrega el código — devuelve preguntas que amplían la comprensión conceptual antes de ir al laboratorio.',
    ex2Title:'Lab Agent en acción', ex2Lead:'Con el concepto mapeado, el estudiante pide al Lab Agent en lenguaje natural. El agente genera código HTML/JS ejecutable de inmediato, con vista previa instantánea.',
    ex3Title:'Mural de la clase', ex3Lead:'Los simuladores se exhiben en una galería compartida. El docente monitorea la evolución de cada estudiante y puede comentar directamente en el proyecto.',
    exPrivacy:'Todos los registros están anonimizados. Los estudiantes se identifican mediante códigos (E1–E19) y no se almacenan datos personales más allá de lo necesario para la investigación.',
    abKicker:'Acerca del proyecto', abTitle:'Una investigación que se convirtió en plataforma.',
    abP1:'SCAFFL nació como instrumento de una investigación de iniciación científica sobre la mediación discursiva en la interacción estudiante–IA en la enseñanza de química. La necesidad de capturar y analizar esa mediación llevó al desarrollo de una plataforma completa.',
    abP2:'El nombre SCAFFL proviene de scaffolding — andamiaje cognitivo, el proceso por el cual un mediador ofrece soporte temporal para que el aprendiz avance más allá de lo que podría lograr solo.',
    abMissionTitle:'Misión', abMission:'Ofrecer soporte estructurado para la construcción de conocimiento científico mediante la mediación inteligente entre estudiante, docente y tecnología.',
    abTeam:'Equipo', abResearcher:'Investigador', abAdvisor:'Orientador', abGroup:'Grupo de Investigación',
    abArchTitle:'Arquitectura', abResTitle:'Base teórica', abStack:'Stack tecnológico',
    q1:'El obstáculo epistemológico no está en el objeto de conocimiento, sino en el propio acto de conocer.',
    q1a:'Gaston Bachelard, La Formación del Espíritu Científico, 1938',
    q2:'El perfil conceptual de un individuo es el conjunto de formas de pensar sobre un concepto que coexisten.',
    q2a:'Eduardo Mortimer, Lenguaje y Formación de Conceptos en la Enseñanza de Ciencias, 2000',
    slKicker:'Instalación propia', slTitle:'Ejecuta SCAFFL en tu propia infraestructura.',
    slLead:'SCAFFL es open-source y puede instalarse en cualquier servidor Linux. Mantienes el control total de los datos de tus estudiantes.',
    slW1T:'Privacidad total', slW1D:'Todos los datos permanecen en tu servidor. Ninguna interacción se envía a terceros más allá de las APIs de IA.',
    slW2T:'Personalizable', slW2D:'Modifica el prompt de Petrus, ajusta las reglas del Lab Agent, personaliza el aspecto visual para tu institución.',
    slW3T:'Sin mensualidad', slW3D:'Solo pagas por las llamadas a la API (Anthropic + Gemini). La plataforma en sí es gratuita.',
    slReq:'Requisitos', slDocker:'Con Docker (recomendado)', slManual:'Instalación manual', slEnv:'Variables de entorno',
    slDlTitle:'Descargas', slGit:'GitHub — Código fuente', slDockerHub:'Docker Hub', slVideo:'Tutorial en video (próximamente)',
    dcKicker:'Documentación', dcTitle:'Referencia de la plataforma.',
    dcLead:'Todo lo que necesitas para entender, configurar y extender SCAFFL.',
    dcOvTitle:'Visión general', dcOvDesc:'SCAFFL es una aplicación Node.js + React. El servidor expone una API REST y gestiona las sesiones con PostgreSQL.',
    dcPtTitle:'Agente Petrus', dcPtDesc:'Petrus está implementado como una llamada en streaming al modelo Claude (Anthropic). El system prompt define el rol socrático y las reglas de mediación.',
    dcLbTitle:'Lab Agent', dcLbDesc:'El Lab Agent usa el modelo Gemini (Google) para la generación de código. Cada turno recibe el historial comprimido de los simuladores anteriores del estudiante.',
    dcApiTitle:'API REST', dcApiDesc:'Todos los endpoints requieren autenticación Bearer JWT obtenido mediante POST /api/auth/login.',
    dcCfgTitle:'Configuración', dcCfgDesc:'Todas las opciones se definen mediante variables de entorno en el archivo .env del servidor.',
    dcEndpoints:'Endpoints principales',
    ftTagline:'Plataforma de tutoría inteligente para la enseñanza de ciencias.',
    ftRights:'Todos los derechos reservados.',
    ftResearcher:'Investigador', ftAdvisor:'Orientador', ftInst:'CIAGE · Universidad de Caxias do Sul',
    ftVersion:'Versión Experimental 2026',
  },
} as const;
type TKey = keyof typeof T.pt;

/* ─── Helpers ─── */
const hexToRgb = (h: string) =>
  `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`;

/* ─── Sub-components ─── */
function Kicker({ text, color }: { text: string; color: string }) {
  return <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'0.7rem', letterSpacing:'0.12em', textTransform:'uppercase', color, marginBottom:12, fontWeight:600 }}>{text}</div>;
}

function Bullet({ text, color }: { text: string; color: string }) {
  return (
    <li style={{ display:'flex', gap:12, fontSize:'0.9rem', alignItems:'flex-start', color:'#94A3B8' }}>
      <span style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}22` }}>
        <Check size={11} color={color} />
      </span>
      {text}
    </li>
  );
}

function Tag({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', border:`1px solid ${color}35`, color, background:`${color}0d`, padding:'6px 12px', borderRadius:999, display:'inline-block' }}>
      {text}
    </span>
  );
}

function Term({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.09)', background:'#070B14' }}>
      <div style={{ background:'#0D1526', padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#FF5F57', display:'inline-block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#FEBC2E', display:'inline-block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#28C840', display:'inline-block' }} />
        {title && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color:'#4B5563', marginLeft:8 }}>{title}</span>}
      </div>
      <pre style={{ margin:0, padding:'18px 22px', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', lineHeight:1.9, color:'#94A3B8', overflowX:'auto', whiteSpace:'pre-wrap' }}>
        {children}
      </pre>
    </div>
  );
}

function BrowserFrame({ title, children, dark }: { title: string; children: React.ReactNode; dark: boolean }) {
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`, boxShadow: dark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(0,0,0,0.15)' }}>
      <div style={{ background: dark ? '#141E35' : '#F1F5F9', padding:'11px 14px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` }}>
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#FF5F57', display:'inline-block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#FEBC2E', display:'inline-block' }} />
        <span style={{ width:11, height:11, borderRadius:'50%', background:'#28C840', display:'inline-block' }} />
        <div style={{ flex:1, margin:'0 8px', background: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', borderRadius:6, padding:'4px 10px', fontSize:'0.7rem', fontFamily:"'JetBrains Mono',monospace", color: dark ? '#64748B' : '#94A3B8', textAlign:'center' }}>
          app.scaffl.com.br/{title}
        </div>
      </div>
      <div style={{ background: dark ? '#0C1220' : '#FFFFFF' }}>{children}</div>
    </div>
  );
}

/* Chat mockup */
function ChatMockup({ dark, a2 }: { dark: boolean; a2: string }) {
  const bg = dark ? '#0C1220' : '#F8FAFC';
  const userBg = a2;
  const botBg = dark ? '#1A2540' : '#F1F5F9';
  const txt = dark ? '#E2E8F0' : '#1E293B';
  const muted = dark ? '#64748B' : '#94A3B8';
  const msgs = [
    { bot: true, text: 'Que variáveis você acha que controlam a velocidade de uma reação química?' },
    { bot: false, text: 'Temperatura e concentração dos reagentes.' },
    { bot: true, text: 'Bom. E como elas afetam diferentemente a energia de ativação? Pense na teoria das colisões.' },
    { bot: false, text: 'Temperatura aumenta a energia cinética… mais colisões efetivas?' },
    { bot: true, text: 'Exato. Com esse modelo em mente, o que você quer que a simulação mostre?' },
  ];
  return (
    <div style={{ background: bg, padding:0 }}>
      <div style={{ borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:10, background:`${a2}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <MessageSquare size={14} color={a2} />
        </div>
        <div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.82rem', color: txt }}>Petrus</div>
          <div style={{ fontSize:'0.68rem', color: muted }}>Tutor · online</div>
        </div>
      </div>
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, maxHeight:240, overflowY:'auto' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.bot ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth:'78%', padding:'9px 13px', borderRadius: m.bot ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: m.bot ? botBg : userBg, color: m.bot ? txt : '#fff', fontSize:'0.8rem', lineHeight:1.5 }}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding:'10px 14px', borderTop:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display:'flex', gap:8 }}>
        <div style={{ flex:1, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderRadius:10, padding:'9px 13px', fontSize:'0.78rem', color: muted }}>Quero simular taxa de reação por temperatura…</div>
        <div style={{ width:36, height:36, borderRadius:10, background: a2, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <ArrowRight size={16} color="#fff" />
        </div>
      </div>
    </div>
  );
}

/* Lab mockup */
function LabMockup({ dark, a2 }: { dark: boolean; a2: string }) {
  const bg = dark ? '#0C1220' : '#F8FAFC';
  const txt = dark ? '#E2E8F0' : '#1E293B';
  const muted = dark ? '#64748B' : '#94A3B8';
  return (
    <div style={{ background: bg }}>
      <div style={{ borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:`${a2}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Code2 size={14} color={a2} />
          </div>
          <div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.82rem', color: txt }}>Lab Agent</div>
            <div style={{ fontSize:'0.68rem', color: muted }}>E07 · Cinética Química</div>
          </div>
        </div>
        <div style={{ fontSize:'0.68rem', fontFamily:"'JetBrains Mono',monospace", color: a2, background:`${a2}15`, padding:'4px 10px', borderRadius:6 }}>✓ Simulação atualizada</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, minHeight:220 }}>
        <div style={{ borderRight:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding:'14px', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', lineHeight:1.8, color: muted, background: dark ? '#080C18' : '#F1F5F9', overflowY:'auto', maxHeight:220 }}>
          <span style={{ color:'#60A5FA' }}>const</span> <span style={{ color: txt }}>canvas</span> = <span style={{ color:'#60A5FA' }}>document</span>{'\n'}.getElementById(<span style={{ color:'#86EFAC' }}>'sim'</span>);{'\n'}
          <span style={{ color:'#60A5FA' }}>const</span> ctx = canvas.getContext({'\n'}  <span style={{ color:'#86EFAC' }}>'2d'</span>);{'\n'}{'\n'}
          <span style={{ color:'#64748B' }}>// Arrhenius equation</span>{'\n'}
          <span style={{ color:'#60A5FA' }}>function</span> <span style={{ color:a2 }}>rate</span>(T) {'{'}{'\n'}
          {'  '}<span style={{ color:'#60A5FA' }}>return</span> A * Math.exp({'\n'}
          {'    '}-Ea / (R * T));{'\n'}
          {'}'}
        </div>
        <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: muted }}>Pré-visualização</div>
          <div style={{ flex:1, borderRadius:10, background: dark ? '#0F1A2C' : '#EEF2F7', border:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:10 }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'0.72rem', color: txt, fontWeight:600 }}>Taxa de Reação × T(K)</div>
            <svg viewBox="0 0 120 60" style={{ width:'100%', maxWidth:140 }}>
              <polyline points="10,50 30,42 50,30 70,16 90,8 110,4" fill="none" stroke={a2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="10" y1="52" x2="110" y2="52" stroke={muted} strokeWidth="0.8" />
              <line x1="10" y1="4"  x2="10"  y2="52" stroke={muted} strokeWidth="0.8" />
            </svg>
            <div style={{ fontSize:'0.64rem', color: muted }}>k = A·e^(−Eₐ/RT)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Class/Mural mockup */
function ClassMockup({ dark, a2 }: { dark: boolean; a2: string }) {
  const bg = dark ? '#0C1220' : '#F8FAFC';
  const txt = dark ? '#E2E8F0' : '#1E293B';
  const muted = dark ? '#64748B' : '#94A3B8';
  const panel = dark ? '#111D30' : '#FFFFFF';
  const cards = [
    { author:'E03', title:'Equilíbrio Ácido-Base', score:'9.2', color:'#10B981' },
    { author:'E07', title:'Cinética Química', score:'8.8', color: a2 },
    { author:'E11', title:'Eletroquímica', score:'9.5', color:'#8B5CF6' },
    { author:'E14', title:'Gases Ideais', score:'8.1', color:'#F59E0B' },
  ];
  return (
    <div style={{ background: bg }}>
      <div style={{ borderBottom:`1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:10, background:`${a2}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <BookOpen size={14} color={a2} />
        </div>
        <div>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.82rem', color: txt }}>Mural da Turma</div>
          <div style={{ fontSize:'0.68rem', color: muted }}>Sala Delta 2 · 20 simuladores</div>
        </div>
      </div>
      <div style={{ padding:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {cards.map(c => (
          <div key={c.author} style={{ background: panel, borderRadius:10, padding:'10px 12px', border:`1px solid ${dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}>
            <div style={{ fontSize:'0.68rem', fontFamily:"'JetBrains Mono',monospace", color: muted, marginBottom:4 }}>{c.author}</div>
            <div style={{ fontSize:'0.78rem', fontWeight:600, fontFamily:"'Space Grotesk',sans-serif", color: txt, marginBottom:8, lineHeight:1.3 }}>{c.title}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ width:32, height:3, borderRadius:2, background:`${c.color}30` }}>
                <div style={{ width:`${parseFloat(c.score)*10}%`, height:'100%', borderRadius:2, background: c.color }} />
              </div>
              <span style={{ fontSize:'0.7rem', fontFamily:"'JetBrains Mono',monospace", color: c.color }}>{c.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mode, setMode]   = useState<Mode>('dark');
  const [color, setColor] = useState<ThemeName>('teal');
  const [lang, setLang]   = useState<Lang>('pt');
  const [page, setPage]   = useState<Page>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const dark   = mode === 'dark';
  const theme  = THEMES[color];
  // Tema neutro: branco em dark, quase-preto em light (igual à plataforma com "white")
  const a2     = color === 'neutral' ? (dark ? '#FFFFFF' : '#0F172A') : theme.a2;
  const t      = (k: TKey): string => (T[lang] as Record<string, string>)[k] ?? k;

  /* Inject fonts */
  useEffect(() => {
    if (document.getElementById('scaffl-landing-fonts')) return;
    const l = document.createElement('link');
    l.id = 'scaffl-landing-fonts';
    l.rel = 'stylesheet';
    l.href = FONT_URL;
    document.head.appendChild(l);
  }, []);

  /* Canvas animation */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    type P = { x:number; y:number; vx:number; vy:number; r:number };
    let pts: P[] = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    const init = () => {
      pts = Array.from({ length: 55 }, () => ({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 1.8 + 0.4,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const rgb = hexToRgb(a2);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(${rgb},${(1 - d/140)*0.25})`; ctx.lineWidth = 0.9; ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${rgb},0.5)`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      id = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); };
  }, [a2]);

  /* Style shortcuts */
  const BG    = dark ? '#080C18' : '#F6F8FC';
  const BG2   = dark ? '#0C1220' : '#EEF2F8';
  const PANEL = dark ? '#111A2E' : '#FFFFFF';
  const LINE  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const TX    = dark ? '#F0F6FF' : '#0F172A';
  const TX2   = dark ? '#94A3B8' : '#475569';
  const TX3   = dark ? '#4B5563' : '#94A3B8';
  const GRAD  = `linear-gradient(135deg,${theme.a1},${a2} 50%,${theme.a3})`;

  const navPages: { id: Page; key: TKey }[] = [
    { id:'home',        key:'navHome'        },
    { id:'examples',    key:'navEx'          },
    { id:'about',       key:'navAbout'       },
    { id:'self',        key:'navSelf'        },
    { id:'docs',        key:'navDocs'        },
    { id:'researchers', key:'navResearchers' },
  ];

  const go = (p: Page) => { setPage(p); setMenuOpen(false); window.scrollTo({ top:0, behavior:'smooth' }); };

  /* Corner marks */
  const Reg = ({ pos }: { pos: 'tl'|'tr'|'bl'|'br' }) => {
    const top  = pos.startsWith('t') ? 16 : undefined;
    const bot  = pos.startsWith('b') ? 16 : undefined;
    const left = pos.endsWith('l')   ? 16 : undefined;
    const right= pos.endsWith('r')   ? 16 : undefined;
    return (
      <div style={{ position:'fixed', width:22, height:22, top, bottom:bot, left, right, zIndex:60, pointerEvents:'none', opacity:0.4 }}>
        <div style={{ position:'absolute', top:0, left:0, width:'100%', height:1.5, background: a2, ...(pos.includes('r') ? { left:'auto', right:0 } : {}) }} />
        <div style={{ position:'absolute', top:0, left:0, width:1.5, height:'100%', background: a2, ...(pos.includes('r') ? { left:'auto', right:0 } : {}), ...(pos.includes('b') ? { top:'auto', bottom:0 } : {}) }} />
      </div>
    );
  };

  const SectionWrap = ({ children, bg }: { children: React.ReactNode; bg?: string }) => (
    <section style={{ padding:'88px 0', background: bg ?? BG }}>
      <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px' }}>{children}</div>
    </section>
  );

  /* ── HOME PAGE ── */
  const HomePage = () => (
    <>
      {/* Hero */}
      <section style={{ position:'relative', paddingTop:80, minHeight:'100vh', display:'flex', alignItems:'center', overflow:'hidden', background: BG }}>
        {/* Dot grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage: dark ? 'radial-gradient(rgba(255,255,255,0.048) 1px,transparent 1px)' : 'radial-gradient(rgba(0,0,0,0.055) 1px,transparent 1px)',
          backgroundSize:'28px 28px' }} />
        {/* Orbs */}
        <div style={{ position:'absolute', top:'18%', right:'14%', width:500, height:500, borderRadius:'50%', background: a2, opacity:0.13, filter:'blur(90px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'12%', left:'8%', width:300, height:300, borderRadius:'50%', background: theme.a1, opacity:0.08, filter:'blur(70px)', pointerEvents:'none' }} />
        {/* Canvas */}
        <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', opacity: dark ? 0.7 : 0.4 }} />
        <div style={{ position:'relative', zIndex:2, maxWidth:1160, margin:'0 auto', padding:'80px 24px 100px' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'7px 14px', borderRadius:999, border:`1px solid ${a2}38`, background:`${a2}0e`, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: a2, marginBottom:28 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background: a2, animation:'pulse 2s infinite', display:'inline-block' }} />
            {t('heroBadge')}
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, lineHeight:1.04, marginBottom:24, color: TX, fontSize:'clamp(2.8rem,7vw,5.2rem)' }}>
            {t('heroTitle')}<br />
            <span style={{ background: GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{t('heroGrad')}</span>
          </h1>
          <p style={{ maxWidth:640, lineHeight:1.72, marginBottom:40, color: TX2, fontSize:'clamp(1rem,1.8vw,1.18rem)' }}>{t('heroSub')}</p>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:60 }}>
            <button onClick={() => navigate('/login')} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 28px', borderRadius:14, background: GRAD, color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.97rem', border:'none', cursor:'pointer', boxShadow:`0 8px 28px ${a2}45` }}>
              {t('heroCta1')} <ArrowRight size={18} />
            </button>
            <button onClick={() => go('examples')} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'14px 28px', borderRadius:14, background:'transparent', color: TX, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.97rem', border:`1px solid ${LINE}`, cursor:'pointer' }}>
              {t('heroCta2')} <ChevronRight size={18} />
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:28, paddingTop:32, borderTop:`1px solid ${LINE}` }}>
            {[['2','hm1'],['164','hm2'],['20','hm3'],['19','hm4']].map(([n,k]) => (
              <div key={k}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,2.8rem)', background: GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{n}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.74rem', color: TX3, marginTop:4 }}>{t(k as TKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents */}
      <SectionWrap bg={BG2}>
        <Kicker text={t('agKicker')} color={a2} />
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.9rem,3.5vw,2.8rem)', color: TX, marginBottom:14 }}>{t('agTitle')}</h2>
        <p style={{ color: TX2, maxWidth:680, lineHeight:1.7, marginBottom:48 }}>{t('agLead')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22 }}>
          {([
            { tag:'ptTag', name:'ptName', role:'ptRole', desc:'ptDesc', bullets:['ptB1','ptB2','ptB3'] as TKey[], Icon:MessageSquare, side:'left' },
            { tag:'lbTag', name:'lbName', role:'lbRole', desc:'lbDesc', bullets:['lbB1','lbB2','lbB3'] as TKey[], Icon:Code2, side:'right' },
          ]).map(({ tag, name, role, desc, bullets, Icon }) => (
            <div key={name} style={{ position:'relative', background: PANEL, border:`1px solid ${LINE}`, borderRadius:20, padding:32, overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background: GRAD }} />
              <div style={{ width:44, height:44, borderRadius:12, background:`${a2}18`, border:`1px solid ${a2}28`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <Icon size={20} color={a2} />
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', letterSpacing:'0.08em', textTransform:'uppercase', color: a2, marginBottom:4 }}>{t(tag as TKey)}</div>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.7rem', color: TX, margin:'4px 0 2px' }}>{t(name as TKey)}</h3>
              <p style={{ fontSize:'0.87rem', color: TX3, marginBottom:14 }}>{t(role as TKey)}</p>
              <p style={{ fontSize:'0.93rem', color: TX2, lineHeight:1.65, marginBottom:20 }}>{t(desc as TKey)}</p>
              <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:10 }}>
                {bullets.map(b => <Bullet key={b} text={t(b)} color={a2} />)}
              </ul>
            </div>
          ))}
        </div>
      </SectionWrap>

      {/* Modules */}
      <SectionWrap bg={BG}>
        <Kicker text={t('modKicker')} color={a2} />
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.9rem,3.5vw,2.8rem)', color: TX, marginBottom:14 }}>{t('modTitle')}</h2>
        <p style={{ color: TX2, maxWidth:640, lineHeight:1.7, marginBottom:48 }}>{t('modLead')}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18 }}>
          {([
            { Icon:MessageSquare, k:'chatK', t:'chatT', d:'chatD' },
            { Icon:Code2,         k:'labK',  t:'labT',  d:'labD'  },
            { Icon:BookOpen,      k:'clsK',  t:'clsT',  d:'clsD'  },
          ]).map(({ Icon, k, t:ti, d }) => (
            <div key={k} style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:18, padding:28 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:`${a2}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
                <Icon size={18} color={a2} />
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', letterSpacing:'0.1em', textTransform:'uppercase', color: a2, marginBottom:8 }}>{t(k as TKey)}</div>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.1rem', color: TX, marginBottom:8 }}>{t(ti as TKey)}</h3>
              <p style={{ fontSize:'0.88rem', color: TX2, lineHeight:1.65 }}>{t(d as TKey)}</p>
            </div>
          ))}
        </div>
      </SectionWrap>

      {/* Stats */}
      <SectionWrap bg={BG2}>
        <Kicker text={t('stKicker')} color={a2} />
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.6rem,2.8vw,2.2rem)', color: TX, marginBottom:40 }}>{t('stTitle')}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
          {[['164','s1'],['89/75','s2'],['20','s3'],['19','s4']].map(([n,k]) => (
            <div key={k} style={{ border:`1px solid ${LINE}`, borderRadius:16, padding:'24px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.8rem,3.5vw,2.6rem)', background: GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{n}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: TX3, marginTop:6 }}>{t(k as TKey)}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: TX3, textAlign:'center' }}>{t('stCap')}</p>
      </SectionWrap>

      {/* Research */}
      <SectionWrap bg={BG}>
        <Kicker text={t('reKicker')} color={a2} />
        <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.9rem,3.5vw,2.8rem)', color: TX, marginBottom:40, maxWidth:'22ch' }}>{t('reTitle')}</h2>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:40, alignItems:'start' }}>
          <div>
            <p style={{ color: TX2, lineHeight:1.75, marginBottom:18 }}>{t('reP1')}</p>
            <p style={{ color: TX2, lineHeight:1.75, marginBottom:28 }}>{t('reP2')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(['reTg1','reTg2','reTg3','reTg4'] as TKey[]).map(k => <Tag key={k} text={t(k)} color={a2} />)}
            </div>
          </div>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:18, padding:28 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', letterSpacing:'0.1em', textTransform:'uppercase', color: a2, marginBottom:10 }}>{t('rePk')}</div>
            <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.18rem', color: TX, marginBottom:10 }}>From Command to Authorship</h3>
            <p style={{ fontSize:'0.88rem', color: TX2, lineHeight:1.65, marginBottom:16 }}>{t('rePdesc')}</p>
            <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', color: a2 }}>{t('rePmeta')}</p>
            <div style={{ marginTop:20, paddingTop:18, borderTop:`1px solid ${LINE}`, display:'flex', flexWrap:'wrap', gap:8 }}>
              {[['GraduationCap','Mortimer'],['Atom','Bachelard'],['Network','TMCR'],['Layers','Sophotechnia']].map(([,label]) => (
                <span key={label} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', padding:'5px 10px', borderRadius:8, border:`1px solid ${LINE}`, color: TX3 }}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionWrap>

      {/* CTA Banner */}
      <SectionWrap bg={BG2}>
        <div style={{ borderRadius:24, padding:'64px 40px', textAlign:'center', background:`linear-gradient(135deg,${a2}1a 0%,${a2}07 60%,transparent)`, border:`1px solid ${a2}28`, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 50% 0%,${a2}14,transparent 65%)`, pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:1 }}>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(1.8rem,3.5vw,2.8rem)', color: TX, marginBottom:14 }}>{lang==='pt' ? 'Pronto para explorar?' : lang==='en' ? 'Ready to explore?' : '¿Listo para explorar?'}</h2>
            <p style={{ color: TX2, maxWidth:420, margin:'0 auto 32px', lineHeight:1.7 }}>{lang==='pt' ? 'Acesse com o convite da sua instituição ou entre com suas credenciais.' : lang==='en' ? 'Access with your institution\'s invite or sign in with your credentials.' : 'Accede con el enlace de tu institución o entra con tus credenciales.'}</p>
            <button onClick={() => navigate('/login')} style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'16px 36px', borderRadius:16, background: GRAD, color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1rem', border:'none', cursor:'pointer', boxShadow:`0 12px 40px ${a2}50` }}>
              {t('heroCta1')} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </SectionWrap>
    </>
  );

  /* ── EXAMPLES PAGE ── */
  const ExamplesPage = () => (
    <>
      <div style={{ paddingTop:80, background: BG }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'80px 24px 40px' }}>
          <Kicker text={t('exKicker')} color={a2} />
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color: TX, marginBottom:16 }}>{t('exTitle')}</h1>
          <p style={{ color: TX2, maxWidth:640, lineHeight:1.7, marginBottom:0 }}>{t('exLead')}</p>
        </div>
      </div>
      <SectionWrap bg={BG}>
        <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1.1fr', gap:40, alignItems:'center', marginBottom:72 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: a2, marginBottom:10 }}>01</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.7rem', color: TX, marginBottom:14 }}>{t('ex1Title')}</h2>
            <p style={{ color: TX2, lineHeight:1.72, marginBottom:20 }}>{t('ex1Lead')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              <Tag text={lang==='pt' ? 'Andaimamento socrático' : lang==='en' ? 'Socratic scaffolding' : 'Andamiaje socrático'} color={a2} />
              <Tag text={lang==='pt' ? 'Zona de desenvolvimento proximal' : lang==='en' ? 'Zone of proximal development' : 'Zona de desarrollo próximo'} color={a2} />
            </div>
          </div>
          <BrowserFrame title="chat" dark={dark}>
            <img src="/screenshots/screenshot-chat-petrus.jpg" style={{ width:'100%', display:'block' }} alt="Chat com Petrus — SCAFFL" />
          </BrowserFrame>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:40, alignItems:'center', marginBottom:72 }}>
          <BrowserFrame title="lab/simuladores" dark={dark}>
            <img src="/screenshots/screenshot-lab-simuladores.jpg" style={{ width:'100%', display:'block' }} alt="Laboratório de Simuladores — SCAFFL" />
          </BrowserFrame>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: a2, marginBottom:10 }}>02</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.7rem', color: TX, marginBottom:14 }}>{t('ex2Title')}</h2>
            <p style={{ color: TX2, lineHeight:1.72, marginBottom:20 }}>{t('ex2Lead')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              <Tag text={lang==='pt' ? 'Geração em linguagem natural' : lang==='en' ? 'Natural language generation' : 'Generación en lenguaje natural'} color={a2} />
              <Tag text={lang==='pt' ? 'Artefato interativo' : lang==='en' ? 'Interactive artifact' : 'Artefacto interactivo'} color={a2} />
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1.1fr', gap:40, alignItems:'center', marginBottom:48 }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: a2, marginBottom:10 }}>03</div>
            <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.7rem', color: TX, marginBottom:14 }}>{t('ex3Title')}</h2>
            <p style={{ color: TX2, lineHeight:1.72, marginBottom:20 }}>{t('ex3Lead')}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              <Tag text={lang==='pt' ? 'Avaliação formativa' : lang==='en' ? 'Formative assessment' : 'Evaluación formativa'} color={a2} />
              <Tag text={lang==='pt' ? 'Visibilidade pedagógica' : lang==='en' ? 'Pedagogical visibility' : 'Visibilidad pedagógica'} color={a2} />
            </div>
          </div>
          <BrowserFrame title="class/mural" dark={dark}>
            <img src="/screenshots/screenshot-mural.jpg" style={{ width:'100%', display:'block' }} alt="Mural Virtual — SCAFFL" />
          </BrowserFrame>
        </div>
        {/* Privacy notice */}
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', border:`1px dashed ${a2}40`, borderRadius:14, padding:'18px 22px', background:`${a2}07` }}>
          <Shield size={20} color={a2} style={{ flexShrink:0, marginTop:2 }} />
          <p style={{ fontSize:'0.87rem', color: TX2, lineHeight:1.65, margin:0 }}>{t('exPrivacy')}</p>
        </div>
      </SectionWrap>
    </>
  );

  /* ── ABOUT PAGE ── */
  const AboutPage = () => (
    <>
      <div style={{ paddingTop:80, background: BG }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'80px 24px 40px' }}>
          <Kicker text={t('abKicker')} color={a2} />
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color: TX, marginBottom:16 }}>{t('abTitle')}</h1>
          <p style={{ color: TX2, maxWidth:700, lineHeight:1.75, marginBottom:8 }}>{t('abP1')}</p>
          <p style={{ color: TX2, maxWidth:700, lineHeight:1.75 }}>{t('abP2')}</p>
        </div>
      </div>
      <SectionWrap bg={BG2}>
        {/* Mission */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22, marginBottom:48 }}>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:18, padding:30 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: a2, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{t('abMissionTitle')}</div>
            <p style={{ color: TX, lineHeight:1.75, fontSize:'1rem', fontStyle:'italic', margin:0 }}>{t('abMission')}</p>
          </div>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:18, padding:30 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: a2, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{t('abArchTitle')}</div>
            <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap' }}>
              {['Browser','→','SCAFFL Server','→','Claude API','→','Gemini API','→','PostgreSQL'].map((n, i) => (
                n === '→'
                  ? <span key={i} style={{ color: TX3, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.8rem', padding:'0 6px' }}>→</span>
                  : <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', padding:'5px 10px', border:`1px solid ${LINE}`, borderRadius:8, color: TX2, background: dark ? '#0C1220' : '#F1F5F9' }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
        {/* Quotes */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:20 }}>{t('abResTitle')}</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:48 }}>
          {[['q1','q1a'],['q2','q2a']].map(([qk,ak]) => (
            <div key={qk} style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26, position:'relative' }}>
              <Quote size={28} color={a2} style={{ opacity:0.25, position:'absolute', top:18, right:20 }} />
              <p style={{ fontStyle:'italic', color: TX, lineHeight:1.75, fontSize:'0.95rem', marginBottom:14 }}>"{t(qk as TKey)}"</p>
              <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: TX3 }}>— {t(ak as TKey)}</p>
            </div>
          ))}
        </div>
        {/* Team */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:20 }}>{t('abTeam')}</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:28 }}>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: a2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{t('abResearcher')}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.05rem', color: TX, marginBottom:4 }}>Pedro Bender Randon</div>
            <div style={{ fontSize:'0.82rem', color: TX2 }}>{t('ftInst')}</div>
          </div>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: a2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{t('abAdvisor')}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.05rem', color: TX, marginBottom:4 }}>Prof. Dr. Agostinho</div>
            <div style={{ fontSize:'0.82rem', color: TX2 }}>{t('ftInst')}</div>
          </div>
          <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: a2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{t('abGroup')}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.05rem', color: TX, marginBottom:4 }}>CIAGE</div>
            <div style={{ fontSize:'0.82rem', color: TX2 }}>Universidade de Caxias do Sul</div>
          </div>
        </div>
        {/* Stack */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>{t('abStack')}</h3>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {['Node.js','TypeScript','React','PostgreSQL','Drizzle ORM','Claude (Anthropic)','Gemini (Google)','Tailwind CSS','Vite','Docker'].map(s => (
            <span key={s} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', padding:'7px 13px', border:`1px solid ${LINE}`, borderRadius:8, color: TX2 }}>{s}</span>
          ))}
        </div>
      </SectionWrap>
    </>
  );

  /* ── SELF PAGE ── */
  const SelfPage = () => (
    <>
      <div style={{ paddingTop:80, background: BG }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'80px 24px 40px' }}>
          <Kicker text={t('slKicker')} color={a2} />
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color: TX, marginBottom:16 }}>{t('slTitle')}</h1>
          <p style={{ color: TX2, maxWidth:640, lineHeight:1.7 }}>{t('slLead')}</p>
        </div>
      </div>
      <SectionWrap bg={BG2}>
        {/* Why */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginBottom:56 }}>
          {([['slW1T','slW1D',Shield],['slW2T','slW2D',Sliders],['slW3T','slW3D',DollarSign]] as [TKey,TKey,React.ElementType][]).map(([tit,desc,Icon]) => (
            <div key={tit} style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:`${a2}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <Icon size={18} color={a2} />
              </div>
              <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1rem', color: TX, marginBottom:8 }}>{t(tit)}</h3>
              <p style={{ fontSize:'0.88rem', color: TX2, lineHeight:1.65, margin:0 }}>{t(desc)}</p>
            </div>
          ))}
        </div>
        {/* Requirements */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>{t('slReq')}</h3>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:48 }}>
          {['Node.js 20+','PostgreSQL 15+','Anthropic API Key','Gemini API Key','Linux / macOS / WSL2'].map(r => (
            <span key={r} style={{ display:'inline-flex', alignItems:'center', gap:7, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', padding:'7px 13px', border:`1px solid ${LINE}`, borderRadius:8, color: TX2 }}>
              <Check size={12} color={a2} /> {r}
            </span>
          ))}
        </div>
        {/* Docker */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>{t('slDocker')}</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:48 }}>
          <Term title="docker-compose.yml">
            <span style={{ color:'#64748B' }}># docker-compose.yml{'\n'}</span>
            <span style={{ color:'#60A5FA' }}>version</span>: <span style={{ color:'#86EFAC' }}>'3.9'</span>{'\n'}
            <span style={{ color:'#60A5FA' }}>services</span>:{'\n'}
            {'  '}<span style={{ color: a2 }}>scaffl</span>:{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>image</span>: ghcr.io/pedbender123/scaffl:latest{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>ports</span>: [<span style={{ color:'#86EFAC' }}>"3000:3000"</span>]{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>env_file</span>: .env{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>depends_on</span>: [db]{'\n'}
            {'  '}<span style={{ color: a2 }}>db</span>:{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>image</span>: postgres:16-alpine{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>environment</span>:{'\n'}
            {'      POSTGRES_USER'}: scaffl{'\n'}
            {'      POSTGRES_PASSWORD'}: {'${DB_PASSWORD}'}{'\n'}
            {'      POSTGRES_DB'}: scaffl{'\n'}
            {'    '}<span style={{ color:'#60A5FA' }}>volumes</span>: [pgdata:/var/lib/postgresql/data]{'\n'}
            <span style={{ color:'#60A5FA' }}>volumes</span>:{'\n'}
            {'  '}pgdata:
          </Term>
          <Term title=".env">
            <span style={{ color:'#64748B' }}># Obrigatório{'\n'}</span>
            <span style={{ color: a2 }}>ANTHROPIC_API_KEY</span>=sk-ant-...{'\n'}
            <span style={{ color: a2 }}>GEMINI_API_KEY</span>=AIza...{'\n'}
            <span style={{ color: a2 }}>DATABASE_URL</span>=postgresql://scaffl:{'\n'}  pass@db:5432/scaffl{'\n'}
            <span style={{ color: a2 }}>JWT_SECRET</span>={'<'}32-char-random{'>'}{'\n\n'}
            <span style={{ color:'#64748B' }}># Opcional{'\n'}</span>
            <span style={{ color: a2 }}>PORT</span>=3000{'\n'}
            <span style={{ color: a2 }}>NODE_ENV</span>=production
          </Term>
        </div>
        <Term title="bash">
          <span style={{ color:'#64748B' }}># Subir a plataforma{'\n'}</span>
          <span style={{ color: a2 }}>$</span> docker compose up -d{'\n\n'}
          <span style={{ color:'#64748B' }}># Verificar logs{'\n'}</span>
          <span style={{ color: a2 }}>$</span> docker compose logs -f scaffl
        </Term>
        <div style={{ height:48 }} />
        {/* Manual */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>{t('slManual')}</h3>
        <Term title="bash">
          <span style={{ color: a2 }}>$</span> git clone https://github.com/pedbender123/scaffl.git{'\n'}
          <span style={{ color: a2 }}>$</span> cd scaffl{'\n'}
          <span style={{ color: a2 }}>$</span> npm install{'\n'}
          <span style={{ color: a2 }}>$</span> cp .env.example .env{'\n'}
          <span style={{ color:'#64748B' }}># edite .env com suas chaves{'\n'}</span>
          <span style={{ color: a2 }}>$</span> npm run db:push{'\n'}
          <span style={{ color: a2 }}>$</span> npm run build{'\n'}
          <span style={{ color: a2 }}>$</span> npm start
        </Term>
        <div style={{ height:48 }} />
        {/* Downloads */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:20 }}>{t('slDlTitle')}</h3>
        <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
          {[
            { label: t('slGit'), icon: ExternalLink },
            { label: t('slDockerHub'), icon: Server },
            { label: t('slVideo'), icon: Book, disabled: true },
          ].map(({ label, icon: Icon, disabled }) => (
            <button key={label} disabled={disabled} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 22px', borderRadius:12, border:`1px solid ${disabled ? LINE : a2}`, background: disabled ? 'transparent' : `${a2}14`, color: disabled ? TX3 : a2, fontFamily:"'Space Grotesk',sans-serif", fontWeight:600, fontSize:'0.9rem', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </SectionWrap>
    </>
  );

  /* ── DOCS PAGE ── */
  const DocsPage = () => {
    const endpoints = [
      ['POST',  '/api/auth/login',          'Autenticar e receber JWT'],
      ['POST',  '/api/auth/register',        'Registrar via invite code'],
      ['GET',   '/api/auth/me',              'Dados do usuário autenticado'],
      ['GET',   '/api/chats',               'Listar sessões de chat'],
      ['POST',  '/api/chats',               'Criar nova sessão'],
      ['POST',  '/api/chats/:id/message',   'Enviar mensagem ao Petrus (streaming)'],
      ['GET',   '/api/lab/projects',        'Listar projetos do usuário'],
      ['POST',  '/api/lab/projects',        'Criar projeto no Lab'],
      ['POST',  '/api/lab/projects/:id/turn','Enviar prompt ao Lab Agent'],
      ['GET',   '/api/classrooms',          'Listar salas (admin)'],
    ];
    const methodColor: Record<string, string> = { GET:'#10B981', POST:a2, PUT:'#F59E0B', DELETE:'#EF4444' };
    return (
      <>
        <div style={{ paddingTop:80, background: BG }}>
          <div style={{ maxWidth:1160, margin:'0 auto', padding:'80px 24px 40px' }}>
            <Kicker text={t('dcKicker')} color={a2} />
            <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color: TX, marginBottom:16 }}>{t('dcTitle')}</h1>
            <p style={{ color: TX2, maxWidth:640, lineHeight:1.7 }}>{t('dcLead')}</p>
          </div>
        </div>
        <SectionWrap bg={BG2}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:48 }}>
            {([
              ['dcOvTitle','dcOvDesc', Cpu],
              ['dcPtTitle','dcPtDesc', MessageSquare],
              ['dcLbTitle','dcLbDesc', Code2],
              ['dcCfgTitle','dcCfgDesc', Sliders],
            ] as [TKey,TKey,React.ElementType][]).map(([tit,desc,Icon]) => (
              <div key={tit} style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${a2}14`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                  <Icon size={17} color={a2} />
                </div>
                <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.05rem', color: TX, marginBottom:8 }}>{t(tit)}</h3>
                <p style={{ fontSize:'0.88rem', color: TX2, lineHeight:1.65, margin:0 }}>{t(desc)}</p>
              </div>
            ))}
          </div>
          <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:20 }}>{t('dcApiTitle')} — {t('dcEndpoints')}</h3>
          <div style={{ border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden' }}>
            <div style={{ background: dark ? '#0D1526' : '#F1F5F9', padding:'11px 18px', borderBottom:`1px solid ${LINE}`, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: TX3 }}>
              Base URL: <span style={{ color: a2 }}>https://app.scaffl.com.br</span> · Bearer JWT obrigatório
            </div>
            {endpoints.map(([method, path, desc], i) => (
              <div key={path} style={{ display:'grid', gridTemplateColumns:'70px 1fr 1fr', gap:0, borderBottom: i < endpoints.length - 1 ? `1px solid ${LINE}` : 'none', padding:'12px 18px', alignItems:'center', background: i % 2 === 0 ? 'transparent' : (dark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.015)') }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', fontWeight:600, color: methodColor[method] ?? TX3 }}>{method}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.78rem', color: TX2 }}>{path}</span>
                <span style={{ fontSize:'0.82rem', color: TX3 }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={{ height:40 }} />
          <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>{t('dcCfgTitle')}</h3>
          <Term title=".env reference">
            <span style={{ color:'#64748B' }}># === Obrigatórias ==={'\n'}</span>
            <span style={{ color: a2 }}>ANTHROPIC_API_KEY</span>     <span style={{ color:'#64748B' }}># Claude (Petrus){'\n'}</span>
            <span style={{ color: a2 }}>GEMINI_API_KEY</span>        <span style={{ color:'#64748B' }}># Gemini (Lab Agent){'\n'}</span>
            <span style={{ color: a2 }}>DATABASE_URL</span>          <span style={{ color:'#64748B' }}># PostgreSQL connection string{'\n'}</span>
            <span style={{ color: a2 }}>JWT_SECRET</span>            <span style={{ color:'#64748B' }}># ≥32 caracteres aleatórios{'\n\n'}</span>
            <span style={{ color:'#64748B' }}># === Opcionais ==={'\n'}</span>
            <span style={{ color: a2 }}>PORT</span>                  <span style={{ color:'#64748B' }}># default: 3001{'\n'}</span>
            <span style={{ color: a2 }}>NODE_ENV</span>              <span style={{ color:'#64748B' }}># production | development{'\n'}</span>
            <span style={{ color: a2 }}>MAX_TOKENS_TUTOR</span>      <span style={{ color:'#64748B' }}># limite mensal por aluno (Petrus){'\n'}</span>
            <span style={{ color: a2 }}>MAX_TOKENS_LAB</span>        <span style={{ color:'#64748B' }}># limite mensal por aluno (Lab){'\n'}</span>
            <span style={{ color: a2 }}>INVITE_ONLY</span>           <span style={{ color:'#64748B' }}># true = cadastro só por convite</span>
          </Term>
        </SectionWrap>
      </>
    );
  };

  /* ── RESEARCHERS PAGE ── */
  const ResearchersPage = () => (
    <>
      <div style={{ paddingTop:80, background: BG }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'80px 24px 40px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'7px 14px', borderRadius:999, border:`1px solid ${a2}38`, background:`${a2}0e`, fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: a2, marginBottom:24 }}>
            <GraduationCap size={13} /> {lang==='pt' ? 'Acesso para pesquisadores' : lang==='en' ? 'Researcher access' : 'Acceso para investigadores'}
          </div>
          <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'clamp(2rem,4vw,3.2rem)', color: TX, marginBottom:16 }}>
            {lang==='pt' ? 'Materiais de pesquisa' : lang==='en' ? 'Research materials' : 'Materiales de investigación'}
          </h1>
          <p style={{ color: TX2, maxWidth:700, lineHeight:1.75, marginBottom:0 }}>
            {lang==='pt'
              ? 'Esta seção reúne os materiais detalhados da pesquisa de Iniciação Científica que originou a plataforma SCAFFL — embasamento teórico completo, referências precisas, dados brutos e análises.'
              : lang==='en'
              ? 'This section gathers the detailed materials from the undergraduate research project that originated the SCAFFL platform — complete theoretical framework, precise references, raw data and analyses.'
              : 'Esta sección reúne los materiales detallados de la investigación de iniciación científica que originó la plataforma SCAFFL — marco teórico completo, referencias precisas, datos brutos y análisis.'}
          </p>
        </div>
      </div>

      <SectionWrap bg={BG2}>
        {/* Coming soon notice */}
        <div style={{ border:`1px dashed ${a2}50`, borderRadius:18, padding:'40px 36px', background:`${a2}07`, textAlign:'center', marginBottom:48 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:`${a2}18`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Book size={22} color={a2} />
          </div>
          <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:10 }}>
            {lang==='pt' ? 'Conteúdo detalhado em preparação' : lang==='en' ? 'Detailed content in preparation' : 'Contenido detallado en preparación'}
          </h3>
          <p style={{ color: TX2, maxWidth:560, margin:'0 auto', lineHeight:1.7, fontSize:'0.95rem' }}>
            {lang==='pt'
              ? 'O pesquisador Pedro Bender Randon está organizando os materiais completos — artigos, dados brutos, análises discursivas e referências bibliográficas precisas. Esta seção será atualizada em breve.'
              : lang==='en'
              ? 'Researcher Pedro Bender Randon is organizing the complete materials — papers, raw data, discursive analyses and precise bibliographic references. This section will be updated soon.'
              : 'El investigador Pedro Bender Randon está organizando los materiales completos — artículos, datos brutos, análisis discursivos y referencias bibliográficas precisas. Esta sección se actualizará pronto.'}
          </p>
        </div>

        {/* Theoretical frameworks - already established */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:20 }}>
          {lang==='pt' ? 'Aportes teóricos' : lang==='en' ? 'Theoretical frameworks' : 'Aportes teóricos'}
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16, marginBottom:40 }}>
          {[
            { icon: GraduationCap, author:'Eduardo Mortimer', work: lang==='pt' ? 'Perfis Conceituais (2000)' : lang==='en' ? 'Conceptual Profiles (2000)' : 'Perfiles Conceptuales (2000)',
              desc: lang==='pt' ? 'Framework para analisar as formas de pensar sobre um conceito que coexistem num mesmo indivíduo ou comunidade de aprendizagem.' : lang==='en' ? 'Framework for analyzing the ways of thinking about a concept that coexist in the same individual or learning community.' : 'Marco para analizar las formas de pensar sobre un concepto que coexisten en el mismo individuo o comunidad de aprendizaje.' },
            { icon: Atom, author:'Gaston Bachelard', work: lang==='pt' ? 'Obstáculos Epistemológicos (1938)' : lang==='en' ? 'Epistemological Obstacles (1938)' : 'Obstáculos Epistemológicos (1938)',
              desc: lang==='pt' ? 'Conceito central para compreender como o pensamento cotidiano resiste à construção do conhecimento científico — base para diagnóstico da aprendizagem.' : lang==='en' ? 'Central concept for understanding how everyday thinking resists the construction of scientific knowledge — foundation for learning diagnosis.' : 'Concepto central para comprender cómo el pensamiento cotidiano resiste la construcción del conocimiento científico.' },
            { icon: Network, author:'TMCR / Sophotechnia', work: lang==='pt' ? 'Teoria da Mediação Cognitiva em Rede' : lang==='en' ? 'Network Cognitive Mediation Theory' : 'Teoría de la Mediación Cognitiva en Red',
              desc: lang==='pt' ? 'Instrumental teórico para análise das redes de mediação que emergem na interação estudante–IA–professor dentro do ambiente SCAFFL.' : lang==='en' ? 'Theoretical framework for analyzing the mediation networks that emerge in student–AI–teacher interaction within the SCAFFL environment.' : 'Marco teórico para analizar las redes de mediación que emergen en la interacción estudiante–IA–docente.' },
            { icon: Layers, author:'L. S. Vygotsky', work: lang==='pt' ? 'Zona de Desenvolvimento Proximal' : lang==='en' ? 'Zone of Proximal Development' : 'Zona de Desarrollo Próximo',
              desc: lang==='pt' ? 'Fundamento para o design do Petrus como agente de andaimamento — não fornece a resposta, mas opera na ZDP para impulsionar o estudante além do que conseguiria sozinho.' : lang==='en' ? 'Foundation for Petrus\'s design as a scaffolding agent — does not provide the answer, but operates in the ZPD to push the student beyond what they could achieve alone.' : 'Fundamento para el diseño de Petrus como agente de andamiaje — no proporciona la respuesta, sino que opera en la ZDP.' },
          ].map(({ icon: Icon, author, work, desc }) => (
            <div key={author} style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:26 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${a2}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={16} color={a2} />
                </div>
                <div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.95rem', color: TX }}>{author}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.68rem', color: a2, marginTop:2 }}>{work}</div>
                </div>
              </div>
              <p style={{ fontSize:'0.87rem', color: TX2, lineHeight:1.68, margin:0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Research paper */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>
          {lang==='pt' ? 'Produção científica' : lang==='en' ? 'Scientific output' : 'Producción científica'}
        </h3>
        <div style={{ background: PANEL, border:`1px solid ${LINE}`, borderRadius:16, padding:28, marginBottom:32 }}>
          <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, borderRadius:12, background:`${a2}14`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Quote size={18} color={a2} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: a2, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
                {lang==='pt' ? 'Artigo em desenvolvimento' : lang==='en' ? 'Article in development' : 'Artículo en desarrollo'}
              </div>
              <h4 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.1rem', color: TX, marginBottom:8 }}>From Command to Authorship: Discursive Mediation and Cognitive Driver Installation in Student–AI Interaction during Science Simulator Construction</h4>
              <p style={{ fontSize:'0.87rem', color: TX2, lineHeight:1.68, marginBottom:12 }}>
                {lang==='pt'
                  ? 'Pedro Bender Randon, Agostinho [sobrenome]. CIAGE, Universidade de Caxias do Sul. Submetido para: Research in Science Education (Springer).'
                  : lang==='en'
                  ? 'Pedro Bender Randon, Agostinho [surname]. CIAGE, University of Caxias do Sul. Submitted to: Research in Science Education (Springer).'
                  : 'Pedro Bender Randon, Agostinho [apellido]. CIAGE, Universidad de Caxias do Sul. Enviado a: Research in Science Education (Springer).'}
              </p>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.75rem', color: a2 }}>→ Research in Science Education (Springer) · 2026</div>
            </div>
          </div>
        </div>

        {/* Pilot data */}
        <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'1.3rem', color: TX, marginBottom:16 }}>
          {lang==='pt' ? 'Corpus do estudo piloto' : lang==='en' ? 'Pilot study corpus' : 'Corpus del estudio piloto'}
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:14 }}>
          {[
            { n:'19',    l: lang==='pt' ? 'estudantes (E1–E19)' : lang==='en' ? 'students (E1–E19)' : 'estudiantes (E1–E19)' },
            { n:'164',   l: lang==='pt' ? 'turnos de interação' : lang==='en' ? 'interaction turns' : 'turnos de interacción' },
            { n:'89/75', l: lang==='pt' ? 'monitoria / laboratório' : lang==='en' ? 'tutoring / laboratory' : 'tutoría / laboratorio' },
            { n:'20',    l: lang==='pt' ? 'simuladores produzidos' : lang==='en' ? 'simulators produced' : 'simuladores producidos' },
            { n:'10 dias', l: lang==='pt' ? 'duração do piloto' : lang==='en' ? 'pilot duration' : 'duración del piloto' },
            { n:'CETEC', l: lang==='pt' ? 'instituição parceira · Sala Delta 2' : lang==='en' ? 'partner institution · Delta 2 Class' : 'institución asociada · Sala Delta 2' },
          ].map(({ n, l }) => (
            <div key={l} style={{ border:`1px solid ${LINE}`, borderRadius:12, padding:'18px 16px' }}>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.5rem', background: GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{n}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.7rem', color: TX3, marginTop:5 }}>{l}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: TX3 }}>
          {lang==='pt' ? 'CETEC — Sala Delta 2 · 27 mai – 06 jun 2026 · sujeitos pseudonimizados · protocolo de pesquisa aprovado'
          : lang==='en' ? 'CETEC — Delta 2 Class · May 27 – Jun 6, 2026 · pseudonymized subjects · approved research protocol'
          : 'CETEC — Sala Delta 2 · 27 may – 06 jun 2026 · sujetos seudonimizados · protocolo de investigación aprobado'}
        </p>
      </SectionWrap>
    </>
  );

  /* ─── render ─── */
  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Space Grotesk',sans-serif", background: BG, color: TX }}>
      {/* Corner marks */}
      <Reg pos="tl" /><Reg pos="tr" /><Reg pos="bl" /><Reg pos="br" />

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', background: dark ? 'rgba(8,12,24,0.82)' : 'rgba(246,248,252,0.85)', borderBottom:`1px solid ${LINE}` }}>
        <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 24px', height:64, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          {/* Logo */}
          <button onClick={() => go('home')} style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:`${a2}1a`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FlaskConical size={16} color={a2} />
            </div>
            <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.18rem', letterSpacing:'.01em', background:'linear-gradient(135deg,#047857 0%,#10b981 25%,#06b6d4 50%,#3b82f6 75%,#8b5cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SCAFFL</span>
          </button>

          {/* Desktop nav */}
          <div style={{ display:'flex', alignItems:'center', gap:2 }}>
            {navPages.map(({ id, key }) => (
              <button key={id} onClick={() => go(id)}
                style={{ padding:'7px 14px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", fontWeight:500, fontSize:'0.9rem', background: page === id ? `${a2}18` : 'transparent', color: page === id ? a2 : TX2, transition:'all .15s' }}>
                {t(key)}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Lang */}
            <div style={{ display:'flex', border:`1px solid ${LINE}`, borderRadius:9, overflow:'hidden', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem' }}>
              {(['pt','en','es'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)} style={{ padding:'6px 9px', border:'none', cursor:'pointer', textTransform:'uppercase', fontWeight: lang===l ? 700 : 400, background: lang===l ? a2 : 'transparent', color: lang===l ? '#fff' : TX3, transition:'all .15s' }}>{l}</button>
              ))}
            </div>
            {/* Colors */}
            <div style={{ display:'flex', gap:5, alignItems:'center' }}>
              {(Object.keys(THEMES) as ThemeName[]).map(c => {
                const swatchColor = c === 'neutral'
                  ? `linear-gradient(135deg, #0F172A 50%, #FFFFFF 50%)`
                  : THEMES[c].a2;
                const isNeutral = c === 'neutral';
                return (
                  <button key={c} onClick={() => setColor(c)} title={c}
                    style={{ width:16, height:16, borderRadius:'50%', border: color===c ? '2px solid #fff' : '2px solid transparent', cursor:'pointer', background: isNeutral ? undefined : THEMES[c].a2, backgroundImage: isNeutral ? swatchColor : undefined, transform: color===c ? 'scale(1.25)' : 'scale(1)', transition:'all .15s', boxShadow: color===c ? `0 0 0 2px ${isNeutral ? '#64748B' : THEMES[c].a2}` : 'none' }} />
                );
              })}
            </div>
            {/* Mode */}
            <button onClick={() => setMode(dark ? 'light' : 'dark')} style={{ width:34, height:34, borderRadius:9, border:`1px solid ${LINE}`, background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: TX2 }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            {/* Login */}
            <button onClick={() => navigate('/login')} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', background: GRAD, color:'#fff', fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'0.88rem', boxShadow:`0 4px 16px ${a2}45` }}>
              {t('navLogin')} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Pages */}
      {page === 'home'        && <HomePage />}
      {page === 'examples'    && <ExamplesPage />}
      {page === 'about'       && <AboutPage />}
      {page === 'self'        && <SelfPage />}
      {page === 'docs'        && <DocsPage />}
      {page === 'researchers' && <ResearchersPage />}

      {/* Footer */}
      <footer style={{ background: dark ? '#060A14' : '#EEF2F8', borderTop:`1px solid ${LINE}`, padding:'56px 24px 36px' }}>
        <div style={{ maxWidth:1160, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:32, flexWrap:'wrap', marginBottom:40 }}>
            <div style={{ maxWidth:280 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <FlaskConical size={16} color={a2} />
                <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:'1.05rem', background:'linear-gradient(135deg,#047857 0%,#10b981 25%,#06b6d4 50%,#3b82f6 75%,#8b5cf6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SCAFFL</span>
              </div>
              <p style={{ fontSize:'0.88rem', color: TX2, lineHeight:1.7, margin:0 }}>{t('ftTagline')}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: TX3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{t('ftResearcher')}</div>
                <div style={{ fontWeight:700, color: TX, marginBottom:4 }}>Pedro Bender Randon</div>
                <div style={{ fontSize:'0.82rem', color: TX2 }}>{t('ftInst')}</div>
              </div>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'0.67rem', color: TX3, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{t('ftAdvisor')}</div>
                <div style={{ fontWeight:700, color: TX, marginBottom:4 }}>Prof. Dr. Agostinho</div>
                <div style={{ fontSize:'0.82rem', color: TX2 }}>{t('ftInst')}</div>
              </div>
            </div>
          </div>
          <div style={{ paddingTop:24, borderTop:`1px solid ${LINE}`, display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap', fontFamily:"'JetBrains Mono',monospace", fontSize:'0.72rem', color: TX3 }}>
            <span>© 2026 SCAFFL Platform · {t('ftRights')}</span>
            <span>{t('ftVersion')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
