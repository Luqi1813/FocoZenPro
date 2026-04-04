function formatMinutesToHours(minutes) {
    if (historyCore?.formatMinutesToHours) {
        return historyCore.formatMinutesToHours(minutes);
    }

    const totalMinutes = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function getFocusWindowSummaryData() {
    if (historyCore?.getFocusWindowSummary) {
        return historyCore.getFocusWindowSummary({ history: focusHistory, now: new Date() });
    }

    return {
        todayHistory: [],
        todayMinutes: 0,
        weekHistory: [],
        weekMinutes: 0
    };
}

function getFocusStreakSummaryData() {
    if (historyCore?.getFocusStreakSummary) {
        return historyCore.getFocusStreakSummary({ history: focusHistory, now: new Date() });
    }

    return {
        currentStreak: 0,
        maxStreak: 0
    };
}

function getFocusGreetingStateData({ todayMinutes, weekMinutes }) {
    if (historyCore?.getFocusGreetingState) {
        return historyCore.getFocusGreetingState({ todayMinutes, weekMinutes });
    }

    return 'default';
}

function getSortedGoalCategoriesData() {
    if (goalsCore?.getSortedGoalCategories) {
        return goalsCore.getSortedGoalCategories({
            userCategories,
            defaultCategories,
            focusGoals,
            locale: 'pt-BR'
        });
    }

    return [];
}

function getActiveGoalsData() {
    if (goalsCore?.getActiveGoals) {
        return goalsCore.getActiveGoals(focusGoals);
    }

    return [];
}

function getGoalOverviewData(period) {
    if (goalsCore?.getGoalOverview) {
        return goalsCore.getGoalOverview({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return {
        summaries: [],
        activeCount: 0,
        hitCount: 0,
        totalTarget: 0,
        totalActual: 0,
        averageProgress: 0,
        bestCategory: null,
        streak: 0
    };
}

function getGoalEvolutionSeriesData(period) {
    if (goalsCore?.getGoalEvolutionSeries) {
        return goalsCore.getGoalEvolutionSeries({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return [];
}

function resolveCategoryPalette(category, index = 0) {
    if (goalsCore?.getCategoryPalette) {
        return goalsCore.getCategoryPalette(category, index);
    }

    return { from: '#60a5fa', to: '#2563eb' };
}

function getGoalMomentumContent(overview) {
    const momentumState = goalsCore?.getGoalMomentumState
        ? goalsCore.getGoalMomentumState(overview)
        : 'empty';

    if (momentumState === 'ahead') {
        return {
            badge: 'Meta batida',
            headline: 'Voce esta entregando acima do planejado neste periodo.',
            caption: `Excelente ritmo: ${overview.hitCount} de ${overview.activeCount} categorias ja bateram a meta.`,
            encouragement: 'Voce esta construindo consistencia real. Tente manter esse padrao ate o fim do periodo.',
            nextAction: 'Se continuar assim, vale subir um pouco a meta da categoria mais estavel.'
        };
    }

    if (momentumState === 'near') {
        return {
            badge: 'Quase la',
            headline: 'Falta pouco para transformar seu planejamento em meta cumprida.',
            caption: `Voce ja percorreu ${overview.averageProgress}% do caminho planejado neste periodo.`,
            encouragement: 'Seu ritmo esta forte. Um ultimo bloco bem usado pode virar varias metas em verde.',
            nextAction: 'Priorize primeiro a categoria mais perto de 100% para ganhar tracao.'
        };
    }

    if (momentumState === 'moving') {
        return {
            badge: 'Em movimento',
            headline: 'O foco ja comecou. Agora vale alinhar melhor energia e prioridade.',
            caption: `Voce entregou ${formatMinutesToHours(overview.totalActual)} de ${formatMinutesToHours(overview.totalTarget)} planejados.`,
            encouragement: 'Mesmo longe do alvo, cada bloco concluido reduz a distancia ate a meta.',
            nextAction: 'Concentre o proximo ciclo na categoria mais importante do seu dia.'
        };
    }

    if (momentumState === 'start') {
        return {
            badge: 'Hora de iniciar',
            headline: 'Ainda nao houve foco registrado para as metas deste periodo.',
            caption: 'Um unico bloco iniciado ja comeca a dar forma para sua semana.',
            encouragement: 'Nao precisa esperar motivacao perfeita. Comece pequeno e deixe o ritmo aparecer.',
            nextAction: 'Escolha a categoria mais critica e faca um primeiro bloco de foco agora.'
        };
    }

    return {
        badge: 'Sem metas ativas',
        headline: 'Crie metas por categoria para acompanhar seu ritmo real de foco.',
        caption: 'Assim que houver metas, este painel compara o planejado com o realizado.',
        encouragement: 'Configure suas primeiras metas e transforme foco em rotina.',
        nextAction: 'Comece com 1 ou 2 categorias principais para criar consistencia sem friccao.'
    };
}

function renderGoalCategoryOptions() {
    const select = document.getElementById('goalCategorySelect');
    if (!select) return;

    const categories = getSortedGoalCategoriesData();
    const currentValue = editingGoalId
        ? (focusGoals.find(goal => goal.id === editingGoalId)?.category || categories[0]?.name || '')
        : (select.value || categories[0]?.name || '');

    select.innerHTML = '';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.name;
        option.textContent = category.name;
        select.appendChild(option);
    });

    if (categories.length) {
        select.value = categories.some(cat => cat.name === currentValue) ? currentValue : categories[0].name;
    }
}

function resetGoalForm() {
    editingGoalId = null;
    const minutesInput = document.getElementById('goalDailyMinutesInput');
    const scheduleInput = document.getElementById('goalScheduleInput');
    const cancelBtn = document.getElementById('btnCancelGoalEdit');

    renderGoalCategoryOptions();
    if (minutesInput) minutesInput.value = 1;
    if (scheduleInput) scheduleInput.value = 'weekdays';
    document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === 'weekdays');
    });
    if (cancelBtn) cancelBtn.classList.add('hidden');
    updateGoalHoursDisplay(1);
}

function normalizeGoalHours(value) {
    const safeValue = Number.isFinite(value) ? value : 1;
    const stepped = Math.round(Math.max(0.5, safeValue) * 2) / 2;
    return stepped;
}

function updateGoalHoursDisplay(hours) {
    const normalizedHours = normalizeGoalHours(hours);
    const input = document.getElementById('goalDailyMinutesInput');
    const label = document.getElementById('goalHoursValue');
    if (input) input.value = normalizedHours.toString();
    if (label) label.textContent = `${normalizedHours.toFixed(1).replace('.0', '').replace('.', ',')}h`;
}

function saveGoalEntry({ goalId = null, category, dailyMinutes, schedule }) {
    if (!category) {
        return { ok: false, message: 'Selecione uma categoria para criar a meta.' };
    }

    if (!dailyMinutes || dailyMinutes <= 0) {
        return { ok: false, message: 'Informe uma meta diária válida em horas.' };
    }

    const duplicateGoal = focusGoals.find(goal => goal.category === category && goal.id !== goalId);
    if (duplicateGoal) {
        return { ok: false, message: 'Essa categoria ja possui uma meta. Edite a existente ou escolha outra.' };
    }

    if (goalId) {
        focusGoals = focusGoals.map(goal => goal.id === goalId
            ? { ...goal, category, dailyMinutes, schedule, active: true }
            : goal
        );
    } else {
        focusGoals.push({
            id: Date.now(),
            category,
            dailyMinutes,
            schedule,
            active: true
        });
    }

    saveFocusGoals();
    renderStatsGoalsSummary(window._statsPeriod || 'week');
    window.compileGoalsData?.();

    return {
        ok: true,
        message: goalId ? 'Meta atualizada.' : 'Meta criada.'
    };
}

function openGoalEditModal(goalId) {
    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    const categories = getSortedGoalCategoriesData();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active custom-popup goal-edit-modal';
    overlay.innerHTML = `
        <div class="elegant-popup goal-edit-popup">
            <div class="elegant-icon" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
                <i class="fas fa-pen"></i>
            </div>
            <h3 class="elegant-title">Editar meta</h3>
            <p class="elegant-message">Ajuste a categoria, a carga diaria e os dias em que essa meta vale.</p>
            <div class="goal-form-grid">
                <div class="form-group goal-field goal-field-category">
                    <label for="goalEditCategorySelect"><i class="fas fa-tag"></i> Categoria</label>
                    <select id="goalEditCategorySelect" class="glass-select">
                        ${categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group goal-field goal-field-hours">
                    <label><i class="fas fa-clock"></i> Horas por dia</label>
                    <div class="goal-hours-stepper">
                        <button class="goal-hours-btn" type="button" data-goal-edit-step="-0.5" aria-label="Diminuir horas"><i class="fas fa-minus"></i></button>
                        <div class="goal-hours-display">
                            <span id="goalEditHoursValue">1h</span>
                            <small>por dia</small>
                        </div>
                        <button class="goal-hours-btn" type="button" data-goal-edit-step="0.5" aria-label="Aumentar horas"><i class="fas fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label><i class="fas fa-calendar-week"></i> Aplicar em</label>
                <div class="stats-period-selector goal-schedule-selector">
                    <button class="stats-period-btn goal-edit-schedule-btn" data-schedule="weekdays" type="button">Dias uteis</button>
                    <button class="stats-period-btn goal-edit-schedule-btn" data-schedule="everyday" type="button">Semana inteira</button>
                </div>
            </div>
            <div class="goal-form-actions">
                <button class="btn-modal secondary btn-goal-edit-cancel" type="button">Cancelar</button>
                <button class="btn-modal primary btn-goal-edit-save" type="button"><i class="fas fa-save"></i>Salvar alteracoes</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const select = overlay.querySelector('#goalEditCategorySelect');
    const valueLabel = overlay.querySelector('#goalEditHoursValue');
    const scheduleButtons = overlay.querySelectorAll('.goal-edit-schedule-btn');
    let currentHours = normalizeGoalHours((Number(goal.dailyMinutes) || 0) / 60);
    let currentSchedule = goal.schedule || 'weekdays';

    if (select) select.value = goal.category;

    const syncModalHours = () => {
        if (valueLabel) {
            valueLabel.textContent = `${currentHours.toFixed(1).replace('.0', '').replace('.', ',')}h`;
        }
    };

    syncModalHours();
    scheduleButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === currentSchedule);
        btn.addEventListener('click', () => {
            currentSchedule = btn.dataset.schedule;
            scheduleButtons.forEach(item => item.classList.toggle('active', item === btn));
        });
    });

    overlay.querySelectorAll('[data-goal-edit-step]').forEach(btn => {
        btn.addEventListener('click', () => {
            const step = parseFloat(btn.dataset.goalEditStep || '0');
            currentHours = normalizeGoalHours(currentHours + step);
            syncModalHours();
        });
    });

    overlay.querySelector('.btn-goal-edit-cancel')?.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.remove();
    });

    overlay.querySelector('.btn-goal-edit-save')?.addEventListener('click', () => {
        const category = select?.value || '';
        const dailyMinutes = Math.round(currentHours * 60);
        const result = saveGoalEntry({
            goalId: goal.id,
            category,
            dailyMinutes,
            schedule: currentSchedule
        });

        if (!result.ok) {
            showGlassToast(result.message);
            return;
        }

        overlay.remove();
        resetGoalForm();
        showGlassToast(result.message);
    });
}

function injectFakeDataIfNeeded() {
    return;
}

window.compileDashboardData = function() {
    injectFakeDataIfNeeded();
    return window.FocoZenStatsRuntime?.refresh?.();
};
