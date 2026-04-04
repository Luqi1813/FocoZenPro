function setupUpdateListeners() {
    if (!updateService?.isAvailable || !updateService.isAvailable()) {
        console.warn('electronAPI nao disponivel - sistema de atualizacao desabilitado');
        return;
    }
    
    // Listen for update downloaded
    if (updateService?.onDownloaded) {
        updateService.onDownloaded((info) => {
            console.log('Atualizacao baixada:', info);
            document.getElementById('updateDownloadBanner')?.remove();
            document.getElementById('updateInlineProgress')?.remove();
            if (window._manualUpdateTriggered) {
                // Auto-install silently after manual check
                window._manualUpdateTriggered = false;
                if (storageService?.writeStorageValue) {
                    storageService.writeStorageValue(storageKeys.UPDATED_VERSION, info.version);
                    storageService.writeStorageValue(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
                } else {
                    localStorage.setItem(storageKeys.UPDATED_VERSION, info.version);
                    localStorage.setItem(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
                }
                const btn = document.getElementById('btnCheckUpdates');
                if (btn) btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Instalando...';
                setTimeout(() => { updateService?.installUpdate?.(); }, 800);
            } else {
                showUpdateNotification(info);
            }
        });
    }

    // Show download progress banner
    if (updateService?.onDownloadProgress) {
        updateService.onDownloadProgress((pct) => {
            let banner = document.getElementById('updateDownloadBanner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'updateDownloadBanner';
                banner.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99998;background:rgba(15,23,42,0.95);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:16px 20px;min-width:280px;box-shadow:0 8px 32px rgba(0,0,0,0.4);';
                banner.innerHTML = `
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                        <i class="fas fa-download" style="color:var(--accent-primary);"></i>
                        <span style="font-weight:600;font-size:0.9rem;">Baixando atualizacao...</span>
                        <span id="updateDownloadPct" style="margin-left:auto;font-size:0.85rem;color:var(--text-secondary);">0%</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:99px;height:4px;overflow:hidden;">
                        <div id="updateDownloadBar" style="height:100%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));width:0%;transition:width 0.3s ease;border-radius:99px;"></div>
                    </div>`;
                document.body.appendChild(banner);
            }
            document.getElementById('updateDownloadPct').textContent = pct + '%';
            document.getElementById('updateDownloadBar').style.width = pct + '%';
            const inlinePctEl = document.getElementById('inlineDownloadPct');
            const inlineBarEl = document.getElementById('inlineDownloadBar');
            if (inlinePctEl) inlinePctEl.textContent = pct + '%';
            if (inlineBarEl) inlineBarEl.style.width = pct + '%';
        });
    }
    
    // Listen for manual update check results
    if (updateService?.onCheckResult) {
        updateService.onCheckResult((result) => {
            console.log('Resultado da verificacao de atualizacao:', result);
            handleUpdateCheckResult(result);
        });
    }
    
    // Check if app was just updated (show changelog)
    checkForChangelog();

    // Init Sobre section
    initSobreSection();
}

function showUpdateNotification(info) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '99999';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="max-width: 480px; text-align: center;">
            <div class="elegant-icon" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); width: 70px; height: 70px; margin: 0 auto 20px;">
                <i class="fas fa-download" style="font-size: 2rem;"></i>
            </div>
            <h2 class="elegant-title" style="font-size: 1.6rem; margin-bottom: 12px;">Nova Versao Disponivel!</h2>
            <p class="elegant-message" style="font-size: 1.1rem; margin-bottom: 8px;">Versao <strong>${info.version}</strong> foi baixada</p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; max-height: 200px; overflow-y: auto;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">
                    <i class="fas fa-list-ul"></i> O QUE HÁ DE NOVO
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                    ${formatReleaseNotes(info.releaseNotes)}
                </div>
            </div>
            <div class="elegant-actions" style="gap: 12px;">
                <button class="btn-modal secondary btn-update-later" style="flex: 1;">Mais Tarde</button>
                <button class="btn-modal primary btn-update-now" style="flex: 1; background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
                    <i class="fas fa-sync-alt"></i> Reiniciar Agora
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.classList.add('active');
    overlay.querySelector('.btn-update-now').addEventListener('click', () => {
        // Save flag to show changelog after restart
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.UPDATED_VERSION, info.version);
            storageService.writeStorageValue(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
        } else {
            localStorage.setItem(storageKeys.UPDATED_VERSION, info.version);
            localStorage.setItem(storageKeys.CHANGELOG, info.releaseNotes || 'Melhorias de desempenho e correções de bugs.');
        }
        updateService?.installUpdate?.();
    });
    
    overlay.querySelector('.btn-update-later').addEventListener('click', () => {
        overlay.remove();
    });
}

