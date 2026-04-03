import React, { useEffect, useState } from 'react';
import { getRuntimeSnapshot } from '../contracts/runtime.js';

export default function SettingsReactSandbox() {
    const [snapshot, setSnapshot] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        getRuntimeSnapshot()
            .then((nextSnapshot) => {
                if (!active) return;
                setSnapshot(nextSnapshot);
            })
            .catch((nextError) => {
                if (!active) return;
                setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar runtime');
            });

        return () => {
            active = false;
        };
    }, []);

    const readyContracts = snapshot?.contracts?.filter((item) => item.available).length ?? 0;
    const totalContracts = snapshot?.contracts?.length ?? 0;

    return (
        <div className="react-sandbox-shell">
            <div className="react-sandbox-header">
                <div>
                    <div className="react-sandbox-kicker">Infraestrutura React</div>
                    <h3 className="react-sandbox-title">React ativo em paralelo ao legado</h3>
                </div>
                <span className="react-sandbox-status">Sandbox online</span>
            </div>

            <p className="react-sandbox-copy">
                Esta ilha valida bundling com Vite, mount isolado no Electron e leitura apenas de contratos estaveis.
            </p>

            {error ? (
                <div className="react-sandbox-error">Erro ao ler runtime: {error}</div>
            ) : null}

            <div className="react-sandbox-grid">
                <div className="react-sandbox-card">
                    <span className="react-sandbox-label">Status</span>
                    <strong className="react-sandbox-value">React ativo</strong>
                    <span className="react-sandbox-meta">Coexistindo com a UI legado</span>
                </div>

                <div className="react-sandbox-card">
                    <span className="react-sandbox-label">Versao do app</span>
                    <strong className="react-sandbox-value">{snapshot?.appVersion || 'Carregando...'}</strong>
                    <span className="react-sandbox-meta">Lida via electronAPI</span>
                </div>

                <div className="react-sandbox-card">
                    <span className="react-sandbox-label">Usuario salvo</span>
                    <strong className="react-sandbox-value">{snapshot?.userName || 'Carregando...'}</strong>
                    <span className="react-sandbox-meta">Lido via FocoZenStorage</span>
                </div>

                <div className="react-sandbox-card">
                    <span className="react-sandbox-label">Contratos estaveis</span>
                    <strong className="react-sandbox-value">
                        {snapshot ? `${readyContracts}/${totalContracts}` : 'Carregando...'}
                    </strong>
                    <span className="react-sandbox-meta">
                        {snapshot?.pomodoroMinutes ? `Pomodoro base: ${snapshot.pomodoroMinutes} min` : 'Aguardando runtime'}
                    </span>
                </div>
            </div>

            <div className="react-sandbox-contracts">
                {(snapshot?.contracts || []).map((contract) => (
                    <div
                        key={contract.name}
                        className={`react-sandbox-contract ${contract.available ? 'is-ready' : 'is-missing'}`}
                    >
                        <span>{contract.name}</span>
                        <strong>{contract.available ? 'ok' : 'ausente'}</strong>
                    </div>
                ))}
            </div>
        </div>
    );
}
