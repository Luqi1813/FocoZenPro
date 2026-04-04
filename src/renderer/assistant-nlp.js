function handleAssistantSubmit(rawText = null) {
    const text = String(rawText || '').trim();
    if (!text) return;

    setAssistantOpen(true);
    pushAssistantMessage('user', text);
    window._assistantTyping = true;
    renderAssistantMessages();

    setTimeout(() => {
        const expandedText = expandAssistantFollowUp(text);
        const reply = personalizeAssistantReply(buildAssistantReply(expandedText, text));
        window._assistantTyping = false;
        if (reply.context) assistantConversationState = reply.context;
        pushAssistantMessage('assistant', reply.content, reply.actions || []);
        setAssistantSuggestions(reply.suggestions || getAssistantDefaultSuggestions());
        if (reply.autoClose) {
            requestAnimationFrame(() => setAssistantOpen(false));
        }
    }, 240);
}

function getAssistantDefaultPeriod() {
    const currentView = getCurrentViewId();
    if (currentView === 'view-stats') return window._statsPeriod || 'day';
    if (currentView === 'view-goals') return window._goalsPeriod || 'day';
    return 'day';
}

function detectAssistantTemporalContext(text, fallback = null) {
    const normalized = normalizeAssistantText(text);

    if (includesAny(normalized, ['ontem'])) return { period: 'day', previous: true };
    if (includesAny(normalized, ['semana passada', 'na semana passada'])) return { period: 'week', previous: true };
    if (includesAny(normalized, ['mes passado', 'no mes passado'])) return { period: 'month', previous: true };

    if (includesAny(normalized, ['mes', 'mensal', 'ultimos 30 dias', 'ultimo mes'])) return { period: 'month', previous: false };
    if (includesAny(normalized, ['semana', 'semanal', 'ultimos 7 dias'])) return { period: 'week', previous: false };
    if (includesAny(normalized, ['hoje', 'agora', 'dia', 'diario'])) return { period: 'day', previous: false };

    return fallback || { period: getAssistantDefaultPeriod(), previous: false };
}

function getPeriodNarration(period, previous = false) {
    if (previous) {
        return {
            day: 'ontem',
            week: 'na semana passada',
            month: 'no mes passado'
        }[period] || 'no periodo anterior';
    }

    return {
        day: 'hoje',
        week: 'na semana atual',
        month: 'nos ultimos 30 dias'
    }[period] || 'neste periodo';
}

function getPeriodPromptPhrase(period, previous = false) {
    if (previous) {
        return {
            day: 'ontem',
            week: 'na semana passada',
            month: 'no mes passado'
        }[period] || 'no periodo anterior';
    }

    return {
        day: 'hoje',
        week: 'esta semana',
        month: 'neste mes'
    }[period] || 'neste periodo';
}

