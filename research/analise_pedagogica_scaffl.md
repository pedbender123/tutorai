# Relatório de Análise Pedagógica e Epistemológica — Projeto Scaffl

Este relatório apresenta uma análise qualitativa aprofundada das interações dos estudantes na plataforma Scaffl (AVA e Laboratório de Simuladores), com base no corpus real de dados extraídos da VPS de produção. 

Para a fundamentação teórica, aplicamos os referenciais de **Gaston Bachelard** (Perfis e Obstáculos Epistemológicos), **Eduardo Mortimer** (Perfis Conceituais), **Gérard Vergnaud / Marco Antonio Moreira** (Teoria dos Campos Conceituais e Modelos Mentais - TMC), **Lev Vygotsky / Mikhail Bakhtin** (Interação Discursiva e Mediação Semiótica) e a **Análise Textual Discursiva (ATD)** de Roque Moraes e Maria do Carmo Galiazzi.

---

## 1. Introdução e Procedimento Metodológico (ATD)

A **Análise Textual Discursiva (ATD)** é uma abordagem de análise qualitativa de dados textuais que transita entre a análise de conteúdo e a análise de discurso. Ela se desenvolve em um movimento cíclico composto por três etapas fundamentais:

1. **Unitarização:** Desmontagem do corpus de 164 interações (89 de monitoria e 75 de laboratório) em unidades de significado isoladas (declarações, perguntas, comandos de simulação).
2. **Categorização:** Agrupamento dessas unidades em três categorias emergentes que representam as dinâmicas de transição conceitual dos alunos e suas interações com as IAs (Petrus e Lab Agent).
3. **Captura do Novo Emergente:** A elaboração deste metatexto que articula os referenciais teóricos aos dados reais.

---

## 2. Perfis Epistemológicos (Bachelard) e Perfis Conceituais (Mortimer)

Os dados revelam uma transição marcante nas formas de pensar dos estudantes à medida que interagem com o Laboratório de Simuladores. Analisamos essa evolução sob a ótica da ruptura com o senso comum.

```
Zonas do Perfil Conceitual (Mortimer) vs. Perfis Epistemológicos (Bachelard):

[Senso Comum / Substancialista] ──> [Realismo Ingênuo / Empirista] ──> [Modelo Racionalista / Científico]
  "A bolacha ficou mole"             "A ferrugem corrói o ferro"         "Geometria molecular do CO2"
  (Franco Augusto)                   (Pedro Henrique)                    (Thales Fachin)
```

### 2.1. A Zona Substancialista e o Obstáculo do Realismo Ingênuo
Gaston Bachelard aponta o **substancialismo** (atribuição de propriedades macroscópicas ocultas às substâncias) e o **realismo ingênuo** (aceitar as coisas como aparecem aos sentidos) como fortes obstáculos epistemológicos no ensino de Ciências.
* **Caso Franco Augusto:** Ao solicitar um simulador para *"Simular as partículas de uma bolacha que era sólida e depois de ficar molhada ficou mole"*, o estudante traz um fenômeno cotidiano, pautado na percepção sensorial ("ficar mole"). A tentativa de transpor a sensação de "moleza" para o nível microscópico de partículas denota uma tensão entre a zona substancialista de seu perfil conceitual e a necessidade de modelagem científica.
* **Caso Pedro Henrique ("Fábrica da Ferrugem"):** Em seu prompt inicial, o estudante define a ferrugem como algo que simplesmente *"aparece gradualmente sobre o metal, mudando sua cor de cinza para marrom-avermelhada"*. O foco inicial é puramente fenomenológico (realismo ingênuo da mudança de cor). 

### 2.2. A Transição para a Zona Racionalista e o Racionalismo Aplicado
Eduardo Mortimer defende que aprender Ciência não é substituir o senso comum pelo conceito científico, mas sim desenvolver um **Perfil Conceitual** multi-zonal, sabendo em qual contexto aplicar cada zona.
* **Caso Thales Fachin:** Demonstra um perfil conceitual fortemente ancorado na zona racionalista clássica/científica ao demandar representações abstratas e micro-estruturais:
  > *"Em uma área de 2 centímetros com 25 moléculas faça uma ilustração do limite atômico, no qual as moléculas são repelidas com mais força quanto mais perto chegam entre si, ou seja onde não se encostam."*
  Aqui, o estudante supera o obstáculo da continuidade da matéria e exige da IA a representação física de campos de força eletrostática repulsiva (modelo de esferas duras ou potenciais de Lennard-Jones), demonstrando raciocínio dedutivo abstrato.
* **Caso Vitor:** Ao questionar se o simulador de estados da água *"é considerado uma matéria de química?"*, ele busca situar epistemologicamente a sua modelagem microscópica (fenômeno de transição de fase macro vs. movimento cinético micro), ensaiando uma categorização racionalista da natureza física/química do fenômeno.

---

## 3. Análise dos Modelos Mentais e Campos Conceituais (TMC)

