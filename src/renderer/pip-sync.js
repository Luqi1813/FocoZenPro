function setupPipActions() {
    if (pipService?.onAction) {
        pipService.onAction((action, data) => {
            if (action === 'toggle-play') toggleTimer();
            else if (action === 'reset') resetTimer();
            else if (action === 'reset-timer') resetTimer();
            else if (action === 'toggle-audio') toggleMasterPlay();
            else if (action === 'change-sound') {
                const targetSound = soundsConfig.find(s => s.id === data);
                if (targetSound) selectSound(targetSound);
            }
            else if (action === 'start-phase') {
                startPhase(data);
            }
            else if (action === 'restore-app') {
                isPipModeActive = false;
                renderTasksSidebar();
                if (pendingCompletionType) {
                    const comp = pendingCompletionType;
                    pendingCompletionType = null;
                    setTimeout(() => {
                        if (comp === 'task-complete' && currentTask) {
                            showTaskCompletionPopup(comp);
                        } else if (comp === 'focus-complete') {
                            showTransitionModal('break');
                        } else if (comp === 'break-complete') {
                            showTransitionModal('focus');
                        }
                    }, 500);
                }
            }
            else if (action === 'dismiss-completion') {
                pendingCompletionType = null;
                pendingTaskResolution = null;
            }
            else if (action === 'task-concluded') {
                handleTaskConcludedFlow({ fromPip: true });
            }
            else if (action === 'task-add-time') {
                syncStateToPip({ showAddTimePopup: true });
            }
            else if (action === 'task-continue-later') {
                handleRestartLaterFlow({ fromPip: true });
            }
            else if (action === 'confirm-add-time') {
                addTimeToCurrentTask(data || 5);
            }
            else if (action === 'confirmed-continue-later') {
                syncStateToPip({ hideCompletion: true });
            }
            else if (action === 'task-discard') {
                // Desistir da tarefa - desseleciona e minimiza o PiP
                if (currentTask) {
                    currentTask.completed = false;
                    currentTask.completedPomodoros = 0;
                    saveTasks(); renderProgress(); renderTasksSidebar(); renderTasksList();
                }
                pendingCompletionType = null;
                pendingTaskResolution = null;
                deselectTask();
                syncStateToPip({ hideCompletion: true });
                // Minimizar o PiP sem fechar o programa
                pipService?.requestMinimizeToTray?.();
            }
            else if (action === 'set-volume') {
                const parsedVolume = Number(data);
                if (Number.isNaN(parsedVolume)) return;
                audioService?.setVolume?.(parsedVolume);
            }
        });
    }
}

function syncStateToPip(extraState = {}) {
    if (!pipService?.sendState) {
        if (isPipModeActive) console.warn('[PIP] Nao e possivel enviar estado: pipService.sendState ausente');
        return;
    }

    try {
        const timeString = timerCore?.formatTimerLabel
            ? timerCore.formatTimerLabel(timeLeft)
            : (utilsService?.formatClockTime
                ? utilsService.formatClockTime(timeLeft)
                : `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`);

        const progress = timerCore?.getTimerProgress
            ? timerCore.getTimerProgress({ timeLeft, totalTime: totalTimerTime })
            : (utilsService?.calculateProgressPercentage
                ? utilsService.calculateProgressPercentage({ timeLeft, totalTime: totalTimerTime })
                : (totalTimerTime > 0 ? ((totalTimerTime - timeLeft) / totalTimerTime) * 100 : 0));

        const activeCard = document.querySelector('.sound-card.active span');
        const soundName = activeCard ? activeCard.textContent : 'Silêncio';

        const taskName = currentTask ? currentTask.name : 'Sessao Livre';
        const soundObj = soundsConfig.find(s => s.id === currentSoundId);
        const bgImage = soundObj ? soundObj.image : 'default.jpg';
        const theme = soundThemes[currentSoundId] || 'default';

        pipService.sendState({
            timeString, progress, phase: currentMode,
            isRunning: isTimerRunning, soundName, isAudioPlaying: isPlaying,
            taskName, bgImage, theme, masterVolume, hasActiveTask: !!currentTask, ...extraState
        });
    } catch (err) {
        console.error("Erro ao sincronizar PIP:", err);
    }
}
