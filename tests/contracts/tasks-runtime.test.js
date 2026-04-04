import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    subscribeTasksViewModel,
    selectTask,
    startTask,
    editTask,
    toggleTaskComplete,
    toggleTaskTimer,
    toggleSubtask,
    toggleDeleteMode,
    deleteTask,
    deleteSelectedTasks,
    toggleTaskSelection,
    toggleSelectAllTasks,
    openCreateTaskModal
} from '../../src/react/contracts/tasks-runtime.js';

const TASKS_EVENT = 'foczen-tasks-runtime-change';

function createMockRuntime() {
    let listeners = [];
    let snapshot = {
        tasks: [
            { id: '1', name: 'Estudar JS', category: 'Estudos', completed: false, pomodoros: 4, completedPomodoros: 0, estimatedMinutes: 100, subtasks: [] },
            { id: '2', name: 'Ler capitulo 1', category: 'Leitura', completed: true, pomodoros: 1, completedPomodoros: 1, estimatedMinutes: 25, subtasks: [] }
        ],
        currentTaskId: null,
        currentMode: 'focus',
        isTimerRunning: false,
        timeLeft: 25 * 60,
        totalTimerTime: 25 * 60,
        isDeleteMode: false,
        selectedTaskIds: []
    };

    return {
        get listeners() { return listeners; },
        get snapshot() { return snapshot; },
        setSnapshot(next) { snapshot = { ...snapshot, ...next }; },
        getSnapshot: vi.fn(() => snapshot),
        subscribe: vi.fn((listener) => {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter((l) => l !== listener);
            };
        }),
        selectTask: vi.fn((id) => { snapshot.currentTaskId = id; }),
        startTask: vi.fn((id) => { snapshot.currentTaskId = id; snapshot.isTimerRunning = true; }),
        editTask: vi.fn(),
        toggleTaskComplete: vi.fn(),
        toggleTaskTimer: vi.fn(),
        toggleSubtask: vi.fn(),
        toggleDeleteMode: vi.fn(() => { snapshot.isDeleteMode = !snapshot.isDeleteMode; }),
        deleteTask: vi.fn(),
        deleteSelectedTasks: vi.fn(),
        toggleTaskSelection: vi.fn(),
        toggleSelectAllTasks: vi.fn(),
        openCreateTaskModal: vi.fn(),
        emitChange() {
            listeners.forEach((fn) => fn(snapshot));
        }
    };
}

describe('tasks-runtime contract', () => {
    let mock;

    beforeEach(() => {
        mock = createMockRuntime();
        window.FocoZenTasksRuntime = mock;
    });

    afterEach(() => {
        delete window.FocoZenTasksRuntime;
    });

    describe('subscribeTasksViewModel', () => {
        it('throws when runtime is missing', () => {
            delete window.FocoZenTasksRuntime;
            expect(() => subscribeTasksViewModel(vi.fn())).toThrow(
                'Contrato obrigatorio ausente: window.FocoZenTasksRuntime'
            );
        });

        it('fires listener immediately with snapshot', () => {
            const cb = vi.fn();
            subscribeTasksViewModel(cb);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('fires listener on runtime change events', () => {
            const cb = vi.fn();
            subscribeTasksViewModel(cb);
            cb.mockClear();

            mock.setSnapshot({ currentTaskId: '1' });
            mock.emitChange();

            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('returns an unsubscribe function', () => {
            const cb = vi.fn();
            const unsub = subscribeTasksViewModel(cb);
            cb.mockClear();

            unsub();
            mock.setSnapshot({ currentTaskId: '2' });
            mock.emitChange();

            expect(cb).not.toHaveBeenCalled();
        });
    });

    describe('selectTask', () => {
        it('calls selectTask on the runtime', () => {
            selectTask('1');
            expect(mock.selectTask).toHaveBeenCalledWith('1');
        });
    });

    describe('startTask', () => {
        it('calls startTask on the runtime', () => {
            startTask('1');
            expect(mock.startTask).toHaveBeenCalledWith('1');
        });
    });

    describe('editTask', () => {
        it('calls editTask on the runtime', () => {
            editTask('1');
            expect(mock.editTask).toHaveBeenCalledWith('1');
        });
    });

    describe('toggleTaskComplete', () => {
        it('calls toggleTaskComplete on the runtime', () => {
            toggleTaskComplete('1');
            expect(mock.toggleTaskComplete).toHaveBeenCalledWith('1');
        });
    });

    describe('toggleTaskTimer', () => {
        it('calls toggleTaskTimer on the runtime', () => {
            toggleTaskTimer();
            expect(mock.toggleTaskTimer).toHaveBeenCalled();
        });
    });

    describe('toggleSubtask', () => {
        it('calls toggleSubtask with task and subtask ids', () => {
            toggleSubtask('1', 'sub-1');
            expect(mock.toggleSubtask).toHaveBeenCalledWith('1', 'sub-1');
        });
    });

    describe('toggleDeleteMode', () => {
        it('calls toggleDeleteMode on the runtime', () => {
            toggleDeleteMode();
            expect(mock.toggleDeleteMode).toHaveBeenCalled();
        });
    });

    describe('deleteTask', () => {
        it('calls deleteTask on the runtime', () => {
            deleteTask('1');
            expect(mock.deleteTask).toHaveBeenCalledWith('1');
        });
    });

    describe('deleteSelectedTasks', () => {
        it('calls deleteSelectedTasks on the runtime', () => {
            deleteSelectedTasks();
            expect(mock.deleteSelectedTasks).toHaveBeenCalled();
        });
    });

    describe('toggleTaskSelection', () => {
        it('calls toggleTaskSelection with task id and selection state', () => {
            toggleTaskSelection('1', true);
            expect(mock.toggleTaskSelection).toHaveBeenCalledWith('1', true);
        });
    });

    describe('toggleSelectAllTasks', () => {
        it('calls toggleSelectAllTasks on the runtime', () => {
            toggleSelectAllTasks(true);
            expect(mock.toggleSelectAllTasks).toHaveBeenCalledWith(true);
        });
    });

    describe('openCreateTaskModal', () => {
        it('calls openCreateTaskModal on the runtime', () => {
            openCreateTaskModal();
            expect(mock.openCreateTaskModal).toHaveBeenCalled();
        });
    });
});
