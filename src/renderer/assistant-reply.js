function formatAssistantGoalStatus(goalSummary) {
    if (!goalSummary) return '';
    const delta = goalSummary.actualMinutes - goalSummary.targetMinutes;
    if (goalSummary.targetMinutes <= 0) return 'Sem meta aplicável neste período.';
    if (delta >= 0) return `Meta batida com ${formatMinsToHours(delta)} de folga.`;
    return `Faltam ${formatMinsToHours(Math.abs(delta))} para bater a meta.`;
}

function getFocusNowSuggestion() {
    const overview = getGoalOverviewData(getAssistantDefaultPeriod());
    if (!overview.activeCount) {
        if (currentTask) {
            return `Sua melhor aposta agora é continuar em ${currentTask.category || 'Livre'} e fechar a tarefa "${currentTask.name}".`;
        }
        return 'Você ainda não tem metas ativas. Eu começaria pela categoria mais importante do dia e criaria uma meta simples para ganhar consistência.';
    }

    const candidate = overview.summaries
        .filter(item => item.remainingMinutes > 0)
        .sort((a, b) => {
            if (b.remainingMinutes !== a.remainingMinutes) return b.remainingMinutes - a.remainingMinutes;
            return a.percent - b.percent;
        })[0];

    if (!candidate) {
        return 'Você já bateu as metas ativas deste período. Se quiser, dá para usar o próximo bloco em uma categoria livre ou revisar uma tarefa importante.';
    }

    return `Eu priorizaria ${candidate.category}. Faltam ${formatMinsToHours(candidate.remainingMinutes)} para fechar a meta ${getPeriodNarration(getAssistantDefaultPeriod())}.`;
}

function expandAssistantFollowUp(text) {
    const normalized = normalizeAssistantText(text);
    if (!assistantConversationState) return text;

    const looksLikeFollowUp =
        normalized.startsWith('e ') ||
        normalized.startsWith('e em ') ||
        normalized.startsWith('e no ') ||
        normalized.startsWith('e na ') ||
        normalized.startsWith('e pra ') ||
        normalized.startsWith('e para ');

    if (!looksLikeFollowUp) return text;

    const temporal = detectAssistantTemporalContext(text, {
        period: assistantConversationState.period || getAssistantDefaultPeriod(),
        previous: assistantConversationState.previous || false
    });

    const category = detectAssistantCategory(text) || assistantConversationState.category || null;
    let intent = assistantConversationState.intent || 'summary';

    if (intent === 'top_category' && category) intent = 'focus_total';
    if (category && ['summary', 'planned_vs_actual', 'goal_hits', 'lagging_goal', 'trend'].includes(intent)) {
        intent = 'category_status';
    }

    const phrase = getPeriodPromptPhrase(temporal.period, temporal.previous);

    switch (intent) {
        case 'focus_total':
            return `quanto foquei ${category ? `em ${category} ` : ''}${phrase}`.trim();
        case 'category_status':
            return `como estou em ${category || 'Estudos'} ${phrase}`.trim();
        case 'top_category':
            return `qual categoria recebeu mais foco ${phrase}`.trim();
        case 'goal_hits':
            return `quais metas bati ${phrase}`.trim();
        case 'planned_vs_actual':
            return `como esta meu plano ${phrase}`.trim();
        case 'lagging_goal':
            return `qual meta esta mais atrasada ${phrase}`.trim();
        case 'summary':
            return `resuma meu desempenho ${phrase}`.trim();
        case 'trend':
            return `estou melhorando ${phrase}`.trim();
        case 'pomodoros':
            return `quantos pomodoros ${phrase}`.trim();
        default:
            return text;
    }
}

function getLaggingGoalSummary(period, previous = false) {
    const summaries = getAssistantGoalSummaries(period, previous)
        .filter(item => item.targetMinutes > 0 && item.remainingMinutes > 0)
        .sort((a, b) => {
            if (b.remainingMinutes !== a.remainingMinutes) return b.remainingMinutes - a.remainingMinutes;
            return a.percent - b.percent;
        });

    return summaries[0] || null;
}

function getCategoriesWithoutGoals() {
    const goalKeys = new Set(getActiveGoalsData().map(goal => normalizeAssistantText(goal.category)));
    return getAllAssistantCategories()
        .filter(category => normalizeAssistantText(category) !== normalizeAssistantText('Livre'))
        .filter(category => !goalKeys.has(normalizeAssistantText(category)));
}

