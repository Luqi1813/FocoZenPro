(() => {
    const getModeDurationSeconds = ({
        mode,
        testMode,
        pomodoroMinutes,
        shortBreakMinutes,
        longBreakMinutes
    }) => {
        if (testMode) return 5;

        if (mode === 'shortBreak') return Math.max(1, Math.round((shortBreakMinutes || 0) * 60));
        if (mode === 'longBreak') return Math.max(1, Math.round((longBreakMinutes || 0) * 60));
        return Math.max(1, Math.round((pomodoroMinutes || 0) * 60));
    };

    const getTaskSessionDurationSeconds = ({ task, testMode, pomodoroMinutes }) => {
        if (!task) return getModeDurationSeconds({
            mode: 'focus',
            testMode,
            pomodoroMinutes,
            shortBreakMinutes: 0,
            longBreakMinutes: 0
        });

        const completedBlocks = Math.floor(task.completedPomodoros || 0);
        const totalMinutes = Number(task.estimatedMinutes) || pomodoroMinutes;
        const remainingMinutes = Math.max(0, totalMinutes - (completedBlocks * pomodoroMinutes));
        const nextBlockMinutes = remainingMinutes > 0 ? Math.min(pomodoroMinutes, remainingMinutes) : pomodoroMinutes;

        return testMode ? 5 : Math.max(1, Math.round(nextBlockMinutes * 60));
    };

    const getTimerProgress = ({ timeLeft, totalTime }) => {
        const safeTotalTime = Number(totalTime) || 0;
        if (safeTotalTime <= 0) return 0;

        const safeTimeLeft = Math.max(0, Number(timeLeft) || 0);
        const percentage = ((safeTotalTime - safeTimeLeft) / safeTotalTime) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    const formatTimerLabel = (totalSeconds) => {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
        const seconds = (safeSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const getTimerCompletionType = ({ currentMode, currentTask }) => {
        if (currentMode !== 'focus') return 'break-complete';
        if (currentTask && (Number(currentTask.completedPomodoros) + 1) >= Number(currentTask.pomodoros)) {
            return 'task-complete';
        }
        return 'focus-complete';
    };

    const buildHistoryEntry = ({ totalTimerTime, category, currentTask, now = new Date() }) => ({
        id: Date.now(),
        date: new Date(now).toISOString().split('T')[0],
        durationMinutes: Math.max(1, Math.round((Number(totalTimerTime) || 0) / 60)),
        category: category || 'Livre',
        taskId: currentTask ? currentTask.id : null
    });

    const buildPendingTaskResolution = ({ task, totalTimerTime, completionType }) => {
        if (!task) return null;

        return {
            taskId: task.id,
            compType: completionType,
            previousCompletedPomodoros: Math.max(0, (Number(task.completedPomodoros) || 0) - 1),
            previousEstimatedMinutes: Number(task.estimatedMinutes) || 0,
            sessionMinutes: Math.max(1, (Number(totalTimerTime) || 0) / 60)
        };
    };

    const computeExtendedTaskState = ({ task, pendingResolution, extraMinutes, totalTimerTime }) => {
        const safeExtraMinutes = Math.max(1, Number(extraMinutes) || 0);
        const previousEstimatedMinutes = Number(
            pendingResolution?.previousEstimatedMinutes ?? task?.estimatedMinutes
        ) || 0;
        const previousCompletedPomodoros = Number(
            pendingResolution?.previousCompletedPomodoros ?? Math.floor(task?.completedPomodoros || 0)
        ) || 0;
        const sessionMinutes = Number(
            pendingResolution?.sessionMinutes ?? Math.max(1, (Number(totalTimerTime) || 0) / 60)
        ) || 1;

        return {
            estimatedMinutes: previousEstimatedMinutes + safeExtraMinutes,
            completedPomodoros: previousCompletedPomodoros,
            nextTimeLeft: safeExtraMinutes * 60,
            nextTotalTime: (sessionMinutes + safeExtraMinutes) * 60
        };
    };

    const getTransitionTarget = ({ completionType, totalPomodorosToday, isPipModeActive, hasCurrentTask }) => {
        if (isPipModeActive) {
            return {
                modalPhase: null,
                shouldShowTaskPopup: false,
                shouldSyncPipCompletion: true
            };
        }

        if (completionType === 'task-complete' && hasCurrentTask) {
            return {
                modalPhase: null,
                shouldShowTaskPopup: true,
                shouldSyncPipCompletion: false
            };
        }

        return {
            modalPhase: completionType === 'focus-complete' ? 'break' : 'focus',
            shouldShowTaskPopup: false,
            shouldSyncPipCompletion: false
        };
    };

    window.FocoZenTimerCore = Object.freeze({
        getModeDurationSeconds,
        getTaskSessionDurationSeconds,
        getTimerProgress,
        formatTimerLabel,
        getTimerCompletionType,
        buildHistoryEntry,
        buildPendingTaskResolution,
        computeExtendedTaskState,
        getTransitionTarget
    });
})();
