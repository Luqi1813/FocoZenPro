function formatMinsToHours(mins) {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// Chart.js plugin: adds shadow glow to chart elements
const chartShadowPlugin = {
    id: 'shadowGlow',
    beforeDraw: (chart) => {
        const ctx2d = chart.ctx;
        ctx2d.save();
        ctx2d.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx2d.shadowBlur = 18;
        ctx2d.shadowOffsetX = 0;
        ctx2d.shadowOffsetY = 4;
    },
    afterDraw: (chart) => {
        chart.ctx.restore();
    }
};

function renderCategoriesChart(canvasEl, legendEl, allHistory = []) {
    if (Array.isArray(canvasEl) && legendEl === undefined) {
        allHistory = canvasEl;
        canvasEl = null;
        legendEl = null;
    }

    const canvas = canvasEl instanceof HTMLCanvasElement ? canvasEl : document.getElementById('categoriesChart');
    const legend = legendEl ?? document.getElementById('categoriesLegend');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const catMap = {};
    allHistory.forEach(h => {
        catMap[h.category] = (catMap[h.category] || 0) + h.durationMinutes;
    });
    
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const total = data.reduce((a,b) => a+b, 0);
    
    const activeFrame = radialChartFrames.get(canvas);
    if (activeFrame) {
        cancelAnimationFrame(activeFrame);
        radialChartFrames.delete(canvas);
    }
    
    const container = canvas.parentElement;
    const containerW = container.clientWidth || 400;
    const containerH = container.clientHeight || 280;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerW * dpr;
    canvas.height = containerH * dpr;
    canvas.style.width = containerW + 'px';
    canvas.style.height = containerH + 'px';
    ctx.scale(dpr, dpr);
    
    const cx = containerW / 2;
    const cy = containerH / 2;
    const maxRadius = Math.min(cx, cy) - 12;
    
    let sortedEntries = labels.map((l, i) => ({ label: l, value: data[i], color: resolveCategoryPalette(l, i) }))
        .sort((a, b) => b.value - a.value);

    if (sortedEntries.length > 4) {
        const topEntries = sortedEntries.slice(0, 4);
        const otherValue = sortedEntries.slice(4).reduce((sum, entry) => sum + entry.value, 0);
        if (otherValue > 0) {
            topEntries.push({
                label: 'Outros',
                value: otherValue,
                color: resolveCategoryPalette('Outros', 5)
            });
        }
        sortedEntries = topEntries;
    }

    sortedEntries = sortedEntries.map((entry, index) => ({
        ...entry,
        color: resolveCategoryPalette(entry.label, index)
    }));

    const ringCount = sortedEntries.length || 1;
    const ringWidth = Math.min(18, Math.max(11, (maxRadius - 18) / ringCount));
    const ringGap = 6;

    if (legend) {
        if (!sortedEntries.length || total === 0) {
            legend.innerHTML = '<div class="stats-legend-empty">Ainda nao ha foco suficiente neste periodo para distribuir por categoria.</div>';
        } else {
            legend.innerHTML = sortedEntries.map(entry => {
                const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                return `
                    <div class="stats-legend-item">
                        <span class="stats-legend-dot" style="color:${entry.color.from}; background:${entry.color.from};"></span>
                        <div class="stats-legend-main">
                            <span class="stats-legend-name">${entry.label}</span>
                            <span class="stats-legend-meta">${pct}% do foco no periodo</span>
                        </div>
                        <span class="stats-legend-value">${formatMinutesToHours(entry.value)}</span>
                    </div>
                `;
            }).join('');
        }
    }
    
    let animProgress = 0;
    const animDuration = 900;
    const animStart = performance.now();
    
    function drawFrame(now) {
        animProgress = Math.min(1, (now - animStart) / animDuration);
        const ease = 1 - Math.pow(1 - animProgress, 3);
        
        ctx.clearRect(0, 0, containerW, containerH);
        
        sortedEntries.forEach((entry, i) => {
            const radius = maxRadius - i * (ringWidth + ringGap);
            if (radius <= 10) return;
            const pct = total > 0 ? entry.value / total : 0;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (Math.PI * 2 * pct * ease);
            
            // Background track
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = ringWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            // Colored arc
            if (pct > 0) {
                const grad = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
                grad.addColorStop(0, entry.color.from);
                grad.addColorStop(1, entry.color.to);
                
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.strokeStyle = grad;
                ctx.lineWidth = ringWidth;
                ctx.lineCap = 'round';
                ctx.stroke();
            }
        });
        
        if (animProgress < 1) {
            radialChartFrames.set(canvas, requestAnimationFrame(drawFrame));
        }
    }
    
    radialChartFrames.set(canvas, requestAnimationFrame(drawFrame));
}

function renderStatsGoalsSummary(period) {
    if (period) {
        window._statsPeriod = period || 'week';
    }
    return window.FocoZenStatsRuntime?.refresh?.();
}

renderGoalsComparisonChart = function(period) {
    if (period) window.FocoZenGoalsRuntime?.setGoalsPeriod?.(period);
    return window.FocoZenGoalsRuntime?.refresh?.();
};

renderGoalsList = function() {
    return window.FocoZenGoalsRuntime?.refresh?.();
};

window.compileGoalsData = function() {
    return window.FocoZenGoalsRuntime?.refresh?.();
};

window.editGoalItem = function(goalId) {
    openGoalEditModal(goalId);
};

window.deleteGoalItem = function(goalId) {
    if (document.getElementById('react-goals-root')) {
        return window.FocoZenGoalsRuntime?.deleteGoal?.(goalId);
    }

    const goal = focusGoals.find(item => item.id === goalId);
    if (!goal) return;

    customConfirm(
        'Excluir Meta',
        `Deseja excluir a meta da categoria "${goal.category}"?`,
        () => {
            focusGoals = focusGoals.filter(item => item.id !== goalId);
            saveFocusGoals();
            if (editingGoalId === goalId) resetGoalForm();
            renderStatsGoalsSummary(window._statsPeriod || 'week');
            window.compileGoalsData();
            showGlassToast('Meta removida');
        }
    );
};

function getAccentColor() {
    // Read the CSS variable live so bars always match the user's current theme
    return getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#f97316';
}

function renderPeriodBarChart(canvasEl, allHistory = [], period = 'week') {
    if (!(canvasEl instanceof HTMLCanvasElement)) {
        period = typeof allHistory === 'string' ? allHistory : period;
        allHistory = Array.isArray(canvasEl) ? canvasEl : [];
        canvasEl = null;
    }

    const ctx = canvasEl instanceof HTMLCanvasElement ? canvasEl : document.getElementById('weekChart');
    if (!ctx) return;
    
    // Dynamic title based on period
    const barPanel = ctx.closest('.bento-panel');
    const titleEl = barPanel ? barPanel.querySelector('.bento-panel-title') : null;
    if (titleEl) {
        const titles = { 'week': 'CONSIST\u00caNCIA SEMANAL', 'day': 'CONSIST\u00caNCIA DI\u00c1RIA', 'month': 'CONSIST\u00caNCIA MENSAL' };
        titleEl.textContent = titles[period] || titles['week'];
    }
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
    const labels = [];
    const data = [];
    const dataMins = [];
    const now = new Date();
    const accent = getAccentColor();
    
    if (period === 'day') {
        // 24h view
        for (let h = 0; h < 24; h++) {
            labels.push(`${String(h).padStart(2,'0')}h`);
            const todayStr = now.toISOString().split('T')[0];
            const mins = allHistory
                .filter(x => x.date === todayStr)
                .reduce((acc, x) => {
                    const xH = new Date(x.id).getHours();
                    return acc + (xH === h ? x.durationMinutes : 0);
                }, 0);
            data.push(Math.round((mins / 60) * 100) / 100);
            dataMins.push(mins);
        }
    } else if (period === 'month') {
        // Last 30 days aggregated by week
        const weekLabels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        const weekMins = [0, 0, 0, 0];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const weekIdx = Math.floor((29 - i) / 7);
            const mins = allHistory.filter(h => h.date === dStr).reduce((acc, h) => acc + h.durationMinutes, 0);
            if (weekIdx < 4) weekMins[weekIdx] += mins;
        }
        weekLabels.forEach((l, i) => { labels.push(l); data.push(Math.round((weekMins[i]/60)*10)/10); dataMins.push(weekMins[i]); });
    } else {
        // Default: 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(dayNames[d.getDay()]);
            const dStr = d.toISOString().split('T')[0];
            const mins = allHistory.filter(h => h.date === dStr).reduce((acc, h) => acc + h.durationMinutes, 0);
            data.push(Math.round((mins / 60) * 10) / 10);
            dataMins.push(mins);
        }
    }

    const previousChart = periodChartInstances.get(ctx);
    if (previousChart) previousChart.destroy();
    
    const nextChart = new Chart(ctx, {
        type: 'bar',
        plugins: [chartShadowPlugin],
        data: {
            labels: labels,
            datasets: [{
                label: 'Foco',
                data: data,
                backgroundColor: `${accent}99`,
                hoverBackgroundColor: `${accent}dd`,
                borderRadius: 8,
                borderSkipped: false,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { color: 'rgba(255,255,255,0.4)', font: { family: 'Inter', size: 11 }, callback: v => v > 0 ? `${v}h` : '' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter', size: 11 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10,18,40,0.95)',
                    titleColor: '#fff',
                    bodyColor: 'rgba(255,255,255,0.7)',
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: (ctx) => {
                            const mins = dataMins[ctx.dataIndex];
                            return `  ${formatMinsToHours(mins)} de foco`;
                        }
                    }
                }
            }
        }
    });
    periodChartInstances.set(ctx, nextChart);
}
