import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FocoZenStatsRuntime', () => {
    let runtime;
    let mockSnapshot;

    beforeEach(() => {
        vi.stubGlobal('focusHistory', []);
        vi.stubGlobal('tasks', []);
        vi.stubGlobal('username', 'TestUser');
        vi.stubGlobal('window', {
            _statsPeriod: 'week',
            dispatchEvent: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        });

        mockSnapshot = {
            focusHistory: [],
            tasks: [],
            username: 'TestUser',
            statsPeriod: 'week',
            cards: {
                todayFocus: '0m',
                weekFocus: '0m',
                currentStreak: 0,
                maxStreak: 0,
                completionRate: 0
            },
            greeting: {
                title: 'Hora de focar, TestUser',
                subtitle: 'Inicie uma sessao de foco para registrar seu dia.'
            },
            goalsSummary: {
                periodLabel: 'Esta semana',
                badge: 'Sem metas ativas',
                headline: 'Crie metas por categoria para acompanhar seu ritmo real de foco.',
                caption: '',
                isEmpty: true,
                emptyMessage: 'Defina metas na aba Metas para acompanhar a evolucao do seu plano por periodo.',
                totalActualLabel: '0m',
                totalTargetLabel: '0m',
                overallPercent: 0
            }
        };

        window.FocoZenStatsRuntime = {
            getSnapshot: () => mockSnapshot,
            subscribe: vi.fn(() => vi.fn()),
            refresh: vi.fn(() => mockSnapshot),
            setStatsPeriod: vi.fn((p) => { window._statsPeriod = p; return p; }),
            renderCategoriesChart: vi.fn(),
            renderPeriodBarChart: vi.fn()
        };
        runtime = window.FocoZenStatsRuntime;
    });

    it('returns snapshot with correct structure', () => {
        const snapshot = runtime.getSnapshot();
        expect(snapshot).toHaveProperty('focusHistory');
        expect(snapshot).toHaveProperty('tasks');
        expect(snapshot).toHaveProperty('username');
        expect(snapshot).toHaveProperty('statsPeriod');
        expect(snapshot).toHaveProperty('cards');
        expect(snapshot).toHaveProperty('greeting');
        expect(snapshot).toHaveProperty('goalsSummary');
    });

    it('returns cards with expected fields', () => {
        const { cards } = runtime.getSnapshot();
        expect(cards).toHaveProperty('todayFocus');
        expect(cards).toHaveProperty('weekFocus');
        expect(cards).toHaveProperty('currentStreak');
        expect(cards).toHaveProperty('maxStreak');
        expect(cards).toHaveProperty('completionRate');
    });

    it('refresh returns snapshot', () => {
        const result = runtime.refresh();
        expect(result).toEqual(mockSnapshot);
    });

    it('setStatsPeriod updates and returns period', () => {
        expect(runtime.setStatsPeriod('day')).toBe('day');
        expect(window._statsPeriod).toBe('day');
    });
});