function getCategoryRecentStats(category, days = 21) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const key = normalizeAssistantText(category);

    const entries = focusHistory.filter(entry => {
        const entryDate = new Date(`${entry.date}T00:00:00`);
        return entryDate >= start && entryDate <= today && normalizeAssistantText(entry.category || 'Livre') === key;
    });

    const totalMinutes = entries.reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const activeDaysSet = new Set(entries.map(entry => entry.date));
    const activeDays = activeDaysSet.size;
    const averagePerDay = days > 0 ? totalMinutes / days : 0;
    const averagePerActiveDay = activeDays > 0 ? totalMinutes / activeDays : 0;

    return {
        totalMinutes,
        activeDays,
        averagePerDay,
        averagePerActiveDay,
        days
    };
}

function assessGoalRealism(goal) {
    if (!goal) return null;
    const recent = getCategoryRecentStats(goal.category, 21);
    const targetDaily = Number(goal.dailyMinutes) || 0;
    const baseline = recent.averagePerDay;

    if (baseline <= 0) {
        return {
            tone: 'unknown',
            message: `Ainda não existe histórico suficiente em ${goal.category} para eu dizer se essa meta está realista com segurança.`
        };
    }

    const ratio = targetDaily / baseline;
    if (ratio >= 1.45) {
        return {
            tone: 'aggressive',
            message: `Hoje essa meta está bem agressiva. Seu ritmo recente em ${goal.category} gira em torno de ${formatMinsToHours(Math.round(baseline))} por dia, enquanto a meta pede ${formatMinsToHours(targetDaily)}.`
        };
    }

    if (ratio <= 0.7) {
        return {
            tone: 'conservative',
            message: `Essa meta parece conservadora. Seu ritmo recente em ${goal.category} está perto de ${formatMinsToHours(Math.round(baseline))} por dia, acima da meta atual de ${formatMinsToHours(targetDaily)}.`
        };
    }

    return {
        tone: 'balanced',
        message: `Ela parece realista. Seu ritmo recente em ${goal.category} está por volta de ${formatMinsToHours(Math.round(baseline))} por dia, bem perto da meta atual de ${formatMinsToHours(targetDaily)}.`
    };
}

function removeAllGoalsFromAssistant() {
    if (!focusGoals.length) {
        return {
            content: 'Você não tem metas ativas para apagar.',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    customConfirm(
        'Excluir todas as metas',
        `Isso vai remover ${focusGoals.length} meta(s) ativa(s). Deseja continuar?`,
        () => {
            focusGoals = [];
            saveFocusGoals();
            resetGoalForm();
            renderStatsGoalsSummary(window._statsPeriod || 'day');
            window.compileGoalsData?.();
            showGlassToast('Todas as metas foram removidas');
            pushAssistantMessage('assistant', 'Pronto. Removi todas as metas ativas do app.', [
                { type: 'view', value: 'view-goals', label: 'Abrir Metas' }
            ]);
            setAssistantSuggestions([
                'Crie uma meta de 2h por dia para Estudos',
                'Quais categorias estão sem meta?',
                'O que focar agora?'
            ]);
        }
    );

    return {
        content: 'Abri uma confirmação para apagar todas as metas ativas. Assim eu evito apagar tudo por acidente.',
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão ativas?',
            'Quais categorias estão sem meta?',
            'O que focar agora?'
        ]
    };
}

function personalizeAssistantReply(reply) {
    if (!reply || !reply.content) return reply;

    const introByIntent = {
        focus_total: ['Olhei aqui rapidinho.', 'Acabei de conferir.'],
        top_category: ['Puxei seu histórico.', 'Dando uma olhada no seu foco.'],
        category_status: ['Fui checar essa categoria.', 'Olhei como ela está agora.'],
        planned_vs_actual: ['Comparei o que você planejou com o que entregou.', 'Coloquei seu planejado lado a lado com o realizado.'],
        goal_hits: ['Dei uma passada nas suas metas.', 'Chequei suas metas deste recorte.'],
        summary: ['Fechei um resumão para você.', 'Organizei um panorama rápido.'],
        lagging_goal: ['Encontrei o ponto que mais está pedindo atenção.', 'Olhei onde está o maior atraso.'],
        goal_count: ['Conferi isso para você.', 'Olhei suas metas ativas.'],
        categories_without_goal: ['Aqui está o que ficou sem meta.', 'Separei as categorias ainda sem meta.'],
        timer_control: ['Feito.', 'Pronto.'],
        tasks: ['Olhei suas tarefas.', 'Puxei a visão atual das suas tarefas.'],
        trend: ['Comparei com o recorte anterior.', 'Olhei a evolução entre os períodos.'],
        pomodoros: ['Conferi seu histórico recente.', 'Puxei esse número para você.'],
        focus_now: ['Se eu fosse você, iria por aqui.', 'Minha leitura agora é esta.']
    };

    const intent = reply.context?.intent;
    const pool = introByIntent[intent] || [];
    if (!pool.length) return reply;

    const seed = (reply.content.length + (intent || '').length) % pool.length;
    const intro = pool[seed];
    return {
        ...reply,
        content: `${intro}\n${reply.content}`
    };
}
