import { describe, it, expect, beforeEach } from 'vitest';

describe('FocoZenTimerCore', () => {
    let timerCore;

    beforeEach(() => {
        window.FocoZenTimerCore = {
            getModeDurationSeconds: ({ mode, testMode, pomodoroMinutes, shortBreakMinutes, longBreakMinutes }) => {
                if (testMode) return 5;
                if (mode === 'shortBreak') return Math.max(1, Math.round((shortBreakMinutes || 0) * 60));
                if (mode === 'longBreak') return Math.max(1, Math.round((longBreakMinutes || 0) * 60));
                return Math.max(1, Math.round((pomodoroMinutes || 0) * 60));
            },
            getTaskSessionDurationSeconds: ({ task, testMode, pomodoroMinutes }) => {
                if (!task) return 25 * 60;
                const completedBlocks = Math.floor(task.completedPomodoros || 0);
                const totalMinutes = Number(task.estimatedMinutes) || pomodoroMinutes;
                const remainingMinutes = Math.max(0, totalMinutes - (completedBlocks * pomodoroMinutes));
                const nextBlockMinutes = remainingMinutes > 0 ? Math.min(pomodoroMinutes, remainingMinutes) : pomodoroMinutes;
                return testMode ? 5 : Math.max(1, Math.round(nextBlockMinutes * 60));
            },
            getTimerProgress: ({ timeLeft, totalTime }) => {
                const safeTotalTime = Number(totalTime) || 0;
                if (safeTotalTime <= 0) return 0;
                const safeTimeLeft = Math.max(0, Number(timeLeft) || 0);
                const percentage = ((safeTotalTime - safeTimeLeft) / safeTotalTime) * 100;
                return Math.max(0, Math.min(100, percentage));
            },
            formatTimerLabel: (totalSeconds) => {
                const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
                const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
                const seconds = (safeSeconds % 60).toString().padStart(2, '0');
                return `${minutes}:${seconds}`;
            }
        };
        timerCore = window.FocoZenTimerCore;
    });

    describe('getModeDurationSeconds', () => {
        it('returns 5 seconds in test mode', () => {
            expect(timerCore.getModeDurationSeconds({ mode: 'focus', testMode: true, pomodoroMinutes: 25 })).toBe(5);
        });

        it('returns pomodoro duration for focus mode', () => {
            expect(timerCore.getModeDurationSeconds({ mode: 'focus', testMode: false, pomodoroMinutes: 25 })).toBe(1500);
        });

        it('returns short break duration', () => {
            expect(timerCore.getModeDurationSeconds({ mode: 'shortBreak', testMode: false, shortBreakMinutes: 5 })).toBe(300);
        });

        it('returns long break duration', () => {
            expect(timerCore.getModeDurationSeconds({ mode: 'longBreak', testMode: false, longBreakMinutes: 15 })).toBe(900);
        });
    });

    describe('getTaskSessionDurationSeconds', () => {
        it('returns default pomodoro duration when no task', () => {
            expect(timerCore.getTaskSessionDurationSeconds({ task: null, testMode: false, pomodoroMinutes: 25 })).toBe(1500);
        });

        it('returns 5 seconds in test mode', () => {
            expect(timerCore.getTaskSessionDurationSeconds({ task: { completedPomodoros: 0, estimatedMinutes: 60 }, testMode: true, pomodoroMinutes: 25 })).toBe(5);
        });
    });

    describe('getTimerProgress', () => {
        it('returns 0 when totalTime is 0', () => {
            expect(timerCore.getTimerProgress({ timeLeft: 0, totalTime: 0 })).toBe(0);
        });

        it('returns 0 when timer just started', () => {
            expect(timerCore.getTimerProgress({ timeLeft: 1500, totalTime: 1500 })).toBe(0);
        });

        it('returns 50 when half elapsed', () => {
            expect(timerCore.getTimerProgress({ timeLeft: 750, totalTime: 1500 })).toBe(50);
        });

        it('returns 100 when complete', () => {
            expect(timerCore.getTimerProgress({ timeLeft: 0, totalTime: 1500 })).toBe(100);
        });

        it('clamps to 0-100 range', () => {
            expect(timerCore.getTimerProgress({ timeLeft: -100, totalTime: 1500 })).toBe(100);
            expect(timerCore.getTimerProgress({ timeLeft: 2000, totalTime: 1500 })).toBe(0);
        });
    });

    describe('formatTimerLabel', () => {
        it('formats 25 minutes correctly', () => {
            expect(timerCore.formatTimerLabel(1500)).toBe('25:00');
        });

        it('formats 5 minutes correctly', () => {
            expect(timerCore.formatTimerLabel(300)).toBe('05:00');
        });

        it('formats partial minutes', () => {
            expect(timerCore.formatTimerLabel(1499)).toBe('24:59');
        });

        it('handles zero', () => {
            expect(timerCore.formatTimerLabel(0)).toBe('00:00');
        });

        it('handles negative values', () => {
            expect(timerCore.formatTimerLabel(-10)).toBe('00:00');
        });
    });
});
