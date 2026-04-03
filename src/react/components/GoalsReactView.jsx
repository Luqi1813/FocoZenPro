import React, { startTransition, useEffect, useState } from 'react';
import {
    buildGoalsViewModel,
    clampGoalHours,
    deleteGoalViaRuntime,
    formatGoalHours,
    refreshGoalsView,
    saveGoalViaRuntime,
    setGoalsPeriod,
    subscribeGoalsViewModel
} from '../contracts/goals-runtime.js';

function createDefaultForm(viewModel) {
    return {
        goalId: null,
        category: viewModel?.categories?.[0]?.name || '',
        dailyHours: 1,
        schedule: 'weekdays'
    };
}

function GoalCard({ icon, label, value, tooltip }) {
    return (
        <div className="bento-card bento-glow-primary">
            <div className="bento-card-header">
                <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-secondary)' }}>
                    <i className={`fas ${icon}`} style={{ color: 'var(--accent-primary)', marginRight: '6px' }}></i>
                    {label}
                </span>
                {tooltip ? (
                    <span className="metric-info" data-tooltip={tooltip}>
                        <i className="fas fa-info-circle"></i>
                    </span>
                ) : null}
            </div>
            <h2>{value}</h2>
        </div>
    );
}

export default function GoalsReactView() {
    const [viewModel, setViewModel] = useState(() => {
        try {
            return buildGoalsViewModel();
        } catch {
            return null;
        }
    });
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [formState, setFormState] = useState(() => createDefaultForm(null));

    const resetForm = (nextViewModel = viewModel) => {
        setFormState(createDefaultForm(nextViewModel));
    };

    useEffect(() => {
        try {
            const unsubscribeSnapshot = subscribeGoalsViewModel((nextViewModel) => {
                startTransition(() => {
                    setViewModel(nextViewModel);
                    setError(null);
                });
            });

            return () => {
                unsubscribeSnapshot?.();
            };
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar Metas em React.');
            return undefined;
        }
    }, []);

    useEffect(() => {
        if (!viewModel) return;

        setFormState((currentForm) => {
            const hasSelectedCategory = viewModel.categories.some((item) => item.name === currentForm.category);
            if (hasSelectedCategory) return currentForm;

            return {
                ...currentForm,
                category: viewModel.categories[0]?.name || ''
            };
        });
    }, [viewModel]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        refreshGoalsView();
        window.setTimeout(() => setIsRefreshing(false), 700);
    };

    const handleSubmit = () => {
        const result = saveGoalViaRuntime({
            goalId: formState.goalId,
            category: formState.category,
            dailyHours: formState.dailyHours,
            schedule: formState.schedule
        });

        if (result?.ok) {
            resetForm();
        }
    };

    const handleDelete = async (goalId) => {
        const result = await deleteGoalViaRuntime(goalId);
        if (result?.ok && formState.goalId === goalId) {
            resetForm();
        }
    };

    const handleEdit = (goalId) => {
        if (typeof window.editGoalItem === 'function') {
            window.editGoalItem(goalId);
        }
    };

    if (!viewModel) {
        return (
            <section className="goals-empty-state react-goals-inline-error">
                Nao foi possivel carregar o piloto React de Metas.
            </section>
        );
    }

    return (
        <div className="react-goals-shell">
            <div className="react-goals-header">
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px', color: 'var(--text-secondary)', letterSpacing: '3px', textTransform: 'uppercase' }}>
                        Metas /
                    </h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        Planeje por categoria
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '3px' }}>
                        Defina metas diarias e acompanhe o quanto voce realmente entregou.
                    </p>
                </div>

                <div className="react-goals-toolbar">
                    <div className="stats-period-selector">
                        {viewModel.periodOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={`stats-period-btn goals-period-btn ${viewModel.goalsPeriod === option.value ? 'active' : ''}`}
                                onClick={() => setGoalsPeriod(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>

                    <button type="button" className="stats-refresh-btn" title="Atualizar metas" onClick={handleRefresh}>
                        <i className={`fas fa-sync-alt ${isRefreshing ? 'spin' : ''}`}></i>
                    </button>
                </div>
            </div>

            {error ? (
                <div className="react-goals-inline-error">
                    Erro ao carregar runtime de Metas: {error}
                </div>
            ) : null}

            <div className="bento-grid-dashboard">
                <GoalCard
                    icon="fa-bullseye"
                    label="METAS BATIDAS"
                    value={viewModel.cards.hitRate}
                    tooltip="Quantidade de categorias que bateram a meta no periodo selecionado."
                />
                <GoalCard
                    icon="fa-chart-line"
                    label="PROGRESSO MEDIO"
                    value={viewModel.cards.averageProgress}
                    tooltip="Percentual entre o total realizado e o total planejado para as metas ativas."
                />
                <GoalCard
                    icon="fa-fire"
                    label="SEQUENCIA"
                    value={viewModel.cards.streak}
                    tooltip="Dias consecutivos em que todas as metas aplicaveis do dia foram cumpridas."
                />
                <GoalCard
                    icon="fa-award"
                    label="DESTAQUE"
                    value={viewModel.cards.bestCategory}
                    tooltip="Categoria com melhor percentual de execucao em relacao a meta no periodo."
                />

                <div className="bento-panel" style={{ gridColumn: 'span 4' }}>
                    <div className="goals-panel-header">
                        <div>
                            <h3 className="bento-panel-title" style={{ marginBottom: '4px' }}>COMPARATIVO POR CATEGORIA</h3>
                            <p className="goals-panel-subtitle">{viewModel.comparisonSubtitle}</p>
                        </div>
                        <div className="goals-status-pill">{viewModel.momentumBadge}</div>
                    </div>
                    <div className="goals-chart-container">
                        <div className="goals-comparison-list">
                            {viewModel.comparisonRows.length ? viewModel.comparisonRows.map((item) => (
                                <div key={item.id} className="goals-comparison-row">
                                    <div className="goals-comparison-head">
                                        <div className="goals-comparison-title-wrap">
                                            <div className="goals-comparison-name">{item.category}</div>
                                            <span className="goals-comparison-percent">{item.percentLabel}</span>
                                        </div>
                                        <span className="goals-comparison-status">{item.status}</span>
                                    </div>
                                    <div className="goals-comparison-track-wrap">
                                        <div className="goals-comparison-track">
                                            <div
                                                className="goals-comparison-fill"
                                                style={{
                                                    width: `${item.fillWidth}%`,
                                                    background: item.palette?.from,
                                                    color: item.palette?.from
                                                }}
                                            ></div>
                                            {item.actualLabel ? (
                                                <span
                                                    className={`goals-track-label actual ${item.actualAlignClass}`}
                                                    style={{ left: `${item.actualLabelLeft}%` }}
                                                >
                                                    {item.actualLabel}
                                                </span>
                                            ) : null}
                                            <div
                                                className="goals-comparison-target"
                                                style={{ left: `calc(${item.targetOffset}% - 1px)` }}
                                            ></div>
                                        </div>
                                        <div className="goals-comparison-footer">
                                            <span
                                                className={`goals-track-label target ${item.targetAlignClass}`}
                                                style={{ left: `${item.targetOffset}%` }}
                                            >
                                                {item.targetLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="goals-empty-state">
                                    Ainda nao ha metas ativas para comparar neste periodo.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bento-panel" style={{ gridColumn: 'span 2' }}>
                    <div className="goals-panel-header">
                        <div>
                            <h3 className="bento-panel-title" style={{ marginBottom: '4px' }}>CONFIGURAR META</h3>
                            <p className="goals-panel-subtitle">
                                Defina uma base diaria e o app expande para semana e mes.
                            </p>
                        </div>
                    </div>

                    <div className="goal-form-grid">
                        <div className="form-group goal-field goal-field-category">
                            <label htmlFor="reactGoalCategorySelect"><i className="fas fa-tag"></i> Categoria</label>
                            <select
                                id="reactGoalCategorySelect"
                                className="glass-select"
                                value={formState.category}
                                onChange={(event) => setFormState((currentForm) => ({
                                    ...currentForm,
                                    category: event.target.value
                                }))}
                            >
                                {viewModel.categories.map((category) => (
                                    <option key={category.name} value={category.name}>{category.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group goal-field goal-field-hours">
                            <label htmlFor="reactGoalHoursValue"><i className="fas fa-clock"></i> Horas por dia</label>
                            <div className="goal-hours-stepper">
                                <button
                                    type="button"
                                    className="goal-hours-btn"
                                    aria-label="Diminuir horas"
                                    onClick={() => setFormState((currentForm) => ({
                                        ...currentForm,
                                        dailyHours: clampGoalHours(currentForm.dailyHours - 0.5)
                                    }))}
                                >
                                    <i className="fas fa-minus"></i>
                                </button>
                                <div className="goal-hours-display">
                                    <span id="reactGoalHoursValue">{formatGoalHours(formState.dailyHours)}</span>
                                    <small>por dia</small>
                                </div>
                                <button
                                    type="button"
                                    className="goal-hours-btn"
                                    aria-label="Aumentar horas"
                                    onClick={() => setFormState((currentForm) => ({
                                        ...currentForm,
                                        dailyHours: clampGoalHours(currentForm.dailyHours + 0.5)
                                    }))}
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label><i className="fas fa-calendar-week"></i> Aplicar em</label>
                        <div className="stats-period-selector goal-schedule-selector">
                            {viewModel.scheduleOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={`stats-period-btn goal-schedule-btn ${formState.schedule === option.value ? 'active' : ''}`}
                                    onClick={() => setFormState((currentForm) => ({
                                        ...currentForm,
                                        schedule: option.value
                                    }))}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="modal-actions goal-form-actions react-goals-form-actions">
                        <button type="button" className="btn-modal primary" onClick={handleSubmit}>
                            <i className="fas fa-save"></i>
                            Salvar meta
                        </button>
                    </div>
                </div>

                <div className="bento-panel" style={{ gridColumn: 'span 2' }}>
                    <div className="goals-panel-header">
                        <div>
                            <h3 className="bento-panel-title" style={{ marginBottom: '4px' }}>METAS ATIVAS</h3>
                            <p className="goals-panel-subtitle">
                                Edite, remova ou acompanhe as categorias que vao puxar seu foco.
                            </p>
                        </div>
                    </div>

                    <div className="goals-list">
                        {viewModel.goals.length ? viewModel.goals.map((goal) => (
                            <div key={goal.id} className="goal-item">
                                <div className="goal-item-meta">
                                    <div className="goals-compact-meta">
                                        <span
                                            className="goals-category-dot"
                                            style={{ color: goal.palette?.from, background: goal.palette?.from }}
                                        ></span>
                                        <span className="goals-category-name">{goal.category}</span>
                                    </div>
                                    <span className="goal-item-subline">{goal.dailyHoursLabel} - {goal.scheduleLabel}</span>
                                </div>
                                <div className="goals-progress-wrap">
                                    <div className="goals-progress-top">
                                        <span>Meta diaria</span>
                                        <span>{goal.daysLabel}</span>
                                    </div>
                                    <div className="goals-progress-rail">
                                        <div
                                            className="goals-progress-actual"
                                            style={{ width: '100%', background: goal.palette?.from, color: goal.palette?.from }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="goal-item-actions">
                                    <button type="button" className="goal-item-btn" title="Editar meta" onClick={() => handleEdit(goal.id)}>
                                        <i className="fas fa-pen"></i>
                                    </button>
                                    <button
                                        type="button"
                                        className="goal-item-btn danger"
                                        title="Remover meta"
                                        onClick={() => handleDelete(goal.id)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="goals-empty-state">
                                Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
