# Relatório de Análise Pedagógica e Epistemológica — Projeto Scaffl
*Nota Ética e Metodológica preliminar: O presente documento destina-se a fins de desenvolvimento, ajuste tecnológico-pedagógico da plataforma e planejamento de pesquisa. A publicação definitiva de dados empíricos de pesquisa científica aguarda a homologação do Comitê de Ética em Pesquisa (CEP) correspondente e a formalização dos Termos de Consentimento Livre e Esclarecido (TCLE) e Termos de Assentimento Livre e Esclarecido (TALE) junto aos participantes menores de idade e seus responsáveis. Todos os sujeitos foram pseudonimizados neste relatório.*

Este relatório apresenta uma análise qualitativa das interações dos estudantes na plataforma Scaffl (ambiente virtual de aprendizagem e laboratório de simuladores), com base em dados de monitoria e logs de desenvolvimento. 

Para a fundamentação teórica, aplicamos os referenciais de **Gaston Bachelard** (Perfis e Obstáculos Epistemológicos), **Eduardo Mortimer** (Perfis Conceituais), a **Teoria da Mediação Cognitiva em Redes (TMC)**, a **Teoria dos Modelos Mentais** (Johnson-Laird; Greca & Moreira), a **Teoria dos Campos Conceituais (TCC)** (Vergnaud), **Lev Vygotsky / Mikhail Bakhtin** (Interação Discursiva e Mediação Semiótica) e a **Análise Textual Discursiva (ATD)** de Roque Moraes e Maria do Carmo Galiazzi.

---

## 1. Introdução e Procedimento Metodológico (ATD)

A **Análise Textual Discursiva (ATD)** é uma abordagem de análise qualitativa de dados textuais que se desenvolve em um movimento composto por três etapas fundamentais:

1. **Unitarização:** Desmontagem do corpus de 164 interações (89 de monitoria no chat e 75 no laboratório de código) em unidades de significado isoladas. A partir da análise criteriosa do recorte textual de diálogos focados no domínio químico e na modelagem, foram isoladas **42 unidades de significado** relevantes.
2. **Categorização:** Agrupamento dessas unidades em categorias emergentes. Para garantir o rigor e a auditabilidade metodológica, a categorização foi conduzida por meio de validação intersubjetiva (processo de categorização independente e posterior cruzamento de acordos entre pesquisadores).
3. **Captura do Novo Emergente:** A elaboração deste metatexto compreensivo articulando a teoria e os achados das interações.

---

## 2. Perfis Epistemológicos (Bachelard) e Perfis Conceituais (Mortimer)

Os dados revelam uma transição marcante nas formas de pensar dos estudantes à medida que interagem com a plataforma. Analisamos essa evolução sob a ótica da ruptura com o senso comum.

```
Zonas do Perfil Conceitual (Mortimer) vs. Perfis Epistemológicos (Bachelard):

[Senso Comum / Substancialista] ──> [Realismo Ingênuo / Empirista] ──> [Modelo Racionalista / Científico]
     Estudante A (E1)                     Estudante B (E2)                     Estudante C (E3)
  "A bolacha ficou mole"             "A ferrugem corrói o ferro"         "Geometria molecular do CO2"
```

### 2.1. A Zona Substancialista e o Obstáculo do Realismo Ingênuo
Gaston Bachelard aponta o **substancialismo** (atribuição de propriedades macroscópicas e sensoriais às substâncias) e o **realismo ingênuo** (aceitar as coisas como aparecem de imediato aos sentidos) como fortes obstáculos epistemológicos no ensino de Ciências.
* **Caso do Estudante A (E1):** Ao solicitar um simulador para *"Simular as partículas de uma bolacha que era sólida e depois de ficar molhada ficou mole"*, o estudante tenta transpor uma propriedade tátil ("ficar mole") para o nível microscópico de modelagem de partículas. Isso demonstra a tensão de transição de seu perfil conceitual entre a zona substancialista e a necessidade de abstração molecular.
* **Caso do Estudante B (E2) ("Fábrica da Ferrugem"):** Em seu prompt inicial, o estudante foca na dimensão puramente fenomenológica (realismo ingênuo da mudança de cor): a ferrugem é apenas algo que *"aparece gradualmente sobre o metal, mudando sua cor de cinza para marrom-avermelhada"*.