A **Teoria dos Modelos Mentais** (Johnson-Laird; Greca & Moreira) descreve que sujeitos constroem representações internas análogas, de caráter funcional e provisório, para compreender e prever fenômenos físicos. Já a **Teoria dos Campos Conceituais** de Gérard Vergnaud foca nos esquemas causais e na ação do estudante.

### 3.1. Relações Causais Lineares e Complexas
Os estudantes articulam variáveis buscando representar a causalidade física em seus simuladores:
* **Caso Santiago Canal:** O aluno esquematiza uma causalidade direta:
  > *"À medida que a temperatura aumenta, as partículas devem se mover mais rapidamente, ocorrer mais colisões efetivas e a reação deve acontecer em menos tempo."*
  Este esquema mental reflete a teoria das colisões atômicas de forma correta e funcional. O simulador funciona como uma ancoragem física para o seu modelo mental, permitindo-lhe testar visualmente se o aumento da taxa de colisões/segundo de fato diminui o tempo de reação.

### 3.2. A Instrumentalização do Modelo Mental
Muitas vezes, o modelo mental do estudante é rico, mas ele carece de ferramentas matemáticas ou de programação para expressá-lo. O Laboratório Scaffl age como um **instrumento mediador**. A IA traduz o modelo mental analógico do aluno (expressado em linguagem natural) em um modelo conceitual visualmente testável.
* No caso do elemento químico reativo de **Anthoni de Quadros**, seu modelo mental de Tabela Periódica não era uma tabela estática de livro, mas um banco de dados dinâmico de fichas informativas. O Scaffl materializou esse esquema quando o aluno pediu para *"fazer a assimilação do número com seu elemento na tabela periódica"*, convertendo o seu esquema cognitivo em uma aplicação web reativa.

---

## 4. Análise Bakhtiniana e Vygotskyana da Construção Discursiva (Díade)

A construção do conhecimento na plataforma Scaffl não é individual; ela ocorre em uma **díade dialogicamente constituída** entre o Estudante e a IA (o Petrus no chat ou o Lab Agent no editor).

### 4.1. Mediação Semiótica e Zona de Desenvolvimento Proximal (ZDP) — Vygotsky
Vygotsky postula que o aprendizado ocorre na ZDP através da assistência de um parceiro mais capaz (mediação). O tutor virtual **Petrus** foi programado para atuar estritamente dessa forma (scaffolding/andaimes cognitivos):

> **Estudante (Pedro Henrique):** *"Copie e cole exatamente isto no Scaffl: [Insere prompt gigante]"*
>
> **Tutor Petrus:** *"[...] O Laboratório de Simuladores do Scaffl funciona um pouco diferente, sabe? A gente vai construindo o simulador com a IA em etapas, como se fosse um quebra-cabeça. [...] Para começar com essa ideia da ferrugem, que tal pensarmos no fenômeno principal? Qual o fenômeno físico ou químico exato que você quer que a IA comece a esboçar?"*

O Petrus **não entrega a resposta** nem realiza o trabalho pelo aluno. Em vez disso, rebaixa a complexidade da tarefa (chunking), mantendo o controle metacognitivo e forçando o estudante a verbalizar o conceito químico fundamental (*"reação de oxirredução"*). O Petrus atua como o mediador cultural que puxa o estudante do nível de desenvolvimento real (o desejo de copiar e colar) para o nível de desenvolvimento potencial (a modelagem sistemática por partes).

### 4.2. Polifonia e Apropriação do Discurso Científico — Bakhtin
Bakhtin fala sobre a apropriação da palavra alheia: o nosso discurso é sempre povoado por vozes de outros. Nas conversas do Scaffl, observamos uma **polifonia discursiva**:
1. **A voz pragmática do estudante** (focada em fazer o simulador funcionar rapidamente).
2. **A voz científica/pedagógica do Petrus** (focada em conceitos, rigor e andaimamento).
3. **A voz instrumental do Lab Agent** (focada em código e representação visual).

Observamos o dialogismo quando o estudante, após ser orientado pelo Petrus, passa a formular prompts com maior rigor científico para o Lab Agent. Pedro Henrique começa pedindo "uma barra exposta" e termina redigindo termos precisos de engenharia de software e química de colisões: *"Quando os valores dos sliders aumentarem, as partículas devem se movimentar mais rapidamente e colidir com maior frequência contra a barra de ferro"*. Há uma clara **apropriação discursiva** do linguajar de modelagem fornecido pelo tutor.

---

## 5. Metatexto de Categorias Emergentes (ATD)

A partir da unitarização e categorização, emergiram três metatextos compreensivos:

### Categoria A: A Modelagem Microscópica como Ruptura Epistemológica
A maioria das propostas de simuladores partiu de ideias microscópicas de representação de partículas (difusão, velocidade de reações, movimento browniano, repulsão molecular). Isso indica que a plataforma Scaffl incentiva o estudante a buscar explicações fora do nível fenomenológico macroscópico direto, exigindo a transição para a zona racionalista do perfil conceitual. A visualização de partículas em movimento atua como um facilitador de rupturas bachelardianas com a percepção visual imediata.

