import React, { startTransition, useEffect, useRef, useState } from 'react';
import {
    getStatsPeriodOptions,
    refreshStatsView,
    renderStatsCharts,
    setStatsPeriod,
    subscribeStatsViewModel
} from '../contracts/stats-runtime.js';

function StatsCard({ icon, label, value, meta }) {
    return (
        <div className="bento-card bento-glow-primary">
            <div className="bento-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    <i className={`fas ${icon}`} style={{ color: 'var(--accent-primary)', marginRight: '6px' }}></i>
                    {label}
                </span>
                {meta ? <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{meta}</span> : null}
            </div>
            <h2>{value}</h2>
        </div>
    );
}

export default function StatsReactView() {
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const categoriesCanvasRef = useRef(null);
    const categoriesLegendRef = useRef(null);
    const periodCanvasRef = useRef(null);

    useEffect(() => {
        try {
            const unsubscribe = subscribeStatsViewModel((nextSnapshot) => {
                startTransition(() => {
                    setSnapshot(nextSnapshot);
                    setError(null);
                });
            });

            return () => {
                unsubscribe?.();
            };
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar Estatisticas em React.');
            return undefined;
        }
    }, []);

    useEffect(() => {
        if (!snapshot) return;

        renderStatsCharts({
            categoriesCanvas: categoriesCanvasRef.current,
            legendEl: categoriesLegendRef.current,
            periodCanvas: periodCanvasRef.current,
            history: snapshot.focusHistory,
            period: snapshot.statsPeriod
        });
    }, [snapshot]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        const statsView = document.getElementById('view-stats');
        if (statsView) {
            statsView.classList.remove('stats-anim-in');
            void statsView.offsetWidth;
            statsView.classList.add('stats-anim-in');
        }
        refreshStatsView();
        window.setTimeout(() => setIsRefreshing(false), 700);
    };

    if (!snapshot) {
        return (
            <section className="goals-empty-state react-stats-inline-error">
                Nao foi possivel carregar o piloto React de Estatisticas.
            </section>
        );
    }

    return (
        <div className="react-stats-shell">
            <div className="react-stats-header">
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px', color: 'var(--text-secondary)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                        Estatisticas /
                    </h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        {snapshot.greeting.title}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '3px' }}>
                        {snapshot.greeting.subtitle}
                    </p>
                </div>

                <div className="react-stats-toolbar">
                    <div className="stats-period-selector">
                        {getStatsPeriodOptions().map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`stats-period-btn ${snapshot.statsPeriod === option.value ? 'active' : ''}`}
                                onClick={() => setStatsPeriod(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="stats-refresh-btn" title="Atualizar dados" onClick={handleRefresh}>
                        <i className={`fas fa-sync-alt ${isRefreshing ? 'spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {error ? (
                <div className="react-stats-inline-error">
                    Erro ao carregar runtime de Estatisticas: {error}
                </div>
            ) : null}

            <div className="bento-grid-dashboard" id="reactStatsGrid">
                <StatsCard icon="fa-clock" label="FOCO HOJE" value={snapshot.cards.todayFocus} />
                <StatsCard icon="fa-calendar-check" label="FOCO SEMANA" value={snapshot.cards.weekFocus} />
                <StatsCard icon="fa-fire" label="OFENSIVA" value={`${snapshot.cards.currentStreak} Dias`} meta={`Melhor: ${snapshot.cards.maxStreak}`} />
                <StatsCard
                    icon="fa-chart-line"
                    label="TAXA CONCLUSAO"
                    value={
                        <>
                            {snapshot.cards.completionRate}% <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-secondary)' }}>de foco</span>
                        </>
                    }
                />

                <div className="bento-panel bento-donut" style={{ gridColumn: 'span 2' }}>
                    <h3 className="bento-panel-title">DISTRIBUICAO DE FOCO</h3>
                    <div className="bento-chart-container donut-container donut-layout">
                        <div className="donut-canvas-wrap">
                            <canvas ref={categoriesCanvasRef}></canvas>
                        </div>
                        <div ref={categoriesLegendRef} className="stats-legend"></div>
                    </div>
                </div>

                <div className="bento-panel bento-bar" style={{ gridColumn: 'span 2' }}>
                    <h3 className="bento-panel-title">CONSISTENCIA SEMANAL</h3>
                    <div className="bento-chart-container bar-container">
                        <canvas ref={periodCanvasRef}></canvas>
                    </div>
                </div>

                <div className="bento-panel" style={{ gridColumn: 'span 4' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 className="bento-panel-title" style={{ marginBottom: 0 }}>
                            <i className="fas fa-bullseye" style={{ marginRight: '8px', color: 'var(--accent-primary)' }}></i>
                            METAS X REALIZADO
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                            {snapshot.goalsSummary.periodLabel}
                        </div>
                    </div>
                    <div className="goals-summary-panel">
                        <div className="goals-summary-header">
                            <div>
                                <div className="goals-summary-badge">{snapshot.goalsSummary.badge}</div>
                                <div className="goals-summary-headline">{snapshot.goalsSummary.headline}</div>
                            </div>
                            <div className="goals-summary-caption">{snapshot.goalsSummary.caption}</div>
                        </div>
                        <div className="goals-compact-list">
                            {snapshot.goalsSummary.isEmpty ? (
                                <div className="goals-empty-state">{snapshot.goalsSummary.emptyMessage}</div>
                            ) : (
                                <div className="goals-rhythm-overview">
                                    <div className="goals-rhythm-main">
                                        <div className="goals-rhythm-main-top">
                                            <div>
                                                <div className="goals-rhythm-kicker">Total do periodo</div>
                                                <div className="goals-rhythm-value">
                                                    {snapshot.goalsSummary.totalActualLabel} <span>de {snapshot.goalsSummary.totalTargetLabel}</span>
                                                </div>
                                            </div>
                                            <div className="goals-rhythm-percent">{snapshot.goalsSummary.overallPercent}%</div>
                                        </div>
                                        <div className="goals-rhythm-rail">
                                            <div
                                                className="goals-rhythm-fill"
                                                style={{ width: `${Math.min(100, snapshot.goalsSummary.overallPercent)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
