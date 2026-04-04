import { describe, it, expect } from 'vitest';

describe('FocoZenHistoryCore', () => {
    let historyCore;

    beforeEach(() => {
        window.FocoZenHistoryCore = {
            filterHistoryByPeriod: (history, period, now = new Date()) => {
                const safeHistory = Array.isArray(history) ? history : [];
                if (period === 'day') {
                    const today = now.toISOString().split('T')[0];
                    return safeHistory.filter(h => h.date === today);
                }
                if (period === 'week') {
                    const startOfWeek = new Date(now);
                    startOfWeek.setDate(now.getDate() - now.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    return safeHistory.filter(h => new Date(h.id) >= startOfWeek);
                }
                if (period === 'month') {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    return safeHistory.filter(h => new Date(h.id) >= startOfMonth);
                }
                return safeHistory;
            },
            formatMinutesToHours: (minutes) => {
                const totalMinutes = Math.max(0, Number(minutes) || 0);
                const hours = Math.floor(totalMinutes / 60);
                const remainingMinutes = Math.floor(totalMinutes % 60);
                return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
            },
            getFocusWindowSummary: ({ history, now = new Date() }) => {
                const today = now.toISOString().split('T')[0];
                const todayHistory = history.filter(h => h.date === today);
                const todayMinutes = todayHistory.reduce((sum, h) => sum + h.durationMinutes, 0);

                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                const weekHistory = history.filter(h => new Date(h.id) >= startOfWeek);
                const weekMinutes = weekHistory.reduce((sum, h) => sum + h.durationMinutes, 0);

                return { todayHistory, todayMinutes, weekHistory, weekMinutes };
            },
            getFocusStreakSummary: ({ history, now = new Date() }) => {
                const dates = [...new Set(history.map(h => h.date))].sort().reverse();
                let currentStreak = 0;
                let maxStreak = 0;
                let tempStreak = 0;
                let expectedDate = new Date(now);

                for (let i = 0; i < dates.length; i++) {
                    const d = new Date(expectedDate);
                    d.setDate(d.getDate() - i);
                    const dateStr = d.toISOString().split('T')[0];
                    if (dates.includes(dateStr)) {
                        tempStreak++;
                        if (i === 0) currentStreak = tempStreak;
                    } else {
                        if (i === 0) currentStreak = 0;
                        break;
                    }
                }
                maxStreak = tempStreak;

                return { currentStreak, maxStreak };
            },
            getFocusGreetingState: ({ todayMinutes, weekMinutes }) => {
                if (todayMinutes >= 120) return 'master';
                if (todayMinutes >= 60) return 'consistent';
                if (todayMinutes === 0 && weekMinutes === 0) return 'start';
                return 'default';
            }
        };
        historyCore = window.FocoZenHistoryCore;
    });

    describe('filterHistoryByPeriod', () => {
        it('returns empty array for non-array input', () => {
            expect(historyCore.filterHistoryByPeriod(null, 'week')).toEqual([]);
        });

        it('filters to today for day period', () => {
            const now = new Date('2026-04-04T12:00:00');
            const history = [
                { id: '2026-04-04T10:00:00', date: '2026-04-04', durationMinutes: 30 },
                { id: '2026-04-03T10:00:00', date: '2026-04-03', durationMinutes: 25 }
            ];
            const result = historyCore.filterHistoryByPeriod(history, 'day', now);
            expect(result).toHaveLength(1);
            expect(result[0].date).toBe('2026-04-04');
        });

        it('filters to current week for week period', () => {
            const now = new Date('2026-04-04T12:00:00');
            const history = [
                { id: '2026-04-04T10:00:00', date: '2026-04-04', durationMinutes: 30 },
                { id: '2026-03-20T10:00:00', date: '2026-03-20', durationMinutes: 25 }
            ];
            const result = historyCore.filterHistoryByPeriod(history, 'week', now);
            expect(result).toHaveLength(1);
        });
    });

    describe('formatMinutesToHours', () => {
        it('formats 0 minutes', () => {
            expect(historyCore.formatMinutesToHours(0)).toBe('0m');
        });

        it('formats 30 minutes', () => {
            expect(historyCore.formatMinutesToHours(30)).toBe('30m');
        });

        it('formats 60 minutes', () => {
            expect(historyCore.formatMinutesToHours(60)).toBe('1h 0m');
        });

        it('formats 90 minutes', () => {
            expect(historyCore.formatMinutesToHours(90)).toBe('1h 30m');
        });

        it('formats 150 minutes', () => {
            expect(historyCore.formatMinutesToHours(150)).toBe('2h 30m');
        });

        it('handles negative values', () => {
            expect(historyCore.formatMinutesToHours(-10)).toBe('0m');
        });
    });

    describe('getFocusWindowSummary', () => {
        it('returns zeroed summary for empty history', () => {
            const result = historyCore.getFocusWindowSummary({ history: [] });
            expect(result.todayMinutes).toBe(0);
            expect(result.weekMinutes).toBe(0);
        });

        it('calculates today and week minutes correctly', () => {
            const now = new Date('2026-04-04T12:00:00');
            const history = [
                { id: '2026-04-04T10:00:00', date: '2026-04-04', durationMinutes: 30 },
                { id: '2026-04-04T11:00:00', date: '2026-04-04', durationMinutes: 45 },
                { id: '2026-04-03T10:00:00', date: '2026-04-03', durationMinutes: 25 }
            ];
            const result = historyCore.getFocusWindowSummary({ history, now });
            expect(result.todayMinutes).toBe(75);
            expect(result.weekMinutes).toBe(100);
        });
    });

    describe('getFocusStreakSummary', () => {
        it('returns zero streak for empty history', () => {
            const result = historyCore.getFocusStreakSummary({ history: [] });
            expect(result.currentStreak).toBe(0);
            expect(result.maxStreak).toBe(0);
        });
    });

    describe('getFocusGreetingState', () => {
        it('returns master for 120+ minutes today', () => {
            expect(historyCore.getFocusGreetingState({ todayMinutes: 120, weekMinutes: 200 })).toBe('master');
        });

        it('returns consistent for 60-119 minutes today', () => {
            expect(historyCore.getFocusGreetingState({ todayMinutes: 60, weekMinutes: 200 })).toBe('consistent');
        });

        it('returns start for zero activity', () => {
            expect(historyCore.getFocusGreetingState({ todayMinutes: 0, weekMinutes: 0 })).toBe('start');
        });

        it('returns default for low activity', () => {
            expect(historyCore.getFocusGreetingState({ todayMinutes: 30, weekMinutes: 50 })).toBe('default');
        });
    });
});
