const soundsConfig = [
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

const soundCategories = {
    'Natureza': { icon: 'fa-leaf', ids: ['chuva', 'oceano', 'floresta', 'fogueira'] },
    'Música & Foco': { icon: 'fa-headphones', ids: ['teclado', 'classica', 'Jazz', 'Lo-fi'] },
    'Frequências': { icon: 'fa-wave-square', ids: ['Brown noise', 'Pink noise', '40hz'] }
};

const soundThemes = {
    'chuva': 'water', 'oceano': 'water', 'floresta': 'nature', 'fogueira': 'fire',
    'teclado': 'yellow', 'classica': 'classica', 'Jazz': 'jazz', 'Lo-fi': 'lofi',
    'Brown noise': 'brown', 'Pink noise': 'pink', '40hz': 'sky'
};

const quotes = [
    { text: "A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.", author: "Albert Einstein" },
    { text: "O conhecimento é a única riqueza que se expande quando compartilhada.", author: "Sócrates" },
    { text: "Não espere por circunstâncias ideais. Comece agora.", author: "Sêneca" }
];

const successQuotes = [
    { text: "A vitória pertence ao mais perseverante.", author: "Napoleão Bonaparte" },
    { text: "Não é porque as coisas são difíceis que não ousamos; é porque não ousamos que elas são difíceis.", author: "Sêneca" },
    { text: "O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill" },
    { text: "Faça o que puder, com o que tiver, onde estiver.", author: "Theodore Roosevelt" },
    { text: "A disciplina é a ponte entre metas e realizações.", author: "Jim Rohn" },
    { text: "Você não precisa ser grande para começar, mas precisa começar para ser grande.", author: "Zig Ziglar" }
];

const POMODORO_MINUTES = 25;
const SHORT_BREAK_MINUTES = 5;
const LONG_BREAK_MINUTES = 15;

const defaultCategories = [
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
let completedPomodoros = 0;
let totalPomodorosToday = 0;
let isDeleteMode = false;
let selectedTasksForDelete = new Set();
let tempSubtasks = [];
let editingTaskId = null;
let showBubbleText = true;
let isPipModeActive = false;
let toastHideTimer = null;
let testMode = false;
let pendingCompletionType = null;

let breathInterval;
let breathPhaseTimer;

// INICIALIZAÇÃO BLINDADA
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Iniciando FocoZen Pro...");

    try {
        tasks = JSON.parse(localStorage.getItem('focozen_tasks')) || [];
        totalPomodorosToday = parseInt(localStorage.getItem('focozen_total_pomodoros')) || 0;
        showBubbleText = localStorage.getItem('focozen_show_bubble_text') !== 'false';
        focusHistory = JSON.parse(localStorage.getItem('focozen_history')) || [];
        
        username = localStorage.getItem('focozen_username');
        if (username) {
            const input = document.getElementById('usernameInput');
            if(input) input.value = username;
        } else {
            username = 'Mestre Zen';
        }
    } catch(e) { console.error('Erro de Storage:', e); tasks = []; }

    try { updateSidebarProfile(); initNavigation(); } catch(e) { console.error('Erro Navegação:', e); }
    try { loadDailyQuote(); } catch(e) { console.error('Erro Quote:', e); }
    try { await initSoundSelector(); } catch(e) { console.error('Erro Sons:', e); }
    try { initTimer(); } catch(e) { console.error('Erro Timer:', e); }
    try { initBreath(); } catch(e) { console.error('Erro Respiração:', e); }
    try { initModals(); } catch(e) { console.error('Erro Modais:', e); }
    try { initTaskForm(); } catch(e) { console.error('Erro Formulário:', e); }
    try { initSidebarControls(); } catch(e) { console.error('Erro Sidebar:', e); }
    try { initPipIntegration(); } catch(e) { console.error('Erro PIP:', e); }

    // ATUALIZAÇÃO FORÇADA DAS LISTAS PARA CORRIGIR O BUG "NENHUMA TAREFA"
    try {
        renderTasksList();
        renderTasksSidebar();
        deselectTask();
    } catch(e) { console.error('Erro Render Inicial:', e); }

    try { updateVolumeDisplay(); } catch(e) { console.error('Erro Volume:', e); }
    try { updateHeaderTaskCount(); } catch(e) { console.error('Erro Count:', e); }
    try { applyDefaultBackground(); } catch(e) { console.error('Erro Background:', e); }

    try {
        const icon = document.querySelector('#btnToggleBubbleText i');
        if(icon) icon.className = showBubbleText ? 'fas fa-eye' : 'fas fa-eye-slash';

        document.getElementById('btnFreeFocus')?.addEventListener('click', () => attemptDeselectTask(false));
        document.getElementById('btnToggleBubbleText')?.addEventListener('click', toggleBubbleText);
        
        // Custom Category Dropdown Logic
        window.updateCustomDropdownUI = function(val) {
            const item = document.querySelector(`.custom-dropdown-item[data-val="${val}"]`);
            if(item) {
                document.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const triggerText = document.getElementById('catTriggerText');
                const triggerIcon = document.getElementById('catTriggerIcon');
                if(triggerText) triggerText.textContent = item.textContent.trim();
                if(triggerIcon) triggerIcon.className = item.querySelector('i').className;
            }
        };

        const catMenu = document.getElementById('catMenu');
        const catTriggerBtn = document.getElementById('catTriggerBtn');
        if (catTriggerBtn && catMenu) {
            catTriggerBtn.addEventListener('click', (e) => { e.stopPropagation(); catMenu.classList.toggle('show'); });
            document.addEventListener('click', (e) => {
                if (!catTriggerBtn.contains(e.target) && !catMenu.contains(e.target)) catMenu.classList.remove('show');
            });
        }
        
        userCategories = JSON.parse(localStorage.getItem('focozen_categories')) || defaultCategories;
        if (window.renderTimerDropdown) window.renderTimerDropdown();
        if (window.renderCategoryChips) window.renderCategoryChips();
        
        document.getElementById('btnEditCategories')?.addEventListener('click', () => {
            if(window.toggleCategoryEdit) window.toggleCategoryEdit();
        });

        if (window.electronAPI && window.electronAPI.onAppCloseRequested) {
            window.electronAPI.onAppCloseRequested(() => attemptDeselectTask(true));
        }

    } catch(e) { console.error('Erro Listeners Extras:', e); }

    // RETAIN INCOMPLETE SESSIONS ON BOOT
    if (localStorage.getItem('focozen_saved_session')) {
        setTimeout(() => window.promptResumeSession(), 1500);
    } else {
        setTimeout(() => { 
            if (!localStorage.getItem('focozen_username')) {
                document.getElementById('wizardModal')?.classList.add('active');
            }
        }, 1200);
    }
});

