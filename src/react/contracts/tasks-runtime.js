const ensureContract = (name, value) => {
    if (!value) {
        throw new Error(`Contrato obrigatorio ausente: ${name}`);
    }
    return value;
};

const readRuntime = () => ensureContract('window.FocoZenTasksRuntime', window.FocoZenTasksRuntime);

export function subscribeTasksViewModel(listener) {
    const runtime = readRuntime();
    const emit = (snapshot) => listener(snapshot ?? runtime.getSnapshot?.());
    emit(runtime.getSnapshot?.());
    return runtime.subscribe?.(emit) ?? (() => {});
}

export function selectTask(taskId) {
    return readRuntime().selectTask?.(taskId);
}

export function startTask(taskId) {
    return readRuntime().startTask?.(taskId);
}

export function editTask(taskId) {
    return readRuntime().editTask?.(taskId);
}

export function toggleTaskComplete(taskId) {
    return readRuntime().toggleTaskComplete?.(taskId);
}

export function toggleTaskTimer() {
    return readRuntime().toggleTaskTimer?.();
}

export function toggleSubtask(taskId, subtaskId) {
    return readRuntime().toggleSubtask?.(taskId, subtaskId);
}

export function toggleDeleteMode() {
    return readRuntime().toggleDeleteMode?.();
}

export function deleteTask(taskId) {
    return readRuntime().deleteTask?.(taskId);
}

export function deleteSelectedTasks() {
    return readRuntime().deleteSelectedTasks?.();
}

export function toggleTaskSelection(taskId, isSelected) {
    return readRuntime().toggleTaskSelection?.(taskId, isSelected);
}

export function toggleSelectAllTasks(isSelected) {
    return readRuntime().toggleSelectAllTasks?.(isSelected);
}

export function openCreateTaskModal() {
    return readRuntime().openCreateTaskModal?.();
}