function formatReleaseNotes(notes) {
    if (!notes || notes === 'Melhorias de desempenho e correções de bugs.') {
        return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>Melhorias de desempenho</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>Correções de bugs</span>
            </div>
        `;
    }
    
    // Parse markdown-style list or plain text
    const lines = notes.split('\n').filter(l => l.trim());
    return lines.map(line => {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        return `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <i class="fas fa-check" style="color: var(--accent-primary); font-size: 0.8rem;"></i>
                <span>${cleaned}</span>
            </div>
        `;
    }).join('');
}

async function checkForChangelog() {
    const updatedVersion = storageService?.readStorageValue
        ? storageService.readStorageValue(storageKeys.UPDATED_VERSION, null)
        : localStorage.getItem(storageKeys.UPDATED_VERSION);
    
    if (updatedVersion) {
        // Clear one-time flags immediately
        if (storageService?.removeStorageValue) {
            storageService.removeStorageValue(storageKeys.UPDATED_VERSION);
            storageService.removeStorageValue(storageKeys.CHANGELOG);
        } else {
            localStorage.removeItem(storageKeys.UPDATED_VERSION);
            localStorage.removeItem(storageKeys.CHANGELOG);
        }

        // Read changelog from NEW app's CHANGELOG.md (after restart)
        let changelog = 'Melhorias de desempenho e correções de bugs.';
        if (updateService?.getChangelogForVersion) {
            try {
                changelog = await updateService.getChangelogForVersion(updatedVersion);
            } catch(e) {
                console.error('Erro ao ler changelog para versao:', e);
            }
        }

        // Save permanent copy for Sobre section
        if (storageService?.writeStorageValue) {
            storageService.writeStorageValue(storageKeys.LAST_VERSION, updatedVersion);
            storageService.writeStorageValue(storageKeys.LAST_CHANGELOG, changelog);
        } else {
            localStorage.setItem(storageKeys.LAST_VERSION, updatedVersion);
            localStorage.setItem(storageKeys.LAST_CHANGELOG, changelog);
        }
        
        // Show changelog modal after app settles
        setTimeout(() => {
            showChangelogModal(updatedVersion, changelog);
        }, 1500);
    }
}

function showChangelogModal(version, notes) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '99999';
    overlay.innerHTML = `
        <div class="modal-content-small elegant-popup" style="max-width: 500px; text-align: center;">
            <div class="elegant-icon" style="background: linear-gradient(135deg, #10b981, #059669); width: 70px; height: 70px; margin: 0 auto 20px;">
                <i class="fas fa-check-circle" style="font-size: 2rem;"></i>
            </div>
            <h2 class="elegant-title" style="font-size: 1.7rem; margin-bottom: 12px;">Atualizacao Concluida!</h2>
            <p class="elegant-message" style="font-size: 1rem; margin-bottom: 8px;">Agora voce esta usando a versao <strong>${version}</strong></p>
            <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; max-height: 250px; overflow-y: auto;">
                <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; font-weight: 700;">
                    <i class="fas fa-sparkles"></i> NOVIDADES DESTA VERSoO
                </div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6;">
                    ${formatReleaseNotes(notes)}
                </div>
            </div>
            <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove()" style="width: 100%; background: linear-gradient(135deg, #10b981, #059669);">
                <i class="fas fa-rocket"></i> Vamos Lá!
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

async function initSobreSection() {
    let version = '—';
    if (updateService?.getAppVersion) {
        version = await updateService.getAppVersion();
    }

    const versionEl = document.getElementById('sobreVersionNumber');
    if (versionEl) versionEl.textContent = version;

    const sobreChangelogEl = document.getElementById('sobreChangelogContent');
    const sobreVersionLabel = document.getElementById('sobreLastVersionLabel');

    if (sobreChangelogEl) {
        // Load full changelog from CHANGELOG.md
        if (updateService?.getFullChangelog) {
            try {
                const fullChangelog = await updateService.getFullChangelog();
                if (sobreVersionLabel) sobreVersionLabel.textContent = 'Histórico Completo de Versões';
                sobreChangelogEl.innerHTML = formatFullChangelog(fullChangelog);
            } catch (err) {
                console.error('Erro ao carregar changelog:', err);
                sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Erro ao carregar histórico de versões.</span>';
            }
        } else {
            sobreChangelogEl.innerHTML = '<span style="color:var(--text-secondary);font-size:0.9rem;">Historico de versoes nao disponivel.</span>';
        }
    }
}

function formatFullChangelog(markdown) {
    if (!markdown || markdown.trim() === '') {
        return '<span style="color:var(--text-secondary);font-size:0.9rem;">Nenhum changelog disponível.</span>';
    }
    
    // Convert markdown to HTML with proper styling
    let html = markdown
        // Version headers (## [1.0.8] - 2026-03-31)
        .replace(/^## \[([^\]]+)\] - (.+)$/gm, '<div style="margin-top:24px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);"><span style="font-size:1.1rem;font-weight:700;color:var(--accent-primary);">v$1</span><span style="margin-left:10px;font-size:0.85rem;color:var(--text-secondary);">$2</span></div>')
        // Category headers (### Adicionado, ### Corrigido, etc)
        .replace(/^### (.+)$/gm, '<div style="margin-top:16px;margin-bottom:8px;font-size:0.75rem;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:1px;"><i class="fas fa-chevron-right" style="font-size:0.6rem;margin-right:6px;"></i>$1</div>')
        // Sub-category headers (#### Sistema de Foco)
        .replace(/^#### (.+)$/gm, '<div style="margin-top:14px;margin-bottom:8px;font-size:0.9rem;font-weight:600;color:white;">$1</div>')
        // Bullet points
        .replace(/^- (.+)$/gm, '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;padding-left:12px;"><i class="fas fa-check" style="color:var(--accent-primary);font-size:0.7rem;margin-top:4px;flex-shrink:0;"></i><span style="font-size:0.9rem;line-height:1.6;">$1</span></div>')
        // Nested bullet points (with 2 spaces indent)
        .replace(/^  - (.+)$/gm, '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:4px;padding-left:32px;"><i class="fas fa-circle" style="color:var(--accent-primary);font-size:0.4rem;margin-top:6px;flex-shrink:0;"></i><span style="font-size:0.85rem;line-height:1.5;color:var(--text-secondary);">$1</span></div>');
    
    return html;
}

function handleUpdateCheckResult(result) {
    const btn = document.getElementById('btnCheckUpdates');
    const status = document.getElementById('updateCheckStatus');

    if (result.available) {
        // Show inline download progress in the updates section
        if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Baixando...';
        const section = btn?.closest('section');
        if (section && !document.getElementById('updateInlineProgress')) {
            const prog = document.createElement('div');
            prog.id = 'updateInlineProgress';
            prog.style.cssText = 'margin-top:16px;';
            prog.innerHTML = `
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:0.85rem;color:var(--text-secondary);">
                    <span><i class="fas fa-download" style="color:var(--accent-primary);margin-right:6px;"></i>Baixando v${result.version}...</span>
                    <span id="inlineDownloadPct">0%</span>
                </div>
                <div style="background:rgba(255,255,255,0.1);border-radius:99px;height:5px;overflow:hidden;">
                    <div id="inlineDownloadBar" style="height:100%;background:linear-gradient(90deg,var(--accent-primary),var(--accent-secondary));width:0%;transition:width 0.3s ease;border-radius:99px;"></div>
                </div>`;
            section.appendChild(prog);
        }
        return;
    }

    // Not available — reset button and show modal
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-download"></i> Verificar Atualizações'; }
    if (status) status.style.display = 'none';
    window._manualUpdateTriggered = false;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '99999';
    
    if (false) {
        // placeholder - result.available is always false here
    } else {
        overlay.innerHTML = `
            <div class="modal-content-small elegant-popup" style="text-align: center;">
                <div class="elegant-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 class="elegant-title">Tudo Atualizado!</h2>
                <p class="elegant-message">${result.message || 'Voce ja esta na versao mais recente.'}</p>
                <button class="btn-modal primary" onclick="this.closest('.modal-overlay').remove()" style="background: linear-gradient(135deg, #10b981, #059669); display: block; margin: 0 auto;">Fechar</button>
            </div>
        `;
    }
    
    document.body.appendChild(overlay);
}

// ==========================================
// ASSISTENTE GLOBAL
// ==========================================