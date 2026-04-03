import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import GoalsReactView from './components/GoalsReactView.jsx';
import StatsReactView from './components/StatsReactView.jsx';
import './styles.css';

function mountIsland(containerId, element) {
    const container = document.getElementById(containerId);
    if (!container) return;

    createRoot(container).render(
        <React.StrictMode>
            {element}
        </React.StrictMode>
    );
}

function mountReactIslands() {
    mountIsland('react-settings-root', <App />);
    mountIsland('react-stats-root', <StatsReactView />);
    mountIsland('react-goals-root', <GoalsReactView />);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactIslands, { once: true });
} else {
    mountReactIslands();
}
