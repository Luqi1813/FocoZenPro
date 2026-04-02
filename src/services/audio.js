(() => {
    const DEFAULT_STORAGE_KEYS = Object.freeze({
        AUDIO_SOUND_ID: 'focozen_audio_sound_id',
        AUDIO_VOLUME: 'focozen_audio_volume',
        AUDIO_MUTED: 'focozen_audio_muted',
        AUDIO_PREVIOUS_VOLUME: 'focozen_audio_previous_volume'
    });

    let deps = null;
    let state = {
        currentAudio: null,
        currentSoundId: null,
        isPlaying: false,
        masterVolume: 0.7,
        isMuted: false,
        volumeBeforeMute: 0.7,
        availableFiles: [],
        initialized: false,
        selectionToken: 0
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const configure = (nextDeps) => {
        deps = nextDeps ?? {};
        return window.FocoZenAudioService;
    };

    const getStorageKey = (name) => deps?.storageKeys?.[name] ?? DEFAULT_STORAGE_KEYS[name];

    const readStorageValue = (key, fallback = null) => {
        if (!key) return fallback;

        if (deps?.storageService?.readStorageValue) {
            return deps.storageService.readStorageValue(key, fallback);
        }

        try {
            const value = localStorage.getItem(key);
            return value ?? fallback;
        } catch (error) {
            console.warn(`Falha ao ler ${key}:`, error);
            return fallback;
        }
    };

    const writeStorageValue = (key, value) => {
        if (!key) return;

        if (deps?.storageService?.writeStorageValue) {
            deps.storageService.writeStorageValue(key, value);
            return;
        }

        try {
            localStorage.setItem(key, String(value));
        } catch (error) {
            console.warn(`Falha ao gravar ${key}:`, error);
        }
    };

    const removeStorageValue = (key) => {
        if (!key) return;

        if (deps?.storageService?.removeStorageValue) {
            deps.storageService.removeStorageValue(key);
            return;
        }

        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Falha ao remover ${key}:`, error);
        }
    };

    const readNumber = (keyName, fallback) => {
        const parsed = Number(readStorageValue(getStorageKey(keyName), fallback));
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const readBoolean = (keyName, fallback) => {
        const raw = readStorageValue(getStorageKey(keyName), String(fallback));
        if (raw === 'true' || raw === true) return true;
        if (raw === 'false' || raw === false) return false;
        return fallback;
    };

    const emitState = () => {
        deps?.onStateChange?.(getState());
    };

    const persistState = () => {
        if (state.currentSoundId) {
            writeStorageValue(getStorageKey('AUDIO_SOUND_ID'), state.currentSoundId);
        } else {
            removeStorageValue(getStorageKey('AUDIO_SOUND_ID'));
        }

        writeStorageValue(getStorageKey('AUDIO_VOLUME'), state.masterVolume);
        writeStorageValue(getStorageKey('AUDIO_MUTED'), state.isMuted);
        writeStorageValue(getStorageKey('AUDIO_PREVIOUS_VOLUME'), state.volumeBeforeMute);
    };

    const teardownAudio = () => {
        if (!state.currentAudio) return;

        try {
            state.currentAudio.pause();
            state.currentAudio.removeAttribute('src');
            state.currentAudio.load();
        } catch (error) {
            console.warn('Falha ao desmontar audio atual:', error);
        }

        state.currentAudio = null;
        state.isPlaying = false;
    };

    const getAllSounds = () => deps?.soundsConfig ?? [];

    const getSoundById = (soundId) => getAllSounds().find((sound) => sound.id === soundId) ?? null;

    const getAvailableFiles = () => Array.isArray(state.availableFiles) ? state.availableFiles : [];

    const getState = () => ({
        currentAudio: state.currentAudio,
        currentSoundId: state.currentSoundId,
        isPlaying: state.isPlaying,
        masterVolume: state.masterVolume,
        isMuted: state.isMuted,
        volumeBeforeMute: state.volumeBeforeMute,
        availableFiles: getAvailableFiles().slice()
    });

    const restorePersistedState = () => {
        const storedVolume = clamp(readNumber('AUDIO_VOLUME', 0.7), 0, 1);
        const storedMuted = readBoolean('AUDIO_MUTED', false);
        const storedPreviousVolume = clamp(readNumber('AUDIO_PREVIOUS_VOLUME', storedVolume || 0.7), 0, 1);
        const storedSoundId = readStorageValue(getStorageKey('AUDIO_SOUND_ID'), null);

        state.currentSoundId = storedSoundId || null;
        state.isMuted = storedMuted;
        state.volumeBeforeMute = storedPreviousVolume > 0 ? storedPreviousVolume : 0.7;
        state.masterVolume = storedMuted ? 0 : storedVolume;
        state.isPlaying = false;
        state.currentAudio = null;
    };

    const initialize = async () => {
        restorePersistedState();

        if (typeof deps?.listAudioFiles === 'function') {
            try {
                const files = await deps.listAudioFiles();
                state.availableFiles = Array.isArray(files) ? files : [];
            } catch (error) {
                console.error('Falha ao carregar arquivos de audio:', error);
                state.availableFiles = [];
            }
        }

        state.initialized = true;
        emitState();
        return getCategorizedAvailableSounds();
    };

    const getAvailableSounds = () => {
        const availableFiles = getAvailableFiles();
        if (!availableFiles.length) return [];

        return getAllSounds().filter((sound) => availableFiles.includes(sound.file));
    };

    const getCategorizedAvailableSounds = () => {
        const categories = deps?.soundCategories ?? {};
        const availableSounds = getAvailableSounds();

        return Object.entries(categories)
            .map(([name, categoryData]) => ({
                name,
                icon: categoryData.icon,
                sounds: availableSounds.filter((sound) => categoryData.ids.includes(sound.id))
            }))
            .filter((group) => group.sounds.length > 0);
    };

    const setVolume = (nextVolume, options = {}) => {
        const volume = clamp(Number(nextVolume) || 0, 0, 1);
        const preserveMuteState = !!options.preserveMuteState;

        state.masterVolume = volume;

        if (!preserveMuteState) {
            if (volume > 0) {
                state.isMuted = false;
                state.volumeBeforeMute = volume;
            } else {
                state.isMuted = true;
            }
        }

        if (state.currentAudio) {
            state.currentAudio.volume = state.masterVolume;
        }

        persistState();
        emitState();
        return getState();
    };

    const toggleMute = () => {
        if (state.isMuted || state.masterVolume <= 0) {
            state.isMuted = false;
            state.masterVolume = clamp(state.volumeBeforeMute || 0.7, 0, 1) || 0.7;
        } else {
            state.volumeBeforeMute = state.masterVolume > 0 ? state.masterVolume : (state.volumeBeforeMute || 0.7);
            state.masterVolume = 0;
            state.isMuted = true;
        }

        if (state.currentAudio) {
            state.currentAudio.volume = state.masterVolume;
        }

        persistState();
        emitState();
        return getState();
    };

    const clearSelection = () => {
        state.selectionToken += 1;
        teardownAudio();
        state.currentSoundId = null;
        persistState();
        emitState();
        return { ok: true, cleared: true, state: getState() };
    };

    const selectSound = async (soundOrId, options = {}) => {
        const sound = typeof soundOrId === 'string' ? getSoundById(soundOrId) : soundOrId;
        if (!sound) {
            return { ok: false, reason: 'sound-not-found', state: getState() };
        }

        const shouldToggleOff = !!options.toggleOff;
        const shouldAutoplay = options.autoplay !== false;
        const currentSelectionId = state.currentSoundId;

        if (currentSelectionId === sound.id && shouldToggleOff) {
            return clearSelection();
        }

        const selectionToken = state.selectionToken + 1;
        state.selectionToken = selectionToken;

        teardownAudio();
        state.currentSoundId = sound.id;
        persistState();
        emitState();

        if (typeof deps?.resolveAudioPath !== 'function') {
            return { ok: false, reason: 'audio-path-unavailable', state: getState() };
        }

        try {
            const audioPath = await deps.resolveAudioPath(sound.file);
            if (selectionToken !== state.selectionToken) {
                return { ok: false, reason: 'selection-superseded', state: getState() };
            }

            if (!audioPath) {
                throw new Error(`Caminho de audio ausente para ${sound.file}`);
            }

            const audioInstance = typeof deps?.createAudio === 'function'
                ? deps.createAudio(audioPath)
                : new Audio(audioPath);

            if (!audioInstance) {
                throw new Error('Falha ao criar instancia de audio');
            }

            audioInstance.loop = true;
            audioInstance.volume = state.masterVolume;
            state.currentAudio = audioInstance;
            state.isPlaying = false;

            if (shouldAutoplay) {
                await audioInstance.play();
                state.isPlaying = true;
            }

            persistState();
            emitState();
            return { ok: true, sound, state: getState() };
        } catch (error) {
            console.error('Falha ao selecionar som:', error);
            teardownAudio();
            state.currentSoundId = null;
            persistState();
            emitState();
            deps?.onPlaybackError?.(error, sound);
            return { ok: false, reason: 'audio-load-failed', error, state: getState() };
        }
    };

    const togglePlay = async () => {
        if (!state.currentSoundId) {
            return { ok: false, reason: 'no-sound-selected', state: getState() };
        }

        if (!state.currentAudio) {
            return selectSound(state.currentSoundId, { toggleOff: false, autoplay: true });
        }

        try {
            if (state.isPlaying) {
                state.currentAudio.pause();
                state.isPlaying = false;
            } else {
                await state.currentAudio.play();
                state.isPlaying = true;
            }

            emitState();
            return { ok: true, state: getState() };
        } catch (error) {
            console.error('Falha ao alternar reproducao:', error);
            deps?.onPlaybackError?.(error, getSoundById(state.currentSoundId));
            return { ok: false, reason: 'toggle-play-failed', error, state: getState() };
        }
    };

    const stop = () => {
        teardownAudio();
        emitState();
        return { ok: true, state: getState() };
    };

    window.FocoZenAudioService = Object.freeze({
        configure,
        initialize,
        getState,
        getAvailableSounds,
        getCategorizedAvailableSounds,
        selectSound,
        setVolume,
        toggleMute,
        togglePlay,
        stop,
        clearSelection
    });
})();
