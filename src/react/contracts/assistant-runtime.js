const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readRuntime = () => ensureContract('window.FocoZenAssistantRuntime', window.FocoZenAssistantRuntime);

export function subscribeAssistantViewModel(listener) {
    const runtime = readRuntime();
    const emit = (snapshot) => listener(snapshot ?? runtime.getSnapshot?.());
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => {});
}

export function submitAssistantMessage(text) {
    return readRuntime().submit?.(text);
}

export function resetAssistantConversation() {
    return readRuntime().reset?.();
}

export function setAssistantOpenState(open) {
    return readRuntime().setOpen?.(open);
}

export function handleAssistantRuntimeAction(actionType, actionValue) {
    return readRuntime().handleAction?.(actionType, actionValue);
}
