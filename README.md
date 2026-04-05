# FocoZen Pro

Estudio de Foco Imersivo — aplicativo desktop Electron com UI React para gerenciamento de tempo Pomodoro, metas por categoria, estatisticas visuais e assistente integrado.

## Visao Geral

FocoZen Pro combina tecnica Pomodoro com acompanhamento de metas pessoais. Organize tarefas por categoria, defina metas diarias/semanais, acompanhe seu progresso com graficos e receba orientacao de um assistente contextual.

## Stack Tecnologico

| Camada | Tecnologia |
|---|---|
| Shell | Electron 28 |
| UI | React 19 |
| Build | Vite 8 |
| Testes | Vitest 3 + Testing Library |
| Graficos | Chart.js 4 |
| Atualizacoes | electron-updater 6 |

## Estrutura de Diretorios

```
FocoZenPro/
├── main.js              # Entry point Electron (processo principal)
├── preload.js           # Preload script (contextBridge)
├── index.html           # Entry point renderer
├── package.json         # Dependencias e scripts
├── vite.config.mjs      # Configuracao Vite
├── vitest.config.mjs    # Configuracao Vitest
├── src/
│   ├── core/            # Logica de dominio pura (6 modulos)
│   │   ├── constants.js # Constantes da aplicacao
│   │   ├── utils.js     # Helpers utilitarios
│   │   ├── history.js   # Filtros, streaks, resumos
│   │   ├── goals.js     # Calculos de metas
│   │   ├── timer.js     # Maquina de estado do timer
│   │   └── assistant.js # NLP e respostas do assistente
│   ├── services/        # Bridges para integracoes (5 modulos)
│   │   ├── storage.js   # localStorage centralizado
│   │   ├── audio.js     # Sons ambiente
│   │   ├── pip.js       # Picture-in-Picture
│   │   ├── updates.js   # Auto-update
│   │   └── task-session.js # Ciclo de vida de tarefas
│   ├── react/           # UI React
│   │   ├── shell/       # AppShell.jsx (navegacao)
│   │   ├── components/  # 7 componentes (Home, Stats, Goals, etc.)
│   │   ├── contracts/   # 6 runtime contracts
│   │   └── main.jsx     # Entry point React
│   └── renderer/        # Modulos renderer (legado coordenador)
│       ├── state-and-constants.js
│       ├── runtime-apis.js
│       ├── ui-apply.js
│       └── ...          # ~20 modulos auxiliares
├── tests/
│   ├── core/            # Testes de core modules
│   └── contracts/       # Testes de runtime contracts
└── docs/
    ├── refactor-baseline.md
    └── post-rollback-stabilization.md
```

## Como Rodar

### Desenvolvimento

```bash
npm install
npm start
```

O modo desenvolvimento abre DevTools automaticamente e habilita hot-reload para o bundle React.

### Build Producao

```bash
npm run dist
```

Gera instalador Windows NSIS em `dist/`.

### Testes

```bash
npm test          # Run all tests
npm run test:watch # Watch mode
```

## Arquitetura

### Padrao Runtime Contract

Cada dominio React expoe um contrato via `window.FocoZen*Runtime`:

```javascript
// Exemplo: Stats runtime
window.FocoZenStatsRuntime = {
    getSnapshot: () => snapshot,
    subscribe: (callback) => unsubscribe,
    refresh: () => snapshot,
    setStatsPeriod: (period) => period
};
```

Componentes React consomem via `subscribeStatsViewModel` em `src/react/contracts/stats-runtime.js`.

### Camadas

1. **Core** (`src/core/`) — Logica pura, sem dependencias de framework
2. **Services** (`src/services/`) — Bridges para localStorage, audio, Electron APIs
3. **React** (`src/react/`) — UI declarativa com contratos de runtime
4. **Renderer** (`src/renderer/`) — Coordenacao legado, bootstrap, handlers DOM

## Seguranca

- `contextIsolation: true`
- `nodeIntegration: false`
- `escapeHtml()` em todos os `innerHTML` com dados do usuario
- CSP configurado em `index.html`

## Performance

- Heap V8: 512MB (`--max-old-space-size=512`)
- Lazy loading: `electron-updater` via `require()` condicional
- Chart.js: instances destruidas no unmount
- React.memo em componentes folha (SoundCard, TaskRow, etc.)

## Contribuindo

1. Fork o repositorio
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudancas (`git commit -am 'Adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

## Licenca

MIT — veja `LICENSE` para detalhes.
