(() => {
    const soundsConfig = [
        { id: 'chuva', name: 'Chuva', icon: 'fa-cloud-rain', image: 'chuva.jpg', file: 'chuva.mp3' },
        { id: 'oceano', name: 'Oceano', icon: 'fa-water', image: 'oceano.jpg', file: 'oceano.mp3' },
        { id: 'floresta', name: 'Floresta', icon: 'fa-tree', image: 'floresta.jpg', file: 'floresta.mp3' },
        { id: 'fogueira', name: 'Fogueira', icon: 'fa-fire', image: 'fogueira.jpg', file: 'fogueira.mp3' },
        { id: 'teclado', name: 'Teclado', icon: 'fa-keyboard', image: 'teclado.jpg', file: 'teclado.mp3' },
        { id: 'classica', name: 'Clássica', icon: 'fa-music', image: 'classica.jpg', file: 'classica.mp3' },
        { id: 'Jazz', name: 'Jazz', icon: 'fa-music', image: 'jazz.jpg', file: 'Jazz.mp3' },
        { id: 'Lo-fi', name: 'Lo-Fi', icon: 'fa-headphones', image: 'lofi.jpg', file: 'Lo-fi.mp3' },
        { id: 'Brown noise', name: 'Brown Noise', icon: 'fa-wave-square', image: 'default.jpg', file: 'Brown noise.mp3' },
        { id: 'Pink noise', name: 'Pink Noise', icon: 'fa-wave-square', image: 'default.jpg', file: 'Pink noise.mp3' },
        { id: '40hz', name: '40Hz Gama', icon: 'fa-wave-square', image: 'default.jpg', file: '40hz (Ondas Gama).mp3' }
    ];

    const soundCategories = {
        Natureza: { icon: 'fa-leaf', ids: ['chuva', 'oceano', 'floresta', 'fogueira'] },
        'Música & Foco': { icon: 'fa-headphones', ids: ['teclado', 'classica', 'Jazz', 'Lo-fi'] },
        Frequências: { icon: 'fa-wave-square', ids: ['Brown noise', 'Pink noise', '40hz'] }
    };

    const soundThemes = {
        chuva: 'water',
        oceano: 'water',
        floresta: 'nature',
        fogueira: 'fire',
        teclado: 'yellow',
        classica: 'classica',
        Jazz: 'jazz',
        'Lo-fi': 'lofi',
        'Brown noise': 'brown',
        'Pink noise': 'pink',
        '40hz': 'sky'
    };

    const quotes = [
        { text: 'A mente que se abre a uma nova ideia jamais voltará ao seu tamanho original.', author: 'Albert Einstein' },
        { text: 'O conhecimento é a única riqueza que se expande quando compartilhada.', author: 'Sócrates' },
        { text: 'Nao espere por circunstancias ideais. Comece agora.', author: 'Seneca' }
    ];

    const successQuotes = [
        { text: 'A vitoria pertence ao mais perseverante.', author: 'Napoleao Bonaparte' },
        { text: 'Nao e porque as coisas sao dificeis que nao ousamos; e porque nao ousamos que elas sao dificeis.', author: 'Seneca' },
        { text: 'O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.', author: 'Winston Churchill' },
        { text: 'Faça o que puder, com o que tiver, onde estiver.', author: 'Theodore Roosevelt' },
        { text: 'A disciplina é a ponte entre metas e realizações.', author: 'Jim Rohn' },
        { text: 'Voce nao precisa ser grande para comecar, mas precisa comecar para ser grande.', author: 'Zig Ziglar' }
    ];

    const defaultCategories = [
        { name: 'Livre', icon: 'fa-infinity' },
        { name: 'Trabalho', icon: 'fa-briefcase' },
        { name: 'Estudos', icon: 'fa-book' },
        { name: 'Projetos', icon: 'fa-laptop-code' },
        { name: 'Leitura', icon: 'fa-book-open' },
        { name: 'Hobbies', icon: 'fa-palette' },
        { name: 'Exercício', icon: 'fa-dumbbell' }
    ];

    const motivationalRestartMessages = [
        'Pausar nao e desistir. Voce pode recomecar com mais clareza depois.',
        'Seu progresso conta. Respire, recarregue e volte mais forte.',
        'Todo grande avanço também respeita pausas inteligentes.',
        'Voce nao perdeu o ritmo. So esta escolhendo o melhor momento para continuar.',
        'Disciplina também é saber a hora de recomeçar com energia.'
    ];

    window.FocoZenConstants = Object.freeze({
        soundsConfig,
        soundCategories,
        soundThemes,
        quotes,
        successQuotes,
        POMODORO_MINUTES: 25,
        SHORT_BREAK_MINUTES: 5,
        LONG_BREAK_MINUTES: 15,
        defaultCategories,
        motivationalRestartMessages
    });
})();
