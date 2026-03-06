const DEFAULT_SENTENCE_TEXT = 'Click "Start" to reveal your sentence!';
const WAITING_PLACEHOLDER = "Waiting for you...";
const ACTIVE_PLACEHOLDER = "Type the text above...";
const COUNTDOWN_GO_LABEL = "Go";
const DEFAULT_MODE_LABEL = "Quote";
const SOUND_SETTING_STORAGE_KEY = "typing-game-sound-enabled-v1";
const DEFAULT_BEST_STATS = {
    bestWPM: 0,
    bestAccuracy: 0,
    bestTime: 0
};

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.lastPlaybackTimes = {
            correct: 0,
            error: 0,
            complete: 0
        };
        this.cooldowns = {
            correct: 45,
            error: 80,
            complete: 300
        };
    }

    setEnabled(enabled) {
        this.isEnabled = Boolean(enabled);
    }

    prime() {
        if (!this.isEnabled) {
            return;
        }

        const context = this.getContext();

        if (!context) {
            return;
        }

        if (context.state === "suspended") {
            context.resume().catch(() => { });
        }
    }

    playCorrect() {
        if (!this.canPlay("correct")) {
            return;
        }

        this.playTone({
            frequency: 740,
            endFrequency: 860,
            duration: 0.04,
            volume: 0.02,
            type: "triangle"
        });
    }

    playError() {
        if (!this.canPlay("error")) {
            return;
        }

        this.playTone({
            frequency: 240,
            endFrequency: 180,
            duration: 0.08,
            volume: 0.022,
            type: "sine"
        });
    }

    playComplete() {
        if (!this.canPlay("complete")) {
            return;
        }

        this.playTone({
            frequency: 520,
            endFrequency: 620,
            duration: 0.07,
            volume: 0.025,
            type: "sine",
            startDelay: 0
        });
        this.playTone({
            frequency: 700,
            endFrequency: 860,
            duration: 0.09,
            volume: 0.028,
            type: "triangle",
            startDelay: 0.09
        });
    }

    canPlay(soundType) {
        if (!this.isEnabled) {
            return false;
        }

        const now = this.getNowMs();
        const previousPlayTime = this.lastPlaybackTimes[soundType] || 0;
        const cooldown = this.cooldowns[soundType] || 0;

        if (now - previousPlayTime < cooldown) {
            return false;
        }

        this.lastPlaybackTimes[soundType] = now;
        return true;
    }

    playTone({
        frequency,
        endFrequency = frequency,
        duration = 0.05,
        volume = 0.02,
        type = "sine",
        startDelay = 0
    }) {
        const context = this.getContext();

        if (!context) {
            return;
        }

        if (context.state === "suspended") {
            context.resume().catch(() => { });
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startTime = context.currentTime + Math.max(0, startDelay);
        const endTime = startTime + Math.max(0.02, duration);
        const attackTime = Math.min(startTime + 0.01, endTime);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.linearRampToValueAtTime(endFrequency, endTime);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(startTime);
        oscillator.stop(endTime + 0.02);
    }

    getContext() {
        if (typeof window === "undefined") {
            return null;
        }

        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextConstructor) {
            return null;
        }

        if (!this.audioContext) {
            this.audioContext = new AudioContextConstructor();
        }

        return this.audioContext;
    }

    getNowMs() {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
            return performance.now();
        }

        return Date.now();
    }
}

