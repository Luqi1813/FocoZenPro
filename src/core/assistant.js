(() => {
    const normalizeText = (value = '') => String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const includesAny = (text, terms = []) => terms.some((term) => text.includes(term));

    const hasWholeToken = (text, terms = []) => {
        const tokens = new Set(String(text || '').split(' ').filter(Boolean));
        return terms.some((term) => tokens.has(term));
    };

    const detectTemporalContext = (text, fallback = null) => {
        const normalized = normalizeText(text);

        if (includesAny(normalized, ['ontem'])) return { period: 'day', previous: true };
        if (includesAny(normalized, ['semana passada', 'na semana passada'])) return { period: 'week', previous: true };
        if (includesAny(normalized, ['mes passado', 'no mes passado'])) return { period: 'month', previous: true };

        if (includesAny(normalized, ['mes', 'mensal', 'ultimos 30 dias', 'ultimo mes'])) return { period: 'month', previous: false };
        if (includesAny(normalized, ['semana', 'semanal', 'ultimos 7 dias'])) return { period: 'week', previous: false };
        if (includesAny(normalized, ['hoje', 'agora', 'dia', 'diario'])) return { period: 'day', previous: false };

        return fallback || { period: 'day', previous: false };
    };

    const collectCategories = (context = {}) => {
        const merged = [
            ...(context.defaultCategories || []),
            ...(context.userCategories || []),
            ...((context.focusGoals || []).map((goal) => ({ name: goal.category })))
        ];
        const seen = new Set();

        return merged
            .map((item) => item?.name)
            .filter(Boolean)
            .filter((name) => {
                const key = normalizeText(name);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    };

    const detectCategory = (text, context = {}) => {
        const normalized = normalizeText(text);
        const categories = collectCategories(context).slice().sort((a, b) => b.length - a.length);
        const aliases = {
            trabalho: 'Trabalho',
            estudo: 'Estudos',
            estudos: 'Estudos',
            estudar: 'Estudos',
            projeto: 'Projetos',
            projetos: 'Projetos',
            leitura: 'Leitura',
            ler: 'Leitura',
            livro: 'Leitura',
            hobby: 'Hobbies',
            hobbies: 'Hobbies',
            lazer: 'Hobbies',
            livre: 'Livre'
        };

        for (const category of categories) {
            const key = normalizeText(category);
            if (normalized.includes(key)) return category;
        }

        for (const [alias, category] of Object.entries(aliases)) {
            if (normalized.includes(alias)) {
                const matched = categories.find((item) => normalizeText(item) === normalizeText(category));
                return matched || category;
            }
        }

        return null;
    };

    const detectDurationMinutes = (text, options = {}) => {
        const normalized = normalizeText(text).replace(/,/g, '.');
        let minutes = 0;
        let matched = false;

        const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*h(?:ora|oras)?/);
        if (hourMatch) {
            minutes += Math.round(parseFloat(hourMatch[1]) * 60);
            matched = true;
        }

        const minuteMatch = normalized.match(/(\d+)\s*min(?:uto|utos)?/);
        if (minuteMatch) {
            minutes += parseInt(minuteMatch[1], 10);
            matched = true;
        }

        if (!matched) {
            const pomodoroMatch = normalized.match(/(\d+)\s*(pomodoro|pomodoros|bloco|blocos)/);
            if (pomodoroMatch) {
                minutes += parseInt(pomodoroMatch[1], 10) * (options.pomodoroMinutes || 25);
                matched = true;
            }
        }

        return matched && minutes > 0 ? minutes : null;
    };

    const detectSchedule = (text) => {
        const normalized = normalizeText(text);
        if (includesAny(normalized, ['todo dia', 'todos os dias', 'semana inteira', 'todos os dias da semana'])) return 'everyday';
        if (includesAny(normalized, ['dias uteis', 'segunda a sexta', 'seg a sex', 'dias da semana'])) return 'weekdays';
        return null;
    };

    const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const prettifyTaskName = (name) => {
        const cleaned = String(name || '')
            .replace(/\s+/g, ' ')
            .replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '')
            .trim();

        if (!cleaned) return '';
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    };

    const extractTaskName = (text, category = null) => {
        let normalized = normalizeText(text)
            .replace(/^(me ajuda a|me ajude a|pode|por favor)\s+/, '')
            .replace(/^(pode ser pra|pode ser para|ser pra|ser para)\s+/, '')
            .replace(/^(iniciar|inicie|comecar|comece|criar|crie|adicionar|adicione|abrir|abra|fazer|faca|montar|monte)\s+(uma\s+|nova\s+|uma\s+nova\s+)?tarefa\b/, '')
            .replace(/\btarefa\b/, '')
            .trim();

        normalized = normalized
            .replace(/\bde\s+\d+(?:\.\d+)?\s*h(?:ora|oras)?\b/g, ' ')
            .replace(/\b\d+(?:\.\d+)?\s*h(?:ora|oras)?\b/g, ' ')
            .replace(/\bde\s+\d+\s*min(?:uto|utos)?\b/g, ' ')
            .replace(/\b\d+\s*min(?:uto|utos)?\b/g, ' ')
            .replace(/\b\d+\s*(pomodoro|pomodoros|bloco|blocos)\b/g, ' ');

        if (category) {
            const categoryNorm = normalizeText(category);
            const categoryPattern = escapeRegex(categoryNorm);
            normalized = normalized
                .replace(new RegExp(`\\bna categoria\\s+${categoryPattern}\\b`, 'g'), ' ')
                .replace(new RegExp(`\\bcategoria\\s+${categoryPattern}\\b`, 'g'), ' ')
                .replace(new RegExp(`\\bem\\s+${categoryPattern}\\b`, 'g'), ' ');
        }

        normalized = normalized
            .replace(/\b(chamada|chamado|nome|com nome)\b/g, ' ')
            .replace(/^(pra|para)\s+/, '')
            .replace(/^(de|da|do|para|pra|em|na|no)\s+/, '')
            .replace(/\s+/g, ' ')
            .trim();

        return prettifyTaskName(normalized);
    };

    const extractTaskDraft = (text, baseDraft = null, context = {}) => {
        const seed = baseDraft ? { ...baseDraft } : {};
        const category = detectCategory(text, context) || seed.category || null;
        const durationMinutes = detectDurationMinutes(text, { pomodoroMinutes: context.pomodoroMinutes || 25 });
        const existingTask = context.findExistingTask ? context.findExistingTask(text) : null;

        let name = extractTaskName(text, category);
        if (!name && seed.name) name = seed.name;

        return {
            name: name || '',
            category,
            durationMinutes: durationMinutes || seed.durationMinutes || null,
            existingTask: existingTask || seed.existingTask || null
        };
    };

    const getMissingTaskFields = (draft) => {
        const missing = [];
        if (!draft?.name) missing.push('nome');
        if (!draft?.category) missing.push('categoria');
        if (!draft?.durationMinutes) missing.push('duracao');
        return missing;
    };

    const expandFollowUp = (text, conversationState = null) => {
        const normalized = normalizeText(text);
        if (!conversationState) return text;

        const looksLikeFollowUp = normalized.startsWith('e ') ||
            normalized.startsWith('e em ') ||
            normalized.startsWith('e no ') ||
            normalized.startsWith('e na ') ||
            normalized.startsWith('e pra ') ||
            normalized.startsWith('e para ');

        if (!looksLikeFollowUp) return text;

        const temporal = detectTemporalContext(text, {
            period: conversationState.period || conversationState.defaultPeriod || 'day',
            previous: conversationState.previous || false
        });

        const category = detectCategory(text, {
            defaultCategories: conversationState.defaultCategories,
            userCategories: conversationState.userCategories,
            focusGoals: conversationState.focusGoals
        }) || conversationState.category || null;
        let intent = conversationState.intent || 'summary';

        if (intent === 'top_category' && category) intent = 'focus_total';
        if (category && ['summary', 'planned_vs_actual', 'goal_hits', 'lagging_goal', 'trend'].includes(intent)) {
            intent = 'category_status';
        }

        const phrase = temporal.previous
            ? ({
                day: 'ontem',
                week: 'na semana passada',
                month: 'no m\\u00eas passado'
            }[temporal.period] || 'no per\\u00edodo anterior')
            : ({
                day: 'hoje',
                week: 'esta semana',
                month: 'neste m\\u00eas'
            }[temporal.period] || 'neste per\\u00edodo');

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
    };

    const buildReply = (input, context = {}) => {
        const text = String(input || '');
        const normalized = normalizeText(text);
        const answerers = context.answerers || {};
        const effects = context.effects || {};
        const conversationState = context.conversationState || null;
        const categoryContext = {
            defaultCategories: context.defaultCategories,
            userCategories: context.userCategories,
            focusGoals: context.focusGoals
        };
        const getDefaultSuggestions = context.getDefaultSuggestions || (() => []);
        const defaultPeriod = context.getDefaultPeriod?.() || 'day';
        const detectedCategory = detectCategory(text, categoryContext);
        const detectedDuration = detectDurationMinutes(text, { pomodoroMinutes: context.pomodoroMinutes || 25 });
        const isTaskFollowUp = conversationState?.intent === 'task_creation_pending' && (
            !!detectedCategory ||
            !!detectedDuration ||
            includesAny(normalized, ['tarefa', 'categoria', 'minuto', 'minutos', 'hora', 'horas']) ||
            normalized.split(/\s+/).filter(Boolean).length <= 6
        );

        if (!normalized) {
            return {
                content: 'Pode mandar sua pergunta ou comando por aqui.',
                suggestions: getDefaultSuggestions()
            };
        }

        if (hasWholeToken(normalized, ['oi', 'ola']) || includesAny(normalized, ['ajuda', 'o que voce faz', 'oq voce faz', 'o que vc pode fazer', 'oq vc pode fazer', 'como voce pode ajudar', 'como vc pode ajudar', 'voce consegue', 'vc consegue'])) {
            return answerers.assistantHelp?.(text);
        }

        const broaderGuidance = answerers.broaderGuidance?.(text);
        if (broaderGuidance) return broaderGuidance;

        if (includesAny(normalized, ['abrir metas', 'va para metas', 'ir para metas'])) {
            effects.switchView?.('view-goals');
            return {
                content: 'Abri a tela de Metas para voc\\u00ea.',
                actions: [{ type: 'view', value: 'view-goals', label: 'Metas' }],
                suggestions: getDefaultSuggestions('view-goals'),
                autoClose: true,
                context: { intent: 'navigation', period: defaultPeriod, previous: false, category: null }
            };
        }

        if (includesAny(normalized, ['abrir estatisticas', 'va para estatisticas', 'ir para estatisticas'])) {
            effects.switchView?.('view-stats');
            return {
                content: 'Abri a tela de Estat\\u00edsticas para voc\\u00ea.',
                actions: [{ type: 'view', value: 'view-stats', label: 'Estat\\u00edsticas' }],
                suggestions: getDefaultSuggestions('view-stats'),
                autoClose: true,
                context: { intent: 'navigation', period: defaultPeriod, previous: false, category: null }
            };
        }

        if (includesAny(normalized, ['abrir home', 'ir para home', 'voltar para home'])) {
            effects.switchView?.('view-home');
            return {
                content: 'Voltei para a Home.',
                actions: [{ type: 'view', value: 'view-home', label: 'Home' }],
                suggestions: getDefaultSuggestions('view-home'),
                autoClose: true,
                context: { intent: 'navigation', period: defaultPeriod, previous: false, category: null }
            };
        }

        if (includesAny(normalized, ['quais metas', 'metas ativas', 'listar metas']) && !includesAny(normalized, ['bati', 'batidas'])) {
            return answerers.goalList?.(text);
        }

        if (
            includesAny(normalized, [
                'apague todas minhas metas', 'apague todas as metas', 'exclua todas as metas', 'remova todas as metas',
                'delete todas as metas', 'limpe minhas metas', 'apagar minhas metas', 'apagar todas minhas metas',
                'apagar todas as metas', 'remover minhas metas', 'excluir minhas metas', 'deletar minhas metas'
            ]) ||
            (includesAny(normalized, ['apagar', 'remover', 'excluir', 'deletar', 'limpar']) && includesAny(normalized, ['metas']) && !detectedCategory)
        ) {
            return answerers.removeAllGoals?.(text);
        }

        if (includesAny(normalized, ['remova a meta', 'remove a meta', 'remover meta', 'apague a meta', 'exclua a meta', 'deleta a meta', 'tira a meta'])) {
            return answerers.removeGoal?.(text);
        }

        const looksLikeGoalCommand = detectedDuration &&
            detectedCategory &&
            includesAny(normalized, ['meta', 'crie', 'criar', 'ajuste', 'ajustar', 'defina', 'definir', 'mude', 'altere', 'quero', 'planeje']);

        if (looksLikeGoalCommand) {
            return answerers.saveGoal?.(text);
        }

        if (includesAny(normalized, ['pausar timer', 'pause o timer', 'pausar foco', 'pare o timer', 'para o timer', 'reinicie o timer', 'resetar timer', 'zerar timer', 'reiniciar foco', 'inicie o foco', 'iniciar foco', 'comece o foco', 'inicie o timer', 'iniciar timer', 'continue o foco'])) {
            const timerReply = answerers.timerControl?.(text);
            if (timerReply) return timerReply;
        }

        if (isTaskFollowUp) return answerers.taskCreateOrStart?.(text);

        if (includesAny(normalized, ['o que focar agora', 'oque focar agora', 'onde focar agora', 'qual categoria focar', 'o que priorizar'])) {
            return answerers.focusNow?.(text);
        }

        if (
            includesAny(normalized, ['iniciar tarefa', 'inicie a tarefa', 'comecar tarefa', 'comece a tarefa', 'abrir tarefa', 'abra a tarefa', 'criar tarefa', 'crie uma tarefa', 'nova tarefa', 'adicionar tarefa']) ||
            ((includesAny(normalized, ['iniciar', 'inicie', 'comecar', 'comece', 'abrir', 'abra']) && !!context.findTaskByText?.(text))) ||
            (includesAny(normalized, ['tarefa']) && (!!detectedDuration || !!detectedCategory))
        ) {
            return answerers.taskCreateOrStart?.(text);
        }

        if (includesAny(normalized, ['meta mais atrasada', 'metas mais atrasadas', 'qual meta esta mais atrasada', 'qual categoria esta mais atrasada', 'quanto falta para a meta'])) {
            return answerers.laggingGoal?.(text);
        }

        if (includesAny(normalized, ['quais metas bati', 'bati alguma meta', 'metas batidas'])) return answerers.goalHits?.(text);
        if (includesAny(normalized, ['estou indo mal', 'estou indo bem', 'to indo mal', 'to indo bem', 'como eu estou indo', 'como estou indo', 'estou bem', 'estou mal'])) return answerers.performanceAssessment?.(text);
        if (includesAny(normalized, ['meta realista', 'esta realista', 'meta muito alta', 'meta muito baixa', 'faz sentido essa meta'])) return answerers.goalRealism?.(text);
        if (includesAny(normalized, ['o que voce mudaria nas minhas metas', 'o que mudaria nas minhas metas', 'como voce ajustaria minhas metas'])) return answerers.goalAdjustmentAdvice?.(text);
        if (includesAny(normalized, ['faz sentido eu reduzir', 'vale a pena reduzir', 'devo reduzir', 'devo baixar', 'devo diminuir'])) return answerers.categoryChangeAdvice?.(text);
        if (includesAny(normalized, ['quantas metas', 'numero de metas', 'quantas metas tenho'])) return answerers.goalCount?.(text);
        if (includesAny(normalized, ['categorias sem meta', 'quais categorias nao tem meta', 'o que esta sem meta'])) return answerers.categoriesWithoutGoal?.(text);
        if (includesAny(normalized, ['como estou em', 'status de', 'andamento de']) && detectedCategory) return answerers.categoryStatus?.(text);
        if (includesAny(normalized, ['qual categoria', 'categoria que mais', 'mais foco', 'lider']) && includesAny(normalized, ['foco', 'foquei', 'tempo'])) return answerers.topCategory?.(text);
        if (includesAny(normalized, ['quantos pomodoros', 'quantas sessoes'])) return answerers.pomodoros?.(text);
        if (includesAny(normalized, ['planejado', 'realizado', 'quanto falta para as metas', 'como esta meu plano'])) return answerers.plannedVsActual?.(text);
        if (includesAny(normalized, ['estou melhorando', 'estou piorando', 'compare', 'comparado', 'evoluindo', 'evolucao'])) return answerers.trend?.(text);
        if (includesAny(normalized, ['resumo', 'resuma', 'meu desempenho', 'como eu fui'])) return answerers.summary?.(text);
        if (includesAny(normalized, ['como foi meu foco', 'como esta meu foco', 'como ta meu foco'])) return answerers.focusTotal?.(text);
        if (includesAny(normalized, ['tarefas', 'tarefa atual', 'o que tenho para fazer'])) return answerers.tasks?.(text);
        if (includesAny(normalized, ['quanto foquei', 'quanto tempo', 'quanto entreguei', 'quanto de foco'])) return answerers.focusTotal?.(text);
        if (detectedCategory) return answerers.categoryStatus?.(text);
        if (includesAny(normalized, ['foco', 'historico', 'desempenho'])) return answerers.summary?.(text);
        if (includesAny(normalized, ['meta', 'metas', 'planejamento', 'planejado'])) return answerers.goalAdjustmentAdvice?.(text);

        return {
            content: 'Ainda nao peguei exatamente o que voce quis dizer, mas sigo com voce nessa. Se quiser, reformula do seu jeito mesmo e eu tento de novo. Posso ajudar com metas, historico, foco, categorias, tarefas e decisoes de prioridade.',
            suggestions: getDefaultSuggestions()
        };
    };

    window.FocoZenAssistantCore = Object.freeze({
        normalizeText,
        detectTemporalContext,
        detectCategory,
        detectDurationMinutes,
        detectSchedule,
        extractTaskDraft,
        getMissingTaskFields,
        expandFollowUp,
        buildReply
    });
})();
