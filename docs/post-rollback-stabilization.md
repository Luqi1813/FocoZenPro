# Estabilizacao Pos-Rollback

## Base ativa agora
- `renderer.js` segue como coordenador principal do app.
- `index.html` carrega apenas modulos com bootstrap explicito no `renderer.js`.
- A branch de trabalho atual reintroduziu os modulos de forma incremental, com fallback local no renderer para reduzir risco.

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
- `src/services/task-session.js`
- `src/legacy-renderer/goals-stats.js`
- `src/legacy-renderer/tasks.js`
- `src/legacy-renderer/assistant.js`

## Donos atuais por responsabilidade
- `renderer.js`
  - bootstrap
  - navegacao entre views
  - estado global remanescente
  - coordenacao entre modulos
  - efeitos reais do app que ainda nao foram totalmente extraidos
- `src/core/*`
  - logica pura e reutilizavel
- `src/services/*`
  - storage e bridges de integracao
- `src/legacy-renderer/*`
  - UI legado por dominio com wrappers e fallback seguro

## Modulos reintroduzidos apos a estabilizacao inicial
- `src/services/task-session.js`
  - fluxo operacional de tarefas e sessao salva
- `src/legacy-renderer/goals-stats.js`
  - renderizacao e bindings de Metas/Estatisticas
- `src/legacy-renderer/tasks.js`
  - renderizacao e interacao visual de Tarefas
- `src/core/assistant.js`
  - parsing e decisao do assistente
- `src/legacy-renderer/assistant.js`
  - UI e wiring do assistente

## Regra de seguranca para a trilha atual
- So carregar modulo no `index.html` quando houver consumo explicito no `renderer.js`.
- Reintroduzir ou limpar um dominio por vez.
- Fazer smoke manual logo depois de cada integracao relevante.
- Manter fallback no renderer enquanto o dominio ainda nao passou por uma rodada de estabilizacao completa.
- Evitar novamente cleanup amplo multi-dominio.

## Proximo gate recomendado
- Validar o smoke completo do assistente na arquitetura atual.
- So depois disso fazer cleanup pequeno e monotematico no bloco do assistente dentro do `renderer.js`.