### 2.2. A Transição para a Zona Racionalista e o Racionalismo Aplicado
Eduardo Mortimer defende que aprender Ciência envolve desenvolver um **Perfil Conceitual** multi-zonal, capacitando o sujeito a acessar a zona conceitual mais adequada a cada contexto.
* **Caso do Estudante C (E3):** Demonstra um perfil conceitual fortemente ancorado na zona racionalista científica ao demandar representações abstratas e micro-estruturais de campos de força repelentes:
  > *"Em uma área de 2 centímetros com 25 moléculas faça uma ilustração do limite atômico, no qual as moléculas são repelidas com mais força quanto mais perto chegam entre si, ou seja onde não se encostam."*
  Aqui, o estudante supera o obstáculo da continuidade da matéria e exige da IA a representação física de forças de repulsão intermolecular.
* **Caso do Estudante D (E4):** Ao questionar se o simulador de estados da água *"é considerado uma matéria de química?"*, ele busca delimitar epistemologicamente as fronteiras da sua modelagem física de transições de fase.

---

## 3. Análise dos Modelos Mentais e Campos Conceituais (TMC-MM)

A **Teoria dos Modelos Mentais** (Johnson-Laird; Greca & Moreira) e a **Teoria dos Campos Conceituais (TCC)** (Vergnaud) enfocam em como os sujeitos constroem esquemas cognitivos internos (representações análogas de caráter funcional) para interpretar, simular e predizer fenômenos no mundo real.

### 3.1. Relações Causais Lineares e Complexas
Os estudantes articulam variáveis dinâmicas buscando representar a causalidade física em seus simuladores:
* **Caso do Estudante E (E5):** O aluno esquematiza uma causalidade termodinâmica direta:
  > *"À medida que a temperatura aumenta, as partículas devem se mover mais rapidamente, ocorrer mais colisões efetivas e a reação deve acontecer em menos tempo."*
  Este esquema mental reflete a teoria das colisões moleculares de forma correta e funcional. O simulador atua como âncora representacional para que o estudante valide e execute seu modelo mental interno.

### 3.2. A Instrumentalização do Modelo Mental
Muitas vezes, o modelo mental qualitativo do estudante é rico, mas ele carece de ferramentas de programação para expressá-lo. O laboratório do Scaffl age como um **instrumento de mediação**. A IA traduz o modelo mental expresso em linguagem natural em um modelo conceitual executável (o simulador de Tabela Periódica reativa do **Estudante F (E6)**, por exemplo, que mapeia dinamicamente fichas científicas por número atômico).

---

## 4. Teoria da Mediação Cognitiva em Redes (TMC) e Mediação Discursiva (Díade)

A aprendizagem na plataforma ocorre na dinâmica socio-técnica da díade constituída entre o Estudante e as ferramentas de inteligência artificial: o **Tutor Pedagógico Virtual (Petrus)** no chat do ambiente e o **Agente de Código (Lab Agent)** no editor.

### 4.1. A IA como Mediador Extracerebral (TMC)
Diferente das teorias cognitivas internas, a **Teoria da Mediação Cognitiva em Redes (TMC)** postula que os agentes baseados em IA atuam como **mediadores extracerebrais**. Eles atenuam a carga de processamento na memória de trabalho do sujeito. O Agente de Código (Lab Agent) atua como um parceiro que assume a sintaxe da programação de software, liberando o estudante para focar exclusivamente nos parâmetros científicos do fenômeno químico a ser representado.

### 4.2. Mediação Semiótica e Zona de Desenvolvimento Proximal (ZDP) — Vygotsky
Vygotsky postula que a aprendizagem ocorre na ZDP através da mediação. O **Tutor Pedagógico Virtual (Petrus)** foi modelado para atuar nesta zona por meio do método socrático de andaimamento (*scaffolding*):

> **Estudante B (E2):** *"Copie e cole exatamente isto no Scaffl: [Prompt volumoso com regras de simulação]"*
>
> **Tutor Pedagógico Virtual (Petrus):** *"[...] O Laboratório de Simuladores do Scaffl funciona de um jeito um pouco diferente. A gente vai construindo o simulador com a IA em etapas, como se fosse um quebra-cabeça. [...] Para começar com essa ideia da ferrugem, que tal pensarmos no fenômeno principal? Qual o fenômeno físico ou químico exato que você quer que a IA comece a esboçar?"*

O Petrus rebaixa a complexidade da tarefa, forçando o estudante a verbalizar e isolar o conceito de *"oxirredução"*, atuando como mediador cultural que direciona o estudante a construir de forma incremental.

