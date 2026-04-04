function customConfirm(title, message, onConfirm, onCancel) {
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
    overlay.querySelector('.btn-cancel-popup').onclick = () => {
        overlay.remove();
        if (onCancel) onCancel();
    };
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
                if (storageService?.clearStorage) {
                    storageService.clearStorage();
                } else {
                    localStorage.clear();
                }
            } catch (error) {
                console.error('Erro ao resetar dados:', error);
            }
            if (pipService?.requestQuitApp && pipService.requestQuitApp()) {
                return;
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

function openCreateModal() {
    editingTaskId = null;
    document.getElementById('taskNameInput').value = '';
    document.getElementById('taskTimeInput').value = testMode ? '0.08' : '25';
    document.getElementById('taskPomodorosInput').value = '1';
    document.getElementById('taskCategoryInput').value = 'Livre';
    document.querySelectorAll('#taskCategoryChips .cat-chip').forEach((chip) => chip.classList.remove('active'));
    const defaultChip = document.querySelector('#taskCategoryChips .cat-chip[data-val="Livre"]');
    if (defaultChip) defaultChip.classList.add('active');

    ['taskTimeInput', 'taskPomodorosInput'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
        }
    });

    ['increaseTime', 'decreaseTime', 'increasePomodoros', 'decreasePomodoros'].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
        }
    });

    const lockHint = document.getElementById('taskTimeLockHint');
    if (lockHint) lockHint.style.display = 'none';

    tempSubtasks = [];
    renderTempSubtasks();
    updatePomodoroSuggestion();
    document.getElementById('modalTaskTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Nova Tarefa';
    document.getElementById('btnSalvarTarefa').textContent = 'Criar Tarefa';
    window.renderCategoryChips?.();
    document.getElementById('newTaskModal')?.classList.add('active');
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

    document.getElementById('btnTasksModal')?.addEventListener('click', openCreateModal);
    document.getElementById('btnAddTaskModal')?.addEventListener('click', openCreateModal);

    document.getElementById('closeNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));
    document.getElementById('cancelNewTask')?.addEventListener('click', () => document.getElementById('newTaskModal').classList.remove('active'));
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
    document.getElementById('increaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); const minVal = testMode ? 0.08 : 5; i.value = Math.min(720, parseFloat(i.value) + (testMode ? 0.08 : 5)); document.getElementById('taskPomodorosInput').value = Math.ceil(parseFloat(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('decreaseTime')?.addEventListener('click', () => { const i = document.getElementById('taskTimeInput'); const minVal = testMode ? 0.08 : 5; i.value = Math.max(minVal, parseFloat(i.value) - (testMode ? 0.08 : 5)); document.getElementById('taskPomodorosInput').value = Math.ceil(parseFloat(i.value) / POMODORO_MINUTES); updatePomodoroSuggestion(); });
    document.getElementById('increasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.min(20, parseInt(i.value) + 1); updatePomodoroSuggestion(); });
    document.getElementById('decreasePomodoros')?.addEventListener('click', () => { const i = document.getElementById('taskPomodorosInput'); i.value = Math.max(1, parseInt(i.value) - 1); updatePomodoroSuggestion(); });

    document.getElementById('btnAddSubtask')?.addEventListener('click', addTempSubtask);
    document.getElementById('subtaskInput')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') addTempSubtask(); });
    document.getElementById('btnSalvarTarefa')?.addEventListener('click', criarOuEditarTarefa);
}

function initSidebarControls() {
    const oldBtn = document.getElementById('btnAddTaskModal');
    if (oldBtn) {
        const trashBtn = document.createElement('button'); trashBtn.className = 'btn-info'; trashBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; trashBtn.title = 'Selecao em Massa';
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
        div.innerHTML = `<span>${escapeHtml(sub.name)}</span><button onclick="window.removeTempSubtask(${sub.id})"><i class="fas fa-times"></i></button>`;
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
            const newMins = parseFloat(document.getElementById('taskTimeInput')?.value) || 25;
            t.estimatedMinutes = newMins;
            t.pomodoros = parseInt(document.getElementById('taskPomodorosInput')?.value) || 1; 
            t.subtasks = [...tempSubtasks];
            t.category = category;
            if(currentTask && currentTask.id === t.id) {
                currentTask = t;
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = category;
                window.updateCustomDropdownUI(category);
                
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
            id: Date.now(), name: name, estimatedMinutes: parseFloat(document.getElementById('taskTimeInput')?.value) || 25,
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
