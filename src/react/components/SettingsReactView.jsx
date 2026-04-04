import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY_USERNAME = 'foczen_username';

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        if (window.FocoZenStorage?.writeStorageValue) {
            window.FocoZenStorage.writeStorageValue(key, value);
        } else {
            localStorage.setItem(key, value);
        }
    } catch { /* noop */ }
}

export default function SettingsReactView() {
    const [username, setUsername] = useState(() => readStorage(STORAGE_KEY_USERNAME) || '');
    const [savedMsg, setSavedMsg] = useState(false);
    const [updateChecking, setUpdateChecking] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null);
    const [appVersion, setAppVersion] = useState('—');
    const [changelog, setChangelog] = useState('Carregando...');

    useEffect(() => {
        let cancelled = false;
        window.electronAPI?.getAppVersion?.().then((v) => {
            if (!cancelled && v) setAppVersion(v);
        }).catch(() => { /* noop */ });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        window.electronAPI?.getFullChangelog?.().then((cl) => {
            if (!cancelled && cl) {
                const formatted = window.formatFullChangelog
                    ? window.formatFullChangelog(cl)
                    : cl.replace(/\n/g, '<br>');
                setChangelog(formatted);
            }
        }).catch(() => {
            if (!cancelled) setChangelog('Historico nao disponivel.');
        });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const handler = (_event, result) => {
            setUpdateChecking(false);
            if (result?.available) {
                setUpdateStatus({ type: 'info', text: result.message || 'Atualizacao disponivel!' });
            } else {
                setUpdateStatus({ type: 'info', text: result?.message || 'Voce esta na versao mais recente.' });
            }
        };
        window.electronAPI?.onUpdateCheckResult?.(handler);
        return () => { /* IPC listeners are cleaned up by Electron automatically */ };
    }, []);

    const handleSaveName = useCallback(() => {
        const trimmed = username.trim();
        if (!trimmed) return;
        writeStorage(STORAGE_KEY_USERNAME, trimmed);
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
        if (window.updateSidebarProfile) window.updateSidebarProfile();
        if (window.FocoZenStatsRuntime?.refresh) window.FocoZenStatsRuntime.refresh();
        if (window.FocoZenAssistantRuntime?.refresh) window.FocoZenAssistantRuntime.refresh();
    }, [username]);

    const handleCheckUpdates = useCallback(() => {
        setUpdateChecking(true);
        setUpdateStatus(null);
        window._manualUpdateTriggered = true;
        window.electronAPI?.checkForUpdates?.();
        setTimeout(() => {
            if (window._manualUpdateTriggered) {
                window._manualUpdateTriggered = false;
                setUpdateChecking(false);
                setUpdateStatus({ type: 'info', text: 'Sistema de atualizacao nao disponivel neste ambiente.' });
            }
        }, 5000);
    }, []);

    const handleReset = useCallback(() => {
        if (window.confirm('Tem certeza que deseja apagar todos os dados? Esta acao nao pode ser desfeita.')) {
            if (window.resetAppData) {
                window.resetAppData();
            }
        }
    }, []);

    return (
        <div className="settings-react-view">
            {/* Profile */}
            <section className="panel glass-effect" style={{ padding: '30px', marginBottom: '24px', borderRadius: '20px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.3rem' }}>
                    <i className="fas fa-user" style={{ color: 'var(--accent-primary)', marginRight: '12px' }}></i>
                    Personalizacao de Perfil
                </h3>
                <div className="form-group" style={{ maxWidth: '400px' }}>
                    <label>Exibicao de Nome</label>
                    <input
                        type="text"
                        className="modern-input"
                        style={{ background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px' }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                    <button className="btn-modal primary" onClick={handleSaveName}>
                        Salvar Alteracoes
                    </button>
                    {savedMsg ? (
                        <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-check-circle"></i> Atualizado!
                        </div>
                    ) : null}
                </div>
            </section>

            {/* Updates */}
            <section className="panel glass-effect" style={{ padding: '30px', marginBottom: '24px', borderRadius: '20px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.3rem', color: 'white' }}>
                    <i className="fas fa-sync-alt" style={{ color: 'var(--accent-primary)', marginRight: '12px' }}></i>
                    Atualizacoes
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '1rem', lineHeight: 1.6 }}>
                    Verifique se ha novas versoes disponiveis do FocoZen Pro.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        className="btn-modal primary"
                        style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', width: 'fit-content' }}
                        onClick={handleCheckUpdates}
                        disabled={updateChecking}
                    >
                        <i className={`fas ${updateChecking ? 'fa-spinner fa-spin' : 'fa-download'}`}></i>{' '}
                        {updateChecking ? 'Verificando...' : 'Verificar Atualizacoes'}
                    </button>
                    {updateStatus ? (
                        <div style={{ color: updateStatus.type === 'error' ? '#ef4444' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {updateStatus.text}
                        </div>
                    ) : null}
                </div>
            </section>

            {/* About */}
            <section className="panel glass-effect" style={{ padding: '30px', marginBottom: '24px', borderRadius: '20px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.3rem', color: 'white' }}>
                    <i className="fas fa-info-circle" style={{ color: 'var(--accent-primary)', marginRight: '12px' }}></i>
                    Sobre
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-brain" style={{ fontSize: '1.8rem', color: 'white' }}></i>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>FocoZen Pro</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
                            Versao <strong style={{ color: 'white' }}>{appVersion}</strong>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>por Luqi</div>
                    </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '14px', padding: '18px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '12px' }}>
                        <i className="fas fa-list-ul" style={{ marginRight: '6px' }}></i>
                        Ultimas novidades
                    </div>
                    <div
                        style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}
                        dangerouslySetInnerHTML={{ __html: changelog }}
                    />
                </div>
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>
                        <i className="fas fa-flask" style={{ marginRight: '6px' }}></i>Desenvolvimento
                    </div>
                    <button
                        onClick={() => { if (window.toggleTestMode) window.toggleTestMode(); }}
                        style={{ padding: '8px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        Modo Teste
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Ativa timer de 5s para testar as fases</p>
                </div>
            </section>

            {/* Reset */}
            <section className="panel glass-effect" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.3rem', color: 'white' }}>
                    <i className="fas fa-eraser" style={{ marginRight: '12px' }}></i>
                    Limpeza de Dados
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', lineHeight: 1.6 }}>
                    Use este botao para apagar todos os seus registros de atividades, tarefas e configuracoes salvos localmente neste aplicativo.
                </p>
                <button
                    className="btn-modal secondary"
                    style={{ background: 'rgba(0,0,0,0.3)', color: 'white', borderColor: 'rgba(255,255,255,0.2)', padding: '12px 24px', width: '100%', justifyContent: 'center', position: 'relative' }}
                    onClick={handleReset}
                >
                    <i className="fas fa-trash" style={{ position: 'absolute', left: '24px' }}></i>{' '}
                    <span>Resetar Aplicativo</span>
                </button>
            </section>
        </div>
    );
}
