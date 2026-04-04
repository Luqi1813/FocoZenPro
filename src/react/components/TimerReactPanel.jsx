import React, { useEffect, useState, startTransition } from 'react';
import { subscribeTimerViewModel, setMode, toggleTimer, resetTimer, adjustTime } from '../contracts/timer-runtime.js';

export function TimerReactPanel({ snapshot: homeSnapshot, CategoryDropdown, TaskStatusBadge }) {
    const [timerSnapshot, setTimerSnapshot] = useState(null);

    useEffect(() => {
        const unsubscribe = subscribeTimerViewModel((next) => {
            startTransition(() => {
                setTimerSnapshot(next);
            });
        });
        return () => unsubscribe?.();
    }, []);

    if (!timerSnapshot) return null;

    const {
        currentMode,
        isTimerRunning,
        progress,
        timeString
    } = timerSnapshot;

    let modeLabel = 'Período de Foco';
    if (currentMode === 'shortBreak') modeLabel = 'Pausa Curta';
    if (currentMode === 'longBreak') modeLabel = 'Pausa Longa';

    return (
        <section className="panel panel-controls">
            <div className="panel-header header-controls-wrap">
                <span><i className="fas fa-clock"></i> Timer Pomodoro</span>
                {CategoryDropdown && (
                    <CategoryDropdown
                        categories={homeSnapshot?.userCategories}
                        activeCategory={homeSnapshot?.activeCategory}
                        snapshot={homeSnapshot}
                    />
                )}
                {TaskStatusBadge && <TaskStatusBadge snapshot={homeSnapshot} />}
            </div>

            <div className="timer-modes">
                <button
                    className={`mode-btn${currentMode === 'focus' ? ' active' : ''}`}
                    onClick={() => setMode('focus')}
                >
                    Foco
                </button>
                <button
                    className={`mode-btn${currentMode === 'shortBreak' ? ' active' : ''}`}
                    onClick={() => setMode('shortBreak')}
                >
                    Pausa Curta
                </button>
                <button
                    className={`mode-btn${currentMode === 'longBreak' ? ' active' : ''}`}
                    onClick={() => setMode('longBreak')}
                >
                    Pausa Longa
                </button>
            </div>

            <div className="timer-display">
                <div className="time-control-wrapper">
                    <button className="time-adjust-btn" onClick={() => adjustTime(-5)}>
                        <i className="fas fa-minus"></i>
                    </button>
                    <div className="time-big">{timeString}</div>
                    <button className="time-adjust-btn" onClick={() => adjustTime(5)}>
                        <i className="fas fa-plus"></i>
                    </button>
                </div>
                <div className="time-label">{modeLabel}</div>
            </div>

            <div className="timer-controls">
                <button className="ctrl-btn" id="timerReset" onClick={resetTimer}>
                    <i className="fas fa-redo"></i>
                </button>
                <button className="ctrl-btn btn-play" onClick={toggleTimer}>
                    <i className={`fas ${isTimerRunning ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
            </div>

            <div className="timer-progress">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
        </section>
    );
}
