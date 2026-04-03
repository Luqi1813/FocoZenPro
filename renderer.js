const constantsService = window.FocoZenConstants;
const storageService = window.FocoZenStorage;
const utilsService = window.FocoZenUtils;
const historyCore = window.FocoZenHistoryCore;
const goalsCore = window.FocoZenGoalsCore;
const timerCore = window.FocoZenTimerCore;
const pipService = window.FocoZenPipService;
const updateService = window.FocoZenUpdateService;
const audioService = window.FocoZenAudioService;
const taskSessionService = window.FocoZenTaskSessionService;

const assistantCore = window.FocoZenAssistantCore;

const storageKeys = storageService?.storageKeys ?? {
    TASKS: 'focozen_tasks',
    HISTORY: 'focozen_history',
    GOALS: 'focozen_goals',
    CATEGORIES: 'focozen_categories',
    SAVED_SESSION: 'focozen_saved_session',
    TOTAL_POMODOROS: 'focozen_total_pomodoros',
    SHOW_BUBBLE_TEXT: 'focozen_show_bubble_text',
    USERNAME: 'focozen_username',
    WIZARD_CATEGORIES: 'focozen_wizard_categories',
    QUOTE_INDEX: 'focozen_quote_index',
    LAST_QUOTE_DATE: 'focozen_last_quote_date',
    AUDIO_SOUND_ID: 'focozen_audio_sound_id',
    AUDIO_VOLUME: 'focozen_audio_volume',
    AUDIO_MUTED: 'focozen_audio_muted',
    AUDIO_PREVIOUS_VOLUME: 'focozen_audio_previous_volume',
    UPDATED_VERSION: 'focozen_updated_version',
    CHANGELOG: 'focozen_changelog',
    LAST_VERSION: 'focozen_last_version',
    LAST_CHANGELOG: 'focozen_last_changelog'
};

const soundsConfig = constantsService?.soundsConfig ?? [
    { id: 'chuva', name: 'Chuva', icon: 'fa-cloud-rain', image: 'chuva.jpg', file: 'chuva.mp3' },
    { id: 'oceano', name: 'Oceano', icon: 'fa-water', image: 'oceano.jpg', file: 'oceano.mp3' },
    { id: 'floresta', name: 'Floresta', icon: 'fa-tree', image: 'floresta.jpg', file: 'floresta.mp3' },
    { id: 'fogueira', name: 'Fogueira', icon: 'fa-fire', image: 'fogueira.jpg', file: 'fogueira.mp3' },
    { id: 'teclado', name: 'Teclado', icon: 'fa-keyboard', image: 'teclado.jpg', file: 'teclado.mp3' },
    { id: 'classica', name: 'Clássica', icon: 'fa-music', image: 'classica.jpg', file: 'classica.mp3' },
    { id: 'Jazz', name: 'Jazz', icon: 'fa-music', image: 'jazz.jpg', file: 'Jazz.mp3' },
    { id: 'Lo-fi', name: 'Lo-Fi', icon: 'fa-headphones', image: 'lofi.jpg', file: 'Lo-fi.mp3' },
    { id: 'Brown noise', name: 'Brown Noise', icon: 'fa-wave-square', image: 'default.jpg', file: 'Brown noise.mp3' },
    { id: 'Pink noise', name: 'Pink Noise', icon: 'fa-wave-square', image: 'default.jpg', file: 'Pink noise.mp3' },
    { id: '40hz', name: '40Hz Gama', icon: 'fa-wave-square', image: 'default.jpg', file: '40hz (Ondas Gama).mp3' }
];

const soundCategories = constantsService?.soundCategories ?? {
    'Natureza': { icon: 'fa-leaf', ids: ['chuva', 'oceano', 'floresta', 'fogueira'] },
    'Música & Foco': { icon: 'fa-headphones', ids: ['teclado', 'classica', 'Jazz', 'Lo-fi'] },
    'Frequências': { icon: 'fa-wave-square', ids: ['Brown noise', 'Pink noise', '40hz'] }
};

const soundThemes = constantsService?.soundThemes ?? {
    'chuva': 'water', 'oceano': 'water', 'floresta': 'nature', 'fogueira': 'fire',
    'teclado': 'yellow', 'classica': 'classica', 'Jazz': 'jazz', 'Lo-fi': 'lofi',
    'Brown noise': 'brown', 'Pink noise': 'pink', '40hz': 'sky'
};

const quotes = constantsService?.quotes ?? [
    { text: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", author: "Albert Einstein" },
    { text: "O conhecimento é a única riqueza que se expande quando compartilhada.", author: "Sócrates" },
    { text: "Nao espere por circunstancias ideais. Comece agora.", author: "Seneca" }
];

const successQuotes = constantsService?.successQuotes ?? [
    { text: "A vitoria pertence ao mais perseverante.", author: "Napoleao Bonaparte" },
    { text: "Nao e porque as coisas sao dificeis que nao ousamos; e porque nao ousamos que elas sao dificeis.", author: "Seneca" },
    { text: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill" },
    { text: "Faça o que puder, com o que tiver, onde estiver.", author: "Theodore Roosevelt" },
    { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
    { text: "Voce nao precisa ser grande para comecar, mas precisa comecar para ser grande.", author: "Zig Ziglar" }
];

const POMODORO_MINUTES = constantsService?.POMODORO_MINUTES ?? 25;
const SHORT_BREAK_MINUTES = constantsService?.SHORT_BREAK_MINUTES ?? 5;
const LONG_BREAK_MINUTES = constantsService?.LONG_BREAK_MINUTES ?? 15;

const defaultCategories = constantsService?.defaultCategories ?? [
    { name: 'Livre', icon: 'fa-infinity' },
    { name: 'Trabalho', icon: 'fa-briefcase' },
    { name: 'Estudos', icon: 'fa-book' },
    { name: 'Projetos', icon: 'fa-laptop-code' },
    { name: 'Leitura', icon: 'fa-book-open' },
    { name: 'Hobbies', icon: 'fa-palette' },
    { name: 'Exercício', icon: 'fa-dumbbell' }
];
let userCategories = [];
let isEditingCategories = false;

let currentAudio = null;
let currentSoundId = null;
let isPlaying = false;
let masterVolume = 0.7;
let isMuted = false;
let volumeBeforeMute = 0.7;
let timerInterval = null;
let timeLeft = POMODORO_MINUTES * 60;
let isTimerRunning = false;
let totalTimerTime = POMODORO_MINUTES * 60;
let currentMode = 'focus';

let tasks = [];
let currentTask = null;
let username = 'Convidado';
let focusHistory = [];
let focusGoals = [];
let completedPomodoros = 0;
let totalPomodorosToday = 0;
let isDeleteMode = false;
let selectedTasksForDelete = new Set();
let tempSubtasks = [];
let editingTaskId = null;
let editingGoalId = null;
let showBubbleText = true;
let isPipModeActive = false;
let toastHideTimer = null;
let testMode = false;
let pendingCompletionType = null;
let pendingTaskResolution = null;
let feedbackPopupTimer = null;
let assistantMessages = [];
let assistantSuggestions = [];
let isAssistantOpen = false;
let assistantConversationState = null;

const GOALS_RUNTIME_CHANGE_EVENT = 'focozen:goals-runtime-change';
const GOALS_RUNTIME_EDIT_EVENT = 'focozen:goals-runtime-edit';
const STATS_RUNTIME_CHANGE_EVENT = 'focozen:stats-runtime-change';
const ASSISTANT_RUNTIME_CHANGE_EVENT = 'focozen:assistant-runtime-change';
const HOME_RUNTIME_CHANGE_EVENT = 'focozen:home-runtime-change';
const TIMER_RUNTIME_CHANGE_EVENT = 'focozen:timer-runtime-change';
const TASKS_RUNTIME_CHANGE_EVENT = 'focozen:tasks-runtime-change';

function cloneRuntimeData(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
}

function getGoalsRuntimeSnapshot() {
    return {
        focusGoals: cloneRuntimeData(focusGoals),
        focusHistory: cloneRuntimeData(focusHistory),
        userCategories: cloneRuntimeData(userCategories),
        username,
        goalsPeriod: window._goalsPeriod || 'week',
        statsPeriod: window._statsPeriod || 'week'
    };
}

function notifyGoalsRuntime() {
    window.dispatchEvent(new CustomEvent(GOALS_RUNTIME_CHANGE_EVENT, {
        detail: getGoalsRuntimeSnapshot()
    }));
}

function emitGoalsRuntimeEdit(goalId) {
    window.dispatchEvent(new CustomEvent(GOALS_RUNTIME_EDIT_EVENT, {
        detail: { goalId }
    }));
}

function getStatsCompletionRate() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    if (totalTasks === 0 && focusHistory.length > 0) {
        return 80;
    }

    if (totalTasks > 0) {
        return Math.round((completedTasks / totalTasks) * 100);
    }

    return 0;
}

function buildStatsGoalsSummaryData(period) {
    const overview = getGoalOverviewData(period);
    const momentum = getGoalMomentumContent(overview);
    const series = getGoalEvolutionSeriesData(period);
    const periodLabel = getPeriodLabel(period);

    if (!overview.summaries.length || !series.length) {
        return {
            periodLabel,
            badge: momentum.badge,
            headline: momentum.headline,
            caption: '',
            isEmpty: true,
            emptyMessage: 'Defina metas na aba Metas para acompanhar a evolucao do seu plano por periodo.',
            totalActualLabel: formatMinutesToHours(overview.totalActual),
            totalTargetLabel: formatMinutesToHours(overview.totalTarget),
            overallPercent: 0
        };
    }

    const overallPercent = overview.totalTarget > 0
        ? Math.max(0, Math.round((overview.totalActual / overview.totalTarget) * 100))
        : 0;

    return {
        periodLabel,
        badge: momentum.badge,
        headline: momentum.headline,
        caption: '',
        isEmpty: false,
        emptyMessage: '',
        totalActualLabel: formatMinutesToHours(overview.totalActual),
        totalTargetLabel: formatMinutesToHours(overview.totalTarget),
        overallPercent
    };
}

function getStatsRuntimeSnapshot() {
    const { todayMinutes, weekMinutes } = getFocusWindowSummaryData();
    const greetingState = getFocusGreetingStateData({ todayMinutes, weekMinutes });
    const { currentStreak, maxStreak } = getFocusStreakSummaryData();
    const firstName = String(username || 'Convidado').split(' ')[0];
    const statsPeriod = window._statsPeriod || 'week';

    let greetingTitle = `Mandou bem, ${firstName}!`;
    let greetingSubtitle = 'Aqui esta o resumo do seu foco.';

    if (greetingState === 'master') {
        greetingTitle = `Mestre do Foco, ${firstName}`;
        greetingSubtitle = 'Seu desempenho hoje foi excepcional.';
    } else if (greetingState === 'consistent') {
        greetingTitle = `Consistente, ${firstName}`;
        greetingSubtitle = 'Otimo ritmo, cada minuto focado conta.';
    } else if (greetingState === 'start') {
        greetingTitle = `Hora de focar, ${firstName}`;
        greetingSubtitle = 'Inicie uma sessao de foco para registrar seu dia.';
    }

    return {
        focusHistory: cloneRuntimeData(focusHistory),
        tasks: cloneRuntimeData(tasks),
        username,
        statsPeriod,
        cards: {
            todayFocus: formatMinutesToHours(todayMinutes),
            weekFocus: formatMinutesToHours(weekMinutes),
            currentStreak,
            maxStreak,
            completionRate: getStatsCompletionRate()
        },
        greeting: {
            title: greetingTitle,
            subtitle: greetingSubtitle
        },
        goalsSummary: buildStatsGoalsSummaryData(statsPeriod)
    };
}

function notifyStatsRuntime() {
    window.dispatchEvent(new CustomEvent(STATS_RUNTIME_CHANGE_EVENT, {
        detail: getStatsRuntimeSnapshot()
    }));
}

function getAssistantRuntimeSnapshot() {
    return {
        messages: cloneRuntimeData(assistantMessages),
        suggestions: cloneRuntimeData(assistantSuggestions),
        isOpen: !!isAssistantOpen,
        isTyping: !!window._assistantTyping,
        username,
        contextLabel: `${getAssistantViewLabel()} - respostas com base nos seus dados`
    };
}

function notifyAssistantRuntime() {
    window.dispatchEvent(new CustomEvent(ASSISTANT_RUNTIME_CHANGE_EVENT, {
        detail: getAssistantRuntimeSnapshot()
    }));
}

window.FocoZenGoalsRuntime = Object.freeze({
    getSnapshot: getGoalsRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getGoalsRuntimeSnapshot());
        window.addEventListener(GOALS_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(GOALS_RUNTIME_CHANGE_EVENT, handler);
    },
    subscribeEdit(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? {});
        window.addEventListener(GOALS_RUNTIME_EDIT_EVENT, handler);
        return () => window.removeEventListener(GOALS_RUNTIME_EDIT_EVENT, handler);
    },
    refresh() {
        notifyGoalsRuntime();
        return getGoalsRuntimeSnapshot();
    },
    setGoalsPeriod(period) {
        window._goalsPeriod = period || 'week';
        notifyGoalsRuntime();
        return window._goalsPeriod;
    },
    getGoalMomentumContent(overview) {
        return getGoalMomentumContent(overview);
    },
    saveGoal({ goalId = null, category, dailyMinutes, schedule }) {
        const result = saveGoalEntry({ goalId, category, dailyMinutes, schedule });
        showGlassToast(result?.message || 'Nao foi possivel salvar a meta.');
        return result;
    },
    deleteGoal(goalId) {
        return new Promise((resolve) => {
            const goal = focusGoals.find((item) => item.id === goalId);
            if (!goal) {
                resolve({ ok: false, message: 'Meta nao encontrada.' });
                return;
            }

            customConfirm(
                'Excluir Meta',
                `Deseja excluir a meta da categoria "${goal.category}"?`,
                () => {
                    focusGoals = focusGoals.filter((item) => item.id !== goalId);
                    saveFocusGoals();
                    if (editingGoalId === goalId) resetGoalForm();
                    renderStatsGoalsSummary(window._statsPeriod || 'week');
                    window.compileGoalsData?.();
                    showGlassToast('Meta removida');
                    resolve({ ok: true, message: 'Meta removida.' });
                },
                () => resolve({ ok: false, cancelled: true, message: 'Acao cancelada.' })
            );
        });
    },
    startEdit(goalId) {
        emitGoalsRuntimeEdit(goalId);
        const goal = focusGoals.find((item) => item.id === goalId) ?? null;
        return cloneRuntimeData(goal);
    }
});

window.FocoZenStatsRuntime = Object.freeze({
    getSnapshot: getStatsRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getStatsRuntimeSnapshot());
        window.addEventListener(STATS_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(STATS_RUNTIME_CHANGE_EVENT, handler);
    },
    refresh() {
        notifyStatsRuntime();
        return getStatsRuntimeSnapshot();
    },
    setStatsPeriod(period) {
        window._statsPeriod = period || 'week';
        notifyStatsRuntime();
        return window._statsPeriod;
    },
    renderCategoriesChart(canvasEl, legendEl, history) {
        return renderCategoriesChart(canvasEl, legendEl, history);
    },
    renderPeriodBarChart(canvasEl, history, period) {
        return renderPeriodBarChart(canvasEl, history, period);
    }
});

window.FocoZenAssistantRuntime = Object.freeze({
    getSnapshot: getAssistantRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getAssistantRuntimeSnapshot());
        window.addEventListener(ASSISTANT_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(ASSISTANT_RUNTIME_CHANGE_EVENT, handler);
    },
    submit(text) {
        return handleAssistantSubmit(text);
    },
    reset() {
        return resetAssistantChat();
    },
    setOpen(open) {
        return setAssistantOpen(open);
    },
    handleAction(actionType, actionValue) {
        if (actionType === 'view' && actionValue) {
            switchViewFromAssistant(actionValue, true);
            return true;
        }

        if (actionType === 'prompt' && actionValue) {
            handleAssistantSubmit(actionValue);
            return true;
        }

        return false;
    }
});

function getHomeRuntimeSnapshot() {
    const currentSound = soundsConfig.find((s) => s.id === currentSoundId) || null;
    const soundTheme = currentSound ? (soundThemes[currentSound.id] || 'default') : 'default';

    const taskProgressPercent = (() => {
        let percent = 0;
        if (currentTask?.pomodoros > 0) {
            percent = (currentTask.completedPomodoros / currentTask.pomodoros) * 100;
        }
        if (currentMode === 'focus' && totalTimerTime > 0) {
            const currentTimerFraction = timerCore?.getTimerProgress
                ? (timerCore.getTimerProgress({ timeLeft, totalTime: totalTimerTime }) / 100)
                : ((totalTimerTime - timeLeft) / totalTimerTime);
            if (currentTask?.pomodoros > 0) {
                percent = ((currentTask.completedPomodoros + currentTimerFraction) / currentTask.pomodoros) * 100;
            } else {
                percent = currentTimerFraction * 100;
            }
        }
        return Math.max(0, Math.min(100, percent));
    })();

    return {
        // Audio
        currentSoundId,
        currentSoundName: currentSound?.name || null,
        soundTheme,
        isPlaying,
        masterVolume,
        isMuted,
        // Task & Mode
        currentTask: currentTask ? cloneRuntimeData(currentTask) : null,
        currentMode,
        timeLeft,
        totalTimerTime,
        isTimerRunning,
        // Progress
        showBubbleText,
        taskProgressPercent,
        progressTitle: currentTask ? currentTask.name : 'Sessao Livre de Foco',
        // Category
        userCategories: cloneRuntimeData(userCategories),
        activeCategory: document.getElementById('globalCategorySelect')?.value || 'Livre'
    };
}

function notifyHomeRuntime() {
    window.dispatchEvent(new CustomEvent(HOME_RUNTIME_CHANGE_EVENT, {
        detail: getHomeRuntimeSnapshot()
    }));
}

window.FocoZenHomeRuntime = Object.freeze({
    getSnapshot: getHomeRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getHomeRuntimeSnapshot());
        window.addEventListener(HOME_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(HOME_RUNTIME_CHANGE_EVENT, handler);
    },
    refresh() {
        notifyHomeRuntime();
        return getHomeRuntimeSnapshot();
    },
    async selectSound(sound, card) {
        const result = await audioService?.selectSound?.(sound, {
            toggleOff: !!card,
            autoplay: true
        });
        if (!result?.ok && result?.reason !== 'selection-superseded') {
            console.error('Erro audio:', result?.error || result?.reason || 'falha desconhecida');
        }
        return result;
    },
    async toggleMasterPlay() {
        if (!currentSoundId) {
            showGlassToast('Selecione algum som para iniciar');
            return { ok: false, reason: 'no-sound-selected' };
        }
        const result = await audioService?.togglePlay?.();
        if (!result?.ok && result?.reason !== 'no-sound-selected') {
            console.error('Erro ao alternar audio:', result?.error || result?.reason || 'falha desconhecida');
        }
        return result;
    },
    toggleMute() {
        audioService?.toggleMute?.();
    },
    setVolume(percent) {
        audioService?.setVolume?.(percent / 100);
    },
    async getSoundGroups() {
        const groups = audioService?.getCategorizedAvailableSounds?.() ?? [];
        return cloneRuntimeData(groups);
    },
    async initializeAudio() {
        return audioService?.initialize?.() ?? [];
    },
    changeCategory(categoryName) {
        const globalCategory = document.getElementById('globalCategorySelect');
        if (globalCategory) globalCategory.value = categoryName;
        notifyHomeRuntime();
    },
    handleFreeFocus() {
        const hasProgress = currentMode === 'focus' && timeLeft < totalTimerTime;
        if (hasProgress && typeof window.attemptDeselectTask === 'function') {
            window.attemptDeselectTask(false);
            return;
        }
        if (currentTask) {
            taskSessionService?.deselectTask?.();
        }
    },
    toggleBubbleText() {
        showBubbleText = !showBubbleText;
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.SHOW_BUBBLE_TEXT, showBubbleText);
        } else {
            localStorage.setItem(storageKeys.SHOW_BUBBLE_TEXT, showBubbleText);
        }
        notifyHomeRuntime();
    },
    openCreateModal() {
        openCreateModal();
    },
    canChangeCategory() {
        const hasProgress = currentMode === 'focus' && timeLeft < totalTimerTime;
        if (isTimerRunning || hasProgress) {
            customAlert('Sessao Ativa', 'Para mudar a categoria, reinicie o temporizador ou conclua a sessao atual.');
            return false;
        }
        if (currentTask) {
            customAlert('Tarefa Vinculada', 'Para mudar a categoria, edite a tarefa (botao de lapis na barra lateral).');
            return false;
        }
        return true;
    },
    enterPip() {
        console.log('[HomeRuntime] Solicitando entrada em PIP...');
        if (!pipService) {
            console.error('[HomeRuntime] pipService nao inicializado!');
            return false;
        }
        if (pipService.enter && pipService.enter()) {
            console.log('[HomeRuntime] PIP aberto com sucesso');
            isPipModeActive = true;
            syncStateToPip();
            return true;
        }
        console.warn('[HomeRuntime] pipService.enter() falhou ou nao existe');
        return false;
    }
});

// ==========================================
// TIMER RUNTIME V2
// ==========================================

function getTimerRuntimeSnapshot() {
    return {
        currentMode,
        timeLeft,
        totalTimerTime,
        isTimerRunning,
        progressTitle: currentTask ? currentTask.name : 'Sessao Livre',
        progress: timerCore?.getTimerProgress
            ? timerCore.getTimerProgress({ timeLeft, totalTime: totalTimerTime })
            : (totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0),
        timeString: timerCore?.formatTimerLabel
            ? timerCore.formatTimerLabel(timeLeft)
            : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
    };
}

function notifyTimerRuntime() {
    const snapshot = getTimerRuntimeSnapshot();
    document.title = `${snapshot.timeString} - FocoZen Pro`;
    window.dispatchEvent(new CustomEvent(TIMER_RUNTIME_CHANGE_EVENT, {
        detail: snapshot
    }));
    // We also notify Home so the progress bubble (liquid glass) updates its "percent" based on the new timer tick
    notifyHomeRuntime();
    notifyTasksRuntime();
}

window.FocoZenTimerRuntime = Object.freeze({
    getSnapshot: getTimerRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getTimerRuntimeSnapshot());
        window.addEventListener(TIMER_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(TIMER_RUNTIME_CHANGE_EVENT, handler);
    },
    onSetMode: (mode) => setTimerMode(mode),
    onToggleTimer: () => toggleTimer(),
    onResetTimer: () => resetTimer(),
    onAdjustTime: (minutes) => adjustTime(minutes)
});

function getTasksRuntimeSnapshot() {
    return {
        tasks: cloneRuntimeData(tasks),
        currentTaskId: currentTask?.id ?? null,
        currentMode,
        isTimerRunning,
        timeLeft,
        totalTimerTime,
        isDeleteMode: !!isDeleteMode,
        selectedTaskIds: [...selectedTasksForDelete]
    };
}

function notifyTasksRuntime() {
    window.dispatchEvent(new CustomEvent(TASKS_RUNTIME_CHANGE_EVENT, {
        detail: getTasksRuntimeSnapshot()
    }));
}

window.FocoZenTasksRuntime = Object.freeze({
    getSnapshot: getTasksRuntimeSnapshot,
    subscribe(listener) {
        if (typeof listener !== 'function') return () => {};
        const handler = (event) => listener(event.detail ?? getTasksRuntimeSnapshot());
        window.addEventListener(TASKS_RUNTIME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(TASKS_RUNTIME_CHANGE_EVENT, handler);
    },
    selectTask(taskId) {
        return selectTask(taskId);
    },
    startTask(taskId) {
        return startTask(taskId);
    },
    editTask(taskId) {
        return editTask(taskId);
    },
    toggleTaskComplete(taskId) {
        return toggleTaskComplete(taskId);
    },
    toggleTaskTimer() {
        return toggleTaskTimer();
    },
    toggleSubtask(taskId, subtaskId) {
        return window.toggleSubtask(taskId, subtaskId);
    },
    toggleDeleteMode() {
        isDeleteMode = !isDeleteMode;
        selectedTasksForDelete.clear();
        renderTasksSidebar();
        return isDeleteMode;
    },
    deleteTask(taskId) {
        return window.deleteTask(taskId);
    },
    deleteSelectedTasks() {
        return window.deleteSelectedTasks();
    },
    toggleTaskSelection(taskId, isSelected) {
        return window.toggleTaskSelection(taskId, isSelected);
    },
    toggleSelectAllTasks(isSelected) {
        return window.toggleSelectAllTasks(isSelected);
    },
    openCreateTaskModal() {
        return openCreateModal();
    }
});

const motivationalRestartMessages = constantsService?.motivationalRestartMessages ?? [
    'Pausar nao e desistir. Voce pode recomecar com mais clareza depois.',
    'Seu progresso conta. Respire, recarregue e volte mais forte.',
    'Todo grande avanço também respeita pausas inteligentes.',
    'Voce nao perdeu o ritmo. So esta escolhendo o melhor momento para continuar.',
    'Disciplina também é saber a hora de recomeçar com energia.'
];

function ensureRequiredContract(name, contract, methods = []) {
    if (!contract) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }

    methods.forEach((method) => {
        if (typeof contract[method] !== 'function') {
            throw new Error(`Contrato obrigatorio invalido: ${name}.${method}`);
        }
    });

    return contract;
}

function assertRequiredBootstrapContracts() {
    ensureRequiredContract('window.FocoZenAudioService', audioService, ['configure', 'initialize', 'selectSound', 'togglePlay', 'toggleMute', 'setVolume']);
    ensureRequiredContract('window.FocoZenTaskSessionService', taskSessionService, ['configure', 'readSavedSession', 'saveSavedSession', 'createTaskFromAssistant', 'deselectTask', 'promptResumeSession', 'startTask', 'selectTask', 'performTaskSelection', 'toggleTaskComplete']);
    ensureRequiredContract('window.FocoZenAssistantCore', assistantCore, ['normalizeText', 'detectTemporalContext', 'detectCategory', 'detectDurationMinutes', 'detectSchedule', 'extractTaskDraft', 'getMissingTaskFields', 'expandFollowUp', 'buildReply']);
}

function getTaskFocusDurationSeconds(task = currentTask) {
    if (timerCore?.getTaskSessionDurationSeconds) {
        return timerCore.getTaskSessionDurationSeconds({
            task,
            testMode,
            pomodoroMinutes: POMODORO_MINUTES
        });
    }

    if (utilsService?.calculateTaskFocusDurationSeconds) {
        return utilsService.calculateTaskFocusDurationSeconds({
            task,
            testMode,
            pomodoroMinutes: POMODORO_MINUTES
        });
    }

    if (!task) return testMode ? 5 : POMODORO_MINUTES * 60;

    const completedBlocks = Math.floor(task.completedPomodoros || 0);
    const totalMinutes = Number(task.estimatedMinutes) || POMODORO_MINUTES;
    const remainingMinutes = Math.max(0, totalMinutes - (completedBlocks * POMODORO_MINUTES));
    const nextBlockMinutes = remainingMinutes > 0 ? Math.min(POMODORO_MINUTES, remainingMinutes) : POMODORO_MINUTES;

    return testMode ? 5 : Math.max(1, Math.round(nextBlockMinutes * 60));
}

function readJsonStorage(key, fallback) {
    if (storageService?.readJsonStorage) {
        return storageService.readJsonStorage(key, fallback);
    }

    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch (error) {
        console.warn(`Falha ao ler ${key} do armazenamento local:`, error);
        return fallback;
    }
}

function writeJsonStorage(key, value) {
    if (storageService?.writeJsonStorage) {
        storageService.writeJsonStorage(key, value);
        return;
    }

    localStorage.setItem(key, JSON.stringify(value));
}

function readNumberStorage(key, fallback = 0) {
    if (storageService?.readNumberStorage) {
        return storageService.readNumberStorage(key, fallback);
    }

    const value = Number.parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(value) ? value : fallback;
}

function saveTasks() {
    writeJsonStorage(storageKeys.TASKS, tasks);
    notifyStatsRuntime();
    notifyTasksRuntime();
}

function saveFocusHistory() {
    writeJsonStorage(storageKeys.HISTORY, focusHistory);
    notifyGoalsRuntime();
    notifyStatsRuntime();
}

function saveFocusGoals() {
    writeJsonStorage(storageKeys.GOALS, focusGoals);
    notifyGoalsRuntime();
    notifyStatsRuntime();
}

function saveUserCategories() {
    writeJsonStorage(storageKeys.CATEGORIES, userCategories);
    notifyGoalsRuntime();
}

function readSavedSession() {
    return taskSessionService.readSavedSession();
}

function saveSavedSession(session) {
    taskSessionService.saveSavedSession(session);
}

function checkWizardOnboarding() {
    const storedUsername = storageService?.readStorageValue
        ? storageService.readStorageValue(storageKeys.USERNAME, null)
        : localStorage.getItem(storageKeys.USERNAME);

    if (!storedUsername) {
        document.getElementById('wizardModal')?.classList.add('active');
    }
}

function applySelectedTaskUi(task) {
    notifyHomeRuntime();
}

function applyFreeFocusUi({ category = 'Livre' } = {}) {
    const globalCategory = document.getElementById('globalCategorySelect');
    if (globalCategory) globalCategory.value = category;
    notifyHomeRuntime();
}

function applyTimerModeUi({ mode = 'focus', resetToggleButton = true } = {}) {
    notifyTimerRuntime();
}

function hideWelcomeModal() {
    document.getElementById('welcomeModal')?.classList.remove('active');
}

