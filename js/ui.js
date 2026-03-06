const DEFAULT_SENTENCE_TEXT = 'Click "Start" to reveal your sentence!';
const WAITING_PLACEHOLDER = "Waiting for you...";
const ACTIVE_PLACEHOLDER = "Type the text above...";
const COUNTDOWN_GO_LABEL = "Go";
const DEFAULT_BEST_STATS = {
    bestWPM: 0,
    bestAccuracy: 0,
    bestTime: 0
};

export class GameUI {
    constructor() {
        this.sentenceBox = document.getElementById("sentence-box");
        this.quoteModeSelect = document.getElementById("quote-mode");
        this.countdownOverlay = document.getElementById("countdown-overlay");
        this.inputField = document.getElementById("input-field");
        this.progressFill = document.getElementById("progress-fill");
        this.ghostMarker = document.getElementById("ghost-marker");
        this.startBtn = document.getElementById("start-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.wpmDisplay = document.getElementById("wpm");
        this.timeDisplay = document.getElementById("time");
        this.accuracyDisplay = document.getElementById("accuracy");
        this.resultsBox = document.getElementById("results");
        this.finalWpmDisplay = document.getElementById("final-wpm");
        this.finalAccuracyDisplay = document.getElementById("final-accuracy");
        this.finalTimeDisplay = document.getElementById("final-time");
        this.bestWpmDisplay = document.getElementById("best-wpm");
        this.bestAccuracyDisplay = document.getElementById("best-accuracy");
        this.bestTimeDisplay = document.getElementById("best-time");
        this.inputBaseHeight = this.inputField.offsetHeight;
        this.autoResizeInput();
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

    bindQuoteModeChange(handler) {
        this.quoteModeSelect.addEventListener("change", handler);
    }

    getSelectedCategory() {
        return this.quoteModeSelect.value;
    }

    setSelectedCategory(category) {
        this.quoteModeSelect.value = category;
    }

    updateSentenceText(text = DEFAULT_SENTENCE_TEXT) {
        this.sentenceBox.textContent = text;
    }

    createCharacterSpan(
        character,
        typedText,
        typedLength,
        charIndex,
        sentenceLength,
        mismatchLocked,
        isSpace = false
    ) {
        const charSpan = document.createElement("span");
        charSpan.classList.add("char");

        if (isSpace) {
            charSpan.classList.add("space-char");
        }

        charSpan.textContent = character;

        let isMismatch = false;
        let nextMismatchLocked = mismatchLocked;

        if (charIndex < typedLength) {
            const isCorrect = !mismatchLocked && typedText[charIndex] === character;
            charSpan.classList.add(isCorrect ? "correct" : "incorrect");
            isMismatch = !isCorrect;
            nextMismatchLocked = mismatchLocked || !isCorrect;
        } else if (charIndex === typedLength && typedLength < sentenceLength) {
            charSpan.classList.add("current");
        } else {
            charSpan.classList.add("pending");
        }

        return { charSpan, isMismatch, nextMismatchLocked };
    }

    renderSentence(sentence, typedText = "") {
        this.sentenceBox.textContent = "";

        const fragment = document.createDocumentFragment();
        const typedLength = typedText.length;
        const sentenceLength = sentence.length;
        let hasMismatch = false;
        let mismatchLocked = false;
        let charIndex = 0;

        const tokens = sentence.split(/(\s+)/);

        for (const token of tokens) {
            if (!token) {
                continue;
            }

            if (/^\s+$/.test(token)) {
                for (const spaceChar of token) {
                    const { charSpan, isMismatch, nextMismatchLocked } = this.createCharacterSpan(
                        spaceChar,
                        typedText,
                        typedLength,
                        charIndex,
                        sentenceLength,
                        mismatchLocked,
                        true
                    );

                    fragment.appendChild(charSpan);
                    hasMismatch = hasMismatch || isMismatch;
                    mismatchLocked = nextMismatchLocked;
                    charIndex += 1;
                }

                continue;
            }

            const wordSpan = document.createElement("span");
            wordSpan.classList.add("word");

            for (const character of token) {
                const { charSpan, isMismatch, nextMismatchLocked } = this.createCharacterSpan(
                    character,
                    typedText,
                    typedLength,
                    charIndex,
                    sentenceLength,
                    mismatchLocked
                );

                wordSpan.appendChild(charSpan);
                hasMismatch = hasMismatch || isMismatch;
                mismatchLocked = nextMismatchLocked;
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
        this.inputField.value = "";
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

    showResults({ wpm, accuracy, time }, bestStats = DEFAULT_BEST_STATS) {
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

    resetScreenState(bestStats = DEFAULT_BEST_STATS) {
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
}