export class GameUI {
    constructor() {
        this.sentenceBox = document.getElementById("sentence-box");
        this.sessionModeSelect = document.getElementById("session-mode");
        this.quoteCategoryWrap = document.getElementById("quote-category-wrap");
        this.quoteModeSelect = document.getElementById("quote-mode");
        this.stopOnErrorToggle = document.getElementById("stop-on-error");
        this.soundToggle = document.getElementById("sound-enabled");
        this.soundState = document.getElementById("sound-state");
        this.countdownOverlay = document.getElementById("countdown-overlay");
        this.inputField = document.getElementById("input-field");
        this.progressFill = document.getElementById("progress-fill");
        this.ghostMarker = document.getElementById("ghost-marker");
        this.ghostLegend = document.getElementById("ghost-legend");
        this.bestInlineWpm = document.getElementById("best-inline-wpm");
        this.startBtn = document.getElementById("start-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.wpmDisplay = document.getElementById("wpm");
        this.timeDisplay = document.getElementById("time");
        this.accuracyDisplay = document.getElementById("accuracy");
        this.resultsBox = document.getElementById("results");
        this.finalModeDisplay = document.getElementById("final-mode");
        this.finalWpmDisplay = document.getElementById("final-wpm");
        this.finalAccuracyDisplay = document.getElementById("final-accuracy");
        this.finalTimeDisplay = document.getElementById("final-time");
        this.bestWpmDisplay = document.getElementById("best-wpm");
        this.bestAccuracyDisplay = document.getElementById("best-accuracy");
        this.bestTimeDisplay = document.getElementById("best-time");
        this.soundManager = new SoundManager();
        this.inputBaseHeight = this.inputField.offsetHeight;
        this.autoResizeInput();
        const isSoundEnabled = this.loadSoundPreference();
        this.setSoundEnabled(isSoundEnabled, false);
    }

    bindStart(handler) {
        this.startBtn.addEventListener("click", handler);
    }

    bindReset(handler) {
        this.resetBtn.addEventListener("click", handler);
    }

    bindTyping(handler) {
        this.inputField.addEventListener("input", () => {
            this.autoResizeInput();
            handler();
        });
    }

    bindSessionModeChange(handler) {
        this.sessionModeSelect.addEventListener("change", handler);
    }

    bindQuoteModeChange(handler) {
        this.quoteModeSelect.addEventListener("change", handler);
    }

    bindStopOnErrorChange(handler) {
        this.stopOnErrorToggle.addEventListener("change", handler);
    }

    bindSoundChange(handler) {
        if (!this.soundToggle) {
            return;
        }

        this.soundToggle.addEventListener("change", () => {
            const isEnabled = this.soundToggle.checked;
            this.setSoundEnabled(isEnabled);

            if (typeof handler === "function") {
                handler(isEnabled);
            }
        });
    }

    getSelectedSessionMode() {
        return this.sessionModeSelect.value;
    }

    setSelectedSessionMode(mode) {
        this.sessionModeSelect.value = mode;
    }

    getSelectedCategory() {
        return this.quoteModeSelect.value;
    }

    setSelectedCategory(category) {
        this.quoteModeSelect.value = category;
    }

    isStopOnErrorEnabled() {
        return this.stopOnErrorToggle.checked;
    }

    setStopOnErrorEnabled(enabled) {
        this.stopOnErrorToggle.checked = Boolean(enabled);
    }

    isSoundEnabled() {
        return Boolean(this.soundToggle && this.soundToggle.checked);
    }

    setSoundEnabled(enabled, shouldPersist = true) {
        const safeEnabled = Boolean(enabled);

        if (this.soundToggle) {
            this.soundToggle.checked = safeEnabled;
        }

        if (this.soundState) {
            this.soundState.textContent = safeEnabled ? "On" : "Off";
        }

        this.soundManager.setEnabled(safeEnabled);

        if (shouldPersist) {
            this.saveSoundPreference(safeEnabled);
        }
    }

    setQuoteCategoryEnabled(isEnabled) {
        this.quoteModeSelect.disabled = !isEnabled;
        this.quoteCategoryWrap.classList.toggle("disabled-setting", !isEnabled);
    }

    primeAudio() {
        this.soundManager.prime();
    }

    playCorrectSound() {
        this.soundManager.playCorrect();
    }

    playErrorSound() {
        this.soundManager.playError();
    }

    playCompleteSound() {
        this.soundManager.playComplete();
    }

    updateSentenceText(text = DEFAULT_SENTENCE_TEXT) {
        this.sentenceBox.textContent = text;
    }

    createCharacterSpan(character, typedText, typedLength, charIndex, sentenceLength, isSpace = false) {
        const charSpan = document.createElement("span");
        charSpan.classList.add("char");

        if (isSpace) {
            charSpan.classList.add("space-char");
        }

        charSpan.textContent = character;

        let isMismatch = false;

        if (charIndex < typedLength) {
            const isCorrect = typedText[charIndex] === character;
            charSpan.classList.add(isCorrect ? "correct" : "incorrect");
            isMismatch = !isCorrect;
        } else if (charIndex === typedLength && typedLength < sentenceLength) {
            charSpan.classList.add("current");
        } else {
            charSpan.classList.add("pending");
        }

        return { charSpan, isMismatch };
    }

    renderSentence(sentence, typedText = "") {
        this.sentenceBox.textContent = "";

        const fragment = document.createDocumentFragment();
        const typedLength = typedText.length;
        const sentenceLength = sentence.length;
        let hasMismatch = false;
        let charIndex = 0;

        const tokens = sentence.split(/(\s+)/);

        for (const token of tokens) {
            if (!token) {
                continue;
            }

            if (/^\s+$/.test(token)) {
                for (const spaceChar of token) {
                    const { charSpan, isMismatch } = this.createCharacterSpan(
                        spaceChar,
                        typedText,
                        typedLength,
                        charIndex,
                        sentenceLength,
                        true
                    );

                    fragment.appendChild(charSpan);
                    hasMismatch = hasMismatch || isMismatch;
                    charIndex += 1;
                }

                continue;
            }

            const wordSpan = document.createElement("span");
            wordSpan.classList.add("word");

            for (const character of token) {
                const { charSpan, isMismatch } = this.createCharacterSpan(
                    character,
                    typedText,
                    typedLength,
                    charIndex,
                    sentenceLength
                );

                wordSpan.appendChild(charSpan);
                hasMismatch = hasMismatch || isMismatch;
                charIndex += 1;
            }

            fragment.appendChild(wordSpan);
        }

        this.sentenceBox.appendChild(fragment);

        if (typedLength > sentenceLength) {
            hasMismatch = true;
        }

        this.keepCurrentCharacterVisible();

        return { hasMismatch };
    }

    updateStats({ wpm, time, accuracy }) {
        this.wpmDisplay.textContent = wpm;
        this.timeDisplay.textContent = time;
        this.accuracyDisplay.textContent = accuracy;
    }

    updateProgress(progressRatio) {
        const progressPercent = this.toPercent(progressRatio);
        this.progressFill.style.width = `${progressPercent}%`;
    }

    updateGhostProgress(progressRatio) {
        if (!Number.isFinite(progressRatio)) {
            this.ghostMarker.classList.add("hidden");
            return;
        }

        const progressPercent = this.toPercent(progressRatio);
        this.ghostMarker.style.left = `${progressPercent}%`;
        this.ghostMarker.classList.remove("hidden");
    }

    updateRunHints(bestStats = DEFAULT_BEST_STATS, modeLabel = DEFAULT_MODE_LABEL, hasGhostPace = false) {
        const safeBestWpm = Number.isFinite(bestStats.bestWPM) ? Math.round(bestStats.bestWPM) : 0;
        this.bestInlineWpm.textContent = safeBestWpm;

        if (modeLabel !== "Quote") {
            this.ghostLegend.textContent = "Ghost pace: available in Quote mode";
            return;
        }

        this.ghostLegend.textContent = hasGhostPace
            ? "Ghost pace: your best run pace (thin marker on progress bar)"
            : "Ghost pace: complete one quote run to enable";
    }

    resetProgress() {
        this.updateProgress(0);
        this.updateGhostProgress(null);
    }

    showCountdown(value) {
        this.countdownOverlay.textContent = value;
        this.countdownOverlay.classList.toggle("go", value === COUNTDOWN_GO_LABEL);
        this.countdownOverlay.classList.remove("hidden");
    }

    hideCountdown() {
        this.countdownOverlay.textContent = "";
        this.countdownOverlay.classList.remove("go");
        this.countdownOverlay.classList.add("hidden");
    }

    enableInput(placeholder = ACTIVE_PLACEHOLDER) {
        this.inputField.disabled = false;
        this.inputField.placeholder = placeholder;
    }

    disableInput() {
        this.inputField.disabled = true;
    }

    clearInput() {
        this.setInputValue("");
    }

    setInputValue(value) {
        this.inputField.value = value;
        this.autoResizeInput();
    }

    getInputValue() {
        return this.inputField.value;
    }

    focusInput() {
        this.inputField.focus();
    }

    setInputError(hasError) {
        this.inputField.classList.toggle("error", hasError);
    }

    setInputSuccess(hasSuccess) {
        this.inputField.classList.toggle("success", hasSuccess);
    }

    clearInputClasses() {
        this.inputField.classList.remove("success", "error");
    }

    setStartButtonDisabled(isDisabled) {
        this.startBtn.disabled = isDisabled;
    }

    setStartButtonLabel(label) {
        this.startBtn.textContent = label;
    }

    showResults({ wpm, accuracy, time }, bestStats = DEFAULT_BEST_STATS, modeLabel = DEFAULT_MODE_LABEL) {
        this.finalModeDisplay.textContent = modeLabel;
        this.finalWpmDisplay.textContent = wpm;
        this.finalAccuracyDisplay.textContent = accuracy;
        this.finalTimeDisplay.textContent = time;
        this.updateBestStats(bestStats);
        this.resultsBox.classList.remove("hidden");
    }

    hideResults() {
        this.resultsBox.classList.add("hidden");
    }

    clearResults() {
        this.finalModeDisplay.textContent = DEFAULT_MODE_LABEL;
        this.finalWpmDisplay.textContent = "0";
        this.finalAccuracyDisplay.textContent = "100";
        this.finalTimeDisplay.textContent = "0";
    }

    updateBestStats(bestStats = DEFAULT_BEST_STATS) {
        const safeBestWpm = Number.isFinite(bestStats.bestWPM) ? Math.round(bestStats.bestWPM) : 0;
        const safeBestAccuracy = Number.isFinite(bestStats.bestAccuracy)
            ? Math.round(bestStats.bestAccuracy)
            : 0;
        const safeBestTime = Number.isFinite(bestStats.bestTime) ? Math.round(bestStats.bestTime) : 0;

        this.bestWpmDisplay.textContent = safeBestWpm;
        this.bestAccuracyDisplay.textContent = safeBestAccuracy;
        this.bestTimeDisplay.textContent = safeBestTime > 0 ? `${safeBestTime}s` : "--";
    }

    resetScreenState(bestStats = DEFAULT_BEST_STATS, modeLabel = DEFAULT_MODE_LABEL, hasGhostPace = false) {
        this.updateSentenceText(DEFAULT_SENTENCE_TEXT);
        this.clearInput();
        this.disableInput();
        this.inputField.placeholder = WAITING_PLACEHOLDER;
        this.clearInputClasses();
        this.setStartButtonDisabled(false);
        this.setStartButtonLabel("Start");
        this.updateStats({ wpm: 0, time: 0, accuracy: 100 });
        this.resetProgress();
        this.hideCountdown();
        this.clearResults();
        this.updateBestStats(bestStats);
        this.updateRunHints(bestStats, modeLabel, hasGhostPace);
        this.hideResults();
    }

    autoResizeInput() {
        this.inputField.style.height = "auto";
        const targetHeight = Math.max(this.inputBaseHeight, this.inputField.scrollHeight);
        this.inputField.style.height = `${targetHeight}px`;
    }

    keepCurrentCharacterVisible() {
        const currentCharacter = this.sentenceBox.querySelector(".char.current");

        if (currentCharacter) {
            currentCharacter.scrollIntoView({ block: "nearest", inline: "center" });
        }
    }

    toPercent(value) {
        if (!Number.isFinite(value)) {
            return 0;
        }

        const percent = value * 100;
        return Math.max(0, Math.min(100, percent));
    }

    getLocalStorageRef() {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                return window.localStorage;
            }
        } catch (error) {
            return null;
        }

        return null;
    }

    loadSoundPreference() {
        const localStorageRef = this.getLocalStorageRef();

        if (!localStorageRef) {
            return false;
        }

        try {
            const rawValue = localStorageRef.getItem(SOUND_SETTING_STORAGE_KEY);
            return rawValue === "true";
        } catch (error) {
            return false;
        }
    }

    saveSoundPreference(isEnabled) {
        const localStorageRef = this.getLocalStorageRef();

        if (!localStorageRef) {
            return;
        }

        try {
            localStorageRef.setItem(SOUND_SETTING_STORAGE_KEY, String(Boolean(isEnabled)));
        } catch (error) {
            return;
        }
    }
}
