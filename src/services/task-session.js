(() => {
    let deps = null;

    const FOCUS_MODE = 'focus';

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenTaskSessionService;
    };

    const getState = () => ({
        tasks: deps?.getTasks?.() ?? [],
        currentTask: deps?.getCurrentTask?.() ?? null,
        timeLeft: deps?.getTimeLeft?.() ?? 0,
        totalTimerTime: deps?.getTotalTimerTime?.() ?? 0,
        currentMode: deps?.getCurrentMode?.() ?? FOCUS_MODE,
        isTimerRunning: deps?.getIsTimerRunning?.() ?? false,
        focusHistory: deps?.getFocusHistory?.() ?? []
    });

    const getStorageKey = (keyName) => deps?.storageKeys?.[keyName] ?? null;

    const readSavedSession = () => {
        const storageKey = getStorageKey('SAVED_SESSION');
        if (!storageKey) return null;

        if (deps?.storageService?.readJsonStorage) {
            return deps.storageService.readJsonStorage(storageKey, null);
        }

        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed ?? null;
        } catch (error) {
            console.warn('Falha ao ler sessao salva:', error);
            return null;
        }
    };

    const saveSavedSession = (session) => {
        const storageKey = getStorageKey('SAVED_SESSION');
        if (!storageKey) return;

        if (deps?.storageService?.writeJsonStorage) {
            deps.storageService.writeJsonStorage(storageKey, session);
            return;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(session));
        } catch (error) {
            console.warn('Falha ao gravar sessao salva:', error);
        }
    };

    const clearSavedSession = () => {
        const storageKey = getStorageKey('SAVED_SESSION');
        if (!storageKey) return;

        if (deps?.storageService?.removeStorageValue) {
            deps.storageService.removeStorageValue(storageKey);
            return;
        }

        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.warn('Falha ao remover sessao salva:', error);
        }
    };

    const getDefaultFocusDurationSeconds = () => {
        if (deps?.timerCore?.getModeDurationSeconds) {
            return deps.timerCore.getModeDurationSeconds({
                mode: FOCUS_MODE,
                testMode: deps?.getTestMode?.() ?? false,
                pomodoroMinutes: Number(deps?.pomodoroMinutes) || 25,
                shortBreakMinutes: Number(deps?.shortBreakMinutes) || 5,
                longBreakMinutes: Number(deps?.longBreakMinutes) || 15
            });
        }

        return deps?.getTestMode?.() ? 5 : (Number(deps?.pomodoroMinutes) || 25) * 60;
    };

    const renderTaskDomain = () => {
        deps?.renderTasksList?.();
        deps?.renderTasksSidebar?.();
        deps?.renderProgress?.();
        deps?.updateHeaderTaskCount?.();
    };

    const finalizeSelectionUi = () => {
        renderTaskDomain();
        deps?.hideWelcomeModal?.();
        deps?.syncStateToPip?.();
    };

    const appendFreeFocusHistory = () => {
        const state = getState();
        if (state.currentTask || state.currentMode !== FOCUS_MODE || state.timeLeft >= state.totalTimerTime) {
            return;
        }

        const elapsedSeconds = state.totalTimerTime - state.timeLeft;
        if (elapsedSeconds < 60) return;

        state.focusHistory.push({
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
            category: deps?.getActiveCategory?.() || 'Livre',
            taskId: null
        });

        deps?.saveFocusHistory?.();
    };

    const persistCurrentTaskProgressForLater = () => {
        const state = getState();
        if (state.currentMode !== FOCUS_MODE) return;

        if (state.currentTask) {
            const partialPomodoro = state.totalTimerTime > 0
                ? (state.totalTimerTime - state.timeLeft) / state.totalTimerTime
                : 0;
            state.currentTask.completedPomodoros = Math.floor(state.currentTask.completedPomodoros || 0) + partialPomodoro;
            deps?.saveTasks?.();
        }

        saveSavedSession({
            taskId: state.currentTask ? state.currentTask.id : null,
            category: state.currentTask ? state.currentTask.category : (deps?.getActiveCategory?.() || 'Livre'),
            timeLeft: state.timeLeft,
            totalTimerTime: state.totalTimerTime,
            mode: state.currentMode
        });
    };

    const deselectTask = () => {
        const state = getState();
        if (state.isTimerRunning) deps?.pauseTimer?.();

        const nextDuration = getDefaultFocusDurationSeconds();
        deps?.setCurrentTask?.(null);
        deps?.setCurrentMode?.(FOCUS_MODE);
        deps?.setTimeLeft?.(nextDuration);
        deps?.setTotalTimerTime?.(nextDuration);

        deps?.applyFreeFocusUi?.({ category: 'Livre' });
        deps?.applyTimerModeUi?.({ mode: FOCUS_MODE, resetToggleButton: true });
        deps?.updateTimerDisplay?.();
        deps?.updateProgressBar?.();
        finalizeSelectionUi();
    };

    const performTaskSelection = (taskId, options = {}) => {
        const { skipTimerSync = false } = options;
        const state = getState();
        const task = state.tasks.find((item) => item.id === taskId);

        deps?.setCurrentTask?.(task ?? null);

        if (!task || task.completed) {
            deselectTask();
            return;
        }

        let shouldSkipTimerSync = skipTimerSync;
        const session = readSavedSession();

        if (session && session.taskId === taskId) {
            shouldSkipTimerSync = true;
            deps?.setCurrentMode?.(session.mode || FOCUS_MODE);
            deps?.setTimeLeft?.(session.timeLeft);
            deps?.setTotalTimerTime?.(session.totalTimerTime);
            deps?.applyTimerModeUi?.({ mode: session.mode || FOCUS_MODE, resetToggleButton: true });
            deps?.updateTimerDisplay?.();
            deps?.updateProgressBar?.();
            clearSavedSession();
        }

        deps?.applySelectedTaskUi?.(task);

        if (!shouldSkipTimerSync) {
            const nextTotalTime = deps?.getTaskFocusDurationSeconds?.(task) ?? getDefaultFocusDurationSeconds();
            const fractionDone = Number(task.completedPomodoros || 0) % 1;
            const nextTimeLeft = fractionDone > 0
                ? Math.round(nextTotalTime * (1 - fractionDone))
                : nextTotalTime;

            deps?.setTotalTimerTime?.(nextTotalTime);
            deps?.setTimeLeft?.(nextTimeLeft);
            deps?.updateTimerDisplay?.();
            deps?.updateProgressBar?.();
        }

        finalizeSelectionUi();
    };

    const selectTask = (taskId, options = {}) => {
        const { skipTimerSync = false, onComplete = null } = options;
        const state = getState();

        if (!state.currentTask && state.currentMode === FOCUS_MODE && state.timeLeft < state.totalTimerTime) {
            appendFreeFocusHistory();
            deps?.pauseTimer?.();
            performTaskSelection(taskId, { skipTimerSync });
            onComplete?.();
            return;
        }

        const isCurrentTaskDifferent = state.currentTask ? state.currentTask.id !== taskId : false;
        const hasProgress = isCurrentTaskDifferent && state.currentMode === FOCUS_MODE && state.timeLeft < state.totalTimerTime;

        if (!hasProgress) {
            performTaskSelection(taskId, { skipTimerSync });
            onComplete?.();
            return;
        }

        deps?.showTaskSwitchPrompt?.({
            currentTask: state.currentTask,
            targetTask: state.tasks.find((item) => item.id === taskId) ?? null,
            onDiscard: () => {
                deps?.resetTimer?.();
                performTaskSelection(taskId, { skipTimerSync });
                onComplete?.();
            },
            onSave: () => {
                persistCurrentTaskProgressForLater();
                deps?.pauseTimer?.();
                deps?.setCurrentTask?.(null);
                performTaskSelection(taskId, { skipTimerSync });
                onComplete?.();
            },
            onCancel: () => {}
        });
    };

    const startTask = (taskId) => {
        const state = getState();

        if (state.currentTask && state.currentTask.id === taskId) {
            if (state.currentMode !== FOCUS_MODE) {
                deps?.setTimerMode?.(FOCUS_MODE);
            }
            if (!getState().isTimerRunning) {
                deps?.toggleTimer?.();
            }
            return;
        }

        selectTask(taskId, {
            skipTimerSync: false,
            onComplete: () => {
                const nextState = getState();
                if (nextState.currentTask && !nextState.currentTask.completed && !nextState.isTimerRunning) {
                    if (nextState.currentMode !== FOCUS_MODE) {
                        deps?.setTimerMode?.(FOCUS_MODE);
                    }
                    deps?.toggleTimer?.();
                }
            }
        });
    };

    const toggleTaskComplete = (taskId) => {
        const state = getState();
        const task = state.tasks.find((item) => item.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        deps?.saveTasks?.();

        if (task.completed) {
            deps?.showTaskSuccessModal?.(task.name);
            if (state.currentTask?.id === taskId) {
                deselectTask();
            }
        }

        renderTaskDomain();
    };

    const promptResumeSession = () => {
        const session = readSavedSession();
        if (!session) return;

        try {
            deps?.showResumeSessionPrompt?.({
                session,
                onDiscard: () => {
                    clearSavedSession();
                    deps?.checkWizardOnboarding?.();
                },
                onResume: () => {
                    clearSavedSession();

                    if (session.taskId) {
                        const state = getState();
                        const targetTask = state.tasks.find((task) => task.id === session.taskId);
                        if (!targetTask || targetTask.completed) {
                            deps?.showGlassToast?.('A tarefa da sessao ja foi concluida ou excluida.');
                            deps?.checkWizardOnboarding?.();
                            return;
                        }

                        selectTask(session.taskId, { skipTimerSync: true });
                        deps?.setCurrentMode?.(FOCUS_MODE);
                        deps?.setTimeLeft?.(session.timeLeft);
                        deps?.setTotalTimerTime?.(session.totalTimerTime);
                        deps?.applyTimerModeUi?.({ mode: FOCUS_MODE, resetToggleButton: true });
                        deps?.updateTimerDisplay?.();
                        deps?.updateProgressBar?.();
                        deps?.renderTasksSidebar?.();
                        deps?.toggleTimer?.();
                        return;
                    }

                    deselectTask();
                    deps?.applyFreeFocusUi?.({ category: session.category || 'Livre' });
                    deps?.setCurrentMode?.(FOCUS_MODE);
                    deps?.setTimeLeft?.(session.timeLeft);
                    deps?.setTotalTimerTime?.(session.totalTimerTime);
                    deps?.applyTimerModeUi?.({ mode: FOCUS_MODE, resetToggleButton: true });
                    deps?.updateTimerDisplay?.();
                    deps?.updateProgressBar?.();
                    deps?.toggleTimer?.();
                }
            });
        } catch (error) {
            console.warn('Falha ao retomar sessao salva:', error);
            clearSavedSession();
            deps?.checkWizardOnboarding?.();
        }
    };

    const createTaskFromAssistant = (draft, startNow = true) => {
        const safeName = deps?.normalizeTaskName?.(draft?.name || '') || String(draft?.name || '').trim();
        const safeCategory = draft?.category || 'Livre';
        const safeMinutes = Math.max(1, Math.round(Number(draft?.durationMinutes) || Number(deps?.pomodoroMinutes) || 25));
        const pomodoroMinutes = Number(deps?.pomodoroMinutes) || 25;
        const task = {
            id: Date.now(),
            name: safeName,
            estimatedMinutes: safeMinutes,
            pomodoros: Math.max(1, Math.ceil(safeMinutes / pomodoroMinutes)),
            category: safeCategory,
            completedPomodoros: 0,
            completed: false,
            subtasks: [],
            createdAt: new Date().toISOString()
        };

        getState().tasks.push(task);
        deps?.saveTasks?.();
        renderTaskDomain();
        deps?.syncStateToPip?.();

        if (startNow) {
            startTask(task.id);
        }

        return task;
    };

    window.FocoZenTaskSessionService = Object.freeze({
        configure,
        startTask,
        selectTask,
        performTaskSelection,
        deselectTask,
        toggleTaskComplete,
        createTaskFromAssistant,
        readSavedSession,
        saveSavedSession,
        promptResumeSession
    });
})();