function showTaskSwitchPrompt({ onDiscard, onSave, onCancel }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align:center; max-width:400px;">
            <div class="elegant-icon" style="color:#f59e0b;"><i class="fas fa-exchange-alt"></i></div>
            <h3 class="elegant-title">Trocar Tarefa?</h3>
            <p class="elegant-message">Voce tem progresso na tarefa atual. O que deseja fazer?</p>
            <div class="elegant-actions">
                <button class="btn-modal danger btn-discard-sw">Desistir e Trocar</button>
                <button class="btn-modal primary btn-save-sw">Salvar e Trocar</button>
            </div>
            <button class="btn-modal secondary btn-cancel-sw" style="margin-top:10px;width:100%;">Cancelar</button>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.btn-discard-sw').onclick = () => {
        overlay.remove();
        onDiscard?.();
    };
    overlay.querySelector('.btn-save-sw').onclick = () => {
        overlay.remove();
        onSave?.();
    };
    overlay.querySelector('.btn-cancel-sw').onclick = () => {
        overlay.remove();
        onCancel?.();
    };
}

function showResumeSessionPrompt({ onDiscard, onResume }) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align: center; max-width: 420px;">
            <div class="elegant-icon" style="color: #10b981;"><i class="fas fa-play-circle"></i></div>
            <h3 class="elegant-title">Sessao Encontrada</h3>
            <p class="elegant-message">Detectamos uma sessao pausada anteriormente. Deseja retoma-la de onde parou?</p>
            <div class="elegant-actions">
                <button class="btn-modal danger btn-discard">Descartar</button>
                <button class="btn-modal primary btn-resume">Retomar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.btn-discard').onclick = () => {
        overlay.remove();
        onDiscard?.();
    };
    overlay.querySelector('.btn-resume').onclick = () => {
        overlay.remove();
        onResume?.();
    };
}

function configureTaskSessionService() {
    const service = ensureRequiredContract('window.FocoZenTaskSessionService', taskSessionService, ['configure']);

    service.configure({
        getTasks: () => tasks,
        getCurrentTask: () => currentTask,
        getTimeLeft: () => timeLeft,
        getTotalTimerTime: () => totalTimerTime,
        getCurrentMode: () => currentMode,
        getIsTimerRunning: () => isTimerRunning,
        getFocusHistory: () => focusHistory,
        getTestMode: () => testMode,
        setCurrentTask: (value) => { currentTask = value; },
        setTimeLeft: (value) => { timeLeft = value; },
        setTotalTimerTime: (value) => { totalTimerTime = value; },
        setCurrentMode: (value) => { currentMode = value; },
        saveTasks,
        saveFocusHistory,
        toggleTimer,
        pauseTimer,
        resetTimer,
        setTimerMode,
        getTaskFocusDurationSeconds,
        updateTimerDisplay,
        updateProgressBar,
        renderTasksList,
        renderTasksSidebar,
        renderProgress,
        updateHeaderTaskCount,
        syncStateToPip,
        storageService,
        storageKeys,
        timerCore,
        pomodoroMinutes: POMODORO_MINUTES,
        shortBreakMinutes: SHORT_BREAK_MINUTES,
        longBreakMinutes: LONG_BREAK_MINUTES,
        getActiveCategory: () => document.getElementById('globalCategorySelect')?.value || 'Livre',
        showTaskSwitchPrompt,
        showResumeSessionPrompt,
        showTaskSuccessModal,
        showGlassToast,
        checkWizardOnboarding,
        applySelectedTaskUi,
        applyFreeFocusUi,
        applyTimerModeUi,
        hideWelcomeModal,
        normalizeTaskName: prettifyAssistantTaskName
    });
}

function getCurrentSoundConfig() {
    return soundsConfig.find((sound) => sound.id === currentSoundId) || null;
}

function applyAudioStateToUi() {
    const currentSound = getCurrentSoundConfig();

    const statsName = document.getElementById('statsPlayerSoundName');
    const goalsName = document.getElementById('goalsPlayerSoundName');
    const settingsName = document.getElementById('settingsPlayerSoundName');
    if (statsName) statsName.textContent = currentSound?.name || 'Nenhum som';
    if (goalsName) goalsName.textContent = currentSound?.name || 'Nenhum som';
    if (settingsName) settingsName.textContent = currentSound?.name || 'Nenhum som';

    document.querySelectorAll('.vpa-sound-item').forEach((item) => {
        item.classList.toggle('active', item.dataset.soundId === currentSoundId);
    });

    document.querySelectorAll('.carousel-sound-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.soundId === currentSoundId);
    });

    const muteIcon = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    ['stats', 'goals', 'settings'].forEach((prefix) => {
        const muteBtn = document.getElementById(`${prefix}PlayerMuteBtn`);
        if (muteBtn?.querySelector('i')) {
            muteBtn.querySelector('i').className = muteIcon;
        }
    });

    updateVolumeDisplay();
    updateMasterPlayButton();
    syncStateToPip();
    notifyHomeRuntime();
}




function configureAudioService() {
    const service = ensureRequiredContract('window.FocoZenAudioService', audioService, ['configure']);

    service.configure({
        storageService,
        storageKeys,
        soundsConfig,
        soundCategories,
        listAudioFiles: async () => {
            if (window.electronAPI?.getAudioFiles) {
                return await window.electronAPI.getAudioFiles();
            }

            return [];
        },
        resolveAudioPath: async (fileName) => {
            if (window.electronAPI?.getAudioPath) {
                return await window.electronAPI.getAudioPath(fileName);
            }

            return null;
        },
        createAudio: (source) => new Audio(source),
        onStateChange: (nextState) => {
            currentAudio = nextState.currentAudio;
            currentSoundId = nextState.currentSoundId;
            isPlaying = !!nextState.isPlaying;
            masterVolume = nextState.masterVolume;
            isMuted = !!nextState.isMuted;
            volumeBeforeMute = nextState.volumeBeforeMute;
            applyAudioStateToUi();
        },
        onPlaybackError: () => {
            showGlassToast('Nao foi possivel carregar esse som agora');
        }
    });
}

// INICIALIZACAO BLINDADA
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Iniciando FocoZen Pro...");

    try {
        tasks = readJsonStorage(storageKeys.TASKS, []);
        totalPomodorosToday = readNumberStorage(storageKeys.TOTAL_POMODOROS, 0);
        showBubbleText = (storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.SHOW_BUBBLE_TEXT, 'true')
            : localStorage.getItem(storageKeys.SHOW_BUBBLE_TEXT)) !== 'false';
        focusHistory = readJsonStorage(storageKeys.HISTORY, []);
        focusGoals = readJsonStorage(storageKeys.GOALS, []);
        userCategories = readJsonStorage(storageKeys.CATEGORIES, defaultCategories);
        
        username = storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.USERNAME, null)
            : localStorage.getItem(storageKeys.USERNAME);
        if (username) {
            const input = document.getElementById('usernameInput');
            if(input) input.value = username;
        } else {
            username = 'Mestre Zen';
        }
    } catch(e) { console.error('Erro de Storage:', e); tasks = []; }

    assertRequiredBootstrapContracts();

    try { updateSidebarProfile(); initNavigation(); } catch(e) { console.error('Erro Navegacao:', e); }
    try { loadDailyQuote(); } catch(e) { console.error('Erro Quote:', e); }
    try { configureAudioService(); } catch(e) { console.error('Erro Audio Service:', e); }

    try { initTimer(); } catch(e) { console.error('Erro Timer:', e); }
    try { initModals(); } catch(e) { console.error('Erro Modais:', e); }
    try { configureTaskSessionService(); } catch(e) { console.error('Erro Task Session:', e); }
    try { initTaskForm(); } catch(e) { console.error('Erro Formulário:', e); }
    try { initSidebarControls(); } catch(e) { console.error('Erro Sidebar:', e); }
    try { setupPipActions(); } catch(e) { console.error('Erro PIP Actions:', e); }
    try { initAssistant(); } catch(e) { console.error('Erro Assistente:', e); }


    // ATUALIZACAO FORCADA DAS LISTAS PARA CORRIGIR O BUG "NENHUMA TAREFA"
    try {
        renderTasksList();
        renderTasksSidebar();
        resetToFreeFocusSession();
    } catch(e) { console.error('Erro Render Inicial:', e); }

    try { applyAudioStateToUi(); } catch(e) { console.error('Erro Audio UI:', e); }
    try { updateHeaderTaskCount(); } catch(e) { console.error('Erro Count:', e); }

    try {
        window.renderTimerDropdown();
        window.renderCategoryChips();
        resetGoalForm();
        
        document.getElementById('btnEditCategories')?.addEventListener('click', () => {
            if(window.toggleCategoryEdit) window.toggleCategoryEdit();
        });

        if (window.electronAPI && window.electronAPI.onAppCloseRequested) {
            window.electronAPI.onAppCloseRequested(() => attemptDeselectTask(true));
        }

    } catch(e) { console.error('Erro Listeners Extras:', e); }

    // RETAIN INCOMPLETE SESSIONS ON BOOT
    if (readSavedSession()) {
        setTimeout(() => window.promptResumeSession(), 1500);
    } else {
        setTimeout(() => { 
            const storedUsername = storageService?.readStorageValue
                ? storageService.readStorageValue(storageKeys.USERNAME, null)
                : localStorage.getItem(storageKeys.USERNAME);
            if (!storedUsername) {
                document.getElementById('wizardModal')?.classList.add('active');
            }
        }, 1200);
    }
});

// ==========================================
// CATEGORY ENGINE (V2)
// ==========================================
window.updateCustomDropdownUI = function(value) {
    const globalCategory = document.getElementById('globalCategorySelect');
    if (globalCategory) globalCategory.value = value;
    notifyHomeRuntime();
};

window.renderTimerDropdown = function() {
    notifyHomeRuntime();
};

window.renderCategoryChips = function() {
    const container = document.getElementById('taskCategoryChips');
    if (!container) return;
    container.innerHTML = '';
    const currentInputRaw = document.getElementById('taskCategoryInput')?.value;
    const currentVal = currentInputRaw && currentInputRaw.trim() !== '' ? currentInputRaw : 'Livre';
    
    userCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = `cat-chip ${cat.name === currentVal ? 'active' : ''} ${isEditingCategories ? 'editing' : ''}`;
        div.setAttribute('data-val', cat.name);
        div.innerHTML = `<i class="fas ${cat.icon || 'fa-tag'}"></i> ${cat.name}`;
        
        if (isEditingCategories && cat.name !== 'Livre') {
            const delBtn = document.createElement('span');
            delBtn.className = 'cat-delete-btn';
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                userCategories = userCategories.filter(c => c.name !== cat.name);
                saveUserCategories();
                renderCategoryChips();
                renderTimerDropdown();
                renderGoalCategoryOptions();
            };
            div.appendChild(delBtn);
        } else if (!isEditingCategories) {
            div.onclick = () => {
                document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(c => c.classList.remove('active'));
                div.classList.add('active');
                document.getElementById('taskCategoryInput').value = cat.name;
            };
        }
        container.appendChild(div);
    });

    if (!isEditingCategories) {
        const addBtn = document.createElement('div');
        addBtn.className = 'cat-chip add-new';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Nova';
        addBtn.onclick = () => {
            const inputDiv = document.createElement('div');
            inputDiv.className = 'cat-chip';
            inputDiv.innerHTML = `<input type="text" id="newCatInput" placeholder="Nome..." style="background: transparent; border: none; outline: none; color: white; width: 80px; font-size: 0.8rem;">`;
            container.replaceChild(inputDiv, addBtn);
            const inp = document.getElementById('newCatInput');
            inp.focus();
            const finishAdd = () => {
                const val = inp.value.trim();
                if (val && !userCategories.find(c => c.name === val)) {
                    userCategories.push({ name: val, icon: 'fa-tag' });
                    saveUserCategories();
                    renderTimerDropdown();
                    renderGoalCategoryOptions();
                }
                renderCategoryChips();
            };
            inp.onblur = finishAdd;
            inp.onkeydown = (e) => { if (e.key === 'Enter') finishAdd(); if (e.key === 'Escape') renderCategoryChips(); };
        };
        container.appendChild(addBtn);
    }
};

window.toggleCategoryEdit = function() {
    isEditingCategories = !isEditingCategories;
    const btn = document.getElementById('btnEditCategories');
    if(btn) btn.style.color = isEditingCategories ? '#ef4444' : 'var(--text-secondary)';
    renderCategoryChips();
};

// ==========================================
// WIZARD ONBOARDING (V2)
// ==========================================
let wizSelectedCats = ['Trabalho'];

window.selectWizCategory = function(cat) {
    const el = event.currentTarget;
    if (wizSelectedCats.includes(cat)) {
        if (wizSelectedCats.length > 1) {
            wizSelectedCats = wizSelectedCats.filter(c => c !== cat);
            el.classList.remove('active');
        } else {
            customAlert('Aviso', 'Selecione pelo menos uma categoria.');
        }
    } else {
        wizSelectedCats.push(cat);
        el.classList.add('active');
    }
    const hiddenInp = document.getElementById('wizardCategoryInput');
    if(hiddenInp) hiddenInp.value = wizSelectedCats.join(',');
};

window.nextWizard = function(currentStep) {
    if (currentStep === 1) {
        const input = document.getElementById('wizardNameInput');
        if (!input.value.trim()) { customAlert('Aviso', 'Por favor, digite seu nome.'); return; }
        username = input.value.trim();
    }
    if (currentStep === 2) {
        if (wizSelectedCats.length > 0) {
             const primaryCat = wizSelectedCats[0];
             document.getElementById('globalCategorySelect').value = primaryCat;
             window.updateCustomDropdownUI(primaryCat);
        }
    }
    document.getElementById(`wizardStep${currentStep}`).classList.remove('active');
    document.getElementById(`wizardStep${currentStep + 1}`).classList.add('active');
    
    document.getElementById(`dot${currentStep}`).classList.remove('active');
    document.getElementById(`dot${currentStep + 1}`).classList.add('active');
};

window.prevWizard = function(currentStep) {
    document.getElementById(`wizardStep${currentStep}`).classList.remove('active');
    document.getElementById(`wizardStep${currentStep - 1}`).classList.add('active');
    
    document.getElementById(`dot${currentStep}`).classList.remove('active');
    document.getElementById(`dot${currentStep - 1}`).classList.add('active');
};

window.finishWizard = function() {
    if (storageService?.writeStorageValue) {
        storageService.writeStorageValue(storageKeys.USERNAME, username);
    } else {
        localStorage.setItem(storageKeys.USERNAME, username);
    }

    writeJsonStorage(storageKeys.WIZARD_CATEGORIES, wizSelectedCats);
    updateSidebarProfile();
    notifyStatsRuntime();
    notifyAssistantRuntime();
    document.getElementById('wizardModal').classList.remove('active');
};

// ==========================================
// ROTEAMENTO V2
// ==========================================
function switchView(viewId) {
    // Sync view player panels
    const nowPlayingSpan = document.getElementById('nowPlaying')?.querySelector('span');
    const titleText = nowPlayingSpan ? nowPlayingSpan.textContent : 'Nenhum som';
    const statsName = document.getElementById('statsPlayerSoundName');
    const goalsName = document.getElementById('goalsPlayerSoundName');
    const settingsName = document.getElementById('settingsPlayerSoundName');
    if (statsName) statsName.textContent = titleText;
    if (goalsName) goalsName.textContent = titleText;
    if (settingsName) settingsName.textContent = titleText;
    buildViewPlayerSounds('statsPlayerSounds');
    buildViewPlayerSounds('goalsPlayerSounds');
    buildViewPlayerSounds('settingsPlayerSounds');

    const statsEl = document.getElementById('view-stats');
    if (statsEl) statsEl.classList.remove('stats-anim-in');

    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    
    document.getElementById(viewId)?.classList.add('active');
    document.querySelector(`.sidebar-item[data-view="${viewId}"]`)?.classList.add('active');
    
    if (viewId === 'view-stats') {
        const title = document.getElementById('statsGreetingTitle');
        if (title) title.innerHTML = `Mandou bem, ${username.split(' ')[0]}!`;
        if (window.compileDashboardData) window.compileDashboardData();
        // Trigger entry animation after a micro-tick so the browser registers the DOM change
        requestAnimationFrame(() => {
            if (statsEl) statsEl.classList.add('stats-anim-in');
        });
    }
    if (viewId === 'view-goals') {
        window.compileGoalsData();
    }
    if (viewId === 'view-settings') {
        const input = document.getElementById('settingsNameInput');
        if (input) input.value = username;
    }

    window.updateAssistantContext();
}

function initNavigation() {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const viewId = e.currentTarget.dataset.view;
            if (viewId) switchView(viewId);
        });
    });

    document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
        const input = document.getElementById('settingsNameInput');
        if (input && input.value.trim()) {
            username = input.value.trim();
            if (storageService?.writeStorageValue) {
                storageService.writeStorageValue(storageKeys.USERNAME, username);
            } else {
                localStorage.setItem(storageKeys.USERNAME, username);
            }
            updateSidebarProfile();
            notifyStatsRuntime();
            notifyAssistantRuntime();
            const msg = document.getElementById('settingsSavedMsg');
            if (msg) { msg.style.display = 'flex'; setTimeout(() => msg.style.display = 'none', 3000); }
        }
    });

    document.getElementById('btnSettingsResetData')?.addEventListener('click', resetAppData);
    
    document.getElementById('btnCheckUpdates')?.addEventListener('click', () => {
        const btn = document.getElementById('btnCheckUpdates');
        const status = document.getElementById('updateCheckStatus');
        
        if (btn && status) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            status.style.display = 'none';
            window._manualUpdateTriggered = true;
            
            if (updateService?.checkForUpdates && updateService.checkForUpdates()) {
                return;
            } else {
                setTimeout(() => {
                    window._manualUpdateTriggered = false;
                    handleUpdateCheckResult({ 
                        available: false, 
                        message: 'Sistema de atualizacao nao disponivel em modo desenvolvimento.' 
                    });
                }, 500);
            }
        }
    });
}

function updateSidebarProfile() {
    const nameEl = document.getElementById('sidebarUserName');
    const initEl = document.getElementById('sidebarUserInitials');
    if (nameEl) nameEl.textContent = username;
    if (initEl) initEl.textContent = username.charAt(0).toUpperCase();
}

// ==========================================
// INTEGRACAO PIP
// ==========================================
function setupPipActions() {
    if (pipService?.onAction) {
        pipService.onAction((action, data) => {
            if (action === 'toggle-play') toggleTimer();
            else if (action === 'reset') resetTimer();
            else if (action === 'toggle-audio') toggleMasterPlay();
            else if (action === 'change-sound') {
                const targetSound = soundsConfig.find(s => s.id === data);
                if (targetSound) selectSound(targetSound);
            }
            else if (action === 'start-phase') {
                startPhase(data);
            }
            else if (action === 'restore-app') {
                isPipModeActive = false;
                renderTasksSidebar();
                if (pendingCompletionType) {
                    const comp = pendingCompletionType;
                    pendingCompletionType = null;
                    setTimeout(() => {
                        if (comp === 'task-complete' && currentTask) {
                            showTaskCompletionPopup(comp);
                        } else if (comp === 'focus-complete') {
                            showTransitionModal('break');
                        } else if (comp === 'break-complete') {
                            showTransitionModal('focus');
                        }
                    }, 500);
                }
            }
            else if (action === 'dismiss-completion') {
                pendingCompletionType = null;
                pendingTaskResolution = null;
            }
            else if (action === 'task-concluded') {
                handleTaskConcludedFlow({ fromPip: true });
            }
            else if (action === 'task-add-time') {
                syncStateToPip({ showAddTimePopup: true });
            }
            else if (action === 'task-continue-later') {
                handleRestartLaterFlow({ fromPip: true });
            }
            else if (action === 'confirm-add-time') {
                addTimeToCurrentTask(data || 5);
            }
            else if (action === 'confirmed-continue-later') {
                syncStateToPip({ hideCompletion: true });
            }
            else if (action === 'task-discard') {
                // Desistir da tarefa - desseleciona e minimiza o PiP
                if (currentTask) {
                    currentTask.completed = false;
                    currentTask.completedPomodoros = 0;
                    saveTasks(); renderProgress(); renderTasksSidebar(); renderTasksList();
                }
                pendingCompletionType = null;
                pendingTaskResolution = null;
                deselectTask();
                syncStateToPip({ hideCompletion: true });
                // Minimizar o PiP sem fechar o programa
                pipService?.requestMinimizeToTray?.();
            }
            else if (action === 'set-volume') {
                const parsedVolume = Number(data);
                if (Number.isNaN(parsedVolume)) return;
                audioService?.setVolume?.(parsedVolume);
            }
        });
    }
}

