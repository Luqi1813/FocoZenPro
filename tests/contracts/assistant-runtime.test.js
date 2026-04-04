import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FocoZenAssistantRuntime', () => {
    let runtime;
    let mockSnapshot;

    beforeEach(() => {
        mockSnapshot = {
            messages: [],
            suggestions: [],
            isOpen: false,
            isTyping: false,
            username: 'TestUser',
            contextLabel: 'Assistente - respostas com base nos seus dados'
        };

        window._assistantTyping = false;
        window.dispatchEvent = vi.fn();
        window.addEventListener = vi.fn();
        window.removeEventListener = vi.fn();

        window.FocoZenAssistantRuntime = {
            getSnapshot: () => mockSnapshot,
            subscribe: vi.fn(() => vi.fn()),
            submit: vi.fn(() => ({ ok: true })),
            reset: vi.fn(() => ({ ok: true })),
            setOpen: vi.fn(() => {}),
            handleAction: vi.fn(() => false)
        };
        runtime = window.FocoZenAssistantRuntime;
    });

    it('returns snapshot with correct structure', () => {
        const snapshot = runtime.getSnapshot();
        expect(snapshot).toHaveProperty('messages');
        expect(snapshot).toHaveProperty('suggestions');
        expect(snapshot).toHaveProperty('isOpen');
        expect(snapshot).toHaveProperty('isTyping');
        expect(snapshot).toHaveProperty('username');
        expect(snapshot).toHaveProperty('contextLabel');
    });

    it('submit delegates to handler', () => {
        const result = runtime.submit('Criar tarefa de estudos');
        expect(result).toEqual({ ok: true });
    });

    it('reset delegates to handler', () => {
        const result = runtime.reset();
        expect(result).toEqual({ ok: true });
    });

    it('handleAction returns false for unknown action', () => {
        const result = runtime.handleAction('unknown', 'value');
        expect(result).toBe(false);
    });
});
