function buildAssistantOpenInsight() {
    if (currentTask && currentMode === 'focus') {
        return `Agora, eu manteria o foco em ${currentTask.category || 'Livre'} para fechar a tarefa "${currentTask.name}".`;
    }

    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    if (lagging) {
        return `Agora, o ponto que mais pede atencao e ${lagging.category}. Faltam ${formatMinsToHours(lagging.remainingMinutes)} para fechar essa meta neste recorte.`;
    }

    const overview = getAssistantGoalOverview(getAssistantDefaultPeriod(), false);
    if (overview.activeCount) {
        return `Agora, seu plano esta em ${overview.averageProgress}% do combinado. Posso te ajudar a decidir a proxima sessao.`;
    }

    return 'Agora, posso te ajudar a criar metas, iniciar foco, montar tarefas e resumir o que esta acontecendo no app.';
}

function getHistoryTotalsByCategory(period, previous = false) {
    const totals = {};
    filterHistoryByAssistantPeriod(period, previous).forEach(entry => {
        const category = entry.category || 'Livre';
        totals[category] = (totals[category] || 0) + (Number(entry.durationMinutes) || 0);
    });

    return Object.entries(totals)
        .map(([category, minutes]) => ({ category, minutes }))
        .sort((a, b) => b.minutes - a.minutes);
}

function getHistoryPeriodRange(period, previous = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    if (period === 'day') {
        if (previous) {
            start.setDate(start.getDate() - 1);
            end = new Date(start);
        }
        return { start, end };
    }

    const span = period === 'month' ? 30 : 7;
    start.setDate(start.getDate() - (span - 1));
    if (previous) {
        end = new Date(start);
        end.setDate(end.getDate() - 1);
        start = new Date(end);
        start.setDate(start.getDate() - (span - 1));
    }

    return { start, end: previous ? end : new Date(today) };
}

function filterHistoryBetween(start, end) {
    return focusHistory.filter(entry => {
        const date = new Date(`${entry.date}T00:00:00`);
        return date >= start && date <= end;
    });
}

function getAssistantDateRange(period, previous = false) {
    return getHistoryPeriodRange(period, previous);
}

function enumerateDatesBetween(start, end) {
    const dates = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    while (cursor <= end) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

function filterHistoryByAssistantPeriod(period, previous = false) {
    const range = getAssistantDateRange(period, previous);
    return filterHistoryBetween(range.start, range.end);
}

function getTotalFocusForPeriod(period, category = null, previous = false) {
    const categoryKey = category ? normalizeAssistantText(category) : null;
    return filterHistoryByAssistantPeriod(period, previous)
        .filter(entry => !categoryKey || normalizeAssistantText(entry.category || 'Livre') === categoryKey)
        .reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
}

function getSessionsCountForPeriod(period, category = null, previous = false) {
    const categoryKey = category ? normalizeAssistantText(category) : null;
    return filterHistoryByAssistantPeriod(period, previous)
        .filter(entry => !categoryKey || normalizeAssistantText(entry.category || 'Livre') === categoryKey)
        .length;
}

function getAssistantGoalSummaries(period, previous = false) {
    const activeGoals = getActiveGoalsData();
    const range = getAssistantDateRange(period, previous);
    const dates = enumerateDatesBetween(range.start, range.end);
    const actualByCategory = {};

    filterHistoryByAssistantPeriod(period, previous).forEach(entry => {
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
            palette: resolveCategoryPalette(goal.category, index)
        };
    }).sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        return b.actualMinutes - a.actualMinutes;
    });
}

function getAssistantGoalOverview(period, previous = false) {
    const summaries = getAssistantGoalSummaries(period, previous);
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

function getAssistantTaskSummary() {
    const openTasks = tasks.filter(task => !task.completed);
    const doneTasks = tasks.filter(task => task.completed);
    const currentTaskName = currentTask?.name || null;

    if (!tasks.length) {
        return 'Você ainda não tem tarefas criadas no app.';
    }

    const lines = [
        `${openTasks.length} tarefa(s) em aberto e ${doneTasks.length} concluída(s).`
    ];

    if (currentTaskName) {
        lines.push(`Tarefa atual: ${currentTaskName}.`);
    } else {
        lines.push('No momento você está em Sessão Livre.');
    }

    return lines.join('\n');
}

function findAssistantTaskByText(text) {
    const normalized = normalizeAssistantText(text);
    const activeTasks = tasks.filter(task => !task.completed);
    if (!activeTasks.length) return null;

    const explicitPrefixes = [
        'iniciar tarefa',
        'inicie a tarefa',
        'comecar tarefa',
        'comece a tarefa',
        'abrir tarefa',
        'abra a tarefa',
        'selecionar tarefa',
        'seleciona a tarefa',
        'iniciar',
        'inicie',
        'comecar',
        'comece',
        'abrir',
        'abra'
    ];

    let remainder = normalized;
    for (const prefix of explicitPrefixes) {
        if (normalized.startsWith(prefix)) {
            remainder = normalized.slice(prefix.length).trim();
            break;
        }
    }

    const scored = activeTasks.map(task => {
        const nameNorm = normalizeAssistantText(task.name);
        let score = 0;
        if (remainder && nameNorm === remainder) score += 100;
        if (remainder && nameNorm.includes(remainder)) score += 70;
        if (remainder && remainder.includes(nameNorm)) score += 55;
        if (normalized.includes(nameNorm)) score += 40;
        return { task, score };
    }).sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].task : null;
}