function syncStateToPip(extraState = {}) {
    if (!pipService?.sendState) {
        if (isPipModeActive) console.warn('[PIP] Nao e possivel enviar estado: pipService.sendState ausente');
        return;
    }

    try {
        const timeString = timerCore?.formatTimerLabel
            ? timerCore.formatTimerLabel(timeLeft)
            : (utilsService?.formatClockTime
                ? utilsService.formatClockTime(timeLeft)
                : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`);

        const progress = timerCore?.getTimerProgress
            ? timerCore.getTimerProgress({ timeLeft, totalTime: totalTimerTime })
            : (utilsService?.calculateProgressPercentage
                ? utilsService.calculateProgressPercentage({ timeLeft, totalTime: totalTimerTime })
                : (totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0));

        const activeCard = document.querySelector('.sound-card.active span');
        const soundName = activeCard ? activeCard.textContent : 'Silêncio';

        const taskName = currentTask ? currentTask.name : 'Sessao Livre';
        const soundObj = soundsConfig.find(s => s.id === currentSoundId);
        const bgImage = soundObj ? soundObj.image : 'default.jpg';
        const theme = soundThemes[currentSoundId] || 'default';

        pipService.sendState({
            timeString, progress, phase: currentMode,
            isRunning: isTimerRunning, soundName, isAudioPlaying: isPlaying,
            taskName, bgImage, theme, masterVolume, hasActiveTask: !!currentTask, ...extraState
        });
    } catch (err) {
        console.error("Erro ao sincronizar PIP:", err);
    }
}

function loadDailyQuote() {
    try {
        const today = new Date().toDateString();
        let quoteIndex = parseInt(
            storageService?.readStorageValue
                ? storageService.readStorageValue(storageKeys.QUOTE_INDEX, '0')
                : localStorage.getItem(storageKeys.QUOTE_INDEX),
            10
        );
        if (isNaN(quoteIndex) || quoteIndex >= quotes.length || quoteIndex < 0) quoteIndex = 0;
        const lastQuoteDate = storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.LAST_QUOTE_DATE, null)
            : localStorage.getItem(storageKeys.LAST_QUOTE_DATE);
        if (lastQuoteDate !== today) {
            quoteIndex = Math.floor(Math.random() * quotes.length);
            if (storageService?.writeStorageValue) {
                storageService.writeStorageValue(storageKeys.QUOTE_INDEX, quoteIndex);
                storageService.writeStorageValue(storageKeys.LAST_QUOTE_DATE, today);
            } else {
                localStorage.setItem(storageKeys.QUOTE_INDEX, quoteIndex);
                localStorage.setItem(storageKeys.LAST_QUOTE_DATE, today);
            }
        }
        const quote = quotes[quoteIndex] || quotes[0];
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
    } catch(e) { console.error(e); }
}

async function selectSound(sound, cardElement) {
    const result = await audioService?.selectSound?.(sound, {
        toggleOff: !!cardElement,
        autoplay: true
    });

    if (!result?.ok && result?.reason !== 'selection-superseded') {
        console.error('Erro audio:', result?.error || result?.reason || 'falha desconhecida');
    }
}

function toggleMute() {
    audioService?.toggleMute?.();
}

async function toggleMasterPlay() {
    if (!currentSoundId) {
        showGlassToast('Selecione algum som para iniciar');
        return;
    }

    const result = await audioService?.togglePlay?.();
    if (!result?.ok && result?.reason !== 'no-sound-selected') {
        console.error('Erro ao alternar audio:', result?.error || result?.reason || 'falha desconhecida');
    }
}

function updateMasterPlayButton() {
    ['stats', 'goals', 'settings'].forEach(prefix => {
        const playBtn = document.getElementById(`${prefix}PlayerPlayBtn`);
        const muteBtn = document.getElementById(`${prefix}PlayerMuteBtn`);
        const volSlider = document.getElementById(`${prefix}PlayerVolumeSlider`);

        if (playBtn && !playBtn.dataset.bound) {
            playBtn.dataset.bound = true;
            playBtn.addEventListener('click', () => toggleMasterPlay());
        }
        if (muteBtn && !muteBtn.dataset.bound) {
            muteBtn.dataset.bound = true;
            muteBtn.addEventListener('click', () => toggleMute());
        }
        if (volSlider && !volSlider.dataset.bound) {
            volSlider.dataset.bound = true;
            volSlider.addEventListener('input', (e) => {
                audioService?.setVolume?.(Number(e.target.value) / 100);
            });
        }
        if (playBtn) {
            if (isPlaying) {
                playBtn.classList.add('playing');
                playBtn.querySelector('i').className = 'fas fa-pause';
            } else {
                playBtn.classList.remove('playing');
                playBtn.querySelector('i').className = 'fas fa-play';
            }
        }
        if (volSlider) volSlider.value = Math.round(masterVolume * 100);
    });
}

function buildViewPlayerSounds(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset.built) return;
    container.dataset.built = 'true';

    const trigger = container.closest('.vpa-sound-trigger');
    if (trigger && !trigger.dataset.bound) {
        trigger.dataset.bound = 'true';
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            trigger.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) trigger.classList.remove('open');
        });
    }

    soundsConfig.forEach(sound => {
        const item = document.createElement('div');
        item.className = `vpa-sound-item${currentSoundId === sound.id ? ' active' : ''}`;
        item.dataset.soundId = sound.id;
        item.innerHTML = `<i class="fas ${sound.icon}"></i><span>${sound.name}</span>`;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSound(sound);
            trigger?.classList.remove('open');
        });
        container.appendChild(item);
    });
}

function updateVolumeDisplay() {
    const vol = Math.round(masterVolume * 100);
    ['stats', 'goals', 'settings'].forEach(prefix => {
        const valEl = document.getElementById(`${prefix}PlayerVolumeValue`);
        const slider = document.getElementById(`${prefix}PlayerVolumeSlider`);
        if (valEl) valEl.textContent = `${vol}%`;
        if (slider && !slider.matches(':active')) slider.value = vol;
    });
}

function initTimer() {

}

function adjustTime(minutes) {
    // Block if running, OR if any active task is selected (prevent drift from task duration)
    if (isTimerRunning) return;
    if (currentTask && currentMode === 'focus') return; // Always block when a task is active
    timeLeft = Math.max(5, Math.min(120, Math.floor(timeLeft / 60) + minutes)) * 60;
    totalTimerTime = timeLeft;
    updateTimerDisplay();
    updateProgressBar();
}

function setTimerMode(mode) {
    pauseTimer(); currentMode = mode;
    const modeDurationSeconds = timerCore?.getModeDurationSeconds
        ? timerCore.getModeDurationSeconds({
            mode,
            testMode,
            pomodoroMinutes: POMODORO_MINUTES,
            shortBreakMinutes: SHORT_BREAK_MINUTES,
            longBreakMinutes: LONG_BREAK_MINUTES
        })
        : (testMode ? 5 : (mode === 'shortBreak' ? SHORT_BREAK_MINUTES : (mode === 'longBreak' ? LONG_BREAK_MINUTES : POMODORO_MINUTES)) * 60);
    
    if (currentTask && mode === 'focus') {
        timeLeft = getTaskFocusDurationSeconds(currentTask);
        totalTimerTime = timeLeft;
    } else {
        timeLeft = modeDurationSeconds;
        totalTimerTime = timeLeft;
    }
    
    applyTimerModeUi({ mode, resetToggleButton: true });
    updateTimerDisplay();
    updateProgressBar();
    renderProgress();
    syncStateToPip();
}

let targetEndTime = 0;

function toggleTimer() {
    if (isTimerRunning) {
        pauseTimer();
        notifyTimerRuntime();
        renderProgress();
        renderTasksSidebar();
        syncStateToPip();
    } else {
        isTimerRunning = true;
        notifyTimerRuntime();
        renderProgress();
        renderTasksSidebar();
        syncStateToPip();

        targetEndTime = Date.now() + (timeLeft * 1000);

        timerInterval = setInterval(() => {
            const now = Date.now();
            if (now >= targetEndTime) {
                timeLeft = 0;
                updateTimerDisplay();
                updateProgressBar();
                updateTaskBubbleProgress();
                renderTasksSidebar();
                syncStateToPip();
                completeTimer();
            } else {
                timeLeft = Math.round((targetEndTime - now) / 1000);
                updateTimerDisplay();
                updateProgressBar();
                updateTaskBubbleProgress();
                // Update sidebar every 15 seconds to keep live % without perf issues
                if (timeLeft % 15 === 0) renderTasksSidebar();
                syncStateToPip();
            }
        }, 1000);
    }
}

function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    notifyTimerRuntime();
}

function resetTimer() {
    pauseTimer();
    // When resetting with an active task, reset its completedPomodoros fraction too
    if (currentTask && currentMode === 'focus') {
        currentTask.completedPomodoros = Math.floor(currentTask.completedPomodoros); // strip fractional progress
        saveTasks();
    }
    setTimerMode(currentMode);
    // If a task is active, restore timer from the current focus block
    if (currentTask && currentMode === 'focus') {
        timeLeft = getTaskFocusDurationSeconds(currentTask);
        totalTimerTime = timeLeft;
        updateTimerDisplay();
        updateProgressBar();
    }
    renderProgress(); renderTasksSidebar(); syncStateToPip();
}

function resetToFreeFocusSession() {
    pauseTimer();
    currentTask = null;
    pendingCompletionType = null;
    pendingTaskResolution = null;
    const badge = document.getElementById('currentTaskBadge');
    if (badge) {
        badge.textContent = 'Sessao Livre';
        badge.className = 'task-badge free-mode';
    }
    document.getElementById('btnFreeFocus')?.classList.add('hidden');
    const globalCat = document.getElementById('globalCategorySelect');
    if (globalCat) globalCat.value = 'Livre';
    window.updateCustomDropdownUI('Livre');
    timeLeft = timerCore?.getModeDurationSeconds
        ? timerCore.getModeDurationSeconds({
            mode: 'focus',
            testMode,
            pomodoroMinutes: POMODORO_MINUTES,
            shortBreakMinutes: SHORT_BREAK_MINUTES,
            longBreakMinutes: LONG_BREAK_MINUTES
        })
        : POMODORO_MINUTES * 60;
    totalTimerTime = timeLeft;
    currentMode = 'focus';
    applyTimerModeUi({ mode: 'focus', resetToggleButton: true });
    updateTimerDisplay();
    updateProgressBar();
    renderProgress();
    renderTasksSidebar();
    renderTasksList();
    syncStateToPip({ hideCompletion: true });
}

function getRandomRestartMessage() {
    if (utilsService?.pickRandomItem) {
        return utilsService.pickRandomItem(motivationalRestartMessages) ?? motivationalRestartMessages[0];
    }

    return motivationalRestartMessages[Math.floor(Math.random() * motivationalRestartMessages.length)];
}

function showTimedFeedbackPopup({ title, message, icon = 'fa-star', gradient = 'linear-gradient(135deg,#3b82f6,#1d4ed8)', duration = 2000, onDone = null }) {
    if (feedbackPopupTimer) clearTimeout(feedbackPopupTimer);

    const existing = document.getElementById('timedFeedbackPopup');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'timedFeedbackPopup';
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align:center;max-width:360px;padding:24px 24px 20px;">
            <div class="elegant-icon" style="background:${gradient};">
                <i class="fas ${icon}"></i>
            </div>
            <h2 class="elegant-title" style="margin-bottom:10px;">${title}</h2>
            <p class="elegant-message" style="margin-bottom:0;">${message}</p>
        </div>`;

    document.body.appendChild(overlay);

    feedbackPopupTimer = setTimeout(() => {
        overlay.remove();
        feedbackPopupTimer = null;
        if (onDone) onDone();
    }, duration);
}

function showPipTimedFeedback({ title, message, icon = 'fa-star', duration = 2000, tone = 'success' }) {
    syncStateToPip({
        hideCompletion: true,
        showFeedbackPopup: { title, message, icon, duration, tone }
    });
}

function getPendingTaskResolution(task = currentTask) {
    if (!task || !pendingTaskResolution || pendingTaskResolution.taskId !== task.id) return null;
    return pendingTaskResolution;
}

function setPendingTaskResolution(task, compType) {
    if (!task) {
        pendingTaskResolution = null;
        return;
    }

    pendingTaskResolution = timerCore?.buildPendingTaskResolution
        ? timerCore.buildPendingTaskResolution({
            task,
            totalTimerTime,
            completionType: compType
        })
        : {
            taskId: task.id,
            compType,
            previousCompletedPomodoros: Math.max(0, task.completedPomodoros - 1),
            previousEstimatedMinutes: task.estimatedMinutes,
            sessionMinutes: Math.max(1, totalTimerTime / 60)
        };
}

function clearForcedTaskCompletion(task = currentTask) {
    if (!task) return;
    task.completed = false;
}

function restartTaskProgress(task = currentTask) {
    if (!task) return;
    task.completed = false;
    task.completedPomodoros = 0;
    saveTasks();
}

function concludeCurrentTask(showToast = true) {
    if (currentTask) {
        currentTask.completed = true;
        currentTask.completedPomodoros = Math.max(currentTask.completedPomodoros, currentTask.pomodoros);
        saveTasks();
        if (showToast) showGlassToast('Parabéns! Tarefa concluída 🎉');
    }
    resetToFreeFocusSession();
}

function restartCurrentTaskLater() {
    if (currentTask) {
        restartTaskProgress(currentTask);
        renderTasksSidebar();
        renderTasksList();
        renderProgress();
    }
    resetToFreeFocusSession();
}

function handleTaskConcludedFlow({ fromPip = false } = {}) {
    const finalize = () => {
        concludeCurrentTask(false);
        if (fromPip) {
            pipService?.requestMinimizeToTray?.();
        }
    };

    if (fromPip) {
        showPipTimedFeedback({
            title: 'Parabéns!',
            message: 'Você concluiu a tarefa. Excelente foco.',
            icon: 'fa-trophy',
            tone: 'success',
            duration: 2000
        });
        setTimeout(finalize, 2000);
        return;
    }

    showTimedFeedbackPopup({
        title: 'Parabéns!',
        message: 'Você concluiu a tarefa. Excelente foco.',
        icon: 'fa-trophy',
        gradient: 'linear-gradient(135deg,#10b981,#059669)',
        duration: 2000,
        onDone: finalize
    });
}

function handleRestartLaterFlow({ fromPip = false } = {}) {
    const message = getRandomRestartMessage();
    const finalize = () => {
        restartCurrentTaskLater();
        if (fromPip) {
            pipService?.requestMinimizeToTray?.();
        }
    };

    if (fromPip) {
        showPipTimedFeedback({
            title: 'Você consegue',
            message,
            icon: 'fa-seedling',
            tone: 'motivation',
            duration: 2000
        });
        setTimeout(finalize, 2000);
        return;
    }

    showTimedFeedbackPopup({
        title: 'Você consegue',
        message,
        icon: 'fa-seedling',
        gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
        duration: 2000,
        onDone: finalize
    });
}

function addTimeToCurrentTask(extraMinutes = 5) {
    if (!currentTask) return;

    const pending = getPendingTaskResolution(currentTask);
    const extendedTaskState = timerCore?.computeExtendedTaskState
        ? timerCore.computeExtendedTaskState({
            task: currentTask,
            pendingResolution: pending,
            extraMinutes,
            totalTimerTime
        })
        : {
            estimatedMinutes: (pending?.previousEstimatedMinutes ?? currentTask.estimatedMinutes) + extraMinutes,
            completedPomodoros: pending?.previousCompletedPomodoros ?? Math.floor(currentTask.completedPomodoros),
            nextTimeLeft: extraMinutes * 60,
            nextTotalTime: ((pending?.sessionMinutes ?? Math.max(1, totalTimerTime / 60)) + extraMinutes) * 60
        };

    currentTask.completed = false;
    currentTask.completedPomodoros = extendedTaskState.completedPomodoros;
    currentTask.estimatedMinutes = extendedTaskState.estimatedMinutes;
    saveTasks();

    currentMode = 'focus';
    pauseTimer();
    totalTimerTime = extendedTaskState.nextTotalTime;
    timeLeft = extendedTaskState.nextTimeLeft;
    pendingCompletionType = null;
    pendingTaskResolution = null;

    applyTimerModeUi({ mode: 'focus', resetToggleButton: true });
    updateTimerDisplay();
    updateProgressBar();
    renderProgress();
    renderTasksSidebar();
    renderTasksList();
    syncStateToPip({ hideCompletion: true });
    showGlassToast(`+${extraMinutes} min adicionados 🔥`);
}

function completeTimer() {
    pauseTimer();
    let compType = '';

    if (currentMode === 'focus') {
        totalPomodorosToday++;
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.TOTAL_POMODOROS, totalPomodorosToday);
        } else {
            localStorage.setItem(storageKeys.TOTAL_POMODOROS, totalPomodorosToday);
        }
        
        // --- V2 DASHBOARD HISTORY LOGGING ---
        const activeCategory = document.getElementById('globalCategorySelect')?.value || "Livre";
        const historyEntry = timerCore?.buildHistoryEntry
            ? timerCore.buildHistoryEntry({
                totalTimerTime,
                category: activeCategory,
                currentTask,
                now: new Date()
            })
            : {
                id: Date.now(),
                date: new Date().toISOString().split('T')[0],
                durationMinutes: Math.max(1, Math.round(totalTimerTime / 60)),
                category: activeCategory,
                taskId: currentTask ? currentTask.id : null
            };

        focusHistory.push(historyEntry);
        saveFocusHistory();
        // ------------------------------------

        compType = timerCore?.getTimerCompletionType
            ? timerCore.getTimerCompletionType({ currentMode, currentTask })
            : '';

        if (currentTask) {
            currentTask.completedPomodoros++;
            if (!compType) {
                compType = currentTask.completedPomodoros >= currentTask.pomodoros ? 'task-complete' : 'focus-complete';
            }
            currentTask.completed = false;
            setPendingTaskResolution(currentTask, compType);
            saveTasks(); renderProgress(); renderTasksSidebar(); renderTasksList();
        } else {
            completedPomodoros++;
            compType = compType || 'focus-complete';
        }
    } else {
        compType = timerCore?.getTimerCompletionType
            ? timerCore.getTimerCompletionType({ currentMode, currentTask })
            : 'break-complete';
    }

    const transitionTarget = timerCore?.getTransitionTarget
        ? timerCore.getTransitionTarget({
            completionType: compType,
            totalPomodorosToday,
            isPipModeActive,
            hasCurrentTask: !!currentTask
        })
        : {
            modalPhase: compType === 'focus-complete' ? 'break' : 'focus',
            shouldShowTaskPopup: compType === 'task-complete' && !!currentTask,
            shouldSyncPipCompletion: isPipModeActive
        };

    if (transitionTarget.shouldSyncPipCompletion) {
        pendingCompletionType = compType;
        syncStateToPip({ showCompletion: compType });
    } else {
        if (transitionTarget.shouldShowTaskPopup) {
            showTaskCompletionPopup(compType);
        } else {
            showTransitionModal(transitionTarget.modalPhase);
        }
    }
}

function updateTimerDisplay() {
    notifyTimerRuntime();
}
function updateProgressBar() {
    notifyTimerRuntime();
}

function showTransitionModal(nextPhase) {
    const modal = document.getElementById('transitionModal');
    const title = document.getElementById('transitionTitle');
    const message = document.getElementById('transitionMessage');
    const icon = document.getElementById('transitionIcon');
    const actions = document.getElementById('transitionActions');
    const stats = document.getElementById('transitionStats');

    actions.innerHTML = '';

    if (nextPhase === 'break') {
        icon.innerHTML = '<i class="fas fa-coffee"></i>';
        title.textContent = 'Sessao Concluida';
        stats.classList.remove('hidden');
        document.getElementById('totalPomodorosTodayStats').textContent = totalPomodorosToday;

        const closeBtn = document.getElementById('transitionModalClose');
        if (closeBtn) closeBtn.style.display = 'flex';

        const isLongBreakTime = (totalPomodorosToday % 4 === 0);

        if(isLongBreakTime) {
            message.textContent = 'Quatro blocos finalizados. Faça uma pausa longa.';
            actions.innerHTML = `<button onclick="startPhase('shortBreak')" class="btn-modal secondary">Curta (5m)</button><button onclick="startPhase('longBreak')" class="btn-modal primary">Longa (15m)</button>`;
        } else {
            message.textContent = 'Bloco de foco finalizado. Hora da pausa.';
            actions.innerHTML = `<button onclick="startPhase('longBreak')" class="btn-modal secondary">Longa (15m)</button><button onclick="startPhase('shortBreak')" class="btn-modal primary">Curta (5m)</button>`;
        }
    } else if (nextPhase === 'focus') {
        icon.innerHTML = '<i class="fas fa-brain"></i>';
        title.textContent = 'De volta ao Foco';
        message.textContent = 'Pausa finalizada. Pronto?';
        stats.classList.add('hidden');
        const closeBtn2 = document.getElementById('transitionModalClose');
        if (closeBtn2) closeBtn2.style.display = 'none';
        actions.innerHTML = `<button onclick="closeTransitionModal()" class="btn-modal secondary">Depois</button><button onclick="startPhase('focus')" class="btn-modal primary">Iniciar Foco</button>`;
    }
    modal.classList.add('active');
}

window.startPhase = function(mode) {
    document.getElementById('transitionModal').classList.remove('active');
    document.querySelectorAll('.custom-popup').forEach(p => p.remove());
    setTimerMode(mode);
    toggleTimer();
    syncStateToPip({ hideCompletion: true });
};

window.closeTransitionModal = function() { document.getElementById('transitionModal').classList.remove('active'); };

function showTaskCompletionPopup(compType) {
    const taskName = currentTask ? currentTask.name : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align: center; max-width: 440px;">
            <div class="elegant-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                <i class="fas fa-clipboard-check"></i>
            </div>
            <h2 class="elegant-title">Hora da pausa! ☕</h2>
            <p class="elegant-message">Você concluiu a tarefa?</p>
            ${taskName ? `<div style="background:rgba(0,0,0,0.25);border-radius:10px;padding:8px 14px;margin:10px 0;font-size:0.85rem;color:var(--text-secondary);"><i class="fas fa-tasks" style="margin-right:6px;"></i>${taskName}</div>` : ''}
            <div class="elegant-actions" style="flex-direction:column;gap:10px;margin-top:16px;">
                <button class="btn-modal primary btn-task-done" style="width:100%;background:linear-gradient(135deg,#10b981,#059669);">
                    <i class="fas fa-check"></i> Sim, concluí!
                </button>
                <button class="btn-modal secondary btn-add-time" style="width:100%;">
                    <i class="fas fa-plus-circle"></i> Adicionar mais tempo
                </button>
                <button class="btn-modal secondary btn-continue-later" style="width:100%;opacity:0.75;">
                    <i class="fas fa-history"></i> Recomeçar em outro momento
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const titleEl = overlay.querySelector('.elegant-title');
    const messageEl = overlay.querySelector('.elegant-message');
    const iconEl = overlay.querySelector('.elegant-icon i');
    const doneBtn = overlay.querySelector('.btn-task-done');
    const addTimeBtn = overlay.querySelector('.btn-add-time');
    const restartBtn = overlay.querySelector('.btn-continue-later');

    if (titleEl) titleEl.textContent = 'Sessao concluida';
    if (messageEl) messageEl.textContent = 'O que você quer fazer com esta tarefa agora?';
    if (iconEl) iconEl.className = 'fas fa-clipboard-check';
    if (doneBtn) {
        doneBtn.style.gap = '12px';
        doneBtn.innerHTML = '<i class="fas fa-check"></i> Sim, concluí!';
    }
    if (addTimeBtn) {
        addTimeBtn.style.gap = '12px';
        addTimeBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Adicionar mais tempo';
    }
    if (restartBtn) {
        restartBtn.style.gap = '12px';
        restartBtn.innerHTML = '<i class="fas fa-history"></i> Recomeçar em outro momento';
    }

    overlay.querySelector('.btn-task-done').onclick = () => {
        overlay.remove();
        handleTaskConcludedFlow();
    };
    overlay.querySelector('.btn-add-time').onclick = () => {
        overlay.remove();
        showAddTimePopup();
    };
    overlay.querySelector('.btn-continue-later').onclick = () => {
        overlay.remove();
        handleRestartLaterFlow();
    };
}

function showAddTimePopup() {
    let extraMinutes = 5;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align:center;max-width:340px;padding:22px 22px 18px;">
            <div class="elegant-icon" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">
                <i class="fas fa-plus-circle"></i>
            </div>
            <h2 class="elegant-title">Adicionar Tempo</h2>
            <p class="elegant-message" style="margin-bottom:14px;">Quanto tempo mais precisa?</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0 18px;">
                <button id="decreaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-minus"></i></button>
                <span id="extraTimeDisplay" style="font-size:2rem;font-weight:700;min-width:90px;color:white;">5 min</span>
                <button id="increaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-plus"></i></button>
            </div>
            <div class="elegant-actions" style="margin-top:0;">
                <button class="btn-modal secondary btn-cancel-extra" style="min-height:48px;">Cancelar</button>
                <button class="btn-modal primary btn-confirm-extra" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);min-height:48px;">Continuar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#decreaseExtraTime').onclick = () => {
        if (extraMinutes > 5) { extraMinutes -= 5; overlay.querySelector('#extraTimeDisplay').textContent = extraMinutes + ' min'; }
    };
    overlay.querySelector('#increaseExtraTime').onclick = () => {
        extraMinutes += 5;
        overlay.querySelector('#extraTimeDisplay').textContent = extraMinutes + ' min';
    };
    overlay.querySelector('.btn-cancel-extra').onclick = () => {
        overlay.remove();
        showTaskCompletionPopup('task-complete');
    };
    overlay.querySelector('.btn-confirm-extra').onclick = () => {
        overlay.remove();
        addTimeToCurrentTask(extraMinutes);
    };
}

function showContinueLaterPopup() {
    const msgs = [
        "Voce nao desistiu, apenas pausou. Isso e forca!",
        "O progresso acontece um passo de cada vez. Volte quando estiver pronto! 🌟",
        "Descansar também faz parte do sucesso. Você está no caminho certo! 🚀",
        "Cada pausa e uma preparacao para o proximo avanco. Ate logo!",
        "Grandes conquistas levam tempo. Nao desista! "
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align:center;max-width:420px;">
            <div class="elegant-icon" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">
                <i class="fas fa-heart"></i>
            </div>
            <h2 class="elegant-title">Até logo! 👋</h2>
            <p class="elegant-message" style="font-style:italic;">"${msg}"</p>
            <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove();" style="width:100%;margin-top:16px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);">
                Entendido
            </button>
        </div>`;
    document.body.appendChild(overlay);
    
    if (currentTask) {
        clearForcedTaskCompletion(currentTask);
        saveTasks(); renderTasksSidebar(); renderTasksList(); renderProgress();
    }
}

window.toggleTestMode = function() {
    testMode = !testMode;
    const btn = document.getElementById('btnTestMode');
    if (btn) {
        btn.style.background = testMode ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : '';
        btn.textContent = testMode ? 'Modo Teste ON (5s)' : 'Modo Teste';
    }
    const taskTimeInput = document.getElementById('taskTimeInput');
    if (taskTimeInput && taskTimeInput.value === '25') {
        taskTimeInput.value = testMode ? '0.08' : '25';
    }
    if (testMode) showGlassToast('Modo teste ativado: timer e tarefas = 5s ⚡');
    else showGlassToast('Modo teste desativado');
    setTimerMode(currentMode);
};

function customConfirm(title, message, onConfirm, onCancel) {
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align: center; max-width: 400px;">
            <div class="elegant-icon" style="color: #ef4444;"><i class="fas fa-exclamation-triangle"></i></div>
            <h3 class="elegant-title">${title}</h3>
            <p class="elegant-message">${message}</p>
            <div class="elegant-actions">
                <button class="btn-modal secondary btn-cancel-popup">Cancelar</button>
                <button class="btn-modal primary btn-danger btn-confirm-popup" style="background: linear-gradient(135deg, #ef4444, #b91c1c);">Confirmar</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-cancel-popup').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
    overlay.querySelector('.btn-confirm-popup').onclick = () => { overlay.remove(); if(onConfirm) onConfirm(); };
}

function customAlert(title, message) {
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align: center; max-width: 400px;">
            <div class="elegant-icon"><i class="fas fa-star"></i></div>
            <h3 class="elegant-title">${title}</h3>
            <p class="elegant-message">${message}</p>
            <div class="elegant-actions"><button class="btn-modal primary btn-ok-popup">Entendi</button></div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-ok-popup').onclick = () => overlay.remove();
}

function resetAppData() {
    customConfirm(
        'Resetar dados',
        'Isso irá apagar tarefas, preferências e progresso salvos localmente. Deseja continuar?',
        () => {
            try {
                if (storageService?.clearStorage) {
                    storageService.clearStorage();
                } else {
                    localStorage.clear();
                }
            } catch (error) {
                console.error('Erro ao resetar dados:', error);
            }
            if (pipService?.requestQuitApp && pipService.requestQuitApp()) {
                return;
            } else {
                window.location.reload();
            }
        }
    );
}

function showGlassToast(message) {
    let toastEl = document.getElementById('appToast');
    if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.id = 'appToast';
        toastEl.className = 'glass-toast';
        toastEl.setAttribute('role', 'status');
        toastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.remove('show');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');

    if (toastHideTimer) clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function showTaskSuccessModal(taskName) {
    const quote = successQuotes[Math.floor(Math.random() * successQuotes.length)];
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align: center; max-width: 450px;">
            <div class="elegant-icon"><i class="fas fa-check-circle"></i></div>
            <h3 class="elegant-title">Tarefa Concluída</h3>
            <p class="elegant-message">
                <strong>${taskName}</strong> finalizada.<br><br>
                <em>"${quote.text}"</em><br><span>— ${quote.author}</span>
            </p>
            <div class="elegant-actions">
                <button class="btn-modal secondary btn-close-success">Fechar</button>
                <button class="btn-modal primary btn-go-break">Ir para Pausa</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-close-success').onclick = () => overlay.remove();
    overlay.querySelector('.btn-go-break').onclick = () => { overlay.remove(); startPhase('shortBreak'); };
}

function openCreateModal() {
    editingTaskId = null;
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskTimeInput').value = testMode ? '0.08' : '25';
    document.getElementById('taskPomodorosInput').value = '1';
    document.getElementById('taskCategoryInput').value = 'Livre';
    document.querySelectorAll('#taskCategoryChips .cat-chip').forEach((chip) => chip.classList.remove('active'));
    const defaultChip = document.querySelector('#taskCategoryChips .cat-chip[data-val="Livre"]');
    if (defaultChip) defaultChip.classList.add('active');

    ['taskTimeInput', 'taskPomodorosInput'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
        }
    });

    ['increaseTime', 'decreaseTime', 'increasePomodoros', 'decreasePomodoros'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
        }
    });

    const lockHint = document.getElementById('taskTimeLockHint');
    if (lockHint) lockHint.style.display = 'none';

    tempSubtasks = [];
    renderTempSubtasks();
    updatePomodoroSuggestion();
    document.getElementById('modalTaskTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Tarefa';
    document.getElementById('btnSalvarTarefa').textContent = 'Criar Tarefa';
    window.renderCategoryChips?.();
    document.getElementById('newTaskModal')?.classList.add('active');
}

function initModals() {
    document.getElementById('btnTasks')?.addEventListener('click', () => {
        switchView('view-home');
        document.querySelector('.sidebar-tasks')?.scrollIntoView({ behavior: 'smooth' });
    });

    const resetModalFields = () => {
        const fields = ['taskTimeInput', 'taskPomodorosInput'];
        fields.forEach(id => { const el = document.getElementById(id); if(el) { el.disabled = false; el.style.opacity = '1'; } });
        ['increaseTime','decreaseTime','increasePomodoros','decreasePomodoros'].forEach(id => { const el = document.getElementById(id); if(el) { el.disabled = false; el.style.opacity = '1'; } });
        const hint = document.getElementById('taskTimeLockHint'); if (hint) hint.style.display = 'none';
    };

    document.getElementById('btnTasksModal')?.addEventListener('click', openCreateModal);
    document.getElementById('btnAddTaskModal')?.addEventListener('click', openCreateModal);

    document.getElementById('closeNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));
    document.getElementById('cancelNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));
}

function initTaskForm() {
    document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            document.getElementById('taskCategoryInput').value = chip.getAttribute('data-val');
        });
    });

    document.getElementById('taskTimeInput')?.addEventListener('input', (e) => {
        document.getElementById('taskPomodorosInput').value = Math.ceil((parseInt(e.target.value) || 25) / POMODORO_MINUTES); updatePomodoroSuggestion();
    });
    document.getElementById('increaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); const minVal = testMode ? 0.08 : 5; i.value = Math.min(720, parseFloat(i.value) + (testMode ? 0.08 : 5)); document.getElementById('taskPomodorosInput').value = Math.ceil(parseFloat(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('decreaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); const minVal = testMode ? 0.08 : 5; i.value = Math.max(minVal, parseFloat(i.value) - (testMode ? 0.08 : 5)); document.getElementById('taskPomodorosInput').value = Math.ceil(parseFloat(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('increasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.min(20, parseInt(i.value) + 1); updatePomodoroSuggestion(); });
    document.getElementById('decreasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.max(1, parseInt(i.value) - 1); updatePomodoroSuggestion(); });

    document.getElementById('btnAddSubtask')?.addEventListener('click', addTempSubtask);
    document.getElementById('subtaskInput')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') addTempSubtask(); });
    document.getElementById('btnSalvarTarefa')?.addEventListener('click', criarOuEditarTarefa);
}

function initSidebarControls() {
    const oldBtn = document.getElementById('btnAddTaskModal');
    if (oldBtn) {
        const trashBtn = document.createElement('button'); trashBtn.className = 'btn-info'; trashBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; trashBtn.title = 'Selecao em Massa';
        trashBtn.onclick = () => { isDeleteMode = !isDeleteMode; selectedTasksForDelete.clear(); renderTasksSidebar(); };
        oldBtn.parentNode.replaceChild(trashBtn, oldBtn);
    }
}

function updatePomodoroSuggestion() {
    const p = parseInt(document.getElementById('taskPomodorosInput')?.value) || 1;
    document.getElementById('suggestedPomodoros').textContent = p; document.getElementById('suggestionDetail').textContent = `${p} Pomodoro(s) = ${p * 25} min`;
}

function addTempSubtask() {
    const input = document.getElementById('subtaskInput');
    const val = input.value.trim();
    if(!val) return;
    tempSubtasks.push({ id: Date.now(), name: val, completed: false });
    input.value = ''; renderTempSubtasks();
}

function removeTempSubtask(id) { tempSubtasks = tempSubtasks.filter(s => s.id !== id); renderTempSubtasks(); }

function renderTempSubtasks() {
    const list = document.getElementById('tempSubtasksList'); list.innerHTML = '';
    tempSubtasks.forEach(sub => {
        const div = document.createElement('div'); div.className = 'temp-subtask-item';
        div.innerHTML = `<span>${sub.name}</span><button onclick="window.removeTempSubtask(${sub.id})"><i class="fas fa-times"></i></button>`;
        list.appendChild(div);
    });
}

function criarOuEditarTarefa() {
    const name = document.getElementById('taskNameInput')?.value.trim();
    if (!name) { customAlert('Aviso', 'Digite um nome para a tarefa!'); return; }

    const category = document.getElementById('taskCategoryInput')?.value || "Livre";

    if (editingTaskId) {
        const t = tasks.find(x => x.id === editingTaskId);
        if(t) {
            t.name = name; 
            const newMins = parseFloat(document.getElementById('taskTimeInput')?.value) || 25;
            t.estimatedMinutes = newMins;
            t.pomodoros = parseInt(document.getElementById('taskPomodorosInput')?.value) || 1; 
            t.subtasks = [...tempSubtasks];
            t.category = category;
            if(currentTask && currentTask.id === t.id) {
                currentTask = t;
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = category;
                window.updateCustomDropdownUI(category);
                
                // Resync active timer if the user edited active task time!
                if (currentMode === 'focus') {
                    // Update the fraction logic
                    const oldTotal = totalTimerTime;
                    totalTimerTime = newMins * 60;
                    timeLeft = totalTimerTime - (oldTotal - timeLeft);
                    if (timeLeft < 0) timeLeft = 0;
                    if (timeLeft > totalTimerTime) timeLeft = totalTimerTime;
                    updateTimerDisplay();
                }
            }
        }
        editingTaskId = null;
    } else {
        const task = {
            id: Date.now(), name: name, estimatedMinutes: parseFloat(document.getElementById('taskTimeInput')?.value) || 25,
            pomodoros: parseInt(document.getElementById('taskPomodorosInput')?.value) || 1, category: category,
            completedPomodoros: 0, completed: false, subtasks: [...tempSubtasks], createdAt: new Date().toISOString()
        };
        tasks.push(task); startTask(task.id);
    }

    saveTasks(); document.getElementById('taskNameInput').value = ''; tempSubtasks = []; renderTempSubtasks();
    document.getElementById('newTaskModal')?.classList.remove('active');
    renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount();
    syncStateToPip();
}

function renderTasksList() {
    const list = document.getElementById('tasksListModal');
    const empty = document.getElementById('emptyStateModal');
    if (!list) return;
    list.innerHTML = '';

    const allTasks = [...tasks.filter(t => !t.completed), ...tasks.filter(t => t.completed)];

    if (allTasks.length === 0) {
        if(empty) empty.style.setProperty('display', 'flex', 'important');
    } else {
        if(empty) empty.style.setProperty('display', 'none', 'important');
        allTasks.forEach(task => {
            const item = document.createElement('div'); item.className = `task-item ${task.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="task-item-info" onclick="window.selectTask(${task.id})"><div class="task-item-name">${task.name}</div><div class="task-item-meta"><span>${task.estimatedMinutes < 1 ? '5s' : task.estimatedMinutes + ' min'}</span></div></div>
                <div class="task-item-actions-modal" style="display:flex; align-items:center; gap:8px;">
                    <div class="task-item-check" onclick="window.toggleTaskComplete(${task.id})">${task.completed ? '<i class="fas fa-check"></i>' : ''}</div>
                    <button class="action-pill danger" onclick="event.stopPropagation(); window.deleteTask(${task.id})" style="border:none; border-radius:50%; width:28px; height:28px; background:rgba(239,68,68,0.2); color:#ef4444; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(item);
        });
    }
}

