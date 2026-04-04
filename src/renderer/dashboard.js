function formatMinutesToHours(minutes) {
    if (historyCore?.formatMinutesToHours) {
        return historyCore.formatMinutesToHours(minutes);
    }

    const totalMinutes = Math.max(0, Number(minutes) || 0);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = Math.floor(totalMinutes % 60);
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function filterHistoryForPeriod(history, period) {
    if (historyCore?.filterHistoryByPeriod) {
        return historyCore.filterHistoryByPeriod(history, period, new Date());
    }

    return Array.isArray(history) ? history : [];
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

function getGoalSummariesData(period) {
    if (goalsCore?.getGoalSummaries) {
        return goalsCore.getGoalSummaries({
            focusGoals,
            focusHistory,
            period,
            now: new Date()
        });
    }

    return [];
}

function getDailyGoalOutcomeData(date) {
    if (goalsCore?.getDailyGoalOutcome) {
        return goalsCore.getDailyGoalOutcome({
            focusGoals,
            focusHistory,
            date
        });
    }

    return {
        targetMinutes: 0,
        actualMinutes: 0,
        activeCategories: 0,
        hitCategories: 0,
        hitAll: false
    };
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

const categoryPalette = [
    { from: '#60a5fa', to: '#2563eb' },
    { from: '#34d399', to: '#059669' },
    { from: '#f59e0b', to: '#d97706' },
    { from: '#f472b6', to: '#db2777' },
    { from: '#a78bfa', to: '#7c3aed' },
    { from: '#22d3ee', to: '#0891b2' },
    { from: '#fb7185', to: '#e11d48' },
    { from: '#4ade80', to: '#16a34a' },
    { from: '#fbbf24', to: '#ca8a04' },
    { from: '#38bdf8', to: '#0284c7' },
    { from: '#94a3b8', to: '#64748b' },
    { from: '#c084fc', to: '#9333ea' }
];

function getSortedGoalCategories() {
    const baseCategories = userCategories.length ? userCategories : defaultCategories;
    const goalCats = focusGoals.map(goal => ({ name: goal.category, icon: 'fa-bullseye' }));
    const merged = [...baseCategories, ...goalCats]
        .filter(cat => cat && cat.name && cat.name !== 'Livre')
        .reduce((acc, cat) => {
            if (!acc.some(item => item.name === cat.name)) acc.push(cat);
            return acc;
        }, []);

    return merged.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

function getCategoryPalette(category, index = 0) {
    const known = {
        'Trabalho': categoryPalette[0],
        'Livre': categoryPalette[3],
        'Estudos': categoryPalette[1],
        'Hobbies': categoryPalette[2],
        'Leitura': categoryPalette[6],
        'Projetos': categoryPalette[4],
        'Exercício': categoryPalette[5],
        'Outros': categoryPalette[10]
    };

    if (category && known[category]) return known[category];
    if (index >= 0) return categoryPalette[index % categoryPalette.length];

    let hash = 0;
    for (let i = 0; i < (category || '').length; i++) {
        hash = ((hash << 5) - hash) + category.charCodeAt(i);
        hash |= 0;
    }

    return categoryPalette[Math.abs(hash) % categoryPalette.length];
}

function getPeriodDateRange(period) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    if (period === 'day') {
        start.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
}

function enumeratePeriodDates(period) {
    const { start, end } = getPeriodDateRange(period);
    const dates = [];
    const cursor = new Date(start);

    while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

function isGoalApplicableOnDate(goal, date) {
    if (!goal || !date) return false;
    const dayOfWeek = date.getDay();
    if (goal.schedule === 'everyday') return true;
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function getActiveGoals() {
    return focusGoals.filter(goal => goal && goal.active !== false && goal.category && Number(goal.dailyMinutes) > 0);
}

function getGoalSummaries(period) {
    const activeGoals = getActiveGoalsData();
    const dates = enumeratePeriodDates(period);
    const actualByCategory = {};

    filterHistoryByPeriod(focusHistory, period).forEach(entry => {
        const category = entry.category || 'Livre';
        actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry.durationMinutes) || 0);
    });

    return activeGoals.map((goal, index) => {
        const targetMinutes = dates.reduce((sum, date) => {
            return sum + (isGoalApplicableOnDate(goal, date) ? Number(goal.dailyMinutes) || 0 : 0);
        }, 0);
        const actualMinutes = actualByCategory[goal.category] || 0;
        const percent = targetMinutes > 0 ? Math.round((actualMinutes / targetMinutes) * 100) : 0;
        return {
            ...goal,
            index,
            targetMinutes,
            actualMinutes,
            remainingMinutes: Math.max(0, targetMinutes - actualMinutes),
            percent,
            palette: getCategoryPalette(goal.category, index)
        };
    }).sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        return b.actualMinutes - a.actualMinutes;
    });
}

function getDailyGoalOutcome(date) {
    const activeGoals = getActiveGoalsData();
    let targetMinutes = 0;
    let actualMinutes = 0;
    let activeCategories = 0;
    let hitCategories = 0;
    const dateStr = date.toISOString().split('T')[0];
    const actualByCategory = {};

    focusHistory
        .filter(entry => entry.date === dateStr)
        .forEach(entry => {
            const category = entry.category || 'Livre';
            actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry.durationMinutes) || 0);
        });

    activeGoals.forEach(goal => {
        if (!isGoalApplicableOnDate(goal, date)) return;
        const target = Number(goal.dailyMinutes) || 0;
        const actual = actualByCategory[goal.category] || 0;
        targetMinutes += target;
        actualMinutes += actual;
        activeCategories++;
        if (actual >= target) hitCategories++;
    });

    return {
        targetMinutes,
        actualMinutes,
        activeCategories,
        hitCategories,
        hitAll: activeCategories > 0 && hitCategories === activeCategories
    };
}

