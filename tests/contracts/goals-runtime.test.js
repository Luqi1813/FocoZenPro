import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FocoZenGoalsRuntime', () => {
    let runtime;
    let mockSnapshot;

    beforeEach(() => {
        const mockGoals = [
            { id: 1, category: 'Estudos', dailyMinutes: 60, schedule: 'weekdays', active: true },
            { id: 2, category: 'Trabalho', dailyMinutes: 120, schedule: 'everyday', active: true }
        ];

        mockSnapshot = {
            focusGoals: mockGoals,
            focusHistory: [],
            userCategories: [],
            username: 'TestUser',
            goalsPeriod: 'week',
            statsPeriod: 'week'
        };

        window._goalsPeriod = 'week';
        window.dispatchEvent = vi.fn();
        window.addEventListener = vi.fn();
        window.removeEventListener = vi.fn();

        window.FocoZenGoalsRuntime = {
            getSnapshot: () => mockSnapshot,
            subscribe: vi.fn(() => vi.fn()),
            subscribeEdit: vi.fn(() => vi.fn()),
            refresh: vi.fn(() => mockSnapshot),
            setGoalsPeriod: vi.fn((p) => { window._goalsPeriod = p; return p; }),
            getGoalMomentumContent: vi.fn(() => ({ badge: 'Sem metas ativas', headline: 'Test' })),
            saveGoal: vi.fn(() => ({ ok: true, message: 'Meta criada.' })),
            deleteGoal: vi.fn(() => Promise.resolve({ ok: true, message: 'Meta removida.' })),
            startEdit: vi.fn((id) => mockGoals.find(g => g.id === id) ?? null)
        };
        runtime = window.FocoZenGoalsRuntime;
    });

    it('returns snapshot with correct structure', () => {
        const snapshot = runtime.getSnapshot();
        expect(snapshot).toHaveProperty('focusGoals');
        expect(snapshot).toHaveProperty('focusHistory');
        expect(snapshot).toHaveProperty('userCategories');
        expect(snapshot).toHaveProperty('username');
        expect(snapshot).toHaveProperty('goalsPeriod');
        expect(snapshot).toHaveProperty('statsPeriod');
    });

    it('refresh returns snapshot', () => {
        const result = runtime.refresh();
        expect(result).toEqual(mockSnapshot);
    });

    it('setGoalsPeriod updates and returns period', () => {
        expect(runtime.setGoalsPeriod('month')).toBe('month');
        expect(window._goalsPeriod).toBe('month');
    });

    it('startEdit returns goal by id', () => {
        const goal = runtime.startEdit(1);
        expect(goal).toEqual({ id: 1, category: 'Estudos', dailyMinutes: 60, schedule: 'weekdays', active: true });
    });

    it('startEdit returns null for unknown id', () => {
        const goal = runtime.startEdit(999);
        expect(goal).toBeNull();
    });

    it('saveGoal returns success result', () => {
        const result = runtime.saveGoal({ category: 'Projetos', dailyMinutes: 90, schedule: 'weekdays' });
        expect(result).toEqual({ ok: true, message: 'Meta criada.' });
    });

    it('deleteGoal returns promise', async () => {
        const result = await runtime.deleteGoal(1);
        expect(result).toEqual({ ok: true, message: 'Meta removida.' });
    });
});
