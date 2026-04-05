function renderTasksList() {
    const list = document.getElementById('tasksListModal');
    const empty = document.getElementById('emptyStateModal');
    if (!list) return;
    list.innerHTML = '';

    const allTasks = [...tasks.filter(t => !t.completed), ...tasks.filter(t => t.completed)];

    if (allTasks.length === 0) {
        if (empty) empty.style.setProperty('display', 'flex', 'important');
    } else {
        if (empty) empty.style.setProperty('display', 'none', 'important');
        allTasks.forEach(task => {
            const item = document.createElement('div'); item.className = `task-item ${task.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="task-item-info" onclick="window.selectTask(${task.id})"><div class="task-item-name">${escapeHtml(task.name)}</div><div class="task-item-meta"><span>${task.estimatedMinutes < 1 ? '5s' : task.estimatedMinutes + ' min'}</span></div></div>
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
    document.body.classList.toggle('bulk-delete-mode', !!isDeleteMode);
    if (!list) {
        notifyTasksRuntime();
        return;
    }
    list.innerHTML = '';

    if (tasks.length === 0) {
        if (empty) empty.style.setProperty('display', 'flex', 'important');
        return;
    }

    if (empty) empty.style.setProperty('display', 'none', 'important');

    const displayTasks = isDeleteMode ? tasks : [...tasks.filter(t => !t.completed), ...tasks.filter(t => t.completed)];

    displayTasks.forEach(task => {
        const isCurrent = currentTask?.id === task.id;
        const rawPercent = task.pomodoros > 0 ? ((task.completedPomodoros / task.pomodoros) * 100) : 0;
        const percent = Math.max(0, Math.min(100, rawPercent));
        const item = document.createElement('div');
        item.className = `task-item-sidebar ${isCurrent ? 'active' : ''} ${task.completed ? 'completed' : ''} ${isDeleteMode ? 'delete-mode-active' : ''}`;

        // Calculate elapsed using estimatedMinutes (not pomodoros x 25)
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
                        <span class="subtask-text">${escapeHtml(sub.name)}</span>
                    </label>
                `;
            });
            subtasksHtml += `</div>`;
        }

        const actionRowHtml = `
            <div class="task-sidebar-action-row">
                ${isCurrent && currentMode === 'focus' && !task.completed
                ? (isTimerRunning
                    ? `<button class="action-pill" style="background:#f59e0b; color:white; box-shadow: 0 4px 15px rgba(245,158,11,0.4);" onclick="event.stopPropagation(); window.toggleTaskTimer()" title="Pausar"><i class="fas fa-pause"></i></button>`
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
                    <div class="task-sidebar-title-block">
                        <span class="task-sidebar-name">${escapeHtml(task.name)}</span>
                        <span class="task-sidebar-cat"><i class="fas fa-tag"></i> ${escapeHtml(task.category || 'Livre')}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        ${isCurrent && !task.completed ? '<span class="task-sidebar-badge">Ativa</span>' : ''}
                        ${task.completed ? '<span class="task-sidebar-badge" style="background:#10b981;">Concluida</span>' : ''}
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

    notifyTasksRuntime();
}

