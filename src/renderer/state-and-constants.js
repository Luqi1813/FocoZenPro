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

const storageKeys = storageService.storageKeys;

const soundsConfig = constantsService.soundsConfig;
const soundCategories = constantsService.soundCategories;
const soundThemes = constantsService.soundThemes;
const quotes = constantsService.quotes;
const successQuotes = constantsService.successQuotes;
const POMODORO_MINUTES = constantsService.POMODORO_MINUTES;
const SHORT_BREAK_MINUTES = constantsService.SHORT_BREAK_MINUTES;
const LONG_BREAK_MINUTES = constantsService.LONG_BREAK_MINUTES;
const defaultCategories = constantsService.defaultCategories;
let userCategories = [];
let isEditingCategories = false;

let currentAudio = null;
let currentSoundId = null;
let isPlaying = false;
let masterVolume = 0.7;
let isMuted = false;
let volumeBeforeMute = 0.7;
let timerInterval = null;
let timeLeft = POMODORO_MINUTES * 60;
let isTimerRunning = false;
let totalTimerTime = POMODORO_MINUTES * 60;
let currentMode = 'focus';

let tasks = [];
let currentTask = null;
let username = 'Convidado';
let focusHistory = [];
let focusGoals = [];
let completedPomodoros = 0;
let totalPomodorosToday = 0;
let isDeleteMode = false;
let selectedTasksForDelete = new Set();
let tempSubtasks = [];
let editingTaskId = null;
let editingGoalId = null;
let showBubbleText = true;
let isPipModeActive = false;
let toastHideTimer = null;
let testMode = false;
let pendingCompletionType = null;
let pendingTaskResolution = null;
let feedbackPopupTimer = null;
let assistantMessages = [];
let assistantSuggestions = [];
let isAssistantOpen = false;
let assistantConversationState = null;

const GOALS_RUNTIME_CHANGE_EVENT = 'focozen:goals-runtime-change';
const GOALS_RUNTIME_EDIT_EVENT = 'focozen:goals-runtime-edit';
const STATS_RUNTIME_CHANGE_EVENT = 'focozen:stats-runtime-change';
const ASSISTANT_RUNTIME_CHANGE_EVENT = 'focozen:assistant-runtime-change';
const HOME_RUNTIME_CHANGE_EVENT = 'focozen:home-runtime-change';
const TIMER_RUNTIME_CHANGE_EVENT = 'focozen:timer-runtime-change';
const TASKS_RUNTIME_CHANGE_EVENT = 'focozen:tasks-runtime-change';

