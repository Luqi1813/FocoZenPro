function answerFocusTotal(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const category = detectAssistantCategory(text);
    const totalMinutes = getTotalFocusForPeriod(period, category, previous);
    const sessions = getSessionsCountForPeriod(period, category, previous);

    if (!totalMinutes) {
        return {
            content: category
                ? `Ainda não encontrei foco registrado em ${category} ${getPeriodNarration(period, previous)}.`
                : `Ainda não há foco registrado ${getPeriodNarration(period, previous)}.`,
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'focus_total', period, previous, category }
        };
    }

    return {
        content: [
            category
                ? `Você registrou ${formatMinsToHours(totalMinutes)} em ${category} ${getPeriodNarration(period, previous)}.`
                : `Você registrou ${formatMinsToHours(totalMinutes)} de foco ${getPeriodNarration(period, previous)}.`,
            `${sessions} sessão(ões) contabilizadas nesse recorte.`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Abrir Estatísticas' }],
        suggestions: [
            `Qual categoria recebeu mais foco ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
            'O que focar agora?',
            'Quais metas bati neste período?'
        ],
        context: { intent: 'focus_total', period, previous, category }
    };
}

function answerTopCategory(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const totals = getHistoryTotalsByCategory(period, previous);

    if (!totals.length) {
        return {
            content: `Ainda não há histórico suficiente ${getPeriodNarration(period, previous)} para apontar uma categoria líder.`,
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'top_category', period, previous, category: null }
        };
    }

    const top = totals[0];
    const totalMinutes = totals.reduce((sum, item) => sum + item.minutes, 0);
    const percent = totalMinutes > 0 ? Math.round((top.minutes / totalMinutes) * 100) : 0;
    const next = totals[1];

    return {
        content: [
            `${top.category} lidera ${getPeriodNarration(period, previous)} com ${formatMinsToHours(top.minutes)} de foco.`,
            `Isso representa ${percent}% do total registrado${next ? `, à frente de ${next.category} por ${formatMinsToHours(top.minutes - next.minutes)}.` : '.'}`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Ver distribuição' }],
        suggestions: [
            `Quanto foquei em ${top.category} ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
            'Resuma meu desempenho',
            'O que focar agora?'
        ],
        context: { intent: 'top_category', period, previous, category: top.category }
    };
}

function answerGoalHits(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);

    if (!overview.activeCount) {
        return {
            content: 'Você ainda não tem metas ativas para eu verificar nesse período.',
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Quais metas estão ativas?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_hits', period, previous, category: null }
        };
    }

    const hitGoals = overview.summaries.filter(item => item.targetMinutes > 0 && item.actualMinutes >= item.targetMinutes);
    if (!hitGoals.length) {
        return {
            content: `Ainda não houve meta batida ${getPeriodNarration(period, previous)}. A melhor categoria até agora é ${overview.bestCategory?.category || 'sem destaque'} com ${overview.bestCategory?.percent || 0}% da meta.`,
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: [
                'Como estou em Estudos?',
                'Quanto falta para minhas metas?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_hits', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    return {
        content: [
            `${hitGoals.length} de ${overview.activeCount} meta(s) foram batidas ${getPeriodNarration(period, previous)}.`,
            hitGoals.map(item => `• ${item.category}: ${formatMinsToHours(item.actualMinutes)} de ${formatMinsToHours(item.targetMinutes)}`).join('\n')
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'Como estou em Trabalho?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'goal_hits', period, previous, category: hitGoals[0]?.category || null }
    };
}

function answerGoalList() {
    if (!focusGoals.length) {
        return {
            content: 'Você ainda não tem metas ativas. Se quiser, eu posso criar uma agora em linguagem natural.',
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Crie uma meta de 3h para Trabalho em dias úteis',
                'O que focar agora?'
            ]
        };
    }

    const lines = focusGoals
        .slice()
        .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))
        .map(goal => {
            const scheduleLabel = goal.schedule === 'everyday' ? 'semana inteira' : 'dias úteis';
            return `• ${goal.category}: ${formatMinsToHours(goal.dailyMinutes)} por dia (${scheduleLabel})`;
        });

    return {
        content: ['Metas ativas no momento:', ...lines].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Como estou em Estudos?',
            'Quais metas bati esta semana?',
            'Ajuste a meta de Trabalho para 4h por dia'
        ]
    };
}

