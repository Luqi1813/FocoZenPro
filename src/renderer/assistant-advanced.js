function answerGoalAdjustmentAdvice() {
    const goals = getActiveGoalsData();
    if (!goals.length) {
        return {
            content: 'Sem metas ativas eu não tenho o que ajustar ainda. Se quiser, posso te ajudar a montar as primeiras com base no que você já faz.',
            suggestions: ['Crie uma meta de 2h por dia para Estudos', 'Quais categorias estão sem meta?', 'Quanto foquei esta semana?'],
            context: { intent: 'goal_adjustment', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const advice = goals.map(goal => {
        const realism = assessGoalRealism(goal);
        return { goal, realism };
    });

    const aggressive = advice.filter(item => item.realism?.tone === 'aggressive');
    const conservative = advice.filter(item => item.realism?.tone === 'conservative');

    let content = '';
    if (aggressive.length) {
        const first = aggressive[0];
        content += `Eu começaria suavizando ${first.goal.category}. ${first.realism.message}\n`;
    } else if (conservative.length) {
        const first = conservative[0];
        content += `Se fosse para ajustar algo agora, eu subiria um pouco ${first.goal.category}. ${first.realism.message}\n`;
    } else {
        content += 'No geral, suas metas parecem relativamente coerentes com o histórico recente.\n';
    }

    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    if (lagging) {
        content += `Hoje eu também prestaria atenção em ${lagging.category}, porque ela é a que mais está pedindo recuperação neste recorte.`;
    } else {
        content += 'No curto prazo, eu manteria as metas como estão e ajustaria só depois de mais alguns dias de uso.';
    }

    return {
        content,
        suggestions: [
            aggressive.length ? `Minha meta de ${aggressive[0].goal.category} está realista?` : 'Qual meta está mais atrasada?',
            'O que focar agora?',
            'Quais metas bati esta semana?'
        ],
        context: { intent: 'goal_adjustment', period: getAssistantDefaultPeriod(), previous: false, category: aggressive[0]?.goal.category || lagging?.category || null }
    };
}

function answerCategoryChangeAdvice(text) {
    const category = detectAssistantCategory(text) || assistantConversationState?.category || null;
    if (!category) {
        return {
            content: 'Se você me disser a categoria, eu consigo opinar melhor. Exemplo: "Faz sentido eu reduzir Trabalho esta semana?"',
            suggestions: ['Faz sentido eu reduzir Trabalho esta semana?', 'Minha meta de Estudos está realista?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    const goal = getActiveGoalsData().find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Hoje ${category} nem tem meta ativa, então eu só reduziria se ela realmente deixou de ser prioridade nesta semana.`,
            suggestions: [`Crie uma meta de 2h por dia para ${category}`, 'O que focar agora?', 'O que você mudaria nas minhas metas?'],
            context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category }
        };
    }

    const realism = assessGoalRealism(goal);
    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    const isReduceIntent = includesAny(normalizeAssistantText(text), ['reduzir', 'baixar', 'diminuir']);

    let content = '';
    if (isReduceIntent) {
        if (realism.tone === 'aggressive') {
            content = `Sim, faz sentido considerar uma redução em ${category} por enquanto. ${realism.message}`;
        } else {
            content = `Eu só reduziria ${category} se sua prioridade da semana realmente mudou. ${realism.message}`;
        }
    } else {
        content = realism.message;
    }

    if (lagging && normalizeAssistantText(lagging.category) !== normalizeAssistantText(category)) {
        content += ` Hoje o maior atraso está em ${lagging.category}, então eu equilibraria isso antes de mexer muito em ${category}.`;
    }

    return {
        content,
        suggestions: [
            `Como estou em ${category}?`,
            'O que você mudaria nas minhas metas?',
            'O que focar agora?'
        ],
        context: { intent: 'category_change_advice', period: getAssistantDefaultPeriod(), previous: false, category }
    };
}

function buildAssistantTaskPrompt(missing, draft) {
    const parts = [];
    if (missing.includes('nome')) parts.push('o nome');
    if (missing.includes('categoria')) parts.push('a categoria');
    if (missing.includes('duracao')) parts.push('a dura\u00e7\u00e3o');

    const collected = [];
    if (draft?.name) collected.push(`nome: ${draft.name}`);
    if (draft?.category) collected.push(`categoria: ${draft.category}`);
    if (draft?.durationMinutes) collected.push(`dura\u00e7\u00e3o: ${draft.durationMinutes} min`);

    const collectedText = collected.length ? ` At\u00e9 agora eu peguei ${collected.join(', ')}.` : '';
    return `Consigo montar essa tarefa, mas ainda preciso de ${parts.join(' e ')}.${collectedText}`;
}

function answerTaskCreateOrStart(text) {
    const baseDraft = assistantConversationState?.intent === 'task_creation_pending'
        ? assistantConversationState.taskDraft
        : null;
    const draft = extractAssistantTaskDraft(text, baseDraft);
    const normalized = normalizeAssistantText(text);

    if (draft.existingTask && !draft.durationMinutes && !draft.category && (!draft.name || normalizeAssistantText(draft.name) === normalizeAssistantText(draft.existingTask.name))) {
        switchView('view-home');
        startTask(draft.existingTask.id);
        return {
            content: `Feito. Iniciei a tarefa "${draft.existingTask.name}" e te levei para a Home para acompanhar o timer.`,
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['Pause o timer', 'Quanto foquei hoje?', 'O que focar agora?'],
            autoClose: true,
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: draft.existingTask.category || null }
        };
    }

    const missing = getAssistantMissingTaskFields(draft);
    const askedOnlyToStartTask = includesAny(normalized, ['iniciar tarefa', 'inicie a tarefa', 'comecar tarefa', 'comece a tarefa']) && missing.length > 0;

    if (missing.length) {
        return {
            content: buildAssistantTaskPrompt(missing, draft),
            suggestions: [
                'Tarefa revisao de contratos em Trabalho por 45 minutos',
                'Matematica financeira em Estudos por 20 minutos',
                'Escreva proposta em Trabalho por 1 hora'
            ],
            context: {
                intent: 'task_creation_pending',
                period: getAssistantDefaultPeriod(),
                previous: false,
                category: draft.category || null,
                taskDraft: draft,
                askedOnlyToStartTask
            }
        };
    }

    const createdTask = createTaskFromAssistant(draft, true);
    switchView('view-home');
    return {
        content: `Pronto. Criei e iniciei a tarefa "${createdTask.name}" em ${createdTask.category} com ${createdTask.estimatedMinutes} minuto(s).`,
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: ['Pause o timer', 'Quanto foquei hoje?', `Como estou em ${createdTask.category}?`],
        autoClose: true,
        context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: createdTask.category || null }
    };
}

function answerStartTask(text) {
    const task = findAssistantTaskByText(text);

    if (!tasks.length) {
        return {
            content: 'Você ainda não tem tarefas criadas. Se quiser, primeiro crie uma tarefa e depois eu consigo iniciar por aqui.',
            actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
            suggestions: ['Nova tarefa', 'Crie uma meta de 2h por dia para Estudos', 'O que focar agora?'],
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (!task) {
        const openTasks = tasks.filter(item => !item.completed).slice(0, 3).map(item => item.name);
        return {
            content: openTasks.length
                ? `Não consegui identificar qual tarefa você quer iniciar. Tente citar o nome dela, por exemplo: "iniciar tarefa ${openTasks[0]}".`
                : 'No momento não encontrei tarefas em aberto para iniciar.',
            suggestions: openTasks.length
                ? openTasks.map(name => `Iniciar tarefa ${name}`)
                : ['Abrir Home', 'Quanto foquei hoje?', 'O que focar agora?'],
            context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    switchView('view-home');
    startTask(task.id);

    return {
        content: `Feito. Iniciei a tarefa "${task.name}" e te levei para a Home para você já acompanhar o timer.`,
        actions: [{ type: 'view', value: 'view-home', label: 'Abrir Home' }],
        suggestions: ['Pause o timer', 'Quanto foquei hoje?', 'O que focar agora?'],
        autoClose: true,
        context: { intent: 'start_task', period: getAssistantDefaultPeriod(), previous: false, category: task.category || null }
    };
}

function saveGoalFromAssistant(text) {
    const category = detectAssistantCategory(text);
    const dailyMinutes = detectAssistantDurationMinutes(text);
    const schedule = detectAssistantSchedule(text);

    if (!category && !dailyMinutes) {
        return {
            content: 'Eu consigo criar a meta, mas preciso de categoria e duração. Exemplo: "Crie uma meta de 2h por dia para Estudos em dias úteis."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    if (!category) {
        return {
            content: 'Me diga a categoria da meta. Exemplo: "Defina 2h por dia para Trabalho."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    if (!dailyMinutes) {
        return {
            content: `Entendi a categoria ${category}, mas ainda preciso da duração. Exemplo: "Ajuste ${category} para 1h30 por dia."`,
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    const existingGoal = focusGoals.find(goal => normalizeAssistantText(goal.category) === normalizeAssistantText(category));
    const result = saveGoalEntry({
        goalId: existingGoal?.id || null,
        category,
        dailyMinutes,
        schedule: schedule || existingGoal?.schedule || 'weekdays'
    });

    if (!result.ok) {
        return {
            content: result.message || 'Não consegui salvar essa meta.',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    resetGoalForm();
    renderGoalsList();
    renderStatsGoalsSummary(window._statsPeriod || 'day');
    window.compileGoalsData?.();

    const scheduleLabel = (schedule || existingGoal?.schedule || 'weekdays') === 'everyday' ? 'semana inteira' : 'dias úteis';
    return {
        content: `${existingGoal ? 'Meta atualizada' : 'Meta criada'}: ${category} com ${formatMinsToHours(dailyMinutes)} por dia (${scheduleLabel}).`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            `Como estou em ${category}?`,
            'Quais metas bati esta semana?',
            'O que focar agora?'
        ]
    };
}

function removeGoalFromAssistant(text) {
    const category = detectAssistantCategory(text);
    if (!category) {
        return {
            content: 'Qual meta você quer remover? Me diga a categoria. Exemplo: "Remova a meta de Leitura."',
            suggestions: getAssistantDefaultSuggestions('view-goals')
        };
    }

    const goal = focusGoals.find(item => normalizeAssistantText(item.category) === normalizeAssistantText(category));
    if (!goal) {
        return {
            content: `Não encontrei uma meta ativa para ${category}.`,
            suggestions: [
                'Quais metas estão ativas?',
                `Crie uma meta de 1h por dia para ${category}`,
                'O que focar agora?'
            ]
        };
    }

    focusGoals = focusGoals.filter(item => item.id !== goal.id);
    saveFocusGoals();
    if (editingGoalId === goal.id) resetGoalForm();
    renderStatsGoalsSummary(window._statsPeriod || 'day');
    window.compileGoalsData?.();

    return {
        content: `Pronto. A meta de ${category} foi removida.`,
        actions: [{ type: 'view', value: 'view-goals', label: 'Abrir Metas' }],
        suggestions: [
            'Quais metas estão ativas?',
            'Crie uma meta de 2h por dia para Estudos',
            'Resuma meu desempenho'
        ]
    };
}

function answerAssistantHelp() {
    return {
        content: [
            'Pode falar comigo como falaria com outra pessoa.',
            'Eu consigo, por exemplo:',
            '• criar, ajustar e remover metas',
            '• responder sobre foco hoje, semana e mês',
            '• dizer qual categoria recebeu mais atenção',
            '• comparar planejado e realizado',
            '• sugerir no que vale focar agora'
        ].join('\n'),
        suggestions: getAssistantDefaultSuggestions()
    };
}

function answerBroaderGuidance(text) {
    const normalized = normalizeAssistantText(text);
    const overview = getAssistantGoalOverview(getAssistantDefaultPeriod(), false);
    const lagging = getLaggingGoalSummary(getAssistantDefaultPeriod(), false);
    const currentSuggestion = getFocusNowSuggestion();

    if (includesAny(normalized, ['oq vc pode fazer', 'o que vc pode fazer', 'o que voce pode fazer', 'oq voce pode fazer'])) {
        return answerAssistantHelp();
    }

    if (includesAny(normalized, ['estou perdido', 'to perdido', 'nao sei por onde comecar', 'nao sei o que fazer', 'estou sobrecarregado', 'to sobrecarregado'])) {
        return {
            content: `Eu iria simplificar o proximo passo. ${currentSuggestion}`,
            suggestions: ['O que focar agora?', 'Resuma meu desempenho', 'Quais metas estao mais atrasadas?'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || null }
        };
    }

    if (includesAny(normalized, ['como posso melhorar', 'como melhorar', 'alguma sugestao', 'alguma dica', 'o que voce recomenda', 'qual seria o melhor plano'])) {
        const advice = lagging
            ? `Eu atacaria primeiro ${lagging.category}, porque faltam ${formatMinsToHours(lagging.remainingMinutes)} para fechar essa meta.`
            : currentSuggestion;
        return {
            content: `${advice} Depois eu revisaria se suas metas estao proporcionais ao seu ritmo recente.`,
            suggestions: ['Qual meta esta mais atrasada?', 'Minha meta de Estudos esta realista?', 'O que focar agora?'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || overview.bestCategory?.category || null }
        };
    }

    if (includesAny(normalized, ['me ajuda a me organizar', 'me ajuda a organizar', 'como me organizo', 'como organizar meu foco', 'como organizar minha semana'])) {
        return {
            content: `Eu faria assim: primeiro olho o que esta atrasado, depois priorizo uma categoria por vez e fecho blocos curtos. ${currentSuggestion}`,
            suggestions: ['O que focar agora?', 'Quais metas estao mais atrasadas?', 'Resuma meu desempenho'],
            context: { intent: 'broader_guidance', period: getAssistantDefaultPeriod(), previous: false, category: lagging?.category || null }
        };
    }

    return null;
}

function buildAssistantReply(text) {
    const normalized = normalizeAssistantText(text);
    const category = detectAssistantCategory(text);
    const durationMinutes = detectAssistantDurationMinutes(text);
    const defaultPeriod = getAssistantDefaultPeriod();
    const isTaskFollowUp = assistantConversationState?.intent === 'task_creation_pending' && (
        !!category ||
        !!durationMinutes ||
        includesAny(normalized, ['tarefa', 'categoria', 'minuto', 'minutos', 'hora', 'horas']) ||
        normalized.split(/\s+/).filter(Boolean).length <= 6
    );

    if (!normalized) {
        return {
            content: 'Pode mandar sua pergunta ou comando por aqui.',
            suggestions: getAssistantDefaultSuggestions()
        };
    }

    if (hasWholeToken(normalized, ['oi', 'ola']) || includesAny(normalized, ['ajuda', 'o que voce faz', 'oq voce faz', 'o que vc pode fazer', 'oq vc pode fazer', 'como voce pode ajudar', 'como vc pode ajudar', 'voce consegue', 'vc consegue'])) {
        return answerAssistantHelp();
    }

    const broaderGuidance = answerBroaderGuidance(text);
    if (broaderGuidance) return broaderGuidance;

    if (includesAny(normalized, ['abrir metas', 'va para metas', 'ir para metas'])) {
        switchView('view-goals');
        return {
            content: 'Abri a tela de Metas para você.',
            actions: [{ type: 'view', value: 'view-goals', label: 'Metas' }],
            suggestions: getAssistantDefaultSuggestions('view-goals'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['abrir estatisticas', 'va para estatisticas', 'ir para estatisticas'])) {
        switchView('view-stats');
        return {
            content: 'Abri a tela de Estatísticas para você.',
            actions: [{ type: 'view', value: 'view-stats', label: 'Estatísticas' }],
            suggestions: getAssistantDefaultSuggestions('view-stats'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['abrir home', 'ir para home', 'voltar para home'])) {
        switchView('view-home');
        return {
            content: 'Voltei para a Home.',
            actions: [{ type: 'view', value: 'view-home', label: 'Home' }],
            suggestions: getAssistantDefaultSuggestions('view-home'),
            autoClose: true,
            context: { intent: 'navigation', period: getAssistantDefaultPeriod(), previous: false, category: null }
        };
    }

    if (includesAny(normalized, ['quais metas', 'metas ativas', 'listar metas']) && !includesAny(normalized, ['bati', 'batidas'])) return answerGoalList();

    if (
        includesAny(normalized, [
            'apague todas minhas metas',
            'apague todas as metas',
            'exclua todas as metas',
            'remova todas as metas',
            'delete todas as metas',
            'limpe minhas metas',
            'apagar minhas metas',
            'apagar todas minhas metas',
            'apagar todas as metas',
            'remover minhas metas',
            'excluir minhas metas',
            'deletar minhas metas'
        ]) ||
        (includesAny(normalized, ['apagar', 'remover', 'excluir', 'deletar', 'limpar']) && includesAny(normalized, ['metas']) && !category)
    ) {
        return removeAllGoalsFromAssistant();
    }

    if (includesAny(normalized, ['remova a meta', 'remove a meta', 'remover meta', 'apague a meta', 'exclua a meta', 'deleta a meta', 'tira a meta'])) return removeGoalFromAssistant(text);

    const looksLikeGoalCommand =
        durationMinutes &&
        category &&
        includesAny(normalized, ['meta', 'crie', 'criar', 'ajuste', 'ajustar', 'defina', 'definir', 'mude', 'altere', 'quero', 'planeje']);

    if (looksLikeGoalCommand) return saveGoalFromAssistant(text);

    if (includesAny(normalized, ['pausar timer', 'pause o timer', 'pausar foco', 'pare o timer', 'para o timer', 'reinicie o timer', 'resetar timer', 'zerar timer', 'reiniciar foco', 'inicie o foco', 'iniciar foco', 'comece o foco', 'inicie o timer', 'iniciar timer', 'continue o foco'])) {
        const timerReply = answerTimerControl(text);
        if (timerReply) return timerReply;
    }

    if (isTaskFollowUp) return answerTaskCreateOrStart(text);

    if (includesAny(normalized, ['o que focar agora', 'oque focar agora', 'onde focar agora', 'qual categoria focar', 'o que priorizar'])) return answerFocusNow();

    if (
        includesAny(normalized, ['iniciar tarefa', 'inicie a tarefa', 'comecar tarefa', 'comece a tarefa', 'abrir tarefa', 'abra a tarefa', 'criar tarefa', 'crie uma tarefa', 'nova tarefa', 'adicionar tarefa']) ||
        ((includesAny(normalized, ['iniciar', 'inicie', 'comecar', 'comece', 'abrir', 'abra']) && !!findAssistantTaskByText(text))) ||
        (includesAny(normalized, ['tarefa']) && (!!durationMinutes || !!category))
    ) {
        return answerTaskCreateOrStart(text);
    }

    if (includesAny(normalized, ['meta mais atrasada', 'metas mais atrasadas', 'qual meta esta mais atrasada', 'qual meta está mais atrasada', 'qual categoria esta mais atrasada', 'qual categoria está mais atrasada', 'quanto falta para a meta'])) {
        return answerLaggingGoal(text);
    }

    if (includesAny(normalized, ['quais metas bati', 'bati alguma meta', 'metas batidas'])) return answerGoalHits(text);

    if (includesAny(normalized, ['estou indo mal', 'estou indo bem', 'to indo mal', 'to indo bem', 'como eu estou indo', 'como estou indo', 'estou bem', 'estou mal'])) return answerPerformanceAssessment(text);

    if (includesAny(normalized, ['meta realista', 'esta realista', 'está realista', 'meta muito alta', 'meta muito baixa', 'faz sentido essa meta'])) {
        return answerGoalRealism(text);
    }

    if (includesAny(normalized, ['o que voce mudaria nas minhas metas', 'o que você mudaria nas minhas metas', 'o que mudaria nas minhas metas', 'como voce ajustaria minhas metas', 'como você ajustaria minhas metas'])) {
        return answerGoalAdjustmentAdvice();
    }

    if (includesAny(normalized, ['faz sentido eu reduzir', 'vale a pena reduzir', 'devo reduzir', 'devo baixar', 'devo diminuir'])) return answerCategoryChangeAdvice(text);

    if (includesAny(normalized, ['quantas metas', 'numero de metas', 'número de metas', 'quantas metas tenho'])) {
        return answerGoalCount();
    }

    if (includesAny(normalized, ['categorias sem meta', 'quais categorias nao tem meta', 'quais categorias não tem meta', 'o que esta sem meta', 'o que está sem meta'])) {
        return answerCategoriesWithoutGoal();
    }

    if (includesAny(normalized, ['como estou em', 'status de', 'andamento de']) && category) return answerCategoryStatus(text);

    if (includesAny(normalized, ['qual categoria', 'categoria que mais', 'mais foco', 'lider']) && includesAny(normalized, ['foco', 'foquei', 'tempo'])) return answerTopCategory(text);

    if (includesAny(normalized, ['quantos pomodoros', 'quantas sessoes'])) {
        return answerPomodoros(text);
    }

    if (includesAny(normalized, ['planejado', 'realizado', 'quanto falta para as metas', 'como esta meu plano'])) return answerPlannedVsActual(text);

    if (includesAny(normalized, ['estou melhorando', 'estou piorando', 'compare', 'comparado', 'evoluindo', 'evolucao'])) return answerTrend(text);

    if (includesAny(normalized, ['resumo', 'resuma', 'meu desempenho', 'como eu fui'])) return answerSummary(text);

    if (includesAny(normalized, ['como foi meu foco', 'como esta meu foco', 'como tá meu foco', 'como ta meu foco'])) {
        return answerFocusTotal(text);
    }

    if (includesAny(normalized, ['tarefas', 'tarefa atual', 'o que tenho para fazer'])) return answerTasks();

    if (includesAny(normalized, ['quanto foquei', 'quanto tempo', 'quanto entreguei', 'quanto de foco'])) return answerFocusTotal(text);

    if (category) return answerCategoryStatus(text);

    if (includesAny(normalized, ['foco', 'historico', 'histórico', 'desempenho'])) {
        return answerSummary(text);
    }

    if (includesAny(normalized, ['meta', 'metas', 'planejamento', 'planejado'])) {
        return answerGoalAdjustmentAdvice();
    }

    return {
        content: 'Ainda não peguei exatamente o que você quis dizer, mas sigo com você nessa. Se quiser, reformula do seu jeito mesmo e eu tento de novo. Posso ajudar com metas, histórico, foco, categorias, tarefas e decisões de prioridade.',
        suggestions: getAssistantDefaultSuggestions()
    };
}

normalizeAssistantText = function(value = '') {
    return assistantCore.normalizeText(value);
};

detectAssistantTemporalContext = function(text, fallback = null) {
    return assistantCore.detectTemporalContext(
        text,
        fallback || { period: getAssistantDefaultPeriod(), previous: false }
    );
};

detectAssistantCategory = function(text) {
    return assistantCore.detectCategory(text, {
        defaultCategories,
        userCategories,
        focusGoals
    });
};

detectAssistantDurationMinutes = function(text) {
    return assistantCore.detectDurationMinutes(text, {
        pomodoroMinutes: POMODORO_MINUTES
    });
};

detectAssistantSchedule = function(text) {
    return assistantCore.detectSchedule(text);
};

extractAssistantTaskDraft = function(text, baseDraft = null) {
    return assistantCore.extractTaskDraft(text, baseDraft, {
        defaultCategories,
        userCategories,
        focusGoals,
        pomodoroMinutes: POMODORO_MINUTES,
        findExistingTask: findAssistantTaskByText
    });
};

getAssistantMissingTaskFields = function(draft) {
    return assistantCore.getMissingTaskFields(draft);
};

expandAssistantFollowUp = function(text) {
    return assistantCore.expandFollowUp(text, {
        ...(assistantConversationState || {}),
        defaultPeriod: getAssistantDefaultPeriod(),
        defaultCategories,
        userCategories,
        focusGoals
    });
};

buildAssistantReply = function(text) {
    return assistantCore.buildReply(text, {
        answerers: {
            assistantHelp: () => answerAssistantHelp(),
            broaderGuidance: (input) => answerBroaderGuidance(input),
            focusNow: () => answerFocusNow(),
            goalList: () => answerGoalList(),
            removeAllGoals: () => removeAllGoalsFromAssistant(),
            removeGoal: (input) => removeGoalFromAssistant(input),
            saveGoal: (input) => saveGoalFromAssistant(input),
            timerControl: (input) => answerTimerControl(input),
            taskCreateOrStart: (input) => answerTaskCreateOrStart(input),
            focusTotal: (input) => answerFocusTotal(input),
            topCategory: (input) => answerTopCategory(input),
            goalHits: (input) => answerGoalHits(input),
            categoryStatus: (input) => answerCategoryStatus(input),
            plannedVsActual: (input) => answerPlannedVsActual(input),
            trend: (input) => answerTrend(input),
            summary: (input) => answerSummary(input),
            laggingGoal: (input) => answerLaggingGoal(input),
            pomodoros: (input) => answerPomodoros(input),
            performanceAssessment: (input) => answerPerformanceAssessment(input),
            goalRealism: (input) => answerGoalRealism(input),
            goalAdjustmentAdvice: () => answerGoalAdjustmentAdvice(),
            categoryChangeAdvice: (input) => answerCategoryChangeAdvice(input),
            goalCount: () => answerGoalCount(),
            categoriesWithoutGoal: () => answerCategoriesWithoutGoal(),
            tasks: () => answerTasks()
        },
        effects: {
            switchView
        },
        conversationState: assistantConversationState,
        defaultCategories,
        userCategories,
        focusGoals,
        pomodoroMinutes: POMODORO_MINUTES,
        findTaskByText: findAssistantTaskByText,
        getDefaultSuggestions: (viewId) => getAssistantDefaultSuggestions(viewId),
        getDefaultPeriod: () => getAssistantDefaultPeriod()
    });
};

// TEST FUNCTION - Call from DevTools console: testChangelog()