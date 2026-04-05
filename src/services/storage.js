(() => {
    const storageKeys = Object.freeze({
        TASKS: 'focozen_tasks',
        HISTORY: 'focozen_history',
        GOALS: 'focozen_goals',
        CATEGORIES: 'focozen_categories',
        SAVED_SESSION: 'focozen_saved_session',
        TOTAL_POMODOROS: 'focozen_total_pomodoros',
        SHOW_BUBBLE_TEXT: 'focozen_show_bubble_text',
        USERNAME: 'focozen_username',
        WIZARD_CATEGORIES: 'focozen_wizard_categories',
        QUOTE_INDEX: 'focozen_quote_index',
        LAST_QUOTE_DATE: 'focozen_last_quote_date',
        AUDIO_SOUND_ID: 'focozen_audio_sound_id',
        AUDIO_VOLUME: 'focozen_audio_volume',
        AUDIO_MUTED: 'focozen_audio_muted',
        AUDIO_PREVIOUS_VOLUME: 'focozen_audio_previous_volume',
        UPDATED_VERSION: 'focozen_updated_version',
        CHANGELOG: 'focozen_changelog',
        LAST_VERSION: 'focozen_last_version',
        LAST_CHANGELOG: 'focozen_last_changelog',
        CUSTOM_ACCENT_COLOR: 'focozen_custom_accent_color'
    });

    const cloneFallback = (value) => {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;

        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }

        return JSON.parse(JSON.stringify(value));
    };

    const readStorageValue = (key, fallback = null) => {
        try {
            const value = localStorage.getItem(key);
            return value ?? fallback;
        } catch (error) {
            console.warn(`Falha ao ler ${key} do armazenamento local:`, error);
            return fallback;
        }
    };

    const writeStorageValue = (key, value) => {
        try {
            if (value === undefined || value === null) {
                localStorage.removeItem(key);
                return;
            }

            localStorage.setItem(key, String(value));
        } catch (error) {
            console.warn(`Falha ao gravar ${key} no armazenamento local:`, error);
        }
    };

    const removeStorageValue = (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Falha ao remover ${key} do armazenamento local:`, error);
        }
    };

    const clearStorage = () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn('Falha ao limpar o armazenamento local:', error);
        }
    };

    const readJsonStorage = (key, fallback) => {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return cloneFallback(fallback);
            const parsed = JSON.parse(raw);
            return parsed ?? cloneFallback(fallback);
        } catch (error) {
            console.warn(`Falha ao ler ${key} do armazenamento local:`, error);
            return cloneFallback(fallback);
        }
    };

    const writeJsonStorage = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Falha ao gravar ${key} no armazenamento local:`, error);
        }
    };

    const readNumberStorage = (key, fallback = 0) => {
        const rawValue = readStorageValue(key, null);
        const parsedValue = Number.parseInt(rawValue, 10);
        return Number.isFinite(parsedValue) ? parsedValue : fallback;
    };

    window.FocoZenStorage = Object.freeze({
        storageKeys,
        readStorageValue,
        writeStorageValue,
        removeStorageValue,
        clearStorage,
        readJsonStorage,
        writeJsonStorage,
        readNumberStorage
    });
})();
