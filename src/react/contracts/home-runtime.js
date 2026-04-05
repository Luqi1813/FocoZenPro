const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readRuntime = () => ensureContract('window.FocoZenHomeRuntime', window.FocoZenHomeRuntime);

/**
 * Subscribe to the Home view-model. Fires immediately with the current snapshot
 * and again on every runtime change.
 */
export function subscribeHomeViewModel(listener) {
    const runtime = readRuntime();
    const emit = (snapshot) => listener(snapshot ?? runtime.getSnapshot?.());
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => { });
}

// ── Audio controls ──
export function selectSound(sound, card) {
    return readRuntime().selectSound?.(sound, card);
}

export function toggleMasterPlay() {
    return readRuntime().toggleMasterPlay?.();
}

export function toggleMute() {
    return readRuntime().toggleMute?.();
}

export function setVolume(percent) {
    return readRuntime().setVolume?.(percent);
}

export function getSoundGroups() {
    return readRuntime().getSoundGroups?.() ?? [];
}

// ── Category ──
export function changeCategory(categoryName) {
    return readRuntime().changeCategory?.(categoryName);
}

// ── Task badge ──
export function handleFreeFocus() {
    return readRuntime().handleFreeFocus?.();
}

// ── Breathing ──
// (self-contained in React — no renderer call needed)

// ── Progress bubble text toggle ──
export function toggleBubbleText() {
    return readRuntime().toggleBubbleText?.();
}

// ── Actions ──
export function openCreateModal() {
    return readRuntime().openCreateModal?.();
}

export function enterPip() {
    return readRuntime().enterPip?.();
}
