# Estabilizacao Pos-Rollback (Atualizado — Fase 2 concluida)

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
- `src/legacy-renderer/home.js`
- `src/legacy-renderer/timer.js`
- `src/legacy-renderer/tasks.js`

> [!NOTE]
> Ja **removidos** do bootstrap em fases anteriores:
> - `src/legacy-renderer/goals-stats.js` (migrado p/ React — GoalsReactView + StatsReactView)
> - `src/legacy-renderer/assistant.js` (migrado p/ React — AssistantReactDock)

## Contratos publicos ativos (`window.*`)

### Runtimes React (consumidos pelos componentes React)
- `window.FocoZenGoalsRuntime`
- `window.FocoZenStatsRuntime`
- `window.FocoZenAssistantRuntime`

### Services compartilhados
- `window.FocoZenAudioService`
- `window.FocoZenTaskSessionService`

### Legacy renderers (ainda ativos)
- `window.FocoZenLegacyHome`
- `window.FocoZenLegacyTimer`
- `window.FocoZenLegacyTasks`

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
- `src/legacy-renderer/*`
  - UI legado por dominio

## Progresso da migracao React

| Dominio | Status | Componente React |
|---|---|---|
| Metas | ✅ Concluido | `GoalsReactView.jsx` |
| Estatisticas | ✅ Concluido | `StatsReactView.jsx` |
| Assistente | ✅ Concluido | `AssistantReactDock.jsx` |
| Tarefas | ✅ Concluido | `TasksReactView.jsx` + `TaskFormModal.jsx` |
| Home | 🔜 Proximo | — |
| Timer | 🔴 Pendente | — |

## Regra de seguranca para a trilha atual
- So carregar modulo no `index.html` quando houver consumo explicito no `renderer.js`.
- Reintroduzir ou limpar um dominio por vez.
- Fazer smoke manual logo depois de cada integracao relevante.
- Tratar os contratos globais ativos como obrigatorios no bootstrap.
- Evitar novamente cleanup amplo multi-dominio.

## Gate atual para abrir React
- `renderer.js` deve atuar como coordenador, nao como dono simultaneo de regra de negocio e UI de dominio.
- React entra em paralelo ao HTML legado atual, sem substituir o bootstrap principal nesta etapa.
- React deve consumir contratos estaveis de `src/core/*` e `src/services/*`.
- React nao deve depender de funcoes internas do `renderer.js`.

## Nota sobre o renderer grande
- O tamanho de `renderer.js` sozinho nao bloqueia a etapa 7.
- O criterio principal para modularizacao continua sendo ownership estavel por responsabilidade, nao contagem de linhas.
- Nao abrir agora uma refatoracao ampla apenas para quebrar o coordenador em varios arquivos.
- Reavaliar um split pequeno do coordenador depois da etapa 7 e, idealmente, depois do piloto React da etapa 8.
- Se esse split vier depois, priorizar helpers transversais:
  - bootstrap/contracts
  - navegacao e modais globais
  - helpers de categorias/wizard
  - answerers e contexto do assistente que nao pertencam ao `assistantCore`
