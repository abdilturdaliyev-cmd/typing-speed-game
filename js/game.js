const STORAGE_KEY = "typing-game-best-state-v1";
const DEFAULT_CATEGORY = "all";
const COUNTDOWN_GO_LABEL = "Go";
const DEFAULT_COUNTDOWN_SECONDS = 3;
const SESSION_MODES = {
    QUOTE: "quote",
    TIME_30: "30s",
    TIME_60: "60s"
};
const SESSION_MODE_LABELS = {
    [SESSION_MODES.QUOTE]: "Quote",
    [SESSION_MODES.TIME_30]: "30s",
    [SESSION_MODES.TIME_60]: "60s"
};
const TIMED_MODE_DURATIONS = {
    [SESSION_MODES.TIME_30]: 30,
    [SESSION_MODES.TIME_60]: 60
};
const SUPPORTED_CATEGORIES = new Set(["coding", "motivational", "general"]);

export class TypingGame {
    constructor(sentences) {
        this.sentences = this.normalizeSentences(sentences);
        this.selectedCategory = DEFAULT_CATEGORY;
        this.sessionMode = SESSION_MODES.QUOTE;
        this.stopOnError = false;

        this.currentSentence = "";
        this.currentSentenceCategory = DEFAULT_CATEGORY;
        this.typedText = "";
        this.completedTypedChars = 0;
        this.completedCorrectChars = 0;

        this.timerId = null;
        this.timeElapsed = 0;
        this.isPlaying = false;
        this.hasStartedTyping = false;
        this.tickHandler = null;

        this.countdownTimerId = null;
        this.countdownValue = 0;
        this.isCountingDown = false;
        this.countdownTickHandler = null;
        this.countdownCompleteHandler = null;

        this.roundStartTimeMs = 0;
        this.roundEndTimeMs = 0;
        this.currentRunTimeline = [];

        const persistedState = this.loadPersistedState();
        this.bestStats = persistedState.bestStats;
        this.ghostTimeline = persistedState.ghostTimeline;
        this.bestGhostWpm = persistedState.bestGhostWpm;
        this.bestGhostDuration = persistedState.bestGhostDuration;
    }

    setTickHandler(handler) {
        this.tickHandler = handler;
    }

    setCountdownTickHandler(handler) {
        this.countdownTickHandler = handler;
    }

    setCountdownCompleteHandler(handler) {
        this.countdownCompleteHandler = handler;
    }

    setSessionMode(mode) {
        this.sessionMode = this.normalizeSessionMode(mode);
        return this.sessionMode;
    }

    getSessionMode() {
        return this.sessionMode;
    }

    getSessionModeLabel() {
        return SESSION_MODE_LABELS[this.sessionMode] || SESSION_MODE_LABELS[SESSION_MODES.QUOTE];
    }

    isTimedMode() {
        return this.sessionMode !== SESSION_MODES.QUOTE;
    }

    isQuoteMode() {
        return this.sessionMode === SESSION_MODES.QUOTE;
    }

    setStopOnError(enabled) {
        this.stopOnError = Boolean(enabled);
        return this.stopOnError;
    }

    getStopOnError() {
        return this.stopOnError;
    }

    setCategory(category) {
        const normalizedCategory = this.normalizeSelectedCategory(category);

        if (normalizedCategory !== DEFAULT_CATEGORY) {
            const categorySentences = this.getSentencesByCategory(normalizedCategory);
            this.selectedCategory = categorySentences.length > 0 ? normalizedCategory : DEFAULT_CATEGORY;
            return this.selectedCategory;
        }

        this.selectedCategory = DEFAULT_CATEGORY;
        return this.selectedCategory;
    }

    getCategory() {
        return this.selectedCategory;
    }

    hasGhostData() {
        return this.ghostTimeline.length > 0;
    }

    isRoundActive() {
        return this.isPlaying;
    }