function renderTasksSidebar() {
    const list = document.getElementById('tasksListSidebar');
    const empty = document.getElementById('emptyStateSidebar');
    document.body.classList.toggle('bulk-delete-mode', !!isDeleteMode);
    if (!list) {
        notifyTasksRuntime();
        return;
    }
    list.innerHTML = '';

    if (tasks.length === 0) {
        if (empty) empty.style.setProperty('display', 'flex', 'important');
        return;
    }

    if (empty) empty.style.setProperty('display', 'none', 'important');

    const displayTasks = isDeleteMode ? tasks : [...tasks.filter(t=>!t.completed), ...tasks.filter(t=>t.completed)];

    displayTasks.forEach(task => {
        const isCurrent = currentTask?.id === task.id;
        const rawPercent = task.pomodoros > 0 ? ((task.completedPomodoros / task.pomodoros) * 100) : 0;
        const percent = Math.max(0, Math.min(100, rawPercent));
        const item = document.createElement('div'); 
        item.className = `task-item-sidebar ${isCurrent ? 'active' : ''} ${task.completed ? 'completed' : ''} ${isDeleteMode ? 'delete-mode-active' : ''}`;
        
        // Calculate elapsed using estimatedMinutes (not pomodoros x 25)
        const taskTotalMins = task.estimatedMinutes || (task.pomodoros * 25);
        const elapsedFraction = task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) : 0;
        // If this is the current active task, add real-time in-session elapsed
        let realtimeElapsed = 0;
        if (isCurrent && currentMode === 'focus' && totalTimerTime > 0) {
            realtimeElapsed = (totalTimerTime - timeLeft) / totalTimerTime * (taskTotalMins / task.pomodoros);
        }
        const timeElapsed = Math.max(0, Math.floor(elapsedFraction * taskTotalMins + realtimeElapsed));
        const timeTotal = taskTotalMins;

        // Base Layout (Shared between normal and delete mode)
        let subtasksHtml = '';
        if (task.subtasks && task.subtasks.length > 0 && !isDeleteMode) {
            subtasksHtml = `<div class="task-subtasks-container">`;
            task.subtasks.forEach(sub => {
                subtasksHtml += `
                    <label class="modern-subtask ${sub.completed ? 'completed' : ''}">
                        <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="window.toggleSubtask(${task.id}, ${sub.id})">
                        <span class="custom-checkbox"><i class="fas fa-check"></i></span>
                        <span class="subtask-text">${sub.name}</span>
                    </label>
                `;
            });
            subtasksHtml += `</div>`;
        }
        
        const actionRowHtml = `
            <div class="task-sidebar-action-row">
                ${isCurrent && currentMode === 'focus' && !task.completed
                    ? (isTimerRunning
                        ? `<button class="action-pill" style="background:#f59e0b; color:white; box-shadow: 0 4px 15px rgba(245,158,11,0.4);" onclick="event.stopPropagation(); window.toggleTaskTimer()" title="Pausar"><i class="fas fa-pause"></i></button>`
                        : `<button class="action-pill primary" onclick="event.stopPropagation(); window.toggleTaskTimer()" title="Retomar"><i class="fas fa-play"></i></button>`)
                    : `<button class="action-pill primary" onclick="event.stopPropagation(); window.startTask(${task.id})" title="Iniciar"><i class="fas fa-play"></i></button>`
                }
                <button class="action-pill warning" onclick="event.stopPropagation(); window.editTask(${task.id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="action-pill success" onclick="event.stopPropagation(); window.toggleTaskComplete(${task.id})" title="${task.completed ? 'Reabrir' : 'Concluir'}"><i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i></button>
                <button class="action-pill danger" onclick="event.stopPropagation(); window.deleteTask(${task.id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
        `;

        item.innerHTML = `
            <div class="task-info-area" onclick="${isDeleteMode ? `window.toggleTaskSelectionWrap(${task.id})` : `window.selectTask(${task.id})`}">
                <div class="task-sidebar-header">
                    <div class="task-sidebar-title-block">
                        <span class="task-sidebar-name">${task.name}</span>
                        <span class="task-sidebar-cat"><i class="fas fa-tag"></i> ${task.category || 'Livre'}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isCurrent && !task.completed ? '<span class="task-sidebar-badge">Ativa</span>' : ''}
                        ${task.completed ? '<span class="task-sidebar-badge" style="background:#10b981;">Concluida</span>' : ''}
                        ${isDeleteMode ? `<label class="delete-checkbox-label" onclick="event.stopPropagation();"><input type="checkbox" ${selectedTasksForDelete.has(task.id) ? 'checked' : ''} onchange="window.toggleTaskSelection(${task.id}, this.checked)"><span class="delete-checkbox-custom"></span></label>` : ''}
                    </div>
                </div>
                <div class="task-sidebar-progress"><div class="task-sidebar-progress-bar" id="sidebar-prog-${task.id}" style="width: ${percent}%"></div></div>
                <div class="task-sidebar-info"><span>${timeElapsed} / ${timeTotal} min</span><span id="sidebar-percent-${task.id}">${Math.floor(percent)}%</span></div>
            </div>
            ${subtasksHtml}
            ${!isDeleteMode ? actionRowHtml : ''}
        `;
        list.appendChild(item);
    });

    if (isDeleteMode) {
        const actionBar = document.createElement('div'); actionBar.className = 'bulk-delete-bar';
        actionBar.innerHTML = `<label style="color: var(--text-secondary); font-size: 0.8rem; cursor: pointer; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="selectAllTasks" onchange="window.toggleSelectAllTasks(this.checked)" ${selectedTasksForDelete.size === tasks.length ? 'checked' : ''} style="accent-color: #ef4444;"> Selecionar Todas</label><button class="btn-danger-sm" onclick="window.deleteSelectedTasks()"><i class="fas fa-trash"></i> Excluir</button>`;
        list.appendChild(actionBar);
    }

    notifyTasksRuntime();
}

window.editTask = function(taskId) {
    const t = tasks.find(x => x.id === taskId);
    if(!t) return;
    editingTaskId = taskId;
    const isActiveTask = currentTask && currentTask.id === taskId;
    const timerInProgress = isActiveTask && (isTimerRunning || timeLeft < totalTimerTime);

    document.getElementById('taskNameInput').value = t.name; 
    document.getElementById('taskTimeInput').value = t.estimatedMinutes; 
    document.getElementById('taskPomodorosInput').value = t.pomodoros;
    
    // Lock duration fields when task is actively in progress
    const timeInput = document.getElementById('taskTimeInput');
    const pomInput = document.getElementById('taskPomodorosInput');
    const incTime = document.getElementById('increaseTime');
    const decTime = document.getElementById('decreaseTime');
    const incPom = document.getElementById('increasePomodoros');
    const decPom = document.getElementById('decreasePomodoros');
    
    [timeInput, pomInput].forEach(el => { if(el) { el.disabled = timerInProgress; el.style.opacity = timerInProgress ? '0.4' : '1'; } });
    [incTime, decTime, incPom, decPom].forEach(el => { if(el) { el.disabled = timerInProgress; el.style.opacity = timerInProgress ? '0.4' : '1'; } });
    
    if (timerInProgress) {
        const hint = document.getElementById('taskTimeLockHint');
        if (hint) hint.style.display = 'block';
    } else {
        const hint = document.getElementById('taskTimeLockHint');
        if (hint) hint.style.display = 'none';
    }

    document.getElementById('taskCategoryInput').value = t.category || "Livre";
    document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(c => c.classList.remove('active'));
    const activeChip = document.querySelector(`#taskCategoryChips .cat-chip[data-val="${t.category || 'Livre'}"]`);
    if(activeChip) activeChip.classList.add('active');
    tempSubtasks = t.subtasks ? [...t.subtasks] : [];
    renderTempSubtasks(); updatePomodoroSuggestion();
    document.getElementById('modalTaskTitle').innerHTML = '<i class="fas fa-pen"></i> Editar Tarefa'; document.getElementById('btnSalvarTarefa').textContent = 'Salvar';
    window.renderCategoryChips && window.renderCategoryChips();
    document.getElementById('newTaskModal').classList.add('active');
};

window.toggleSubtask = function(taskId, subtaskId) {
    const task = tasks.find(t => t.id === taskId);
    if(task && task.subtasks) {
        const sub = task.subtasks.find(s => s.id === subtaskId);
        if(sub) { sub.completed = !sub.completed; saveTasks(); renderTasksSidebar(); }
    }
};

window.toggleTaskSelection = function(taskId, isChecked) {
    if (isChecked) selectedTasksForDelete.add(taskId); else selectedTasksForDelete.delete(taskId);
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedTasksForDelete.size === tasks.length;
    }
    notifyTasksRuntime();
};
window.toggleSelectAllTasks = function(isChecked) {
    if (isChecked) {
        tasks.forEach(t => selectedTasksForDelete.add(t.id));
    } else {
        selectedTasksForDelete.clear();
    }
    renderTasksSidebar();
};
window.deleteSelectedTasks = function() {
    if (selectedTasksForDelete.size === 0) return;
    customConfirm('Excluir Múltiplas', `Excluir as ${selectedTasksForDelete.size} tarefas?`, () => {
        tasks = tasks.filter(t => !selectedTasksForDelete.has(t.id));
        if (currentTask && selectedTasksForDelete.has(currentTask.id)) {
            resetTimer();
            deselectTask();
        }
        selectedTasksForDelete.clear(); isDeleteMode = false; saveTasks(); renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount();
    });
};

window.deleteTask = function(taskId) {
    customConfirm('Excluir Tarefa', 'Deseja excluir esta tarefa?', () => {
        if (currentTask && currentTask.id === taskId) {
            resetTimer();
            deselectTask();
        }
        tasks = tasks.filter(t => t.id !== taskId);
        saveTasks(); renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount();
    });
};

function deselectTask() {
    taskSessionService.deselectTask();
}

window.attemptDeselectTask = function(isAppClosing) {
    const isFreeMode = !currentTask;
    const hasProgress = currentMode === 'focus' && timeLeft < totalTimerTime;
    
    // If we are closing the app and we are in Free Mode, NEVER show the popup. Just silently log to history and close.
    if (isAppClosing && isFreeMode) {
        if (hasProgress) {
            const elapsedSecs = totalTimerTime - timeLeft;
            if (elapsedSecs >= 60) {
                const activeCategory = document.getElementById('globalCategorySelect')?.value || "Livre";
                const todayStr = new Date().toISOString().split('T')[0];
                focusHistory.push({
                    id: Date.now(), date: todayStr,
                    durationMinutes: Math.max(1, Math.round(elapsedSecs / 60)),
                    category: activeCategory, taskId: null
                });
                saveFocusHistory();
            }
        }
        if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
            window.location.reload();
        }
        return;
    }

    if (!hasProgress) {
        if (isAppClosing) {
            if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                window.location.reload();
            }
            return;
        }
        if (currentTask) deselectTask();
        return;
    }

    const titleText = isAppClosing ? 'Sair do FocoZen?' : 'Pausar Tarefa?';
    const msgText = isAppClosing
        ? 'Voce tem um temporizador rodando. Deseja salvar o progresso atual, ou desistir da sessao e sair?'
        : 'Voce tem progresso nesta sessao. Deseja continuar a tarefa em outro momento (salvar progresso) ou desistir?';
    
    const btnCancelText = isAppClosing ? 'Desistir e Sair' : 'Desistir (Perder Sessao)';
    const btnSaveText = isAppClosing ? 'Salvar e Sair' : 'Salvar e Fechar Tarefa';

    const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="elegant-popup" style="text-align: center; max-width: 420px;">
            <div class="elegant-icon" style="color: #f59e0b;"><i class="fas fa-pause-circle"></i></div>
            <h3 class="elegant-title">${titleText}</h3>
            <p class="elegant-message">${msgText}</p>
            <div class="elegant-actions">
                <button class="btn-modal danger btn-giveup">${btnCancelText}</button>
                <button class="btn-modal primary btn-save-progress">${btnSaveText}</button>
            </div>
            <button class="btn-modal secondary btn-cancel-popup" style="margin-top:10px; width:100%;">Voltar</button>
        </div>`;
    document.body.appendChild(overlay);
    

    overlay.querySelector('.btn-cancel-popup').onclick = () => overlay.remove();

    overlay.querySelector('.btn-giveup').onclick = () => {
        overlay.remove();
        if (isAppClosing) {
            if (currentTask) {
                currentTask.completedPomodoros = Math.floor(currentTask.completedPomodoros);
            }
            saveTasks();
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                window.location.reload();
            }
        } else {
            resetTimer();
            deselectTask();
        }
    };
    
    overlay.querySelector('.btn-save-progress').onclick = () => { 
        overlay.remove();
        
        // CRITICAL: Capture ALL state BEFORE any mutation
        const savedTimeLeft = timeLeft;
        const savedTotalTime = totalTimerTime;
        const savedMode = currentMode;
        const savedTaskId = currentTask ? currentTask.id : null;
        const savedCategory = currentTask ? currentTask.category : (document.getElementById('globalCategorySelect')?.value || 'Livre');
        
        console.log('[SAVE] Capturing state:', { savedTimeLeft, savedTotalTime, savedTaskId, savedCategory });
        
        // Save fractional progress to the task
        if (currentTask && savedMode === 'focus' && savedTotalTime > 0) {
            const partialPomodoro = (savedTotalTime - savedTimeLeft) / savedTotalTime;
            currentTask.completedPomodoros = Math.floor(currentTask.completedPomodoros) + partialPomodoro;
            console.log('[SAVE] Updated completedPomodoros:', currentTask.completedPomodoros);
            saveTasks();
        }
        
        // Create session state for resume
        const stateObj = { 
            taskId: savedTaskId, 
            category: savedCategory, 
            timeLeft: savedTimeLeft, 
            totalTimerTime: savedTotalTime, 
            mode: savedMode 
        };
        saveSavedSession(stateObj);
        console.log('[SAVE] Session saved:', stateObj);

        if (isAppClosing) {
            setTimeout(() => {
                if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                    window.location.reload();
                }
            }, 300);
        } else {
            // Manual cleanup — do NOT call resetTimer/deselectTask
            pauseTimer();
            currentTask = null;
            timeLeft = POMODORO_MINUTES * 60;
            totalTimerTime = timeLeft;
            currentMode = 'focus';
            const badge = document.getElementById('currentTaskBadge');
            if (badge) { badge.textContent = 'Sessao Livre'; badge.className = 'task-badge free-mode'; }
            document.getElementById('btnFreeFocus')?.classList.add('hidden');
            const globalCat = document.getElementById('globalCategorySelect');
            if (globalCat) globalCat.value = 'Livre';
            window.updateCustomDropdownUI('Livre');
            applyTimerModeUi({ mode: 'focus', resetToggleButton: true });
            updateTimerDisplay(); updateProgressBar();
            renderProgress(); renderTasksSidebar(); renderTasksList();
            syncStateToPip();
        }
    };
};

window.toggleTaskSelectionWrap = function(id) {
    const selected = selectedTasksForDelete.has(id);
    window.toggleTaskSelection(id, !selected);
    renderTasksSidebar();
};

window.promptResumeSession = function() {
    const session = readSavedSession();
    if (!session) return;
    
    // Auto Show modal wizard check
    const checkWizard = () => {
        const storedUsername = storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.USERNAME, null)
            : localStorage.getItem(storageKeys.USERNAME);
        if (!storedUsername) {
            document.getElementById('wizardModal')?.classList.add('active');
        }
    };
    
    try {
        if(!session) { checkWizard(); return; }
        
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
        overlay.innerHTML = `
            <div class="elegant-popup" style="text-align: center; max-width: 420px;">
                <div class="elegant-icon" style="color: #10b981;"><i class="fas fa-play-circle"></i></div>
                <h3 class="elegant-title">Sessao Encontrada</h3>
                <p class="elegant-message">Detectamos uma sessao pausada anteriormente. Deseja retoma-la de onde parou?</p>
                <div class="elegant-actions">
                    <button class="btn-modal danger btn-discard">Descartar</button>
                    <button class="btn-modal primary btn-resume">Retomar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        
        overlay.querySelector('.btn-discard').onclick = () => {
            overlay.remove();
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            checkWizard();
        };
        
        overlay.querySelector('.btn-resume').onclick = () => {
            overlay.remove();
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            
            if (session.taskId) {
                const targetTask = tasks.find(t => t.id === session.taskId);
                if (targetTask && !targetTask.completed) {
                    // Use skipTimerSync=true so selectTask doesn't overwrite the saved timeLeft
                    selectTask(session.taskId, true);
                    
                    // Now restore the exact saved timer state
                    currentMode = 'focus';
                    timeLeft = session.timeLeft;
                    totalTimerTime = session.totalTimerTime;
                    applyTimerModeUi({ mode: currentMode, resetToggleButton: true });
                    updateTimerDisplay();
                    updateProgressBar();
                    renderTasksSidebar();
                    toggleTimer(); // Resume counting
                } else {
                    showGlassToast("A tarefa da sessao ja foi concluida ou excluida.");
                    checkWizard();
                }
            } else {
                // Free-mode session restore
                deselectTask();
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = session.category;
                window.updateCustomDropdownUI(session.category);
                
                // Restore timer directly without setTimerMode
                currentMode = 'focus';
                timeLeft = session.timeLeft;
                totalTimerTime = session.totalTimerTime;
                applyTimerModeUi({ mode: currentMode, resetToggleButton: true });
                updateTimerDisplay();
                updateProgressBar();
                toggleTimer();
            }
        };
    } catch(e) {
         if (storageService?.removeStorageValue) {
             storageService.removeStorageValue(storageKeys.SAVED_SESSION);
         } else {
             localStorage.removeItem(storageKeys.SAVED_SESSION);
         }
         checkWizard();
    }
};

function startTask(taskId) {
    // If we're already on this task, just toggle play
    if (currentTask && currentTask.id === taskId) {
        // Se ainda está em modo break, muda para focus
        if (currentMode !== 'focus') setTimerMode('focus');
        if (!isTimerRunning) toggleTimer();
        return;
    }
    
    // Otherwise, we want to select it, then immediately start it. 
    // We pass a callback to selectTask so it runs after the switch (and after any save modals).
    selectTask(taskId, false, () => {
        if (currentTask && !currentTask.completed && !isTimerRunning) {
            // Garantir que está em modo focus antes de iniciar
            if (currentMode !== 'focus') setTimerMode('focus');
            toggleTimer(); 
        }
    });
}

