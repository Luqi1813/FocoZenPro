# Estabilizacao Pos-Rollback

## Base ativa agora
- `renderer.js` segue como coordenador principal do app.
- `index.html` carrega apenas modulos com bootstrap explicito no `renderer.js`.
- A branch de trabalho atual reintroduziu os dominios de forma incremental e agora opera com contratos explicitos no bootstrap.

## Bootstrap ativo atual
- `src/core/constants.js`
- `src/core/utils.js`
- `src/core/history.js`
- `src/core/goals.js`
- `src/core/timer.js`
- `src/core/assistant.js`
- `src/services/storage.js`
- `src/services/pip.js`
- `src/services/updates.js`
- `src/services/audio.js`
- `src/services/task-session.js`

> [!NOTE]
> Ja removidos do bootstrap nas migracoes React:
> - `src/legacy-renderer/goals-stats.js`
> - `src/legacy-renderer/assistant.js`
> - `src/legacy-renderer/home.js`
> - `src/legacy-renderer/timer.js`
> - `src/legacy-renderer/tasks.js`

## Contratos publicos ativos (`window.*`)

### Runtimes React
- `window.FocoZenGoalsRuntime`
- `window.FocoZenStatsRuntime`
- `window.FocoZenAssistantRuntime`
- `window.FocoZenHomeRuntime`
- `window.FocoZenTimerRuntime`
- `window.FocoZenTasksRuntime`

### Services compartilhados
- `window.FocoZenAudioService`
- `window.FocoZenTaskSessionService`

## Donos atuais por responsabilidade
- `renderer.js`
  - bootstrap
  - navegacao entre views
  - estado global remanescente
  - coordenacao entre modulos
  - modais e fluxos transversais
  - PiP/update
- `src/core/*`
  - logica pura e reutilizavel
- `src/services/*`
  - bridges reais de integracao
  - `storage`, `pip`, `updates`, `audio`, `task-session`
- `src/react/*`
  - UI React de Metas, Estatisticas, Assistente, Home e Timer

## Progresso da migracao React

| Dominio | Status | Implementacao atual |
|---|---|---|
| Metas | Concluido | `GoalsReactView.jsx` |
| Estatisticas | Concluido | `StatsReactView.jsx` |
| Assistente | Concluido | `AssistantReactDock.jsx` |
| Home | Concluido | `HomeReactView.jsx` |
| Timer | Concluido | `TimerReactPanel.jsx` |
| Tarefas | Concluido | `TasksReactSidebar.jsx` + `FocoZenTasksRuntime` |

## Situacao atual do plano
- Hardening da base com testes automatizados ainda nao foi concluido.
- Metas, Estatisticas e Assistente ja migraram para React.
- Home e Timer agora tambem operam por runtimes React.
- Tarefas agora tambem operam por runtime React e sairam do bootstrap legado.
- O proximo passo arquitetural deixa de ser "migrar um dominio legado" e passa a ser consolidar o shell React e endurecer a base com testes.

## Regra de seguranca para a trilha atual
- So carregar modulo no `index.html` quando houver consumo explicito no `renderer.js`.
- Migrar ou limpar um dominio por vez.
- Fazer smoke manual logo depois de cada integracao relevante.
- Tratar os contratos globais ativos como obrigatorios no bootstrap.
- Evitar novamente cleanup amplo multi-dominio.

## Gate atual para seguir a migracao
- `renderer.js` deve atuar como coordenador, nao como dono simultaneo de regra de negocio e UI de dominio.
- React deve consumir contratos estaveis de `src/core/*` e `src/services/*`.
- O proximo marco passa a ser consolidar o shell React unico.
- Hardening da base com testes automatizados segue pendente e deve acontecer antes do cleanup final.

## Nota sobre o renderer grande
- O tamanho de `renderer.js` sozinho nao bloqueia a trilha.
- O criterio principal para modularizacao continua sendo ownership estavel por responsabilidade, nao contagem de linhas.
- A divisao final do coordenador deve acontecer depois do fechamento dos dominos restantes e da consolidacao do shell React.