function getAllAssistantCategories() {
    const merged = [
        ...defaultCategories,
        ...userCategories,
        ...focusGoals.map(goal => ({ name: goal.category }))
    ];
    const seen = new Set();

    return merged
        .map(item => item?.name)
        .filter(Boolean)
        .filter(name => {
            const key = normalizeAssistantText(name);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function detectAssistantCategory(text) {
    const normalized = normalizeAssistantText(text);
    const categories = getAllAssistantCategories().slice().sort((a, b) => b.length - a.length);

    const aliases = {
        trabalho: 'Trabalho',
        estudo: 'Estudos',
        estudos: 'Estudos',
        estudar: 'Estudos',
        projeto: 'Projetos',
        projetos: 'Projetos',
        leitura: 'Leitura',
        ler: 'Leitura',
        livro: 'Leitura',
        hobby: 'Hobbies',
        hobbies: 'Hobbies',
        lazer: 'Hobbies',
        livre: 'Livre'
    };

    for (const category of categories) {
        const key = normalizeAssistantText(category);
        if (normalized.includes(key)) return category;
    }

    for (const [alias, category] of Object.entries(aliases)) {
        if (normalized.includes(alias)) {
            const matched = categories.find(item => normalizeAssistantText(item) === normalizeAssistantText(category));
            return matched || category;
        }
    }

    return null;
}

function detectAssistantDurationMinutes(text) {
    const normalized = normalizeAssistantText(text).replace(/,/g, '.');
    let minutes = 0;
    let matched = false;

    const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*h(?:ora|oras)?/);
    if (hourMatch) {
        minutes += Math.round(parseFloat(hourMatch[1]) * 60);
        matched = true;
    }

    const minuteMatch = normalized.match(/(\d+)\s*min(?:uto|utos)?/);
    if (minuteMatch) {
        minutes += parseInt(minuteMatch[1], 10);
        matched = true;
    }

    if (!matched) {
        const pomodoroMatch = normalized.match(/(\d+)\s*(pomodoro|pomodoros|bloco|blocos)/);
        if (pomodoroMatch) {
            minutes += parseInt(pomodoroMatch[1], 10) * POMODORO_MINUTES;
            matched = true;
        }
    }

    return matched && minutes > 0 ? minutes : null;
}

function detectAssistantSchedule(text) {
    const normalized = normalizeAssistantText(text);
    if (includesAny(normalized, ['todo dia', 'todos os dias', 'semana inteira', 'todos os dias da semana'])) return 'everyday';
    if (includesAny(normalized, ['dias uteis', 'segunda a sexta', 'seg a sex', 'dias da semana'])) return 'weekdays';
    return null;
}

function escapeAssistantRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function prettifyAssistantTaskName(name) {
    const cleaned = String(name || '')
        .replace(/\s+/g, ' ')
        .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
        .trim();

    if (!cleaned) return '';
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractAssistantTaskName(text, category = null) {
    let normalized = normalizeAssistantText(text)
        .replace(/^(me ajuda a|me ajude a|pode|por favor)\s+/, '')
        .replace(/^(pode ser pra|pode ser para|ser pra|ser para)\s+/, '')
        .replace(/^(iniciar|inicie|comecar|comece|criar|crie|adicionar|adicione|abrir|abra|fazer|faca|montar|monte)\s+(uma\s+|nova\s+|uma\s+nova\s+)?tarefa\b/, '')
        .replace(/\btarefa\b/, '')
        .trim();

    normalized = normalized
        .replace(/\bde\s+\d+(?:\.\d+)?\s*h(?:ora|oras)?\b/g, ' ')
        .replace(/\b\d+(?:\.\d+)?\s*h(?:ora|oras)?\b/g, ' ')
        .replace(/\bde\s+\d+\s*min(?:uto|utos)?\b/g, ' ')
        .replace(/\b\d+\s*min(?:uto|utos)?\b/g, ' ')
        .replace(/\b\d+\s*(pomodoro|pomodoros|bloco|blocos)\b/g, ' ');

    if (category) {
        const categoryNorm = normalizeAssistantText(category);
        const categoryPattern = escapeAssistantRegex(categoryNorm);
        normalized = normalized
            .replace(new RegExp(`\\bna categoria\\s+${categoryPattern}\\b`, 'g'), ' ')
            .replace(new RegExp(`\\bcategoria\\s+${categoryPattern}\\b`, 'g'), ' ')
            .replace(new RegExp(`\\bem\\s+${categoryPattern}\\b`, 'g'), ' ');
    }

    normalized = normalized
        .replace(/\b(chamada|chamado|nome|com nome)\b/g, ' ')
        .replace(/^(pra|para)\s+/, '')
        .replace(/^(de|da|do|para|pra|em|na|no)\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();

    return prettifyAssistantTaskName(normalized);
}

function extractAssistantTaskDraft(text, baseDraft = null) {
    const seed = baseDraft ? { ...baseDraft } : {};
    const category = detectAssistantCategory(text) || seed.category || null;
    const durationMinutes = detectAssistantDurationMinutes(text) || seed.durationMinutes || null;
    const existingTask = findAssistantTaskByText(text);

    let name = extractAssistantTaskName(text, category);
    if (!name && seed.name) name = seed.name;

    return {
        name: name || '',
        category,
        durationMinutes,
        existingTask: existingTask || seed.existingTask || null
    };
}

function getAssistantMissingTaskFields(draft) {
    const missing = [];
    if (!draft?.name) missing.push('nome');
    if (!draft?.category) missing.push('categoria');
    if (!draft?.durationMinutes) missing.push('duracao');
    return missing;
}

function createTaskFromAssistant(draft, startNow = true) {
    const safeName = prettifyAssistantTaskName(draft?.name || '');
    const safeCategory = draft?.category || 'Livre';
    const safeMinutes = Math.max(1, Math.round(Number(draft?.durationMinutes) || 25));
    const task = {
        id: Date.now(),
        name: safeName,
        estimatedMinutes: safeMinutes,
        pomodoros: Math.max(1, Math.ceil(safeMinutes / POMODORO_MINUTES)),
        category: safeCategory,
        completedPomodoros: 0,
        completed: false,
        subtasks: [],
        createdAt: new Date().toISOString()
    };

    tasks.push(task);
    saveTasks();
    renderTasksList();
    renderTasksSidebar();
    renderProgress();
    updateHeaderTaskCount();
    syncStateToPip();

    if (startNow) {
        startTask(task.id);
    }

    return task;
}

function createTaskFromAssistant(draft, startNow = true) {
    return taskSessionService.createTaskFromAssistant(draft, startNow);
}

function applyAssistantFreeFocus(durationMinutes = null, category = null) {
    switchView('view-home');
    if (isTimerRunning) pauseTimer();
    if (currentTask) deselectTask();

    const resolvedMinutes = Math.max(1, Math.round(Number(durationMinutes) || FOCUS_TIME));
    const resolvedCategory = category || document.getElementById('globalCategorySelect')?.value || 'Livre';
    const globalCategorySelect = document.getElementById('globalCategorySelect');
    if (globalCategorySelect) {
        globalCategorySelect.value = resolvedCategory;
        window.updateCustomDropdownUI(resolvedCategory);
    }

    currentMode = 'focus';
    totalTimerTime = resolvedMinutes * 60;
    timeLeft = totalTimerTime;
    applyTimerModeUi({ mode: 'focus', resetToggleButton: true });
    updateTimerDisplay();
    updateProgressBar();
    renderProgress();
    renderTasksSidebar();
    syncStateToPip();

    if (!isTimerRunning) toggleTimer();
}
