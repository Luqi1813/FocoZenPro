(() => {
    const historyCore = window.FocoZenHistoryCore;

    const CATEGORY_PALETTE = [
        { from: '#60a5fa', to: '#2563eb' },
        { from: '#34d399', to: '#059669' },
        { from: '#f59e0b', to: '#d97706' },
        { from: '#f472b6', to: '#db2777' },
        { from: '#a78bfa', to: '#7c3aed' },
        { from: '#22d3ee', to: '#0891b2' },
        { from: '#fb7185', to: '#e11d48' },
        { from: '#4ade80', to: '#16a34a' },
        { from: '#fbbf24', to: '#ca8a04' },
        { from: '#38bdf8', to: '#0284c7' },
        { from: '#94a3b8', to: '#64748b' },
        { from: '#c084fc', to: '#9333ea' }
    ];

    const formatWeekdayLabel = (date) => {
        return new Date(date)
            .toLocaleDateString('pt-BR', { weekday: 'short' })
            .replace('.', '')
            .slice(0, 3)
            .replace(/^./, (match) => match.toUpperCase());
    };

    const formatEvolutionBucketLabel = (startDate, endDate) => {
        if (!startDate || !endDate) return '';
        if (startDate.toDateString() === endDate.toDateString()) return `${startDate.getDate()}`;
        return `${startDate.getDate()}-${endDate.getDate()}`;
    };

    const getCategoryPalette = (category, index = 0) => {
        const known = {
            Trabalho: CATEGORY_PALETTE[0],
            Livre: CATEGORY_PALETTE[3],
            Estudos: CATEGORY_PALETTE[1],
            Hobbies: CATEGORY_PALETTE[2],
            Leitura: CATEGORY_PALETTE[6],
            Projetos: CATEGORY_PALETTE[4],
            'ExercÃ­cio': CATEGORY_PALETTE[5],
            'Exercício': CATEGORY_PALETTE[5],
            Outros: CATEGORY_PALETTE[10]
        };

        if (category && known[category]) return known[category];
        if (index >= 0) return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

        let hash = 0;
        for (let position = 0; position < (category || '').length; position++) {
            hash = ((hash << 5) - hash) + category.charCodeAt(position);
            hash |= 0;
        }

        return CATEGORY_PALETTE[Math.abs(hash) % CATEGORY_PALETTE.length];
    };

    const getSortedGoalCategories = ({ userCategories, defaultCategories, focusGoals, locale = 'pt-BR' }) => {
        const baseCategories = Array.isArray(userCategories) && userCategories.length ? userCategories : (defaultCategories || []);
        const goals = Array.isArray(focusGoals) ? focusGoals : [];
        const goalCategories = goals.map((goal) => ({ name: goal?.category, icon: 'fa-bullseye' }));

        return [...baseCategories, ...goalCategories]
            .filter((category) => category && category.name && category.name !== 'Livre')
            .reduce((accumulator, category) => {
                if (!accumulator.some((item) => item.name === category.name)) {
                    accumulator.push(category);
                }
                return accumulator;
            }, [])
            .sort((left, right) => left.name.localeCompare(right.name, locale));
    };

    const isGoalApplicableOnDate = (goal, date) => {
        if (!goal || !date) return false;
        const dayOfWeek = new Date(date).getDay();
        if (goal.schedule === 'everyday') return true;
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    };

    const getActiveGoals = (focusGoals) => {
        const goals = Array.isArray(focusGoals) ? focusGoals : [];
        return goals.filter((goal) => goal && goal.active !== false && goal.category && Number(goal.dailyMinutes) > 0);
    };

    const getGoalSummaries = ({ focusGoals, focusHistory, period, now = new Date() }) => {
        const activeGoals = getActiveGoals(focusGoals);
        const dates = historyCore?.enumeratePeriodDates ? historyCore.enumeratePeriodDates(period, now) : [];
        const historyEntries = historyCore?.filterHistoryByPeriod
            ? historyCore.filterHistoryByPeriod(focusHistory, period, now)
            : [];
        const actualByCategory = {};

        historyEntries.forEach((entry) => {
            const category = entry?.category || 'Livre';
            actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry?.durationMinutes) || 0);
        });

        return activeGoals.map((goal, index) => {
            const targetMinutes = dates.reduce((sum, date) => {
                return sum + (isGoalApplicableOnDate(goal, date) ? Number(goal.dailyMinutes) || 0 : 0);
            }, 0);
            const actualMinutes = actualByCategory[goal.category] || 0;
            const percent = targetMinutes > 0 ? Math.round((actualMinutes / targetMinutes) * 100) : 0;

            return {
                ...goal,
                index,
                targetMinutes,
                actualMinutes,
                remainingMinutes: Math.max(0, targetMinutes - actualMinutes),
                percent,
                palette: getCategoryPalette(goal.category, index)
            };
        }).sort((left, right) => {
            if (right.percent !== left.percent) return right.percent - left.percent;
            return right.actualMinutes - left.actualMinutes;
        });
    };

    const getDailyGoalOutcome = ({ focusGoals, focusHistory, date }) => {
        const activeGoals = getActiveGoals(focusGoals);
        let targetMinutes = 0;
        let actualMinutes = 0;
        let activeCategories = 0;
        let hitCategories = 0;
        const dateKey = new Date(date).toISOString().split('T')[0];
        const actualByCategory = {};

        (Array.isArray(focusHistory) ? focusHistory : [])
            .filter((entry) => entry?.date === dateKey)
            .forEach((entry) => {
                const category = entry?.category || 'Livre';
                actualByCategory[category] = (actualByCategory[category] || 0) + (Number(entry?.durationMinutes) || 0);
            });

        activeGoals.forEach((goal) => {
            if (!isGoalApplicableOnDate(goal, date)) return;
            const target = Number(goal.dailyMinutes) || 0;
            const actual = actualByCategory[goal.category] || 0;
            targetMinutes += target;
            actualMinutes += actual;
            activeCategories++;
            if (actual >= target) hitCategories++;
        });

        return {
            targetMinutes,
            actualMinutes,
            activeCategories,
            hitCategories,
            hitAll: activeCategories > 0 && hitCategories === activeCategories
        };
    };

    const getGoalStreak = ({ focusGoals, focusHistory, now = new Date(), lookbackDays = 90 }) => {
        let streak = 0;
        const cursor = new Date(now);
        cursor.setHours(0, 0, 0, 0);

        for (let index = 0; index < lookbackDays; index++) {
            const outcome = getDailyGoalOutcome({ focusGoals, focusHistory, date: cursor });
            if (outcome.activeCategories === 0) {
                cursor.setDate(cursor.getDate() - 1);
                continue;
            }
            if (!outcome.hitAll) break;
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    };

    const getGoalOverview = ({ focusGoals, focusHistory, period, now = new Date() }) => {
        const summaries = getGoalSummaries({ focusGoals, focusHistory, period, now });
        const activeCount = summaries.length;
        const hitCount = summaries.filter((item) => item.actualMinutes >= item.targetMinutes && item.targetMinutes > 0).length;
        const totalTarget = summaries.reduce((sum, item) => sum + item.targetMinutes, 0);
        const totalActual = summaries.reduce((sum, item) => sum + item.actualMinutes, 0);
        const averageProgress = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
        const bestCategory = summaries.length
            ? summaries.reduce((best, item) => {
                if (!best) return item;
                if (item.percent !== best.percent) return item.percent > best.percent ? item : best;
                return item.actualMinutes > best.actualMinutes ? item : best;
            }, null)
            : null;

        return {
            summaries,
            activeCount,
            hitCount,
            totalTarget,
            totalActual,
            averageProgress,
            bestCategory,
            streak: getGoalStreak({ focusGoals, focusHistory, now })
        };
    };

    const getGoalEvolutionSeries = ({ focusGoals, focusHistory, period, now = new Date() }) => {
        if (period === 'day') {
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const outcome = getDailyGoalOutcome({ focusGoals, focusHistory, date: today });
            return [{
                label: 'Hoje',
                targetMinutes: outcome.targetMinutes,
                actualMinutes: outcome.actualMinutes
            }];
        }

        if (period === 'month') {
            const dates = historyCore?.enumeratePeriodDates ? historyCore.enumeratePeriodDates('month', now) : [];
            const series = [];

            for (let index = 0; index < dates.length; index += 7) {
                const chunk = dates.slice(index, index + 7);
                const aggregate = chunk.reduce((accumulator, date) => {
                    const outcome = getDailyGoalOutcome({ focusGoals, focusHistory, date });
                    accumulator.targetMinutes += outcome.targetMinutes;
                    accumulator.actualMinutes += outcome.actualMinutes;
                    return accumulator;
                }, { targetMinutes: 0, actualMinutes: 0 });

                const startDate = chunk[0];
                const endDate = chunk[chunk.length - 1];

                series.push({
                    label: formatEvolutionBucketLabel(startDate, endDate),
                    targetMinutes: aggregate.targetMinutes,
                    actualMinutes: aggregate.actualMinutes
                });
            }

            return series;
        }

        return (historyCore?.enumeratePeriodDates ? historyCore.enumeratePeriodDates('week', now) : []).map((date) => {
            const outcome = getDailyGoalOutcome({ focusGoals, focusHistory, date });
            return {
                label: formatWeekdayLabel(date),
                targetMinutes: outcome.targetMinutes,
                actualMinutes: outcome.actualMinutes
            };
        });
    };

    const getGoalMomentumState = (overview) => {
        if (!overview?.activeCount) return 'empty';
        if (overview.averageProgress >= 100) return 'ahead';
        if (overview.averageProgress >= 80) return 'near';
        if (overview.totalActual > 0) return 'moving';
        return 'start';
    };

    window.FocoZenGoalsCore = Object.freeze({
        CATEGORY_PALETTE,
        getCategoryPalette,
        getSortedGoalCategories,
        isGoalApplicableOnDate,
        getActiveGoals,
        getGoalSummaries,
        getDailyGoalOutcome,
        getGoalStreak,
        getGoalOverview,
        getGoalEvolutionSeries,
        getGoalMomentumState
    });
})();
