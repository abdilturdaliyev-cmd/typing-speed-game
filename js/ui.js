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
    }

    updateSentenceText(text) {
        this.sentenceBox.textContent = text;
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
        this.startBtn.style.opacity = isDisabled ? "0.5" : "1";
        this.startBtn.style.cursor = isDisabled ? "not-allowed" : "pointer";
    }

    setStartButtonLabel(label) {
        this.startBtn.textContent = label;
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
    }
}