### 4.3. Polifonia e Apropriação do Discurso Científico — Bakhtin
Em termos bakhtinianos, há uma heteroglossia discursiva na plataforma: a voz pragmática do estudante cruza-se com a voz pedagógica do Petrus e a voz técnica do Lab Agent. Observamos o dialogismo quando o estudante incorpora as palavras e os termos científicos da IA pedagógica ao instruir o robô gerador de código (o Estudante B (E2) abandona expressões vagas de "barra exposta" e passa a comandar: *"as partículas devem colidir com maior frequência e a ferrugem deve se formar pela reação de oxirredução"*).

---

## 5. Metatexto de Categorias Emergentes (ATD)

A partir da unitarização e categorização intersubjetiva, emergiram quatro categorias compreensivas:

### Categoria A: A Modelagem Microscópica como Ruptura Epistemológica
A análise revelou que **70%** (14 de 20) das propostas de simuladores construídas ativamente pelos estudantes no laboratório partiram de ideias de representação molecular (difusão, velocidade de reações, movimento browniano, atração/repulsão). Isso indica que a modelagem no Scaffl induz a ruptura com a percepção visual do senso comum (estática) e atrai a cognição para a zona racionalista do perfil conceitual.

### Categoria B: O Andaimamento Cognitivo como Moderador de Sobrecarga Cognitiva
A análise das interações em momentos de falhas de compilação ou códigos incompletos sugere que a presença da mediação pedagógica estruturada do Petrus atuou mitigando a frustração do estudante. A literatura de sobrecarga cognitiva (Sweller) indica que a ausência de uma camada instrucional ou de andaimamento na interação com ferramentas de IA geradoras de código pode sobrecarregar a memória de trabalho do estudante e induzir à desistência da atividade.

### Categoria C: O Dialogismo Técnico-Científico
Os alunos demonstraram que o ato de programar um simulador por meio de linguagem natural com a IA os obrigou a organizar seus discursos científicos. Para instruir a máquina a desenhar um fenômeno, o estudante precisa primeiro explicitar as leis que regem aquele fenômeno (se a temperatura aumenta, o que acontece com a velocidade e o tempo?). A IA funciona, portanto, como um espelho discursivo da clareza conceitual do próprio estudante.

### Categoria D: O Estudante como Crítico de Modelos da IA (Ruptura com o Realismo Tecnológico)
Esta categoria revela que as falhas de hardware ou bugs na renderização visual geraram interações ricas. Em vez de aceitarem a representação gerada pela IA de forma passiva (realismo ingênuo), os estudantes adotaram uma postura ativa de crítica científica. Eles identificaram as inconsistências matemáticas e físicas de agitação de partículas nos simuladores a partir de seus modelos mentais de referência, demonstrando que o erro técnico da IA pode ser um catalisador para a verbalização e validação de conceitos científicos.

---

## 6. Análise das Apresentações e Observações Empíricas (Dados das Bancas)

As observações empíricas colhidas durante as bancas de apresentações reais dos grupos consolidam os achados das interações em quatro pilares analíticos:

### 6.1. O Erro da IA como Dispositivo Pedagógico Produtivo
Conforme mapeado na Categoria D, o fato de os simuladores apresentarem falhas de compilação ou problemas de carregamento gráfico em celulares/tablets não inibiu a aprendizagem. Os alunos souberam justificar e demonstrar oralmente conhecimentos conceituais que superavam o renderizado nas telas, apontando com precisão as contradições do código gerado pelo Lab Agent. A IA comete erros e o erro é transformado pelos estudantes em oportunidade de defesa conceitual científica.

### 6.2. Densidade Conceitual vs. Estética: O Caso do Gloss
O grupo que projetou o simulador de gloss labial que alterava de cor conforme o pH e a temperatura do usuário e luz do dia ilustra a mediação semiótica simples. O projeto não apresentava complexidade técnica visual ou fotorrealismo 3D, mas serviu de ancoragem semiótica ideal para debater termodinâmica corporal, reações de equilíbrio químico e luz ambiente. Isso indica que a utilidade do simulador de IA na aprendizagem reside no seu potencial de explorar causalidades físicas/químicas de variáveis e não em sua complexidade visual.

### 6.3. Internalização e Apropriação Coletiva do Discurso (O Aluno Ausente)
O caso do estudante que esteve doente nos dias de desenvolvimento do código, não pôde programar ativamente e viu o simulador funcionar pela primeira vez na apresentação, mas soube defender com absoluto domínio conceitual a física do simulador da sua equipe, ilustra a internalização vygotskyana. O conceito científico e as relações de causa e efeito do simulador foram apropriados pelo aluno no plano social (interpsicológico) no período de discussões prévias com o grupo. O simulador concreto na tela atuou apenas como gatilho material externo para verbalização de uma representação mental que já estava internalizada de antemão.
