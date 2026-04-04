import React from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './shell/AppShell.jsx';
import AssistantReactDock from './components/AssistantReactDock.jsx';
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
    mountIsland('react-app-root', <AppShell />);
    mountIsland('react-assistant-root', <AssistantReactDock />);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountReactIslands, { once: true });
} else {
    mountReactIslands();
}
