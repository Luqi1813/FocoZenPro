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

    try { initModals(); } catch(e) { console.error('Erro Modais:', e); }
    try { configureTaskSessionService(); } catch(e) { console.error('Erro Task Session:', e); }
    try { configureAudioService(); } catch(e) { console.error('Erro Audio Service:', e); }
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