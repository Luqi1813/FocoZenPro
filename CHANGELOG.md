# Changelog

Todas as mudancas notaveis do FocoZen Pro serao documentadas neste arquivo.

## [1.0.13] - 2026-03-31

### Adicionado
- Feedback temporario de parabens ao concluir uma tarefa no app completo e no PiP
- Mensagens motivacionais aleatorias ao recomecar uma tarefa em outro momento
- Overlay compacto de "Adicionar Tempo" dentro do PiP, sem abrir o app completo

### Corrigido
- Modal de atualizacao agora exibe o changelog real da versao instalada
- Botao "Fechar" do modal "Tudo Atualizado" centralizado corretamente
- Fluxos de conclusao de tarefa no PiP nao forcam mais entrada automatica em pausa
- Acao "Sim, conclui!" agora conclui a tarefa corretamente e retorna para "Sessao Livre" em foco
- Acao "Adicionar mais tempo" preserva o progresso feito, nao conclui a tarefa e soma o tempo extra corretamente
- Acao "Recomecar em outro momento" nao marca mais a tarefa como concluida e reinicia o progresso como esperado
- Fechamento manual do popup de conclusao no PiP agora segue um fluxo consistente sem enviar para pausa automaticamente
- Estado provisorio de conclusao da tarefa agora e tratado corretamente ate a decisao final do usuario
- Botoes e textos dos popups de conclusao receberam ajustes de espacamento para evitar icones colados no texto
- Layout do PiP e do popup de adicionar tempo foi ajustado para evitar truncamento e barras de rolagem indevidas
- Tela de adicionar tempo no app completo ficou mais compacta e sem cortes visuais
- Inicio de tarefa agora garante retorno ao modo de foco quando necessario

### Melhorado
- Changelog lido do novo CHANGELOG.md apos restart (nao mais do cache antigo)
- Popup pos-tarefa no PiP foi reorganizado para destacar melhor as 3 decisoes principais
- Janela PiP foi redimensionada para equilibrar legibilidade e ocupacao de tela

## [1.0.12] - 2026-03-31

### Melhorado
- Automacao Trello agora move card de "Mudancas prontas pra lancamento" para "Atualizacoes feitas" ao publicar release
- Workflow de release reescrito com deteccao de card por versao

## [1.0.11] - 2026-03-31

### Melhorado
- Cor de destaque do som Chuva alterada para branco
- Melhor contraste visual para o som de chuva
- Extracao de changelog corrigida na automacao Trello
- Changelog completo agora e inserido corretamente na descricao do card
- Workflow de Trello agora cria card antes do publish (na lista "Mudancas prontas pra lancamento")
- JSON payload implementado para enviar changelog com descricao completa via API Trello

## [1.0.10] - 2026-03-31

### Melhorado
- Otimizacao na velocidade das animacoes em toda a interface
- Transicoes mais fluidas e responsivas

## [1.0.9] - 2026-03-31

### Adicionado
- Secao "Sobre" agora exibe o historico completo de versoes do CHANGELOG.md
- Sistema de leitura automatica do CHANGELOG.md para exibicao formatada
- Scroll na area de changelog para navegacao por todas as versoes
- DevTools abre automaticamente em modo desenvolvimento para facilitar testes
- Automacao GitHub Actions para criar cards no Trello automaticamente em cada release

### Melhorado
- Formatacao do changelog com hierarquia visual (versoes, categorias, itens)
- Conversao automatica de markdown para HTML estilizado
- Icones e cores para melhor legibilidade do historico
- Area de changelog com altura maxima de 500px e scroll suave

## [1.0.8] - 2026-03-31

### Corrigido
- Scroll nas configuracoes agora funciona corretamente
- Secoes de configuracao nao sao mais cortadas na parte inferior
- Layout da view de estatisticas tambem ajustado para scroll adequado

## [1.0.7] - 2026-03-31

### Adicionado
- Download automatico e reinicio instantaneo ao clicar em "Verificar Atualizacoes"
- Barra de progresso inline na secao de atualizacoes durante o download
- Instalacao silenciosa apos download manual de atualizacao

### Melhorado
- Botao "Verificar Atualizacoes" agora tem largura ajustada
- Experiencia de atualizacao manual mais fluida e automatica

## [1.0.6] - 2026-03-31

### Adicionado
- Secao "Sobre" nas configuracoes com versao atual do app
- Exibicao do changelog da ultima atualizacao na secao "Sobre"
- Barra de progresso visual durante download de atualizacoes
- IPC handler para obter versao do app

### Melhorado
- Modal de changelog apos atualizacao agora aparece corretamente
- Changelog permanente salvo no localStorage para consulta futura

## [1.0.5] - 2026-03-31

### Adicionado
- Botao manual "Verificar Atualizacoes" nas configuracoes
- Feedback visual durante verificacao de atualizacoes
- Modal elegante mostrando resultado da verificacao

### Corrigido
- Sistema de verificacao manual de atualizacoes funcionando corretamente
- Botao nao fica mais em loop infinito
- Resposta adequada quando nao ha atualizacoes disponiveis

## [1.0.4] - 2026-03-31

### Adicionado
- Popup de changelog apos atualizacao do app
- Sistema de notificacao elegante para atualizacoes baixadas
- Formatacao automatica de release notes

### Melhorado
- UI das telas de atualizacao mais moderna e bonita
- Transicoes suaves nos modais de atualizacao

