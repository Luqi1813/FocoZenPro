import React, { useCallback, useEffect, useState } from 'react';
import HomeReactView from '../components/HomeReactView.jsx';
import StatsReactView from '../components/StatsReactView.jsx';
import GoalsReactView from '../components/GoalsReactView.jsx';
import SettingsReactView from '../components/SettingsReactView.jsx';

const VIEWS = [
    { id: 'home', label: 'Home', icon: 'fa-home' },
    { id: 'stats', label: 'Estatísticas', icon: 'fa-chart-pie' },
    { id: 'goals', label: 'Metas', icon: 'fa-bullseye' },
    { id: 'settings', label: 'Configurações', icon: 'fa-cog' }
];

function readInitialView() {
    try {
        const v = localStorage.getItem('foczen_active_view');
        if (v && VIEWS.find((x) => x.id === v)) return v;
    } catch { /* noop */ }
    return 'home';
}

function Sidebar({ activeView, onNavigate, username, userInitial }) {
    return (
        <nav className="app-sidebar">
            <div className="sidebar-brand">
                <div className="sidebar-logo"><i className="fas fa-brain"></i></div>
                <div className="sidebar-title">FOCOZEN</div>
            </div>
            <div className="sidebar-menu">
                {VIEWS.map((v) => (
                    <a
                        key={v.id}
                        className={`sidebar-item${activeView === v.id ? ' active' : ''}`}
                        data-view={v.id}
                        onClick={() => onNavigate(v.id)}
                    >
                        <i className={`fas ${v.icon}`}></i><span>{v.label}</span>
                    </a>
                ))}
            </div>
            <div style={{ marginTop: 'auto', padding: '16px' }}>
                <div className="glass-effect" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                    <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem', color: 'white', flexShrink: 0 }}>
                        {userInitial || 'Z'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100%' }}>
                            {username || 'Mestre Zen'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                            Pro User
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default function AppShell() {
    const [activeView, setActiveView] = useState(readInitialView);
    const [username, setUsername] = useState(() => {
        try { return localStorage.getItem('foczen_username') || ''; } catch { return ''; }
    });
    const [userInitial, setUserInitial] = useState(() => {
        try { return (localStorage.getItem('foczen_username') || 'Z').charAt(0).toUpperCase(); } catch { return 'Z'; }
    });

    useEffect(() => {
        try {
            localStorage.setItem('foczen_active_view', activeView);
        } catch { /* noop */ }
    }, [activeView]);

    useEffect(() => {
        const handler = () => {
            try {
                const name = localStorage.getItem('foczen_username') || '';
                setUsername(name);
                setUserInitial(name ? name.charAt(0).toUpperCase() : 'Z');
            } catch { /* noop */ }
        };
        window.addEventListener('storage', handler);
        const orig = window.updateSidebarProfile;
        window.updateSidebarProfile = function () {
            handler();
            if (orig) orig();
        };
        return () => {
            window.removeEventListener('storage', handler);
            window.updateSidebarProfile = orig;
        };
    }, []);

    const handleNavigate = useCallback((viewId) => {
        setActiveView(viewId);
    }, []);

    return (
        <div className="app-wrapper">
            <Sidebar
                activeView={activeView}
                onNavigate={handleNavigate}
                username={username}
                userInitial={userInitial}
            />
            <div className="app-main-area">
                {/* Home */}
                <div id="view-home" className={`view-container${activeView === 'home' ? ' active' : ''}`}>
                    <div className="app-container">
                        <HomeReactView />
                    </div>
                </div>

                {/* Stats */}
                <div id="view-stats" className={`view-container${activeView === 'stats' ? ' active' : ''}`}>
                    <div className="app-container" style={{ paddingTop: '20px', maxWidth: '1200px', margin: '0 auto', height: 'auto', minHeight: 'unset', paddingBottom: '60px' }}>
                        <StatsReactView />
                    </div>
                </div>

                {/* Goals */}
                <div id="view-goals" className={`view-container${activeView === 'goals' ? ' active' : ''}`}>
                    <div className="app-container" style={{ paddingTop: '20px', maxWidth: '1200px', margin: '0 auto', height: 'auto', minHeight: 'unset', paddingBottom: '60px' }}>
                        <GoalsReactView />
                    </div>
                </div>

                {/* Settings */}
                <div id="view-settings" className={`view-container${activeView === 'settings' ? ' active' : ''}`}>
                    <div className="app-container" style={{ paddingTop: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px', height: 'auto', minHeight: 'unset' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'white' }}>Configurações</h1>
                        </div>
                        <SettingsReactView />
                    </div>
                </div>
            </div>
        </div>
    );
}
