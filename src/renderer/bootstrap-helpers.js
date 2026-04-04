function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

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
