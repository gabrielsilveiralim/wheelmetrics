# WheelMetrics --- SPEC

**Status:** Especificação funcional do protótipo\
**Produto:** WheelMetrics\
**Contexto:** Priorização de manutenção de rodeiros ferroviários

## 1. Objetivo do produto

O WheelMetrics é um protótipo de apoio à decisão para priorizar a
avaliação e a manutenção de rodeiros ferroviários. A interface consolida
sinais técnicos por rodeiro em um indicador de condição (ICA), apresenta
a prioridade resultante e ajuda a equipe a identificar quais casos
exigem atenção primeiro.

O sistema deve facilitar a leitura operacional: visão resumida da frota,
composição do trem, identificação dos vagões com maior criticidade e
consulta aos detalhes técnicos de cada rodeiro.

> O ICA apresentado no protótipo é calculado pelas regras e pelos dados
> implementados na aplicação. Não deve ser apresentado como indicador
> oficial homologado sem validação técnica.

## 2. Objetivos da experiência

-   Entender rapidamente a situação geral da frota.
-   Visualizar locomotiva e vagões em uma composição horizontal.
-   Identificar vagões e rodeiros prioritários sem depender de uma lista
    extensa de cartões de vagões.
-   Abrir os detalhes de um vagão e consultar seus quatro rodeiros.
-   Abrir os detalhes de um rodeiro crítico, entender os sinais que
    contribuíram para sua classificação e consultar sua decisão
    sugerida.
-   Preservar a lógica de cálculo, os critérios operacionais e os
    indicadores existentes durante melhorias visuais.

## 3. Estrutura principal da interface

### 3.1 Indicadores (KPIs)

Manter a seção atual de KPIs sem alteração de conteúdo ou de
comportamento nesta etapa. Ela apresenta os indicadores resumidos já
existentes, incluindo contagem de vagões e rodeiros e os indicadores
operacionais de decisão/priorização.

Não adicionar novos KPIs nem recalcular os indicadores como parte de uma
tarefa exclusivamente visual.

### 3.2 Composição do trem

A frota deve ser apresentada como uma composição ferroviária visual:
locomotiva seguida pelos vagões, organizados em uma faixa horizontal.

Requisitos: - A composição deve ser a representação principal da frota;
não criar uma segunda grade ou lista independente de cartões de
vagões. - Cada vagão deve ter aparência reconhecível de vagão
ferroviário, com carroceria, estrutura inferior, rodas e detalhes
visuais coerentes. - O desenho deve ter acabamento industrial,
alinhamento consistente, espaçamento claro e hierarquia visual
legível. - A criticidade do vagão deve ser comunicada visualmente sem
comprometer a leitura do desenho. - A composição deve permitir navegação
horizontal quando não couber na largura disponível. - O vagão deve
continuar sendo clicável e abrir seu modal de detalhes. - A visualização
deve manter boa legibilidade em diferentes larguras de tela.

### 3.3 Modal do vagão

Ao selecionar um vagão na composição, abrir o modal correspondente.

O modal deve: - Identificar claramente o vagão selecionado. - Apresentar
os quatro rodeiros associados a esse vagão. - Mostrar os dados e os
estados já fornecidos pela aplicação, sem inventar campos ou valores. -
Permitir a seleção de um rodeiro para abrir seus detalhes, se esse
comportamento já estiver disponível no fluxo atual.

### 3.4 Matriz de rodeiros críticos

A matriz deve listar apenas os rodeiros considerados críticos pela regra
existente: ICA inferior a 40 e prioridade classificada como `critico`.

Requisitos: - Manter os dados e a ordenação existentes. - Cada linha
deve permitir abrir o modal de detalhes do rodeiro. - Não ampliar o
escopo da matriz para incluir rodeiros médios ou de baixa prioridade
nesta etapa.

### 3.5 Modal do rodeiro

O modal de detalhes do rodeiro deve preservar os campos atualmente
implementados, incluindo, quando disponíveis nos dados: - Vagão, posição
e identificação técnica. - ICA, prioridade e decisão sugerida. -
Quilometragem (KM), friso, acústica, impacto e hot box. -
Condição/classificação individual de KM, friso, acústica, impacto e hot
box. - Problemas identificados. - Visualização do trem e de seus vagões,
destacando o vagão do rodeiro selecionado.

A apresentação pode ser refinada visualmente, mas não deve remover
informações existentes nem alterar sua semântica.

## 4. Regras de negócio de referência

Os valores abaixo registram as regras do protótipo e devem ser
preservados em mudanças exclusivamente visuais.

### 4.1 Parâmetros de referência

  Parâmetro                                       Valor atual
  --------------------------------------------- -------------
  KM --- faixa de atenção                             250.000
  KM --- faixa crítica                                300.000
  Friso --- limite superior                              24,1
  Friso --- limite inferior                              22,1
  Impacto --- atenção                                     220
  Impacto --- crítico                                     250
  ICA --- classificação crítica                            40
  ICA --- referência para classificação média              70
  Peso de KM                                             0,25
  Peso de friso                                          0,30
  Peso acústico                                          0,15
  Peso de impacto                                        0,15
  Peso de hot box                                        0,15

