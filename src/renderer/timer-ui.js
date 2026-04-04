function updateTimerDisplay() {
    notifyTimerRuntime();
}
function updateProgressBar() {
    notifyTimerRuntime();
}

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
        title.textContent = 'Sessao Concluida';
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
                <i class="fas fa-clipboard-check"></i>
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
                    <i class="fas fa-history"></i> Recomeçar em outro momento
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const titleEl = overlay.querySelector('.elegant-title');
    const messageEl = overlay.querySelector('.elegant-message');
    const iconEl = overlay.querySelector('.elegant-icon i');
    const doneBtn = overlay.querySelector('.btn-task-done');
    const addTimeBtn = overlay.querySelector('.btn-add-time');
    const restartBtn = overlay.querySelector('.btn-continue-later');

    if (titleEl) titleEl.textContent = 'Sessao concluida';
    if (messageEl) messageEl.textContent = 'O que você quer fazer com esta tarefa agora?';
    if (iconEl) iconEl.className = 'fas fa-clipboard-check';
    if (doneBtn) {
        doneBtn.style.gap = '12px';
        doneBtn.innerHTML = '<i class="fas fa-check"></i> Sim, concluí!';
    }
    if (addTimeBtn) {
        addTimeBtn.style.gap = '12px';
        addTimeBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Adicionar mais tempo';
    }
    if (restartBtn) {
        restartBtn.style.gap = '12px';
        restartBtn.innerHTML = '<i class="fas fa-history"></i> Recomeçar em outro momento';
    }

    overlay.querySelector('.btn-task-done').onclick = () => {
        overlay.remove();
        handleTaskConcludedFlow();
    };
    overlay.querySelector('.btn-add-time').onclick = () => {
        overlay.remove();
        showAddTimePopup();
    };
    overlay.querySelector('.btn-continue-later').onclick = () => {
        overlay.remove();
        handleRestartLaterFlow();
    };
}

function showAddTimePopup() {
    let extraMinutes = 5;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="text-align:center;max-width:340px;padding:22px 22px 18px;">
            <div class="elegant-icon" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">
                <i class="fas fa-plus-circle"></i>
            </div>
            <h2 class="elegant-title">Adicionar Tempo</h2>
            <p class="elegant-message" style="margin-bottom:14px;">Quanto tempo mais precisa?</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0 18px;">
                <button id="decreaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-minus"></i></button>
                <span id="extraTimeDisplay" style="font-size:2rem;font-weight:700;min-width:90px;color:white;">5 min</span>
                <button id="increaseExtraTime" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid var(--border-color);color:white;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fas fa-plus"></i></button>
            </div>
            <div class="elegant-actions" style="margin-top:0;">
                <button class="btn-modal secondary btn-cancel-extra" style="min-height:48px;">Cancelar</button>
                <button class="btn-modal primary btn-confirm-extra" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);min-height:48px;">Continuar</button>
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
        showTaskCompletionPopup('task-complete');
    };
    overlay.querySelector('.btn-confirm-extra').onclick = () => {
        overlay.remove();
        addTimeToCurrentTask(extraMinutes);
    };
}

window.toggleTestMode = function() {
    testMode = !testMode;
    const btn = document.getElementById('btnTestMode');
    if (btn) {
        btn.style.background = testMode ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : '';
        btn.textContent = testMode ? 'Modo Teste ON (5s)' : 'Modo Teste';
    }
    const taskTimeInput = document.getElementById('taskTimeInput');
    if (taskTimeInput && taskTimeInput.value === '25') {
        taskTimeInput.value = testMode ? '0.08' : '25';
    }
    if (testMode) showGlassToast('Modo teste ativado: timer e tarefas = 5s ⚡');
    else showGlassToast('Modo teste desativado');
    setTimerMode(currentMode);
};
