(() => {
    const safeDate = (value = new Date()) => {
        const parsedDate = value instanceof Date ? new Date(value) : new Date(value);
        return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    };

    const getDateKey = (value) => safeDate(value).toISOString().split('T')[0];

    const getPeriodDateRange = (period, now = new Date()) => {
        const end = safeDate(now);
        end.setHours(23, 59, 59, 999);

        const start = new Date(end);
        if (period === 'day') {
            start.setHours(0, 0, 0, 0);
        } else if (period === 'month') {
            start.setDate(start.getDate() - 29);
            start.setHours(0, 0, 0, 0);
        } else {
            start.setDate(start.getDate() - 6);
            start.setHours(0, 0, 0, 0);
        }

        return { start, end };
    };

    const enumeratePeriodDates = (period, now = new Date()) => {
        const { start, end } = getPeriodDateRange(period, now);
        const dates = [];
        const cursor = new Date(start);

        while (cursor <= end) {
            dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }

        return dates;
    };

    const filterHistoryByPeriod = (history, period, now = new Date()) => {
        const safeHistory = Array.isArray(history) ? history : [];

        if (period === 'day') {
            const todayKey = getDateKey(now);
            return safeHistory.filter((entry) => entry?.date === todayKey);
        }

        const { start } = getPeriodDateRange(period, now);
        return safeHistory.filter((entry) => {
            if (!entry?.date) return false;
            return new Date(entry.date) >= start;
        });
    };

    const formatMinutesToHours = (minutes) => {
        const totalMinutes = Math.max(0, Number(minutes) || 0);
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = Math.floor(totalMinutes % 60);

        if (hours > 0) return `${hours}h ${remainingMinutes}m`;
        return `${remainingMinutes}m`;
    };

    const getFocusWindowSummary = ({ history, now = new Date() }) => {
        const safeHistory = Array.isArray(history) ? history : [];
        const todayKey = getDateKey(now);
        const todayHistory = safeHistory.filter((entry) => entry?.date === todayKey);
        const todayMinutes = todayHistory.reduce((sum, entry) => sum + (Number(entry?.durationMinutes) || 0), 0);
        const weekHistory = filterHistoryByPeriod(safeHistory, 'week', now);
        const weekMinutes = weekHistory.reduce((sum, entry) => sum + (Number(entry?.durationMinutes) || 0), 0);

        return {
            todayHistory,
            todayMinutes,
            weekHistory,
            weekMinutes
        };
    };

    const getFocusStreakSummary = ({ history, now = new Date() }) => {
        const safeHistory = Array.isArray(history) ? history : [];
        const { todayHistory } = getFocusWindowSummary({ history: safeHistory, now });
        const streakEntries = safeHistory.filter((entry) => (Number(entry?.durationMinutes) || 0) > 0);

        let currentStreak = 0;
        const checkDate = safeDate(now);
        checkDate.setHours(0, 0, 0, 0);

        if (!todayHistory.length) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const currentKey = getDateKey(checkDate);
            if (streakEntries.some((entry) => entry.date === currentKey)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        const uniqueDates = [...new Set(streakEntries.map((entry) => entry.date))].sort();
        let maxStreak = 0;
        let tempStreak = 0;

        for (let index = 0; index < uniqueDates.length; index++) {
            if (index === 0) {
                tempStreak = 1;
                maxStreak = 1;
                continue;
            }

            const currentDate = new Date(uniqueDates[index]);
            const previousDate = new Date(uniqueDates[index - 1]);
            const diffDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
                if (tempStreak > maxStreak) maxStreak = tempStreak;
            } else {
                tempStreak = 1;
            }
        }

        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }

        return {
            currentStreak,
            maxStreak
        };
    };

    const getFocusGreetingState = ({ todayMinutes = 0, weekMinutes = 0 }) => {
        if (todayMinutes >= 120 && todayMinutes >= weekMinutes / 3) return 'master';
        if (todayMinutes > 30) return 'consistent';
        if (todayMinutes === 0) return 'start';
        return 'default';
    };

    window.FocoZenHistoryCore = Object.freeze({
        getPeriodDateRange,
        enumeratePeriodDates,
        filterHistoryByPeriod,
        formatMinutesToHours,
        getFocusWindowSummary,
        getFocusStreakSummary,
        getFocusGreetingState
    });
})();