### 4.2 Classificação por ICA

-   **Crítico:** ICA menor que 40.
-   **Médio:** ICA maior ou igual a 40 e menor que 70.
-   **Baixo:** ICA maior ou igual a 70.

### 4.3 Decisão sugerida

-   **ICA menor que 40:** "Abrir nota" --- tipo `nota`.
-   **ICA menor que 60, mas não inferior a 40:** "Programar / avaliar"
    --- tipo `avaliar`.
-   **ICA igual ou superior a 60:** "Não abrir agora" --- tipo `normal`.

A decisão sugerida é uma regra do protótipo e não substitui
procedimentos, inspeções ou decisões operacionais oficiais.

### 4.4 Indicadores operacionais configurados

  Indicador      Valor atual
  ------------ -------------
  Backlog             22.000
  Surgimento             630
  Troca                  596

Preservar os valores e a forma de apresentação existentes na seção de
KPIs durante a etapa de refinamento visual. Confirmar com a área
responsável o significado, a unidade e o período de referência antes de
reutilizar esses números fora do contexto do protótipo.

## 5. Interações essenciais

1.  A pessoa usuária visualiza os KPIs atuais.
2.  Visualiza a composição horizontal da locomotiva e dos vagões.
3.  Seleciona um vagão para abrir seus detalhes e consultar seus quatro
    rodeiros.
4.  Seleciona um rodeiro crítico na matriz para abrir o modal técnico.
5.  No modal, consulta os parâmetros, as condições, os problemas
    identificados e a decisão sugerida.
6.  Na visualização do trem dentro do modal, identifica o vagão
    correspondente ao rodeiro selecionado.

As interações existentes devem continuar funcionando após alterações de
layout, CSS ou desenho dos vagões.

## 6. Requisitos visuais e de usabilidade

-   Aparência industrial, técnica e contemporânea, adequada a uma
    ferramenta de manutenção ferroviária.
-   Hierarquia visual clara entre KPIs, composição do trem, criticidade
    e detalhes técnicos.
-   Estados críticos, médios e baixos distinguíveis, sem depender
    exclusivamente da cor.
-   Tipografia legível, contraste suficiente e rótulos objetivos.
-   Desenhos dos vagões consistentes entre si e alinhados à composição.
-   Área clicável dos vagões clara e previsível.
-   Modais legíveis, com agrupamento lógico das informações técnicas.
-   Layout responsivo, sem sobreposição de dados ou perda das
    interações.
-   Não introduzir elementos decorativos que concorram com os dados
    operacionais.

## 7. Restrições de implementação

-   Preservar as regras de cálculo do ICA, os limites, os pesos e as
    decisões sugeridas.
-   Preservar os dados e os campos existentes.
-   Preservar a seção de KPIs.
-   Preservar a matriz de rodeiros críticos e sua regra de filtragem.
-   Preservar os modais e seus fluxos de abertura.
-   Não criar uma grade/lista separada de vagões.
-   Não alegar que o protótipo está homologado ou que o ICA é oficial
    sem validação.
-   Nesta especificação, a melhoria principal da interface é o
    refinamento visual da composição ferroviária e dos vagões, sem
    alteração da lógica de negócio.

## 8. Critérios de aceite

A implementação atende a esta especificação quando:

-   [ ] A seção atual de KPIs permanece inalterada.
-   [ ] A locomotiva e os vagões aparecem em uma única composição
    horizontal.
-   [ ] Não existe uma grade ou lista paralela de cartões de vagões.
-   [ ] Os vagões têm desenho industrial mais consistente e visualmente
    refinado.
-   [ ] Clicar em um vagão abre o modal correto com seus quatro
    rodeiros.
-   [ ] A matriz continua exibindo apenas rodeiros com ICA inferior a 40
    e prioridade `critico`.
-   [ ] Clicar em um rodeiro crítico abre seu modal com os campos
    existentes.
-   [ ] O vagão selecionado continua destacado na visualização do trem
    dentro do modal do rodeiro.
-   [ ] As regras de ICA, os pesos, os limites e as decisões sugeridas
    não mudam.
-   [ ] A interface continua legível e utilizável em diferentes larguras
    de tela.
-   [ ] Não há erros de interação, dados ausentes causados pela
    alteração visual ou regressões nos fluxos existentes.

## 9. Fora de escopo

-   Alterar ou recalibrar a fórmula do ICA.
-   Alterar os limites, os pesos ou as regras de decisão.
-   Alterar os valores dos KPIs ou redefinir seus significados.
-   Criar novos indicadores, filtros ou fluxos operacionais.
-   Modificar regras de manutenção, homologação técnica ou procedimentos
    oficiais.
-   Tratar os números e previsões do protótipo como fatos validados sem
    confirmação da fonte responsável.

## 10. Princípio de evolução

**Melhorar a clareza e a qualidade visual sem mudar o significado
operacional.** Qualquer alteração futura nas regras de negócio deve ser
tratada como uma mudança explícita desta especificação, com validação
própria, e não como parte de um ajuste visual.
