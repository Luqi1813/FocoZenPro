function renderTimeline(allHistory) {
    const container = document.getElementById('focusTimeline');
    const tooltip = document.getElementById('timelineTooltip');
    const summaryEl = document.getElementById('timelineSummary');
    if (!container) return;
    container.innerHTML = '';

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const todaySessions = allHistory.filter(h => h.date === todayStr);

    // Category colors
    const catColors = {
        'Trabalho': '#6366f1',
        'Estudos': '#22c55e',
        'Hobbies': '#f59e0b',
        'Projetos': '#ec4899',
        'Outros': '#64748b'
    };

    // Summary
    if (summaryEl) {
        const totalMins = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        summaryEl.textContent = todaySessions.length > 0
            ? `${todaySessions.length} sessoes · ${formatMinsToHours(totalMins)} hoje`
            : 'Nenhuma sessao hoje';
    }

    // Hour markers background (0-23)
    const hoursContainer = document.createElement('div');
    hoursContainer.className = 'timeline-hours';
    for (let h = 0; h < 24; h++) {
        const mark = document.createElement('div');
        mark.className = 'timeline-hour-mark';
        // Show label every 3 hours
        if (h % 3 === 0) {
            const label = document.createElement('span');
            label.className = 'timeline-hour-label';
            label.textContent = `${h}h`;
            mark.appendChild(label);
        }
        hoursContainer.appendChild(mark);
    }
    container.appendChild(hoursContainer);

    // Session blocks
    todaySessions.forEach(session => {
        const sessionDate = new Date(session.id);
        const startHour = sessionDate.getHours() + sessionDate.getMinutes() / 60;
        const durationH = session.durationMinutes / 60;

        const leftPct = (startHour / 24) * 100;
        const widthPct = Math.max(0.4, (durationH / 24) * 100); // min 0.4% for visibility

        const block = document.createElement('div');
        block.className = 'timeline-session';
        const color = catColors[session.category] || catColors['Outros'];
        block.style.cssText = `left:${leftPct}%;width:${widthPct}%;background:${color};box-shadow:0 0 6px ${color}44;`;

        // Tooltip
        const startTime = `${String(sessionDate.getHours()).padStart(2,'0')}:${String(sessionDate.getMinutes()).padStart(2,'0')}`;
        const endDate = new Date(sessionDate.getTime() + session.durationMinutes * 60000);
        const endTime = `${String(endDate.getHours()).padStart(2,'0')}:${String(endDate.getMinutes()).padStart(2,'0')}`;

        block.addEventListener('mouseenter', () => {
            if (!tooltip) return;
            tooltip.innerHTML = `<strong style="color:${color}">${session.category || 'Foco'}</strong><br>${startTime} — ${endTime} · ${session.durationMinutes}min`;
            tooltip.style.display = 'block';
            const rect = block.getBoundingClientRect();
            const parentRect = container.closest('.bento-panel').getBoundingClientRect();
            tooltip.style.left = (rect.left - parentRect.left + rect.width / 2 - 40) + 'px';
            tooltip.style.top = (rect.top - parentRect.top - 46) + 'px';
        });
        block.addEventListener('mouseleave', () => {
            if (tooltip) tooltip.style.display = 'none';
        });

        container.appendChild(block);
    });

    // "Now" marker
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const nowPct = (nowHour / 24) * 100;
    const nowMarker = document.createElement('div');
    nowMarker.className = 'timeline-now';
    nowMarker.style.left = `${nowPct}%`;
    container.appendChild(nowMarker);
}

// ==========================================
// MINI PLAYER SOUND SWITCHER CAROUSEL
// ==========================================