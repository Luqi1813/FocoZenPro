(() => {
    let deps = null;

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenLegacyTimer;
    };

    const getState = () => ({
        currentMode: deps?.getCurrentMode?.() ?? 'focus',
        timeLeft: deps?.getTimeLeft?.() ?? 0,
        totalTimerTime: deps?.getTotalTimerTime?.() ?? 0,
        isTimerRunning: deps?.getIsTimerRunning?.() ?? false
    });

    const getModeLabel = (mode) => {
        if (mode === 'shortBreak') return 'Pausa Curta';
        if (mode === 'longBreak') return 'Pausa Longa';
        return 'Per\u00edodo de Foco';
    };

    const updateDisplay = () => {
        const display = document.getElementById('timerDisplay');
        if (!display) return;

        const { timeLeft } = getState();
        const timeString = deps?.timerCore?.formatTimerLabel
            ? deps.timerCore.formatTimerLabel(timeLeft)
            : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

        display.textContent = timeString;
        document.title = `${timeString} - FocoZen Pro`;
    };

    const updateProgressBar = () => {
        const progressBar = document.getElementById('timerProgress');
        if (!progressBar) return;

        const { timeLeft, totalTimerTime } = getState();
        const progress = deps?.timerCore?.getTimerProgress
            ? deps.timerCore.getTimerProgress({ timeLeft, totalTime: totalTimerTime })
            : (totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0);

        progressBar.style.width = `${progress}%`;
    };

    const setRunningUi = (isRunning = false) => {
        const toggleButton = document.getElementById('timerToggle');
        const icon = toggleButton?.querySelector('i');
        if (!icon) return;

        icon.className = isRunning ? 'fas fa-pause' : 'fas fa-play';
    };

    const applyModeUi = ({ mode = 'focus', resetToggleButton = true } = {}) => {
        const label = document.getElementById('timeLabel');
        if (label) label.textContent = getModeLabel(mode);

        if (resetToggleButton) {
            setRunningUi(false);
        }

        document.querySelectorAll('.mode-btn').forEach((button) => {
            button.classList.toggle('active', button.dataset.mode === mode);
        });
    };

    const syncUi = () => {
        const { currentMode, isTimerRunning } = getState();
        applyModeUi({ mode: currentMode, resetToggleButton: !isTimerRunning });
        setRunningUi(isTimerRunning);
        updateDisplay();
        updateProgressBar();
    };

    const init = () => {
        window.toggleTaskTimer = deps?.onToggleTimer;
        Object.defineProperty(window, 'isTimerRunning', {
            configurable: true,
            get: () => deps?.getIsTimerRunning?.()
        });

        document.querySelectorAll('.mode-btn').forEach((button) => {
            if (button.dataset.bound) return;
            button.dataset.bound = 'true';
            button.addEventListener('click', () => {
                deps?.onSetMode?.(button.dataset.mode);
            });
        });

        const toggleButton = document.getElementById('timerToggle');
        if (toggleButton && !toggleButton.dataset.bound) {
            toggleButton.dataset.bound = 'true';
            toggleButton.addEventListener('click', () => deps?.onToggleTimer?.());
        }

        const resetButton = document.getElementById('timerReset');
        if (resetButton && !resetButton.dataset.bound) {
            resetButton.dataset.bound = 'true';
            resetButton.addEventListener('click', () => deps?.onResetTimer?.());
        }

        const increaseButton = document.getElementById('increaseTime5');
        if (increaseButton && !increaseButton.dataset.bound) {
            increaseButton.dataset.bound = 'true';
            increaseButton.addEventListener('click', () => deps?.onAdjustTime?.(5));
        }

        const decreaseButton = document.getElementById('decreaseTime5');
        if (decreaseButton && !decreaseButton.dataset.bound) {
            decreaseButton.dataset.bound = 'true';
            decreaseButton.addEventListener('click', () => deps?.onAdjustTime?.(-5));
        }

        syncUi();
    };

    window.FocoZenLegacyTimer = Object.freeze({
        configure,
        init,
        syncUi,
        applyModeUi,
        setRunningUi,
        updateDisplay,
        updateProgressBar
    });
})();
