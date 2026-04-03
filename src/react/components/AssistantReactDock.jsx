import React, { startTransition, useEffect, useRef, useState } from 'react';
import {
    handleAssistantRuntimeAction,
    setAssistantOpenState,
    submitAssistantMessage,
    subscribeAssistantViewModel
} from '../contracts/assistant-runtime.js';

function AssistantMessage({ message, username, onAction }) {
    const label = message.role === 'assistant' ? 'Assistente' : String(username || 'Voce').split(' ')[0];
    const icon = message.role === 'assistant' ? 'fa-brain' : 'fa-user';

    return (
        <div className={`assistant-message ${message.role}`}>
            <div className="assistant-message-meta">
                <i className={`fas ${icon}`}></i>
                <span>{label}</span>
            </div>
            <div>
                {String(message.content || '')
                    .split('\n')
                    .map((line, index) => (
                        <React.Fragment key={`${message.id}-${index}`}>
                            {index > 0 ? <br /> : null}
                            {line}
                        </React.Fragment>
                    ))}
            </div>
            {Array.isArray(message.actions) && message.actions.length ? (
                <div className="assistant-message-actions">
                    {message.actions.map((action, index) => (
                        <button
                            key={`${message.id}-${action.type}-${action.label}-${index}`}
                            className="assistant-message-action"
                            type="button"
                            onClick={() => onAction(action.type, action.value || '')}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

export default function AssistantReactDock() {
    const [snapshot, setSnapshot] = useState(null);
    const [draft, setDraft] = useState('');
    const messagesRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        const unsubscribe = subscribeAssistantViewModel((nextSnapshot) => {
            startTransition(() => {
                setSnapshot(nextSnapshot);
            });
        });

        return () => unsubscribe?.();
    }, []);

    useEffect(() => {
        const label = document.getElementById('assistantContextLabel');
        if (label) {
            label.textContent = snapshot?.contextLabel || 'Copiloto do app';
        }
    }, [snapshot?.contextLabel]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }, [draft]);

    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }, [snapshot?.messages, snapshot?.isTyping]);

    useEffect(() => {
        if (snapshot?.isOpen) {
            textareaRef.current?.focus();
        }
    }, [snapshot?.isOpen]);

    if (!snapshot) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        const text = draft.trim();
        if (!text) return;
        submitAssistantMessage(text);
        setDraft('');
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const text = draft.trim();
            if (!text) return;
            submitAssistantMessage(text);
            setDraft('');
        }
    };

    const handleAction = (actionType, actionValue) => {
        handleAssistantRuntimeAction(actionType, actionValue);
    };

    return (
        <div className="react-assistant-shell">
            <div className="assistant-panel-note">
                Pergunte de forma natural sobre metas, historico, foco, categorias e desempenho.
            </div>

            <div ref={messagesRef} className="assistant-messages" aria-live="polite">
                {snapshot.messages.map((message) => (
                    <AssistantMessage
                        key={message.id}
                        message={message}
                        username={snapshot.username}
                        onAction={handleAction}
                    />
                ))}

                {snapshot.isTyping ? (
                    <div className="assistant-message assistant typing">
                        <span className="assistant-dot"></span>
                        <span className="assistant-dot"></span>
                        <span className="assistant-dot"></span>
                    </div>
                ) : null}
            </div>

            <div className="assistant-suggestions-block">
                <div className="assistant-suggestions-label">Sugestoes</div>
                <div className="assistant-suggestions">
                    {snapshot.suggestions.map((item) => (
                        <button
                            key={item}
                            className="assistant-suggestion-btn"
                            type="button"
                            onClick={() => submitAssistantMessage(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>

            <form className="assistant-composer" onSubmit={handleSubmit}>
                <textarea
                    ref={textareaRef}
                    rows="1"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setAssistantOpenState(true)}
                    placeholder="Ex: quanto foquei esta semana? ou crie uma meta de 2h por dia para Estudos"
                ></textarea>
                <button className="assistant-send-btn" type="submit">
                    <i className="fas fa-paper-plane"></i>
                </button>
            </form>
        </div>
    );
}
