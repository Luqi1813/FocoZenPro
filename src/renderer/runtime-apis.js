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

function getPeriodLabel(period) {
    switch (period) {
        case 'day': return 'Hoje';
        case 'week': return 'Esta semana';
        case 'month': return 'Este mês';
        default: return 'Esta semana';
    }
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

function toggleTaskTimer() {
    return toggleTimer();
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
        return window.editTask(taskId);
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

const motivationalRestartMessages = constantsService.motivationalRestartMessages;
