const STATS_PERIOD_OPTIONS = [
    { value: 'week', label: 'Semana' },
    { value: 'day', label: 'Hoje' },
    { value: 'month', label: 'Mes' }
];

const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readContracts = () => {
    const runtime = ensureContract('window.FocoZenStatsRuntime', window.FocoZenStatsRuntime);
    const historyCore = ensureContract('window.FocoZenHistoryCore', window.FocoZenHistoryCore);

    return { runtime, historyCore };
};

export function subscribeStatsViewModel(listener) {
    const { runtime } = readContracts();
    const emit = (snapshot) => listener(snapshot ?? runtime.getSnapshot?.());
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => {});
}

export function refreshStatsView() {
    const { runtime } = readContracts();
    return runtime.refresh?.();
}

export function setStatsPeriod(period) {
    const { runtime } = readContracts();
    return runtime.setStatsPeriod?.(period);
}

export function renderStatsCharts({ categoriesCanvas, legendEl, periodCanvas, history, period }) {
    const { runtime, historyCore } = readContracts();
    const safeHistory = Array.isArray(history) ? history : [];
    const filteredHistory = historyCore.filterHistoryByPeriod?.(safeHistory, period, new Date()) ?? safeHistory;
    runtime.renderCategoriesChart?.(categoriesCanvas, legendEl, filteredHistory);
    runtime.renderPeriodBarChart?.(periodCanvas, safeHistory, period);
}

export function getStatsPeriodOptions() {
    return STATS_PERIOD_OPTIONS;
}

export function formatStatsMinutes(minutes) {
    const { historyCore } = readContracts();
    return historyCore.formatMinutesToHours(minutes);
}
