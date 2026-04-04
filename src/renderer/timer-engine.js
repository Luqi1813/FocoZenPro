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
