function getAssistantStorageKey() {
    return 'focozen_assistant_messages';
}

function persistAssistantMessages() {
    writeJsonStorage(getAssistantStorageKey(), assistantMessages.slice(-24));
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatAssistantContent(text) {
    return escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/&#39;/g, "'");
}

function normalizeAssistantText(value = '') {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function includesAny(text, terms) {
    return terms.some(term => text.includes(term));
}

function hasWholeToken(text, terms) {
    const tokens = new Set(text.split(' ').filter(Boolean));
    return terms.some(term => tokens.has(term));
}

function getCurrentViewId() {
    return document.querySelector('.view-container.active')?.id || 'view-home';
}

function getAssistantViewLabel(viewId = getCurrentViewId()) {
    const labels = {
        'view-home': 'Home',
        'view-stats': 'Estatisticas',
        'view-goals': 'Metas',
        'view-settings': 'Configuracoes'
    };

    return labels[viewId] || 'App';
}

function getAssistantDefaultSuggestions(viewId = getCurrentViewId()) {
    const suggestionsByView = {
        'view-home': [
            'Quanto foquei hoje?',
            'O que focar agora?',
            'Crie uma meta de 2h por dia para Estudos'
        ],
        'view-stats': [
            'Qual categoria recebeu mais foco esta semana?',
            'Resuma meu mes',
            'Quantas sessoes de foco tive hoje?'
        ],
        'view-goals': [
            'Crie uma meta de 3h por dia para Trabalho em dias uteis',
            'Quais metas bati esta semana?',
            'Como estou em Estudos?'
        ],
        'view-settings': [
            'Quais metas estao ativas?',
            'Quanto foquei esta semana?',
            'O que focar agora?'
        ]
    };

    return suggestionsByView[viewId] || suggestionsByView['view-home'];
}

function setAssistantSuggestions(list) {
    assistantSuggestions = Array.isArray(list) && list.length ? list.slice(0, 4) : getAssistantDefaultSuggestions();
    renderAssistantSuggestions();
}

function createAssistantWelcomeMessage() {
    const firstName = (username || 'Mestre').split(' ')[0];
    return {
        id: Date.now(),
        role: 'assistant',
        content: `Oi, ${firstName}. Eu fico de olho no que acontece no app e posso conversar com voce sobre metas, historico, categorias, foco e proximos passos. Se quiser, posso tanto responder quanto agir por aqui.`,
        actions: [
            { type: 'prompt', value: 'Quanto foquei hoje?', label: 'Resumo de hoje' },
            { type: 'prompt', value: 'O que focar agora?', label: 'Proximo foco' }
        ]
    };
}

function syncAssistantWelcomeMessage() {
    if (!assistantMessages.length || assistantMessages[0]?.role !== 'assistant') return;
    const firstName = (username || 'Mestre').split(' ')[0];
    const insight = buildAssistantOpenInsight();
    assistantMessages[0] = {
        id: assistantMessages[0].id || Date.now(),
        role: 'assistant',
        content: `Oi, ${firstName}. Eu fico de olho no que acontece no app e posso conversar com voc\u00ea sobre metas, hist\u00f3rico, categorias, foco e pr\u00f3ximos passos. Se quiser, posso tanto responder quanto agir por aqui.\n\n${insight}`,
        actions: [
            { type: 'prompt', value: 'Quanto foquei hoje?', label: 'Resumo de hoje' },
            { type: 'prompt', value: 'O que focar agora?', label: 'Pr\u00f3ximo foco' }
        ]
    };
    persistAssistantMessages();
}

function pushAssistantMessage(role, content, actions = []) {
    assistantMessages.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        role,
        content,
        actions
    });
    assistantMessages = assistantMessages.slice(-24);
    persistAssistantMessages();
    renderAssistantMessages();
}

function renderAssistantMessages() {
    notifyAssistantRuntime();
}

function renderAssistantSuggestions() {
    notifyAssistantRuntime();
}

function setAssistantOpen(open) {
    isAssistantOpen = !!open;
    document.body.classList.toggle('assistant-open', isAssistantOpen);
    const dock = document.getElementById('assistantDock');
    if (dock) dock.setAttribute('aria-hidden', String(!isAssistantOpen));
    notifyAssistantRuntime();
    return isAssistantOpen;
}

function switchViewFromAssistant(viewId, closeAfter = true) {
    switchView(viewId);
    if (closeAfter) {
        requestAnimationFrame(() => setAssistantOpen(false));
    }
}

function updateAssistantContext() {
    const label = document.getElementById('assistantContextLabel');
    if (label) label.textContent = `${getAssistantViewLabel()} - respostas com base nos seus dados`;

    if (!assistantMessages.length) {
        assistantMessages = [createAssistantWelcomeMessage()];
    }

    syncAssistantWelcomeMessage();
    renderAssistantMessages();

    if (!window._assistantPinnedSuggestions) {
        setAssistantSuggestions(getAssistantDefaultSuggestions());
    }
}

window.updateAssistantContext = updateAssistantContext;

function resetAssistantChat() {
    assistantConversationState = null;
    assistantMessages = [createAssistantWelcomeMessage()];
    syncAssistantWelcomeMessage();
    renderAssistantMessages();
    setAssistantSuggestions(getAssistantDefaultSuggestions());
}

function initAssistant() {
    const storedMessages = readJsonStorage(getAssistantStorageKey(), []);
    assistantMessages = Array.isArray(storedMessages) && storedMessages.length
        ? storedMessages
        : [createAssistantWelcomeMessage()];

    syncAssistantWelcomeMessage();
    setAssistantSuggestions(getAssistantDefaultSuggestions());
    renderAssistantMessages();
    updateAssistantContext();

    if (window._assistantInteractionsBound) {
        notifyAssistantRuntime();
        return;
    }

    window._assistantInteractionsBound = true;

    const fab = document.getElementById('assistantFab');
    const backdrop = document.getElementById('assistantBackdrop');
    const closeBtn = document.getElementById('assistantCloseBtn');
    const clearBtn = document.getElementById('assistantClearBtn');

    fab?.addEventListener('click', () => setAssistantOpen(true));
    closeBtn?.addEventListener('click', () => setAssistantOpen(false));
    backdrop?.addEventListener('click', () => setAssistantOpen(false));
    clearBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        customConfirm('Limpar conversa', 'Deseja limpar o historico desta conversa com o assistente?', () => {
            resetAssistantChat();
        });
    });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
            event.preventDefault();
            setAssistantOpen(!isAssistantOpen);
        }

        if (event.key === 'Escape' && isAssistantOpen) {
            setAssistantOpen(false);
        }
    });
}
