function filterHistoryByPeriod(history, period) {
    const now = new Date();
    if (period === 'day') {
        const todayStr = now.toISOString().split('T')[0];
        return history.filter(h => h.date === todayStr);
    } else if (period === 'month') {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 29); cutoff.setHours(0,0,0,0);
        return history.filter(h => new Date(h.date) >= cutoff);
    } else {
        const cutoff = new Date(now); cutoff.setDate(cutoff.getDate() - 6); cutoff.setHours(0,0,0,0);
        return history.filter(h => new Date(h.date) >= cutoff);
    }
}

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

function drawArrowLabels(ctx, entries, total, cx, cy, maxRadius, ringWidth, ringGap, canvasW, canvasH) {
    const labelX = canvasW * 0.62;
    const usedYPositions = [];
    
    ctx.save();
    entries.forEach((entry, i) => {
        const radius = maxRadius - i * (ringWidth + ringGap);
        if (radius <= 10) return;
        const pct = total > 0 ? entry.value / total : 0;
        if (pct <= 0) return;
        
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * pct);
        const midAngle = (startAngle + endAngle) / 2;
        
        // Arrow starts from the CENTER of the arc ring (not the edge)
        const arrowStartX = cx + Math.cos(midAngle) * radius;
        const arrowStartY = cy + Math.sin(midAngle) * radius;
        
        // Target Y with overlap avoidance (28px minimum spacing)
        let targetY = arrowStartY;
        for (const usedY of usedYPositions) {
            if (Math.abs(targetY - usedY) < 28) {
                targetY = usedY + 28;
            }
        }
        targetY = Math.max(14, Math.min(canvasH - 14, targetY));
        usedYPositions.push(targetY);
        
        const elbowX = cx + Math.cos(midAngle) * (maxRadius + 20);
        
        // Draw arrow line — thicker (2.5px)
        ctx.beginPath();
        ctx.moveTo(arrowStartX, arrowStartY);
        ctx.lineTo(Math.max(elbowX, labelX - 16), arrowStartY);
        ctx.lineTo(labelX - 8, targetY);
        ctx.strokeStyle = entry.color.from;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        // Dot at arrow start
        ctx.beginPath();
        ctx.arc(arrowStartX, arrowStartY, 3, 0, Math.PI * 2);
        ctx.fillStyle = entry.color.from;
        ctx.fill();
        
        // Single-line label: "Category  XX% · Xh Xm"
        const pctVal = Math.round(pct * 100);
        ctx.font = '600 11px Inter';
        ctx.fillStyle = entry.color.from;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const nameText = entry.label;
        const nameWidth = ctx.measureText(nameText).width;
        ctx.fillText(nameText, labelX, targetY);
        
        // Percentage + time inline, right after category name
        ctx.font = '500 10px Inter';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`${pctVal}% · ${formatMinutesToHours(entry.value)}`, labelX + nameWidth + 6, targetY);
    });
    ctx.restore();
}

function renderStatsGoalsSummary(period) {
    if (period) {
        window._statsPeriod = period || 'week';
    }
    return window.FocoZenStatsRuntime?.refresh?.();

    const periodLabel = document.getElementById('statsGoalsPeriodLabel');
    const badgeEl = document.getElementById('statsGoalsStatusBadge');
    const headlineEl = document.getElementById('statsGoalsHeadline');
    const captionEl = document.getElementById('statsGoalsCaption');
    const listEl = document.getElementById('statsGoalsSummaryList');
    if (!badgeEl || !headlineEl || !captionEl || !listEl) return;

    const overview = getGoalOverviewData(period);
    const momentum = getGoalMomentumContent(overview);
    const series = getGoalEvolutionSeriesData(period);

    if (periodLabel) periodLabel.textContent = getPeriodLabel(period);
    badgeEl.textContent = momentum.badge;
    headlineEl.textContent = momentum.headline;
    captionEl.textContent = '';

    if (!overview.summaries.length || !series.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Defina metas na aba Metas para acompanhar a evolução do seu plano por período.</div>';
        return;
    }

    const overallPercent = overview.totalTarget > 0
        ? Math.max(0, Math.round((overview.totalActual / overview.totalTarget) * 100))
        : 0;

    listEl.innerHTML = `
        <div class="goals-rhythm-overview">
            <div class="goals-rhythm-main">
                <div class="goals-rhythm-main-top">
                    <div>
                        <div class="goals-rhythm-kicker">Total do período</div>
                        <div class="goals-rhythm-value">${formatMinutesToHours(overview.totalActual)} <span>de ${formatMinutesToHours(overview.totalTarget)}</span></div>
                        </div>
                    </div>
                    <div class="goals-rhythm-percent">${overallPercent}%</div>
                </div>
                <div class="goals-rhythm-rail">
                    <div class="goals-rhythm-fill" style="width:${Math.min(100, overallPercent)}%"></div>
                </div>
            </div>
        `;
}

