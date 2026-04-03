const readContract = (name, value) => ({
    name,
    available: !!value
});

export async function getRuntimeSnapshot() {
    const electronAPI = window.electronAPI ?? null;
    const storage = window.FocoZenStorage ?? null;
    const constants = window.FocoZenConstants ?? null;
    const goalsCore = window.FocoZenGoalsCore ?? null;
    const historyCore = window.FocoZenHistoryCore ?? null;
    const timerCore = window.FocoZenTimerCore ?? null;
    const audioService = window.FocoZenAudioService ?? null;
    const taskSessionService = window.FocoZenTaskSessionService ?? null;

    const storageKeys = storage?.storageKeys ?? {};
    const userName = storage?.readStorageValue?.(storageKeys.USERNAME, null) ?? 'Mestre Zen';
    const appVersion = electronAPI?.getAppVersion
        ? await electronAPI.getAppVersion()
        : null;

    return {
        appVersion,
        userName,
        pomodoroMinutes: constants?.POMODORO_MINUTES ?? null,
        contracts: [
            readContract('electronAPI', electronAPI),
            readContract('FocoZenStorage', storage),
            readContract('FocoZenConstants', constants),
            readContract('FocoZenGoalsCore', goalsCore),
            readContract('FocoZenHistoryCore', historyCore),
            readContract('FocoZenTimerCore', timerCore),
            readContract('FocoZenAudioService', audioService),
            readContract('FocoZenTaskSessionService', taskSessionService)
        ]
    };
}