## [1.0.3] - 2026-03-31

### Adicionado
- Verificacao automatica de atualizacoes ao iniciar o app
- Download silencioso de atualizacoes em background
- Popup para reiniciar apos download de atualizacao

### Melhorado
- Instalacao de atualizacoes sem wizard completo do NSIS
- Processo de atualizacao mais rapido e discreto

## [1.0.2] - 2026-03-31

### Adicionado
- Sistema de auto-atualizacao com electron-updater
- Integracao com GitHub Releases
- Logs detalhados do processo de atualizacao

### Configurado
- NSIS installer com opcoes personalizadas
- Differential packages para downloads menores

## [1.0.1] - 2026-03-30

### Melhorado
- Cor de destaque do som Brown Noise alterada para marrom escuro
- Melhor contraste visual nos elementos de audio

## [1.0.0] - 2026-03-30

### Lancamento Inicial

#### Sistema de Foco e Pomodoro
- Timer Pomodoro automatico com ciclos de 25 minutos de foco
- Pausas curtas de 5 minutos entre pomodoros
- Pausa longa de 15 minutos a cada 4 pomodoros
- Controles de play/pause/reset intuitivos
- Indicador visual de progresso circular
- Notificacoes de transicao entre estados
- Contador de pomodoros completados no dia

#### Biblioteca de Sons Ambiente
- 8 sons ambiente de alta qualidade:
  - Chuva Suave
  - Chuva Forte
  - Lareira
  - Ondas do Mar
  - Floresta
  - Lofi Hip Hop
  - Jazz Suave
  - Brown Noise
- Controle de volume individual por som
- Mixagem simultanea de multiplos sons
- Player de audio persistente em todas as telas
- Indicador visual do som ativo
- Fade in/out suave nas transicoes

#### Sistema de Tarefas
- Criacao de tarefas com nome personalizado
- Categorizacao flexivel (Trabalho, Estudos, Projetos, Leitura, Hobbies, Livre)
- Definicao de duracao em minutos
- Sistema de subtarefas opcional
- Sugestao automatica de quantidade de pomodoros
- Edicao de tarefas existentes
- Exclusao de tarefas
- Marcacao de conclusao
- Visualizacao de progresso por tarefa
- Persistencia de dados em localStorage

#### Estatisticas e Analises
- Dashboard de estatisticas com layout Bento moderno
- Metricas principais:
  - Tempo de foco hoje
  - Tempo de foco na semana
  - Ofensiva (streak) de dias consecutivos
  - Taxa de conclusao de tarefas
- Grafico de pizza: distribuicao de foco por categoria
- Grafico de barras: consistencia semanal
- Historico detalhado do dia dividido por periodos (Manha, Tarde, Noite)
- Visualizacao de tempo por categoria em cada periodo
- Filtros por periodo (Hoje, Semana, Mes)
- Botao de atualizacao manual dos dados
- Calculo automatico de melhor streak
- Cores personalizadas por categoria

#### Exercicio de Respiracao 4-7-8
- Tecnica de respiracao guiada do Dr. Andrew Weil
- Animacao visual do circulo respiratorio
- Instrucoes em tempo real:
  - Inspire 4 segundos
  - Segure 7 segundos
  - Expire 8 segundos
- Modal informativo sobre beneficios
- Modo fullscreen imersivo
- Contador de ciclos completados
- Integracao com pausas do Pomodoro

#### Interface e Experiencia
- Design moderno com tema escuro (dark mode)
- Efeitos glass morphism em paineis
- Gradientes personalizados por categoria
- Animacoes suaves e transicoes fluidas
- Sidebar de navegacao com 3 secoes principais:
  - Home (Timer e Tarefas)
  - Estatisticas
  - Configuracoes
- Responsividade para diferentes resolucoes
- Icones Font Awesome em toda interface
- Feedback visual em todas as acoes
- Toasts de notificacao elegantes

#### Configuracoes
- Personalizacao do nome de exibicao
- Salvamento automatico de preferencias
- Opcao de reset completo do aplicativo
- Limpeza de todos os dados locais
- Feedback visual de salvamento

#### Onboarding
- Wizard de boas-vindas em 3 etapas
- Coleta de nome do usuario
- Selecao de categoria principal de foco
- Tutorial explicativo das funcionalidades
- Animacoes de transicao entre etapas
- Indicadores de progresso (dots)
- Design elegante e acolhedor

#### Persistencia de Dados
- Sistema completo de localStorage
- Salvamento automatico de:
  - Tarefas e subtarefas
  - Historico de sessoes
  - Estatisticas acumuladas
  - Preferencias do usuario
  - Estado do timer
  - Configuracoes de audio
- Carregamento automatico ao iniciar
- Validacao de dados corrompidos

#### Modo Picture-in-Picture (PiP)
- Janela flutuante compacta do timer
- Sempre visivel sobre outras janelas
- Controles basicos de play/pause
- Indicador de tempo restante
- Minimizacao para PiP com um clique
- Restauracao para janela completa
- Posicionamento personalizavel

#### Otimizacoes Tecnicas
- Electron 28 com otimizacoes de memoria
- Flags do Chromium para reducao de RAM
- Gerenciamento eficiente de recursos
- Prevencao de memory leaks
- Cache otimizado de assets
- Lazy loading de componentes pesados