function getGoalStreak() {
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (let i = 0; i < 90; i++) {
        const outcome = getDailyGoalOutcome(cursor);
        if (outcome.activeCategories === 0) {
            cursor.setDate(cursor.getDate() - 1);
            continue;
        }
        if (!outcome.hitAll) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function getGoalOverview(period) {
    const summaries = getGoalSummaries(period);
    const activeCount = summaries.length;
    const hitCount = summaries.filter(item => item.actualMinutes >= item.targetMinutes && item.targetMinutes > 0).length;
    const totalTarget = summaries.reduce((sum, item) => sum + item.targetMinutes, 0);
    const totalActual = summaries.reduce((sum, item) => sum + item.actualMinutes, 0);
    const averageProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const bestCategory = summaries.length ? summaries.reduce((best, item) => {
        if (!best) return item;
        if (item.percent !== best.percent) return item.percent > best.percent ? item : best;
        return item.actualMinutes > best.actualMinutes ? item : best;
    }, null) : null;

    return {
        summaries,
        activeCount,
        hitCount,
        totalTarget,
        totalActual,
        averageProgress,
        bestCategory,
        streak: getGoalStreak()
    };
}

function getPeriodLabel(period) {
    return {
        day: 'Hoje',
        week: 'Semana atual',
        month: 'Ultimos 30 dias'
    }[period] || 'Semana atual';
}

function getGoalMomentum(overview) {
    if (!overview.activeCount) {
        return {
            badge: 'Sem metas ativas',
            headline: 'Crie metas por categoria para acompanhar seu ritmo real de foco.',
            caption: 'Assim que houver metas, este painel compara o planejado com o realizado.',
            encouragement: 'Configure suas primeiras metas e transforme foco em rotina.',
            nextAction: 'Comece com 1 ou 2 categorias principais para criar consistencia sem friccao.'
        };
    }

    if (overview.averageProgress >= 100) {
        return {
            badge: 'Meta batida',
            headline: 'Voce esta entregando acima do planejado neste periodo.',
            caption: `Excelente ritmo: ${overview.hitCount} de ${overview.activeCount} categorias ja bateram a meta.`,
            encouragement: 'Voce esta construindo consistencia real. Tente manter esse padrao ate o fim do periodo.',
            nextAction: 'Se continuar assim, vale subir um pouco a meta da categoria mais estavel.'
        };
    }

    if (overview.averageProgress >= 80) {
        return {
            badge: 'Quase la',
            headline: 'Falta pouco para transformar seu planejamento em meta cumprida.',
            caption: `Voce ja percorreu ${overview.averageProgress}% do caminho planejado neste periodo.`,
            encouragement: 'Seu ritmo esta forte. Um ultimo bloco bem usado pode virar varias metas em verde.',
            nextAction: 'Priorize primeiro a categoria mais perto de 100% para ganhar tracao.'
        };
    }

    if (overview.totalActual > 0) {
        return {
            badge: 'Em movimento',
            headline: 'O foco ja comecou. Agora vale alinhar melhor energia e prioridade.',
            caption: `Voce entregou ${formatMinsToHours(overview.totalActual)} de ${formatMinsToHours(overview.totalTarget)} planejados.`,
            encouragement: 'Mesmo longe do alvo, cada bloco concluido reduz a distancia ate a meta.',
            nextAction: 'Concentre o proximo ciclo na categoria mais importante do seu dia.'
        };
    }

    return {
        badge: 'Hora de iniciar',
        headline: 'Ainda nao houve foco registrado para as metas deste periodo.',
        caption: 'Um unico bloco iniciado ja comeca a dar forma para sua semana.',
        encouragement: 'Nao precisa esperar motivacao perfeita. Comece pequeno e deixe o ritmo aparecer.',
        nextAction: 'Escolha a categoria mais critica e faça um primeiro bloco de foco agora.'
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

function populateGoalForm(goalId) {
    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    editingGoalId = goal.id;
    renderGoalCategoryOptions();
    document.getElementById('goalCategorySelect').value = goal.category;
    document.getElementById('goalDailyMinutesInput').value = ((Number(goal.dailyMinutes) || 0) / 60).toString();
    document.getElementById('goalScheduleInput').value = goal.schedule || 'weekdays';
    document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.schedule === (goal.schedule || 'weekdays'));
    });
    document.getElementById('btnCancelGoalEdit')?.classList.remove('hidden');
    updateGoalHoursDisplay(goal.dailyMinutes / 60);
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

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js not loaded yet");
        return;
    }

    injectFakeDataIfNeeded();

    const { todayHistory, todayMinutes, weekMinutes } = getFocusWindowSummaryData();
    document.getElementById('statsFocusToday').textContent = formatMinutesToHours(todayMinutes);
    document.getElementById('statsFocusWeek').textContent = formatMinutesToHours(weekMinutes);
    
    // Greeting Title Logic
    const firstName = username.split(' ')[0];
    let greetingTitle = `Mandou bem, ${firstName}!`;
    let greetingSub = "Aqui está o resumo do seu foco.";
    
    const greetingState = getFocusGreetingStateData({ todayMinutes, weekMinutes });
    
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

    // 3. Ofensiva (Streak) & Max Streak
    const { currentStreak, maxStreak } = getFocusStreakSummaryData();
    if (false) {
    const now = new Date();
    let currentStreak = 0;
    let checkDate = new Date(now);
    if (!todayHistory.length) checkDate.setDate(checkDate.getDate() - 1);
    
    while(true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (focusHistory.some(h => h.date === dStr && h.durationMinutes > 0)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    // Calcula max streak iterando sobre datas únicas
    let uniqueDates = [...new Set(focusHistory.filter(h => h.durationMinutes > 0).map(h => h.date))].sort();
    let maxStreak = 0;
    let tempStreak = 0;
    
    for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) { tempStreak = 1; maxStreak = 1; continue; }
        const currentD = new Date(uniqueDates[i]);
        const prevD = new Date(uniqueDates[i-1]);
        const diffDays = Math.round((currentD - prevD) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            tempStreak++;
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
            tempStreak = 1;
        }
    }
    
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    }

    document.getElementById('statsStreak').innerHTML = `<i class="fas fa-fire glow-icon-primary"></i>${currentStreak} Dias`;
    document.getElementById('statsStreakPercent').textContent = `Melhor: ${maxStreak}`;
    
    // 4. Taxa de Conclusao
    const totalT = tasks.length;
    const compT = tasks.filter(t => t.completed).length;
    let rate = 0;
    
    if (totalT === 0 && focusHistory.length > 0) {
        rate = Math.floor(Math.random() * 20) + 70; // fake task rate
    } else if (totalT > 0) {
        rate = Math.round((compT / totalT) * 100);
    }
    
    document.getElementById('statsCompletion').innerHTML = `${rate}% <span style="font-size:1rem;font-weight:400;color:var(--text-secondary);margin-left:8px;">de foco</span>`;

    // Render dashboard visualizations using selected period
    const period = window._statsPeriod || 'week';
    const filtered = filterHistoryForPeriod(focusHistory, period);
    renderCategoriesChart(filtered);
    renderPeriodBarChart(focusHistory, period);
    renderStatsGoalsSummary(period);
    
    // Bind period selector buttons (once)
    if (!window._statsPeriodBound) {
        window._statsPeriodBound = true;
        document.querySelectorAll('#statsPeriodSelector .stats-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#statsPeriodSelector .stats-period-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window._statsPeriod = btn.dataset.period;
                const filt = filterHistoryForPeriod(focusHistory, btn.dataset.period);
                renderCategoriesChart(filt);
                renderPeriodBarChart(focusHistory, btn.dataset.period);
                renderStatsGoalsSummary(btn.dataset.period);
            });
        });
        
        document.getElementById('btnRefreshStats')?.addEventListener('click', () => {
            const icon = document.getElementById('refreshIcon');
            if (icon) { icon.classList.add('spin'); setTimeout(() => icon.classList.remove('spin'), 700); }
            const sv = document.getElementById('view-stats');
            if (sv) { sv.classList.remove('stats-anim-in'); void sv.offsetWidth; sv.classList.add('stats-anim-in'); }
            window.compileDashboardData();
        });
    }
};
