import { sentences } from "./data.js";
import { TypingGame } from "./game.js";
import { GameUI } from "./ui.js";

const game = new TypingGame(sentences);
const ui = new GameUI();
let activeSentence = "";

game.setTickHandler((stats) => {
    ui.updateStats(stats);
});

function startGame() {
    const startResult = game.start();

    if (!startResult) {
        return;
    }

    if (startResult.error === "NO_SENTENCES") {
        activeSentence = "";
        ui.updateSentenceText("No sentences available. Add items in js/data.js.");
        ui.clearInput();
        ui.disableInput();
        ui.clearInputClasses();
        ui.updateStats(startResult.stats);
        ui.clearResults();
        ui.hideResults();
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Start");
        return;
    }

    activeSentence = startResult.sentence;
    ui.renderSentence(activeSentence);
    ui.clearInput();
    ui.clearInputClasses();
    ui.enableInput();
    ui.focusInput();
    ui.updateStats(startResult.stats);
    ui.clearResults();
    ui.hideResults();
    ui.setStartButtonDisabled(true);
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

    if (result.isComplete) {
        ui.disableInput();
        ui.setInputError(false);
        ui.setInputSuccess(true);
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Play Again");
        ui.showResults(result.stats);
    }
}

function resetGame() {
    game.reset();
    activeSentence = "";
    ui.resetScreenState();
}

ui.bindStart(startGame);
ui.bindTyping(handleTyping);
ui.bindReset(resetGame);

ui.resetScreenState();
