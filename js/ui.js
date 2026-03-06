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

        return { hasMismatch };
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
