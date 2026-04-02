(() => {
    let deps = null;
    let statsInteractionsBound = false;
    let goalsInteractionsBound = false;

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenLegacyGoalsStats;
    };

    const getState = () => ({
        focusGoals: deps?.getFocusGoals?.() ?? [],
        focusHistory: deps?.getFocusHistory?.() ?? [],
        tasks: deps?.getTasks?.() ?? [],
        username: deps?.getUsername?.() ?? 'Convidado',
        currentStatsPeriod: deps?.getCurrentStatsPeriod?.() ?? 'week',
        currentGoalsPeriod: deps?.getCurrentGoalsPeriod?.() ?? 'week'
    });

    const syncActiveButton = (selector, activeValue) => {
        document.querySelectorAll(selector).forEach((button) => {
            button.classList.toggle('active', button.dataset.period === activeValue);
        });
    };

    const renderStatsGoalsSummary = (period) => {
        const periodLabel = document.getElementById('statsGoalsPeriodLabel');
        const badgeEl = document.getElementById('statsGoalsStatusBadge');
        const headlineEl = document.getElementById('statsGoalsHeadline');
        const captionEl = document.getElementById('statsGoalsCaption');
        const listEl = document.getElementById('statsGoalsSummaryList');
        if (!badgeEl || !headlineEl || !captionEl || !listEl) return;

        const overview = deps?.getGoalOverviewData?.(period);
        const momentum = deps?.getGoalMomentumContent?.(overview);
        const series = deps?.getGoalEvolutionSeriesData?.(period) ?? [];

        if (!overview || !momentum) return;

        if (periodLabel) periodLabel.textContent = deps?.getPeriodLabel?.(period) ?? period;
        badgeEl.textContent = momentum.badge;
        headlineEl.textContent = momentum.headline;
        captionEl.textContent = '';

        if (!overview.summaries.length || !series.length) {
            listEl.innerHTML = '<div class="goals-empty-state">Defina metas na aba Metas para acompanhar a evolucao do seu plano por periodo.</div>';
            return;
        }

        const overallPercent = overview.totalTarget > 0
            ? Math.max(0, Math.round((overview.totalActual / overview.totalTarget) * 100))
            : 0;

        listEl.innerHTML = `
            <div class="goals-rhythm-overview">
                <div class="goals-rhythm-main">
                    <div class="goals-rhythm-main-top">
                        <div>
                            <div class="goals-rhythm-kicker">Total do periodo</div>
                            <div class="goals-rhythm-value">${deps?.formatMinutesToHours?.(overview.totalActual)} <span>de ${deps?.formatMinutesToHours?.(overview.totalTarget)}</span></div>
                        </div>
                        <div class="goals-rhythm-percent">${overallPercent}%</div>
                    </div>
                    <div class="goals-rhythm-rail">
                        <div class="goals-rhythm-fill" style="width:${Math.min(100, overallPercent)}%"></div>
                    </div>
                </div>
            </div>
        `;
    };

    const renderGoalsComparisonChart = (period) => {
        const listEl = document.getElementById('goalsComparisonList');
        if (!listEl) return;

        const overview = deps?.getGoalOverviewData?.(period);
        const titleEl = document.getElementById('goalsChartSubtitle');
        const pillEl = document.getElementById('goalsMomentumPill');
        const momentum = deps?.getGoalMomentumContent?.(overview);

        if (!overview || !momentum) return;

        if (titleEl) {
            titleEl.textContent = `${deps?.formatMinutesToHours?.(overview.totalActual)} entregues de ${deps?.formatMinutesToHours?.(overview.totalTarget)} planejados.`;
        }
        if (pillEl) pillEl.textContent = momentum.badge;

        if (!overview.summaries.length) {
            listEl.innerHTML = '<div class="goals-empty-state">Ainda nao ha metas ativas para comparar neste periodo.</div>';
            return;
        }

        const maxHours = Math.max(
            ...overview.summaries.flatMap((item) => [item.targetMinutes / 60, item.actualMinutes / 60]),
            1
        );

        listEl.innerHTML = overview.summaries.map((item) => {
            const actualHours = item.actualMinutes / 60;
            const targetHours = item.targetMinutes / 60;
            const actualWidth = Math.min(100, (actualHours / maxHours) * 100);
            const fillWidth = item.actualMinutes > 0 ? Math.max(actualWidth, 6) : 0;
            const targetOffset = Math.min(100, (targetHours / maxHours) * 100);
            const deltaMinutes = item.actualMinutes - item.targetMinutes;
            const deltaText = deltaMinutes === 0
                ? 'Meta atingida'
                : deltaMinutes > 0
                    ? `Passou ${deps?.formatMinutesToHours?.(Math.abs(deltaMinutes))}`
                    : `Faltam ${deps?.formatMinutesToHours?.(Math.abs(deltaMinutes))}`;
            const percentLabel = `${Math.max(0, item.percent)}%`;
            const actualLabelLeft = fillWidth > 0 ? Math.min(96, fillWidth) : 0;
            const actualAlignClass = fillWidth > 86 ? 'end' : 'after-fill';
            const targetAlignClass = targetOffset < 14 ? 'start' : (targetOffset > 86 ? 'end' : '');
            const actualLabelMarkup = item.actualMinutes > 0
                ? `<span class="goals-track-label actual ${actualAlignClass}" style="left:${actualLabelLeft}%;">Realizado ${deps?.formatMinutesToHours?.(item.actualMinutes)}</span>`
                : '';

            return `
                <div class="goals-comparison-row">
                    <div class="goals-comparison-head">
                        <div class="goals-comparison-title-wrap">
                            <div class="goals-comparison-name">${item.category}</div>
                            <span class="goals-comparison-percent">${percentLabel}</span>
                        </div>
                        <span class="goals-comparison-status">${deltaText}</span>
                    </div>
                    <div class="goals-comparison-track-wrap">
                        <div class="goals-comparison-track">
                            <div class="goals-comparison-fill" style="width:${fillWidth}%; background:${item.palette.from}; color:${item.palette.from};"></div>
                            ${actualLabelMarkup}
                            <div class="goals-comparison-target" style="left:calc(${targetOffset}% - 1px);"></div>
                        </div>
                        <div class="goals-comparison-footer">
                            <span class="goals-track-label target ${targetAlignClass}" style="left:${targetOffset}%;">Meta ${deps?.formatMinutesToHours?.(item.targetMinutes)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderGoalsList = () => {
        const listEl = document.getElementById('goalsList');
        if (!listEl) return;

        const { focusGoals } = getState();
        if (!focusGoals.length) {
            listEl.innerHTML = '<div class="goals-empty-state">Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.</div>';
            return;
        }

        listEl.innerHTML = focusGoals
            .slice()
            .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
            .map((goal) => {
                const palette = deps?.resolveCategoryPalette?.(goal.category);
                const scheduleLabel = goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias uteis';
                const dailyHours = ((Number(goal.dailyMinutes) || 0) / 60).toFixed(1).replace('.0', '').replace('.', ',');

                return `
                    <div class="goal-item">
                        <div class="goal-item-meta">
                            <div class="goals-compact-meta">
                                <span class="goals-category-dot" style="color:${palette?.from}; background:${palette?.from};"></span>
                                <span class="goals-category-name">${goal.category}</span>
                            </div>
                            <span class="goal-item-subline">${dailyHours}h por dia - ${scheduleLabel}</span>
                        </div>
                        <div class="goals-progress-wrap">
                            <div class="goals-progress-top">
                                <span>Meta diaria</span>
                                <span>${goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex'}</span>
                            </div>
                            <div class="goals-progress-rail">
                                <div class="goals-progress-actual" style="width:100%; background:${palette?.from}; color:${palette?.from};"></div>
                            </div>
                        </div>
                        <div class="goal-item-actions">
                            <button class="goal-item-btn" type="button" onclick="window.editGoalItem(${goal.id})" title="Editar meta"><i class="fas fa-pen"></i></button>
                            <button class="goal-item-btn danger" type="button" onclick="window.deleteGoalItem(${goal.id})" title="Remover meta"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join('');
    };

    const compileGoalsData = () => {
        const period = deps?.getCurrentGoalsPeriod?.() ?? 'week';
        const overview = deps?.getGoalOverviewData?.(period);
        if (!overview) return;

        const bestLabel = overview.bestCategory
            ? `${overview.bestCategory.category} ${Math.max(0, overview.bestCategory.percent)}%`
            : 'Sem dados';

        document.getElementById('goalsHitRate').textContent = `${overview.hitCount}/${overview.activeCount}`;
        document.getElementById('goalsAverageProgress').textContent = `${Math.max(0, overview.averageProgress)}%`;
        document.getElementById('goalsStreakValue').textContent = `${overview.streak} dias`;
        document.getElementById('goalsBestCategory').textContent = bestLabel;

        deps?.renderGoalCategoryOptions?.();
        renderGoalsComparisonChart(period);
        renderGoalsList();
        syncActiveButton('#goalsPeriodSelector .goals-period-btn', period);
    };

    const renderStatsOverview = () => {
        const { focusHistory, tasks, username } = getState();
        const period = deps?.getCurrentStatsPeriod?.() ?? 'week';
        const summary = deps?.getFocusWindowSummaryData?.() ?? {};
        const greetingState = deps?.getFocusGreetingStateData?.({
            todayMinutes: summary.todayMinutes,
            weekMinutes: summary.weekMinutes
        });
        const streak = deps?.getFocusStreakSummaryData?.() ?? { currentStreak: 0, maxStreak: 0 };

        document.getElementById('statsFocusToday').textContent = deps?.formatMinutesToHours?.(summary.todayMinutes || 0);
        document.getElementById('statsFocusWeek').textContent = deps?.formatMinutesToHours?.(summary.weekMinutes || 0);

        const firstName = String(username || 'Convidado').split(' ')[0];
        let greetingTitle = `Mandou bem, ${firstName}!`;
        let greetingSub = 'Aqui esta o resumo do seu foco.';

        if (greetingState === 'master') {
            greetingTitle = `Mestre do Foco, ${firstName}`;
            greetingSub = 'Seu desempenho hoje foi excepcional.';
        } else if (greetingState === 'consistent') {
            greetingTitle = `Consistente, ${firstName}`;
            greetingSub = 'Otimo ritmo, cada minuto focado conta.';
        } else if (greetingState === 'start') {
            greetingTitle = `Hora de focar, ${firstName}`;
            greetingSub = 'Inicie uma sessao de foco para registrar seu dia.';
        }

        const titleEl = document.getElementById('statsGreetingTitle');
        const subEl = document.getElementById('statsGreetingSubtitle');
        if (titleEl) titleEl.innerHTML = greetingTitle;
        if (subEl) subEl.innerHTML = greetingSub;

        document.getElementById('statsStreak').innerHTML = `<i class="fas fa-fire glow-icon-primary"></i>${streak.currentStreak} Dias`;
        document.getElementById('statsStreakPercent').textContent = `Melhor: ${streak.maxStreak}`;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((task) => task.completed).length;
        let rate = 0;

        if (totalTasks === 0 && focusHistory.length > 0) {
            rate = Math.floor(Math.random() * 20) + 70;
        } else if (totalTasks > 0) {
            rate = Math.round((completedTasks / totalTasks) * 100);
        }

        document.getElementById('statsCompletion').innerHTML = `${rate}% <span style="font-size:1rem;font-weight:400;color:var(--text-secondary);margin-left:8px;">de foco</span>`;

        const filteredHistory = deps?.filterHistoryForPeriod?.(focusHistory, period) ?? [];
        deps?.renderCategoriesChart?.(filteredHistory);
        deps?.renderPeriodBarChart?.(focusHistory, period);
        renderStatsGoalsSummary(period);
        syncActiveButton('#statsPeriodSelector .stats-period-btn', period);
    };

    const bindGoalAndStatsInteractions = () => {
        if (!statsInteractionsBound) {
            statsInteractionsBound = true;

            document.querySelectorAll('#statsPeriodSelector .stats-period-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    deps?.setCurrentStatsPeriod?.(button.dataset.period || 'week');
                    renderStatsOverview();
                });
            });

            document.getElementById('btnRefreshStats')?.addEventListener('click', () => {
                const icon = document.getElementById('refreshIcon');
                if (icon) {
                    icon.classList.add('spin');
                    setTimeout(() => icon.classList.remove('spin'), 700);
                }

                const statsView = document.getElementById('view-stats');
                if (statsView) {
                    statsView.classList.remove('stats-anim-in');
                    void statsView.offsetWidth;
                    statsView.classList.add('stats-anim-in');
                }

                deps?.compileDashboardData?.();
            });
        }

        if (!goalsInteractionsBound) {
            goalsInteractionsBound = true;

            document.querySelectorAll('#goalsPeriodSelector .goals-period-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    deps?.setCurrentGoalsPeriod?.(button.dataset.period || 'week');
                    compileGoalsData();
                });
            });

            document.querySelectorAll('.goal-schedule-btn').forEach((button) => {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.goal-schedule-btn').forEach((item) => item.classList.remove('active'));
                    button.classList.add('active');
                    document.getElementById('goalScheduleInput').value = button.dataset.schedule;
                });
            });

            document.getElementById('goalHoursDecrease')?.addEventListener('click', () => {
                const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
                deps?.updateGoalHoursDisplay?.(currentHours - 0.5);
            });

            document.getElementById('goalHoursIncrease')?.addEventListener('click', () => {
                const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
                deps?.updateGoalHoursDisplay?.(currentHours + 0.5);
            });

            document.getElementById('btnSaveGoal')?.addEventListener('click', () => {
                const category = document.getElementById('goalCategorySelect')?.value;
                const dailyHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value);
                const dailyMinutes = Math.round((dailyHours || 0) * 60);
                const schedule = document.getElementById('goalScheduleInput')?.value || 'weekdays';
                const result = deps?.saveGoalEntry?.({ category, dailyMinutes, schedule });
                if (!result?.ok) {
                    deps?.showGlassToast?.(result?.message || 'Nao foi possivel salvar a meta.');
                    return;
                }

                deps?.resetGoalForm?.();
                deps?.showGlassToast?.(result.message);
            });

            document.getElementById('btnCancelGoalEdit')?.addEventListener('click', () => {
                deps?.resetGoalForm?.();
            });

            document.getElementById('btnRefreshGoals')?.addEventListener('click', () => {
                const icon = document.getElementById('goalsRefreshIcon');
                if (icon) {
                    icon.classList.add('spin');
                    setTimeout(() => icon.classList.remove('spin'), 700);
                }
                compileGoalsData();
            });
        }
    };

    window.FocoZenLegacyGoalsStats = Object.freeze({
        configure,
        renderStatsGoalsSummary,
        renderGoalsComparisonChart,
        renderGoalsList,
        compileGoalsData,
        bindGoalAndStatsInteractions,
        renderStatsOverview
    });
})();
