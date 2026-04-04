async function selectSound(sound, cardElement) {
    const result = await audioService?.selectSound?.(sound, {
        toggleOff: !!cardElement,
        autoplay: true
    });

    if (!result?.ok && result?.reason !== 'selection-superseded') {
        console.error('Erro audio:', result?.error || result?.reason || 'falha desconhecida');
    }
}

function toggleMute() {
    audioService?.toggleMute?.();
}

async function toggleMasterPlay() {
    if (!currentSoundId) {
        showGlassToast('Selecione algum som para iniciar');
        return;
    }

    const result = await audioService?.togglePlay?.();
    if (!result?.ok && result?.reason !== 'no-sound-selected') {
        console.error('Erro ao alternar audio:', result?.error || result?.reason || 'falha desconhecida');
    }
}

function updateMasterPlayButton() {
    ['stats', 'goals', 'settings'].forEach(prefix => {
        const playBtn = document.getElementById(`${prefix}PlayerPlayBtn`);
        const muteBtn = document.getElementById(`${prefix}PlayerMuteBtn`);
        const volSlider = document.getElementById(`${prefix}PlayerVolumeSlider`);

        if (playBtn && !playBtn.dataset.bound) {
            playBtn.dataset.bound = true;
            playBtn.addEventListener('click', () => toggleMasterPlay());
        }
        if (muteBtn && !muteBtn.dataset.bound) {
            muteBtn.dataset.bound = true;
            muteBtn.addEventListener('click', () => toggleMute());
        }
        if (volSlider && !volSlider.dataset.bound) {
            volSlider.dataset.bound = true;
            volSlider.addEventListener('input', (e) => {
                audioService?.setVolume?.(Number(e.target.value) / 100);
            });
        }
        if (playBtn) {
            if (isPlaying) {
                playBtn.classList.add('playing');
                playBtn.querySelector('i').className = 'fas fa-pause';
            } else {
                playBtn.classList.remove('playing');
                playBtn.querySelector('i').className = 'fas fa-play';
            }
        }
        if (volSlider) volSlider.value = Math.round(masterVolume * 100);
    });
}

function buildViewPlayerSounds(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset.built) return;
    container.dataset.built = 'true';

    const trigger = container.closest('.vpa-sound-trigger');
    if (trigger && !trigger.dataset.bound) {
        trigger.dataset.bound = 'true';
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            trigger.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!trigger.contains(e.target)) trigger.classList.remove('open');
        });
    }

    soundsConfig.forEach(sound => {
        const item = document.createElement('div');
        item.className = `vpa-sound-item${currentSoundId === sound.id ? ' active' : ''}`;
        item.dataset.soundId = sound.id;
        item.innerHTML = `<i class="fas ${sound.icon}"></i><span>${sound.name}</span>`;
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            selectSound(sound);
            trigger?.classList.remove('open');
        });
        container.appendChild(item);
    });
}

function updateVolumeDisplay() {
    const vol = Math.round(masterVolume * 100);
    ['stats', 'goals', 'settings'].forEach(prefix => {
        const valEl = document.getElementById(`${prefix}PlayerVolumeValue`);
        const slider = document.getElementById(`${prefix}PlayerVolumeSlider`);
        if (valEl) valEl.textContent = `${vol}%`;
        if (slider && !slider.matches(':active')) slider.value = vol;
    });
}

function initTimer() {

}
