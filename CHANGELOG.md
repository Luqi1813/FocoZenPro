# Changelog

Todas as mudanças notáveis do FocoZen Pro serão documentadas neste arquivo.

## [1.0.11] - 2026-03-31

### Melhorado
- Cor de destaque do som Chuva alterada para branco
- Melhor contraste visual para o som de chuva
- Extração de changelog corrigida na automação Trello
- Changelog completo agora é inserido corretamente na descrição do card
- Workflow de Trello agora cria card antes do publish (na lista "Mudanças prontas pra lançamento")
- JSON payload implementado para enviar changelog com descrição completa

## [1.0.10] - 2026-03-31

### Melhorado
- Otimização na velocidade das animações em toda a interface
- Transições mais fluidas e responsivas

## [1.0.9] - 2026-03-31

### Adicionado
- Seção "Sobre" agora exibe o histórico completo de versões do CHANGELOG.md
- Sistema de leitura automática do CHANGELOG.md para exibição formatada
- Scroll na área de changelog para navegação por todas as versões
- DevTools abre automaticamente em modo desenvolvimento para facilitar testes
- Automação GitHub Actions para criar cards no Trello automaticamente em cada release

### Melhorado
- Formatação do changelog com hierarquia visual (versões, categorias, itens)
- Conversão automática de markdown para HTML estilizado
- Ícones e cores para melhor legibilidade do histórico
- Área de changelog com altura máxima de 500px e scroll suave

## [1.0.8] - 2026-03-31

### Corrigido
- Scroll nas configurações agora funciona corretamente
- Seções de configuração não são mais cortadas na parte inferior
- Layout da view de estatísticas também ajustado para scroll adequado

## [1.0.7] - 2026-03-31

### Adicionado
- Download automático e reinício instantâneo ao clicar em "Verificar Atualizações"
- Barra de progresso inline na seção de atualizações durante o download
- Instalação silenciosa após download manual de atualização

### Melhorado
- Botão "Verificar Atualizações" agora tem largura ajustada
- Experiência de atualização manual mais fluida e automática

## [1.0.6] - 2026-03-31

### Adicionado
- Seção "Sobre" nas configurações com versão atual do app
- Exibição do changelog da última atualização na seção "Sobre"
- Barra de progresso visual durante download de atualizações
- IPC handler para obter versão do app

### Melhorado
- Modal de changelog após atualização agora aparece corretamente
- Changelog permanente salvo no localStorage para consulta futura

## [1.0.5] - 2026-03-31

### Adicionado
- Botão manual "Verificar Atualizações" nas configurações
- Feedback visual durante verificação de atualizações
- Modal elegante mostrando resultado da verificação

### Corrigido
- Sistema de verificação manual de atualizações funcionando corretamente
- Botão não fica mais em loop infinito
- Resposta adequada quando não há atualizações disponíveis

## [1.0.4] - 2026-03-31

### Adicionado
- Popup de changelog após atualização do app
- Sistema de notificação elegante para atualizações baixadas
- Formatação automática de release notes

### Melhorado
- UI das telas de atualização mais moderna e bonita
- Transições suaves nos modais de atualização

## [1.0.3] - 2026-03-31

### Adicionado
- Verificação automática de atualizações ao iniciar o app
- Download silencioso de atualizações em background
- Popup para reiniciar após download de atualização

### Melhorado
- Instalação de atualizações sem wizard completo do NSIS
- Processo de atualização mais rápido e discreto

## [1.0.2] - 2026-03-31

### Adicionado
- Sistema de auto-atualização com electron-updater
- Integração com GitHub Releases
- Logs detalhados do processo de atualização

### Configurado
- NSIS installer com opções personalizadas
- Differential packages para downloads menores

## [1.0.1] - 2026-03-30

### Melhorado
- Cor de destaque do som Brown Noise alterada para marrom escuro
- Melhor contraste visual nos elementos de áudio

## [1.0.0] - 2026-03-30

### Lançamento Inicial