### Categoria B: O Andaimamento Cognitivo como Moderador de Frustração
Muitas interações no Laboratório começaram com frustração ou falhas (ex: Santiago tentando repetidamente colocar partículas, ou Anthoni pedindo para "refazer totalmente"). A atuação do Petrus como assistente pedagógico que divide o problema em pequenas metas ajudou a manter os estudantes na tarefa, indicando que a ausência de uma camada pedagógica ativa em ambientes de IA de geração de código tende a gerar abandono do aluno por sobrecarga cognitiva.

### Categoria C: O Dialogismo Técnico-Científico
Os alunos demonstraram que o ato de programar um simulador por meio de linguagem natural com a IA os obrigou a organizar seus discursos científicos. Para instruir a máquina a desenhar um fenômeno, o estudante precisa primeiro explicitar as leis que regem aquele fenômeno (se a temperatura aumenta, o que acontece com a velocidade e o tempo?). A IA funciona, portanto, como um espelho discursivo da clareza conceitual do próprio estudante.

---

## 6. Análise das Apresentações e Observações Empíricas (Crítica de Modelos e Mediação Real)

As observações empíricas colhidas durante as apresentações dos grupos trazem dados altamente significativos sobre a relação dos estudantes com a tecnologia e a teoria química. Analisamos estes relatos sob três dimensões teóricas fundamentais:

### 6.1. Ruptura com o "Realismo Tecnológico" e a Capacidade de Crítica ao Modelo (Greca & Moreira / Bachelard)
Um ponto crítico observado foi que o mau funcionamento do simulador ou problemas de renderização nos dispositivos móveis (celulares/tablets) não impediram o processo de aprendizagem. Pelo contrário:
* **Crítica de Modelos (TMC):** Na teoria de Greca e Moreira, o sucesso do uso de um modelo conceitual (o simulador) não é medido por ele rodar de forma "perfeita", mas sim se o estudante consegue confrontar o modelo gerado com o seu **modelo mental de referência**. Os alunos mostraram reter um conhecimento teórico superior ao que o simulador demonstrava. Ao apontarem as inconsistências físicas e matemáticas do simulador gerado pela IA, os alunos agiram como **críticos de modelos**.
* **Superação do Obstáculo Técnico (Bachelard):** Em vez de aceitarem a simulação computacional de forma passiva (o que seria um *realismo ingênuo tecnológico*), os alunos usaram o racionalismo científico para identificar as falhas da IA. A imperfeição do software atuou como um catalisador para que verbalizassem a física/química correta por trás da tela quebrada, quebrando a ilusão de que o simulador é a verdade absoluta.

### 6.2. Densidade Conceitual vs. Complexidade Estética: A Mediação Semiótica do Gloss (Vygotsky)
A observação sobre o grupo que desenvolveu o simulador de gloss labial que alterava de tom dependendo do usuário e da hora do dia ilustra a teoria de **mediação semiótica** de Vygotsky:
* **Simplicidade Estética, Riqueza Conceitual:** O simulador não tinha grande sofisticação técnica ou visual. No entanto, ele serviu de instrumento semiótico mediador para que o grupo compreendesse relações químicas e termodinâmicas sutis (as variações do pH e temperatura labial das pessoas alterando o equilíbrio químico de indicadores de cor, aliadas à percepção luminosa da hora do dia).
* Isso comprova que a eficácia pedagógica de um simulador não reside no fetiche da complexidade computacional ou visual 3D, mas sim no seu **potencial de ancoragem de conceitos**. Um desenho esquemático simples na tela é suficiente para disparar a organização mental e a verbalização de conceitos científicos complexos.

### 6.3. Internalização Conceitual e a Apropriação Coletiva do Discurso (Vygotsky / Bakhtin)
O caso do estudante que adoeceu, não pôde codificar ativamente e viu o simulador funcionar pela primeira vez na apresentação, mas explicou perfeitamente o seu objetivo e funcionamento conceitual, é um exemplo clássico de:
* **Construção Conceitual Coletiva (Díade):** Embora o estudante estivesse afastado do desenvolvimento técnico devido à saúde e a problemas da plataforma, o processo de construção conceitual ocorreu no nível social/interpsicológico (discussões do grupo anteriores ao código, planejamento conceitual, trocas discursivas sobre o que pretendiam representar). 
* **Do Interpsicológico para o Intrapsicológico (Vygotsky):** O estudante já havia internalizado o modelo físico/químico através da mediação social do grupo. O simulador apresentado serviu meramente como um **gatilho semiótico externo** que ativou o seu modelo mental intrapsicológico prévio.
* **Bakhtin e a Voz do Grupo:** O estudante foi capaz de se apropriar da voz científica do seu grupo de forma imediata porque partilhava do mesmo campo semântico e conceitual. Ele não precisou "aprender" olhando para o software na hora; o software era apenas a materialização física de um discurso que já era dele e do grupo.