function renderGoalsComparisonChart(period) {
    const listEl = document.getElementById('goalsComparisonList');
    if (!listEl) return;

    const overview = getGoalOverviewData(period);
    const titleEl = document.getElementById('goalsChartSubtitle');
    const pillEl = document.getElementById('goalsMomentumPill');
    const momentum = getGoalMomentumContent(overview);

    if (titleEl) titleEl.textContent = `${formatMinutesToHours(overview.totalActual)} entregues de ${formatMinutesToHours(overview.totalTarget)} planejados.`;
    if (pillEl) pillEl.textContent = momentum.badge;

    if (!overview.summaries.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Ainda nao ha metas ativas para comparar neste periodo.</div>';
        return;
    }

    const maxHours = Math.max(
        ...overview.summaries.flatMap(item => [item.targetMinutes / 60, item.actualMinutes / 60]),
        1
    );

    listEl.innerHTML = overview.summaries.map(item => {
        const actualHours = item.actualMinutes / 60;
        const targetHours = item.targetMinutes / 60;
        const actualWidth = Math.min(100, (actualHours / maxHours) * 100);
        const fillWidth = item.actualMinutes > 0 ? Math.max(actualWidth, 6) : 0;
        const targetOffset = Math.min(100, (targetHours / maxHours) * 100);
        const deltaMinutes = item.actualMinutes - item.targetMinutes;
        const deltaText = deltaMinutes === 0
            ? 'Meta atingida'
            : deltaMinutes > 0
                ? `Passou ${formatMinutesToHours(Math.abs(deltaMinutes))}`
                : `Faltam ${formatMinutesToHours(Math.abs(deltaMinutes))}`;
        const percentLabel = `${Math.max(0, item.percent)}%`;
        const actualLabelLeft = fillWidth > 0 ? Math.min(96, fillWidth) : 0;
        const actualAlignClass = fillWidth > 86 ? 'end' : 'after-fill';
        const targetAlignClass = targetOffset < 14 ? 'start' : (targetOffset > 86 ? 'end' : '');
        const actualLabelMarkup = item.actualMinutes > 0
            ? `<span class="goals-track-label actual ${actualAlignClass}" style="left:${actualLabelLeft}%;">Realizado ${formatMinutesToHours(item.actualMinutes)}</span>`
            : '';

        return `
            <div class="goals-comparison-row">
                <div class="goals-comparison-head">
                    <div class="goals-comparison-title-wrap">
                        <div class="goals-comparison-name">${item.category}</div>
                        <span class="goals-comparison-percent">${percentLabel}</span>
                    </div>
                    <span class="goals-comparison-status">${deltaText}</span>
                </div>
                <div class="goals-comparison-track-wrap">
                    <div class="goals-comparison-track">
                        <div class="goals-comparison-fill" style="width:${fillWidth}%; background:${item.palette.from}; color:${item.palette.from};"></div>
                        ${actualLabelMarkup}
                        <div class="goals-comparison-target" style="left:calc(${targetOffset}% - 1px);"></div>
                    </div>
                    <div class="goals-comparison-footer">
                        <span class="goals-track-label target ${targetAlignClass}" style="left:${targetOffset}%;">Meta ${formatMinutesToHours(item.targetMinutes)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderGoalsListLegacy() {
    const listEl = document.getElementById('goalsList');
    if (!listEl) return;

    if (!focusGoals.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.</div>';
        return;
    }

    listEl.innerHTML = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const palette = resolveCategoryPalette(goal.category);
            const scheduleLabel = goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias úteis';
            return `
                <div class="goal-item">
                    <div class="goal-item-meta">
                        <div class="goals-compact-meta">
                            <span class="goals-category-dot" style="color:${palette.from}; background:${palette.from};"></span>
                            <span class="goals-category-name">${goal.category}</span>
                        </div>
                        <span class="goal-item-subline">${formatMinutesToHours(goal.dailyMinutes)} por dia - ${scheduleLabel}</span>
                    </div>
                    <div class="goals-progress-wrap">
                        <div class="goals-progress-top">
                            <span>Meta diária</span>
                            <span>${goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex'}</span>
                        </div>
                        <div class="goals-progress-rail">
                            <div class="goals-progress-actual" style="width:100%; background:${palette.from}; color:${palette.from};"></div>
                        </div>
                    </div>
                    <div class="goal-item-actions">
                        <button class="goal-item-btn" type="button" data-action="edit-goal" data-goal-id="${goal.id}" title="Editar meta"><i class="fas fa-pen"></i></button>
                        <button class="goal-item-btn danger" type="button" data-action="delete-goal" data-goal-id="${goal.id}" title="Remover meta"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
}

window.compileGoalsData = function() {
    const period = window._goalsPeriod || 'week';
    const overview = getGoalOverviewData(period);
    const bestLabel = overview.bestCategory
        ? `${overview.bestCategory.category} ${Math.max(0, overview.bestCategory.percent)}%`
        : 'Sem dados';

    document.getElementById('goalsHitRate').textContent = `${overview.hitCount}/${overview.activeCount}`;
    document.getElementById('goalsAverageProgress').textContent = `${Math.max(0, overview.averageProgress)}%`;
    document.getElementById('goalsStreakValue').textContent = `${overview.streak} dias`;
    document.getElementById('goalsBestCategory').textContent = bestLabel;

    renderGoalCategoryOptions();
    renderGoalsComparisonChart(period);
    renderGoalsList();

    if (!window._goalsPeriodBound) {
        window._goalsPeriodBound = true;
        document.querySelectorAll('#goalsPeriodSelector .goals-period-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#goalsPeriodSelector .goals-period-btn').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                window._goalsPeriod = btn.dataset.period;
                window.compileGoalsData();
            });
        });

        document.querySelectorAll('.goal-schedule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.goal-schedule-btn').forEach(item => item.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('goalScheduleInput').value = btn.dataset.schedule;
            });
        });

        document.getElementById('goalHoursDecrease')?.addEventListener('click', () => {
            const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
            updateGoalHoursDisplay(currentHours - 0.5);
        });

        document.getElementById('goalHoursIncrease')?.addEventListener('click', () => {
            const currentHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value || '1');
            updateGoalHoursDisplay(currentHours + 0.5);
        });

        document.getElementById('btnSaveGoal')?.addEventListener('click', () => {
            const category = document.getElementById('goalCategorySelect')?.value;
            const dailyHours = parseFloat(document.getElementById('goalDailyMinutesInput')?.value);
            const dailyMinutes = Math.round((dailyHours || 0) * 60);
            const schedule = document.getElementById('goalScheduleInput')?.value || 'weekdays';
            const result = saveGoalEntry({ category, dailyMinutes, schedule });
            if (!result.ok) {
                showGlassToast(result.message);
                return;
            }

            resetGoalForm();
            showGlassToast(result.message);
        });

        document.getElementById('btnCancelGoalEdit')?.addEventListener('click', () => {
            resetGoalForm();
        });

        document.getElementById('btnRefreshGoals')?.addEventListener('click', () => {
            const icon = document.getElementById('goalsRefreshIcon');
            if (icon) {
                icon.classList.add('spin');
                setTimeout(() => icon.classList.remove('spin'), 700);
            }
            window.compileGoalsData();
        });
    }
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