function selectTask(taskId, skipTimerSync, onComplete) {
    // If we are currently in Free Mode (no current task) but with progress, silently log to history and switch instantly!
    if (!currentTask && currentMode === 'focus' && timeLeft < totalTimerTime) {
        const elapsedSecs = totalTimerTime - timeLeft;
        if (elapsedSecs >= 60) { // Only log if at least 1 minute was spent
            const activeCategory = document.getElementById('globalCategorySelect')?.value || "Livre";
            const todayStr = new Date().toISOString().split('T')[0];
            focusHistory.push({
                id: Date.now(), date: todayStr,
                durationMinutes: Math.max(1, Math.round(elapsedSecs / 60)),
                category: activeCategory, taskId: null
            });
            saveFocusHistory();
        }
        pauseTimer();
        _doSelectTask(taskId, skipTimerSync);
        if (onComplete) onComplete();
        return;
    }

    // Offer to save if there's progress on a DIFFERENT TASK
    const isCurrentTaskDifferent = currentTask ? currentTask.id !== taskId : false;
    const hasProgress = isCurrentTaskDifferent && currentMode === 'focus' && timeLeft < totalTimerTime;
    
    if (hasProgress) {
        const doSwitch = () => {
            _doSelectTask(taskId, skipTimerSync);
            if (onComplete) onComplete();
        };
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
        overlay.innerHTML = `
            <div class="elegant-popup" style="text-align:center; max-width:400px;">
                <div class="elegant-icon" style="color:#f59e0b;"><i class="fas fa-exchange-alt"></i></div>
                <h3 class="elegant-title">Trocar Tarefa?</h3>
                <p class="elegant-message">Você tem progresso na tarefa atual. O que deseja fazer?</p>
                <div class="elegant-actions">
                    <button class="btn-modal danger btn-discard-sw">Desistir e Trocar</button>
                    <button class="btn-modal primary btn-save-sw">Salvar e Trocar</button>
                </div>
                <button class="btn-modal secondary" style="margin-top:10px;width:100%;" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.btn-discard-sw').onclick = () => { overlay.remove(); resetTimer(); doSwitch(); };
        overlay.querySelector('.btn-save-sw').onclick = () => {
            overlay.remove();
            if (currentMode === 'focus') {
                if (currentTask) {
                    const partialPomodoro = (totalTimerTime - timeLeft) / totalTimerTime;
                    currentTask.completedPomodoros = Math.floor(currentTask.completedPomodoros) + partialPomodoro;
                    saveTasks();
                }
                // Also save session state so it can be resumed
                const stateObj = { 
                    taskId: currentTask ? currentTask.id : null, 
                    category: currentTask ? currentTask.category : (document.getElementById('globalCategorySelect')?.value || 'Livre'), 
                    timeLeft, 
                    totalTimerTime, 
                    mode: currentMode 
                };
                saveSavedSession(stateObj);
            }
            // Now do a clean reset and switch
            pauseTimer();
            currentTask = null; // Clear without calling deselectTask (which would resetTimer)
            _doSelectTask(taskId, skipTimerSync);
            if (onComplete) onComplete();
        };
        return; // Wait for user choice
    }
    
    _doSelectTask(taskId, skipTimerSync);
    if (onComplete) onComplete();
}

function _doSelectTask(taskId, skipTimerSyncInput) {
    currentTask = tasks.find(t => t.id === taskId);
    if (currentTask && !currentTask.completed) {
        let skipTimerSync = skipTimerSyncInput;
        // Check if there's a saved session for this newly selected task
        const session = readSavedSession();
        
        if (session && session.taskId === taskId) {
            // Restore exact saved timer state for this task
            skipTimerSync = true;
            currentMode = session.mode || 'focus';
            timeLeft = session.timeLeft;
            totalTimerTime = session.totalTimerTime;
            applyTimerModeUi({ mode: currentMode, resetToggleButton: true });
            updateTimerDisplay();
            updateProgressBar();
            // Clear the session so we don't infinitely restore it if closed without saving
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
        }

        const badge = document.getElementById('currentTaskBadge');
        badge.textContent = currentTask.name.substring(0, 15) + (currentTask.name.length > 15 ? '...' : '');
        badge.className = 'task-badge task-mode'; document.getElementById('btnFreeFocus').classList.remove('hidden');
        document.getElementById('globalCategorySelect').value = currentTask.category || "Livre";
        window.updateCustomDropdownUI(currentTask.category || "Livre");
        
        // If not restoring from the physical localstorage session, we can mathematically restore from the decimal fraction!
        if (!skipTimerSync) {
            totalTimerTime = getTaskFocusDurationSeconds(currentTask);
            const fractionDone = currentTask.completedPomodoros % 1; // get the decimal part (e.g., 0.2 means 20% done)
            
            // Reconstruct the exact timeLeft from the fraction!
            if (fractionDone > 0) {
                timeLeft = Math.round(totalTimerTime * (1 - fractionDone));
            } else {
                timeLeft = totalTimerTime; // fresh start
            }
            
            updateTimerDisplay();
            updateProgressBar();
        }
    } else { deselectTask(); }
    renderProgress(); renderTasksList(); renderTasksSidebar(); document.getElementById('welcomeModal')?.classList.remove('active');
    syncStateToPip();
}

function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed; saveTasks();
        if(task.completed) { showTaskSuccessModal(task.name); if(currentTask?.id === taskId) deselectTask(); }
        renderTasksList(); renderTasksSidebar(); updateHeaderTaskCount();
    }
}

window.promptResumeSession = function() {
    taskSessionService.promptResumeSession();
};

function startTask(taskId) {
    taskSessionService.startTask(taskId);
}

function selectTask(taskId, skipTimerSync = false, onComplete = null) {
    taskSessionService.selectTask(taskId, {
        skipTimerSync: !!skipTimerSync,
        onComplete
    });
}

function _doSelectTask(taskId, skipTimerSyncInput = false) {
    taskSessionService.performTaskSelection(taskId, {
        skipTimerSync: !!skipTimerSyncInput
    });
}

function toggleTaskComplete(taskId) {
    taskSessionService.toggleTaskComplete(taskId);
}

function deleteTask(taskId) {
    customConfirm('Excluir Tarefa', 'Excluir esta tarefa permanentemente?', () => {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx > -1) { tasks.splice(idx, 1); if (currentTask?.id === taskId) deselectTask(); saveTasks(); renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount(); }
    });
}

function renderProgress() {
    notifyHomeRuntime();
}

function updateTaskBubbleProgress() {
    notifyHomeRuntime();
}

function updateHeaderTaskCount() { const badge = document.getElementById('headerTaskCount'); if (badge) badge.textContent = tasks.filter(t => !t.completed).length; }

window.selectTask = selectTask; window.toggleTaskComplete = toggleTaskComplete; window.deleteTask = deleteTask; window.startTask = startTask;
window.removeTempSubtask = removeTempSubtask; window.editTask = editTask;

// ==========================================
// BENTO BOX DASHBOARD
// ==========================================
const radialChartFrames = new WeakMap();
const periodChartInstances = new WeakMap();

function formatMinutesToHours(minutes) {
    if (historyCore?.formatMinutesToHours) {
        return historyCore.formatMinutesToHours(minutes);
    }

    const totalMinutes = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function filterHistoryForPeriod(history, period) {
    if (historyCore?.filterHistoryByPeriod) {
        return historyCore.filterHistoryByPeriod(history, period, new Date());
    }

    return Array.isArray(history) ? history : [];
}

function getFocusWindowSummaryData() {
    if (historyCore?.getFocusWindowSummary) {
        return historyCore.getFocusWindowSummary({ history: focusHistory, now: new Date() });
    }

    return {
        todayHistory: [],
        todayMinutes: 0,
        weekHistory: [],
        weekMinutes: 0
    };
}

function getFocusStreakSummaryData() {
    if (historyCore?.getFocusStreakSummary) {
        return historyCore.getFocusStreakSummary({ history: focusHistory, now: new Date() });
    }

    return {
        currentStreak: 0,
        maxStreak: 0
    };
}

function getFocusGreetingStateData({ todayMinutes, weekMinutes }) {
    if (historyCore?.getFocusGreetingState) {
        return historyCore.getFocusGreetingState({ todayMinutes, weekMinutes });
    }

    return 'default';
}

function getSortedGoalCategoriesData() {
    if (goalsCore?.getSortedGoalCategories) {
        return goalsCore.getSortedGoalCategories({
            userCategories,
            defaultCategories,
            focusGoals,
            locale: 'pt-BR'
        });
    }

    return [];
}

function getActiveGoalsData() {
    if (goalsCore?.getActiveGoals) {
        return goalsCore.getActiveGoals(focusGoals);
    }

    return [];
}

function getGoalSummariesData(period) {
    if (goalsCore?.getGoalSummaries) {
        return goalsCore.getGoalSummaries({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return [];
}

function getDailyGoalOutcomeData(date) {
    if (goalsCore?.getDailyGoalOutcome) {
        return goalsCore.getDailyGoalOutcome({
            focusGoals,
            focusHistory,
            date
        });
    }

    return {
        targetMinutes: 0,
        actualMinutes: 0,
        activeCategories: 0,
        hitCategories: 0,
        hitAll: false
    };
}

function getGoalOverviewData(period) {
    if (goalsCore?.getGoalOverview) {
        return goalsCore.getGoalOverview({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return {
        summaries: [],
        activeCount: 0,
        hitCount: 0,
        totalTarget: 0,
        totalActual: 0,
        averageProgress: 0,
        bestCategory: null,
        streak: 0
    };
}

function getGoalEvolutionSeriesData(period) {
    if (goalsCore?.getGoalEvolutionSeries) {
        return goalsCore.getGoalEvolutionSeries({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return [];
}

function resolveCategoryPalette(category, index = 0) {
    if (goalsCore?.getCategoryPalette) {
        return goalsCore.getCategoryPalette(category, index);
    }

    return { from: '#60a5fa', to: '#2563eb' };
}

function getGoalMomentumContent(overview) {
    const momentumState = goalsCore?.getGoalMomentumState
        ? goalsCore.getGoalMomentumState(overview)
        : 'empty';

    if (momentumState === 'ahead') {
        return {
            badge: 'Meta batida',
            headline: 'Voce esta entregando acima do planejado neste periodo.',
            caption: `Excelente ritmo: ${overview.hitCount} de ${overview.activeCount} categorias ja bateram a meta.`,
            encouragement: 'Voce esta construindo consistencia real. Tente manter esse padrao ate o fim do periodo.',
            nextAction: 'Se continuar assim, vale subir um pouco a meta da categoria mais estavel.'
        };
    }

    if (momentumState === 'near') {
        return {
            badge: 'Quase la',
            headline: 'Falta pouco para transformar seu planejamento em meta cumprida.',
            caption: `Voce ja percorreu ${overview.averageProgress}% do caminho planejado neste periodo.`,
            encouragement: 'Seu ritmo esta forte. Um ultimo bloco bem usado pode virar varias metas em verde.',
            nextAction: 'Priorize primeiro a categoria mais perto de 100% para ganhar tracao.'
        };
    }

    if (momentumState === 'moving') {
        return {
            badge: 'Em movimento',
            headline: 'O foco ja comecou. Agora vale alinhar melhor energia e prioridade.',
            caption: `Voce entregou ${formatMinutesToHours(overview.totalActual)} de ${formatMinutesToHours(overview.totalTarget)} planejados.`,
            encouragement: 'Mesmo longe do alvo, cada bloco concluido reduz a distancia ate a meta.',
            nextAction: 'Concentre o proximo ciclo na categoria mais importante do seu dia.'
        };
    }

    if (momentumState === 'start') {
        return {
            badge: 'Hora de iniciar',
            headline: 'Ainda nao houve foco registrado para as metas deste periodo.',
            caption: 'Um unico bloco iniciado ja comeca a dar forma para sua semana.',
            encouragement: 'Nao precisa esperar motivacao perfeita. Comece pequeno e deixe o ritmo aparecer.',
            nextAction: 'Escolha a categoria mais critica e faca um primeiro bloco de foco agora.'
        };
    }

    return {
        badge: 'Sem metas ativas',
        headline: 'Crie metas por categoria para acompanhar seu ritmo real de foco.',
        caption: 'Assim que houver metas, este painel compara o planejado com o realizado.',
        encouragement: 'Configure suas primeiras metas e transforme foco em rotina.',
        nextAction: 'Comece com 1 ou 2 categorias principais para criar consistencia sem friccao.'
    };
}

const categoryPalette = [
    { from: '#60a5fa', to: '#2563eb' },
    { from: '#34d399', to: '#059669' },
    { from: '#f59e0b', to: '#d97706' },
    { from: '#f472b6', to: '#db2777' },
    { from: '#a78bfa', to: '#7c3aed' },
    { from: '#22d3ee', to: '#0891b2' },
    { from: '#fb7185', to: '#e11d48' },
    { from: '#4ade80', to: '#16a34a' },
    { from: '#fbbf24', to: '#ca8a04' },
    { from: '#38bdf8', to: '#0284c7' },
    { from: '#94a3b8', to: '#64748b' },
    { from: '#c084fc', to: '#9333ea' }
];

function getSortedGoalCategories() {
    const baseCategories = userCategories.length ? userCategories : defaultCategories;
    const goalCats = focusGoals.map(goal => ({ name: goal.category, icon: 'fa-bullseye' }));
    const merged = [...baseCategories, ...goalCats]
        .filter(cat => cat && cat.name && cat.name !== 'Livre')
        .reduce((acc, cat) => {
            if (!acc.some(item => item.name === cat.name)) acc.push(cat);
            return acc;
        }, []);

    return merged.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function getCategoryPalette(category, index = 0) {
    const known = {
        'Trabalho': categoryPalette[0],
        'Livre': categoryPalette[3],
        'Estudos': categoryPalette[1],
        'Hobbies': categoryPalette[2],
        'Leitura': categoryPalette[6],
        'Projetos': categoryPalette[4],
        'Exercício': categoryPalette[5],
        'Outros': categoryPalette[10]
    };

    if (category && known[category]) return known[category];
    if (index >= 0) return categoryPalette[index % categoryPalette.length];

    let hash = 0;
    for (let i = 0; i < (category || '').length; i++) {
        hash = ((hash << 5) - hash) + category.charCodeAt(i);
        hash |= 0;
    }

    return categoryPalette[Math.abs(hash) % categoryPalette.length];
}

function getPeriodDateRange(period) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    if (period === 'day') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
}

function enumeratePeriodDates(period) {
    const { start, end } = getPeriodDateRange(period);
    const dates = [];
    const cursor = new Date(start);

    while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

function isGoalApplicableOnDate(goal, date) {
    if (!goal || !date) return false;
    const dayOfWeek = date.getDay();
    if (goal.schedule === 'everyday') return true;
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function getActiveGoals() {
    return focusGoals.filter(goal => goal && goal.active !== false && goal.category && Number(goal.dailyMinutes) > 0);
}

function getGoalSummaries(period) {
    const activeGoals = getActiveGoalsData();
    const dates = enumeratePeriodDates(period);
    const actualByCategory = {};

    filterHistoryByPeriod(focusHistory, period).forEach(entry => {
        const category = entry.category || 'Livre';
        actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry.durationMinutes) || 0);
    });

    return activeGoals.map((goal, index) => {
        const targetMinutes = dates.reduce((sum, date) => {
            return sum + (isGoalApplicableOnDate(goal, date) ? Number(goal.dailyMinutes) || 0 : 0);
        }, 0);
        const actualMinutes = actualByCategory[goal.category] || 0;
        const percent = targetMinutes > 0 ? Math.round((actualMinutes / targetMinutes) * 100) : 0;
        return {
            ...goal,
            index,
            targetMinutes,
            actualMinutes,
            remainingMinutes: Math.max(0, targetMinutes - actualMinutes),
            percent,
            palette: getCategoryPalette(goal.category, index)
        };
    }).sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        return b.actualMinutes - a.actualMinutes;
    });
}

function getDailyGoalOutcome(date) {
    const activeGoals = getActiveGoalsData();
    let targetMinutes = 0;
    let actualMinutes = 0;
    let activeCategories = 0;
    let hitCategories = 0;
    const dateStr = date.toISOString().split('T')[0];
    const actualByCategory = {};

    focusHistory
        .filter(entry => entry.date === dateStr)
        .forEach(entry => {
            const category = entry.category || 'Livre';
            actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry.durationMinutes) || 0);
        });

    activeGoals.forEach(goal => {
        if (!isGoalApplicableOnDate(goal, date)) return;
        const target = Number(goal.dailyMinutes) || 0;
        const actual = actualByCategory[goal.category] || 0;
        targetMinutes += target;
        actualMinutes += actual;
        activeCategories++;
        if (actual >= target) hitCategories++;
    });

    return {
        targetMinutes,
        actualMinutes,
        activeCategories,
        hitCategories,
        hitAll: activeCategories > 0 && hitCategories === activeCategories
    };
}

function getGoalStreak() {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 90; i++) {
        const outcome = getDailyGoalOutcome(cursor);
        if (outcome.activeCategories === 0) {
            cursor.setDate(cursor.getDate() - 1);
            continue;
        }
        if (!outcome.hitAll) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function getGoalOverview(period) {
    const summaries = getGoalSummaries(period);
    const activeCount = summaries.length;
    const hitCount = summaries.filter(item => item.actualMinutes >= item.targetMinutes && item.targetMinutes > 0).length;
    const totalTarget = summaries.reduce((sum, item) => sum + item.targetMinutes, 0);
    const totalActual = summaries.reduce((sum, item) => sum + item.actualMinutes, 0);
    const averageProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const bestCategory = summaries.length ? summaries.reduce((best, item) => {
        if (!best) return item;
        if (item.percent !== best.percent) return item.percent > best.percent ? item : best;
        return item.actualMinutes > best.actualMinutes ? item : best;
    }, null) : null;

    return {
        summaries,
        activeCount,
        hitCount,
        totalTarget,
        totalActual,
        averageProgress,
        bestCategory,
        streak: getGoalStreak()
    };
}

function getPeriodLabel(period) {
    return {
        day: 'Hoje',
        week: 'Semana atual',
        month: 'Ultimos 30 dias'
    }[period] || 'Semana atual';
}

function getGoalMomentum(overview) {
    if (!overview.activeCount) {
        return {
            badge: 'Sem metas ativas',
            headline: 'Crie metas por categoria para acompanhar seu ritmo real de foco.',
            caption: 'Assim que houver metas, este painel compara o planejado com o realizado.',
            encouragement: 'Configure suas primeiras metas e transforme foco em rotina.',
            nextAction: 'Comece com 1 ou 2 categorias principais para criar consistencia sem friccao.'
        };
    }

    if (overview.averageProgress >= 100) {
        return {
            badge: 'Meta batida',
            headline: 'Voce esta entregando acima do planejado neste periodo.',
            caption: `Excelente ritmo: ${overview.hitCount} de ${overview.activeCount} categorias ja bateram a meta.`,
            encouragement: 'Voce esta construindo consistencia real. Tente manter esse padrao ate o fim do periodo.',
            nextAction: 'Se continuar assim, vale subir um pouco a meta da categoria mais estavel.'
        };
    }

    if (overview.averageProgress >= 80) {
        return {
            badge: 'Quase la',
            headline: 'Falta pouco para transformar seu planejamento em meta cumprida.',
            caption: `Voce ja percorreu ${overview.averageProgress}% do caminho planejado neste periodo.`,
            encouragement: 'Seu ritmo esta forte. Um ultimo bloco bem usado pode virar varias metas em verde.',
            nextAction: 'Priorize primeiro a categoria mais perto de 100% para ganhar tracao.'
        };
    }

    if (overview.totalActual > 0) {
        return {
            badge: 'Em movimento',
            headline: 'O foco ja comecou. Agora vale alinhar melhor energia e prioridade.',
            caption: `Voce entregou ${formatMinsToHours(overview.totalActual)} de ${formatMinsToHours(overview.totalTarget)} planejados.`,
            encouragement: 'Mesmo longe do alvo, cada bloco concluido reduz a distancia ate a meta.',
            nextAction: 'Concentre o proximo ciclo na categoria mais importante do seu dia.'
        };
    }

    return {
        badge: 'Hora de iniciar',
        headline: 'Ainda nao houve foco registrado para as metas deste periodo.',
        caption: 'Um unico bloco iniciado ja comeca a dar forma para sua semana.',
        encouragement: 'Nao precisa esperar motivacao perfeita. Comece pequeno e deixe o ritmo aparecer.',
        nextAction: 'Escolha a categoria mais critica e faça um primeiro bloco de foco agora.'
    };
}

function renderGoalCategoryOptions() {
    const select = document.getElementById('goalCategorySelect');
    if (!select) return;

    const categories = getSortedGoalCategoriesData();
    const currentValue = editingGoalId
        ? (focusGoals.find(goal => goal.id === editingGoalId)?.category || categories[0]?.name || '')
        : (select.value || categories[0]?.name || '');

    select.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });

    if (categories.length) {
        select.value = categories.some(cat => cat.name === currentValue) ? currentValue : categories[0].name;
    }
}

function resetGoalForm() {
    editingGoalId = null;
    const minutesInput = document.getElementById('goalDailyMinutesInput');
    const scheduleInput = document.getElementById('goalScheduleInput');
    const cancelBtn = document.getElementById('btnCancelGoalEdit');

    renderGoalCategoryOptions();
    if (minutesInput) minutesInput.value = 1;
    if (scheduleInput) scheduleInput.value = 'weekdays';
    document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === 'weekdays');
    });
    if (cancelBtn) cancelBtn.classList.add('hidden');
    updateGoalHoursDisplay(1);
}

function populateGoalForm(goalId) {
    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    editingGoalId = goal.id;
    renderGoalCategoryOptions();
    document.getElementById('goalCategorySelect').value = goal.category;
    document.getElementById('goalDailyMinutesInput').value = ((Number(goal.dailyMinutes) || 0) / 60).toString();
    document.getElementById('goalScheduleInput').value = goal.schedule || 'weekdays';
    document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === (goal.schedule || 'weekdays'));
    });
    document.getElementById('btnCancelGoalEdit')?.classList.remove('hidden');
    updateGoalHoursDisplay(goal.dailyMinutes / 60);
}

function normalizeGoalHours(value) {
    const safeValue = Number.isFinite(value) ? value : 1;
    const stepped = Math.round(Math.max(0.5, safeValue) * 2) / 2;
    return stepped;
}

function updateGoalHoursDisplay(hours) {
    const normalizedHours = normalizeGoalHours(hours);
    const input = document.getElementById('goalDailyMinutesInput');
    const label = document.getElementById('goalHoursValue');
    if (input) input.value = normalizedHours.toString();
    if (label) label.textContent = `${normalizedHours.toFixed(1).replace('.0', '').replace('.', ',')}h`;
}

function saveGoalEntry({ goalId = null, category, dailyMinutes, schedule }) {
    if (!category) {
        return { ok: false, message: 'Selecione uma categoria para criar a meta.' };
    }

    if (!dailyMinutes || dailyMinutes <= 0) {
        return { ok: false, message: 'Informe uma meta diária válida em horas.' };
    }

    const duplicateGoal = focusGoals.find(goal => goal.category === category && goal.id !== goalId);
    if (duplicateGoal) {
        return { ok: false, message: 'Essa categoria ja possui uma meta. Edite a existente ou escolha outra.' };
    }

    if (goalId) {
        focusGoals = focusGoals.map(goal => goal.id === goalId
            ? { ...goal, category, dailyMinutes, schedule, active: true }
            : goal
        );
    } else {
        focusGoals.push({
            id: Date.now(),
            category,
            dailyMinutes,
            schedule,
            active: true
        });
    }

    saveFocusGoals();
    renderStatsGoalsSummary(window._statsPeriod || 'week');
    window.compileGoalsData?.();

    return {
        ok: true,
        message: goalId ? 'Meta atualizada.' : 'Meta criada.'
    };
}

function openGoalEditModal(goalId) {
    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    const categories = getSortedGoalCategoriesData();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup goal-edit-modal';
    overlay.innerHTML = `
        <div class="elegant-popup goal-edit-popup">
            <div class="elegant-icon" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
                <i class="fas fa-pen"></i>
            </div>
            <h3 class="elegant-title">Editar meta</h3>
            <p class="elegant-message">Ajuste a categoria, a carga diaria e os dias em que essa meta vale.</p>
            <div class="goal-form-grid">
                <div class="form-group goal-field goal-field-category">
                    <label for="goalEditCategorySelect"><i class="fas fa-tag"></i> Categoria</label>
                    <select id="goalEditCategorySelect" class="glass-select">
                        ${categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group goal-field goal-field-hours">
                    <label><i class="fas fa-clock"></i> Horas por dia</label>
                    <div class="goal-hours-stepper">
                        <button class="goal-hours-btn" type="button" data-goal-edit-step="-0.5" aria-label="Diminuir horas"><i class="fas fa-minus"></i></button>
                        <div class="goal-hours-display">
                            <span id="goalEditHoursValue">1h</span>
                            <small>por dia</small>
                        </div>
                        <button class="goal-hours-btn" type="button" data-goal-edit-step="0.5" aria-label="Aumentar horas"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-calendar-week"></i> Aplicar em</label>
                <div class="stats-period-selector goal-schedule-selector">
                    <button class="stats-period-btn goal-edit-schedule-btn" data-schedule="weekdays" type="button">Dias uteis</button>
                    <button class="stats-period-btn goal-edit-schedule-btn" data-schedule="everyday" type="button">Semana inteira</button>
                </div>
            </div>
            <div class="goal-form-actions">
                <button class="btn-modal secondary btn-goal-edit-cancel" type="button">Cancelar</button>
                <button class="btn-modal primary btn-goal-edit-save" type="button"><i class="fas fa-save"></i>Salvar alteracoes</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const select = overlay.querySelector('#goalEditCategorySelect');
    const valueLabel = overlay.querySelector('#goalEditHoursValue');
    const scheduleButtons = overlay.querySelectorAll('.goal-edit-schedule-btn');
    let currentHours = normalizeGoalHours((Number(goal.dailyMinutes) || 0) / 60);
    let currentSchedule = goal.schedule || 'weekdays';

    if (select) select.value = goal.category;

    const syncModalHours = () => {
        if (valueLabel) {
            valueLabel.textContent = `${currentHours.toFixed(1).replace('.0', '').replace('.', ',')}h`;
        }
    };

    syncModalHours();
    scheduleButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === currentSchedule);
        btn.addEventListener('click', () => {
            currentSchedule = btn.dataset.schedule;
            scheduleButtons.forEach(item => item.classList.toggle('active', item === btn));
        });
    });

    overlay.querySelectorAll('[data-goal-edit-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseFloat(btn.dataset.goalEditStep || '0');
            currentHours = normalizeGoalHours(currentHours + step);
            syncModalHours();
        });
    });

    overlay.querySelector('.btn-goal-edit-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.remove();
    });

    overlay.querySelector('.btn-goal-edit-save')?.addEventListener('click', () => {
        const category = select?.value || '';
        const dailyMinutes = Math.round(currentHours * 60);
        const result = saveGoalEntry({
            goalId: goal.id,
            category,
            dailyMinutes,
            schedule: currentSchedule
        });

        if (!result.ok) {
            showGlassToast(result.message);
            return;
        }

        overlay.remove();
        resetGoalForm();
        showGlassToast(result.message);
    });
}

function injectFakeDataIfNeeded() {
    return;
}

window.compileDashboardData = function() {
    injectFakeDataIfNeeded();
    return window.FocoZenStatsRuntime?.refresh?.();

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded yet");
        return;
    }

    injectFakeDataIfNeeded();

    const { todayHistory, todayMinutes, weekMinutes } = getFocusWindowSummaryData();
    document.getElementById('statsFocusToday').textContent = formatMinutesToHours(todayMinutes);
    document.getElementById('statsFocusWeek').textContent = formatMinutesToHours(weekMinutes);
    
    // Greeting Title Logic
    const firstName = username.split(' ')[0];
    let greetingTitle = `Mandou bem, ${firstName}!`;
    let greetingSub = "Aqui está o resumo do seu foco.";
    
    const greetingState = getFocusGreetingStateData({ todayMinutes, weekMinutes });
    
    if (greetingState === 'master') {
        greetingTitle = `Mestre do Foco, ${firstName}`;
        greetingSub = 'Seu desempenho hoje foi excepcional.';
    } else if (greetingState === 'consistent') {
        greetingTitle = `Consistente, ${firstName}`;
        greetingSub = 'Otimo ritmo, cada minuto focado conta.';
    } else if (greetingState === 'start') {
        greetingTitle = `Hora de focar, ${firstName}`;
        greetingSub = 'Inicie uma sessao de foco para registrar seu dia.';
    }
    
    const titleEl = document.getElementById('statsGreetingTitle');
    const subEl = document.getElementById('statsGreetingSubtitle');
    if (titleEl) titleEl.innerHTML = greetingTitle;
    if (subEl) subEl.innerHTML = greetingSub;

    // 3. Ofensiva (Streak) & Max Streak
    const { currentStreak, maxStreak } = getFocusStreakSummaryData();
    if (false) {
    const now = new Date();
    let currentStreak = 0;
    let checkDate = new Date(now);
    if (!todayHistory.length) checkDate.setDate(checkDate.getDate() - 1);
    
    while(true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (focusHistory.some(h => h.date === dStr && h.durationMinutes > 0)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Calcula max streak iterando sobre datas únicas
    let uniqueDates = [...new Set(focusHistory.filter(h => h.durationMinutes > 0).map(h => h.date))].sort();
    let maxStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) { tempStreak = 1; maxStreak = 1; continue; }
        const currentD = new Date(uniqueDates[i]);
        const prevD = new Date(uniqueDates[i-1]);
        const diffDays = Math.round((currentD - prevD) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 1;
        }
    }
    
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    }

    document.getElementById('statsStreak').innerHTML = `<i class="fas fa-fire glow-icon-primary"></i>${currentStreak} Dias`;
    document.getElementById('statsStreakPercent').textContent = `Melhor: ${maxStreak}`;
    
    // 4. Taxa de Conclusao
    const totalT = tasks.length;
    const compT = tasks.filter(t => t.completed).length;
    let rate = 0;
    
    if (totalT === 0 && focusHistory.length > 0) {
        rate = Math.floor(Math.random() * 20) + 70; // fake task rate
    } else if (totalT > 0) {
        rate = Math.round((compT / totalT) * 100);
    }
    
    document.getElementById('statsCompletion').innerHTML = `${rate}% <span style="font-size:1rem;font-weight:400;color:var(--text-secondary);margin-left:8px;">de foco</span>`;

    // Render dashboard visualizations using selected period
    const period = window._statsPeriod || 'week';
    const filtered = filterHistoryForPeriod(focusHistory, period);
    renderCategoriesChart(filtered);
    renderPeriodBarChart(focusHistory, period);
    renderStatsGoalsSummary(period);
    
    // Bind period selector buttons (once)
    if (!window._statsPeriodBound) {
        window._statsPeriodBound = true;
        document.querySelectorAll('#statsPeriodSelector .stats-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#statsPeriodSelector .stats-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window._statsPeriod = btn.dataset.period;
                const filt = filterHistoryForPeriod(focusHistory, btn.dataset.period);
                renderCategoriesChart(filt);
                renderPeriodBarChart(focusHistory, btn.dataset.period);
                renderStatsGoalsSummary(btn.dataset.period);
            });
        });
        
        document.getElementById('btnRefreshStats')?.addEventListener('click', () => {
            const icon = document.getElementById('refreshIcon');
            if (icon) { icon.classList.add('spin'); setTimeout(() => icon.classList.remove('spin'), 700); }
            const sv = document.getElementById('view-stats');
            if (sv) { sv.classList.remove('stats-anim-in'); void sv.offsetWidth; sv.classList.add('stats-anim-in'); }
            window.compileDashboardData();
        });
    }
};

function filterHistoryByPeriod(history, period) {
    const now = new Date();
    if (period === 'day') {
        const todayStr = now.toISOString().split('T')[0];
        return history.filter(h => h.date === todayStr);
    } else if (period === 'month') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 29); cutoff.setHours(0,0,0,0);
        return history.filter(h => new Date(h.date) >= cutoff);
    } else {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 6); cutoff.setHours(0,0,0,0);
        return history.filter(h => new Date(h.date) >= cutoff);
    }
}

function formatMinsToHours(mins) {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// Chart.js plugin: adds shadow glow to chart elements
const chartShadowPlugin = {
    id: 'shadowGlow',
    beforeDraw: (chart) => {
        const ctx2d = chart.ctx;
        ctx2d.save();
        ctx2d.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx2d.shadowBlur = 18;
        ctx2d.shadowOffsetX = 0;
        ctx2d.shadowOffsetY = 4;
    },
    afterDraw: (chart) => {
        chart.ctx.restore();
    }
};

function renderCategoriesChart(canvasEl, legendEl, allHistory = []) {
    if (Array.isArray(canvasEl) && legendEl === undefined) {
        allHistory = canvasEl;
        canvasEl = null;
        legendEl = null;
    }

    const canvas = canvasEl instanceof HTMLCanvasElement ? canvasEl : document.getElementById('categoriesChart');
    const legend = legendEl ?? document.getElementById('categoriesLegend');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const catMap = {};
    allHistory.forEach(h => {
        catMap[h.category] = (catMap[h.category] || 0) + h.durationMinutes;
    });
    
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const total = data.reduce((a,b) => a+b, 0);
    
    const activeFrame = radialChartFrames.get(canvas);
    if (activeFrame) {
        cancelAnimationFrame(activeFrame);
        radialChartFrames.delete(canvas);
    }
    
    const container = canvas.parentElement;
    const containerW = container.clientWidth || 400;
    const containerH = container.clientHeight || 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = containerW + 'px';
    canvas.style.height = containerH + 'px';
    ctx.scale(dpr, dpr);
    
    const cx = containerW / 2;
    const cy = containerH / 2;
    const maxRadius = Math.min(cx, cy) - 12;
    
    let sortedEntries = labels.map((l, i) => ({ label: l, value: data[i], color: resolveCategoryPalette(l, i) }))
        .sort((a, b) => b.value - a.value);

    if (sortedEntries.length > 4) {
        const topEntries = sortedEntries.slice(0, 4);
        const otherValue = sortedEntries.slice(4).reduce((sum, entry) => sum + entry.value, 0);
        if (otherValue > 0) {
            topEntries.push({
                label: 'Outros',
                value: otherValue,
                color: resolveCategoryPalette('Outros', 5)
            });
        }
        sortedEntries = topEntries;
    }

    sortedEntries = sortedEntries.map((entry, index) => ({
        ...entry,
        color: resolveCategoryPalette(entry.label, index)
    }));

    const ringCount = sortedEntries.length || 1;
    const ringWidth = Math.min(18, Math.max(11, (maxRadius - 18) / ringCount));
    const ringGap = 6;

    if (legend) {
        if (!sortedEntries.length || total === 0) {
            legend.innerHTML = '<div class="stats-legend-empty">Ainda nao ha foco suficiente neste periodo para distribuir por categoria.</div>';
        } else {
            legend.innerHTML = sortedEntries.map(entry => {
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return `
                    <div class="stats-legend-item">
                        <span class="stats-legend-dot" style="color:${entry.color.from}; background:${entry.color.from};"></span>
                        <div class="stats-legend-main">
                            <span class="stats-legend-name">${entry.label}</span>
                            <span class="stats-legend-meta">${pct}% do foco no periodo</span>
                        </div>
                        <span class="stats-legend-value">${formatMinutesToHours(entry.value)}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    let animProgress = 0;
    const animDuration = 900;
    const animStart = performance.now();
    
    function drawFrame(now) {
        animProgress = Math.min(1, (now - animStart) / animDuration);
        const ease = 1 - Math.pow(1 - animProgress, 3);
        
        ctx.clearRect(0, 0, containerW, containerH);
        
        sortedEntries.forEach((entry, i) => {
            const radius = maxRadius - i * (ringWidth + ringGap);
            if (radius <= 10) return;
            const pct = total > 0 ? entry.value / total : 0;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * pct * ease);
            
            // Background track
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = ringWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Colored arc
            if (pct > 0) {
                const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
                grad.addColorStop(0, entry.color.from);
                grad.addColorStop(1, entry.color.to);
                
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.strokeStyle = grad;
                ctx.lineWidth = ringWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        });
        
        if (animProgress < 1) {
            radialChartFrames.set(canvas, requestAnimationFrame(drawFrame));
        }
    }
    
    radialChartFrames.set(canvas, requestAnimationFrame(drawFrame));
}

function drawArrowLabels(ctx, entries, total, cx, cy, maxRadius, ringWidth, ringGap, canvasW, canvasH) {
    const labelX = canvasW * 0.62;
    const usedYPositions = [];
    
    ctx.save();
    entries.forEach((entry, i) => {
        const radius = maxRadius - i * (ringWidth + ringGap);
        if (radius <= 10) return;
        const pct = total > 0 ? entry.value / total : 0;
        if (pct <= 0) return;
        
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * pct);
        const midAngle = (startAngle + endAngle) / 2;
        
        // Arrow starts from the CENTER of the arc ring (not the edge)
        const arrowStartX = cx + Math.cos(midAngle) * radius;
        const arrowStartY = cy + Math.sin(midAngle) * radius;
        
        // Target Y with overlap avoidance (28px minimum spacing)
        let targetY = arrowStartY;
        for (const usedY of usedYPositions) {
            if (Math.abs(targetY - usedY) < 28) {
                targetY = usedY + 28;
            }
        }
        targetY = Math.max(14, Math.min(canvasH - 14, targetY));
        usedYPositions.push(targetY);
        
        const elbowX = cx + Math.cos(midAngle) * (maxRadius + 20);
        
        // Draw arrow line — thicker (2.5px)
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(Math.max(elbowX, labelX - 16), arrowStartY);
        ctx.lineTo(labelX - 8, targetY);
        ctx.strokeStyle = entry.color.from;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Dot at arrow start
        ctx.beginPath();
        ctx.arc(arrowStartX, arrowStartY, 3, 0, Math.PI * 2);
        ctx.fillStyle = entry.color.from;
        ctx.fill();
        
        // Single-line label: "Category  XX% · Xh Xm"
        const pctVal = Math.round(pct * 100);
        ctx.font = '600 11px Inter';
        ctx.fillStyle = entry.color.from;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const nameText = entry.label;
        const nameWidth = ctx.measureText(nameText).width;
        ctx.fillText(nameText, labelX, targetY);
        
        // Percentage + time inline, right after category name
        ctx.font = '500 10px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${pctVal}% · ${formatMinutesToHours(entry.value)}`, labelX + nameWidth + 6, targetY);
    });
    ctx.restore();
}

function renderStatsGoalsSummary(period) {
    if (period) {
        window._statsPeriod = period || 'week';
    }
    return window.FocoZenStatsRuntime?.refresh?.();

    const periodLabel = document.getElementById('statsGoalsPeriodLabel');
    const badgeEl = document.getElementById('statsGoalsStatusBadge');
    const headlineEl = document.getElementById('statsGoalsHeadline');
    const captionEl = document.getElementById('statsGoalsCaption');
    const listEl = document.getElementById('statsGoalsSummaryList');
    if (!badgeEl || !headlineEl || !captionEl || !listEl) return;

    const overview = getGoalOverviewData(period);
    const momentum = getGoalMomentumContent(overview);
    const series = getGoalEvolutionSeriesData(period);

    if (periodLabel) periodLabel.textContent = getPeriodLabel(period);
    badgeEl.textContent = momentum.badge;
    headlineEl.textContent = momentum.headline;
    captionEl.textContent = '';

    if (!overview.summaries.length || !series.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Defina metas na aba Metas para acompanhar a evolução do seu plano por período.</div>';
        return;
    }

    const overallPercent = overview.totalTarget > 0
        ? Math.max(0, Math.round((overview.totalActual / overview.totalTarget) * 100))
        : 0;

    listEl.innerHTML = `
        <div class="goals-rhythm-overview">
            <div class="goals-rhythm-main">
                <div class="goals-rhythm-main-top">
                    <div>
                        <div class="goals-rhythm-kicker">Total do período</div>
                        <div class="goals-rhythm-value">${formatMinutesToHours(overview.totalActual)} <span>de ${formatMinutesToHours(overview.totalTarget)}</span></div>
                        </div>
                    </div>
                    <div class="goals-rhythm-percent">${overallPercent}%</div>
                </div>
                <div class="goals-rhythm-rail">
                    <div class="goals-rhythm-fill" style="width:${Math.min(100, overallPercent)}%"></div>
                </div>
            </div>
        `;
}

function renderGoalsComparisonChart(period) {
    const listEl = document.getElementById('goalsComparisonList');
    if (!listEl) return;

    const overview = getGoalOverviewData(period);
    const titleEl = document.getElementById('goalsChartSubtitle');
    const pillEl = document.getElementById('goalsMomentumPill');
    const momentum = getGoalMomentumContent(overview);

    if (titleEl) titleEl.textContent = `${formatMinutesToHours(overview.totalActual)} entregues de ${formatMinutesToHours(overview.totalTarget)} planejados.`;
    if (pillEl) pillEl.textContent = momentum.badge;

    if (!overview.summaries.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Ainda nao ha metas ativas para comparar neste periodo.</div>';
        return;
    }

    const maxHours = Math.max(
        ...overview.summaries.flatMap(item => [item.targetMinutes / 60, item.actualMinutes / 60]),
        1
    );

    listEl.innerHTML = overview.summaries.map(item => {
        const actualHours = item.actualMinutes / 60;
        const targetHours = item.targetMinutes / 60;
        const actualWidth = Math.min(100, (actualHours / maxHours) * 100);
        const fillWidth = item.actualMinutes > 0 ? Math.max(actualWidth, 6) : 0;
        const targetOffset = Math.min(100, (targetHours / maxHours) * 100);
        const deltaMinutes = item.actualMinutes - item.targetMinutes;
        const deltaText = deltaMinutes === 0
            ? 'Meta atingida'
            : deltaMinutes > 0
                ? `Passou ${formatMinutesToHours(Math.abs(deltaMinutes))}`
                : `Faltam ${formatMinutesToHours(Math.abs(deltaMinutes))}`;
        const percentLabel = `${Math.max(0, item.percent)}%`;
        const actualLabelLeft = fillWidth > 0 ? Math.min(96, fillWidth) : 0;
        const actualAlignClass = fillWidth > 86 ? 'end' : 'after-fill';
        const targetAlignClass = targetOffset < 14 ? 'start' : (targetOffset > 86 ? 'end' : '');
        const actualLabelMarkup = item.actualMinutes > 0
            ? `<span class="goals-track-label actual ${actualAlignClass}" style="left:${actualLabelLeft}%;">Realizado ${formatMinutesToHours(item.actualMinutes)}</span>`
            : '';

        return `
            <div class="goals-comparison-row">
                <div class="goals-comparison-head">
                    <div class="goals-comparison-title-wrap">
                        <div class="goals-comparison-name">${item.category}</div>
                        <span class="goals-comparison-percent">${percentLabel}</span>
                    </div>
                    <span class="goals-comparison-status">${deltaText}</span>
                </div>
                <div class="goals-comparison-track-wrap">
                    <div class="goals-comparison-track">
                        <div class="goals-comparison-fill" style="width:${fillWidth}%; background:${item.palette.from}; color:${item.palette.from};"></div>
                        ${actualLabelMarkup}
                        <div class="goals-comparison-target" style="left:calc(${targetOffset}% - 1px);"></div>
                    </div>
                    <div class="goals-comparison-footer">
                        <span class="goals-track-label target ${targetAlignClass}" style="left:${targetOffset}%;">Meta ${formatMinutesToHours(item.targetMinutes)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGoalsListLegacy() {
    const listEl = document.getElementById('goalsList');
    if (!listEl) return;

    if (!focusGoals.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.</div>';
        return;
    }

    listEl.innerHTML = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const palette = resolveCategoryPalette(goal.category);
            const scheduleLabel = goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias úteis';
            return `
                <div class="goal-item">
                    <div class="goal-item-meta">
                        <div class="goals-compact-meta">
                            <span class="goals-category-dot" style="color:${palette.from}; background:${palette.from};"></span>
                            <span class="goals-category-name">${goal.category}</span>
                        </div>
                        <span class="goal-item-subline">${formatMinutesToHours(goal.dailyMinutes)} por dia - ${scheduleLabel}</span>
                    </div>
                    <div class="goals-progress-wrap">
                        <div class="goals-progress-top">
                            <span>Meta diária</span>
                            <span>${goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex'}</span>
                        </div>
                        <div class="goals-progress-rail">
                            <div class="goals-progress-actual" style="width:100%; background:${palette.from}; color:${palette.from};"></div>
                        </div>
                    </div>
                    <div class="goal-item-actions">
                        <button class="goal-item-btn" type="button" data-action="edit-goal" data-goal-id="${goal.id}" title="Editar meta"><i class="fas fa-pen"></i></button>
                        <button class="goal-item-btn danger" type="button" data-action="delete-goal" data-goal-id="${goal.id}" title="Remover meta"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
}

window.compileGoalsData = function() {
    const period = window._goalsPeriod || 'week';
    const overview = getGoalOverviewData(period);
    const bestLabel = overview.bestCategory
        ? `${overview.bestCategory.category} ${Math.max(0, overview.bestCategory.percent)}%`
        : 'Sem dados';

    document.getElementById('goalsHitRate').textContent = `${overview.hitCount}/${overview.activeCount}`;
    document.getElementById('goalsAverageProgress').textContent = `${Math.max(0, overview.averageProgress)}%`;
    document.getElementById('goalsStreakValue').textContent = `${overview.streak} dias`;
    document.getElementById('goalsBestCategory').textContent = bestLabel;

    renderGoalCategoryOptions();
    renderGoalsComparisonChart(period);
    renderGoalsList();

    if (!window._goalsPeriodBound) {
        window._goalsPeriodBound = true;
        document.querySelectorAll('#goalsPeriodSelector .goals-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#goalsPeriodSelector .goals-period-btn').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                window._goalsPeriod = btn.dataset.period;
                window.compileGoalsData();
            });
        });

        document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.goal-schedule-btn').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('goalScheduleInput').value = btn.dataset.schedule;
            });
        });

        document.getElementById('goalHoursDecrease')?.addEventListener('click', () => {
            const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
            updateGoalHoursDisplay(currentHours - 0.5);
        });

        document.getElementById('goalHoursIncrease')?.addEventListener('click', () => {
            const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
            updateGoalHoursDisplay(currentHours + 0.5);
        });

        document.getElementById('btnSaveGoal')?.addEventListener('click', () => {
            const category = document.getElementById('goalCategorySelect')?.value;
            const dailyHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value);
            const dailyMinutes = Math.round((dailyHours || 0) * 60);
            const schedule = document.getElementById('goalScheduleInput')?.value || 'weekdays';
            const result = saveGoalEntry({ category, dailyMinutes, schedule });
            if (!result.ok) {
                showGlassToast(result.message);
                return;
            }

            resetGoalForm();
            showGlassToast(result.message);
        });

        document.getElementById('btnCancelGoalEdit')?.addEventListener('click', () => {
            resetGoalForm();
        });

        document.getElementById('btnRefreshGoals')?.addEventListener('click', () => {
            const icon = document.getElementById('goalsRefreshIcon');
            if (icon) {
                icon.classList.add('spin');
                setTimeout(() => icon.classList.remove('spin'), 700);
            }
            window.compileGoalsData();
        });
    }
};

