import React, { startTransition, useEffect, useMemo, useState } from 'react';
import {
    deleteSelectedTasks,
    deleteTask,
    editTask,
    openCreateTaskModal,
    selectTask,
    startTask,
    subscribeTasksViewModel,
    toggleDeleteMode,
    toggleSelectAllTasks,
    toggleSubtask,
    toggleTaskComplete,
    toggleTaskSelection,
    toggleTaskTimer
} from '../contracts/tasks-runtime.js';

function getTaskProgress(task) {
    if (!task?.pomodoros) return 0;
    return Math.max(0, Math.min(100, (Number(task.completedPomodoros || 0) / Number(task.pomodoros || 1)) * 100));
}

function getElapsedMinutes(task, snapshot) {
    const taskTotalMinutes = Number(task.estimatedMinutes) || (Number(task.pomodoros || 0) * 25);
    const completedFraction = Number(task.pomodoros || 0) > 0
        ? Number(task.completedPomodoros || 0) / Number(task.pomodoros || 1)
        : 0;

    let realtimeElapsed = 0;
    if (
        snapshot.currentTaskId === task.id &&
        snapshot.currentMode === 'focus' &&
        Number(snapshot.totalTimerTime || 0) > 0 &&
        Number(task.pomodoros || 0) > 0
    ) {
        realtimeElapsed = ((snapshot.totalTimerTime - snapshot.timeLeft) / snapshot.totalTimerTime) * (taskTotalMinutes / task.pomodoros);
    }

    return {
        elapsed: Math.max(0, Math.floor((completedFraction * taskTotalMinutes) + realtimeElapsed)),
        total: taskTotalMinutes
    };
}

function TaskRow({ task, snapshot, isSelected }) {
    const isCurrent = snapshot.currentTaskId === task.id;
    const percent = getTaskProgress(task);
    const { elapsed, total } = getElapsedMinutes(task, snapshot);

    return (
        <div className={`task-item-sidebar ${isCurrent ? 'active' : ''} ${task.completed ? 'completed' : ''} ${snapshot.isDeleteMode ? 'delete-mode-active' : ''}`}>
            <div
                className="task-info-area"
                onClick={() => {
                    if (snapshot.isDeleteMode) {
                        toggleTaskSelection(task.id, !isSelected);
                    } else {
                        selectTask(task.id);
                    }
                }}
            >
                <div className="task-sidebar-header">
                    <div className="task-sidebar-title-block">
                        <span className="task-sidebar-name">{task.name}</span>
                        <span className="task-sidebar-cat"><i className="fas fa-tag"></i> {task.category || 'Livre'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isCurrent && !task.completed ? <span className="task-sidebar-badge">Ativa</span> : null}
                        {task.completed ? <span className="task-sidebar-badge" style={{ background: '#10b981' }}>Concluida</span> : null}
                        {snapshot.isDeleteMode ? (
                            <label className="delete-checkbox-label" onClick={(event) => event.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(event) => toggleTaskSelection(task.id, event.target.checked)}
                                />
                                <span className="delete-checkbox-custom"></span>
                            </label>
                        ) : null}
                    </div>
                </div>
                <div className="task-sidebar-progress">
                    <div className="task-sidebar-progress-bar" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="task-sidebar-info">
                    <span>{elapsed} / {total} min</span>
                    <span>{Math.floor(percent)}%</span>
                </div>
            </div>

            {Array.isArray(task.subtasks) && task.subtasks.length > 0 && !snapshot.isDeleteMode ? (
                <div className="task-subtasks-container">
                    {task.subtasks.map((subtask) => (
                        <label key={subtask.id} className={`modern-subtask ${subtask.completed ? 'completed' : ''}`}>
                            <input
                                type="checkbox"
                                checked={!!subtask.completed}
                                onChange={() => toggleSubtask(task.id, subtask.id)}
                            />
                            <span className="custom-checkbox"><i className="fas fa-check"></i></span>
                            <span className="subtask-text">{subtask.name}</span>
                        </label>
                    ))}
                </div>
            ) : null}

            {!snapshot.isDeleteMode ? (
                <div className="task-sidebar-action-row">
                    {isCurrent && snapshot.currentMode === 'focus' && !task.completed ? (
                        snapshot.isTimerRunning ? (
                            <button
                                className="action-pill"
                                style={{ background: '#f59e0b', color: 'white', boxShadow: '0 4px 15px rgba(245,158,11,0.4)' }}
                                onClick={() => toggleTaskTimer()}
                                title="Pausar"
                            >
                                <i className="fas fa-pause"></i>
                            </button>
                        ) : (
                            <button className="action-pill primary" onClick={() => toggleTaskTimer()} title="Retomar">
                                <i className="fas fa-play"></i>
                            </button>
                        )
                    ) : (
                        <button className="action-pill primary" onClick={() => startTask(task.id)} title="Iniciar">
                            <i className="fas fa-play"></i>
                        </button>
                    )}

                    <button className="action-pill warning" onClick={() => editTask(task.id)} title="Editar">
                        <i className="fas fa-pen"></i>
                    </button>
                    <button className="action-pill success" onClick={() => toggleTaskComplete(task.id)} title={task.completed ? 'Reabrir' : 'Concluir'}>
                        <i className={`fas ${task.completed ? 'fa-undo' : 'fa-check'}`}></i>
                    </button>
                    <button className="action-pill danger" onClick={() => deleteTask(task.id)} title="Excluir">
                        <i className="fas fa-trash"></i>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export default function TasksReactSidebar() {
    const [snapshot, setSnapshot] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeTasksViewModel((nextSnapshot) => {
            startTransition(() => {
                setSnapshot(nextSnapshot);
            });
        });

        return () => unsubscribe?.();
    }, []);

    const selectedIds = useMemo(() => new Set(snapshot?.selectedTaskIds || []), [snapshot?.selectedTaskIds]);

    if (!snapshot) return null;

    const displayTasks = snapshot.isDeleteMode
        ? snapshot.tasks
        : [
            ...snapshot.tasks.filter((task) => !task.completed),
            ...snapshot.tasks.filter((task) => task.completed)
        ];

    return (
        <section className="panel panel-tasks sidebar-tasks">
            <div className="panel-header">
                <span><i className="fas fa-clipboard-list"></i> Minhas Tarefas</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-info" title="Selecao em Massa" onClick={() => toggleDeleteMode()}>
                        <i className="fas fa-trash-alt"></i>
                    </button>
                    <button className="btn-info" title="Nova Tarefa" onClick={() => openCreateTaskModal()}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
            </div>

            {displayTasks.length === 0 ? (
                <div className="empty-state" style={{ display: 'flex' }}>
                    <i className="fas fa-clipboard"></i>
                    <p>Nenhuma tarefa ainda</p>
                    <span>Clique em "Nova Tarefa" para comecar</span>
                </div>
            ) : (
                <div className="tasks-list-sidebar">
                    {displayTasks.map((task) => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            snapshot={snapshot}
                            isSelected={selectedIds.has(task.id)}
                        />
                    ))}

                    {snapshot.isDeleteMode ? (
                        <div className="bulk-delete-bar">
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input
                                    type="checkbox"
                                    checked={snapshot.tasks.length > 0 && selectedIds.size === snapshot.tasks.length}
                                    onChange={(event) => toggleSelectAllTasks(event.target.checked)}
                                    style={{ accentColor: '#ef4444' }}
                                />
                                Selecionar Todas
                            </label>
                            <button className="btn-danger-sm" onClick={() => deleteSelectedTasks()}>
                                <i className="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    ) : null}
                </div>
            )}
        </section>
    );
}
