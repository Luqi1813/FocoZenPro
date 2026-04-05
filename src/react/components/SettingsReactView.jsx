import React, { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY_USERNAME = 'foczen_username';
const STORAGE_KEY_ACCENT = 'focozen_custom_accent_color';

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

function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyAccentColor(hex) {
    if (!hex) {
        document.documentElement.removeAttribute('data-custom-accent');
        document.documentElement.style.removeProperty('--accent-primary');
        document.documentElement.style.removeProperty('--accent-secondary');
        document.documentElement.style.removeProperty('--accent-glow');
        return;
    }
    document.documentElement.setAttribute('data-custom-accent', hex);
    const { h, s, l } = hexToHSL(hex);
    const l2 = Math.max(0, l - 12);
    const glowA = Math.min(0.4, Math.max(0.15, s / 100 * 0.4));
    document.documentElement.style.setProperty('--accent-primary', hex);
    document.documentElement.style.setProperty('--accent-secondary', `hsl(${h}, ${s}%, ${l2}%)`);
    document.documentElement.style.setProperty('--accent-glow', `hsla(${h}, ${s}%, ${l}%, ${glowA})`);
}

export default function SettingsReactView() {
    const [username, setUsername] = useState(() => readStorage(STORAGE_KEY_USERNAME) || '');
    const [accentColor, setAccentColor] = useState(() => readStorage(STORAGE_KEY_ACCENT) || '');
    const [savedMsg, setSavedMsg] = useState(false);
    const [accentSaved, setAccentSaved] = useState(false);
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

    const handleSaveAccent = useCallback(() => {
        writeStorage(STORAGE_KEY_ACCENT, accentColor || '');
        setAccentSaved(true);
        setTimeout(() => setAccentSaved(false), 3000);
    }, [accentColor]);

    const handleResetAccent = useCallback(() => {
        setAccentColor('');
        writeStorage(STORAGE_KEY_ACCENT, '');
        applyAccentColor('');
        setAccentSaved(true);
        setTimeout(() => setAccentSaved(false), 3000);
    }, []);

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

            {/* Accent Color */}
            <section className="panel glass-effect" style={{ padding: '30px', marginBottom: '24px', borderRadius: '20px' }}>
                <h3 style={{ marginBottom: '24px', fontSize: '1.3rem' }}>
                    <i className="fas fa-palette" style={{ color: accentColor || 'var(--accent-primary)', marginRight: '12px' }}></i>
                    Cor de Destaque
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Escolha uma cor personalizada para substituir o tema do wallpaper. A cor sera aplicada em botoes, icones, bordas e destaques.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '14px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0, background: accentColor || 'var(--accent-primary)' }}>
                        <input
                            type="color"
                            value={accentColor || '#7c89d9'}
                            onChange={(e) => setAccentColor(e.target.value)}
                            style={{ position: 'absolute', top: '-10px', left: '-10px', width: 'calc(100% + 20px)', height: 'calc(100% + 20px)', border: 'none', cursor: 'pointer', opacity: 0 }}
                        />
                        <i className="fas fa-eye-dropper" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '1.2rem', pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}></i>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="text"
                            className="modern-input"
                            style={{ background: 'rgba(0,0,0,0.2)', color: 'white', width: '120px', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '0.95rem', textTransform: 'uppercase' }}
                            value={accentColor || ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setAccentColor(v);
                            }}
                            placeholder="#7C89D9"
                        />
                        <button className="btn-modal primary" onClick={handleSaveAccent} style={{ whiteSpace: 'nowrap' }}>
                            Aplicar
                        </button>
                        <button className="btn-modal secondary" onClick={handleResetAccent} style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)', whiteSpace: 'nowrap' }}>
                            <i className="fas fa-undo" style={{ marginRight: '6px' }}></i>Padrao
                        </button>
                    </div>
                    {accentSaved ? (
                        <div style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-check-circle"></i> Cor aplicada!
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
