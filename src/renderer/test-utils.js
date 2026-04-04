window.testChangelog = function() {
    const testChangelog = `### Corrigido
- Scroll nas configurações agora funciona corretamente
- Secoes de configuracao nao sao mais cortadas na parte inferior
- Layout da view de estatísticas também ajustado para scroll adequado

### Adicionado
- Sistema de changelog real lendo do CHANGELOG.md
- Histórico completo de todas as funcionalidades desde v1.0.0`;
    
    showChangelogModal('1.0.8', testChangelog);
    console.log('✅ Changelog modal exibido! Verifique a tela.');
};
