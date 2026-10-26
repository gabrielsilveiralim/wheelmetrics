# TASK — Refatoração modular do WheelMetrics

## Objetivo

Refatorar a implementação atual do WheelMetrics, que concentra processamento de dados, regras de negócio, componentes visuais, modais e estado da página em um único arquivo extenso.

O objetivo é melhorar a organização, a legibilidade e a manutenibilidade, preservando integralmente o comportamento atual da aplicação.

## Etapa 1 — Inspeção

Antes de alterar arquivos:

1. Leia integralmente `SPEC.md` e `TASK.md`.
2. Inspecione a estrutura real do projeto, os arquivos existentes, as configurações, os imports e as dependências.
3. Identifique a stack, as convenções de nomenclatura e os comandos de validação disponíveis.
4. Determine quais componentes e funções podem ser extraídos sem alterar seu comportamento.
5. Não crie uma arquitetura nova antes de entender a existente.

Se esta tarefa substituir a TASK atual, preserve os requisitos anteriores e registre a refatoração como uma tarefa adicional. Não sobrescreva nem descarte requisitos existentes silenciosamente.

## Etapa 2 — Separação de responsabilidades

Organize o código conforme as convenções já utilizadas no projeto.

Se for compatível com a estrutura existente, considere separar:

- A página principal e a coordenação do estado.
- O upload e o processamento do arquivo Excel.
- Os cálculos, a classificação e as decisões do ICA.
- Os parâmetros de configuração e os indicadores operacionais.
- A seção de KPIs.
- A matriz de rodeiros críticos.
- A composição visual da locomotiva e dos vagões.
- O desenho individual do vagão e dos estados dos rodeiros.
- Os modais de detalhes do vagão e do rodeiro.
- Os badges e os componentes auxiliares de apresentação.

A lista é uma orientação de responsabilidades, não uma exigência de criar um arquivo para cada item. Evite arquivos excessivamente pequenos, abstrações desnecessárias e componentes genéricos sem necessidade real.

## Etapa 3 — Preservação obrigatória

Não altere:

- A fórmula do ICA, os pesos, os limites ou os arredondamentos.
- A classificação de prioridade ou as decisões sugeridas.
- A lógica de identificação dos problemas.
- O mapeamento e a validação das abas Friso, Alarmes e KM_Rodado.
- Os indicadores, seus valores e sua apresentação.
- A regra da matriz que exibe apenas rodeiros críticos.
- O desenho geral da composição ferroviária, a busca e os fluxos dos modais.
- Os dados, os campos, as interações e os estilos atuais, exceto quando uma alteração for estritamente necessária para separar os módulos.

Não introduza dependências novas. Não crie backend se a aplicação atual não precisar dele.

## Etapa 4 — Implementação incremental

Faça a refatoração em etapas pequenas, mantendo a aplicação executável sempre que possível.

Após cada etapa:

1. Atualize os imports e exports necessários.
2. Verifique erros de sintaxe e referências quebradas.
3. Execute as verificações pertinentes disponíveis.
4. Confirme que as regras e os resultados não mudaram.
5. Só então prossiga para a próxima etapa.

Não deixe a implementação duplicada em arquivos antigos e novos sem necessidade. Remova ou atualize código obsoleto somente depois de confirmar que não é mais utilizado e que a alteração está no escopo.

## Etapa 5 — Validação e conclusão

Execute lint, type-check, testes e build quando esses comandos existirem e forem aplicáveis.

Valide também:

- Upload e validação da planilha.
- Processamento das três abas.
- Resultados e classificações do ICA.
- KPIs.
- Busca de vagões.
- Abertura do modal do vagão e acesso aos quatro rodeiros.
- Abertura do modal de rodeiro pela matriz crítica.
- Destaque do vagão selecionado.
- Comportamento responsivo e ausência de erros no console, quando possível verificar.

Não declare verificações aprovadas sem executá-las. Informe as que não existem ou não puderam ser executadas.

Atualize a TASK com o estado real das atividades e apresente os arquivos criados, alterados ou removidos, os resultados das verificações e quaisquer pendências.

## Critério de conclusão

A refatoração estará concluída quando o código estiver modularizado, a aplicação continuar executável, as regras de negócio e os comportamentos anteriores forem preservados e os resultados das verificações forem documentados.

## Status da implementação

- [x] Inspeção integral da especificação, tarefas, estrutura, stack e scripts.
- [x] Configuração, cálculos, classificação, decisões e problemas do ICA extraídos para `src/config/ica.js`.
- [x] Leitura, validação e processamento das abas `Friso`, `Alarmes` e `KM_Rodado` extraídos para `src/services/workbook.js`.
- [x] Badges e KPI extraídos para `src/component/StatusComponents.jsx`.
- [x] Matriz, composição, vagões e estados dos rodeiros extraídos para `src/component/FleetComponents.jsx`.
- [x] Modais de vagão e rodeiro extraídos para `src/component/DetailModals.jsx`.
- [x] Página principal reduzida à coordenação de estado, upload, busca e composição das seções.
- [x] Imports e exports revisados; nenhum componente ou fluxo funcional foi removido.
- [x] Lint e build executados com sucesso.