    start() {
        if (this.isPlaying) {
            return null;
        }

        if (this.sentences.length === 0) {
            this.reset();
            return {
                sentence: "",
                stats: this.getStats(),
                progress: 0,
                ghostProgress: null,
                bestStats: this.getBestStats(),
                modeLabel: this.getSessionModeLabel(),
                sessionMode: this.sessionMode,
                error: "NO_SENTENCES"
            };
        }

        this.stop();
        this.resetRoundState();

        const sentencePool = this.getActiveSentencePool();
        const randomSentence = this.getRandomSentence(sentencePool);
        this.currentSentence = randomSentence.text;
        this.currentSentenceCategory = randomSentence.category;
        this.isPlaying = true;

        const snapshot = this.getLiveSnapshot();

        return {
            sentence: this.currentSentence,
            category: this.currentSentenceCategory,
            activeCategory: this.selectedCategory,
            sessionMode: this.sessionMode,
            stopOnError: this.stopOnError,
            stats: snapshot.stats,
            progress: snapshot.progress,
            ghostProgress: snapshot.ghostProgress,
            bestStats: snapshot.bestStats,
            modeLabel: snapshot.modeLabel
        };
    }

    startCountdown(seconds = DEFAULT_COUNTDOWN_SECONDS) {
        if (!this.isPlaying) {
            return false;
        }

        this.stopCountdown();

        const safeSeconds = Number.isFinite(seconds) && seconds > 0
            ? Math.floor(seconds)
            : DEFAULT_COUNTDOWN_SECONDS;

        this.isCountingDown = true;
        this.countdownValue = safeSeconds;
        this.notifyCountdownTick(String(this.countdownValue));

        this.countdownTimerId = setInterval(() => {
            this.countdownValue -= 1;

            if (this.countdownValue > 0) {
                this.notifyCountdownTick(String(this.countdownValue));
                return;
            }

            this.stopCountdown();
            this.notifyCountdownTick(COUNTDOWN_GO_LABEL);

            if (this.isTimedMode()) {
                this.startTimer();
            }

            this.notifyCountdownComplete();
        }, 1000);

        return true;
    }

    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.stopCountdown();
        this.isPlaying = false;
    }

    stopCountdown() {
        if (this.countdownTimerId !== null) {
            clearInterval(this.countdownTimerId);
            this.countdownTimerId = null;
        }

        this.isCountingDown = false;
        this.countdownValue = 0;
    }

    reset() {
        this.stop();
        this.currentSentence = "";
        this.currentSentenceCategory = DEFAULT_CATEGORY;
        this.typedText = "";
        this.resetRoundState();
        return this.getStats();
    }

    handleTyping(typedText) {
        if (!this.isPlaying || this.isCountingDown) {
            return null;
        }

        const incomingText = typeof typedText === "string" ? typedText : "";

        if (this.stopOnError && !this.isPrefixMatch(incomingText, this.currentSentence)) {
            const blockedSnapshot = this.getLiveSnapshot();
            return {
                isComplete: false,
                isSessionComplete: false,
                sentenceChanged: false,
                sentence: this.currentSentence,
                typedText: this.typedText,
                correctedTypedText: this.typedText,
                blockedOnError: true,
                stats: blockedSnapshot.stats,
                progress: blockedSnapshot.progress,
                ghostProgress: blockedSnapshot.ghostProgress,
                bestStats: blockedSnapshot.bestStats,
                modeLabel: blockedSnapshot.modeLabel
            };
        }

        this.typedText = incomingText;

        if (!this.hasStartedTyping && this.typedText.length > 0) {
            this.hasStartedTyping = true;

            if (this.isQuoteMode()) {
                this.roundStartTimeMs = Date.now();
                this.roundEndTimeMs = 0;
                this.currentRunTimeline = [{ time: 0, progress: 0 }];
                this.startTimer();
            }
        }

        const correctChars = this.countCorrectCharacters();
        let progress = this.calculateProgress(correctChars);

        if (this.hasStartedTyping && this.isQuoteMode()) {
            this.recordProgressPoint(progress);
        }

        if (this.typedText === this.currentSentence && this.isTimedMode()) {
            this.commitCurrentSentence(correctChars);
            const nextSentence = this.getRandomSentence(this.getActiveSentencePool());
            this.currentSentence = nextSentence.text;
            this.currentSentenceCategory = nextSentence.category;
            this.typedText = "";
            progress = 0;

            const nextSnapshot = this.getLiveSnapshot();
            return {
                isComplete: false,
                isSessionComplete: false,
                sentenceChanged: true,
                sentence: this.currentSentence,
                typedText: this.typedText,
                correctedTypedText: this.typedText,
                blockedOnError: false,
                stats: nextSnapshot.stats,
                progress,
                ghostProgress: nextSnapshot.ghostProgress,
                bestStats: nextSnapshot.bestStats,
                modeLabel: nextSnapshot.modeLabel
            };
        }

        if (this.typedText === this.currentSentence && this.isQuoteMode()) {
            const finalState = this.finishSession("QUOTE_COMPLETE");
            return {
                isComplete: true,
                isSessionComplete: true,
                sentenceChanged: false,
                sentence: this.currentSentence,
                typedText: this.typedText,
                correctedTypedText: this.typedText,
                blockedOnError: false,
                stats: finalState.stats,
                progress: finalState.progress,
                ghostProgress: finalState.ghostProgress,
                bestStats: finalState.bestStats,
                modeLabel: finalState.modeLabel
            };
        }

        const snapshot = this.getLiveSnapshot();
        return {
            isComplete: false,
            isSessionComplete: false,
            sentenceChanged: false,
            sentence: this.currentSentence,
            typedText: this.typedText,
            correctedTypedText: this.typedText,
            blockedOnError: false,
            stats: snapshot.stats,
            progress: snapshot.progress,
            ghostProgress: snapshot.ghostProgress,
            bestStats: snapshot.bestStats,
            modeLabel: snapshot.modeLabel
        };
    }

    getStats(correctChars = this.countCorrectCharacters()) {
        const totalTyped = this.completedTypedChars + this.typedText.length;
        const totalCorrect = this.completedCorrectChars + correctChars;

        if (totalTyped === 0) {
            return {
                wpm: 0,
                time: this.timeElapsed,
                accuracy: 100
            };
        }

        const accuracy = this.calculateAccuracy(totalCorrect, totalTyped);
        const wpm = this.calculateWpm(totalCorrect);

        return {
            wpm,
            time: this.timeElapsed,
            accuracy
        };
    }

    getBestStats() {
        return {
            bestWPM: this.bestStats.bestWPM,
            bestAccuracy: this.bestStats.bestAccuracy,
            bestTime: this.bestStats.bestTime
        };
    }

    countCorrectCharacters() {
        let correctChars = 0;
        const compareLength = Math.min(this.typedText.length, this.currentSentence.length);

        for (let i = 0; i < compareLength; i += 1) {
            if (this.typedText[i] === this.currentSentence[i]) {
                correctChars += 1;
            }
        }

        return correctChars;
    }

    calculateAccuracy(correctChars, typedLength) {
        return Math.round((correctChars / typedLength) * 100);
    }

    calculateWpm(correctChars) {
        if (this.timeElapsed === 0) {
            return 0;
        }

        const wordsTyped = correctChars / 5;
        const minutesElapsed = this.timeElapsed / 60;
        return Math.round(wordsTyped / minutesElapsed);
    }

    calculateProgress(correctChars) {
        if (this.currentSentence.length === 0) {
            return 0;
        }

        const rawProgress = correctChars / this.currentSentence.length;
        return this.clampValue(rawProgress, 0, 1);
    }

    getCurrentGhostProgress() {
        if (!this.isQuoteMode() || this.ghostTimeline.length === 0) {
            return null;
        }

        const elapsedSeconds = this.hasStartedTyping ? this.getElapsedRoundSeconds() : 0;
        return this.getGhostProgressAt(elapsedSeconds);
    }

    getGhostProgressAt(timeElapsedSeconds) {
        if (this.ghostTimeline.length === 0) {
            return null;
        }

        if (timeElapsedSeconds <= this.ghostTimeline[0].time) {
            return this.ghostTimeline[0].progress;
        }

        for (let i = 1; i < this.ghostTimeline.length; i += 1) {
            const currentPoint = this.ghostTimeline[i];
            const previousPoint = this.ghostTimeline[i - 1];

            if (timeElapsedSeconds <= currentPoint.time) {
                const span = currentPoint.time - previousPoint.time;
                if (span <= 0) {
                    return currentPoint.progress;
                }

                const ratio = (timeElapsedSeconds - previousPoint.time) / span;
                const interpolatedProgress = previousPoint.progress
                    + ((currentPoint.progress - previousPoint.progress) * ratio);
                return this.clampValue(interpolatedProgress, 0, 1);
            }
        }

        return this.ghostTimeline[this.ghostTimeline.length - 1].progress;
    }

    getLiveSnapshot() {
        const correctChars = this.countCorrectCharacters();
        return {
            stats: this.getStats(correctChars),
            progress: this.calculateProgress(correctChars),
            ghostProgress: this.getCurrentGhostProgress(),
            bestStats: this.getBestStats(),
            modeLabel: this.getSessionModeLabel(),
            sessionMode: this.sessionMode
        };
    }

    getRandomSentence(sentencePool) {
        const randomIndex = Math.floor(Math.random() * sentencePool.length);
        return sentencePool[randomIndex];
    }

    getSentencesByCategory(category) {
        return this.sentences.filter((sentence) => sentence.category === category);
    }

    getActiveSentencePool() {
        if (this.selectedCategory === DEFAULT_CATEGORY) {
            return this.sentences;
        }

        const filteredSentences = this.getSentencesByCategory(this.selectedCategory);

        if (filteredSentences.length === 0) {
            this.selectedCategory = DEFAULT_CATEGORY;
            return this.sentences;
        }

        return filteredSentences;
    }

    startTimer() {
        if (!this.isPlaying || this.timerId !== null) {
            return;
        }

        if (this.roundStartTimeMs === 0) {
            this.roundStartTimeMs = Date.now();
            this.roundEndTimeMs = 0;
        }

        if (this.currentRunTimeline.length === 0 && this.isQuoteMode()) {
            this.currentRunTimeline.push({ time: 0, progress: 0 });
        }

        this.timerId = setInterval(() => {
            this.timeElapsed += 1;

            if (this.isTimedMode()) {
                const sessionDuration = this.getTimedDuration();

                if (this.timeElapsed >= sessionDuration) {
                    this.timeElapsed = sessionDuration;
                    const finalState = this.finishSession("TIME_UP");
                    this.notifyTick({
                        stats: finalState.stats,
                        progress: finalState.progress,
                        ghostProgress: finalState.ghostProgress,
                        bestStats: finalState.bestStats,
                        modeLabel: finalState.modeLabel,
                        sessionMode: this.sessionMode,
                        isSessionComplete: true
                    });
                    return;
                }
            }

            if (this.hasStartedTyping && this.isQuoteMode()) {
                const currentProgress = this.calculateProgress(this.countCorrectCharacters());
                this.recordProgressPoint(currentProgress);
            }

            this.notifyTick();
        }, 1000);
    }

    notifyTick(snapshot = this.getLiveSnapshot()) {
        if (this.tickHandler) {
            this.tickHandler({
                ...snapshot,
                isSessionComplete: Boolean(snapshot.isSessionComplete)
            });
        }
    }

    notifyCountdownTick(value) {
        if (this.countdownTickHandler) {
            this.countdownTickHandler(value);
        }
    }

    notifyCountdownComplete() {
        if (this.countdownCompleteHandler) {
            this.countdownCompleteHandler();
        }
    }

    commitCurrentSentence(correctChars) {
        this.completedTypedChars += this.typedText.length;
        this.completedCorrectChars += correctChars;
    }

    finishSession(reason) {
        this.roundEndTimeMs = Date.now();

        if (this.isQuoteMode() && this.hasStartedTyping) {
            this.recordProgressPoint(1);
        }

        this.stop();

        const stats = this.getStats();
        const hasBestStatsChanges = this.updateBestStats(stats);
        const hasGhostChanges = this.updateBestGhostTimeline(stats);

        if (hasBestStatsChanges || hasGhostChanges) {
            this.savePersistedState();
        }

        return {
            stats,
            progress: this.calculateProgress(this.countCorrectCharacters()),
            ghostProgress: this.getCurrentGhostProgress(),
            bestStats: this.getBestStats(),
            modeLabel: this.getSessionModeLabel(),
            reason
        };
    }

    recordProgressPoint(progress) {
        if (!this.hasStartedTyping) {
            return;
        }

        const roundedTime = Number(this.getElapsedRoundSeconds().toFixed(2));
        let safeProgress = Number(this.clampValue(progress, 0, 1).toFixed(4));

        if (this.currentRunTimeline.length === 0) {
            this.currentRunTimeline.push({ time: 0, progress: 0 });
        }

        const lastPoint = this.currentRunTimeline[this.currentRunTimeline.length - 1];
        safeProgress = Math.max(lastPoint.progress, safeProgress);

        if (roundedTime <= lastPoint.time) {
            lastPoint.progress = Math.max(lastPoint.progress, safeProgress);
            return;
        }

        this.currentRunTimeline.push({
            time: roundedTime,
            progress: safeProgress
        });
    }

    getElapsedRoundSeconds() {
        if (this.roundStartTimeMs === 0) {
            return 0;
        }

        const endTimeMs = this.roundEndTimeMs || Date.now();
        const elapsedMs = Math.max(0, endTimeMs - this.roundStartTimeMs);
        return elapsedMs / 1000;
    }

    updateBestStats(currentStats) {
        let hasChanges = false;

        if (currentStats.wpm > this.bestStats.bestWPM) {
            this.bestStats.bestWPM = currentStats.wpm;
            hasChanges = true;
        }

        if (currentStats.accuracy > this.bestStats.bestAccuracy) {
            this.bestStats.bestAccuracy = currentStats.accuracy;
            hasChanges = true;
        }

        if (this.isQuoteMode() && (this.bestStats.bestTime === 0 || currentStats.time < this.bestStats.bestTime)) {
            this.bestStats.bestTime = currentStats.time;
            hasChanges = true;
        }

        return hasChanges;
    }

    updateBestGhostTimeline(currentStats) {
        if (!this.isQuoteMode() || this.currentRunTimeline.length === 0) {
            return false;
        }

        const runDuration = this.getElapsedRoundSeconds();
        const shouldReplaceGhost = this.ghostTimeline.length === 0
            || currentStats.wpm > this.bestGhostWpm
            || (currentStats.wpm === this.bestGhostWpm && runDuration < this.bestGhostDuration);

        if (!shouldReplaceGhost) {
            return false;
        }

        this.ghostTimeline = this.currentRunTimeline.map((point) => ({
            time: point.time,
            progress: point.progress
        }));
        this.bestGhostWpm = currentStats.wpm;
        this.bestGhostDuration = runDuration;
        return true;
    }

    resetRoundState() {
        this.timeElapsed = 0;
        this.typedText = "";
        this.completedTypedChars = 0;
        this.completedCorrectChars = 0;
        this.hasStartedTyping = false;
        this.roundStartTimeMs = 0;
        this.roundEndTimeMs = 0;
        this.currentRunTimeline = [];
    }

    getTimedDuration() {
        if (!this.isTimedMode()) {
            return 0;
        }

        return TIMED_MODE_DURATIONS[this.sessionMode] || TIMED_MODE_DURATIONS[SESSION_MODES.TIME_30];
    }

    isPrefixMatch(typedText, expectedText) {
        if (typedText.length > expectedText.length) {
            return false;
        }

        for (let i = 0; i < typedText.length; i += 1) {
            if (typedText[i] !== expectedText[i]) {
                return false;
            }
        }

        return true;
    }

    normalizeSentences(sentenceData) {
        if (!Array.isArray(sentenceData)) {
            return [];
        }

        const normalizedSentences = [];

        for (const item of sentenceData) {
            if (typeof item === "string") {
                const text = item.trim();
                if (text.length > 0) {
                    normalizedSentences.push({
                        text,
                        category: "general"
                    });
                }
                continue;
            }

            if (!item || typeof item.text !== "string") {
                continue;
            }

            const text = item.text.trim();
            if (text.length === 0) {
                continue;
            }

            normalizedSentences.push({
                text,
                category: this.normalizeSentenceCategory(item.category)
            });
        }

        return normalizedSentences;
    }

    normalizeSessionMode(mode) {
        const normalized = typeof mode === "string" ? mode.trim().toLowerCase() : "";

        if (normalized === SESSION_MODES.TIME_30) {
            return SESSION_MODES.TIME_30;
        }

        if (normalized === SESSION_MODES.TIME_60) {
            return SESSION_MODES.TIME_60;
        }

        return SESSION_MODES.QUOTE;
    }

    normalizeSelectedCategory(category) {
        const normalized = typeof category === "string" ? category.trim().toLowerCase() : "";

        if (normalized === DEFAULT_CATEGORY) {
            return DEFAULT_CATEGORY;
        }

        return SUPPORTED_CATEGORIES.has(normalized) ? normalized : DEFAULT_CATEGORY;
    }

    normalizeSentenceCategory(category) {
        const normalized = typeof category === "string" ? category.trim().toLowerCase() : "";
        return SUPPORTED_CATEGORIES.has(normalized) ? normalized : "general";
    }

    clampValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    getLocalStorage() {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                return window.localStorage;
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    loadPersistedState() {
        const fallbackState = {
            bestStats: {
                bestWPM: 0,
                bestAccuracy: 0,
                bestTime: 0
            },
            ghostTimeline: [],
            bestGhostWpm: 0,
            bestGhostDuration: 0
        };

        const localStorageRef = this.getLocalStorage();

        if (!localStorageRef) {
            return fallbackState;
        }

        try {
            const rawData = localStorageRef.getItem(STORAGE_KEY);
            if (!rawData) {
                return fallbackState;
            }

            const parsedData = JSON.parse(rawData);

            return {
                bestStats: {
                    bestWPM: this.toSafeNumber(parsedData.bestWPM),
                    bestAccuracy: this.toSafeNumber(parsedData.bestAccuracy),
                    bestTime: this.toSafeNumber(parsedData.bestTime)
                },
                ghostTimeline: this.normalizeGhostTimeline(parsedData.ghostTimeline),
                bestGhostWpm: this.toSafeNumber(parsedData.bestGhostWpm),
                bestGhostDuration: this.toSafeNumber(parsedData.bestGhostDuration)
            };
        } catch (error) {
            return fallbackState;
        }
    }

    savePersistedState() {
        const localStorageRef = this.getLocalStorage();

        if (!localStorageRef) {
            return;
        }

        try {
            localStorageRef.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    bestWPM: this.bestStats.bestWPM,
                    bestAccuracy: this.bestStats.bestAccuracy,
                    bestTime: this.bestStats.bestTime,
                    bestGhostWpm: this.bestGhostWpm,
                    bestGhostDuration: Number(this.bestGhostDuration.toFixed(2)),
                    ghostTimeline: this.ghostTimeline
                })
            );
        } catch (error) {
            return;
        }
    }

    toSafeNumber(value) {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) {
            return 0;
        }

        return numericValue;
    }

    normalizeGhostTimeline(timeline) {
        if (!Array.isArray(timeline)) {
            return [];
        }

        const cleanedTimeline = [];

        for (const point of timeline) {
            if (!point) {
                continue;
            }

            const time = this.toSafeNumber(point.time);
            const progress = this.clampValue(this.toSafeNumber(point.progress), 0, 1);

            if (cleanedTimeline.length === 0) {
                cleanedTimeline.push({
                    time,
                    progress
                });
                continue;
            }

            const previousPoint = cleanedTimeline[cleanedTimeline.length - 1];

            if (time < previousPoint.time) {
                continue;
            }

            if (time === previousPoint.time) {
                previousPoint.progress = Math.max(previousPoint.progress, progress);
                continue;
            }

            cleanedTimeline.push({
                time,
                progress: Math.max(previousPoint.progress, progress)
            });
        }

        if (cleanedTimeline.length > 0 && cleanedTimeline[0].time > 0) {
            cleanedTimeline.unshift({ time: 0, progress: 0 });
        }

        return cleanedTimeline;
    }
}