#### 🎯 Sistema de Foco e Pomodoro
- Timer Pomodoro automático com ciclos de 25 minutos de foco
- Pausas curtas de 5 minutos entre pomodoros
- Pausa longa de 15 minutos a cada 4 pomodoros
- Controles de play/pause/reset intuitivos
- Indicador visual de progresso circular
- Notificações de transição entre estados
- Contador de pomodoros completados no dia

#### 🎵 Biblioteca de Sons Ambiente
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
- Mixagem simultânea de múltiplos sons
- Player de áudio persistente em todas as telas
- Indicador visual do som ativo
- Fade in/out suave nas transições

#### ✅ Sistema de Tarefas
- Criação de tarefas com nome personalizado
- Categorização flexível (Trabalho, Estudos, Projetos, Leitura, Hobbies, Livre)
- Definição de duração em minutos
- Sistema de subtarefas opcional
- Sugestão automática de quantidade de pomodoros
- Edição de tarefas existentes
- Exclusão de tarefas
- Marcação de conclusão
- Visualização de progresso por tarefa
- Persistência de dados em localStorage

#### 📊 Estatísticas e Análises
- Dashboard de estatísticas com layout Bento moderno
- Métricas principais:
  - Tempo de foco hoje
  - Tempo de foco na semana
  - Ofensiva (streak) de dias consecutivos
  - Taxa de conclusão de tarefas
- Gráfico de pizza: distribuição de foco por categoria
- Gráfico de barras: consistência semanal
- Histórico detalhado do dia dividido por períodos (Manhã, Tarde, Noite)
- Visualização de tempo por categoria em cada período
- Filtros por período (Hoje, Semana, Mês)
- Botão de atualização manual dos dados
- Cálculo automático de melhor streak
- Cores personalizadas por categoria

#### 🧘 Exercício de Respiração 4-7-8
- Técnica de respiração guiada do Dr. Andrew Weil
- Animação visual do círculo respiratório
- Instruções em tempo real:
  - Inspire 4 segundos
  - Segure 7 segundos
  - Expire 8 segundos
- Modal informativo sobre benefícios
- Modo fullscreen imersivo
- Contador de ciclos completados
- Integração com pausas do Pomodoro

#### 🎨 Interface e Experiência
- Design moderno com tema escuro (dark mode)
- Efeitos glass morphism em painéis
- Gradientes personalizados por categoria
- Animações suaves e transições fluidas
- Sidebar de navegação com 3 seções principais:
  - Home (Timer e Tarefas)
  - Estatísticas
  - Configurações
- Responsividade para diferentes resoluções
- Ícones Font Awesome em toda interface
- Feedback visual em todas as ações
- Toasts de notificação elegantes

#### ⚙️ Configurações
- Personalização do nome de exibição
- Salvamento automático de preferências
- Opção de reset completo do aplicativo
- Limpeza de todos os dados locais
- Feedback visual de salvamento

#### 🚀 Onboarding
- Wizard de boas-vindas em 3 etapas
- Coleta de nome do usuário
- Seleção de categoria principal de foco
- Tutorial explicativo das funcionalidades
- Animações de transição entre etapas
- Indicadores de progresso (dots)
- Design elegante e acolhedor

#### 💾 Persistência de Dados
- Sistema completo de localStorage
- Salvamento automático de:
  - Tarefas e subtarefas
  - Histórico de sessões
  - Estatísticas acumuladas
  - Preferências do usuário
  - Estado do timer
  - Configurações de áudio
- Carregamento automático ao iniciar
- Validação de dados corrompidos

#### 🎭 Modo Picture-in-Picture (PIP)
- Janela flutuante compacta do timer
- Sempre visível sobre outras janelas
- Controles básicos de play/pause
- Indicador de tempo restante
- Minimização para PIP com um clique
- Restauração para janela completa
- Posicionamento personalizável

#### 🔧 Otimizações Técnicas
- Electron 28 com otimizações de memória
- Flags do Chromium para redução de RAM
- Gerenciamento eficiente de recursos
- Prevenção de memory leaks
- Cache otimizado de assets
- Lazy loading de componentes pesados
