export class TypingGame {
    constructor(sentences) {
        this.sentences = Array.isArray(sentences)
            ? sentences.filter((sentence) => typeof sentence === "string" && sentence.length > 0)
            : [];
        this.currentSentence = "";
        this.typedText = "";
        this.timerId = null;
        this.timeElapsed = 0;
        this.isPlaying = false;
        this.hasStartedTyping = false;
        this.tickHandler = null;
    }

    setTickHandler(handler) {
        this.tickHandler = handler;
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
                error: "NO_SENTENCES"
            };
        }

        this.stop();
        this.timeElapsed = 0;
        this.typedText = "";
        this.hasStartedTyping = false;
        this.currentSentence = this.getRandomSentence();
        this.isPlaying = true;

        return {
            sentence: this.currentSentence,
            stats: this.getStats()
        };
    }

    stop() {
        if (this.timerId !== null) {
            clearInterval(this.timerId);
            this.timerId = null;
        }

        this.isPlaying = false;
    }

    reset() {
        this.stop();
        this.currentSentence = "";
        this.typedText = "";
        this.timeElapsed = 0;
        this.hasStartedTyping = false;
        return this.getStats();
    }

    handleTyping(typedText) {
        if (!this.isPlaying) {
            return null;
        }

        this.typedText = typedText;

        if (!this.hasStartedTyping && this.typedText.length > 0) {
            this.hasStartedTyping = true;
            this.startTimer();
        }

        const isComplete = this.typedText === this.currentSentence;
        const stats = this.getStats();

        if (isComplete) {
            this.stop();
        }

        return { isComplete, stats };
    }

    getStats() {
        const typedLength = this.typedText.length;

        if (typedLength === 0) {
            return {
                wpm: 0,
                time: this.timeElapsed,
                accuracy: 100
            };
        }

        const correctChars = this.countCorrectCharacters();
        const accuracy = this.calculateAccuracy(correctChars, typedLength);
        const wpm = this.calculateWpm(correctChars);

        return {
            wpm,
            time: this.timeElapsed,
            accuracy
        };
    }

    countCorrectCharacters() {
        let correctChars = 0;

        for (let i = 0; i < this.typedText.length; i += 1) {
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

    getRandomSentence() {
        const randomIndex = Math.floor(Math.random() * this.sentences.length);
        return this.sentences[randomIndex];
    }

    startTimer() {
        if (!this.isPlaying || this.timerId !== null) {
            return;
        }

        this.timerId = setInterval(() => {
            this.timeElapsed += 1;
            this.notifyTick();
        }, 1000);
    }

    notifyTick() {
        if (this.tickHandler) {
            this.tickHandler(this.getStats());
        }
    }
}
