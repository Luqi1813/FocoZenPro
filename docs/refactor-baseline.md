# Reinicio da Refatoracao com Trilha para React

## Base ativa
- Commit de reinicio: `28b8a55`
- Branch de trabalho: `codex/reinicio-refatoracao-react`
- Branch historica preservada: `codex/refatoração`

## Checklist manual da Fase 0
- [ ] Home
- [ ] Sons
- [ ] Tarefas
- [ ] Assistente
- [ ] Metas
- [ ] Estatisticas
- [ ] PiP
- [ ] Update / changelog

## Inventario inicial do renderer legado
- Boot e wiring: `DOMContentLoaded`, listeners globais e restauracao de sessao.
- Sons: seletor, player mestre, volume, mute e sincronizacao com PiP.
- Timer: modos, contagem, transicoes, conclusao e barra de progresso.
- Tarefas: criacao, edicao, subtarefas, lista, sidebar e persistencia.
- Metas: agregacoes por categoria, overview, streak e evolucao.
- Estatisticas: compilacao de dashboard, historico e charts.
- Assistente: contexto, mensagens, sugestoes e parsing acoplado ao renderer.
- PiP: bridge via preload, sincronizacao de estado e acoes remotas.
- Updates e modais: changelog, banners, fluxos de instalacao e feedbacks globais.

## Extracoes desta etapa
- `src/core/constants.js`
- `src/core/utils.js`
- `src/services/storage.js`

## Regra de transicao adotada
- O `renderer.js` continua dono da UI e do wiring.
- Os modulos novos sao consumidos primeiro como fonte reutilizavel de dados, persistencia e helpers puros.
- A remocao completa dos blocos legados fica para a fase seguinte, depois de baseline validada no app.
