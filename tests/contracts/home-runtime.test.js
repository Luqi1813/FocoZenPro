import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    subscribeHomeViewModel,
    selectSound,
    toggleMasterPlay,
    toggleMute,
    setVolume,
    changeCategory,
    handleFreeFocus,
    toggleBubbleText,
    openCreateModal,
    enterPip
} from '../../src/react/contracts/home-runtime.js';

const HOME_EVENT = 'foczen-home-runtime-change';

function createMockRuntime() {
    let listeners = [];
    let snapshot = {
        currentSoundId: null,
        currentSoundName: 'Nenhum som selecionado',
        soundTheme: null,
        isPlaying: false,
        isMuted: false,
        masterVolume: 0.7,
        activeCategory: 'Livre',
        userCategories: [
            { name: 'Livre', icon: 'fa-infinity' },
            { name: 'Estudos', icon: 'fa-book' },
            { name: 'Trabalho', icon: 'fa-briefcase' }
        ],
        currentTask: null,
        taskProgressPercent: 0,
        progressTitle: 'Sessao Livre de Foco',
        showBubbleText: true,
        isTimerRunning: false,
        currentMode: 'focus'
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
        selectSound: vi.fn(async () => ({ ok: true })),
        toggleMasterPlay: vi.fn(async () => ({ ok: true })),
        toggleMute: vi.fn(),
        setVolume: vi.fn(),
        changeCategory: vi.fn(),
        handleFreeFocus: vi.fn(),
        toggleBubbleText: vi.fn(),
        openCreateModal: vi.fn(),
        enterPip: vi.fn(() => true),
        canChangeCategory: vi.fn(() => true),
        emitChange() {
            listeners.forEach((fn) => fn(snapshot));
        }
    };
}

describe('home-runtime contract', () => {
    let mock;

    beforeEach(() => {
        mock = createMockRuntime();
        window.FocoZenHomeRuntime = mock;
    });

    afterEach(() => {
        delete window.FocoZenHomeRuntime;
    });

    describe('subscribeHomeViewModel', () => {
        it('throws when runtime is missing', () => {
            delete window.FocoZenHomeRuntime;
            expect(() => subscribeHomeViewModel(vi.fn())).toThrow(
                'Contrato obrigatorio ausente: window.FocoZenHomeRuntime'
            );
        });

        it('fires listener immediately with snapshot', () => {
            const cb = vi.fn();
            subscribeHomeViewModel(cb);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('fires listener on runtime change events', () => {
            const cb = vi.fn();
            subscribeHomeViewModel(cb);
            cb.mockClear();

            mock.setSnapshot({ currentSoundId: 'rain' });
            mock.emitChange();

            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(mock.getSnapshot());
        });

        it('returns an unsubscribe function', () => {
            const cb = vi.fn();
            const unsub = subscribeHomeViewModel(cb);
            cb.mockClear();

            unsub();
            mock.setSnapshot({ currentSoundId: 'lofi' });
            mock.emitChange();

            expect(cb).not.toHaveBeenCalled();
        });
    });

    describe('selectSound', () => {
        it('calls selectSound on the runtime with sound and card args', async () => {
            const sound = { id: 'rain', name: 'Chuva' };
            await selectSound(sound, true);
            expect(mock.selectSound).toHaveBeenCalledWith(sound, true);
        });
    });

    describe('toggleMasterPlay', () => {
        it('calls toggleMasterPlay on the runtime', async () => {
            await toggleMasterPlay();
            expect(mock.toggleMasterPlay).toHaveBeenCalled();
        });
    });

    describe('toggleMute', () => {
        it('calls toggleMute on the runtime', () => {
            toggleMute();
            expect(mock.toggleMute).toHaveBeenCalled();
        });
    });

    describe('setVolume', () => {
        it('calls setVolume with the given percent', () => {
            setVolume(50);
            expect(mock.setVolume).toHaveBeenCalledWith(50);
        });
    });

    describe('changeCategory', () => {
        it('calls changeCategory on the runtime', () => {
            changeCategory('Estudos');
            expect(mock.changeCategory).toHaveBeenCalledWith('Estudos');
        });
    });

    describe('handleFreeFocus', () => {
        it('calls handleFreeFocus on the runtime', () => {
            handleFreeFocus();
            expect(mock.handleFreeFocus).toHaveBeenCalled();
        });
    });

    describe('toggleBubbleText', () => {
        it('calls toggleBubbleText on the runtime', () => {
            toggleBubbleText();
            expect(mock.toggleBubbleText).toHaveBeenCalled();
        });
    });

    describe('openCreateModal', () => {
        it('calls openCreateModal on the runtime', () => {
            openCreateModal();
            expect(mock.openCreateModal).toHaveBeenCalled();
        });
    });

    describe('enterPip', () => {
        it('calls enterPip on the runtime', () => {
            enterPip();
            expect(mock.enterPip).toHaveBeenCalled();
        });
    });
});
