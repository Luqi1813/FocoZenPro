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
    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = selectedTasksForDelete.size === tasks.length;
    }
    notifyTasksRuntime();
};
window.toggleSelectAllTasks = function(isChecked) {
    if (isChecked) {
        tasks.forEach(t => selectedTasksForDelete.add(t.id));
    } else {
        selectedTasksForDelete.clear();
    }
    renderTasksSidebar();
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
    taskSessionService.deselectTask();
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
                saveFocusHistory();
            }
        }
        if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
            window.location.reload();
        }
        return;
    }

    if (!hasProgress) {
        if (isAppClosing) {
            if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                window.location.reload();
            }
            return;
        }
        if (currentTask) deselectTask();
        return;
    }

    const titleText = isAppClosing ? 'Sair do FocoZen?' : 'Pausar Tarefa?';
    const msgText = isAppClosing
        ? 'Voce tem um temporizador rodando. Deseja salvar o progresso atual, ou desistir da sessao e sair?'
        : 'Voce tem progresso nesta sessao. Deseja continuar a tarefa em outro momento (salvar progresso) ou desistir?';
    
    const btnCancelText = isAppClosing ? 'Desistir e Sair' : 'Desistir (Perder Sessao)';
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
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                window.location.reload();
            }
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
        saveSavedSession(stateObj);
        console.log('[SAVE] Session saved:', stateObj);

        if (isAppClosing) {
            setTimeout(() => {
                if (!(pipService?.requestQuitApp && pipService.requestQuitApp())) {
                    window.location.reload();
                }
            }, 300);
        } else {
            // Manual cleanup — do NOT call resetTimer/deselectTask
            pauseTimer();
            currentTask = null;
            timeLeft = POMODORO_MINUTES * 60;
            totalTimerTime = timeLeft;
            currentMode = 'focus';
            const badge = document.getElementById('currentTaskBadge');
            if (badge) { badge.textContent = 'Sessao Livre'; badge.className = 'task-badge free-mode'; }
            document.getElementById('btnFreeFocus')?.classList.add('hidden');
            const globalCat = document.getElementById('globalCategorySelect');
            if (globalCat) globalCat.value = 'Livre';
            window.updateCustomDropdownUI('Livre');
            applyTimerModeUi({ mode: 'focus', resetToggleButton: true });
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
    const session = readSavedSession();
    if (!session) return;
    
    // Auto Show modal wizard check
    const checkWizard = () => {
        const storedUsername = storageService?.readStorageValue
            ? storageService.readStorageValue(storageKeys.USERNAME, null)
            : localStorage.getItem(storageKeys.USERNAME);
        if (!storedUsername) {
            document.getElementById('wizardModal')?.classList.add('active');
        }
    };
    
    try {
        if(!session) { checkWizard(); return; }
        
        const overlay = document.createElement('div'); overlay.className = 'modal-overlay active custom-popup';
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
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            checkWizard();
        };
        
        overlay.querySelector('.btn-resume').onclick = () => {
            overlay.remove();
            if (storageService?.removeStorageValue) {
                storageService.removeStorageValue(storageKeys.SAVED_SESSION);
            } else {
                localStorage.removeItem(storageKeys.SAVED_SESSION);
            }
            
            if (session.taskId) {
                const targetTask = tasks.find(t => t.id === session.taskId);
                if (targetTask && !targetTask.completed) {
                    // Use skipTimerSync=true so selectTask doesn't overwrite the saved timeLeft
                    selectTask(session.taskId, true);
                    
                    // Now restore the exact saved timer state
                    currentMode = 'focus';
                    timeLeft = session.timeLeft;
                    totalTimerTime = session.totalTimerTime;
                    applyTimerModeUi({ mode: currentMode, resetToggleButton: true });
                    updateTimerDisplay();
                    updateProgressBar();
                    renderTasksSidebar();
                    toggleTimer(); // Resume counting
                } else {
                    showGlassToast("A tarefa da sessao ja foi concluida ou excluida.");
                    checkWizard();
                }
            } else {
                // Free-mode session restore
                deselectTask();
                const globalCat = document.getElementById('globalCategorySelect');
                if (globalCat) globalCat.value = session.category;
                window.updateCustomDropdownUI(session.category);
                
                // Restore timer directly without setTimerMode
                currentMode = 'focus';
                timeLeft = session.timeLeft;
                totalTimerTime = session.totalTimerTime;
                applyTimerModeUi({ mode: currentMode, resetToggleButton: true });
                updateTimerDisplay();
                updateProgressBar();
                toggleTimer();
            }
        };
    } catch(e) {
         if (storageService?.removeStorageValue) {
             storageService.removeStorageValue(storageKeys.SAVED_SESSION);
         } else {
             localStorage.removeItem(storageKeys.SAVED_SESSION);
         }
         checkWizard();
    }
};

// ==========================================
// TASK OPERATIONS (delegated to taskSessionService)
// ==========================================

window.promptResumeSession = function() {
    taskSessionService.promptResumeSession();
};

function startTask(taskId) {
    taskSessionService.startTask(taskId);
}

function selectTask(taskId, skipTimerSync, onComplete) {
    taskSessionService.selectTask(taskId, {
        skipTimerSync: !!skipTimerSync,
        onComplete
    });
}

function _doSelectTask(taskId, skipTimerSyncInput) {
    taskSessionService.performTaskSelection(taskId, {
        skipTimerSync: !!skipTimerSyncInput
    });
}

function toggleTaskComplete(taskId) {
    taskSessionService.toggleTaskComplete(taskId);
}

function deleteTask(taskId) {
    customConfirm('Excluir Tarefa', 'Excluir esta tarefa permanentemente?', () => {
        const idx = tasks.findIndex(t => t.id === taskId);
        if (idx > -1) { tasks.splice(idx, 1); if (currentTask?.id === taskId) deselectTask(); saveTasks(); renderTasksList(); renderTasksSidebar(); renderProgress(); updateHeaderTaskCount(); }
    });
}

function renderProgress() {
    notifyHomeRuntime();
}

function updateTaskBubbleProgress() {
    notifyHomeRuntime();
}

function updateHeaderTaskCount() { const badge = document.getElementById('headerTaskCount'); if (badge) badge.textContent = tasks.filter(t => !t.completed).length; }

window.selectTask = selectTask; window.toggleTaskComplete = toggleTaskComplete; window.deleteTask = deleteTask; window.startTask = startTask;
window.removeTempSubtask = removeTempSubtask; window.editTask = editTask;

// ==========================================
// BENTO BOX DASHBOARD
// ==========================================
const radialChartFrames = new WeakMap();
const periodChartInstances = new WeakMap();
