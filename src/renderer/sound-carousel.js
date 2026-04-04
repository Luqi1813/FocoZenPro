function buildSoundCarousel(carouselEl) {
    if (!carouselEl || carouselEl.dataset.built) return;
    carouselEl.dataset.built = 'true';
    carouselEl.innerHTML = '';
    soundsConfig.forEach(sound => {
        const chip = document.createElement('div');
        chip.className = `carousel-sound-chip ${currentSoundId === sound.id ? 'active' : ''}`;
        chip.dataset.soundId = sound.id;
        chip.innerHTML = `<i class="fas ${sound.icon}"></i> ${sound.name}`;
        chip.addEventListener('click', () => {
            selectSound(sound);
            // Update all carousels
            document.querySelectorAll('.carousel-sound-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.soundId === sound.id);
            });
        });
        carouselEl.appendChild(chip);
    });
}

function toggleSoundCarousel(carouselId, btnId) {
    const carousel = document.getElementById(carouselId);
    const btn = document.getElementById(btnId);
    if (!carousel) return;
    buildSoundCarousel(carousel);
    const isOpen = carousel.classList.contains('open');
    carousel.classList.toggle('open', !isOpen);
    if (btn) btn.classList.toggle('active', !isOpen);
}

// Bind sound switcher buttons (idempotent)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('miniSoundSwitchBtn')?.addEventListener('click', () => {
            toggleSoundCarousel('miniSoundCarousel', 'miniSoundSwitchBtn');
        });
        document.getElementById('settingsSoundSwitchBtn')?.addEventListener('click', () => {
            toggleSoundCarousel('settingsSoundCarousel', 'settingsSoundSwitchBtn');
        });
    }, 500);
    
    // Setup update listeners
    setupUpdateListeners();
});

// ========== UPDATE SYSTEM ==========