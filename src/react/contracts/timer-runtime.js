const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readRuntime = () => ensureContract('window.FocoZenTimerRuntime', window.FocoZenTimerRuntime);

export function subscribeTimerViewModel(listener) {
    const runtime = readRuntime();
    const emit = (snapshot) => listener(snapshot ?? runtime.getSnapshot?.());
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => {});
}

export function setMode(mode) {
    return readRuntime().onSetMode?.(mode);
}

export function toggleTimer() {
    return readRuntime().onToggleTimer?.();
}

export function resetTimer() {
    return readRuntime().onResetTimer?.();
}

export function adjustTime(minutes) {
    return readRuntime().onAdjustTime?.(minutes);
}
