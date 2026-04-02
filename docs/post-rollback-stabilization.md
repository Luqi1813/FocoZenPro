# Estabilizacao Pos-Rollback

## Base ativa agora
- `renderer.js` voltou para a base estavel anterior ao cleanup amplo.
- `index.html` deve carregar apenas modulos que o `renderer.js` consome de fato.

## Mantidos e integrados agora
- `src/core/constants.js`
- `src/core/utils.js`
- `src/core/history.js`
- `src/core/goals.js`
- `src/core/timer.js`
- `src/services/storage.js`
- `src/services/pip.js`
- `src/services/updates.js`
- `src/services/task-session.js`
- `src/legacy-renderer/goals-stats.js`
- `src/legacy-renderer/tasks.js`

## Mantidos no repo, mas nao carregados agora
- `src/core/assistant.js`
- `src/legacy-renderer/assistant.js`

## Regra de reintroducao
- So voltar a carregar um modulo no `index.html` quando houver consumo explicito no `renderer.js`.
- Reintroduzir por fatias pequenas, com smoke manual logo depois de cada integracao.
- Evitar novamente bootstrap hibrido com caminho novo carregado sem dono claro no renderer.
