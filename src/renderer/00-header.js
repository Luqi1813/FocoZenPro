/**
 * FocoZen Pro — Renderer Header
 * Service references and module bootstrap.
 * Loaded first — establishes all service bridges.
 *
 * NOTE: Many sections reference HTML elements that no longer exist (Stats/Goals views
 * are now React). All references are safely guarded with ?. or if() checks.
 */

const constantsService = window.FocoZenConstants;
const storageService = window.FocoZenStorage;
const utilsService = window.FocoZenUtils;
const historyCore = window.FocoZenHistoryCore;
const goalsCore = window.FocoZenGoalsCore;
const timerCore = window.FocoZenTimerCore;
const pipService = window.FocoZenPipService;
const updateService = window.FocoZenUpdateService;
const audioService = window.FocoZenAudioService;
const taskSessionService = window.FocoZenTaskSessionService;

const assistantCore = window.FocoZenAssistantCore;