function answerCategoryStatus(text) {
    const category = detectAssistantCategory(text);
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;

    if (!category) {
        return {
            content: 'Me diga a categoria que você quer analisar e eu te conto como ela está. Exemplo: "Como estou em Estudos esta semana?"',
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'category_status', period, previous, category: null }
        };
    }

    const summary = getAssistantGoalSummaries(period, previous).find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    const actualMinutes = getTotalFocusForPeriod(period, category, previous);

    if (!summary) {
        if (!actualMinutes) {
            return {
                content: `Ainda não encontrei foco registrado em ${category} ${getPeriodNarration(period, previous)} e também não há meta ativa dessa categoria.`,
                suggestions: [
                    `Crie uma meta de 2h por dia para ${category}`,
                    `Quanto foquei em ${category} ${period === 'day' ? 'hoje' : period === 'week' ? 'esta semana' : 'neste mês'}?`,
                    'Quais metas estão ativas?'
                ],
                context: { intent: 'category_status', period, previous, category }
            };
        }

        return {
            content: `Você registrou ${formatMinsToHours(actualMinutes)} em ${category} ${getPeriodNarration(period, previous)}. Hoje essa categoria não tem meta ativa para comparação.`,
            suggestions: [
                `Crie uma meta de 2h por dia para ${category}`,
                'Quais metas estão ativas?',
                'O que focar agora?'
            ],
            context: { intent: 'category_status', period, previous, category }
        };
    }

    return {
        content: [
            `${summary.category} ${getPeriodNarration(period, previous)}: ${formatMinsToHours(summary.actualMinutes)} realizados de ${formatMinsToHours(summary.targetMinutes)} planejados.`,
            `${summary.percent}% da meta concluída. ${formatAssistantGoalStatus(summary)}`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Ajuste a meta de ${summary.category} para ${Math.max(1, Math.round((summary.dailyMinutes || 60) / 60))}h por dia`,
            'Quais metas bati esta semana?',
            'O que focar agora?'
        ],
        context: { intent: 'category_status', period, previous, category: summary.category }
    };
}

function answerPlannedVsActual(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);

    if (!overview.activeCount) {
        return {
            content: `Ainda não há metas ativas ${getPeriodNarration(period, previous)} para comparar planejado e realizado.`,
            actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
            suggestions: getAssistantDefaultSuggestions('view-goals'),
            context: { intent: 'planned_vs_actual', period, previous, category: null }
        };
    }

    return {
        content: [
            `${getPeriodLabel(period)}: ${formatMinsToHours(overview.totalActual)} realizados de ${formatMinsToHours(overview.totalTarget)} planejados.`,
            `${overview.averageProgress}% do plano cumprido e ${overview.hitCount} de ${overview.activeCount} meta(s) batidas.`
        ].join('\n'),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'O que focar agora?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'planned_vs_actual', period, previous, category: null }
    };
}

function answerPomodoros(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    if (period === 'day') {
        return {
            content: `${previous ? 'Ontem' : 'Hoje'} você ${previous ? 'registrou' : 'concluiu'} ${previous ? `${getSessionsCountForPeriod('day', null, true)} sessão(ões) de foco` : `${totalPomodorosToday} pomodoro(s) completos`} e ${previous ? 'teve foco registrado no histórico.' : `${getSessionsCountForPeriod('day')} sessão(ões) de foco no histórico.`}`,
            suggestions: [
                'Quanto foquei hoje?',
                'Qual categoria recebeu mais foco hoje?',
                'O que focar agora?'
            ],
            context: { intent: 'pomodoros', period, previous, category: null }
        };
    }

    const sessions = getSessionsCountForPeriod(period, null, previous);
    return {
        content: `Para ${getPeriodLabel(period).toLowerCase()}, eu tenho ${sessions} sessão(ões) de foco registradas no histórico. O contador exato de pomodoros completos hoje está em ${totalPomodorosToday}.`,
        suggestions: [
            'Resuma meu desempenho',
            'Qual categoria recebeu mais foco esta semana?',
            'Quais metas bati neste período?'
        ],
        context: { intent: 'pomodoros', period, previous, category: null }
    };
}

function answerTrend(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const currentRange = getHistoryPeriodRange(period, previous);
    const previousRange = getHistoryPeriodRange(period, !previous);
    const currentMinutes = filterHistoryBetween(currentRange.start, currentRange.end).reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const previousMinutes = filterHistoryBetween(previousRange.start, previousRange.end).reduce((sum, entry) => sum + (Number(entry.durationMinutes) || 0), 0);
    const delta = currentMinutes - previousMinutes;

    if (!currentMinutes && !previousMinutes) {
        return {
            content: 'Ainda não há histórico suficiente para eu comparar sua evolução.',
            suggestions: getAssistantDefaultSuggestions(),
            context: { intent: 'trend', period, previous, category: null }
        };
    }

    if (delta === 0) {
        return {
            content: `Seu foco está estável ${getPeriodNarration(period, previous)} em comparação com o recorte anterior: ${formatMinsToHours(currentMinutes)} em ambos os períodos.`,
            suggestions: [
                'Qual categoria recebeu mais foco esta semana?',
                'O que focar agora?',
                'Quais metas bati neste período?'
            ],
            context: { intent: 'trend', period, previous, category: null }
        };
    }

    return {
        content: delta > 0
            ? `Você está melhorando ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(currentMinutes)} agora, contra ${formatMinsToHours(previousMinutes)} no recorte anterior, uma alta de ${formatMinsToHours(delta)}.`
            : `Seu foco caiu ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(currentMinutes)} agora, contra ${formatMinsToHours(previousMinutes)} no recorte anterior, uma queda de ${formatMinsToHours(Math.abs(delta))}.`,
        suggestions: [
            'Qual categoria ficou mais para trás?',
            'O que focar agora?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'trend', period, previous, category: null }
    };
}

function answerSummary(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const totalMinutes = getTotalFocusForPeriod(period, null, previous);
    const topCategory = getHistoryTotalsByCategory(period, previous)[0];
    const overview = getAssistantGoalOverview(period, previous);
    const lines = [
        `Resumo ${getPeriodNarration(period, previous)}:`,
        `• Foco total: ${formatMinsToHours(totalMinutes)}`,
        `• Categoria líder: ${topCategory ? `${topCategory.category} (${formatMinsToHours(topCategory.minutes)})` : 'sem registros'}`,
        `• Metas batidas: ${overview.hitCount}/${overview.activeCount}`,
        `• Próximo melhor passo: ${getFocusNowSuggestion()}`
    ];

    return {
        content: lines.join('\n'),
        actions: [{ type: 'view', value: 'view-stats', label: 'Abrir Estatísticas' }],
        suggestions: [
            'Quais metas estão mais atrasadas?',
            'Como estou em Estudos?',
            'O que focar agora?'
        ],
        context: { intent: 'summary', period, previous, category: topCategory?.category || null }
    };
}

function answerFocusNow() {
    return {
        content: getFocusNowSuggestion(),
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Crie uma meta de 2h por dia para Estudos',
            'Como estou em Trabalho?',
            'Resuma meu desempenho'
        ],
        context: { intent: 'focus_now', period: getAssistantDefaultPeriod(), previous: false, category: null }
    };
}

function answerTasks() {
    return {
        content: getAssistantTaskSummary(),
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: [
            'Qual categoria recebeu mais foco hoje?',
            'O que focar agora?',
            'Crie uma meta de 2h por dia para Estudos'
        ],
        context: { intent: 'tasks', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null }
    };
}

function answerLaggingGoal(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const lagging = getLaggingGoalSummary(period, previous);

    if (!lagging) {
        return {
            content: `Não encontrei metas atrasadas ${getPeriodNarration(period, previous)}. Ou você já bateu tudo, ou ainda não há metas ativas nesse recorte.`,
            suggestions: [
                'Quais metas bati neste período?',
                'O que focar agora?',
                'Quais metas estão ativas?'
            ],
            context: { intent: 'lagging_goal', period, previous, category: null }
        };
    }

    return {
        content: `${lagging.category} é a meta mais atrasada ${getPeriodNarration(period, previous)}. Foram ${formatMinsToHours(lagging.actualMinutes)} realizados de ${formatMinsToHours(lagging.targetMinutes)} planejados, e faltam ${formatMinsToHours(lagging.remainingMinutes)}.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Como estou em ${lagging.category}?`,
            'O que focar agora?',
            'Quais categorias estão sem meta?'
        ],
        context: { intent: 'lagging_goal', period, previous, category: lagging.category }
    };
}

function answerGoalCount() {
    const activeGoals = getActiveGoalsData();
    if (!activeGoals.length) {
        return {
            content: 'Você não tem metas ativas no momento.',
            suggestions: [
                'Crie uma meta de 2h por dia para Estudos',
                'Quais categorias estão sem meta?',
                'O que focar agora?'
            ],
            context: { intent: 'goal_count', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    return {
        content: `Hoje você tem ${activeGoals.length} meta(s) ativa(s) no app.`,
        suggestions: [
            'Quais metas estão ativas?',
            'Quais categorias estão sem meta?',
            'Quais metas bati esta semana?'
        ],
        context: { intent: 'goal_count', period: getAssistantDefaultPeriod(), previous: false, category: null }
    };
}

function answerCategoriesWithoutGoal() {
    const withoutGoals = getCategoriesWithoutGoals();
    if (!withoutGoals.length) {
        return {
            content: 'Todas as categorias principais já têm meta ativa.',
            suggestions: [
                'Quais metas estão ativas?',
                'Quais metas estão mais atrasadas?',
                'O que focar agora?'
            ],
            context: { intent: 'categories_without_goal', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    return {
        content: `As categorias sem meta no momento são: ${withoutGoals.join(', ')}.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Crie uma meta de 1h por dia para ${withoutGoals[0]}`,
            'Quais metas estão ativas?',
            'O que focar agora?'
        ],
        context: { intent: 'categories_without_goal', period: getAssistantDefaultPeriod(), previous: false, category: withoutGoals[0] }
    };
}

function answerTimerControl(text) {
    const normalized = normalizeAssistantText(text);
    const durationMinutes = detectAssistantDurationMinutes(text);
    const category = detectAssistantCategory(text);

    if (includesAny(normalized, ['pausar timer', 'pause o timer', 'pausar foco', 'pare o timer', 'para o timer'])) {
        if (!isTimerRunning) {
            return {
                content: 'O temporizador já está pausado.',
                suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
                context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null }
            };
        }
        switchView('view-home');
        pauseTimer();
        renderProgress();
        renderTasksSidebar();
        syncStateToPip();
        return {
            content: 'Pausei o temporizador atual.',
            suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: category || currentTask?.category || null },
            autoClose: true
        };
    }

    if (includesAny(normalized, ['reinicie o timer', 'resetar timer', 'zerar timer', 'reiniciar foco'])) {
        switchView('view-home');
        resetTimer();
        return {
            content: 'Reiniciei o temporizador da sessão atual.',
            suggestions: ['Inicie o foco', 'O que focar agora?', 'Quanto foquei hoje?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null },
            autoClose: true
        };
    }

    if (includesAny(normalized, ['inicie o foco', 'iniciar foco', 'comece o foco', 'inicie o timer', 'iniciar timer', 'continue o foco'])) {
        if (durationMinutes || category) {
            applyAssistantFreeFocus(durationMinutes, category);
        } else {
            switchView('view-home');
            if (currentMode !== 'focus') {
                setTimerMode('focus');
            }
            if (!isTimerRunning) toggleTimer();
        }
        return {
            content: 'Iniciei o foco para você.',
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['O que focar agora?', 'Quanto foquei hoje?', 'Qual categoria recebeu mais foco esta semana?'],
            context: { intent: 'timer_control', period: getAssistantDefaultPeriod(), previous: false, category: currentTask?.category || null },
            autoClose: true
        };
    }

    return null;
}

function answerPerformanceAssessment(text) {
    const temporal = detectAssistantTemporalContext(text, assistantConversationState ? {
        period: assistantConversationState.period,
        previous: assistantConversationState.previous
    } : null);
    const { period, previous } = temporal;
    const overview = getAssistantGoalOverview(period, previous);
    const totalMinutes = getTotalFocusForPeriod(period, null, previous);

    if (!overview.activeCount) {
        if (!totalMinutes) {
            return {
                content: `Ainda não tenho foco nem metas suficientes ${getPeriodNarration(period, previous)} para dizer se você está indo bem ou mal.`,
                suggestions: ['Quanto foquei hoje?', 'Crie uma meta de 2h por dia para Estudos', 'O que focar agora?'],
                context: { intent: 'performance_assessment', period, previous, category: null }
            };
        }

        return {
            content: `Sem metas ativas eu não cravaria que você está indo mal. O que eu sei é que você registrou ${formatMinsToHours(totalMinutes)} ${getPeriodNarration(period, previous)}. Se quiser, eu posso te ajudar a transformar isso em metas mais claras.`,
            suggestions: ['Crie uma meta de 2h por dia para Estudos', 'Resuma meu desempenho', 'O que focar agora?'],
            context: { intent: 'performance_assessment', period, previous, category: null }
        };
    }

    if (overview.averageProgress >= 100) {
        return {
            content: `Você está indo muito bem ${getPeriodNarration(period, previous)}. Já bateu ${overview.hitCount} de ${overview.activeCount} metas e entregou ${overview.averageProgress}% do planejado.`,
            suggestions: ['Quais metas bati neste período?', 'O que você mudaria nas minhas metas?', 'O que focar agora?'],
            context: { intent: 'performance_assessment', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    if (overview.averageProgress >= 75) {
        return {
            content: `Você está indo bem ${getPeriodNarration(period, previous)}, mas ainda com espaço para consolidar. O plano está em ${overview.averageProgress}% e uma ou duas sessões bem colocadas já podem virar várias metas.`,
            suggestions: ['Qual meta está mais atrasada?', 'O que focar agora?', 'Minha meta de Estudos está realista?'],
            context: { intent: 'performance_assessment', period, previous, category: overview.bestCategory?.category || null }
        };
    }

    return {
        content: `Eu diria que ${getPeriodNarration(period, previous)} você está abaixo do que planejou, mas não "mal". O ponto principal é que o plano está em ${overview.averageProgress}% e a meta mais atrasada merece mais atenção agora.`,
        suggestions: ['Qual meta está mais atrasada?', 'O que focar agora?', 'O que você mudaria nas minhas metas?'],
        context: { intent: 'performance_assessment', period, previous, category: null }
    };
}

function answerGoalRealism(text) {
    const category = detectAssistantCategory(text) || assistantConversationState?.category || null;
    if (!category) {
        return {
            content: 'Consigo avaliar isso, mas preciso da categoria. Exemplo: "Minha meta de Estudos está realista?"',
            suggestions: ['Minha meta de Estudos está realista?', 'Minha meta de Trabalho está muito alta?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const goal = getActiveGoalsData().find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Hoje ${category} não tem meta ativa, então eu não consigo avaliar o realismo dela.`,
            suggestions: [`Crie uma meta de 2h por dia para ${category}`, 'Quais metas estão ativas?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category }
        };
    }

    const realism = assessGoalRealism(goal);
    return {
        content: realism.message,
        suggestions: [
            realism.tone === 'aggressive'
                ? `Ajuste a meta de ${category} para ${Math.max(1, Math.round(getCategoryRecentStats(category, 21).averagePerDay / 60))}h por dia`
                : `Como estou em ${category}?`,
            'O que você mudaria nas minhas metas?',
            'O que focar agora?'
        ],
        context: { intent: 'goal_realism', period: getAssistantDefaultPeriod(), previous: false, category }
    };
}
