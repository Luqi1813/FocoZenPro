(() => {
    const calculateTaskFocusDurationSeconds = ({ task = null, testMode = false, pomodoroMinutes = 25 } = {}) => {
        if (!task) return testMode ? 5 : pomodoroMinutes * 60;

        const completedBlocks = Math.floor(task.completedPomodoros || 0);
        const totalMinutes = Number(task.estimatedMinutes) || pomodoroMinutes;
        const remainingMinutes = Math.max(0, totalMinutes - (completedBlocks * pomodoroMinutes));
        const nextBlockMinutes = remainingMinutes > 0 ? Math.min(pomodoroMinutes, remainingMinutes) : pomodoroMinutes;

        return testMode ? 5 : Math.max(1, Math.round(nextBlockMinutes * 60));
    };

    const formatClockTime = (totalSeconds = 0) => {
        const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
        const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
        const seconds = (safeSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const calculateProgressPercentage = ({ timeLeft = 0, totalTime = 0 } = {}) => {
        const safeTotalTime = Number(totalTime) || 0;
        if (safeTotalTime <= 0) return 0;

        const safeTimeLeft = Math.max(0, Number(timeLeft) || 0);
        const progress = ((safeTotalTime - safeTimeLeft) / safeTotalTime) * 100;
        return Math.max(0, Math.min(100, progress));
    };

    const pickRandomItem = (items = []) => {
        if (!Array.isArray(items) || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)] ?? null;
    };

    window.FocoZenUtils = Object.freeze({
        calculateTaskFocusDurationSeconds,
        formatClockTime,
        calculateProgressPercentage,
        pickRandomItem
    });
})();
