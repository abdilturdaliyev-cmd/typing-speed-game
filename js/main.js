import { sentences } from "./data.js";
import { TypingGame } from "./game.js";
import { GameUI } from "./ui.js";

const game = new TypingGame(sentences);
const ui = new GameUI();
let activeSentence = "";
let countdownHideTimeoutId = null;

game.setTickHandler((snapshot) => {
    ui.updateStats(snapshot.stats);
    ui.updateProgress(snapshot.progress);
    ui.updateGhostProgress(snapshot.ghostProgress);
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
    clearCountdownHideTimeout();
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
        ui.updateBestStats(game.getBestStats());
        ui.hideResults();
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Start");
        return;
    }

    activeSentence = startResult.sentence;
    ui.setSelectedCategory(startResult.activeCategory);
    ui.renderSentence(activeSentence);
    ui.clearInput();
    ui.clearInputClasses();
    ui.disableInput();
    ui.updateStats(startResult.stats);
    ui.updateProgress(startResult.progress);
    ui.updateGhostProgress(startResult.ghostProgress);
    ui.clearResults();
    ui.hideResults();
    ui.setStartButtonDisabled(true);
    ui.setStartButtonLabel("Starting...");

    game.startCountdown(3);
}

function handleTyping() {
    const typedText = ui.getInputValue();
    const result = game.handleTyping(typedText);

    if (!result) {
        return;
    }

    const renderState = ui.renderSentence(activeSentence, typedText);
    ui.setInputError(renderState.hasMismatch);
    ui.updateStats(result.stats);
    ui.updateProgress(result.progress);
    ui.updateGhostProgress(result.ghostProgress);

    if (result.isComplete) {
        ui.disableInput();
        ui.setInputError(false);
        ui.setInputSuccess(true);
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Play Again");
        ui.showResults(result.stats, result.bestStats);
    }
}

function resetGame() {
    clearCountdownHideTimeout();
    game.reset();
    activeSentence = "";
    ui.resetScreenState(game.getBestStats());
    ui.setSelectedCategory(game.getCategory());
}

function handleQuoteModeChange() {
    const selectedCategory = ui.getSelectedCategory();
    const activeCategory = game.setCategory(selectedCategory);

    if (activeCategory !== selectedCategory) {
        ui.setSelectedCategory(activeCategory);
    }
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
ui.bindReset(resetGame);
ui.bindQuoteModeChange(handleQuoteModeChange);
document.addEventListener("keydown", handleKeyboardShortcuts);

handleQuoteModeChange();
ui.resetScreenState(game.getBestStats());