window.editGoalItem = function(goalId) {
    openGoalEditModal(goalId);
};

window.deleteGoalItem = function(goalId) {
    if (document.getElementById('react-goals-root')) {
        return window.FocoZenGoalsRuntime?.deleteGoal?.(goalId);
    }

    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    customConfirm(
        'Excluir Meta',
        `Deseja excluir a meta da categoria "${goal.category}"?`,
        () => {
            focusGoals = focusGoals.filter(item => item.id !== goalId);
            saveFocusGoals();
            if (editingGoalId === goalId) resetGoalForm();
            renderStatsGoalsSummary(window._statsPeriod || 'week');
            window.compileGoalsData();
            showGlassToast('Meta removida');
        }
    );
};

function renderGoalsList() {
    const listEl = document.getElementById('goalsList');
    if (!listEl) return;

    if (!focusGoals.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.</div>';
        return;
    }

    listEl.innerHTML = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const palette = resolveCategoryPalette(goal.category);
            const scheduleLabel = goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias uteis';
            const dailyHours = ((Number(goal.dailyMinutes) || 0) / 60).toFixed(1).replace('.0', '').replace('.', ',');
            return `
                <div class="goal-item">
                    <div class="goal-item-meta">
                        <div class="goals-compact-meta">
                            <span class="goals-category-dot" style="color:${palette.from}; background:${palette.from};"></span>
                            <span class="goals-category-name">${goal.category}</span>
                        </div>
                        <span class="goal-item-subline">${dailyHours}h por dia - ${scheduleLabel}</span>
                    </div>
                    <div class="goals-progress-wrap">
                        <div class="goals-progress-top">
                            <span>Meta diaria</span>
                            <span>${goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex'}</span>
                        </div>
                        <div class="goals-progress-rail">
                            <div class="goals-progress-actual" style="width:100%; background:${palette.from}; color:${palette.from};"></div>
                        </div>
                    </div>
                    <div class="goal-item-actions">
                        <button class="goal-item-btn" type="button" onclick="window.editGoalItem(${goal.id})" title="Editar meta"><i class="fas fa-pen"></i></button>
                        <button class="goal-item-btn danger" type="button" onclick="window.deleteGoalItem(${goal.id})" title="Remover meta"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
}

renderStatsGoalsSummary = function(period) {
    if (period) {
        window._statsPeriod = period || 'week';
    }
    return window.FocoZenStatsRuntime?.refresh?.();
};

renderGoalsComparisonChart = function(period) {
    if (period) window.FocoZenGoalsRuntime?.setGoalsPeriod?.(period);
    return window.FocoZenGoalsRuntime?.refresh?.();
};

renderGoalsList = function() {
    return window.FocoZenGoalsRuntime?.refresh?.();
};

window.compileGoalsData = function() {
    return window.FocoZenGoalsRuntime?.refresh?.();
};

function getAccentColor() {
    // Read the CSS variable live so bars always match the user's current theme
    return getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#f97316';
}

function renderPeriodBarChart(canvasEl, allHistory = [], period = 'week') {
    if (!(canvasEl instanceof HTMLCanvasElement)) {
        period = typeof allHistory === 'string' ? allHistory : period;
        allHistory = Array.isArray(canvasEl) ? canvasEl : [];
        canvasEl = null;
    }

    const ctx = canvasEl instanceof HTMLCanvasElement ? canvasEl : document.getElementById('weekChart');
    if (!ctx) return;
    
    // Dynamic title based on period
    const barPanel = ctx.closest('.bento-panel');
    const titleEl = barPanel ? barPanel.querySelector('.bento-panel-title') : null;
    if (titleEl) {
        const titles = { 'week': 'CONSIST\u00caNCIA SEMANAL', 'day': 'CONSIST\u00caNCIA DI\u00c1RIA', 'month': 'CONSIST\u00caNCIA MENSAL' };
        titleEl.textContent = titles[period] || titles['week'];
    }
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const labels = [];
    const data = [];
    const dataMins = [];
    const now = new Date();
    const accent = getAccentColor();
    
    if (period === 'day') {
        // 24h view
        for (let h = 0; h < 24; h++) {
            labels.push(`${String(h).padStart(2,'0')}h`);
            const todayStr = now.toISOString().split('T')[0];
            const mins = allHistory
                .filter(x => x.date === todayStr)
                .reduce((acc, x) => {
                    const xH = new Date(x.id).getHours();
                    return acc + (xH === h ? x.durationMinutes : 0);
                }, 0);
            data.push(Math.round((mins / 60) * 100) / 100);
            dataMins.push(mins);
        }
    } else if (period === 'month') {
        // Last 30 days aggregated by week
        const weekLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const weekMins = [0, 0, 0, 0];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const weekIdx = Math.floor((29 - i) / 7);
            const mins = allHistory.filter(h => h.date === dStr).reduce((acc, h) => acc + h.durationMinutes, 0);
            if (weekIdx < 4) weekMins[weekIdx] += mins;
        }
        weekLabels.forEach((l, i) => { labels.push(l); data.push(Math.round((weekMins[i]/60)*10)/10); dataMins.push(weekMins[i]); });
    } else {
        // Default: 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(dayNames[d.getDay()]);
            const dStr = d.toISOString().split('T')[0];
            const mins = allHistory.filter(h => h.date === dStr).reduce((acc, h) => acc + h.durationMinutes, 0);
            data.push(Math.round((mins / 60) * 10) / 10);
            dataMins.push(mins);
        }
    }

    const previousChart = periodChartInstances.get(ctx);
    if (previousChart) previousChart.destroy();
    
    const nextChart = new Chart(ctx, {
        type: 'bar',
        plugins: [chartShadowPlugin],
        data: {
            labels: labels,
            datasets: [{
                label: 'Foco',
                data: data,
                backgroundColor: `${accent}99`,
                hoverBackgroundColor: `${accent}dd`,
                borderRadius: 8,
                borderSkipped: false,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 11 }, callback: v => v > 0 ? `${v}h` : '' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 11 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10,18,40,0.95)',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.7)',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx) => {
                            const mins = dataMins[ctx.dataIndex];
                            return `  ${formatMinsToHours(mins)} de foco`;
                        }
                    }
                }
            }
        }
    });
    periodChartInstances.set(ctx, nextChart);
}

function renderTimeline(allHistory) {
    const container = document.getElementById('focusTimeline');
    const tooltip = document.getElementById('timelineTooltip');
    const summaryEl = document.getElementById('timelineSummary');
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todaySessions = allHistory.filter(h => h.date === todayStr);

    // Category colors
    const catColors = {
        'Trabalho': '#6366f1',
        'Estudos': '#22c55e',
        'Hobbies': '#f59e0b',
        'Projetos': '#ec4899',
        'Outros': '#64748b'
    };

    // Summary
    if (summaryEl) {
        const totalMins = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        summaryEl.textContent = todaySessions.length > 0
            ? `${todaySessions.length} sessoes · ${formatMinsToHours(totalMins)} hoje`
            : 'Nenhuma sessao hoje';
    }

    // Hour markers background (0-23)
    const hoursContainer = document.createElement('div');
    hoursContainer.className = 'timeline-hours';
    for (let h = 0; h < 24; h++) {
        const mark = document.createElement('div');
        mark.className = 'timeline-hour-mark';
        // Show label every 3 hours
        if (h % 3 === 0) {
            const label = document.createElement('span');
            label.className = 'timeline-hour-label';
            label.textContent = `${h}h`;
            mark.appendChild(label);
        }
        hoursContainer.appendChild(mark);
    }
    container.appendChild(hoursContainer);

    // Session blocks
    todaySessions.forEach(session => {
        const sessionDate = new Date(session.id);
        const startHour = sessionDate.getHours() + sessionDate.getMinutes() / 60;
        const durationH = session.durationMinutes / 60;

        const leftPct = (startHour / 24) * 100;
        const widthPct = Math.max(0.4, (durationH / 24) * 100); // min 0.4% for visibility

        const block = document.createElement('div');
        block.className = 'timeline-session';
        const color = catColors[session.category] || catColors['Outros'];
        block.style.cssText = `left:${leftPct}%;width:${widthPct}%;background:${color};box-shadow:0 0 6px ${color}44;`;

        // Tooltip
        const startTime = `${String(sessionDate.getHours()).padStart(2,'0')}:${String(sessionDate.getMinutes()).padStart(2,'0')}`;
        const endDate = new Date(sessionDate.getTime() + session.durationMinutes * 60000);
        const endTime = `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`;

        block.addEventListener('mouseenter', () => {
            if (!tooltip) return;
            tooltip.innerHTML = `<strong style="color:${color}">${session.category || 'Foco'}</strong><br>${startTime} — ${endTime} · ${session.durationMinutes}min`;
            tooltip.style.display = 'block';
            const rect = block.getBoundingClientRect();
            const parentRect = container.closest('.bento-panel').getBoundingClientRect();
            tooltip.style.left = (rect.left - parentRect.left + rect.width / 2 - 40) + 'px';
            tooltip.style.top = (rect.top - parentRect.top - 46) + 'px';
        });
        block.addEventListener('mouseleave', () => {
            if (tooltip) tooltip.style.display = 'none';
        });

        container.appendChild(block);
    });

    // "Now" marker
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const nowPct = (nowHour / 24) * 100;
    const nowMarker = document.createElement('div');
    nowMarker.className = 'timeline-now';
    nowMarker.style.left = `${nowPct}%`;
    container.appendChild(nowMarker);
}

// ==========================================
// MINI PLAYER SOUND SWITCHER CAROUSEL
// ==========================================
function buildSoundCarousel(carouselEl) {
    if (!carouselEl || carouselEl.dataset.built) return;
    carouselEl.dataset.built = 'true';
    carouselEl.innerHTML = '';
    soundsConfig.forEach(sound => {
        const chip = document.createElement('div');
        chip.className = `carousel-sound-chip ${currentSoundId === sound.id ? 'active' : ''}`;
        chip.dataset.soundId = sound.id;
        chip.innerHTML = `<i class="fas ${sound.icon}"></i> ${sound.name}`;
        chip.addEventListener('click', () => {
            selectSound(sound);
            // Update all carousels
            document.querySelectorAll('.carousel-sound-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.soundId === sound.id);
            });
        });
        carouselEl.appendChild(chip);
    });
}

function toggleSoundCarousel(carouselId, btnId) {
    const carousel = document.getElementById(carouselId);
    const btn = document.getElementById(btnId);
    if (!carousel) return;
    buildSoundCarousel(carousel);
    const isOpen = carousel.classList.contains('open');
    carousel.classList.toggle('open', !isOpen);
    if (btn) btn.classList.toggle('active', !isOpen);
}

// Bind sound switcher buttons (idempotent)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('miniSoundSwitchBtn')?.addEventListener('click', () => {
            toggleSoundCarousel('miniSoundCarousel', 'miniSoundSwitchBtn');
        });
        document.getElementById('settingsSoundSwitchBtn')?.addEventListener('click', () => {
            toggleSoundCarousel('settingsSoundCarousel', 'settingsSoundSwitchBtn');
        });
    }, 500);
    
    // Setup update listeners
    setupUpdateListeners();
});

// ========== UPDATE SYSTEM ==========
function setupUpdateListeners() {
    if (!updateService?.isAvailable || !updateService.isAvailable()) {
        console.warn('electronAPI nao disponivel - sistema de atualizacao desabilitado');
        return;
    }
    
    // Listen for update downloaded
    if (updateService?.onDownloaded) {
        updateService.onDownloaded((info) => {
            console.log('Atualizacao baixada:', info);
            document.getElementById('updateDownloadBanner')?.remove();
            document.getElementById('updateInlineProgress')?.remove();
            if (window._manualUpdateTriggered) {
                // Auto-install silently after manual check
                window._manualUpdateTriggered = false;
                if (storageService?.writeStorageValue) {
                    storageService.writeStorageValue(storageKeys.UPDATED_VERSION, info.version);
                    storageService.writeStorageValue(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
                } else {
                    localStorage.setItem(storageKeys.UPDATED_VERSION, info.version);
                    localStorage.setItem(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
                }
                const btn = document.getElementById('btnCheckUpdates');
                if (btn) btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Instalando...';
                setTimeout(() => { updateService?.installUpdate?.(); }, 800);
            } else {
                showUpdateNotification(info);
            }
        });
    }

    // Show download progress banner
    if (updateService?.onDownloadProgress) {
        updateService.onDownloadProgress((pct) => {
            let banner = document.getElementById('updateDownloadBanner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'updateDownloadBanner';
                banner.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99998;background:rgba(15,23,42,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px 20px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
                banner.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <i class="fas fa-download" style="color:var(--accent-primary);"></i>
                        <span style="font-weight:600;font-size:0.9rem;">Baixando atualizacao...</span>
                        <span id="updateDownloadPct" style="margin-left:auto;font-size:0.85rem;color:var(--text-secondary);">0%</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:99px;height:4px;overflow:hidden;">
                        <div id="updateDownloadBar" style="height:100%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));width:0%;transition:width 0.3s ease;border-radius:99px;"></div>
                    </div>`;
                document.body.appendChild(banner);
            }
            document.getElementById('updateDownloadPct').textContent = pct + '%';
            document.getElementById('updateDownloadBar').style.width = pct + '%';
            const inlinePctEl = document.getElementById('inlineDownloadPct');
            const inlineBarEl = document.getElementById('inlineDownloadBar');
            if (inlinePctEl) inlinePctEl.textContent = pct + '%';
            if (inlineBarEl) inlineBarEl.style.width = pct + '%';
        });
    }
    
    // Listen for manual update check results
    if (updateService?.onCheckResult) {
        updateService.onCheckResult((result) => {
            console.log('Resultado da verificacao de atualizacao:', result);
            handleUpdateCheckResult(result);
        });
    }
    
    // Check if app was just updated (show changelog)
    checkForChangelog();

    // Init Sobre section
    initSobreSection();
}

function showUpdateNotification(info) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '99999';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="max-width: 480px; text-align: center;">
            <div class="elegant-icon" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); width: 70px; height: 70px; margin: 0 auto 20px;">
                <i class="fas fa-download" style="font-size: 2rem;"></i>
            </div>
            <h2 class="elegant-title" style="font-size: 1.6rem; margin-bottom: 12px;">Nova Versao Disponivel!</h2>
            <p class="elegant-message" style="font-size: 1.1rem; margin-bottom: 8px;">Versao <strong>${info.version}</strong> foi baixada</p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; max-height: 200px; overflow-y: auto;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">
                    <i class="fas fa-list-ul"></i> O QUE HÁ DE NOVO
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                    ${formatReleaseNotes(info.releaseNotes)}
                </div>
            </div>
            <div class="elegant-actions" style="gap: 12px;">
                <button class="btn-modal secondary btn-update-later" style="flex: 1;">Mais Tarde</button>
                <button class="btn-modal primary btn-update-now" style="flex: 1; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
                    <i class="fas fa-sync-alt"></i> Reiniciar Agora
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.classList.add('active');
    overlay.querySelector('.btn-update-now').addEventListener('click', () => {
        // Save flag to show changelog after restart
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.UPDATED_VERSION, info.version);
            storageService.writeStorageValue(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
        } else {
            localStorage.setItem(storageKeys.UPDATED_VERSION, info.version);
            localStorage.setItem(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
        }
        updateService?.installUpdate?.();
    });
    
    overlay.querySelector('.btn-update-later').addEventListener('click', () => {
        overlay.remove();
    });
}

function formatReleaseNotes(notes) {
    if (!notes || notes === 'Melhorias de desempenho e correções de bugs.') {
        return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>Melhorias de desempenho</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>Correções de bugs</span>
            </div>
        `;
    }
    
    // Parse markdown-style list or plain text
    const lines = notes.split('\n').filter(l => l.trim());
    return lines.map(line => {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>${cleaned}</span>
            </div>
        `;
    }).join('');
}

async function checkForChangelog() {
    const updatedVersion = storageService?.readStorageValue
        ? storageService.readStorageValue(storageKeys.UPDATED_VERSION, null)
        : localStorage.getItem(storageKeys.UPDATED_VERSION);
    
    if (updatedVersion) {
        // Clear one-time flags immediately
        if (storageService?.removeStorageValue) {
            storageService.removeStorageValue(storageKeys.UPDATED_VERSION);
            storageService.removeStorageValue(storageKeys.CHANGELOG);
        } else {
            localStorage.removeItem(storageKeys.UPDATED_VERSION);
            localStorage.removeItem(storageKeys.CHANGELOG);
        }

        // Read changelog from NEW app's CHANGELOG.md (after restart)
        let changelog = 'Melhorias de desempenho e correções de bugs.';
        if (updateService?.getChangelogForVersion) {
            try {
                changelog = await updateService.getChangelogForVersion(updatedVersion);
            } catch(e) {
                console.error('Erro ao ler changelog para versao:', e);
            }
        }

        // Save permanent copy for Sobre section
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.LAST_VERSION, updatedVersion);
            storageService.writeStorageValue(storageKeys.LAST_CHANGELOG, changelog);
        } else {
            localStorage.setItem(storageKeys.LAST_VERSION, updatedVersion);
            localStorage.setItem(storageKeys.LAST_CHANGELOG, changelog);
        }
        
        // Show changelog modal after app settles
        setTimeout(() => {
            showChangelogModal(updatedVersion, changelog);
        }, 1500);
    }
}

function showChangelogModal(version, notes) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '99999';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="max-width: 500px; text-align: center;">
            <div class="elegant-icon" style="background: linear-gradient(135deg, #10b981, #059669); width: 70px; height: 70px; margin: 0 auto 20px;">
                <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
            </div>
            <h2 class="elegant-title" style="font-size: 1.7rem; margin-bottom: 12px;">Atualizacao Concluida!</h2>
            <p class="elegant-message" style="font-size: 1rem; margin-bottom: 8px;">Agora voce esta usando a versao <strong>${version}</strong></p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; max-height: 250px; overflow-y: auto;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 700;">
                    <i class="fas fa-sparkles"></i> NOVIDADES DESTA VERSoO
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                    ${formatReleaseNotes(notes)}
                </div>
            </div>
            <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove()" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669);">
                <i class="fas fa-rocket"></i> Vamos Lá!
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

async function initSobreSection() {
    let version = '—';
    if (updateService?.getAppVersion) {
        version = await updateService.getAppVersion();
    }

    const versionEl = document.getElementById('sobreVersionNumber');
    if (versionEl) versionEl.textContent = version;

    const sobreChangelogEl = document.getElementById('sobreChangelogContent');
    const sobreVersionLabel = document.getElementById('sobreLastVersionLabel');

    if (sobreChangelogEl) {
        // Load full changelog from CHANGELOG.md
        if (updateService?.getFullChangelog) {
            try {
                const fullChangelog = await updateService.getFullChangelog();
                if (sobreVersionLabel) sobreVersionLabel.textContent = 'Histórico Completo de Versões';
                sobreChangelogEl.innerHTML = formatFullChangelog(fullChangelog);
            } catch (err) {
                console.error('Erro ao carregar changelog:', err);
                sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Erro ao carregar histórico de versões.</span>';
            }
        } else {
            sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Historico de versoes nao disponivel.</span>';
        }
    }
}

