function switchView(viewId) {
    document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId)?.classList.add('active');
    if (viewId === 'view-stats' && window.compileDashboardData) window.compileDashboardData();
    if (viewId === 'view-goals') window.compileGoalsData();
    window.updateAssistantContext();
}

function initNavigation() {
    window.updateSidebarProfile = updateSidebarProfile;
}

function updateSidebarProfile() {
    const nameEl = document.getElementById('sidebarUserName');
    const initEl = document.getElementById('sidebarUserInitials');
    if (nameEl) nameEl.textContent = username;
    if (initEl) initEl.textContent = username.charAt(0).toUpperCase();
}

// ==========================================
// INTEGRACAO PIP
// ==========================================