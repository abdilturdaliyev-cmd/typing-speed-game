import { sentences } from "./data.js";
import { TypingGame } from "./game.js";
import { GameUI } from "./ui.js";

const game = new TypingGame(sentences);
const ui = new GameUI();

game.setTickHandler((stats) => {
    ui.updateStats(stats);
});

function startGame() {
    const startResult = game.start();

    if (!startResult) {
        return;
    }

    ui.updateSentenceText(startResult.sentence);
    ui.clearInput();
    ui.clearInputClasses();
    ui.enableInput();
    ui.focusInput();
    ui.updateStats(startResult.stats);
    ui.setStartButtonDisabled(true);
}

function handleTyping() {
    const result = game.handleTyping(ui.getInputValue());

    if (!result) {
        return;
    }

    ui.setInputError(result.hasError);
    ui.updateStats(result.stats);

    if (result.isComplete) {
        ui.disableInput();
        ui.setInputError(false);
        ui.setInputSuccess(true);
        ui.setStartButtonDisabled(false);
        ui.setStartButtonLabel("Play Again");
    }
}

function resetGame() {
    game.reset();
    ui.resetScreenState();
}

ui.startBtn.addEventListener("click", startGame);
ui.inputField.addEventListener("input", handleTyping);
ui.resetBtn.addEventListener("click", resetGame);

ui.resetScreenState();