function formatFullChangelog(markdown) {
    if (!markdown || markdown.trim() === '') {
        return '<span style="color:var(--text-secondary);font-size:0.9rem;">Nenhum changelog disponível.</span>';
    }
    
    // Convert markdown to HTML with proper styling
    let html = markdown
        // Version headers (## [1.0.8] - 2026-03-31)
        .replace(/^## \[([^\]]+)\] - (.+)$/gm, '<div style="margin-top:24px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);"><span style="font-size:1.1rem;font-weight:700;color:var(--accent-primary);">v$1</span><span style="margin-left:10px;font-size:0.85rem;color:var(--text-secondary);">$2</span></div>')
        // Category headers (### Adicionado, ### Corrigido, etc)
        .replace(/^### (.+)$/gm, '<div style="margin-top:16px;margin-bottom:8px;font-size:0.75rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-chevron-right" style="font-size:0.6rem;margin-right:6px;"></i>$1</div>')
        // Sub-category headers (#### Sistema de Foco)
        .replace(/^#### (.+)$/gm, '<div style="margin-top:14px;margin-bottom:8px;font-size:0.9rem;font-weight:600;color:white;">$1</div>')
        // Bullet points
        .replace(/^- (.+)$/gm, '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;padding-left:12px;"><i class="fas fa-check" style="color:var(--accent-primary);font-size:0.7rem;margin-top:4px;flex-shrink:0;"></i><span style="font-size:0.9rem;line-height:1.6;">$1</span></div>')
        // Nested bullet points (with 2 spaces indent)
        .replace(/^  - (.+)$/gm, '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;padding-left:32px;"><i class="fas fa-circle" style="color:var(--accent-primary);font-size:0.4rem;margin-top:6px;flex-shrink:0;"></i><span style="font-size:0.85rem;line-height:1.5;color:var(--text-secondary);">$1</span></div>');
    
    return html;
}

function handleUpdateCheckResult(result) {
    const btn = document.getElementById('btnCheckUpdates');
    const status = document.getElementById('updateCheckStatus');

    if (result.available) {
        // Show inline download progress in the updates section
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Baixando...';
        const section = btn?.closest('section');
        if (section && !document.getElementById('updateInlineProgress')) {
            const prog = document.createElement('div');
            prog.id = 'updateInlineProgress';
            prog.style.cssText = 'margin-top:16px;';
            prog.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:var(--text-secondary);">
                    <span><i class="fas fa-download" style="color:var(--accent-primary);margin-right:6px;"></i>Baixando v${result.version}...</span>
                    <span id="inlineDownloadPct">0%</span>
                </div>
                <div style="background:rgba(255,255,255,0.1);border-radius:99px;height:5px;overflow:hidden;">
                    <div id="inlineDownloadBar" style="height:100%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));width:0%;transition:width 0.3s ease;border-radius:99px;"></div>
                </div>`;
            section.appendChild(prog);
        }
        return;
    }

    // Not available — reset button and show modal
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Verificar Atualizações'; }
    if (status) status.style.display = 'none';
    window._manualUpdateTriggered = false;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '99999';
    
    if (false) {
        // placeholder - result.available is always false here
    } else {
        overlay.innerHTML = `
            <div class="modal-content-small elegant-popup" style="text-align: center;">
                <div class="elegant-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="elegant-title">Tudo Atualizado!</h2>
                <p class="elegant-message">${result.message || 'Voce ja esta na versao mais recente.'}</p>
                <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove()" style="background: linear-gradient(135deg, #10b981, #059669); display: block; margin: 0 auto;">Fechar</button>
            </div>
        `;
    }
    
    document.body.appendChild(overlay);
}

// ==========================================
// ASSISTENTE GLOBAL
// ==========================================
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

function buildAssistantOpenInsight() {
    if (currentTask && currentMode === 'focus') {
        return `Agora, eu manteria o foco em ${currentTask.category || 'Livre'} para fechar a tarefa "${currentTask.name}".`;
    }

    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    if (lagging) {
        return `Agora, o ponto que mais pede atencao e ${lagging.category}. Faltam ${formatMinsToHours(lagging.remainingMinutes)} para fechar essa meta neste recorte.`;
    }

    const overview = getAssistantGoalOverview(getAssistantDefaultPeriod(), false);
    if (overview.activeCount) {
        return `Agora, seu plano esta em ${overview.averageProgress}% do combinado. Posso te ajudar a decidir a proxima sessao.`;
    }

    return 'Agora, posso te ajudar a criar metas, iniciar foco, montar tarefas e resumir o que esta acontecendo no app.';
}

function getHistoryTotalsByCategory(period, previous = false) {
    const totals = {};
    filterHistoryByAssistantPeriod(period, previous).forEach(entry => {
        const category = entry.category || 'Livre';
        totals[category] = (totals[category] || 0) + (Number(entry.durationMinutes) || 0);
    });

    return Object.entries(totals)
        .map(([category, minutes]) => ({ category, minutes }))
        .sort((a, b) => b.minutes - a.minutes);
}

function getHistoryPeriodRange(period, previous = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    if (period === 'day') {
        if (previous) {
            start.setDate(start.getDate() - 1);
            end = new Date(start);
        }
        return { start, end };
    }

    const span = period === 'month' ? 30 : 7;
    start.setDate(start.getDate() - (span - 1));
    if (previous) {
        end = new Date(start);
        end.setDate(end.getDate() - 1);
        start = new Date(end);
        start.setDate(start.getDate() - (span - 1));
    }

    return { start, end: previous ? end : new Date(today) };
}

function filterHistoryBetween(start, end) {
    return focusHistory.filter(entry => {
        const date = new Date(`${entry.date}T00:00:00`);
        return date >= start && date <= end;
    });
}

function getAssistantDateRange(period, previous = false) {
    return getHistoryPeriodRange(period, previous);
}

function enumerateDatesBetween(start, end) {
    const dates = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

function filterHistoryByAssistantPeriod(period, previous = false) {
    const range = getAssistantDateRange(period, previous);
    return filterHistoryBetween(range.start, range.end);
}

function getTotalFocusForPeriod(period, category = null, previous = false) {
    const categoryKey = category ? normalizeAssistantText(category) : null;
    return filterHistoryByAssistantPeriod(period, previous)
        .filter(entry => !categoryKey || normalizeAssistantText(entry.category || 'Livre') === categoryKey)
        .reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
}

function getSessionsCountForPeriod(period, category = null, previous = false) {
    const categoryKey = category ? normalizeAssistantText(category) : null;
    return filterHistoryByAssistantPeriod(period, previous)
        .filter(entry => !categoryKey || normalizeAssistantText(entry.category || 'Livre') === categoryKey)
        .length;
}

function getAssistantGoalSummaries(period, previous = false) {
    const activeGoals = getActiveGoalsData();
    const range = getAssistantDateRange(period, previous);
    const dates = enumerateDatesBetween(range.start, range.end);
    const actualByCategory = {};

    filterHistoryByAssistantPeriod(period, previous).forEach(entry => {
        const category = entry.category || 'Livre';
        actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry.durationMinutes) || 0);
    });

    return activeGoals.map((goal, index) => {
        const targetMinutes = dates.reduce((sum, date) => {
            return sum + (isGoalApplicableOnDate(goal, date) ? Number(goal.dailyMinutes) || 0 : 0);
        }, 0);
        const actualMinutes = actualByCategory[goal.category] || 0;
        const percent = targetMinutes > 0 ? Math.round((actualMinutes / targetMinutes) * 100) : 0;
        return {
            ...goal,
            index,
            targetMinutes,
            actualMinutes,
            remainingMinutes: Math.max(0, targetMinutes - actualMinutes),
            percent,
            palette: resolveCategoryPalette(goal.category, index)
        };
    }).sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        return b.actualMinutes - a.actualMinutes;
    });
}

function getAssistantGoalOverview(period, previous = false) {
    const summaries = getAssistantGoalSummaries(period, previous);
    const activeCount = summaries.length;
    const hitCount = summaries.filter(item => item.actualMinutes >= item.targetMinutes && item.targetMinutes > 0).length;
    const totalTarget = summaries.reduce((sum, item) => sum + item.targetMinutes, 0);
    const totalActual = summaries.reduce((sum, item) => sum + item.actualMinutes, 0);
    const averageProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const bestCategory = summaries.length ? summaries.reduce((best, item) => {
        if (!best) return item;
        if (item.percent !== best.percent) return item.percent > best.percent ? item : best;
        return item.actualMinutes > best.actualMinutes ? item : best;
    }, null) : null;

    return {
        summaries,
        activeCount,
        hitCount,
        totalTarget,
        totalActual,
        averageProgress,
        bestCategory,
        streak: getGoalStreak()
    };
}

function getAssistantTaskSummary() {
    const openTasks = tasks.filter(task => !task.completed);
    const doneTasks = tasks.filter(task => task.completed);
    const currentTaskName = currentTask?.name || null;

    if (!tasks.length) {
        return 'Você ainda não tem tarefas criadas no app.';
    }

    const lines = [
        `${openTasks.length} tarefa(s) em aberto e ${doneTasks.length} concluída(s).`
    ];

    if (currentTaskName) {
        lines.push(`Tarefa atual: ${currentTaskName}.`);
    } else {
        lines.push('No momento você está em Sessão Livre.');
    }

    return lines.join('\n');
}

function findAssistantTaskByText(text) {
    const normalized = normalizeAssistantText(text);
    const activeTasks = tasks.filter(task => !task.completed);
    if (!activeTasks.length) return null;

    const explicitPrefixes = [
        'iniciar tarefa',
        'inicie a tarefa',
        'comecar tarefa',
        'comece a tarefa',
        'abrir tarefa',
        'abra a tarefa',
        'selecionar tarefa',
        'seleciona a tarefa',
        'iniciar',
        'inicie',
        'comecar',
        'comece',
        'abrir',
        'abra'
    ];

    let remainder = normalized;
    for (const prefix of explicitPrefixes) {
        if (normalized.startsWith(prefix)) {
            remainder = normalized.slice(prefix.length).trim();
            break;
        }
    }

    const scored = activeTasks.map(task => {
        const nameNorm = normalizeAssistantText(task.name);
        let score = 0;
        if (remainder && nameNorm === remainder) score += 100;
        if (remainder && nameNorm.includes(remainder)) score += 70;
        if (remainder && remainder.includes(nameNorm)) score += 55;
        if (normalized.includes(nameNorm)) score += 40;
        return { task, score };
    }).sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].task : null;
}

function formatAssistantGoalStatus(goalSummary) {
    if (!goalSummary) return '';
    const delta = goalSummary.actualMinutes - goalSummary.targetMinutes;
    if (goalSummary.targetMinutes <= 0) return 'Sem meta aplicável neste período.';
    if (delta >= 0) return `Meta batida com ${formatMinsToHours(delta)} de folga.`;
    return `Faltam ${formatMinsToHours(Math.abs(delta))} para bater a meta.`;
}

function getFocusNowSuggestion() {
    const overview = getGoalOverviewData(getAssistantDefaultPeriod());
    if (!overview.activeCount) {
        if (currentTask) {
            return `Sua melhor aposta agora é continuar em ${currentTask.category || 'Livre'} e fechar a tarefa "${currentTask.name}".`;
        }
        return 'Você ainda não tem metas ativas. Eu começaria pela categoria mais importante do dia e criaria uma meta simples para ganhar consistência.';
    }

    const candidate = overview.summaries
        .filter(item => item.remainingMinutes > 0)
        .sort((a, b) => {
            if (b.remainingMinutes !== a.remainingMinutes) return b.remainingMinutes - a.remainingMinutes;
            return a.percent - b.percent;
        })[0];

    if (!candidate) {
        return 'Você já bateu as metas ativas deste período. Se quiser, dá para usar o próximo bloco em uma categoria livre ou revisar uma tarefa importante.';
    }

    return `Eu priorizaria ${candidate.category}. Faltam ${formatMinsToHours(candidate.remainingMinutes)} para fechar a meta ${getPeriodNarration(getAssistantDefaultPeriod())}.`;
}

function expandAssistantFollowUp(text) {
    const normalized = normalizeAssistantText(text);
    if (!assistantConversationState) return text;

    const looksLikeFollowUp =
        normalized.startsWith('e ') ||
        normalized.startsWith('e em ') ||
        normalized.startsWith('e no ') ||
        normalized.startsWith('e na ') ||
        normalized.startsWith('e pra ') ||
        normalized.startsWith('e para ');

    if (!looksLikeFollowUp) return text;

    const temporal = detectAssistantTemporalContext(text, {
        period: assistantConversationState.period || getAssistantDefaultPeriod(),
        previous: assistantConversationState.previous || false
    });

    const category = detectAssistantCategory(text) || assistantConversationState.category || null;
    let intent = assistantConversationState.intent || 'summary';

    if (intent === 'top_category' && category) intent = 'focus_total';
    if (category && ['summary', 'planned_vs_actual', 'goal_hits', 'lagging_goal', 'trend'].includes(intent)) {
        intent = 'category_status';
    }

    const phrase = getPeriodPromptPhrase(temporal.period, temporal.previous);

    switch (intent) {
        case 'focus_total':
            return `quanto foquei ${category ? `em ${category} ` : ''}${phrase}`.trim();
        case 'category_status':
            return `como estou em ${category || 'Estudos'} ${phrase}`.trim();
        case 'top_category':
            return `qual categoria recebeu mais foco ${phrase}`.trim();
        case 'goal_hits':
            return `quais metas bati ${phrase}`.trim();
        case 'planned_vs_actual':
            return `como esta meu plano ${phrase}`.trim();
        case 'lagging_goal':
            return `qual meta esta mais atrasada ${phrase}`.trim();
        case 'summary':
            return `resuma meu desempenho ${phrase}`.trim();
        case 'trend':
            return `estou melhorando ${phrase}`.trim();
        case 'pomodoros':
            return `quantos pomodoros ${phrase}`.trim();
        default:
            return text;
    }
}

function getLaggingGoalSummary(period, previous = false) {
    const summaries = getAssistantGoalSummaries(period, previous)
        .filter(item => item.targetMinutes > 0 && item.remainingMinutes > 0)
        .sort((a, b) => {
            if (b.remainingMinutes !== a.remainingMinutes) return b.remainingMinutes - a.remainingMinutes;
            return a.percent - b.percent;
        });

    return summaries[0] || null;
}

function getCategoriesWithoutGoals() {
    const goalKeys = new Set(getActiveGoalsData().map(goal => normalizeAssistantText(goal.category)));
    return getAllAssistantCategories()
        .filter(category => normalizeAssistantText(category) !== normalizeAssistantText('Livre'))
        .filter(category => !goalKeys.has(normalizeAssistantText(category)));
}

function getCategoryRecentStats(category, days = 21) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const key = normalizeAssistantText(category);

    const entries = focusHistory.filter(entry => {
        const entryDate = new Date(`${entry.date}T00:00:00`);
        return entryDate >= start && entryDate <= today && normalizeAssistantText(entry.category || 'Livre') === key;
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const activeDaysSet = new Set(entries.map(entry => entry.date));
    const activeDays = activeDaysSet.size;
    const averagePerDay = days > 0 ? totalMinutes / days : 0;
    const averagePerActiveDay = activeDays > 0 ? totalMinutes / activeDays : 0;

    return {
        totalMinutes,
        activeDays,
        averagePerDay,
        averagePerActiveDay,
        days
    };
}

function assessGoalRealism(goal) {
    if (!goal) return null;
    const recent = getCategoryRecentStats(goal.category, 21);
    const targetDaily = Number(goal.dailyMinutes) || 0;
    const baseline = recent.averagePerDay;

    if (baseline <= 0) {
        return {
            tone: 'unknown',
            message: `Ainda não existe histórico suficiente em ${goal.category} para eu dizer se essa meta está realista com segurança.`
        };
    }

    const ratio = targetDaily / baseline;
    if (ratio >= 1.45) {
        return {
            tone: 'aggressive',
            message: `Hoje essa meta está bem agressiva. Seu ritmo recente em ${goal.category} gira em torno de ${formatMinsToHours(Math.round(baseline))} por dia, enquanto a meta pede ${formatMinsToHours(targetDaily)}.`
        };
    }

    if (ratio <= 0.7) {
        return {
            tone: 'conservative',
            message: `Essa meta parece conservadora. Seu ritmo recente em ${goal.category} está perto de ${formatMinsToHours(Math.round(baseline))} por dia, acima da meta atual de ${formatMinsToHours(targetDaily)}.`
        };
    }

    return {
        tone: 'balanced',
        message: `Ela parece realista. Seu ritmo recente em ${goal.category} está por volta de ${formatMinsToHours(Math.round(baseline))} por dia, bem perto da meta atual de ${formatMinsToHours(targetDaily)}.`
    };
}

function removeAllGoalsFromAssistant() {
    if (!focusGoals.length) {
        return {
            content: 'Você não tem metas ativas para apagar.',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    customConfirm(
        'Excluir todas as metas',
        `Isso vai remover ${focusGoals.length} meta(s) ativa(s). Deseja continuar?`,
        () => {
            focusGoals = [];
            saveFocusGoals();
            resetGoalForm();
            renderStatsGoalsSummary(window._statsPeriod || 'day');
            window.compileGoalsData?.();
            showGlassToast('Todas as metas foram removidas');
            pushAssistantMessage('assistant', 'Pronto. Removi todas as metas ativas do app.', [
                { type: 'view', value: 'view-goals', label: 'Abrir Metas' }
            ]);
            setAssistantSuggestions([
                'Crie uma meta de 2h por dia para Estudos',
                'Quais categorias estão sem meta?',
                'O que focar agora?'
            ]);
        }
    );

    return {
        content: 'Abri uma confirmação para apagar todas as metas ativas. Assim eu evito apagar tudo por acidente.',
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão ativas?',
            'Quais categorias estão sem meta?',
            'O que focar agora?'
        ]
    };
}

function personalizeAssistantReply(reply) {
    if (!reply || !reply.content) return reply;

    const introByIntent = {
        focus_total: ['Olhei aqui rapidinho.', 'Acabei de conferir.'],
        top_category: ['Puxei seu histórico.', 'Dando uma olhada no seu foco.'],
        category_status: ['Fui checar essa categoria.', 'Olhei como ela está agora.'],
        planned_vs_actual: ['Comparei o que você planejou com o que entregou.', 'Coloquei seu planejado lado a lado com o realizado.'],
        goal_hits: ['Dei uma passada nas suas metas.', 'Chequei suas metas deste recorte.'],
        summary: ['Fechei um resumão para você.', 'Organizei um panorama rápido.'],
        lagging_goal: ['Encontrei o ponto que mais está pedindo atenção.', 'Olhei onde está o maior atraso.'],
        goal_count: ['Conferi isso para você.', 'Olhei suas metas ativas.'],
        categories_without_goal: ['Aqui está o que ficou sem meta.', 'Separei as categorias ainda sem meta.'],
        timer_control: ['Feito.', 'Pronto.'],
        tasks: ['Olhei suas tarefas.', 'Puxei a visão atual das suas tarefas.'],
        trend: ['Comparei com o recorte anterior.', 'Olhei a evolução entre os períodos.'],
        pomodoros: ['Conferi seu histórico recente.', 'Puxei esse número para você.'],
        focus_now: ['Se eu fosse você, iria por aqui.', 'Minha leitura agora é esta.']
    };

    const intent = reply.context?.intent;
    const pool = introByIntent[intent] || [];
    if (!pool.length) return reply;

    const seed = (reply.content.length + (intent || '').length) % pool.length;
    const intro = pool[seed];
    return {
        ...reply,
        content: `${intro}\n${reply.content}`
    };
}

function answerFocusTotal(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const category = detectAssistantCategory(text);
    const totalMinutes = getTotalFocusForPeriod(period, category, previous);
    const sessions = getSessionsCountForPeriod(period, category, previous);

    if (!totalMinutes) {
        return {
            content: category
                ? `Ainda não encontrei foco registrado em ${category} ${getPeriodNarration(period, previous)}.`
                : `Ainda não há foco registrado ${getPeriodNarration(period, previous)}.`,
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'focus_total', period, previous, category }
        };
    }

    return {
        content: [
            category
                ? `Você registrou ${formatMinsToHours(totalMinutes)} em ${category} ${getPeriodNarration(period, previous)}.`
                : `Você registrou ${formatMinsToHours(totalMinutes)} de foco ${getPeriodNarration(period, previous)}.`,
            `${sessions} sessão(ões) contabilizadas nesse recorte.`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Abrir Estatísticas' }],
        suggestions: [
            `Qual categoria recebeu mais foco ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
            'O que focar agora?',
            'Quais metas bati neste período?'
        ],
        context: { intent: 'focus_total', period, previous, category }
    };
}

function answerTopCategory(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const totals = getHistoryTotalsByCategory(period, previous);

    if (!totals.length) {
        return {
            content: `Ainda não há histórico suficiente ${getPeriodNarration(period, previous)} para apontar uma categoria líder.`,
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'top_category', period, previous, category: null }
        };
    }

    const top = totals[0];
    const totalMinutes = totals.reduce((sum, item) => sum + item.minutes, 0);
    const percent = totalMinutes > 0 ? Math.round((top.minutes / totalMinutes) * 100) : 0;
    const next = totals[1];

    return {
        content: [
            `${top.category} lidera ${getPeriodNarration(period, previous)} com ${formatMinsToHours(top.minutes)} de foco.`,
            `Isso representa ${percent}% do total registrado${next ? `, à frente de ${next.category} por ${formatMinsToHours(top.minutes - next.minutes)}.` : '.'}`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Ver distribuição' }],
        suggestions: [
            `Quanto foquei em ${top.category} ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
            'Resuma meu desempenho',
            'O que focar agora?'
        ],
        context: { intent: 'top_category', period, previous, category: top.category }
    };
}

function answerGoalHits(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);

    if (!overview.activeCount) {
        return {
            content: 'Você ainda não tem metas ativas para eu verificar nesse período.',
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Quais metas estão ativas?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_hits', period, previous, category: null }
        };
    }

    const hitGoals = overview.summaries.filter(item => item.targetMinutes > 0 && item.actualMinutes >= item.targetMinutes);
    if (!hitGoals.length) {
        return {
            content: `Ainda não houve meta batida ${getPeriodNarration(period, previous)}. A melhor categoria até agora é ${overview.bestCategory?.category || 'sem destaque'} com ${overview.bestCategory?.percent || 0}% da meta.`,
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: [
                'Como estou em Estudos?',
                'Quanto falta para minhas metas?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_hits', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    return {
        content: [
            `${hitGoals.length} de ${overview.activeCount} meta(s) foram batidas ${getPeriodNarration(period, previous)}.`,
            hitGoals.map(item => `• ${item.category}: ${formatMinsToHours(item.actualMinutes)} de ${formatMinsToHours(item.targetMinutes)}`).join('\n')
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'Como estou em Trabalho?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'goal_hits', period, previous, category: hitGoals[0]?.category || null }
    };
}

function answerGoalList() {
    if (!focusGoals.length) {
        return {
            content: 'Você ainda não tem metas ativas. Se quiser, eu posso criar uma agora em linguagem natural.',
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Crie uma meta de 3h para Trabalho em dias úteis',
                'O que focar agora?'
            ]
        };
    }

    const lines = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const scheduleLabel = goal.schedule === 'everyday' ? 'semana inteira' : 'dias úteis';
            return `• ${goal.category}: ${formatMinsToHours(goal.dailyMinutes)} por dia (${scheduleLabel})`;
        });

    return {
        content: ['Metas ativas no momento:', ...lines].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Como estou em Estudos?',
            'Quais metas bati esta semana?',
            'Ajuste a meta de Trabalho para 4h por dia'
        ]
    };
}

function answerCategoryStatus(text) {
    const category = detectAssistantCategory(text);
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;

    if (!category) {
        return {
            content: 'Me diga a categoria que você quer analisar e eu te conto como ela está. Exemplo: "Como estou em Estudos esta semana?"',
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'category_status', period, previous, category: null }
        };
    }

    const summary = getAssistantGoalSummaries(period, previous).find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    const actualMinutes = getTotalFocusForPeriod(period, category, previous);

    if (!summary) {
        if (!actualMinutes) {
            return {
                content: `Ainda não encontrei foco registrado em ${category} ${getPeriodNarration(period, previous)} e também não há meta ativa dessa categoria.`,
                suggestions: [
                    `Crie uma meta de 2h por dia para ${category}`,
                    `Quanto foquei em ${category} ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
                    'Quais metas estão ativas?'
                ],
                context: { intent: 'category_status', period, previous, category }
            };
        }

        return {
            content: `Você registrou ${formatMinsToHours(actualMinutes)} em ${category} ${getPeriodNarration(period, previous)}. Hoje essa categoria não tem meta ativa para comparação.`,
            suggestions: [
                `Crie uma meta de 2h por dia para ${category}`,
                'Quais metas estão ativas?',
                'O que focar agora?'
            ],
            context: { intent: 'category_status', period, previous, category }
        };
    }

    return {
        content: [
            `${summary.category} ${getPeriodNarration(period, previous)}: ${formatMinsToHours(summary.actualMinutes)} realizados de ${formatMinsToHours(summary.targetMinutes)} planejados.`,
            `${summary.percent}% da meta concluída. ${formatAssistantGoalStatus(summary)}`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Ajuste a meta de ${summary.category} para ${Math.max(1, Math.round((summary.dailyMinutes || 60) / 60))}h por dia`,
            'Quais metas bati esta semana?',
            'O que focar agora?'
        ],
        context: { intent: 'category_status', period, previous, category: summary.category }
    };
}

function answerPlannedVsActual(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);

    if (!overview.activeCount) {
        return {
            content: `Ainda não há metas ativas ${getPeriodNarration(period, previous)} para comparar planejado e realizado.`,
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: getAssistantDefaultSuggestions('view-goals'),
            context: { intent: 'planned_vs_actual', period, previous, category: null }
        };
    }

    return {
        content: [
            `${getPeriodLabel(period)}: ${formatMinsToHours(overview.totalActual)} realizados de ${formatMinsToHours(overview.totalTarget)} planejados.`,
            `${overview.averageProgress}% do plano cumprido e ${overview.hitCount} de ${overview.activeCount} meta(s) batidas.`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'O que focar agora?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'planned_vs_actual', period, previous, category: null }
    };
}

function answerPomodoros(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    if (period === 'day') {
        return {
            content: `${previous ? 'Ontem' : 'Hoje'} você ${previous ? 'registrou' : 'concluiu'} ${previous ? `${getSessionsCountForPeriod('day', null, true)} sessão(ões) de foco` : `${totalPomodorosToday} pomodoro(s) completos`} e ${previous ? 'teve foco registrado no histórico.' : `${getSessionsCountForPeriod('day')} sessão(ões) de foco no histórico.`}`,
            suggestions: [
                'Quanto foquei hoje?',
                'Qual categoria recebeu mais foco hoje?',
                'O que focar agora?'
            ],
            context: { intent: 'pomodoros', period, previous, category: null }
        };
    }

    const sessions = getSessionsCountForPeriod(period, null, previous);
    return {
        content: `Para ${getPeriodLabel(period).toLowerCase()}, eu tenho ${sessions} sessão(ões) de foco registradas no histórico. O contador exato de pomodoros completos hoje está em ${totalPomodorosToday}.`,
        suggestions: [
            'Resuma meu desempenho',
            'Qual categoria recebeu mais foco esta semana?',
            'Quais metas bati neste período?'
        ],
        context: { intent: 'pomodoros', period, previous, category: null }
    };
}

function answerTrend(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const currentRange = getHistoryPeriodRange(period, previous);
    const previousRange = getHistoryPeriodRange(period, !previous);
    const currentMinutes = filterHistoryBetween(currentRange.start, currentRange.end).reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const previousMinutes = filterHistoryBetween(previousRange.start, previousRange.end).reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const delta = currentMinutes - previousMinutes;

    if (!currentMinutes && !previousMinutes) {
        return {
            content: 'Ainda não há histórico suficiente para eu comparar sua evolução.',
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'trend', period, previous, category: null }
        };
    }

    if (delta === 0) {
        return {
            content: `Seu foco está estável ${getPeriodNarration(period, previous)} em comparação com o recorte anterior: ${formatMinsToHours(currentMinutes)} em ambos os períodos.`,
            suggestions: [
                'Qual categoria recebeu mais foco esta semana?',
                'O que focar agora?',
                'Quais metas bati neste período?'
            ],
            context: { intent: 'trend', period, previous, category: null }
        };
    }

    return {
        content: delta > 0
            ? `Você está melhorando ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(currentMinutes)} agora, contra ${formatMinsToHours(previousMinutes)} no recorte anterior, uma alta de ${formatMinsToHours(delta)}.`
            : `Seu foco caiu ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(currentMinutes)} agora, contra ${formatMinsToHours(previousMinutes)} no recorte anterior, uma queda de ${formatMinsToHours(Math.abs(delta))}.`,
        suggestions: [
            'Qual categoria ficou mais para trás?',
            'O que focar agora?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'trend', period, previous, category: null }
    };
}

function answerSummary(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const totalMinutes = getTotalFocusForPeriod(period, null, previous);
    const topCategory = getHistoryTotalsByCategory(period, previous)[0];
    const overview = getAssistantGoalOverview(period, previous);
    const lines = [
        `Resumo ${getPeriodNarration(period, previous)}:`,
        `• Foco total: ${formatMinsToHours(totalMinutes)}`,
        `• Categoria líder: ${topCategory ? `${topCategory.category} (${formatMinsToHours(topCategory.minutes)})` : 'sem registros'}`,
        `• Metas batidas: ${overview.hitCount}/${overview.activeCount}`,
        `• Próximo melhor passo: ${getFocusNowSuggestion()}`
    ];

    return {
        content: lines.join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Abrir Estatísticas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'Como estou em Estudos?',
            'O que focar agora?'
        ],
        context: { intent: 'summary', period, previous, category: topCategory?.category || null }
    };
}

function answerFocusNow() {
    return {
        content: getFocusNowSuggestion(),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Crie uma meta de 2h por dia para Estudos',
            'Como estou em Trabalho?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'focus_now', period: getAssistantDefaultPeriod(), previous: false, category: null }
    };
}

function answerTasks() {
    return {
        content: getAssistantTaskSummary(),
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: [
            'Qual categoria recebeu mais foco hoje?',
            'O que focar agora?',
            'Crie uma meta de 2h por dia para Estudos'
        ],
        context: { intent: 'tasks', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null }
    };
}

function answerLaggingGoal(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const lagging = getLaggingGoalSummary(period, previous);

    if (!lagging) {
        return {
            content: `Não encontrei metas atrasadas ${getPeriodNarration(period, previous)}. Ou você já bateu tudo, ou ainda não há metas ativas nesse recorte.`,
            suggestions: [
                'Quais metas bati neste período?',
                'O que focar agora?',
                'Quais metas estão ativas?'
            ],
            context: { intent: 'lagging_goal', period, previous, category: null }
        };
    }

    return {
        content: `${lagging.category} é a meta mais atrasada ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(lagging.actualMinutes)} realizados de ${formatMinsToHours(lagging.targetMinutes)} planejados, e faltam ${formatMinsToHours(lagging.remainingMinutes)}.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Como estou em ${lagging.category}?`,
            'O que focar agora?',
            'Quais categorias estão sem meta?'
        ],
        context: { intent: 'lagging_goal', period, previous, category: lagging.category }
    };
}

function answerGoalCount() {
    const activeGoals = getActiveGoalsData();
    if (!activeGoals.length) {
        return {
            content: 'Você não tem metas ativas no momento.',
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Quais categorias estão sem meta?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_count', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    return {
        content: `Hoje você tem ${activeGoals.length} meta(s) ativa(s) no app.`,
        suggestions: [
            'Quais metas estão ativas?',
            'Quais categorias estão sem meta?',
            'Quais metas bati esta semana?'
        ],
        context: { intent: 'goal_count', period: getAssistantDefaultPeriod(), previous: false, category: null }
    };
}

function answerCategoriesWithoutGoal() {
    const withoutGoals = getCategoriesWithoutGoals();
    if (!withoutGoals.length) {
        return {
            content: 'Todas as categorias principais já têm meta ativa.',
            suggestions: [
                'Quais metas estão ativas?',
                'Quais metas estão mais atrasadas?',
                'O que focar agora?'
            ],
            context: { intent: 'categories_without_goal', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    return {
        content: `As categorias sem meta no momento são: ${withoutGoals.join(', ')}.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Crie uma meta de 1h por dia para ${withoutGoals[0]}`,
            'Quais metas estão ativas?',
            'O que focar agora?'
        ],
        context: { intent: 'categories_without_goal', period: getAssistantDefaultPeriod(), previous: false, category: withoutGoals[0] }
    };
}

function answerTimerControl(text) {
    const normalized = normalizeAssistantText(text);
    const durationMinutes = detectAssistantDurationMinutes(text);
    const category = detectAssistantCategory(text);

    if (includesAny(normalized, ['pausar timer', 'pause o timer', 'pausar foco', 'pare o timer', 'para o timer'])) {
        if (!isTimerRunning) {
            return {
                content: 'O temporizador já está pausado.',
                suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
                context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null }
            };
        }
        switchView('view-home');
        pauseTimer();
        renderProgress();
        renderTasksSidebar();
        syncStateToPip();
        return {
            content: 'Pausei o temporizador atual.',
            suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: category || currentTask?.category || null },
            autoClose: true
        };
    }

    if (includesAny(normalized, ['reinicie o timer', 'resetar timer', 'zerar timer', 'reiniciar foco'])) {
        switchView('view-home');
        resetTimer();
        return {
            content: 'Reiniciei o temporizador da sessão atual.',
            suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null },
            autoClose: true
        };
    }

    if (includesAny(normalized, ['inicie o foco', 'iniciar foco', 'comece o foco', 'inicie o timer', 'iniciar timer', 'continue o foco'])) {
        if (durationMinutes || category) {
            applyAssistantFreeFocus(durationMinutes, category);
        } else {
            switchView('view-home');
            if (currentMode !== 'focus') {
                setTimerMode('focus');
            }
            if (!isTimerRunning) toggleTimer();
        }
        return {
            content: 'Iniciei o foco para você.',
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['O que focar agora?', 'Quanto foquei hoje?', 'Qual categoria recebeu mais foco esta semana?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null },
            autoClose: true
        };
    }

    return null;
}

function answerPerformanceAssessment(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);
    const totalMinutes = getTotalFocusForPeriod(period, null, previous);

    if (!overview.activeCount) {
        if (!totalMinutes) {
            return {
                content: `Ainda não tenho foco nem metas suficientes ${getPeriodNarration(period, previous)} para dizer se você está indo bem ou mal.`,
                suggestions: ['Quanto foquei hoje?', 'Crie uma meta de 2h por dia para Estudos', 'O que focar agora?'],
                context: { intent: 'performance_assessment', period, previous, category: null }
            };
        }

        return {
            content: `Sem metas ativas eu não cravaria que você está indo mal. O que eu sei é que você registrou ${formatMinsToHours(totalMinutes)} ${getPeriodNarration(period, previous)}. Se quiser, eu posso te ajudar a transformar isso em metas mais claras.`,
            suggestions: ['Crie uma meta de 2h por dia para Estudos', 'Resuma meu desempenho', 'O que focar agora?'],
            context: { intent: 'performance_assessment', period, previous, category: null }
        };
    }

    if (overview.averageProgress >= 100) {
        return {
            content: `Você está indo muito bem ${getPeriodNarration(period, previous)}. Já bateu ${overview.hitCount} de ${overview.activeCount} metas e entregou ${overview.averageProgress}% do planejado.`,
            suggestions: ['Quais metas bati neste período?', 'O que você mudaria nas minhas metas?', 'O que focar agora?'],
            context: { intent: 'performance_assessment', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    if (overview.averageProgress >= 75) {
        return {
            content: `Você está indo bem ${getPeriodNarration(period, previous)}, mas ainda com espaço para consolidar. O plano está em ${overview.averageProgress}% e uma ou duas sessões bem colocadas já podem virar várias metas.`,
            suggestions: ['Qual meta está mais atrasada?', 'O que focar agora?', 'Minha meta de Estudos está realista?'],
            context: { intent: 'performance_assessment', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    return {
        content: `Eu diria que ${getPeriodNarration(period, previous)} você está abaixo do que planejou, mas não "mal". O ponto principal é que o plano está em ${overview.averageProgress}% e a meta mais atrasada merece mais atenção agora.`,
        suggestions: ['Qual meta está mais atrasada?', 'O que focar agora?', 'O que você mudaria nas minhas metas?'],
        context: { intent: 'performance_assessment', period, previous, category: null }
    };
}

function answerGoalRealism(text) {
    const category = detectAssistantCategory(text) || assistantConversationState?.category || null;
    if (!category) {
        return {
            content: 'Consigo avaliar isso, mas preciso da categoria. Exemplo: "Minha meta de Estudos está realista?"',
            suggestions: ['Minha meta de Estudos está realista?', 'Minha meta de Trabalho está muito alta?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const goal = getActiveGoalsData().find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Hoje ${category} não tem meta ativa, então eu não consigo avaliar o realismo dela.`,
            suggestions: [`Crie uma meta de 2h por dia para ${category}`, 'Quais metas estão ativas?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category }
        };
    }

    const realism = assessGoalRealism(goal);
    return {
        content: realism.message,
        suggestions: [
            realism.tone === 'aggressive'
                ? `Ajuste a meta de ${category} para ${Math.max(1, Math.round(getCategoryRecentStats(category, 21).averagePerDay / 60))}h por dia`
                : `Como estou em ${category}?`,
            'O que você mudaria nas minhas metas?',
            'O que focar agora?'
        ],
        context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category }
    };
}

