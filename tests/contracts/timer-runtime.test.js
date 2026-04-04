import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    subscribeTimerViewModel,
    setMode,
    toggleTimer,
    resetTimer,
    adjustTime
} from '../../src/react/contracts/timer-runtime.js';

const TIMER_EVENT = 'foczen-timer-runtime-change';

function createMockRuntime() {
    let listeners = [];
    let snapshot = {
        currentMode: 'focus',
        timeLeft: 25 * 60,
        totalTimerTime: 25 * 60,
        isTimerRunning: false,
        progressTitle: 'Sessao Livre',
        progress: 0,
        timeString: '25:00'
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
        onSetMode: vi.fn((mode) => {
            snapshot.currentMode = mode;
        }),
        onToggleTimer: vi.fn(() => {
            snapshot.isTimerRunning = !snapshot.isTimerRunning;
        }),
        onResetTimer: vi.fn(() => {
            snapshot.timeLeft = snapshot.totalTimerTime;
            snapshot.isTimerRunning = false;
            snapshot.progress = 0;
        }),
        onAdjustTime: vi.fn((minutes) => {
            snapshot.timeLeft = Math.max(60, snapshot.timeLeft + minutes * 60);
        }),
        emitChange() {
            const snap = snapshot;
            listeners.forEach((fn) => fn(snap));
        }
    };
}

describe('timer-runtime contract', () => {
    let mock;

    beforeEach(() => {
        mock = createMockRuntime();
        window.FocoZenTimerRuntime = mock;
    });

    afterEach(() => {
        delete window.FocoZenTimerRuntime;
    });

    describe('subscribeTimerViewModel', () => {
        it('throws when runtime is missing', () => {
            delete window.FocoZenTimerRuntime;
            expect(() => subscribeTimerViewModel(vi.fn())).toThrow(
                'Contrato obrigatorio ausente: window.FocoZenTimerRuntime'
            );
        });

        it('fires listener immediately with snapshot', () => {
            const cb = vi.fn();
            subscribeTimerViewModel(cb);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('fires listener on runtime change events', () => {
            const cb = vi.fn();
            subscribeTimerViewModel(cb);
            cb.mockClear();

            mock.setSnapshot({ timeLeft: 1200 });
            mock.emitChange();

            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('returns an unsubscribe function', () => {
            const cb = vi.fn();
            const unsub = subscribeTimerViewModel(cb);
            cb.mockClear();

            unsub();
            mock.setSnapshot({ timeLeft: 600 });
            mock.emitChange();

            expect(cb).not.toHaveBeenCalled();
        });
    });

    describe('setMode', () => {
        it('calls onSetMode on the runtime', () => {
            setMode('shortBreak');
            expect(mock.onSetMode).toHaveBeenCalledWith('shortBreak');
        });
    });

    describe('toggleTimer', () => {
        it('calls onToggleTimer on the runtime', () => {
            toggleTimer();
            expect(mock.onToggleTimer).toHaveBeenCalled();
        });
    });

    describe('resetTimer', () => {
        it('calls onResetTimer on the runtime', () => {
            resetTimer();
            expect(mock.onResetTimer).toHaveBeenCalled();
        });
    });

    describe('adjustTime', () => {
        it('calls onAdjustTime with positive delta', () => {
            adjustTime(5);
            expect(mock.onAdjustTime).toHaveBeenCalledWith(5);
        });

        it('calls onAdjustTime with negative delta', () => {
            adjustTime(-5);
            expect(mock.onAdjustTime).toHaveBeenCalledWith(-5);
        });
    });
});
