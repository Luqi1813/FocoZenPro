(() => {
    let deps = null;
    let breathInterval = null;
    let breathPhaseTimer = null;

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenLegacyHome;
    };

    const getState = () => ({
        currentTask: deps?.getCurrentTask?.() ?? null,
        currentMode: deps?.getCurrentMode?.() ?? 'focus',
        timeLeft: deps?.getTimeLeft?.() ?? 0,
        totalTimerTime: deps?.getTotalTimerTime?.() ?? 0,
        isTimerRunning: deps?.getIsTimerRunning?.() ?? false,
        showBubbleText: deps?.getShowBubbleText?.() ?? true,
        currentSoundId: deps?.getCurrentSoundId?.() ?? null,
        isPlaying: deps?.getIsPlaying?.() ?? false,
        masterVolume: Number(deps?.getMasterVolume?.() ?? 0.7),
        isMuted: deps?.getIsMuted?.() ?? false,
        userCategories: deps?.getUserCategories?.() ?? []
    });

    const getCurrentSoundConfig = () => {
        const { currentSoundId } = getState();
        return (deps?.soundsConfig ?? []).find((sound) => sound.id === currentSoundId) || null;
    };

    const changeBackground = (imageName) => {
        const background = document.getElementById('dynamicBg');
        if (background && imageName) {
            background.style.backgroundImage = `url('assets/images/${imageName}')`;
        }
    };

    const applyDefaultBackground = () => {
        changeBackground('default.jpg');
    };

    const updateHomeVolumeDisplay = () => {
        const { masterVolume } = getState();
        const volume = Math.round(masterVolume * 100);
        const valueEl = document.getElementById('volumeValue');
        const slider = document.getElementById('masterVolume');

        if (valueEl) valueEl.textContent = `${volume}%`;
        if (slider && !slider.matches(':active')) slider.value = String(volume);
    };

    const updateHomePlayButton = () => {
        const { isPlaying } = getState();
        const button = document.getElementById('masterPlayPause');
        const icon = button?.querySelector('i');
        if (!button || !icon) return;

        button.classList.toggle('playing', isPlaying);
        icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    };

    const applyAudioStateToUi = () => {
        const { currentSoundId, isMuted } = getState();
        const currentSound = getCurrentSoundConfig();
        const soundName = currentSound?.name || 'Nenhum som selecionado';
        const soundTheme = currentSound ? (deps?.soundThemes?.[currentSound.id] || 'default') : 'default';

        document.documentElement.setAttribute('data-sound', soundTheme);

        const nowPlaying = document.getElementById('nowPlaying');
        if (nowPlaying) {
            nowPlaying.innerHTML = `<i class="fas fa-music"></i><span>${soundName}</span>`;
        }

        document.querySelectorAll('.sound-card').forEach((card) => {
            card.classList.toggle('active', card.dataset.soundId === currentSoundId);
        });

        if (currentSound?.image) {
            changeBackground(currentSound.image);
        } else {
            applyDefaultBackground();
        }

        const muteButton = document.getElementById('btnMuteToggle');
        const muteIcon = muteButton?.querySelector('i');
        if (muteIcon) {
            muteIcon.className = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }

        updateHomeVolumeDisplay();
        updateHomePlayButton();
    };

    const selectSound = async (sound, cardElement = null) => {
        const result = await deps?.audioService?.selectSound?.(sound, {
            toggleOff: !!cardElement,
            autoplay: true
        });

        if (!result?.ok && result?.reason !== 'selection-superseded') {
            console.error('Erro audio:', result?.error || result?.reason || 'falha desconhecida');
        }
    };

    const toggleMute = () => {
        deps?.audioService?.toggleMute?.();
    };

    const toggleMasterPlay = async () => {
        const { currentSoundId } = getState();
        if (!currentSoundId) {
            deps?.showGlassToast?.('Selecione algum som para iniciar');
            return;
        }

        const result = await deps?.audioService?.togglePlay?.();
        if (!result?.ok && result?.reason !== 'no-sound-selected') {
            console.error('Erro ao alternar audio:', result?.error || result?.reason || 'falha desconhecida');
        }
    };

    const bindHomeAudioControls = () => {
        const playButton = document.getElementById('masterPlayPause');
        const muteButton = document.getElementById('btnMuteToggle');
        const volumeSlider = document.getElementById('masterVolume');

        if (playButton && !playButton.dataset.bound) {
            playButton.dataset.bound = 'true';
            playButton.addEventListener('click', toggleMasterPlay);
        }

        if (muteButton && !muteButton.dataset.bound) {
            muteButton.dataset.bound = 'true';
            muteButton.addEventListener('click', toggleMute);
        }

        if (volumeSlider && !volumeSlider.dataset.bound) {
            volumeSlider.dataset.bound = 'true';
            volumeSlider.addEventListener('input', (event) => {
                deps?.audioService?.setVolume?.(Number(event.target.value) / 100);
            });
        }
    };

    const renderSoundGrid = async () => {
        const container = document.getElementById('soundGrid');
        if (!container) return;

        const groupedSounds = deps?.audioService?.initialize
            ? await deps.audioService.initialize()
            : [];

        if (!groupedSounds.length) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Nenhum som encontrado.</p>';
            bindHomeAudioControls();
            applyAudioStateToUi();
            return;
        }

        container.innerHTML = '';

        for (const group of groupedSounds) {
            const categoryWrapper = document.createElement('div');
            categoryWrapper.className = 'sound-category-wrapper';
            categoryWrapper.innerHTML = `<div class="sound-category-title"><i class="fas ${group.icon}"></i> ${group.name}</div>`;

            const grid = document.createElement('div');
            grid.className = 'sound-grid';

            group.sounds.forEach((sound) => {
                const card = document.createElement('div');
                card.className = 'sound-card';
                card.dataset.soundId = sound.id;
                card.innerHTML = `<i class="fas ${sound.icon}"></i><span>${sound.name}</span>`;
                card.addEventListener('click', () => selectSound(sound, card));
                grid.appendChild(card);
            });

            categoryWrapper.appendChild(grid);
            container.appendChild(categoryWrapper);
        }

        bindHomeAudioControls();
        applyAudioStateToUi();
    };

    const updateCustomDropdownUI = (value) => {
        const item = document.querySelector(`.custom-dropdown-item[data-val="${value}"]`);
        if (!item) return;

        document.querySelectorAll('.custom-dropdown-item').forEach((entry) => entry.classList.remove('active'));
        item.classList.add('active');

        const triggerText = document.getElementById('catTriggerText');
        const triggerIcon = document.getElementById('catTriggerIcon');
        if (triggerText) triggerText.textContent = item.textContent.trim();
        if (triggerIcon) triggerIcon.className = item.querySelector('i')?.className || 'fas fa-tag';
    };

    const renderTimerDropdown = () => {
        const menu = document.getElementById('catMenu');
        const globalCategory = document.getElementById('globalCategorySelect');
        if (!menu || !globalCategory) return;

        const state = getState();
        const currentValue = globalCategory.value || 'Livre';
        menu.innerHTML = '';

        state.userCategories.forEach((category) => {
            const item = document.createElement('div');
            item.className = `custom-dropdown-item ${category.name === currentValue ? 'active' : ''}`;
            item.setAttribute('data-val', category.name);
            item.innerHTML = `<i class="fas ${category.icon || 'fa-tag'}"></i> ${category.name}`;
            item.onclick = (event) => {
                event.stopPropagation();

                const latestState = getState();
                const hasProgress = latestState.currentMode === 'focus' && latestState.timeLeft < latestState.totalTimerTime;
                if (latestState.isTimerRunning || hasProgress) {
                    deps?.customAlert?.('Sessao Ativa', 'Para mudar a categoria, reinicie o temporizador ou conclua a sessao atual.');
                    menu.classList.remove('show');
                    return;
                }

                if (latestState.currentTask) {
                    deps?.customAlert?.('Tarefa Vinculada', 'Para mudar a categoria, edite a tarefa (botao de lapis na barra lateral).');
                    menu.classList.remove('show');
                    return;
                }

                globalCategory.value = category.name;
                updateCustomDropdownUI(category.name);
                menu.classList.remove('show');
            };

            menu.appendChild(item);
        });
    };

    const bindCategoryDropdown = () => {
        const menu = document.getElementById('catMenu');
        const triggerButton = document.getElementById('catTriggerBtn');
        if (!menu || !triggerButton || triggerButton.dataset.bound) return;

        triggerButton.dataset.bound = 'true';
        triggerButton.addEventListener('click', (event) => {
            event.stopPropagation();
            menu.classList.toggle('show');
        });

        document.addEventListener('click', (event) => {
            if (!triggerButton.contains(event.target) && !menu.contains(event.target)) {
                menu.classList.remove('show');
            }
        });
    };

    const applySelectedTaskUi = (task) => {
        if (!task) return;

        const badge = document.getElementById('currentTaskBadge');
        if (badge) {
            badge.textContent = task.name.substring(0, 15) + (task.name.length > 15 ? '...' : '');
            badge.className = 'task-badge task-mode';
        }

        document.getElementById('btnFreeFocus')?.classList.remove('hidden');
        const globalCategory = document.getElementById('globalCategorySelect');
        if (globalCategory) globalCategory.value = task.category || 'Livre';
        updateCustomDropdownUI(task.category || 'Livre');
    };

    const applyFreeFocusUi = ({ category = 'Livre' } = {}) => {
        const badge = document.getElementById('currentTaskBadge');
        if (badge) {
            badge.textContent = 'Sessao Livre';
            badge.className = 'task-badge free-mode';
        }

        document.getElementById('btnFreeFocus')?.classList.add('hidden');
        const globalCategory = document.getElementById('globalCategorySelect');
        if (globalCategory) globalCategory.value = category;
        updateCustomDropdownUI(category);
    };

    const persistShowBubbleText = (value) => {
        deps?.setShowBubbleText?.(value);
        deps?.persistShowBubbleText?.(value);
    };

    const toggleBubbleText = () => {
        const nextValue = !getState().showBubbleText;
        persistShowBubbleText(nextValue);

        const centerText = document.getElementById('bubbleCenterText');
        const icon = document.querySelector('#btnToggleBubbleText i');

        if (nextValue) {
            centerText?.classList.remove('hidden-text');
            if (icon) icon.className = 'fas fa-eye';
        } else {
            centerText?.classList.add('hidden-text');
            if (icon) icon.className = 'fas fa-eye-slash';
        }
    };

    const getTaskProgressPercent = (state) => {
        let percent = 0;

        if (state.currentTask?.pomodoros > 0) {
            percent = (state.currentTask.completedPomodoros / state.currentTask.pomodoros) * 100;
        }

        if (state.currentMode === 'focus' && state.totalTimerTime > 0) {
            const currentTimerFraction = deps?.timerCore?.getTimerProgress
                ? (deps.timerCore.getTimerProgress({ timeLeft: state.timeLeft, totalTime: state.totalTimerTime }) / 100)
                : ((state.totalTimerTime - state.timeLeft) / state.totalTimerTime);

            if (state.currentTask?.pomodoros > 0) {
                percent = ((state.currentTask.completedPomodoros + currentTimerFraction) / state.currentTask.pomodoros) * 100;
            } else {
                percent = currentTimerFraction * 100;
            }
        }

        return Math.max(0, Math.min(100, percent));
    };

    const renderProgress = () => {
        const content = document.getElementById('progressContent');
        if (!content) return;

        const state = getState();
        const percent = getTaskProgressPercent(state);
        const title = state.currentTask ? state.currentTask.name : 'Sessao Livre de Foco';
        const hiddenClass = state.showBubbleText ? '' : 'hidden-text';

        content.innerHTML = `
            <div class="task-progress-display">
                <h4>${title}</h4>
                <div class="sand-bubble-container ${state.isTimerRunning && state.currentMode === 'focus' ? 'running' : ''}" style="--fill-percent: ${percent}%;">
                    <div class="liquid-wave-wrapper">
                        <svg class="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                            <path d="M0,12 Q17.5,0 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-primary)" opacity="0.7"/>
                        </svg>
                        <svg class="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                            <path d="M0,12 Q17.5,24 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-secondary)" opacity="0.4"/>
                        </svg>
                    </div>
                    <div class="sand-bubble-center ${hiddenClass}" id="bubbleCenterText">
                        <div class="pomodoro-count" id="bubblePercentage">${Math.floor(percent)}%</div>
                    </div>
                </div>
            </div>`;
    };

    const updateTaskBubbleProgress = () => {
        const state = getState();
        const percent = getTaskProgressPercent(state);

        if (state.currentTask && state.currentTask.pomodoros > 0) {
            const sidebarBar = document.getElementById(`sidebar-prog-${state.currentTask.id}`);
            const sidebarPercentText = document.getElementById(`sidebar-percent-${state.currentTask.id}`);
            if (sidebarBar) sidebarBar.style.width = `${percent}%`;
            if (sidebarPercentText) sidebarPercentText.textContent = `${Math.floor(percent)}%`;
        }

        const container = document.querySelector('.sand-bubble-container');
        if (container) container.style.setProperty('--fill-percent', `${percent}%`);

        const percentageElement = document.getElementById('bubblePercentage');
        if (percentageElement) percentageElement.textContent = `${Math.floor(percent)}%`;
    };

    const initBreath = () => {
        const openButton = document.getElementById('btnOpenBreathSession');
        const closeButton = document.getElementById('closeBreathActive');
        const infoButton = document.getElementById('breathInfo');
        const closeInfoButton = document.getElementById('closeBreathInfo');
        const closeInfoFooterButton = document.getElementById('closeBreathInfoBtn');

        if (openButton && !openButton.dataset.bound) {
            openButton.dataset.bound = 'true';
            openButton.addEventListener('click', startBreathSession);
        }

        if (closeButton && !closeButton.dataset.bound) {
            closeButton.dataset.bound = 'true';
            closeButton.addEventListener('click', stopBreathSession);
        }

        if (infoButton && !infoButton.dataset.bound) {
            infoButton.dataset.bound = 'true';
            infoButton.addEventListener('click', () => document.getElementById('breathInfoModal')?.classList.add('active'));
        }

        if (closeInfoButton && !closeInfoButton.dataset.bound) {
            closeInfoButton.dataset.bound = 'true';
            closeInfoButton.addEventListener('click', () => document.getElementById('breathInfoModal')?.classList.remove('active'));
        }

        if (closeInfoFooterButton && !closeInfoFooterButton.dataset.bound) {
            closeInfoFooterButton.dataset.bound = 'true';
            closeInfoFooterButton.addEventListener('click', () => document.getElementById('breathInfoModal')?.classList.remove('active'));
        }
    };

    const startBreathSession = () => {
        document.getElementById('breathActiveModal')?.classList.add('active');
        const circle = document.getElementById('breathActiveCircle');
        if (circle) {
            circle.className = 'breath-active-circle';
            void circle.offsetWidth;
        }

        const phaseTitle = document.getElementById('breathPhaseTitle');
        const timeText = document.getElementById('breathTimeText');
        if (phaseTitle) phaseTitle.textContent = 'Prepare-se...';
        if (timeText) timeText.textContent = '';

        setTimeout(runBreathCycleLogic, 500);
    };

    const stopBreathSession = () => {
        document.getElementById('breathActiveModal')?.classList.remove('active');
        clearTimeout(breathPhaseTimer);
        clearInterval(breathInterval);

        const circle = document.getElementById('breathActiveCircle');
        if (circle) circle.className = 'breath-active-circle';
    };

    const runBreathCycleLogic = () => {
        clearTimeout(breathPhaseTimer);
        clearInterval(breathInterval);

        const modal = document.getElementById('breathActiveModal');
        const circle = document.getElementById('breathActiveCircle');
        const phaseText = document.getElementById('breathPhaseTitle');
        const timeText = document.getElementById('breathTimeText');
        if (!modal || !circle || !phaseText || !timeText) return;

        let phaseTimeLeft = 0;

        const updateTick = () => {
            timeText.textContent = String(phaseTimeLeft);
            phaseTimeLeft -= 1;
        };

        const startInhale = () => {
            if (!modal.classList.contains('active')) return;
            phaseTimeLeft = 4;
            circle.className = 'breath-active-circle';
            void circle.offsetWidth;
            circle.className = 'breath-active-circle breath-state-inhale';
            phaseText.textContent = 'Inspire';
            updateTick();
            breathInterval = setInterval(updateTick, 1000);
            breathPhaseTimer = setTimeout(() => {
                clearInterval(breathInterval);
                startHold();
            }, 4000);
        };

        const startHold = () => {
            if (!modal.classList.contains('active')) return;
            phaseTimeLeft = 7;
            circle.className = 'breath-active-circle';
            void circle.offsetWidth;
            circle.className = 'breath-active-circle breath-state-hold';
            phaseText.textContent = 'Segure';
            updateTick();
            breathInterval = setInterval(updateTick, 1000);
            breathPhaseTimer = setTimeout(() => {
                clearInterval(breathInterval);
                startExhale();
            }, 7000);
        };

        const startExhale = () => {
            if (!modal.classList.contains('active')) return;
            phaseTimeLeft = 8;
            circle.className = 'breath-active-circle';
            void circle.offsetWidth;
            circle.className = 'breath-active-circle breath-state-exhale';
            phaseText.textContent = 'Expire';
            updateTick();
            breathInterval = setInterval(updateTick, 1000);
            breathPhaseTimer = setTimeout(() => {
                clearInterval(breathInterval);
                startInhale();
            }, 8000);
        };

        startInhale();
    };

    const handleFreeFocusAction = () => {
        const state = getState();
        const hasProgress = state.currentMode === 'focus' && state.timeLeft < state.totalTimerTime;

        if (hasProgress && typeof deps?.attemptDeselectTask === 'function') {
            deps.attemptDeselectTask(false);
            return;
        }

        if (state.currentTask) {
            deps?.taskSessionService?.deselectTask?.();
        }
    };

    const init = async () => {
        const toggleBubbleButton = document.getElementById('btnToggleBubbleText');
        const newTaskButton = document.getElementById('btnNewTaskHeader');
        const freeFocusButton = document.getElementById('btnFreeFocus');
        const bubbleIcon = document.querySelector('#btnToggleBubbleText i');

        if (bubbleIcon) {
            bubbleIcon.className = getState().showBubbleText ? 'fas fa-eye' : 'fas fa-eye-slash';
        }

        if (newTaskButton && !newTaskButton.dataset.bound) {
            newTaskButton.dataset.bound = 'true';
            newTaskButton.addEventListener('click', () => deps?.openCreateModal?.());
        }

        if (freeFocusButton && !freeFocusButton.dataset.bound) {
            freeFocusButton.dataset.bound = 'true';
            freeFocusButton.addEventListener('click', handleFreeFocusAction);
        }

        if (toggleBubbleButton && !toggleBubbleButton.dataset.bound) {
            toggleBubbleButton.dataset.bound = 'true';
            toggleBubbleButton.addEventListener('click', toggleBubbleText);
        }

        bindCategoryDropdown();
        initBreath();
        renderTimerDropdown();
        await renderSoundGrid();
        renderProgress();
    };

    window.FocoZenLegacyHome = Object.freeze({
        configure,
        init,
        renderSoundGrid,
        renderProgress,
        updateTaskBubbleProgress,
        applyAudioStateToUi,
        applySelectedTaskUi,
        applyFreeFocusUi,
        renderTimerDropdown,
        updateCustomDropdownUI,
        toggleBubbleText
    });
})();
