import { sentences } from "./data.js";
import { TypingGame } from "./game.js";
import { GameUI } from "./ui.js";

const game = new TypingGame(sentences);
const ui = new GameUI();
let activeSentence = "";
let countdownHideTimeoutId = null;
let isRoundFinalized = false;

game.setTickHandler((snapshot) => {
    ui.updateStats(snapshot.stats);
    ui.updateProgress(snapshot.progress);
    ui.updateGhostProgress(snapshot.ghostProgress);
    ui.updateRunHints(snapshot.bestStats, snapshot.modeLabel, Number.isFinite(snapshot.ghostProgress));

    if (snapshot.isSessionComplete) {
        finalizeRound(snapshot.stats, snapshot.bestStats, snapshot.modeLabel);
    }
});

game.setCountdownTickHandler((countValue) => {
    ui.showCountdown(countValue);
});

game.setCountdownCompleteHandler(() => {
    ui.enableInput();
    ui.focusInput();
    ui.setStartButtonLabel("Typing...");

    clearCountdownHideTimeout();
    countdownHideTimeoutId = setTimeout(() => {
        ui.hideCountdown();
    }, 350);
});

function startGame() {
    ui.primeAudio();
    clearCountdownHideTimeout();
    isRoundFinalized = false;

    const startResult = game.start();

    if (!startResult) {
        return;
    }

    if (startResult.error === "NO_SENTENCES") {
        activeSentence = "";
        ui.updateSentenceText("No sentences available. Add items in js/data.js.");
        ui.clearInput();
        ui.disableInput();
        ui.hideCountdown();
        ui.clearInputClasses();
        ui.updateStats(startResult.stats);
        ui.updateProgress(0);
        ui.updateGhostProgress(null);
        ui.clearResults();
        ui.updateBestStats(startResult.bestStats);
        ui.updateRunHints(startResult.bestStats, startResult.modeLabel, false);
        ui.hideResults();
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Start");
        return;
    }

    activeSentence = startResult.sentence;
    ui.setSelectedSessionMode(startResult.sessionMode);
    ui.setSelectedCategory(startResult.activeCategory);
    ui.setStopOnErrorEnabled(startResult.stopOnError);
    ui.setQuoteCategoryEnabled(startResult.sessionMode === "quote");
    ui.renderSentence(activeSentence);
    ui.clearInput();
    ui.clearInputClasses();
    ui.disableInput();
    ui.updateStats(startResult.stats);
    ui.updateProgress(startResult.progress);
    ui.updateGhostProgress(startResult.ghostProgress);
    ui.updateRunHints(startResult.bestStats, startResult.modeLabel, Number.isFinite(startResult.ghostProgress));
    ui.clearResults();
    ui.hideResults();
    ui.setStartButtonDisabled(true);
    ui.setStartButtonLabel("Starting...");

    game.startCountdown(3);
}

function handleTyping(event) {
    const expectedText = activeSentence;
    const result = game.handleKeyInput(event);

    if (!result) {
        return;
    }

    if (result.shouldPreventDefault) {
        event.preventDefault();
    }

    ui.clearInput();
    playTypingSoundFeedback(result, expectedText);

    if (result.sentenceChanged) {
        activeSentence = result.sentence;
    }

    ui.renderSentence(activeSentence, result.typedText);
    ui.setInputError(result.hasError);
    ui.updateStats(result.stats);
    ui.updateProgress(result.progress);
    ui.updateGhostProgress(result.ghostProgress);
    ui.updateRunHints(result.bestStats, result.modeLabel, Number.isFinite(result.ghostProgress));

    if (result.isSessionComplete) {
        finalizeRound(result.stats, result.bestStats, result.modeLabel);
    }
}

function playTypingSoundFeedback(result, expectedText) {
    if (result.inputType !== "character") {
        return;
    }

    if (result.blockedOnError) {
        ui.playErrorSound();
        return;
    }

    if (!result.typedTextChanged) {
        return;
    }

    const safeExpectedText = typeof expectedText === "string" ? expectedText : "";
    const newestCharIndex = result.sentenceChanged
        ? Math.max(0, safeExpectedText.length - 1)
        : Math.max(0, result.typedText.length - 1);
    const typedCharacter = result.typedCharacter;
    const expectedCharacter = safeExpectedText[newestCharIndex];

    if (typedCharacter === expectedCharacter) {
        ui.playCorrectSound();
        return;
    }

    ui.playErrorSound();
}

function finalizeRound(stats, bestStats, modeLabel) {
    if (isRoundFinalized) {
        return;
    }

    isRoundFinalized = true;
    ui.playCompleteSound();
    ui.disableInput();
    ui.setInputError(false);
    ui.setInputSuccess(stats.accuracy === 100);
    ui.setStartButtonDisabled(false);
    ui.setStartButtonLabel("Play Again");
    ui.showResults(stats, bestStats, modeLabel);
}

function resetGame() {
    clearCountdownHideTimeout();
    isRoundFinalized = false;
    game.reset();
    activeSentence = "";
    ui.setSelectedSessionMode(game.getSessionMode());
    ui.setSelectedCategory(game.getCategory());
    ui.setStopOnErrorEnabled(game.getStopOnError());
    ui.setQuoteCategoryEnabled(game.getSessionMode() === "quote");
    ui.resetScreenState(game.getBestStats(), game.getSessionModeLabel(), game.hasGhostData());
}

function handleSessionModeChange() {
    const selectedMode = ui.getSelectedSessionMode();
    game.setSessionMode(selectedMode);
    resetGame();
}

function handleQuoteModeChange() {
    const selectedCategory = ui.getSelectedCategory();
    const activeCategory = game.setCategory(selectedCategory);

    if (activeCategory !== selectedCategory) {
        ui.setSelectedCategory(activeCategory);
    }
}

function handleStopOnErrorChange() {
    game.setStopOnError(ui.isStopOnErrorEnabled());
}

function handleSoundChange(isEnabled) {
    if (isEnabled) {
        ui.primeAudio();
    }
}

function handleSentenceFocus(event) {
    if (!game.isRoundActive()) {
        return;
    }

    event.preventDefault();
    ui.focusInput();
}

function clearCountdownHideTimeout() {
    if (countdownHideTimeoutId !== null) {
        clearTimeout(countdownHideTimeoutId);
        countdownHideTimeoutId = null;
    }
}

function handleKeyboardShortcuts(event) {
    if (event.key === "Escape") {
        event.preventDefault();
        resetGame();
        return;
    }

    if (event.key === "Enter" && !game.isRoundActive()) {
        event.preventDefault();
        startGame();
    }
}

ui.bindStart(startGame);
ui.bindTyping(handleTyping);
ui.bindSentenceFocus(handleSentenceFocus);
ui.bindReset(resetGame);
ui.bindSessionModeChange(handleSessionModeChange);
ui.bindQuoteModeChange(handleQuoteModeChange);
ui.bindStopOnErrorChange(handleStopOnErrorChange);
ui.bindSoundChange(handleSoundChange);
document.addEventListener("keydown", handleKeyboardShortcuts);

ui.setSelectedSessionMode(game.getSessionMode());
ui.setStopOnErrorEnabled(game.getStopOnError());
handleQuoteModeChange();
ui.setQuoteCategoryEnabled(game.getSessionMode() === "quote");
ui.resetScreenState(game.getBestStats(), game.getSessionModeLabel(), game.hasGhostData());
