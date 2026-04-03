const GOALS_PERIOD_OPTIONS = [
    { value: 'week', label: 'Semana' },
    { value: 'day', label: 'Hoje' },
    { value: 'month', label: 'Mes' }
];

const GOALS_SCHEDULE_OPTIONS = [
    { value: 'weekdays', label: 'Dias uteis' },
    { value: 'everyday', label: 'Semana inteira' }
];

const clampGoalHours = (value) => {
    const numericValue = Number(value);
    const safeValue = Number.isFinite(numericValue) ? numericValue : 1;
    return Math.round(Math.max(0.5, safeValue) * 2) / 2;
};

const formatGoalHours = (hours) => `${clampGoalHours(hours).toFixed(1).replace('.0', '').replace('.', ',')}h`;

const formatGoalDailyHours = (minutes) => formatGoalHours((Number(minutes) || 0) / 60);

const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readContracts = () => {
    const runtime = ensureContract('window.FocoZenGoalsRuntime', window.FocoZenGoalsRuntime);
    const goalsCore = ensureContract('window.FocoZenGoalsCore', window.FocoZenGoalsCore);
    const historyCore = ensureContract('window.FocoZenHistoryCore', window.FocoZenHistoryCore);
    const constants = ensureContract('window.FocoZenConstants', window.FocoZenConstants);

    return { runtime, goalsCore, historyCore, constants };
};

const getMomentumBadge = (runtime, overview) => {
    const content = runtime.getGoalMomentumContent?.(overview);
    if (content?.badge) return content.badge;

    if (!overview?.activeCount) return 'Sem metas ativas';
    if ((overview?.averageProgress || 0) >= 100) return 'Acima da meta';
    if ((overview?.averageProgress || 0) >= 80) return 'Quase la';
    if ((overview?.totalActual || 0) > 0) return 'Em movimento';
    return 'Hora de iniciar';
};

const buildComparisonRows = (overview, formatMinutesToHours) => {
    const summaries = Array.isArray(overview?.summaries) ? overview.summaries : [];
    if (!summaries.length) return [];

    const maxHours = Math.max(
        ...summaries.flatMap((item) => [item.targetMinutes / 60, item.actualMinutes / 60]),
        1
    );

    return summaries.map((item) => {
        const actualHours = item.actualMinutes / 60;
        const targetHours = item.targetMinutes / 60;
        const actualWidth = Math.min(100, (actualHours / maxHours) * 100);
        const fillWidth = item.actualMinutes > 0 ? Math.max(actualWidth, 6) : 0;
        const targetOffset = Math.min(100, (targetHours / maxHours) * 100);
        const deltaMinutes = item.actualMinutes - item.targetMinutes;
        const status = deltaMinutes === 0
            ? 'Meta atingida'
            : deltaMinutes > 0
                ? `Passou ${formatMinutesToHours(Math.abs(deltaMinutes))}`
                : `Faltam ${formatMinutesToHours(Math.abs(deltaMinutes))}`;

        return {
            id: item.id,
            category: item.category,
            percentLabel: `${Math.max(0, item.percent)}%`,
            status,
            fillWidth,
            targetOffset,
            actualLabel: item.actualMinutes > 0 ? `Realizado ${formatMinutesToHours(item.actualMinutes)}` : '',
            targetLabel: `Meta ${formatMinutesToHours(item.targetMinutes)}`,
            actualLabelLeft: fillWidth > 0 ? Math.min(96, fillWidth) : 0,
            actualAlignClass: fillWidth > 86 ? 'end' : 'after-fill',
            targetAlignClass: targetOffset < 14 ? 'start' : (targetOffset > 86 ? 'end' : ''),
            palette: item.palette
        };
    });
};

const buildGoalsList = (focusGoals, goalsCore) => {
    const safeGoals = Array.isArray(focusGoals) ? focusGoals : [];

    return safeGoals
        .slice()
        .sort((left, right) => left.category.localeCompare(right.category, 'pt-BR'))
        .map((goal, index) => ({
            id: goal.id,
            category: goal.category,
            schedule: goal.schedule || 'weekdays',
            scheduleLabel: goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias uteis',
            daysLabel: goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex',
            dailyHours: clampGoalHours((Number(goal.dailyMinutes) || 0) / 60),
            dailyHoursLabel: `${formatGoalDailyHours(goal.dailyMinutes)} por dia`,
            palette: goalsCore.getCategoryPalette(goal.category, index)
        }));
};

export function buildGoalsViewModel(snapshot = null) {
    const { runtime, goalsCore, historyCore, constants } = readContracts();
    const safeSnapshot = snapshot ?? runtime.getSnapshot?.() ?? {};
    const focusGoals = Array.isArray(safeSnapshot.focusGoals) ? safeSnapshot.focusGoals : [];
    const focusHistory = Array.isArray(safeSnapshot.focusHistory) ? safeSnapshot.focusHistory : [];
    const userCategories = Array.isArray(safeSnapshot.userCategories) ? safeSnapshot.userCategories : [];
    const goalsPeriod = safeSnapshot.goalsPeriod || 'week';
    const overview = goalsCore.getGoalOverview({ focusGoals, focusHistory, period: goalsPeriod });
    const categories = goalsCore.getSortedGoalCategories({
        userCategories,
        defaultCategories: constants.defaultCategories,
        focusGoals
    });
    const formatMinutesToHours = historyCore.formatMinutesToHours;

    return {
        username: safeSnapshot.username || 'Convidado',
        goalsPeriod,
        periodOptions: GOALS_PERIOD_OPTIONS,
        scheduleOptions: GOALS_SCHEDULE_OPTIONS,
        categories,
        momentumBadge: getMomentumBadge(runtime, overview),
        comparisonSubtitle: `${formatMinutesToHours(overview.totalActual)} entregues de ${formatMinutesToHours(overview.totalTarget)} planejados.`,
        cards: {
            hitRate: `${overview.hitCount}/${overview.activeCount}`,
            averageProgress: `${Math.max(0, overview.averageProgress)}%`,
            streak: `${overview.streak} dias`,
            bestCategory: overview.bestCategory
                ? `${overview.bestCategory.category} ${Math.max(0, overview.bestCategory.percent)}%`
                : 'Sem dados'
        },
        comparisonRows: buildComparisonRows(overview, formatMinutesToHours),
        goals: buildGoalsList(focusGoals, goalsCore)
    };
}

export function subscribeGoalsViewModel(listener) {
    const { runtime } = readContracts();
    const emit = (snapshot) => listener(buildGoalsViewModel(snapshot));
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => {});
}

export function subscribeGoalEditRequests(listener) {
    const { runtime } = readContracts();
    return runtime.subscribeEdit?.(({ goalId }) => listener(goalId)) ?? (() => {});
}

export function refreshGoalsView() {
    const { runtime } = readContracts();
    return runtime.refresh?.();
}

export function setGoalsPeriod(period) {
    const { runtime } = readContracts();
    return runtime.setGoalsPeriod?.(period);
}

export function saveGoalViaRuntime({ goalId = null, category, dailyHours, schedule }) {
    const { runtime } = readContracts();
    return runtime.saveGoal?.({
        goalId,
        category,
        dailyMinutes: Math.round(clampGoalHours(dailyHours) * 60),
        schedule
    });
}

export function deleteGoalViaRuntime(goalId) {
    const { runtime } = readContracts();
    return runtime.deleteGoal?.(goalId);
}

export { clampGoalHours, formatGoalHours };