// ==========================================
// CATEGORY ENGINE (V2)
// ==========================================
window.renderTimerDropdown = function() {
    const menu = document.getElementById('catMenu');
    if (!menu) return;
    const currentVal = document.getElementById('globalCategorySelect')?.value || 'Livre';
    menu.innerHTML = '';
    userCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = `custom-dropdown-item ${cat.name === currentVal ? 'active' : ''}`;
        item.setAttribute('data-val', cat.name);
        item.innerHTML = `<i class="fas ${cat.icon || 'fa-tag'}"></i> ${cat.name}`;
        item.onclick = (e) => {
            e.stopPropagation();
            const hasProgress = currentMode === 'focus' && timeLeft < totalTimerTime;
            if (isTimerRunning || hasProgress) {
                customAlert('Sessão Ativa', 'Para mudar a categoria, reinicie o temporizador ou conclua a sessão atual.');
                menu.classList.remove('show');
                return;
            }
            if (currentTask) {
                customAlert('Tarefa Vinculada', 'Para mudar a categoria, edite a tarefa (botão de lápis na barra lateral).');
                menu.classList.remove('show');
                return;
            }
            document.getElementById('globalCategorySelect').value = cat.name;
            if(window.updateCustomDropdownUI) window.updateCustomDropdownUI(cat.name);
            menu.classList.remove('show');
            if (currentTask) { currentTask.category = cat.name; saveTasks(); renderTasksSidebar(); }
        };
        menu.appendChild(item);
    });
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
                localStorage.setItem('focozen_categories', JSON.stringify(userCategories));
                renderCategoryChips();
                renderTimerDropdown();
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
                    localStorage.setItem('focozen_categories', JSON.stringify(userCategories));
                    renderTimerDropdown();
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
             if(window.updateCustomDropdownUI) window.updateCustomDropdownUI(primaryCat);
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
    localStorage.setItem('focozen_username', username);
    localStorage.setItem('focozen_wizard_categories', JSON.stringify(wizSelectedCats));
    updateSidebarProfile();
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
    const settingsName = document.getElementById('settingsPlayerSoundName');
    if (statsName) statsName.textContent = titleText;
    if (settingsName) settingsName.textContent = titleText;
    buildViewPlayerSounds('statsPlayerSounds');
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
    if (viewId === 'view-settings') {
        const input = document.getElementById('settingsNameInput');
        if (input) input.value = username;
    }
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
            localStorage.setItem('focozen_username', username);
            updateSidebarProfile();
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
            
            if (window.electronAPI && window.electronAPI.checkForUpdates) {
                window.electronAPI.checkForUpdates();
            } else {
                setTimeout(() => {
                    window._manualUpdateTriggered = false;
                    handleUpdateCheckResult({ 
                        available: false, 
                        message: 'Sistema de atualização não disponível em modo desenvolvimento.' 
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
// INTEGRAÇÃO PIP
// ==========================================
function initPipIntegration() {
    const btnEnterPip = document.getElementById('btnEnterPip');
    if (btnEnterPip) {
        btnEnterPip.addEventListener('click', () => {
            if (window.electronAPI && window.electronAPI.enterPip) {
                isPipModeActive = true;
                syncStateToPip();
                window.electronAPI.enterPip();
            }
        });
    }

    if (window.electronAPI && window.electronAPI.onPipAction) {
        window.electronAPI.onPipAction((action, data) => {
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
                        if ((comp === 'task-complete' || comp === 'focus-complete') && currentTask) {
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
            }
            else if (action === 'set-volume') {
                const parsedVolume = Number(data);
                if (Number.isNaN(parsedVolume)) return;
                masterVolume = Math.max(0, Math.min(1, parsedVolume));
                if (currentAudio) currentAudio.volume = masterVolume;
                const masterVolumeInput = document.getElementById('masterVolume');
                if (masterVolumeInput) masterVolumeInput.value = Math.round(masterVolume * 100);
                updateVolumeDisplay();
                syncStateToPip();
            }
        });
    }
}

function syncStateToPip(extraState = {}) {
    if (!window.electronAPI || !window.electronAPI.sendPipState) return;

    try {
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        const timeString = `${m}:${s}`;

        let progress = 0;
        if (totalTimerTime > 0) progress = ((totalTimerTime - timeLeft) / totalTimerTime) * 100;

        const activeCard = document.querySelector('.sound-card.active span');
        const soundName = activeCard ? activeCard.textContent : 'Silêncio';

        const taskName = currentTask ? currentTask.name : 'Sessão Livre';
        const soundObj = soundsConfig.find(s => s.id === currentSoundId);
        const bgImage = soundObj ? soundObj.image : 'default.jpg';
        const theme = soundThemes[currentSoundId] || 'default';

        window.electronAPI.sendPipState({
            timeString, progress, phase: currentMode,
            isRunning: isTimerRunning, soundName, isAudioPlaying: isPlaying,
            taskName, bgImage, theme, masterVolume, ...extraState
        });
    } catch (err) {
        console.error("Erro ao sincronizar PIP:", err);
    }
}

function toggleBubbleText() {
    showBubbleText = !showBubbleText;
    localStorage.setItem('focozen_show_bubble_text', showBubbleText);
    const centerText = document.getElementById('bubbleCenterText');
    const icon = document.querySelector('#btnToggleBubbleText i');
    if (showBubbleText) {
        centerText?.classList.remove('hidden-text');
        if (icon) icon.className = 'fas fa-eye';
    } else {
        centerText?.classList.add('hidden-text');
        if (icon) icon.className = 'fas fa-eye-slash';
    }
}

function changeBackground(imageName) {
    const bg = document.getElementById('dynamicBg');
    if (bg && imageName) {
        bg.style.backgroundImage = `url('assets/images/${imageName}')`;
    }
}

function applyDefaultBackground() {
    changeBackground('default.jpg');
}

function loadDailyQuote() {
    try {
        const today = new Date().toDateString();
        let quoteIndex = parseInt(localStorage.getItem('focozen_quote_index'));
        if (isNaN(quoteIndex) || quoteIndex >= quotes.length || quoteIndex < 0) quoteIndex = 0;
        if (localStorage.getItem('focozen_last_quote_date') !== today) {
            quoteIndex = Math.floor(Math.random() * quotes.length);
            localStorage.setItem('focozen_quote_index', quoteIndex);
            localStorage.setItem('focozen_last_quote_date', today);
        }
        const quote = quotes[quoteIndex] || quotes[0];
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');
        if (quoteText) quoteText.textContent = `"${quote.text}"`;
        if (quoteAuthor) quoteAuthor.textContent = `— ${quote.author}`;
    } catch(e) { console.error(e); }
}

async function initSoundSelector() {
    const container = document.getElementById('soundGrid');

    let files = [];
    if (window.electronAPI && window.electronAPI.getAudioFiles) {
        files = await window.electronAPI.getAudioFiles() || [];
    }

    if (files.length === 0) {
        if(container) container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.8rem;">Nenhum som encontrado.</p>';
        return;
    }

    if(container) container.innerHTML = '';

    for (const [catName, catData] of Object.entries(soundCategories)) {
        const validSounds = soundsConfig.filter(s => catData.ids.includes(s.id) && files.includes(s.file));
        if (validSounds.length > 0) {
            if(container) {
                const catWrapper = document.createElement('div');
                catWrapper.className = 'sound-category-wrapper';
                catWrapper.innerHTML = `<div class="sound-category-title"><i class="fas ${catData.icon}"></i> ${catName}</div>`;
                const grid = document.createElement('div'); grid.className = 'sound-grid';

                validSounds.forEach(sound => {
                    const card = document.createElement('div');
                    card.className = 'sound-card'; card.dataset.soundId = sound.id;
                    card.innerHTML = `<i class="fas ${sound.icon}"></i><span>${sound.name}</span>`;
                    card.addEventListener('click', () => selectSound(sound, card));
                    grid.appendChild(card);
                });
                catWrapper.appendChild(grid); container.appendChild(catWrapper);
            }
        }
    }

    document.getElementById('masterPlayPause')?.addEventListener('click', toggleMasterPlay);
    document.getElementById('btnMuteToggle')?.addEventListener('click', toggleMute);
    document.getElementById('masterVolume')?.addEventListener('input', (e) => {
        masterVolume = e.target.value / 100;
        updateVolumeDisplay();
        if (currentAudio) currentAudio.volume = masterVolume;
        syncStateToPip();
    });
}

async function selectSound(sound, cardElement) {
    document.querySelectorAll('.sound-card').forEach(c => c.classList.remove('active'));
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.removeAttribute('src');
        currentAudio.load();
        currentAudio = null;
    }

    if (currentSoundId === sound.id && cardElement) {
        currentSoundId = null; isPlaying = false; updateMasterPlayButton();
        syncStateToPip();
        return;
    }

    if(cardElement) {
        cardElement.classList.add('active');
    } else {
        const card = document.querySelector(`.sound-card[data-sound-id="${sound.id}"]`);
        if(card) card.classList.add('active');
    }

    currentSoundId = sound.id;

    document.documentElement.setAttribute('data-sound', soundThemes[sound.id] || 'default');
    document.getElementById('nowPlaying').innerHTML = `<i class="fas fa-music"></i><span>${sound.name}</span>`;
    const statsName = document.getElementById('statsPlayerSoundName');
    const settingsName = document.getElementById('settingsPlayerSoundName');
    if (statsName) statsName.textContent = sound.name;
    if (settingsName) settingsName.textContent = sound.name;
    document.querySelectorAll('.vpa-sound-item').forEach(item => {
        item.classList.toggle('active', item.dataset.soundId === sound.id);
    });

    try {
        if (window.electronAPI && window.electronAPI.getAudioPath) {
            currentAudio = new Audio(await window.electronAPI.getAudioPath(sound.file));
            currentAudio.loop = true; currentAudio.volume = masterVolume;
            currentAudio.oncanplaythrough = async () => { await currentAudio.play(); isPlaying = true; updateMasterPlayButton(); };
        }
    } catch (e) { console.error('Erro audio:', e) }
    changeBackground(sound.image);
    syncStateToPip();
}

function toggleMute() {
    const btn = document.getElementById('btnMuteToggle');
    const slider = document.getElementById('masterVolume');
    if (isMuted) {
        masterVolume = volumeBeforeMute;
        isMuted = false;
        if (btn) btn.querySelector('i').className = 'fas fa-volume-up';
    } else {
        volumeBeforeMute = masterVolume;
        masterVolume = 0;
        isMuted = true;
        if (btn) btn.querySelector('i').className = 'fas fa-volume-mute';
    }
    if (currentAudio) currentAudio.volume = masterVolume;
    if (slider) slider.value = Math.round(masterVolume * 100);
    updateVolumeDisplay();
    const muteIcon = isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
    ['stats', 'settings'].forEach(prefix => {
        const muteBtn = document.getElementById(`${prefix}PlayerMuteBtn`);
        if (muteBtn) muteBtn.querySelector('i').className = muteIcon;
    });
    syncStateToPip();
}

function toggleMasterPlay() {
    if (!currentSoundId) {
        showGlassToast('Selecione algum som para iniciar');
        return;
    }
    isPlaying ? currentAudio?.pause() : currentAudio?.play();
    isPlaying = !isPlaying; updateMasterPlayButton();
}

function updateMasterPlayButton() {
    const masterVolumeSlider = document.getElementById('masterVolume');

    ['stats', 'settings'].forEach(prefix => {
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
        if (volSlider && masterVolumeSlider && !volSlider.dataset.bound) {
            volSlider.dataset.bound = true;
            volSlider.addEventListener('input', (e) => {
                masterVolumeSlider.value = e.target.value;
                masterVolumeSlider.dispatchEvent(new Event('input'));
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

    const btn = document.getElementById('masterPlayPause');
    if (isPlaying) {
        if(btn){ btn.classList.add('playing'); btn.querySelector('i').className = 'fas fa-pause'; }
    } else {
        if(btn){ btn.classList.remove('playing'); btn.querySelector('i').className = 'fas fa-play'; }
    }

    syncStateToPip();
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
    document.getElementById('volumeValue').textContent = `${vol}%`;
    ['stats', 'settings'].forEach(prefix => {
        const valEl = document.getElementById(`${prefix}PlayerVolumeValue`);
        const slider = document.getElementById(`${prefix}PlayerVolumeSlider`);
        if (valEl) valEl.textContent = `${vol}%`;
        if (slider && !slider.matches(':active')) slider.value = vol;
    });
}

function initTimer() {
    window.toggleTaskTimer = toggleTimer;
    // Expose isTimerRunning for inline onclick handlers in sidebar templates
    Object.defineProperty(window, 'isTimerRunning', { get: () => isTimerRunning });
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); setTimerMode(btn.dataset.mode);
        });
    });
    document.getElementById('timerToggle')?.addEventListener('click', toggleTimer);
    document.getElementById('timerReset')?.addEventListener('click', resetTimer);
    document.getElementById('increaseTime5')?.addEventListener('click', () => adjustTime(5));
    document.getElementById('decreaseTime5')?.addEventListener('click', () => adjustTime(-5));
    updateTimerDisplay();
}

function adjustTime(minutes) {
    // Block if running, OR if any active task is selected (prevent drift from task duration)
    if (isTimerRunning) return;
    if (currentTask && currentMode === 'focus') return; // Always block when a task is active
    timeLeft = Math.max(5, Math.min(120, Math.floor(timeLeft / 60) + minutes)) * 60;
    totalTimerTime = timeLeft; updateTimerDisplay();
}

function setTimerMode(mode) {
    pauseTimer(); currentMode = mode;
    let mins = testMode ? (1/12) : (mode === 'shortBreak' ? SHORT_BREAK_MINUTES : (mode === 'longBreak' ? LONG_BREAK_MINUTES : POMODORO_MINUTES));
    timeLeft = testMode ? 5 : mins * 60; totalTimerTime = timeLeft;
    document.getElementById('timeLabel').textContent = mode === 'focus' ? 'Período de Foco' : (mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa');

    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    const btnToActive = document.querySelector(`.mode-btn[data-mode="${mode}"]`);
    if(btnToActive) btnToActive.classList.add('active');

    const btnPlay = document.getElementById('timerToggle');
    if (btnPlay) btnPlay.innerHTML = '<i class="fas fa-play"></i>';

    updateTimerDisplay(); updateProgressBar(); renderProgress();
    syncStateToPip();
}

let targetEndTime = 0;

function toggleTimer() {
    const btn = document.getElementById('timerToggle');
    if (isTimerRunning) {
        pauseTimer(); btn.innerHTML = '<i class="fas fa-play"></i>'; renderProgress(); renderTasksSidebar();
        syncStateToPip();
    } else {
        isTimerRunning = true; btn.innerHTML = '<i class="fas fa-pause"></i>'; renderProgress(); renderTasksSidebar();
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

function pauseTimer() { isTimerRunning = false; clearInterval(timerInterval); }

function resetTimer() {
    pauseTimer();
    // When resetting with an active task, reset its completedPomodoros fraction too
    if (currentTask && currentMode === 'focus') {
        currentTask.completedPomodoros = Math.floor(currentTask.completedPomodoros); // strip fractional progress
        saveTasks();
    }
    setTimerMode(currentMode);
    // If a task is active, restore timer from task duration (not generic Pomodoro default)
    if (currentTask && currentMode === 'focus') {
        timeLeft = currentTask.estimatedMinutes * 60;
        totalTimerTime = timeLeft;
        updateTimerDisplay();
        updateProgressBar();
    }
    document.getElementById('timerToggle').innerHTML = '<i class="fas fa-play"></i>';
    renderProgress(); renderTasksSidebar(); syncStateToPip();
}

function completeTimer() {
    pauseTimer();
    let compType = '';

    if (currentMode === 'focus') {
        totalPomodorosToday++;
        localStorage.setItem('focozen_total_pomodoros', totalPomodorosToday);
        
        // --- V2 DASHBOARD HISTORY LOGGING ---
        const activeCategory = document.getElementById('globalCategorySelect')?.value || "Livre";
        const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
        
        focusHistory.push({
            id: Date.now(),
            date: todayStr,
            durationMinutes: Math.max(1, Math.round(totalTimerTime / 60)),
            category: activeCategory,
            taskId: currentTask ? currentTask.id : null
        });
        localStorage.setItem('focozen_history', JSON.stringify(focusHistory));
        // ------------------------------------

        if (currentTask) {
            currentTask.completedPomodoros++;
            saveTasks(); renderProgress(); renderTasksSidebar(); renderTasksList();
            if (currentTask.completedPomodoros >= currentTask.pomodoros) {
                currentTask.completed = true; saveTasks();
                compType = 'task-complete';
            } else {
                compType = 'focus-complete';
            }
        } else {
            completedPomodoros++;
            compType = 'focus-complete';
        }
    } else {
        compType = 'break-complete';
    }

    if (isPipModeActive) {
        pendingCompletionType = compType;
        syncStateToPip({ showCompletion: compType });
    } else {
        if ((compType === 'task-complete' || compType === 'focus-complete') && currentTask) {
            showTaskCompletionPopup(compType);
        } else if (compType === 'focus-complete') {
            showTransitionModal('break');
        } else {
            showTransitionModal('focus');
        }
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${m}:${s}`; document.title = `${m}:${s} - FocoZen Pro`;
}
function updateProgressBar() { if (totalTimerTime > 0) document.getElementById('timerProgress').style.width = `${((totalTimerTime - timeLeft) / totalTimerTime) * 100}%`; }

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
        title.textContent = 'Sessão Concluída';
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
                <i class="fas fa-coffee"></i>
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
                    <i class="fas fa-clock"></i> Continuar em outro momento
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.btn-task-done').onclick = () => {
        overlay.remove();
        if (currentTask) {
            currentTask.completed = true;
            saveTasks(); renderProgress(); renderTasksSidebar(); renderTasksList();
        }
        showTransitionModal('break');
    };
    overlay.querySelector('.btn-add-time').onclick = () => {
        overlay.remove();
        showAddTimePopup();
    };
    overlay.querySelector('.btn-continue-later').onclick = () => {
        overlay.remove();
        showContinueLaterPopup();
    };
}

function showAddTimePopup() {
    let extraMinutes = 5;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align:center;max-width:360px;">
            <div class="elegant-icon" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">
                <i class="fas fa-plus-circle"></i>
            </div>
            <h2 class="elegant-title">Adicionar Tempo</h2>
            <p class="elegant-message">Quanto tempo mais precisa?</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin:24px 0;">
                <button id="decreaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-minus"></i></button>
                <span id="extraTimeDisplay" style="font-size:2rem;font-weight:700;min-width:90px;color:white;">5 min</span>
                <button id="increaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-plus"></i></button>
            </div>
            <div class="elegant-actions">
                <button class="btn-modal secondary btn-cancel-extra">Cancelar</button>
                <button class="btn-modal primary btn-confirm-extra" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">Continuar Focando</button>
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
        showTransitionModal('break');
    };
    overlay.querySelector('.btn-confirm-extra').onclick = () => {
        overlay.remove();
        timeLeft = extraMinutes * 60;
        totalTimerTime = extraMinutes * 60;
        updateTimerDisplay(); updateProgressBar();
        toggleTimer();
        showGlassToast(`+${extraMinutes} min adicionados 🔥`);
    };
}

function showContinueLaterPopup() {
    const msgs = [
        "Você não desistiu, apenas pausou. Isso é força! 💪",
        "O progresso acontece um passo de cada vez. Volte quando estiver pronto! 🌟",
        "Descansar também faz parte do sucesso. Você está no caminho certo! 🚀",
        "Cada pausa é uma preparação para o próximo avanço. Até logo! ⚡",
        "Grandes conquistas levam tempo. Não desista! 🏆"
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
            <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove(); showTransitionModal('break');" style="width:100%;margin-top:16px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);">
                Entendido, ir para pausa
            </button>
        </div>`;
    document.body.appendChild(overlay);
}

window.toggleTestMode = function() {
    testMode = !testMode;
    const btn = document.getElementById('btnTestMode');
    if (btn) {
        btn.style.background = testMode ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : '';
        btn.textContent = testMode ? '🧪 Modo Teste ON (5s)' : '🧪 Modo Teste';
    }
    if (testMode) showGlassToast('Modo teste ativado: timer = 5s ⚡');
    else showGlassToast('Modo teste desativado');
    setTimerMode(currentMode);
};

function customConfirm(title, message, onConfirm) {
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
    overlay.querySelector('.btn-cancel-popup').onclick = () => overlay.remove();
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
                localStorage.clear();
            } catch (error) {
                console.error('Erro ao resetar dados:', error);
            }
            if (window.electronAPI && window.electronAPI.sendPipAction) {
                window.electronAPI.sendPipAction('quit-app');
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

    const openCreateModal = () => {
        editingTaskId = null;
        document.getElementById('taskNameInput').value = '';
        document.getElementById('taskTimeInput').value = '25';
        document.getElementById('taskPomodorosInput').value = '1';
        document.getElementById('taskCategoryInput').value = 'Livre';
        document.querySelectorAll('#taskCategoryChips .cat-chip').forEach(c => c.classList.remove('active'));
        const defChip = document.querySelector('#taskCategoryChips .cat-chip[data-val="Livre"]');
        if(defChip) defChip.classList.add('active');
        resetModalFields();
        tempSubtasks = []; renderTempSubtasks();
        updatePomodoroSuggestion();
        document.getElementById('modalTaskTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Tarefa';
        document.getElementById('btnSalvarTarefa').textContent = 'Criar Tarefa';
        window.renderCategoryChips && window.renderCategoryChips();
        document.getElementById('newTaskModal').classList.add('active');
    };

    document.getElementById('btnTasksModal')?.addEventListener('click', openCreateModal);
    document.getElementById('btnNewTaskHeader')?.addEventListener('click', openCreateModal);
    document.getElementById('btnAddTaskModal')?.addEventListener('click', openCreateModal);

    document.getElementById('closeNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));
    document.getElementById('cancelNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));

    document.getElementById('breathInfo')?.addEventListener('click', () => document.getElementById('breathInfoModal').classList.add('active'));
    document.getElementById('closeBreathInfo')?.addEventListener('click', () => document.getElementById('breathInfoModal').classList.remove('active'));
    document.getElementById('closeBreathInfoBtn')?.addEventListener('click', () => document.getElementById('breathInfoModal').classList.remove('active'));
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
    document.getElementById('increaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); i.value = Math.min(720, parseInt(i.value) + 5); document.getElementById('taskPomodorosInput').value = Math.ceil(parseInt(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('decreaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); i.value = Math.max(5, parseInt(i.value) - 5); document.getElementById('taskPomodorosInput').value = Math.ceil(parseInt(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('increasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.min(20, parseInt(i.value) + 1); updatePomodoroSuggestion(); });
    document.getElementById('decreasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.max(1, parseInt(i.value) - 1); updatePomodoroSuggestion(); });

    document.getElementById('btnAddSubtask')?.addEventListener('click', addTempSubtask);
    document.getElementById('subtaskInput')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') addTempSubtask(); });
    document.getElementById('btnSalvarTarefa')?.addEventListener('click', criarOuEditarTarefa);
}

function initSidebarControls() {
    const oldBtn = document.getElementById('btnAddTaskModal');
    if (oldBtn) {
        const trashBtn = document.createElement('button'); trashBtn.className = 'btn-info'; trashBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; trashBtn.title = 'Seleção em Massa';
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
            const newMins = parseInt(document.getElementById('taskTimeInput')?.value) || 25;
            t.estimatedMinutes = newMins;
            t.pomodoros = parseInt(document.getElementById('taskPomodorosInput')?.value) || 1; 
            t.subtasks = [...tempSubtasks];
            t.category = category;
            if(currentTask && currentTask.id === t.id) {
                currentTask = t;
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = category;
                if(window.updateCustomDropdownUI) window.updateCustomDropdownUI(category);
                
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
            id: Date.now(), name: name, estimatedMinutes: parseInt(document.getElementById('taskTimeInput')?.value) || 25,
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

function saveTasks() { localStorage.setItem('focozen_tasks', JSON.stringify(tasks)); }

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
                <div class="task-item-info" onclick="window.selectTask(${task.id})"><div class="task-item-name">${task.name}</div><div class="task-item-meta"><span>${task.estimatedMinutes} min</span></div></div>
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
    if (!list) return; list.innerHTML = '';

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
        
        // Calculate elapsed using estimatedMinutes (not pomodoros×25)
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
                ${isCurrent && currentMode === 'focus' && !task.completed ? 
                    (isTimerRunning ? 
                        `<button class="action-pill" style="background:#f59e0b; color:white; box-shadow: 0 4px 15px rgba(245,158,11,0.4);" onclick="event.stopPropagation(); window.toggleTaskTimer()" title="Pausar"><i class="fas fa-pause"></i></button>` 
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
                    <div style="display:flex; flex-direction:column;">
                        <span class="task-sidebar-name">${task.name}</span>
                        <span class="task-sidebar-cat"><i class="fas fa-tag"></i> ${task.category || 'Livre'}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isCurrent && !task.completed ? '<span class="task-sidebar-badge">Ativa</span>' : ''}
                        ${task.completed ? '<span class="task-sidebar-badge" style="background:#10b981;">Concluída</span>' : ''}
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
    document.getElementById('selectAllTasks').checked = selectedTasksForDelete.size === tasks.length;
};
window.toggleSelectAllTasks = function(isChecked) {
    if (isChecked) tasks.forEach(t => selectedTasksForDelete.add(t.id)); else selectedTasksForDelete.clear(); renderTasksSidebar();
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
    // Always stop timer and reset to default 25-min state
    if (isTimerRunning) pauseTimer();
    currentTask = null;
    const badge = document.getElementById('currentTaskBadge');
    badge.textContent = 'Sessão Livre'; badge.className = 'task-badge free-mode';
    document.getElementById('btnFreeFocus').classList.add('hidden');
    const globalCat = document.getElementById('globalCategorySelect');
    if (globalCat) globalCat.value = "Livre";
    if (window.updateCustomDropdownUI) window.updateCustomDropdownUI("Livre");
    // Reset timer back to 25-minute default
    timeLeft = POMODORO_MINUTES * 60;
    totalTimerTime = timeLeft;
    currentMode = 'focus';
    document.getElementById('timeLabel').textContent = 'Período de Foco';
    document.getElementById('timerToggle').innerHTML = '<i class="fas fa-play"></i>';
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.mode-btn[data-mode="focus"]')?.classList.add('active');
    updateTimerDisplay();
    updateProgressBar();
    renderProgress(); renderTasksSidebar(); renderTasksList();
    syncStateToPip();
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
                localStorage.setItem('focozen_history', JSON.stringify(focusHistory));
            }
        }
        if (window.electronAPI && window.electronAPI.closeApp) window.electronAPI.closeApp();
        return;
    }

    if (!hasProgress) {
        if (isAppClosing) {
            if (window.electronAPI && window.electronAPI.closeApp) window.electronAPI.closeApp();
            return;
        }
        if (currentTask) deselectTask();
        return;
    }

    const titleText = isAppClosing ? 'Sair do FocoZen?' : 'Pausar Tarefa?';
    const msgText = isAppClosing 
        ? 'Você tem um temporizador rodando. Deseja salvar o progresso atual, ou desistir da sessão e sair?'
        : 'Você tem progresso nesta sessão. Deseja continuar a tarefa em outro momento (salvar progresso) ou desistir?';
    
    const btnCancelText = isAppClosing ? 'Desistir e Sair' : 'Desistir (Perder Sessão)';
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
            localStorage.removeItem('focozen_saved_session');
            if (window.electronAPI) window.electronAPI.closeApp();
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
        localStorage.setItem('focozen_saved_session', JSON.stringify(stateObj));
        console.log('[SAVE] Session saved:', stateObj);

        if (isAppClosing) {
            setTimeout(() => { if (window.electronAPI) window.electronAPI.closeApp(); }, 300);
        } else {
            // Manual cleanup — do NOT call resetTimer/deselectTask
            pauseTimer();
            currentTask = null;
            timeLeft = POMODORO_MINUTES * 60;
            totalTimerTime = timeLeft;
            currentMode = 'focus';
            const badge = document.getElementById('currentTaskBadge');
            if (badge) { badge.textContent = 'Sessão Livre'; badge.className = 'task-badge free-mode'; }
            document.getElementById('btnFreeFocus')?.classList.add('hidden');
            const globalCat = document.getElementById('globalCategorySelect');
            if (globalCat) globalCat.value = 'Livre';
            if (window.updateCustomDropdownUI) window.updateCustomDropdownUI('Livre');
            document.getElementById('timerToggle').innerHTML = '<i class="fas fa-play"></i>';
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.mode-btn[data-mode="focus"]')?.classList.add('active');
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
    const sessionStr = localStorage.getItem('focozen_saved_session');
    if (!sessionStr) return;
    
    // Auto Show modal wizard check
    const checkWizard = () => {
        if (!localStorage.getItem('focozen_username')) {
            document.getElementById('wizardModal')?.classList.add('active');
        }
    };
    
    try {
        const session = JSON.parse(sessionStr);
        if(!session) { checkWizard(); return; }
        
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
        overlay.innerHTML = `
            <div class="elegant-popup" style="text-align: center; max-width: 420px;">
                <div class="elegant-icon" style="color: #10b981;"><i class="fas fa-play-circle"></i></div>
                <h3 class="elegant-title">Sessão Encontrada</h3>
                <p class="elegant-message">Detectamos uma sessão pausada anteriormente. Deseja retomá-la de onde parou?</p>
                <div class="elegant-actions">
                    <button class="btn-modal danger btn-discard">Descartar</button>
                    <button class="btn-modal primary btn-resume">Retomar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        
        overlay.querySelector('.btn-discard').onclick = () => {
            overlay.remove();
            localStorage.removeItem('focozen_saved_session');
            checkWizard();
        };
        
        overlay.querySelector('.btn-resume').onclick = () => {
            overlay.remove();
            localStorage.removeItem('focozen_saved_session');
            
            if (session.taskId) {
                const targetTask = tasks.find(t => t.id === session.taskId);
                if (targetTask && !targetTask.completed) {
                    // Use skipTimerSync=true so selectTask doesn't overwrite the saved timeLeft
                    selectTask(session.taskId, true);
                    
                    // Now restore the exact saved timer state
                    currentMode = 'focus';
                    timeLeft = session.timeLeft;
                    totalTimerTime = session.totalTimerTime;
                    document.getElementById('timeLabel').textContent = 'Período de Foco';
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    document.querySelector('.mode-btn[data-mode="focus"]')?.classList.add('active');
                    updateTimerDisplay();
                    updateProgressBar();
                    renderTasksSidebar();
                    toggleTimer(); // Resume counting
                } else {
                    showGlassToast("A tarefa da sessão já foi concluída ou excluída.");
                    checkWizard();
                }
            } else {
                // Free-mode session restore
                deselectTask();
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = session.category;
                if(window.updateCustomDropdownUI) window.updateCustomDropdownUI(session.category);
                
                // Restore timer directly without setTimerMode
                currentMode = 'focus';
                timeLeft = session.timeLeft;
                totalTimerTime = session.totalTimerTime;
                document.getElementById('timeLabel').textContent = 'Período de Foco';
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.mode-btn[data-mode="focus"]')?.classList.add('active');
                updateTimerDisplay();
                updateProgressBar();
                toggleTimer();
            }
        };
    } catch(e) {
         localStorage.removeItem('focozen_saved_session');
         checkWizard();
    }
};

function startTask(taskId) {
    // If we're already on this task, just toggle play
    if (currentTask && currentTask.id === taskId) {
        if (!isTimerRunning) toggleTimer();
        return;
    }
    
    // Otherwise, we want to select it, then immediately start it. 
    // We pass a callback to selectTask so it runs after the switch (and after any save modals).
    selectTask(taskId, false, () => {
        if (currentTask && !currentTask.completed && !isTimerRunning) {
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
            localStorage.setItem('focozen_history', JSON.stringify(focusHistory));
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
                localStorage.setItem('focozen_saved_session', JSON.stringify(stateObj));
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
        const sessionStr = localStorage.getItem('focozen_saved_session');
        let session = null;
        try { if(sessionStr) session = JSON.parse(sessionStr); } catch(e){}
        
        if (session && session.taskId === taskId) {
            // Restore exact saved timer state for this task
            skipTimerSync = true;
            currentMode = session.mode || 'focus';
            timeLeft = session.timeLeft;
            totalTimerTime = session.totalTimerTime;
            document.getElementById('timeLabel').textContent = 'Período de Foco';
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.mode-btn[data-mode="focus"]')?.classList.add('active');
            updateTimerDisplay();
            updateProgressBar();
            // Clear the session so we don't infinitely restore it if closed without saving
            localStorage.removeItem('focozen_saved_session');
        }

        const badge = document.getElementById('currentTaskBadge');
        badge.textContent = currentTask.name.substring(0, 15) + (currentTask.name.length > 15 ? '...' : '');
        badge.className = 'task-badge task-mode'; document.getElementById('btnFreeFocus').classList.remove('hidden');
        document.getElementById('globalCategorySelect').value = currentTask.category || "Livre";
        if(window.updateCustomDropdownUI) window.updateCustomDropdownUI(currentTask.category || "Livre");
        
        // If not restoring from the physical localstorage session, we can mathematically restore from the decimal fraction!
        if (!skipTimerSync) {
            totalTimerTime = currentTask.estimatedMinutes * 60;
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

function deleteTask(taskId) {
    customConfirm('Excluir Tarefa', 'Excluir esta tarefa permanentemente?', () => {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx > -1) { tasks.splice(idx, 1); if (currentTask?.id === taskId) deselectTask(); saveTasks(); renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount(); }
    });
}

function renderProgress() {
    const content = document.getElementById('progressContent'); if (!content) return;
    let percent = 0; let title = "Sessão Livre de Foco";
    let currentHtml = "";

    if (currentTask) {
        title = currentTask.name;
        if (currentTask.pomodoros > 0) percent = (currentTask.completedPomodoros / currentTask.pomodoros) * 100;
    }

    // Add real-time timer progress (both running AND paused with partial progress)
    if (currentMode === 'focus' && totalTimerTime > 0) {
        const currentTimerFraction = (totalTimerTime - timeLeft) / totalTimerTime;
        if (currentTask && currentTask.pomodoros > 0) {
            percent = ((currentTask.completedPomodoros + currentTimerFraction) / currentTask.pomodoros) * 100;
        } else {
            percent = currentTimerFraction * 100;
        }
    }
    
    percent = Math.max(0, Math.min(100, percent));
    currentHtml = `<div class="pomodoro-count" id="bubblePercentage">${Math.floor(percent)}%</div>`;

    const hiddenClass = showBubbleText ? '' : 'hidden-text';

    content.innerHTML = `
        <div class="task-progress-display">
            <h4>${title}</h4>
            <div class="sand-bubble-container ${isTimerRunning && currentMode === 'focus' ? 'running' : ''}" style="--fill-percent: ${percent}%;">
                <div class="liquid-wave-wrapper">
                    <svg class="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                        <path d="M0,12 Q17.5,0 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-primary)" opacity="0.7"/>
                    </svg>
                    <svg class="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                        <path d="M0,12 Q17.5,24 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-secondary)" opacity="0.4"/>
                    </svg>
                </div>
                <div class="sand-bubble-center ${hiddenClass}" id="bubbleCenterText">
                    ${currentHtml}
                </div>
            </div>
        </div>`;

    const percentageEl = document.getElementById('bubblePercentage');
    if(percentageEl) percentageEl.textContent = `${Math.floor(percent)}%`;
}

function updateTaskBubbleProgress() {
    let percent = 0;
    if (currentTask && currentTask.pomodoros > 0) {
        const currentTimerFraction = totalTimerTime > 0 ? (totalTimerTime - timeLeft) / totalTimerTime : 0;
        percent = ((currentTask.completedPomodoros + currentTimerFraction) / currentTask.pomodoros) * 100;
        const sidebarBar = document.getElementById(`sidebar-prog-${currentTask.id}`);
        const sidebarPercentText = document.getElementById(`sidebar-percent-${currentTask.id}`);
        if (sidebarBar) sidebarBar.style.width = `${Math.min(100,percent)}%`;
        if (sidebarPercentText) sidebarPercentText.textContent = `${Math.floor(Math.min(100,percent))}%`;
    } else if (currentMode === 'focus' && totalTimerTime > 0) {
        percent = ((totalTimerTime - timeLeft) / totalTimerTime) * 100;
    }

    percent = Math.max(0, Math.min(100, percent));
    const container = document.querySelector('.sand-bubble-container');
    if (container) container.style.setProperty('--fill-percent', `${percent}%`);

    const percentageEl = document.getElementById('bubblePercentage');
    if (percentageEl) percentageEl.textContent = `${Math.floor(percent)}%`;
}

function updateHeaderTaskCount() { document.getElementById('headerTaskCount').textContent = tasks.filter(t => !t.completed).length; }

function initBreath() {
    document.getElementById('btnOpenBreathSession')?.addEventListener('click', startBreathSession);
    document.getElementById('closeBreathActive')?.addEventListener('click', stopBreathSession);
}

function startBreathSession() {
    document.getElementById('breathActiveModal').classList.add('active');
    const circle = document.getElementById('breathActiveCircle');
    if (circle) { circle.className = 'breath-active-circle'; void circle.offsetWidth; }
    document.getElementById('breathPhaseTitle').textContent = 'Prepare-se...';
    document.getElementById('breathTimeText').textContent = '';
    setTimeout(runBreathCycleLogic, 500);
}

function stopBreathSession() {
    document.getElementById('breathActiveModal').classList.remove('active');
    clearTimeout(breathPhaseTimer);
    clearInterval(breathInterval);
    const circle = document.getElementById('breathActiveCircle');
    if(circle) circle.className = 'breath-active-circle';
}

function runBreathCycleLogic() {
    clearTimeout(breathPhaseTimer);
    clearInterval(breathInterval);
    const circle = document.getElementById('breathActiveCircle');
    const phaseText = document.getElementById('breathPhaseTitle');
    const timeText = document.getElementById('breathTimeText');
    if(!circle || !phaseText || !timeText) return;
    let phaseTimeLeft = 0;
    const updateTick = () => { timeText.textContent = phaseTimeLeft; phaseTimeLeft--; };
    const startInhale = () => {
        if (!document.getElementById('breathActiveModal').classList.contains('active')) return;
        phaseTimeLeft = 4;
        circle.className = 'breath-active-circle'; void circle.offsetWidth;
        circle.className = 'breath-active-circle breath-state-inhale';
        phaseText.textContent = 'Inspire'; updateTick();
        breathInterval = setInterval(updateTick, 1000);
        breathPhaseTimer = setTimeout(() => { clearInterval(breathInterval); startHold(); }, 4000);
    };
    const startHold = () => {
        if (!document.getElementById('breathActiveModal').classList.contains('active')) return;
        phaseTimeLeft = 7;
        circle.className = 'breath-active-circle'; void circle.offsetWidth;
        circle.className = 'breath-active-circle breath-state-hold';
        phaseText.textContent = 'Segure'; updateTick();
        breathInterval = setInterval(updateTick, 1000);
        breathPhaseTimer = setTimeout(() => { clearInterval(breathInterval); startExhale(); }, 7000);
    };
    const startExhale = () => {
        if (!document.getElementById('breathActiveModal').classList.contains('active')) return;
        phaseTimeLeft = 8;
        circle.className = 'breath-active-circle'; void circle.offsetWidth;
        circle.className = 'breath-active-circle breath-state-exhale';
        phaseText.textContent = 'Expire'; updateTick();
        breathInterval = setInterval(updateTick, 1000);
        breathPhaseTimer = setTimeout(() => { clearInterval(breathInterval); startInhale(); }, 8000);
    };
    startInhale();
}

window.selectTask = selectTask; window.toggleTaskComplete = toggleTaskComplete; window.deleteTask = deleteTask; window.startTask = startTask;
window.removeTempSubtask = removeTempSubtask; window.editTask = editTask;

// ==========================================
// BENTO BOX DASHBOARD
// ==========================================
let chartCatInstance = null;
let chartWeekInstance = null;

function injectFakeDataIfNeeded() {
    if (!focusHistory || focusHistory.length === 0 || focusHistory.length < 400) {
        // Force clear old data and regenerate richer 90-day data
        localStorage.removeItem('focozen_history');
        const fakeHist = [];
        const now = new Date();
        const cats = ['Estudos', 'Trabalho', 'Projetos', 'Leitura', 'Hobbies'];
        
        // 90 days of rich data for heatmap and chart visualization
        for (let i = 0; i < 90; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            
            // 4-8 sessions per day, realistic spread
            const sessions = Math.floor(Math.random() * 5) + 4;
            for(let j = 0; j < sessions; j++) {
                const hour = Math.floor(Math.random() * 16) + 6; // 6am to 10pm
                const minute = Math.floor(Math.random() * 60);
                const sessionDate = new Date(d);
                sessionDate.setHours(hour, minute, 0, 0);
                fakeHist.push({
                    id: sessionDate.getTime(),
                    date: dStr,
                    durationMinutes: Math.floor(Math.random() * 55) + 8,
                    category: cats[Math.floor(Math.random() * cats.length)],
                    taskId: null
                });
            }
        }
        focusHistory = fakeHist;
        localStorage.setItem('focozen_history', JSON.stringify(focusHistory));
        console.log('Mock data (90 days, ' + focusHistory.length + ' entries) injected.');
    }
}

window.compileDashboardData = function() {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded yet");
        return;
    }

    injectFakeDataIfNeeded();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // 1. Foco Hoje
    const todayHistory = focusHistory.filter(h => h.date === todayStr);
    const todayMinutes = todayHistory.reduce((sum, h) => sum + h.durationMinutes, 0);
    document.getElementById('statsFocusToday').textContent = formatMinsToHours(todayMinutes);
    
    // 2. Foco Semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);
    const weekHistory = focusHistory.filter(h => new Date(h.date) >= sevenDaysAgo);
    const weekMinutes = weekHistory.reduce((sum, h) => sum + h.durationMinutes, 0);
    document.getElementById('statsFocusWeek').textContent = formatMinsToHours(weekMinutes);
    
    // Greeting Title Logic
    const firstName = username.split(' ')[0];
    let greetingTitle = `Mandou bem, ${firstName}!`;
    let greetingSub = "Aqui está o resumo do seu foco.";
    
    if (todayMinutes >= 120 && todayMinutes >= weekMinutes / 3) {
        greetingTitle = `Mestre do Foco, ${firstName}`;
        greetingSub = 'Seu desempenho hoje foi excepcional.';
    } else if (todayMinutes > 30) {
        greetingTitle = `Consistente, ${firstName}`;
        greetingSub = 'Otimo ritmo, cada minuto focado conta.';
    } else if (todayMinutes === 0) {
        greetingTitle = `Hora de focar, ${firstName}`;
        greetingSub = 'Inicie uma sessao de foco para registrar seu dia.';
    }
    
    const titleEl = document.getElementById('statsGreetingTitle');
    const subEl = document.getElementById('statsGreetingSubtitle');
    if (titleEl) titleEl.innerHTML = greetingTitle;
    if (subEl) subEl.innerHTML = greetingSub;

    // 3. Ofensiva (Streak) & Max Streak
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

    document.getElementById('statsStreak').innerHTML = `<i class="fas fa-fire glow-icon-primary"></i>${currentStreak} Dias`;
    document.getElementById('statsStreakPercent').textContent = `Melhor: ${maxStreak}`;
    
    // 4. Taxa de Conclusão
    const totalT = tasks.length;
    const compT = tasks.filter(t => t.completed).length;
    let rate = 0;
    
    if (totalT === 0 && focusHistory.length > 0) {
        rate = Math.floor(Math.random() * 20) + 70; // fake task rate
    } else if (totalT > 0) {
        rate = Math.round((compT / totalT) * 100);
    }
    
    document.getElementById('statsCompletion').innerHTML = `${rate}% <span style="font-size:1rem;font-weight:400;color:var(--text-secondary);margin-left:8px;">de foco</span>`;

    // Render all 3 visualizations using selected period
    const period = window._statsPeriod || 'week';
    const filtered = filterHistoryByPeriod(focusHistory, period);
    renderCategoriesChart(filtered);
    renderPeriodBarChart(focusHistory, period);
    renderTimeline(focusHistory);
    
    // Bind period selector buttons (once)
    if (!window._statsPeriodBound) {
        window._statsPeriodBound = true;
        document.querySelectorAll('.stats-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.stats-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window._statsPeriod = btn.dataset.period;
                const filt = filterHistoryByPeriod(focusHistory, btn.dataset.period);
                renderCategoriesChart(filt);
                renderPeriodBarChart(focusHistory, btn.dataset.period);
                renderTimeline(focusHistory);
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

function renderCategoriesChart(allHistory) {
    const canvas = document.getElementById('categoriesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const catMap = {};
    allHistory.forEach(h => {
        catMap[h.category] = (catMap[h.category] || 0) + h.durationMinutes;
    });
    
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const total = data.reduce((a,b) => a+b, 0);
    
    const radialColors = [
        { from: '#a78bfa', to: '#7c3aed' },
        { from: '#60a5fa', to: '#2563eb' },
        { from: '#34d399', to: '#059669' },
        { from: '#fbbf24', to: '#d97706' },
        { from: '#f472b6', to: '#db2777' },
        { from: '#a5b4fc', to: '#6366f1' }
    ];

    if (chartCatInstance) { chartCatInstance.destroy(); chartCatInstance = null; }
    if (window._radialAnimFrame) cancelAnimationFrame(window._radialAnimFrame);
    
    const container = canvas.parentElement;
    const containerW = container.clientWidth || 400;
    const containerH = container.clientHeight || 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = containerW + 'px';
    canvas.style.height = containerH + 'px';
    ctx.scale(dpr, dpr);
    
    const cx = containerW * 0.35;
    const cy = containerH / 2;
    const maxRadius = Math.min(cx, cy) - 12;
    const ringCount = labels.length || 1;
    const ringWidth = Math.min(18, Math.max(10, (maxRadius - 16) / ringCount));
    const ringGap = 5;
    
    const sortedEntries = labels.map((l, i) => ({ label: l, value: data[i], color: radialColors[i % radialColors.length] }))
        .sort((a, b) => b.value - a.value);
    
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
            window._radialAnimFrame = requestAnimationFrame(drawFrame);
        } else {
            drawArrowLabels(ctx, sortedEntries, total, cx, cy, maxRadius, ringWidth, ringGap, containerW, containerH);
        }
    }
    
    window._radialAnimFrame = requestAnimationFrame(drawFrame);
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
        ctx.fillText(`${pctVal}% · ${formatMinsToHours(entry.value)}`, labelX + nameWidth + 6, targetY);
    });
    ctx.restore();
}

function getAccentColor() {
    // Read the CSS variable live so bars always match the user's current theme
    return getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#f97316';
}

function renderPeriodBarChart(allHistory, period) {
    const ctx = document.getElementById('weekChart');
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

    if (chartWeekInstance) chartWeekInstance.destroy();
    
    chartWeekInstance = new Chart(ctx, {
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
            ? `${todaySessions.length} sessões · ${formatMinsToHours(totalMins)} hoje`
            : 'Nenhuma sessão hoje';
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
    if (!window.electronAPI) {
        console.warn('electronAPI não disponível - sistema de atualização desabilitado');
        return;
    }
    
    // Listen for update downloaded
    if (window.electronAPI.onUpdateDownloaded) {
        window.electronAPI.onUpdateDownloaded((info) => {
            console.log('Atualização baixada:', info);
            document.getElementById('updateDownloadBanner')?.remove();
            document.getElementById('updateInlineProgress')?.remove();
            if (window._manualUpdateTriggered) {
                // Auto-install silently after manual check
                window._manualUpdateTriggered = false;
                localStorage.setItem('focozen_updated_version', info.version);
                localStorage.setItem('focozen_changelog', info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
                const btn = document.getElementById('btnCheckUpdates');
                if (btn) btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Instalando...';
                setTimeout(() => { window.electronAPI.installUpdate(); }, 800);
            } else {
                showUpdateNotification(info);
            }
        });
    }

    // Show download progress banner
    if (window.electronAPI.onDownloadProgress) {
        window.electronAPI.onDownloadProgress((pct) => {
            let banner = document.getElementById('updateDownloadBanner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'updateDownloadBanner';
                banner.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99998;background:rgba(15,23,42,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px 20px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
                banner.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <i class="fas fa-download" style="color:var(--accent-primary);"></i>
                        <span style="font-weight:600;font-size:0.9rem;">Baixando atualização...</span>
                        <span id="updateDownloadPct" style="margin-left:auto;font-size:0.85rem;color:var(--text-secondary);">0%</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:99px;height:4px;overflow:hidden;">
                        <div id="updateDownloadBar" style="height:100%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));width:0%;transition:width 0.3s ease;border-radius:99px;"></div>
                    </div>`;
                document.body.appendChild(banner);
            }
            document.getElementById('updateDownloadPct').textContent = pct + '%';
            document.getElementById('updateDownloadBar').style.width = pct + '%';
        });
    }
    
    // Listen for manual update check results
    if (window.electronAPI.onUpdateCheckResult) {
        window.electronAPI.onUpdateCheckResult((result) => {
            console.log('Resultado da verificação de atualização:', result);
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
            <h2 class="elegant-title" style="font-size: 1.6rem; margin-bottom: 12px;">Nova Versão Disponível! 🎉</h2>
            <p class="elegant-message" style="font-size: 1.1rem; margin-bottom: 8px;">Versão <strong>${info.version}</strong> foi baixada</p>
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
        localStorage.setItem('focozen_updated_version', info.version);
        localStorage.setItem('focozen_changelog', info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
        window.electronAPI.installUpdate();
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
    const updatedVersion = localStorage.getItem('focozen_updated_version');
    
    if (updatedVersion) {
        // Clear one-time flags immediately
        localStorage.removeItem('focozen_updated_version');
        localStorage.removeItem('focozen_changelog');

        // Read changelog from NEW app's CHANGELOG.md (after restart)
        let changelog = 'Melhorias de desempenho e correções de bugs.';
        if (window.electronAPI && window.electronAPI.getChangelogForVersion) {
            try {
                changelog = await window.electronAPI.getChangelogForVersion(updatedVersion);
            } catch(e) {
                console.error('Erro ao ler changelog para versão:', e);
            }
        }

        // Save permanent copy for Sobre section
        localStorage.setItem('focozen_last_version', updatedVersion);
        localStorage.setItem('focozen_last_changelog', changelog);
        
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
            <h2 class="elegant-title" style="font-size: 1.7rem; margin-bottom: 12px;">Atualização Concluída! ✨</h2>
            <p class="elegant-message" style="font-size: 1rem; margin-bottom: 8px;">Agora você está usando a versão <strong>${version}</strong></p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; max-height: 250px; overflow-y: auto;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 700;">
                    <i class="fas fa-sparkles"></i> NOVIDADES DESTA VERSÃO
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
    if (window.electronAPI && window.electronAPI.getAppVersion) {
        version = await window.electronAPI.getAppVersion();
    }

    const versionEl = document.getElementById('sobreVersionNumber');
    if (versionEl) versionEl.textContent = version;

    const sobreChangelogEl = document.getElementById('sobreChangelogContent');
    const sobreVersionLabel = document.getElementById('sobreLastVersionLabel');

    if (sobreChangelogEl) {
        // Load full changelog from CHANGELOG.md
        if (window.electronAPI && window.electronAPI.getFullChangelog) {
            try {
                const fullChangelog = await window.electronAPI.getFullChangelog();
                if (sobreVersionLabel) sobreVersionLabel.textContent = 'Histórico Completo de Versões';
                sobreChangelogEl.innerHTML = formatFullChangelog(fullChangelog);
            } catch (err) {
                console.error('Erro ao carregar changelog:', err);
                sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Erro ao carregar histórico de versões.</span>';
            }
        } else {
            sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Histórico de versões não disponível.</span>';
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
        // Sub-category headers (#### 🎯 Sistema de Foco)
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
            // Hook progress updates into inline bar too
            if (window.electronAPI?.onDownloadProgress) {
                window.electronAPI.onDownloadProgress((pct) => {
                    const pctEl = document.getElementById('inlineDownloadPct');
                    const barEl = document.getElementById('inlineDownloadBar');
                    if (pctEl) pctEl.textContent = pct + '%';
                    if (barEl) barEl.style.width = pct + '%';
                });
            }
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
                <p class="elegant-message">${result.message || 'Você já está na versão mais recente.'}</p>
                <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove()" style="background: linear-gradient(135deg, #10b981, #059669); display: block; margin: 0 auto;">Fechar</button>
            </div>
        `;
    }
    
    document.body.appendChild(overlay);
}

// TEST FUNCTION - Call from DevTools console: testChangelog()
window.testChangelog = function() {
    const testChangelog = `### Corrigido
- Scroll nas configurações agora funciona corretamente
- Seções de configuração não são mais cortadas na parte inferior
- Layout da view de estatísticas também ajustado para scroll adequado

### Adicionado
- Sistema de changelog real lendo do CHANGELOG.md
- Histórico completo de todas as funcionalidades desde v1.0.0`;
    
    showChangelogModal('1.0.8', testChangelog);
    console.log('✅ Changelog modal exibido! Verifique a tela.');
};
