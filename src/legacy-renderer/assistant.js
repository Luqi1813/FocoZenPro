(() => {
    let deps = null;
    let interactionsBound = false;

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const formatAssistantContent = (text) => escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/&#39;/g, "'");

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenLegacyAssistant;
    };

    const getState = () => ({
        assistantMessages: deps?.getAssistantMessages?.() ?? [],
        assistantSuggestions: deps?.getAssistantSuggestions?.() ?? [],
        assistantConversationState: deps?.getAssistantConversationState?.() ?? null,
        isAssistantOpen: deps?.getIsAssistantOpen?.() ?? false,
        username: deps?.getUsername?.() ?? 'Voc\u00ea'
    });

    const persistMessages = () => {
        deps?.persistAssistantMessages?.();
    };

    const renderMessages = () => {
        const container = document.getElementById('assistantMessages');
        if (!container) return;

        const { assistantMessages, username } = getState();
        const typingMarkup = deps?.getIsTyping?.()
            ? `
                <div class="assistant-message assistant typing">
                    <span class="assistant-dot"></span>
                    <span class="assistant-dot"></span>
                    <span class="assistant-dot"></span>
                </div>
            `
            : '';

        container.innerHTML = assistantMessages.map((message) => {
            const actionsMarkup = Array.isArray(message.actions) && message.actions.length
                ? `
                    <div class="assistant-message-actions">
                        ${message.actions.map((action) => `
                            <button
                                class="assistant-message-action"
                                type="button"
                                data-assistant-action-type="${escapeHtml(action.type)}"
                                data-assistant-action-value="${encodeURIComponent(action.value || '')}">
                                ${escapeHtml(action.label)}
                            </button>
                        `).join('')}
                    </div>
                `
                : '';

            const metaMarkup = message.role === 'assistant'
                ? `<div class="assistant-message-meta"><i class="fas fa-brain"></i><span>Assistente</span></div>`
                : `<div class="assistant-message-meta"><i class="fas fa-user"></i><span>${escapeHtml((username || 'Voc\u00ea').split(' ')[0])}</span></div>`;

            return `
                <div class="assistant-message ${message.role}">
                    ${metaMarkup}
                    <div>${formatAssistantContent(message.content)}</div>
                    ${actionsMarkup}
                </div>
            `;
        }).join('') + typingMarkup;

        container.scrollTop = container.scrollHeight;
    };

    const renderSuggestions = () => {
        const container = document.getElementById('assistantSuggestions');
        if (!container) return;

        const { assistantSuggestions } = getState();
        container.innerHTML = assistantSuggestions.map((item) => `
            <button
                class="assistant-suggestion-btn"
                type="button"
                data-assistant-prompt="${encodeURIComponent(item)}">
                ${escapeHtml(item)}
            </button>
        `).join('');
    };

    const setOpen = (open) => {
        deps?.setIsAssistantOpen?.(!!open);
        document.body.classList.toggle('assistant-open', !!open);
        const dock = document.getElementById('assistantDock');
        if (dock) dock.setAttribute('aria-hidden', String(!open));
        if (open) {
            document.getElementById('assistantInput')?.focus();
            renderMessages();
        }
    };

    const syncWelcomeMessage = () => {
        const { assistantMessages } = getState();
        if (!assistantMessages.length || assistantMessages[0]?.role !== 'assistant') return;
        assistantMessages[0] = deps?.createAssistantWelcomeMessage?.(assistantMessages[0]?.id) ?? assistantMessages[0];
        deps?.setAssistantMessages?.([...assistantMessages]);
        persistMessages();
    };

    const setSuggestions = (list) => {
        deps?.setAssistantSuggestions?.(
            Array.isArray(list) && list.length ? list.slice(0, 4) : (deps?.getDefaultSuggestions?.() ?? [])
        );
        renderSuggestions();
    };

    const pushMessage = (role, content, actions = []) => {
        const nextMessages = [
            ...getState().assistantMessages,
            {
                id: Date.now() + Math.floor(Math.random() * 1000),
                role,
                content,
                actions
            }
        ].slice(-24);

        deps?.setAssistantMessages?.(nextMessages);
        persistMessages();
        renderMessages();
    };

    const autoResizeInput = () => {
        const input = document.getElementById('assistantInput');
        if (!input) return;
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
    };

    const updateContext = () => {
        const label = document.getElementById('assistantContextLabel');
        if (label) label.textContent = `${deps?.getAssistantViewLabel?.() || 'App'} · respostas com base nos seus dados`;

        if (!getState().assistantMessages.length) {
            deps?.setAssistantMessages?.([deps?.createAssistantWelcomeMessage?.()]);
        }

        syncWelcomeMessage();
        renderMessages();

        if (!window._assistantPinnedSuggestions) {
            setSuggestions(deps?.getDefaultSuggestions?.());
        }
    };

    const resetChat = () => {
        deps?.setAssistantConversationState?.(null);
        deps?.setAssistantMessages?.([deps?.createAssistantWelcomeMessage?.()]);
        syncWelcomeMessage();
        renderMessages();
        setSuggestions(deps?.getDefaultSuggestions?.());
    };

    const handleSubmit = (rawText = null) => {
        const input = document.getElementById('assistantInput');
        const text = rawText ?? input?.value?.trim();
        if (!text) return;

        setOpen(true);
        pushMessage('user', text);

        if (input) {
            input.value = '';
            autoResizeInput();
        }

        deps?.setIsTyping?.(true);
        renderMessages();

        setTimeout(() => {
            const followUpContext = deps?.getFollowUpContext?.() ?? {};
            const expandedText = deps?.assistantCore?.expandFollowUp
                ? deps.assistantCore.expandFollowUp(text, followUpContext)
                : text;
            const replyContext = deps?.getReplyContext?.() ?? {};
            let reply = deps?.assistantCore?.buildReply
                ? deps.assistantCore.buildReply(expandedText, replyContext)
                : { content: expandedText, suggestions: deps?.getDefaultSuggestions?.() ?? [] };

            reply = deps?.personalizeAssistantReply?.(reply) ?? reply;

            deps?.setIsTyping?.(false);
            if (reply?.context) deps?.setAssistantConversationState?.(reply.context);
            pushMessage('assistant', reply.content, reply.actions || []);
            setSuggestions(reply.suggestions || deps?.getDefaultSuggestions?.());
            if (reply.autoClose) {
                requestAnimationFrame(() => setOpen(false));
            }
        }, 240);
    };

    const init = () => {
        const storedMessages = deps?.readStoredMessages?.() ?? [];
        const initialMessages = Array.isArray(storedMessages) && storedMessages.length
            ? storedMessages
            : [deps?.createAssistantWelcomeMessage?.()];

        deps?.setAssistantMessages?.(initialMessages);
        syncWelcomeMessage();
        setSuggestions(deps?.getDefaultSuggestions?.());
        renderMessages();
        updateContext();

        if (interactionsBound) {
            autoResizeInput();
            return;
        }

        interactionsBound = true;

        const fab = document.getElementById('assistantFab');
        const backdrop = document.getElementById('assistantBackdrop');
        const closeBtn = document.getElementById('assistantCloseBtn');
        const clearBtn = document.getElementById('assistantClearBtn');
        const form = document.getElementById('assistantComposer');
        const input = document.getElementById('assistantInput');
        const messages = document.getElementById('assistantMessages');
        const suggestions = document.getElementById('assistantSuggestions');

        fab?.addEventListener('click', () => setOpen(true));
        closeBtn?.addEventListener('click', () => setOpen(false));
        backdrop?.addEventListener('click', () => setOpen(false));
        clearBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            deps?.customConfirm?.('Limpar conversa', 'Deseja limpar o histórico desta conversa com o assistente?', () => {
                resetChat();
            });
        });

        form?.addEventListener('submit', (event) => {
            event.preventDefault();
            handleSubmit();
        });

        input?.addEventListener('input', autoResizeInput);
        input?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
            }
            if (event.key === 'Escape' && getState().isAssistantOpen) {
                setOpen(false);
            }
        });

        suggestions?.addEventListener('click', (event) => {
            const button = event.target.closest('[data-assistant-prompt]');
            if (!button || !input) return;
            const prompt = decodeURIComponent(button.dataset.assistantPrompt || '');
            if (!prompt) return;
            input.value = prompt;
            autoResizeInput();
            handleSubmit();
        });

        messages?.addEventListener('click', (event) => {
            const button = event.target.closest('[data-assistant-action-type]');
            if (!button || !input) return;
            const type = button.dataset.assistantActionType;
            const value = decodeURIComponent(button.dataset.assistantActionValue || '');
            if (type === 'view' && value) {
                deps?.switchViewFromAssistant?.(value, true);
                return;
            }
            if (type === 'prompt' && value) {
                input.value = value;
                autoResizeInput();
                handleSubmit();
            }
        });

        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'j') {
                event.preventDefault();
                setOpen(!getState().isAssistantOpen);
            }
        });

        autoResizeInput();
    };

    window.FocoZenLegacyAssistant = Object.freeze({
        configure,
        init,
        renderMessages,
        renderSuggestions,
        setOpen,
        resetChat,
        handleSubmit,
        updateContext
    });
})();
