import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import {
    subscribeHomeViewModel,
    selectSound,
    toggleMasterPlay,
    toggleMute,
    setVolume,
    changeCategory,
    handleFreeFocus,
    toggleBubbleText,
    openCreateModal
} from '../contracts/home-runtime.js';

// ─── Sound Grid ───
function SoundCard({ sound, isActive, onSelect }) {
    return (
        <div
            className={`sound-card${isActive ? ' active' : ''}`}
            data-sound-id={sound.id}
            onClick={() => onSelect(sound)}
        >
            <i className={`fas ${sound.icon}`}></i>
            <span>{sound.name}</span>
        </div>
    );
}

function SoundCategoryGroup({ group, currentSoundId, onSelectSound }) {
    return (
        <div className="sound-category-wrapper">
            <div className="sound-category-title">
                <i className={`fas ${group.icon}`}></i> {group.name}
            </div>
            <div className="sound-grid">
                {group.sounds.map((sound) => (
                    <SoundCard
                        key={sound.id}
                        sound={sound}
                        isActive={sound.id === currentSoundId}
                        onSelect={onSelectSound}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Audio Controls ───
function AudioControlsPill({ snapshot, onVolumeChange }) {
    const sliderRef = useRef(null);
    const volumePercent = Math.round((snapshot.masterVolume ?? 0.7) * 100);

    return (
        <div className="sounds-player-pill">
            <button
                id="masterPlayPause"
                className={`btn-master-play-icon${snapshot.isPlaying ? ' playing' : ''}`}
                onClick={() => toggleMasterPlay()}
            >
                <i className={`fas ${snapshot.isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button
                id="btnMuteToggle"
                className="btn-master-play-icon"
                onClick={() => toggleMute()}
            >
                <i className={`fas ${snapshot.isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
            </button>
            <input
                ref={sliderRef}
                type="range"
                id="masterVolume"
                min="0"
                max="100"
                value={volumePercent}
                className="header-vol-slider"
                onChange={(e) => onVolumeChange(Number(e.target.value))}
            />
            <span id="volumeValue" className="header-vol-value">{volumePercent}%</span>
        </div>
    );
}

// ─── Category Dropdown ───
function CategoryDropdown({ categories, activeCategory, snapshot }) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);

    const activeCat = categories.find((c) => c.name === activeCategory) || categories[0] || { name: 'Livre', icon: 'fa-infinity' };

    useEffect(() => {
        const handler = (e) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const handleSelect = (cat) => {
        const runtime = window.FocoZenHomeRuntime;
        if (!runtime?.canChangeCategory?.()) {
            setIsOpen(false);
            return;
        }
        changeCategory(cat.name);
        setIsOpen(false);
    };

    return (
        <div id="customCategoryDropdown" className="custom-dropdown-container">
            <div
                className="custom-dropdown-trigger"
                id="catTriggerBtn"
                ref={triggerRef}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
            >
                <i id="catTriggerIcon" className={`fas ${activeCat.icon || 'fa-infinity'}`}></i>
                <span id="catTriggerText">{activeCat.name}</span>
                <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem', marginLeft: '4px', opacity: 0.6 }}></i>
            </div>
            <div className={`custom-dropdown-menu${isOpen ? ' show' : ''}`} id="catMenu" ref={menuRef}>
                {categories.map((cat) => (
                    <div
                        key={cat.name}
                        className={`custom-dropdown-item${cat.name === activeCategory ? ' active' : ''}`}
                        data-val={cat.name}
                        onClick={(e) => { e.stopPropagation(); handleSelect(cat); }}
                    >
                        <i className={`fas ${cat.icon || 'fa-tag'}`}></i> {cat.name}
                    </div>
                ))}
            </div>
            <input type="hidden" id="globalCategorySelect" value={activeCategory} />
        </div>
    );
}

// ─── Task Badge ───
function TaskStatusBadge({ snapshot }) {
    const task = snapshot.currentTask;

    return (
        <div className="task-status-wrapper">
            <span
                id="currentTaskBadge"
                className={`task-badge ${task ? 'task-mode' : 'free-mode'}`}
            >
                {task
                    ? task.name.substring(0, 15) + (task.name.length > 15 ? '...' : '')
                    : 'Sessao Livre'}
            </span>
            {task && (
                <button
                    id="btnFreeFocus"
                    className="action-pill danger"
                    title="Sair da Tarefa Atual"
                    onClick={() => handleFreeFocus()}
                >
                    <i className="fas fa-times"></i> Fechar
                </button>
            )}
        </div>
    );
}

// ─── Progress Bubble ───
function ProgressBubble({ snapshot }) {
    const percent = snapshot.taskProgressPercent ?? 0;
    const title = snapshot.progressTitle || 'Sessao Livre de Foco';
    const isRunning = snapshot.isTimerRunning && snapshot.currentMode === 'focus';
    const hiddenClass = snapshot.showBubbleText ? '' : ' hidden-text';

    return (
        <section className="panel panel-progress">
            <div className="panel-header">
                <span><i className="fas fa-chart-circle"></i> Progresso</span>
                <button
                    id="btnToggleBubbleText"
                    className="btn-info"
                    title="Ocultar Percentagem"
                    onClick={() => toggleBubbleText()}
                >
                    <i className={`fas ${snapshot.showBubbleText ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                </button>
            </div>
            <div id="progressContent" className="progress-content">
                <div className="task-progress-display">
                    <h4>{title}</h4>
                    <div
                        className={`sand-bubble-container${isRunning ? ' running' : ''}`}
                        style={{ '--fill-percent': `${percent}%` }}
                    >
                        <div className="liquid-wave-wrapper">
                            <svg className="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                                <path d="M0,12 Q17.5,0 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-primary)" opacity="0.7"/>
                            </svg>
                            <svg className="wave-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" preserveAspectRatio="none">
                                <path d="M0,12 Q17.5,24 35,12 T70,12 T105,12 T140,12 T175,12 T210,12 T245,12 T280,12 T315,12 T350,12 T385,12 T420,12 V200 H0 Z" fill="var(--accent-secondary)" opacity="0.4"/>
                            </svg>
                        </div>
                        <div className={`sand-bubble-center${hiddenClass}`} id="bubbleCenterText">
                            <div className="pomodoro-count" id="bubblePercentage">{Math.floor(percent)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Breathing 4-7-8 ───
function BreathingPanel() {
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('');
    const [countdown, setCountdown] = useState('');
    const [circleClass, setCircleClass] = useState('breath-active-circle');
    const [showInfo, setShowInfo] = useState(false);

    const phaseTimerRef = useRef(null);
    const intervalRef = useRef(null);
    const activeRef = useRef(false);

    const clearTimers = useCallback(() => {
        clearTimeout(phaseTimerRef.current);
        clearInterval(intervalRef.current);
    }, []);

    const stopSession = useCallback(() => {
        activeRef.current = false;
        setIsActive(false);
        clearTimers();
        setCircleClass('breath-active-circle');
        setPhase('');
        setCountdown('');
    }, [clearTimers]);

    const runCycle = useCallback(() => {
        if (!activeRef.current) return;
        clearTimers();

        let timeLeft = 0;

        const tick = () => {
            setCountdown(String(timeLeft));
            timeLeft -= 1;
        };

        const startInhale = () => {
            if (!activeRef.current) return;
            timeLeft = 4;
            setCircleClass('breath-active-circle breath-state-inhale');
            setPhase('Inspire');
            tick();
            intervalRef.current = setInterval(tick, 1000);
            phaseTimerRef.current = setTimeout(() => { clearInterval(intervalRef.current); startHold(); }, 4000);
        };

        const startHold = () => {
            if (!activeRef.current) return;
            timeLeft = 7;
            setCircleClass('breath-active-circle breath-state-hold');
            setPhase('Segure');
            tick();
            intervalRef.current = setInterval(tick, 1000);
            phaseTimerRef.current = setTimeout(() => { clearInterval(intervalRef.current); startExhale(); }, 7000);
        };

        const startExhale = () => {
            if (!activeRef.current) return;
            timeLeft = 8;
            setCircleClass('breath-active-circle breath-state-exhale');
            setPhase('Expire');
            tick();
            intervalRef.current = setInterval(tick, 1000);
            phaseTimerRef.current = setTimeout(() => { clearInterval(intervalRef.current); startInhale(); }, 8000);
        };

        startInhale();
    }, [clearTimers]);

    const startSession = useCallback(() => {
        activeRef.current = true;
        setIsActive(true);
        setPhase('Prepare-se...');
        setCountdown('');
        setCircleClass('breath-active-circle');
        setTimeout(() => { if (activeRef.current) runCycle(); }, 500);
    }, [runCycle]);

    useEffect(() => {
        return () => { activeRef.current = false; clearTimers(); };
    }, [clearTimers]);

    return (
        <>
            <section className="panel panel-breath">
                <div className="panel-header">
                    <span><i className="fas fa-lungs"></i> Respiracao 4-7-8</span>
                    <button className="btn-info" onClick={() => setShowInfo(true)}><i className="fas fa-info"></i></button>
                </div>
                <div className="breath-panel-graphic">
                    <i className="fas fa-wind breath-hero-icon"></i>
                    <p>Recupere o foco e a clareza mental instantaneamente com esta tecnica.</p>
                </div>
                <button className="btn-action" onClick={startSession}>Iniciar Sessao</button>
            </section>

            {/* Info modal */}
            <div className={`modal-overlay${showInfo ? ' active' : ''}`} id="breathInfoModal" onClick={() => setShowInfo(false)}>
                <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header-small"><h3><i className="fas fa-lungs"></i> Respiracao 4-7-8</h3><button className="modal-close" onClick={() => setShowInfo(false)}>×</button></div>
                    <p className="info-text">Tecnica do Dr. Andrew Weil baseada em Pranayama do Yoga.</p>
                    <div className="breath-steps-info">
                        <div className="breath-step-info"><div className="step-time">4s</div><div className="step-desc"><strong>Inspire</strong> pelo nariz</div></div>
                        <div className="breath-step-info"><div className="step-time">7s</div><div className="step-desc"><strong>Segure</strong> o ar</div></div>
                        <div className="breath-step-info"><div className="step-time">8s</div><div className="step-desc"><strong>Expire</strong> pela boca</div></div>
                    </div>
                    <div className="info-benefits"><strong>Beneficios:</strong> Reduz ansiedade, melhora foco, acalma mente.</div>
                    <div className="modal-actions"><button className="btn-modal primary btn-full" onClick={() => setShowInfo(false)}>Entendi</button></div>
                </div>
            </div>

            {/* Active breathing fullscreen */}
            <div className={`modal-overlay breath-fullscreen-overlay${isActive ? ' active' : ''}`} id="breathActiveModal">
                <button
                    className="btn-restore-mini"
                    style={{ position: 'fixed', top: '12px', right: '12px', width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', cursor: 'pointer', zIndex: 10, transition: 'all 0.3s ease', backdropFilter: 'blur(10px)' }}
                    title="Sair da Respiracao"
                    onClick={stopSession}
                >
                    <i className="fas fa-times"></i>
                </button>
                <div className="breath-active-container">
                    <h2 className="breath-phase-title">{phase}</h2>
                    <div className={circleClass}>
                        <span className="breath-time-text">{countdown}</span>
                    </div>
                    <p className="breath-tip">Concentre-se apenas no movimento do circulo.</p>
                </div>
            </div>
        </>
    );
}

// ─── Now Playing Header ───
function NowPlayingBadge({ snapshot }) {
    const name = snapshot.currentSoundName || 'Nenhum som selecionado';
    return (
        <div id="nowPlaying" className="now-playing">
            <i className="fas fa-music"></i><span>{name}</span>
        </div>
    );
}

// ─── Home React View (Main) ───
export default function HomeReactView() {
    const [snapshot, setSnapshot] = useState(null);
    const [soundGroups, setSoundGroups] = useState([]);
    const initialized = useRef(false);

    useEffect(() => {
        const unsubscribe = subscribeHomeViewModel((nextSnapshot) => {
            startTransition(() => {
                setSnapshot(nextSnapshot);
            });
        });
        return () => unsubscribe?.();
    }, []);

    // Initialize sound grid once
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        const runtime = window.FocoZenHomeRuntime;
        if (runtime?.initializeAudio) {
            runtime.initializeAudio().then((groups) => {
                setSoundGroups(groups ?? []);
            });
        }
    }, []);

    // Apply data-sound theme on document root
    useEffect(() => {
        if (snapshot?.soundTheme) {
            document.documentElement.setAttribute('data-sound', snapshot.soundTheme);
        }
    }, [snapshot?.soundTheme]);

    // Apply background image
    useEffect(() => {
        if (!snapshot) return;
        const bg = document.getElementById('dynamicBg');
        if (!bg) return;
        if (snapshot.currentSoundId) {
            const sound = soundGroups.flatMap((g) => g.sounds).find((s) => s.id === snapshot.currentSoundId);
            if (sound?.image) {
                bg.style.backgroundImage = `url('assets/images/${sound.image}')`;
            } else {
                bg.style.backgroundImage = "url('assets/images/default.jpg')";
            }
        } else {
            bg.style.backgroundImage = "url('assets/images/default.jpg')";
        }
    }, [snapshot?.currentSoundId, soundGroups]);

    const handleVolumeChange = useCallback((percent) => {
        setVolume(percent);
    }, []);

    const handleSelectSound = useCallback((sound) => {
        selectSound(sound, true);
    }, []);

    if (!snapshot) return null;

    return (
        <>
            {/* Header bar */}
            <header className="app-header" style={{ justifyContent: 'flex-end' }}>
                <div className="header-controls">
                    <NowPlayingBadge snapshot={snapshot} />
                    <button id="btnNewTaskHeader" className="btn-new-task-header" onClick={() => openCreateModal()}>
                        <i className="fas fa-plus"></i><span>Nova Tarefa</span>
                    </button>
                    <button id="btnEnterPip" className="btn-new-task-header secondary-btn btn-pip-trigger" title="Modo PIP (Picture in Picture)">
                        <i className="fas fa-external-link-alt"></i><span>PIP</span>
                    </button>
                </div>
            </header>

            <main className="main-content">
                {/* Sounds panel */}
                <section className="panel panel-sounds">
                    <div className="panel-header panel-sounds-header">
                        <AudioControlsPill snapshot={snapshot} onVolumeChange={handleVolumeChange} />
                    </div>
                    <div className="sounds-section-label"><i className="fas fa-music"></i> Sons Ambientais</div>
                    <div id="soundGrid" className="sound-grid-container">
                        {soundGroups.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nenhum som encontrado.</p>
                        )}
                        {soundGroups.map((group) => (
                            <SoundCategoryGroup
                                key={group.name}
                                group={group}
                                currentSoundId={snapshot.currentSoundId}
                                onSelectSound={handleSelectSound}
                            />
                        ))}
                    </div>
                </section>

                {/* Center column — Timer stays in HTML, only surround elements are React */}
                <div className="center-column">
                    {/* Timer panel — rendered by legacy HTML, we leave a div for it */}
                    <section className="panel panel-controls">
                        <div className="panel-header header-controls-wrap">
                            <span><i className="fas fa-clock"></i> Timer Pomodoro</span>
                            <CategoryDropdown
                                categories={snapshot.userCategories}
                                activeCategory={snapshot.activeCategory}
                                snapshot={snapshot}
                            />
                            <TaskStatusBadge snapshot={snapshot} />
                        </div>

                        {/* Timer internals stay in HTML — rendered by legacyTimer */}
                        <div className="timer-modes">
                            <button className={`mode-btn${snapshot.currentMode === 'focus' ? ' active' : ''}`} data-mode="focus">Foco</button>
                            <button className={`mode-btn${snapshot.currentMode === 'shortBreak' ? ' active' : ''}`} data-mode="shortBreak">Pausa Curta</button>
                            <button className={`mode-btn${snapshot.currentMode === 'longBreak' ? ' active' : ''}`} data-mode="longBreak">Pausa Longa</button>
                        </div>
                        <div className="timer-display">
                            <div className="time-control-wrapper">
                                <button id="decreaseTime5" className="time-adjust-btn"><i className="fas fa-minus"></i></button>
                                <div className="time-big" id="timerDisplay">25:00</div>
                                <button id="increaseTime5" className="time-adjust-btn"><i className="fas fa-plus"></i></button>
                            </div>
                            <div className="time-label" id="timeLabel">Periodo de Foco</div>
                        </div>
                        <div className="timer-controls">
                            <button id="timerReset" className="ctrl-btn"><i className="fas fa-redo"></i></button>
                            <button id="timerToggle" className="ctrl-btn btn-play"><i className="fas fa-play"></i></button>
                        </div>
                        <div className="timer-progress"><div id="timerProgress" className="progress-bar"></div></div>
                    </section>

                    <div className="bottom-tools-grid">
                        <BreathingPanel />
                        <ProgressBubble snapshot={snapshot} />
                    </div>
                </div>

                {/* Tasks sidebar — rendered by legacyTasks */}
                <section className="panel panel-tasks sidebar-tasks">
                    <div className="panel-header">
                        <span><i className="fas fa-clipboard-list"></i> Minhas Tarefas</span>
                        <button id="btnAddTaskModal" className="btn-info" onClick={() => openCreateModal()}><i className="fas fa-plus"></i></button>
                    </div>
                    <div id="tasksListSidebar" className="tasks-list-sidebar"></div>
                    <div id="emptyStateSidebar" className="empty-state">
                        <i className="fas fa-clipboard"></i><p>Nenhuma tarefa ainda</p><span>Clique em "Nova Tarefa" para comecar</span>
                    </div>
                </section>
            </main>
        </>
    );
}
