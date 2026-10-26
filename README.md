# WheelMetrics

Sistema de apoio à análise e priorização da manutenção de rodeiros ferroviários, com foco na identificação de condições críticas, classificação de anomalias e suporte à tomada de decisão operacional.

## Objetivo

O WheelMetrics organiza informações provenientes de planilhas operacionais para facilitar a análise das condições dos rodeiros e identificar quais situações merecem maior atenção da equipe de manutenção.

A aplicação busca tornar a análise mais visual, consistente e rastreável, preservando as regras de negócio utilizadas na avaliação dos ativos.

## Funcionalidades

- **Importação de planilhas Excel:** leitura e processamento dos dados necessários à análise.
- **Cálculo do ICA:** cálculo do indicador conforme os critérios, limites e pesos definidos na especificação do projeto.
- **Classificação de prioridade:** categorização das condições dos rodeiros para apoiar a priorização da manutenção.
- **Indicadores e KPIs:** apresentação resumida das informações processadas.
- **Matriz de problemas críticos:** identificação das situações que atendem aos critérios de criticidade.
- **Composição do trem:** visualização horizontal da locomotiva e dos vagões.
- **Detalhamento dos vagões:** acesso às informações dos quatro rodeiros de cada vagão.
- **Detalhamento dos rodeiros:** consulta aos dados e às condições identificadas para cada rodeiro.
- **Apoio à decisão operacional:** indicação de ações conforme as regras de negócio documentadas.

## Documentação

O projeto utiliza documentos de referência para manter a implementação consistente:

| Arquivo | Finalidade |
|---|---|
| `SPEC.md` | Especificação funcional, regras de negócio, cálculos e comportamentos esperados. |
| `TASK.md` | Tarefa em andamento, etapas de implementação e critérios de validação. |
| `README.md` | Visão geral do projeto e orientações para desenvolvedores. |

Consulte o `SPEC.md` antes de modificar cálculos, classificações, prioridades ou comportamentos funcionais.

## Regras de negócio

O Índice de Condição do Ativo (ICA) é calculado a partir dos critérios definidos na especificação do projeto.

A classificação do ICA considera as seguintes faixas:

| ICA | Classificação |
|---|---|
| Menor que 40 | Crítico |
| De 40 até menos de 70 | Médio |
| 70 ou superior | Baixo |

As decisões operacionais e os critérios de inclusão na matriz de problemas críticos seguem as regras documentadas no `SPEC.md`.

**Importante:** os limites, pesos e demais parâmetros devem ser mantidos alinhados à especificação vigente. Não altere regras de negócio apenas para facilitar uma refatoração.

## Tecnologias

A implementação existente utiliza tecnologias como:

- React para a interface.
- JavaScript para a lógica da aplicação.
- Tailwind CSS e CSS para estilização.
- SheetJS (`xlsx`) para processamento de planilhas Excel.
- Lucide React para ícones.

Consulte o arquivo de dependências do projeto para verificar as versões e os comandos disponíveis.

## Como executar

Os comandos devem seguir a configuração real do repositório.

1. Clone o repositório.
2. Acesse a pasta do projeto.
3. Instale as dependências utilizando o gerenciador de pacotes configurado.
4. Execute o script de desenvolvimento definido no `package.json`.

Exemplo para um projeto configurado com npm:

```bash
npm install
npm run dev
```

Verifique os scripts disponíveis no `package.json`, pois os comandos podem variar conforme a configuração do projeto.

## Diretrizes de desenvolvimento

Ao implementar melhorias ou corrigir problemas:

1. Leia o `SPEC.md` e o `TASK.md`.
2. Analise a estrutura e os padrões já existentes.
3. Preserve as regras de negócio e os comportamentos funcionais.
4. Prefira componentes e módulos com responsabilidades bem definidas.
5. Evite dependências adicionais sem necessidade comprovada.
6. Execute as validações disponíveis após as alterações.
7. Documente eventuais mudanças nas regras de negócio.

A refatoração deve priorizar a organização e a manutenibilidade sem comprometer os resultados dos cálculos ou as interações da aplicação.

## Critérios de preservação

As seguintes funcionalidades são consideradas importantes:

- Cálculo e classificação do ICA.
- Indicadores e KPIs.
- Matriz de problemas críticos.
- Composição horizontal da locomotiva e dos vagões.
- Abertura dos detalhes do vagão e de seus quatro rodeiros.
- Abertura dos detalhes de rodeiros críticos.
- Campos, destaques visuais e interações existentes.

Mudanças nessas funcionalidades devem ser avaliadas em relação à especificação e validadas antes de serem consideradas concluídas.

## Contribuição

Antes de concluir uma alteração, informe:

- O que foi modificado.
- Quais arquivos foram criados, alterados ou removidos.
- Quais validações foram executadas.
- Quais resultados foram obtidos.
- Quais pendências permanecem.

Não declare testes ou validações como concluídos sem executá-los.

## Status do projeto

O WheelMetrics está em evolução. A organização interna do código pode ser aprimorada progressivamente, mantendo a compatibilidade com as regras de negócio e a experiência funcional existente.