function answerGoalAdjustmentAdvice() {
    const goals = getActiveGoalsData();
    if (!goals.length) {
        return {
            content: 'Sem metas ativas eu não tenho o que ajustar ainda. Se quiser, posso te ajudar a montar as primeiras com base no que você já faz.',
            suggestions: ['Crie uma meta de 2h por dia para Estudos', 'Quais categorias estão sem meta?', 'Quanto foquei esta semana?'],
            context: { intent: 'goal_adjustment', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const advice = goals.map(goal => {
        const realism = assessGoalRealism(goal);
        return { goal, realism };
    });

    const aggressive = advice.filter(item => item.realism?.tone === 'aggressive');
    const conservative = advice.filter(item => item.realism?.tone === 'conservative');

    let content = '';
    if (aggressive.length) {
        const first = aggressive[0];
        content += `Eu começaria suavizando ${first.goal.category}. ${first.realism.message}\n`;
    } else if (conservative.length) {
        const first = conservative[0];
        content += `Se fosse para ajustar algo agora, eu subiria um pouco ${first.goal.category}. ${first.realism.message}\n`;
    } else {
        content += 'No geral, suas metas parecem relativamente coerentes com o histórico recente.\n';
    }

    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    if (lagging) {
        content += `Hoje eu também prestaria atenção em ${lagging.category}, porque ela é a que mais está pedindo recuperação neste recorte.`;
    } else {
        content += 'No curto prazo, eu manteria as metas como estão e ajustaria só depois de mais alguns dias de uso.';
    }

    return {
        content,
        suggestions: [
            aggressive.length ? `Minha meta de ${aggressive[0].goal.category} está realista?` : 'Qual meta está mais atrasada?',
            'O que focar agora?',
            'Quais metas bati esta semana?'
        ],
        context: { intent: 'goal_adjustment', period: getAssistantDefaultPeriod(), previous: false, category: aggressive[0]?.goal.category || lagging?.category || null }
    };
}

function answerCategoryChangeAdvice(text) {
    const category = detectAssistantCategory(text) || assistantConversationState?.category || null;
    if (!category) {
        return {
            content: 'Se você me disser a categoria, eu consigo opinar melhor. Exemplo: "Faz sentido eu reduzir Trabalho esta semana?"',
            suggestions: ['Faz sentido eu reduzir Trabalho esta semana?', 'Minha meta de Estudos está realista?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const goal = getActiveGoalsData().find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Hoje ${category} nem tem meta ativa, então eu só reduziria se ela realmente deixou de ser prioridade nesta semana.`,
            suggestions: [`Crie uma meta de 2h por dia para ${category}`, 'O que focar agora?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category }
        };
    }

    const realism = assessGoalRealism(goal);
    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    const isReduceIntent = includesAny(normalizeAssistantText(text), ['reduzir', 'baixar', 'diminuir']);

    let content = '';
    if (isReduceIntent) {
        if (realism.tone === 'aggressive') {
            content = `Sim, faz sentido considerar uma redução em ${category} por enquanto. ${realism.message}`;
        } else {
            content = `Eu só reduziria ${category} se sua prioridade da semana realmente mudou. ${realism.message}`;
        }
    } else {
        content = realism.message;
    }

    if (lagging && normalizeAssistantText(lagging.category) !== normalizeAssistantText(category)) {
        content += ` Hoje o maior atraso está em ${lagging.category}, então eu equilibraria isso antes de mexer muito em ${category}.`;
    }

    return {
        content,
        suggestions: [
            `Como estou em ${category}?`,
            'O que você mudaria nas minhas metas?',
            'O que focar agora?'
        ],
        context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category }
    };
}

function buildAssistantTaskPrompt(missing, draft) {
    const parts = [];
    if (missing.includes('nome')) parts.push('o nome');
    if (missing.includes('categoria')) parts.push('a categoria');
    if (missing.includes('duracao')) parts.push('a dura\u00e7\u00e3o');

    const collected = [];
    if (draft?.name) collected.push(`nome: ${draft.name}`);
    if (draft?.category) collected.push(`categoria: ${draft.category}`);
    if (draft?.durationMinutes) collected.push(`dura\u00e7\u00e3o: ${draft.durationMinutes} min`);

    const collectedText = collected.length ? ` At\u00e9 agora eu peguei ${collected.join(', ')}.` : '';
    return `Consigo montar essa tarefa, mas ainda preciso de ${parts.join(' e ')}.${collectedText}`;
}

function answerTaskCreateOrStart(text) {
    const baseDraft = assistantConversationState?.intent === 'task_creation_pending'
        ? assistantConversationState.taskDraft
        : null;
    const draft = extractAssistantTaskDraft(text, baseDraft);
    const normalized = normalizeAssistantText(text);

    if (draft.existingTask && !draft.durationMinutes && !draft.category && (!draft.name || normalizeAssistantText(draft.name) === normalizeAssistantText(draft.existingTask.name))) {
        switchView('view-home');
        startTask(draft.existingTask.id);
        return {
            content: `Feito. Iniciei a tarefa "${draft.existingTask.name}" e te levei para a Home para acompanhar o timer.`,
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['Pause o timer', 'Quanto foquei hoje?', 'O que focar agora?'],
            autoClose: true,
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: draft.existingTask.category || null }
        };
    }

    const missing = getAssistantMissingTaskFields(draft);
    const askedOnlyToStartTask = includesAny(normalized, ['iniciar tarefa', 'inicie a tarefa', 'comecar tarefa', 'comece a tarefa']) && missing.length > 0;

    if (missing.length) {
        return {
            content: buildAssistantTaskPrompt(missing, draft),
            suggestions: [
                'Tarefa revisao de contratos em Trabalho por 45 minutos',
                'Matematica financeira em Estudos por 20 minutos',
                'Escreva proposta em Trabalho por 1 hora'
            ],
            context: {
                intent: 'task_creation_pending',
                period: getAssistantDefaultPeriod(),
                previous: false,
                category: draft.category || null,
                taskDraft: draft,
                askedOnlyToStartTask
            }
        };
    }

    const createdTask = createTaskFromAssistant(draft, true);
    switchView('view-home');
    return {
        content: `Pronto. Criei e iniciei a tarefa "${createdTask.name}" em ${createdTask.category} com ${createdTask.estimatedMinutes} minuto(s).`,
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: ['Pause o timer', 'Quanto foquei hoje?', `Como estou em ${createdTask.category}?`],
        autoClose: true,
        context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: createdTask.category || null }
    };
}

function answerStartTask(text) {
    const task = findAssistantTaskByText(text);

    if (!tasks.length) {
        return {
            content: 'Você ainda não tem tarefas criadas. Se quiser, primeiro crie uma tarefa e depois eu consigo iniciar por aqui.',
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['Nova tarefa', 'Crie uma meta de 2h por dia para Estudos', 'O que focar agora?'],
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (!task) {
        const openTasks = tasks.filter(item => !item.completed).slice(0, 3).map(item => item.name);
        return {
            content: openTasks.length
                ? `Não consegui identificar qual tarefa você quer iniciar. Tente citar o nome dela, por exemplo: "iniciar tarefa ${openTasks[0]}".`
                : 'No momento não encontrei tarefas em aberto para iniciar.',
            suggestions: openTasks.length
                ? openTasks.map(name => `Iniciar tarefa ${name}`)
                : ['Abrir Home', 'Quanto foquei hoje?', 'O que focar agora?'],
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    switchView('view-home');
    startTask(task.id);

    return {
        content: `Feito. Iniciei a tarefa "${task.name}" e te levei para a Home para você já acompanhar o timer.`,
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: ['Pause o timer', 'Quanto foquei hoje?', 'O que focar agora?'],
        autoClose: true,
        context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: task.category || null }
    };
}

function saveGoalFromAssistant(text) {
    const category = detectAssistantCategory(text);
    const dailyMinutes = detectAssistantDurationMinutes(text);
    const schedule = detectAssistantSchedule(text);

    if (!category && !dailyMinutes) {
        return {
            content: 'Eu consigo criar a meta, mas preciso de categoria e duração. Exemplo: "Crie uma meta de 2h por dia para Estudos em dias úteis."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    if (!category) {
        return {
            content: 'Me diga a categoria da meta. Exemplo: "Defina 2h por dia para Trabalho."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    if (!dailyMinutes) {
        return {
            content: `Entendi a categoria ${category}, mas ainda preciso da duração. Exemplo: "Ajuste ${category} para 1h30 por dia."`,
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    const existingGoal = focusGoals.find(goal => normalizeAssistantText(goal.category) === normalizeAssistantText(category));
    const result = saveGoalEntry({
        goalId: existingGoal?.id || null,
        category,
        dailyMinutes,
        schedule: schedule || existingGoal?.schedule || 'weekdays'
    });

    if (!result.ok) {
        return {
            content: result.message || 'Não consegui salvar essa meta.',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    resetGoalForm();
    renderGoalsList();
    renderStatsGoalsSummary(window._statsPeriod || 'day');
    window.compileGoalsData?.();

    const scheduleLabel = (schedule || existingGoal?.schedule || 'weekdays') === 'everyday' ? 'semana inteira' : 'dias úteis';
    return {
        content: `${existingGoal ? 'Meta atualizada' : 'Meta criada'}: ${category} com ${formatMinsToHours(dailyMinutes)} por dia (${scheduleLabel}).`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Como estou em ${category}?`,
            'Quais metas bati esta semana?',
            'O que focar agora?'
        ]
    };
}

function removeGoalFromAssistant(text) {
    const category = detectAssistantCategory(text);
    if (!category) {
        return {
            content: 'Qual meta você quer remover? Me diga a categoria. Exemplo: "Remova a meta de Leitura."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    const goal = focusGoals.find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Não encontrei uma meta ativa para ${category}.`,
            suggestions: [
                'Quais metas estão ativas?',
                `Crie uma meta de 1h por dia para ${category}`,
                'O que focar agora?'
            ]
        };
    }

    focusGoals = focusGoals.filter(item => item.id !== goal.id);
    saveFocusGoals();
    if (editingGoalId === goal.id) resetGoalForm();
    renderStatsGoalsSummary(window._statsPeriod || 'day');
    window.compileGoalsData?.();

    return {
        content: `Pronto. A meta de ${category} foi removida.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão ativas?',
            'Crie uma meta de 2h por dia para Estudos',
            'Resuma meu desempenho'
        ]
    };
}

function answerAssistantHelp() {
    return {
        content: [
            'Pode falar comigo como falaria com outra pessoa.',
            'Eu consigo, por exemplo:',
            '• criar, ajustar e remover metas',
            '• responder sobre foco hoje, semana e mês',
            '• dizer qual categoria recebeu mais atenção',
            '• comparar planejado e realizado',
            '• sugerir no que vale focar agora'
        ].join('\n'),
        suggestions: getAssistantDefaultSuggestions()
    };
}

function answerBroaderGuidance(text) {
    const normalized = normalizeAssistantText(text);
    const overview = getAssistantGoalOverview(getAssistantDefaultPeriod(), false);
    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    const currentSuggestion = getFocusNowSuggestion();

    if (includesAny(normalized, ['oq vc pode fazer', 'o que vc pode fazer', 'o que voce pode fazer', 'oq voce pode fazer'])) {
        return answerAssistantHelp();
    }

    if (includesAny(normalized, ['estou perdido', 'to perdido', 'nao sei por onde comecar', 'nao sei o que fazer', 'estou sobrecarregado', 'to sobrecarregado'])) {
        return {
            content: `Eu iria simplificar o proximo passo. ${currentSuggestion}`,
            suggestions: ['O que focar agora?', 'Resuma meu desempenho', 'Quais metas estao mais atrasadas?'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || null }
        };
    }

    if (includesAny(normalized, ['como posso melhorar', 'como melhorar', 'alguma sugestao', 'alguma dica', 'o que voce recomenda', 'qual seria o melhor plano'])) {
        const advice = lagging
            ? `Eu atacaria primeiro ${lagging.category}, porque faltam ${formatMinsToHours(lagging.remainingMinutes)} para fechar essa meta.`
            : currentSuggestion;
        return {
            content: `${advice} Depois eu revisaria se suas metas estao proporcionais ao seu ritmo recente.`,
            suggestions: ['Qual meta esta mais atrasada?', 'Minha meta de Estudos esta realista?', 'O que focar agora?'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || overview.bestCategory?.category || null }
        };
    }

    if (includesAny(normalized, ['me ajuda a me organizar', 'me ajuda a organizar', 'como me organizo', 'como organizar meu foco', 'como organizar minha semana'])) {
        return {
            content: `Eu faria assim: primeiro olho o que esta atrasado, depois priorizo uma categoria por vez e fecho blocos curtos. ${currentSuggestion}`,
            suggestions: ['O que focar agora?', 'Quais metas estao mais atrasadas?', 'Resuma meu desempenho'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || null }
        };
    }

    return null;
}

function buildAssistantReply(text) {
    const normalized = normalizeAssistantText(text);
    const category = detectAssistantCategory(text);
    const durationMinutes = detectAssistantDurationMinutes(text);
    const defaultPeriod = getAssistantDefaultPeriod();
    const isTaskFollowUp = assistantConversationState?.intent === 'task_creation_pending' && (
        !!category ||
        !!durationMinutes ||
        includesAny(normalized, ['tarefa', 'categoria', 'minuto', 'minutos', 'hora', 'horas']) ||
        normalized.split(/\s+/).filter(Boolean).length <= 6
    );

    if (!normalized) {
        return {
            content: 'Pode mandar sua pergunta ou comando por aqui.',
            suggestions: getAssistantDefaultSuggestions()
        };
    }

    if (hasWholeToken(normalized, ['oi', 'ola']) || includesAny(normalized, ['ajuda', 'o que voce faz', 'oq voce faz', 'o que vc pode fazer', 'oq vc pode fazer', 'como voce pode ajudar', 'como vc pode ajudar', 'voce consegue', 'vc consegue'])) {
        return answerAssistantHelp();
    }

    const broaderGuidance = answerBroaderGuidance(text);
    if (broaderGuidance) return broaderGuidance;

    if (includesAny(normalized, ['abrir metas', 'va para metas', 'ir para metas'])) {
        switchView('view-goals');
        return {
            content: 'Abri a tela de Metas para você.',
            actions: [{ type: 'view', value: 'view-goals', label: 'Metas' }],
            suggestions: getAssistantDefaultSuggestions('view-goals'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['abrir estatisticas', 'va para estatisticas', 'ir para estatisticas'])) {
        switchView('view-stats');
        return {
            content: 'Abri a tela de Estatísticas para você.',
            actions: [{ type: 'view', value: 'view-stats', label: 'Estatísticas' }],
            suggestions: getAssistantDefaultSuggestions('view-stats'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['abrir home', 'ir para home', 'voltar para home'])) {
        switchView('view-home');
        return {
            content: 'Voltei para a Home.',
            actions: [{ type: 'view', value: 'view-home', label: 'Home' }],
            suggestions: getAssistantDefaultSuggestions('view-home'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['quais metas', 'metas ativas', 'listar metas']) && !includesAny(normalized, ['bati', 'batidas'])) return answerGoalList();

    if (
        includesAny(normalized, [
            'apague todas minhas metas',
            'apague todas as metas',
            'exclua todas as metas',
            'remova todas as metas',
            'delete todas as metas',
            'limpe minhas metas',
            'apagar minhas metas',
            'apagar todas minhas metas',
            'apagar todas as metas',
            'remover minhas metas',
            'excluir minhas metas',
            'deletar minhas metas'
        ]) ||
        (includesAny(normalized, ['apagar', 'remover', 'excluir', 'deletar', 'limpar']) && includesAny(normalized, ['metas']) && !category)
    ) {
        return removeAllGoalsFromAssistant();
    }

    if (includesAny(normalized, ['remova a meta', 'remove a meta', 'remover meta', 'apague a meta', 'exclua a meta', 'deleta a meta', 'tira a meta'])) return removeGoalFromAssistant(text);

    const looksLikeGoalCommand =
        durationMinutes &&
        category &&
        includesAny(normalized, ['meta', 'crie', 'criar', 'ajuste', 'ajustar', 'defina', 'definir', 'mude', 'altere', 'quero', 'planeje']);

    if (looksLikeGoalCommand) return saveGoalFromAssistant(text);

    if (includesAny(normalized, ['pausar timer', 'pause o timer', 'pausar foco', 'pare o timer', 'para o timer', 'reinicie o timer', 'resetar timer', 'zerar timer', 'reiniciar foco', 'inicie o foco', 'iniciar foco', 'comece o foco', 'inicie o timer', 'iniciar timer', 'continue o foco'])) {
        const timerReply = answerTimerControl(text);
        if (timerReply) return timerReply;
    }

    if (isTaskFollowUp) return answerTaskCreateOrStart(text);

    if (includesAny(normalized, ['o que focar agora', 'oque focar agora', 'onde focar agora', 'qual categoria focar', 'o que priorizar'])) return answerFocusNow();

    if (
        includesAny(normalized, ['iniciar tarefa', 'inicie a tarefa', 'comecar tarefa', 'comece a tarefa', 'abrir tarefa', 'abra a tarefa', 'criar tarefa', 'crie uma tarefa', 'nova tarefa', 'adicionar tarefa']) ||
        ((includesAny(normalized, ['iniciar', 'inicie', 'comecar', 'comece', 'abrir', 'abra']) && !!findAssistantTaskByText(text))) ||
        (includesAny(normalized, ['tarefa']) && (!!durationMinutes || !!category))
    ) {
        return answerTaskCreateOrStart(text);
    }

    if (includesAny(normalized, ['meta mais atrasada', 'metas mais atrasadas', 'qual meta esta mais atrasada', 'qual meta está mais atrasada', 'qual categoria esta mais atrasada', 'qual categoria está mais atrasada', 'quanto falta para a meta'])) {
        return answerLaggingGoal(text);
    }

    if (includesAny(normalized, ['quais metas bati', 'bati alguma meta', 'metas batidas'])) return answerGoalHits(text);

    if (includesAny(normalized, ['estou indo mal', 'estou indo bem', 'to indo mal', 'to indo bem', 'como eu estou indo', 'como estou indo', 'estou bem', 'estou mal'])) return answerPerformanceAssessment(text);

    if (includesAny(normalized, ['meta realista', 'esta realista', 'está realista', 'meta muito alta', 'meta muito baixa', 'faz sentido essa meta'])) {
        return answerGoalRealism(text);
    }

    if (includesAny(normalized, ['o que voce mudaria nas minhas metas', 'o que você mudaria nas minhas metas', 'o que mudaria nas minhas metas', 'como voce ajustaria minhas metas', 'como você ajustaria minhas metas'])) {
        return answerGoalAdjustmentAdvice();
    }

    if (includesAny(normalized, ['faz sentido eu reduzir', 'vale a pena reduzir', 'devo reduzir', 'devo baixar', 'devo diminuir'])) return answerCategoryChangeAdvice(text);

    if (includesAny(normalized, ['quantas metas', 'numero de metas', 'número de metas', 'quantas metas tenho'])) {
        return answerGoalCount();
    }

    if (includesAny(normalized, ['categorias sem meta', 'quais categorias nao tem meta', 'quais categorias não tem meta', 'o que esta sem meta', 'o que está sem meta'])) {
        return answerCategoriesWithoutGoal();
    }

    if (includesAny(normalized, ['como estou em', 'status de', 'andamento de']) && category) return answerCategoryStatus(text);

    if (includesAny(normalized, ['qual categoria', 'categoria que mais', 'mais foco', 'lider']) && includesAny(normalized, ['foco', 'foquei', 'tempo'])) return answerTopCategory(text);

    if (includesAny(normalized, ['quantos pomodoros', 'quantas sessoes'])) {
        return answerPomodoros(text);
    }

    if (includesAny(normalized, ['planejado', 'realizado', 'quanto falta para as metas', 'como esta meu plano'])) return answerPlannedVsActual(text);

    if (includesAny(normalized, ['estou melhorando', 'estou piorando', 'compare', 'comparado', 'evoluindo', 'evolucao'])) return answerTrend(text);

    if (includesAny(normalized, ['resumo', 'resuma', 'meu desempenho', 'como eu fui'])) return answerSummary(text);

    if (includesAny(normalized, ['como foi meu foco', 'como esta meu foco', 'como tá meu foco', 'como ta meu foco'])) {
        return answerFocusTotal(text);
    }

    if (includesAny(normalized, ['tarefas', 'tarefa atual', 'o que tenho para fazer'])) return answerTasks();

    if (includesAny(normalized, ['quanto foquei', 'quanto tempo', 'quanto entreguei', 'quanto de foco'])) return answerFocusTotal(text);

    if (category) return answerCategoryStatus(text);

    if (includesAny(normalized, ['foco', 'historico', 'histórico', 'desempenho'])) {
        return answerSummary(text);
    }

    if (includesAny(normalized, ['meta', 'metas', 'planejamento', 'planejado'])) {
        return answerGoalAdjustmentAdvice();
    }

    return {
        content: 'Ainda não peguei exatamente o que você quis dizer, mas sigo com você nessa. Se quiser, reformula do seu jeito mesmo e eu tento de novo. Posso ajudar com metas, histórico, foco, categorias, tarefas e decisões de prioridade.',
        suggestions: getAssistantDefaultSuggestions()
    };
}

normalizeAssistantText = function(value = '') {
    return assistantCore.normalizeText(value);
};

detectAssistantTemporalContext = function(text, fallback = null) {
    return assistantCore.detectTemporalContext(
        text,
        fallback || { period: getAssistantDefaultPeriod(), previous: false }
    );
};

detectAssistantCategory = function(text) {
    return assistantCore.detectCategory(text, {
        defaultCategories,
        userCategories,
        focusGoals
    });
};

detectAssistantDurationMinutes = function(text) {
    return assistantCore.detectDurationMinutes(text, {
        pomodoroMinutes: POMODORO_MINUTES
    });
};

detectAssistantSchedule = function(text) {
    return assistantCore.detectSchedule(text);
};

extractAssistantTaskDraft = function(text, baseDraft = null) {
    return assistantCore.extractTaskDraft(text, baseDraft, {
        defaultCategories,
        userCategories,
        focusGoals,
        pomodoroMinutes: POMODORO_MINUTES,
        findExistingTask: findAssistantTaskByText
    });
};

getAssistantMissingTaskFields = function(draft) {
    return assistantCore.getMissingTaskFields(draft);
};

expandAssistantFollowUp = function(text) {
    return assistantCore.expandFollowUp(text, {
        ...(assistantConversationState || {}),
        defaultPeriod: getAssistantDefaultPeriod(),
        defaultCategories,
        userCategories,
        focusGoals
    });
};

buildAssistantReply = function(text) {
    return assistantCore.buildReply(text, {
        answerers: {
            assistantHelp: () => answerAssistantHelp(),
            broaderGuidance: (input) => answerBroaderGuidance(input),
            focusNow: () => answerFocusNow(),
            goalList: () => answerGoalList(),
            removeAllGoals: () => removeAllGoalsFromAssistant(),
            removeGoal: (input) => removeGoalFromAssistant(input),
            saveGoal: (input) => saveGoalFromAssistant(input),
            timerControl: (input) => answerTimerControl(input),
            taskCreateOrStart: (input) => answerTaskCreateOrStart(input),
            focusTotal: (input) => answerFocusTotal(input),
            topCategory: (input) => answerTopCategory(input),
            goalHits: (input) => answerGoalHits(input),
            categoryStatus: (input) => answerCategoryStatus(input),
            plannedVsActual: (input) => answerPlannedVsActual(input),
            trend: (input) => answerTrend(input),
            summary: (input) => answerSummary(input),
            laggingGoal: (input) => answerLaggingGoal(input),
            pomodoros: (input) => answerPomodoros(input),
            performanceAssessment: (input) => answerPerformanceAssessment(input),
            goalRealism: (input) => answerGoalRealism(input),
            goalAdjustmentAdvice: () => answerGoalAdjustmentAdvice(),
            categoryChangeAdvice: (input) => answerCategoryChangeAdvice(input),
            goalCount: () => answerGoalCount(),
            categoriesWithoutGoal: () => answerCategoriesWithoutGoal(),
            tasks: () => answerTasks()
        },
        effects: {
            switchView
        },
        conversationState: assistantConversationState,
        defaultCategories,
        userCategories,
        focusGoals,
        pomodoroMinutes: POMODORO_MINUTES,
        findTaskByText: findAssistantTaskByText,
        getDefaultSuggestions: (viewId) => getAssistantDefaultSuggestions(viewId),
        getDefaultPeriod: () => getAssistantDefaultPeriod()
    });
};

// TEST FUNCTION - Call from DevTools console: testChangelog()
window.testChangelog = function() {
    const testChangelog = `### Corrigido
- Scroll nas configurações agora funciona corretamente
- Secoes de configuracao nao sao mais cortadas na parte inferior
- Layout da view de estatísticas também ajustado para scroll adequado

### Adicionado
- Sistema de changelog real lendo do CHANGELOG.md
- Histórico completo de todas as funcionalidades desde v1.0.0`;
    
    showChangelogModal('1.0.8', testChangelog);
    console.log('✅ Changelog modal exibido! Verifique a tela.');
};
