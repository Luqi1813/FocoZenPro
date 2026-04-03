(() => {
    let deps = null;

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenLegacyTasks;
    };

    const getState = () => ({
        tasks: deps?.getTasks?.() ?? [],
        currentTask: deps?.getCurrentTask?.() ?? null,
        timeLeft: deps?.getTimeLeft?.() ?? 0,
        totalTimerTime: deps?.getTotalTimerTime?.() ?? 0,
        currentMode: deps?.getCurrentMode?.() ?? 'focus',
        isTimerRunning: deps?.getIsTimerRunning?.() ?? false,
        tempSubtasks: deps?.getTempSubtasks?.() ?? [],
        editingTaskId: deps?.getEditingTaskId?.() ?? null,
        selectedTasksForDelete: deps?.getSelectedTasksForDelete?.() ?? new Set(),
        isDeleteMode: deps?.getIsDeleteMode?.() ?? false,
        showBubbleText: deps?.getShowBubbleText?.() ?? true,
        testMode: deps?.getTestMode?.() ?? false
    });

    const getPomodoroMinutes = () => Number(deps?.pomodoroMinutes) || 25;

    const rerenderTasks = () => {
        renderTasksList();
        renderTasksSidebar();
        deps?.renderProgress?.();
    };

    const updatePomodoroSuggestion = () => {
        const pomodoros = Number.parseInt(document.getElementById('taskPomodorosInput')?.value, 10) || 1;
        const pomodoroMinutes = getPomodoroMinutes();
        const suggestedPomodoros = document.getElementById('suggestedPomodoros');
        const suggestionDetail = document.getElementById('suggestionDetail');

        if (suggestedPomodoros) suggestedPomodoros.textContent = pomodoros;
        if (suggestionDetail) {
            suggestionDetail.textContent = `${pomodoros} Pomodoro(s) = ${pomodoros * pomodoroMinutes} min`;
        }
    };

    const renderTempSubtasks = () => {
        const list = document.getElementById('tempSubtasksList');
        if (!list) return;

        const { tempSubtasks } = getState();
        list.innerHTML = '';

        tempSubtasks.forEach((subtask) => {
            const item = document.createElement('div');
            item.className = 'temp-subtask-item';
            item.innerHTML = `<span>${subtask.name}</span><button onclick="window.removeTempSubtask(${subtask.id})"><i class="fas fa-times"></i></button>`;
            list.appendChild(item);
        });
    };

    const addTempSubtask = () => {
        const input = document.getElementById('subtaskInput');
        const value = input?.value.trim();
        if (!value) return;

        const { tempSubtasks } = getState();
        deps?.setTempSubtasks?.([...tempSubtasks, { id: Date.now(), name: value, completed: false }]);

        if (input) input.value = '';
        renderTempSubtasks();
    };

    const removeTempSubtask = (id) => {
        const { tempSubtasks } = getState();
        deps?.setTempSubtasks?.(tempSubtasks.filter((subtask) => subtask.id !== id));
        renderTempSubtasks();
    };

    const createOrEditTask = () => {
        const name = document.getElementById('taskNameInput')?.value.trim();
        if (!name) {
            deps?.customAlert?.('Aviso', 'Digite um nome para a tarefa!');
            return;
        }

        const category = document.getElementById('taskCategoryInput')?.value || 'Livre';
        const estimatedMinutes = Number.parseFloat(document.getElementById('taskTimeInput')?.value) || getPomodoroMinutes();
        const pomodoros = Number.parseInt(document.getElementById('taskPomodorosInput')?.value, 10) || 1;
        const state = getState();

        if (state.editingTaskId) {
            const task = state.tasks.find((item) => item.id === state.editingTaskId);
            if (task) {
                task.name = name;
                task.estimatedMinutes = estimatedMinutes;
                task.pomodoros = pomodoros;
                task.subtasks = [...state.tempSubtasks];
                task.category = category;

                if (state.currentTask && state.currentTask.id === task.id) {
                    deps?.setCurrentTask?.(task);
                    const globalCategory = document.getElementById('globalCategorySelect');
                    if (globalCategory) globalCategory.value = category;
                    window.updateCustomDropdownUI?.(category);

                    if (state.currentMode === 'focus') {
                        const previousTotalTime = state.totalTimerTime;
                        const nextTotalTime = estimatedMinutes * 60;
                        let nextTimeLeft = nextTotalTime - (previousTotalTime - state.timeLeft);
                        nextTimeLeft = Math.max(0, Math.min(nextTotalTime, nextTimeLeft));

                        deps?.setTotalTimerTime?.(nextTotalTime);
                        deps?.setTimeLeft?.(nextTimeLeft);
                        deps?.updateTimerDisplay?.();
                    }
                }
            }

            deps?.setEditingTaskId?.(null);
        } else {
            const task = {
                id: Date.now(),
                name,
                estimatedMinutes,
                pomodoros,
                category,
                completedPomodoros: 0,
                completed: false,
                subtasks: [...state.tempSubtasks],
                createdAt: new Date().toISOString()
            };

            state.tasks.push(task);
            deps?.startTask?.(task.id);
        }

        deps?.saveTasks?.();

        const nameInput = document.getElementById('taskNameInput');
        if (nameInput) nameInput.value = '';

        deps?.setTempSubtasks?.([]);
        renderTempSubtasks();
        document.getElementById('newTaskModal')?.classList.remove('active');

        rerenderTasks();
        deps?.updateHeaderTaskCount?.();
        deps?.syncStateToPip?.();
    };

    const renderTasksList = () => {
        const list = document.getElementById('tasksListModal');
        const emptyState = document.getElementById('emptyStateModal');
        if (!list) return;

        const { tasks } = getState();
        list.innerHTML = '';

        const allTasks = [...tasks.filter((task) => !task.completed), ...tasks.filter((task) => task.completed)];

        if (!allTasks.length) {
            emptyState?.style.setProperty('display', 'flex', 'important');
            return;
        }

        emptyState?.style.setProperty('display', 'none', 'important');

        allTasks.forEach((task) => {
            const item = document.createElement('div');
            item.className = `task-item ${task.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div class="task-item-info" onclick="window.selectTask(${task.id})"><div class="task-item-name">${task.name}</div><div class="task-item-meta"><span>${task.estimatedMinutes < 1 ? '5s' : task.estimatedMinutes + ' min'}</span></div></div>
                <div class="task-item-actions-modal" style="display:flex; align-items:center; gap:8px;">
                    <div class="task-item-check" onclick="window.toggleTaskComplete(${task.id})">${task.completed ? '<i class="fas fa-check"></i>' : ''}</div>
                    <button class="action-pill danger" onclick="event.stopPropagation(); window.deleteTask(${task.id})" style="border:none; border-radius:50%; width:28px; height:28px; background:rgba(239,68,68,0.2); color:#ef4444; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0;"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(item);
        });
    };

    const renderTasksSidebar = () => {
        const list = document.getElementById('tasksListSidebar');
        const emptyState = document.getElementById('emptyStateSidebar');
        if (!list) return;

        const state = getState();
        list.innerHTML = '';
        document.body.classList.toggle('bulk-delete-mode', !!state.isDeleteMode);

        if (!state.tasks.length) {
            emptyState?.style.setProperty('display', 'flex', 'important');
            return;
        }

        emptyState?.style.setProperty('display', 'none', 'important');

        const displayTasks = state.isDeleteMode
            ? state.tasks
            : [...state.tasks.filter((task) => !task.completed), ...state.tasks.filter((task) => task.completed)];

        displayTasks.forEach((task) => {
            const isCurrent = state.currentTask?.id === task.id;
            const rawPercent = task.pomodoros > 0 ? ((task.completedPomodoros / task.pomodoros) * 100) : 0;
            const percent = Math.max(0, Math.min(100, rawPercent));
            const item = document.createElement('div');
            item.className = `task-item-sidebar ${isCurrent ? 'active' : ''} ${task.completed ? 'completed' : ''} ${state.isDeleteMode ? 'delete-mode-active' : ''}`;

            const taskTotalMinutes = task.estimatedMinutes || (task.pomodoros * getPomodoroMinutes());
            const elapsedFraction = task.pomodoros > 0 ? (task.completedPomodoros / task.pomodoros) : 0;
            let realtimeElapsed = 0;

            if (isCurrent && state.currentMode === 'focus' && state.totalTimerTime > 0) {
                realtimeElapsed = ((state.totalTimerTime - state.timeLeft) / state.totalTimerTime) * (taskTotalMinutes / task.pomodoros);
            }

            const timeElapsed = Math.max(0, Math.floor((elapsedFraction * taskTotalMinutes) + realtimeElapsed));
            const subtasksHtml = task.subtasks?.length && !state.isDeleteMode
                ? `<div class="task-subtasks-container">${task.subtasks.map((subtask) => `
                    <label class="modern-subtask ${subtask.completed ? 'completed' : ''}">
                        <input type="checkbox" ${subtask.completed ? 'checked' : ''} onchange="window.toggleSubtask(${task.id}, ${subtask.id})">
                        <span class="custom-checkbox"><i class="fas fa-check"></i></span>
                        <span class="subtask-text">${subtask.name}</span>
                    </label>
                `).join('')}</div>`
                : '';

            const actionRowHtml = `
                <div class="task-sidebar-action-row">
                    ${isCurrent && state.currentMode === 'focus' && !task.completed
                        ? (state.isTimerRunning
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
                <div class="task-info-area" onclick="${state.isDeleteMode ? `window.toggleTaskSelectionWrap(${task.id})` : `window.selectTask(${task.id})`}">
                    <div class="task-sidebar-header">
                        <div class="task-sidebar-title-block">
                            <span class="task-sidebar-name">${task.name}</span>
                            <span class="task-sidebar-cat"><i class="fas fa-tag"></i> ${task.category || 'Livre'}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            ${isCurrent && !task.completed ? '<span class="task-sidebar-badge">Ativa</span>' : ''}
                            ${task.completed ? '<span class="task-sidebar-badge" style="background:#10b981;">Concluida</span>' : ''}
                            ${state.isDeleteMode ? `<label class="delete-checkbox-label" onclick="event.stopPropagation();"><input type="checkbox" ${state.selectedTasksForDelete.has(task.id) ? 'checked' : ''} onchange="window.toggleTaskSelection(${task.id}, this.checked)"><span class="delete-checkbox-custom"></span></label>` : ''}
                        </div>
                    </div>
                    <div class="task-sidebar-progress"><div class="task-sidebar-progress-bar" id="sidebar-prog-${task.id}" style="width: ${percent}%"></div></div>
                    <div class="task-sidebar-info"><span>${timeElapsed} / ${taskTotalMinutes} min</span><span id="sidebar-percent-${task.id}">${Math.floor(percent)}%</span></div>
                </div>
                ${subtasksHtml}
                ${!state.isDeleteMode ? actionRowHtml : ''}
            `;
            list.appendChild(item);
        });

        if (state.isDeleteMode) {
            const actionBar = document.createElement('div');
            actionBar.className = 'bulk-delete-bar';
            actionBar.innerHTML = `<label style="color: var(--text-secondary); font-size: 0.8rem; cursor: pointer; display:flex; align-items:center; gap:5px;"><input type="checkbox" id="selectAllTasks" onchange="window.toggleSelectAllTasks(this.checked)" ${state.selectedTasksForDelete.size === state.tasks.length ? 'checked' : ''} style="accent-color: #ef4444;"> Selecionar Todas</label><button class="btn-danger-sm" onclick="window.deleteSelectedTasks()"><i class="fas fa-trash"></i> Excluir</button>`;
            list.appendChild(actionBar);
        }
    };

    const openTaskEdit = (taskId) => {
        const state = getState();
        const task = state.tasks.find((item) => item.id === taskId);
        if (!task) return;

        deps?.setEditingTaskId?.(taskId);

        const isActiveTask = state.currentTask && state.currentTask.id === taskId;
        const timerInProgress = isActiveTask && (state.isTimerRunning || state.timeLeft < state.totalTimerTime);

        document.getElementById('taskNameInput').value = task.name;
        document.getElementById('taskTimeInput').value = task.estimatedMinutes;
        document.getElementById('taskPomodorosInput').value = task.pomodoros;

        const controls = [
            document.getElementById('taskTimeInput'),
            document.getElementById('taskPomodorosInput'),
            document.getElementById('increaseTime'),
            document.getElementById('decreaseTime'),
            document.getElementById('increasePomodoros'),
            document.getElementById('decreasePomodoros')
        ];

        controls.forEach((element) => {
            if (!element) return;
            element.disabled = timerInProgress;
            element.style.opacity = timerInProgress ? '0.4' : '1';
        });

        const lockHint = document.getElementById('taskTimeLockHint');
        if (lockHint) lockHint.style.display = timerInProgress ? 'block' : 'none';

        document.getElementById('taskCategoryInput').value = task.category || 'Livre';
        document.querySelectorAll('#taskCategoryChips .cat-chip').forEach((chip) => chip.classList.remove('active'));
        document.querySelector(`#taskCategoryChips .cat-chip[data-val="${task.category || 'Livre'}"]`)?.classList.add('active');

        deps?.setTempSubtasks?.(task.subtasks ? [...task.subtasks] : []);
        renderTempSubtasks();
        updatePomodoroSuggestion();

        const modalTitle = document.getElementById('modalTaskTitle');
        const saveButton = document.getElementById('btnSalvarTarefa');
        if (modalTitle) modalTitle.innerHTML = '<i class="fas fa-pen"></i> Editar Tarefa';
        if (saveButton) saveButton.textContent = 'Salvar';

        window.renderCategoryChips?.();
        document.getElementById('newTaskModal')?.classList.add('active');
    };

    const toggleSubtask = (taskId, subtaskId) => {
        const { tasks } = getState();
        const task = tasks.find((item) => item.id === taskId);
        if (!task?.subtasks) return;

        const subtask = task.subtasks.find((item) => item.id === subtaskId);
        if (!subtask) return;

        subtask.completed = !subtask.completed;
        deps?.saveTasks?.();
        renderTasksSidebar();
    };

    const toggleTaskSelection = (taskId, isChecked) => {
        const { selectedTasksForDelete, tasks } = getState();
        if (isChecked) selectedTasksForDelete.add(taskId);
        else selectedTasksForDelete.delete(taskId);

        const selectAllTasks = document.getElementById('selectAllTasks');
        if (selectAllTasks) {
            selectAllTasks.checked = selectedTasksForDelete.size === tasks.length;
        }
    };

    const toggleSelectAllTasks = (isChecked) => {
        const { tasks, selectedTasksForDelete } = getState();
        if (isChecked) tasks.forEach((task) => selectedTasksForDelete.add(task.id));
        else selectedTasksForDelete.clear();
        renderTasksSidebar();
    };

    const deleteSelectedTasks = () => {
        const state = getState();
        if (!state.selectedTasksForDelete.size) return;

        deps?.customConfirm?.('Excluir Multiplas', `Excluir as ${state.selectedTasksForDelete.size} tarefas?`, () => {
            for (let index = state.tasks.length - 1; index >= 0; index -= 1) {
                if (state.selectedTasksForDelete.has(state.tasks[index].id)) {
                    state.tasks.splice(index, 1);
                }
            }

            if (state.currentTask && state.selectedTasksForDelete.has(state.currentTask.id)) {
                deps?.resetTimer?.();
                deps?.deselectTask?.();
            }

            state.selectedTasksForDelete.clear();
            deps?.setIsDeleteMode?.(false);
            deps?.saveTasks?.();
            rerenderTasks();
            deps?.updateHeaderTaskCount?.();
        });
    };

    const deleteTask = (taskId) => {
        deps?.customConfirm?.('Excluir Tarefa', 'Deseja excluir esta tarefa?', () => {
            const state = getState();
            const index = state.tasks.findIndex((task) => task.id === taskId);
            if (index === -1) return;

            if (state.currentTask && state.currentTask.id === taskId) {
                deps?.resetTimer?.();
                deps?.deselectTask?.();
            }

            state.tasks.splice(index, 1);
            deps?.saveTasks?.();
            rerenderTasks();
            deps?.updateHeaderTaskCount?.();
        });
    };

    window.FocoZenLegacyTasks = Object.freeze({
        configure,
        renderTasksList,
        renderTasksSidebar,
        renderTempSubtasks,
        updatePomodoroSuggestion,
        createOrEditTask,
        openTaskEdit,
        deleteTask,
        deleteSelectedTasks,
        toggleSubtask,
        toggleTaskSelection,
        toggleSelectAllTasks,
        addTempSubtask,
        removeTempSubtask
    });
})();