function renderGoalsList() {
    const listEl = document.getElementById('goalsList');
    if (!listEl) return;

    if (!focusGoals.length) {
        listEl.innerHTML = '<div class="goals-empty-state">Nenhuma meta criada ainda. Comece com uma categoria que voce quer priorizar todos os dias.</div>';
        return;
    }

    listEl.innerHTML = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const palette = resolveCategoryPalette(goal.category);
            const scheduleLabel = goal.schedule === 'everyday' ? 'Semana inteira' : 'Dias uteis';
            const dailyHours = ((Number(goal.dailyMinutes) || 0) / 60).toFixed(1).replace('.0', '').replace('.', ',');
            return `
                <div class="goal-item">
                    <div class="goal-item-meta">
                        <div class="goals-compact-meta">
                            <span class="goals-category-dot" style="color:${palette.from}; background:${palette.from};"></span>
                            <span class="goals-category-name">${goal.category}</span>
                        </div>
                        <span class="goal-item-subline">${dailyHours}h por dia - ${scheduleLabel}</span>
                    </div>
                    <div class="goals-progress-wrap">
                        <div class="goals-progress-top">
                            <span>Meta diaria</span>
                            <span>${goal.schedule === 'everyday' ? '7 dias' : 'Seg a sex'}</span>
                        </div>
                        <div class="goals-progress-rail">
                            <div class="goals-progress-actual" style="width:100%; background:${palette.from}; color:${palette.from};"></div>
                        </div>
                    </div>
                    <div class="goal-item-actions">
                        <button class="goal-item-btn" type="button" onclick="window.editGoalItem(${goal.id})" title="Editar meta"><i class="fas fa-pen"></i></button>
                        <button class="goal-item-btn danger" type="button" onclick="window.deleteGoalItem(${goal.id})" title="Remover meta"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');
}

renderStatsGoalsSummary = function(period) {
    if (period) {
        window._statsPeriod = period || 'week';
    }
    return window.FocoZenStatsRuntime?.refresh?.();
};

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
