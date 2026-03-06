const DEFAULT_SENTENCE_TEXT = 'Click "Start" to reveal your sentence!';
const WAITING_PLACEHOLDER = "Waiting for you...";
const ACTIVE_PLACEHOLDER = "Type the text above...";

export class GameUI {
    constructor() {
        this.sentenceBox = document.getElementById("sentence-box");
        this.inputField = document.getElementById("input-field");
        this.startBtn = document.getElementById("start-btn");
        this.resetBtn = document.getElementById("reset-btn");
        this.wpmDisplay = document.getElementById("wpm");
        this.timeDisplay = document.getElementById("time");
        this.accuracyDisplay = document.getElementById("accuracy");
        this.resultsBox = document.getElementById("results");
        this.finalWpmDisplay = document.getElementById("final-wpm");
        this.finalAccuracyDisplay = document.getElementById("final-accuracy");
        this.finalTimeDisplay = document.getElementById("final-time");
    }

    bindStart(handler) {
        this.startBtn.addEventListener("click", handler);
    }

    bindReset(handler) {
        this.resetBtn.addEventListener("click", handler);
    }

    bindTyping(handler) {
        this.inputField.addEventListener("input", handler);
    }

    updateSentenceText(text = DEFAULT_SENTENCE_TEXT) {
        this.sentenceBox.textContent = text;
    }

    renderSentence(sentence, typedText = "") {
        this.sentenceBox.textContent = "";

        const fragment = document.createDocumentFragment();
        const typedLength = typedText.length;

        for (let i = 0; i < sentence.length; i += 1) {
            const charSpan = document.createElement("span");
            charSpan.classList.add("char");
            charSpan.textContent = sentence[i];

            if (i < typedLength) {
                charSpan.classList.add(typedText[i] === sentence[i] ? "correct" : "incorrect");
            } else if (i === typedLength && typedLength < sentence.length) {
                charSpan.classList.add("current");
            } else {
                charSpan.classList.add("pending");
            }

            fragment.appendChild(charSpan);
        }

        this.sentenceBox.appendChild(fragment);
    }

    updateStats({ wpm, time, accuracy }) {
        this.wpmDisplay.textContent = wpm;
        this.timeDisplay.textContent = time;
        this.accuracyDisplay.textContent = accuracy;
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

    showResults({ wpm, accuracy, time }) {
        this.finalWpmDisplay.textContent = wpm;
        this.finalAccuracyDisplay.textContent = accuracy;
        this.finalTimeDisplay.textContent = time;
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

    resetScreenState() {
        this.updateSentenceText(DEFAULT_SENTENCE_TEXT);
        this.clearInput();
        this.disableInput();
        this.inputField.placeholder = WAITING_PLACEHOLDER;
        this.clearInputClasses();
        this.setStartButtonDisabled(false);
        this.setStartButtonLabel("Start");
        this.updateStats({ wpm: 0, time: 0, accuracy: 100 });
        this.clearResults();
        this.hideResults();
    }
}
