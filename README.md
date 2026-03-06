# TypeSpeed --- Typing Speed Game

TypeSpeed is a lightweight typing game built with **HTML, CSS, and
vanilla JavaScript**.\
It challenges the user to type a randomly selected sentence as
accurately and quickly as possible while tracking:

-   **WPM (Words Per Minute)**
-   **Time**
-   **Accuracy**

The project uses a modular JavaScript structure with ES modules and a
modern dark UI design.

------------------------------------------------------------------------

## Features

-   Random sentence selection
-   Live typing input
-   Real‑time WPM calculation
-   Real‑time accuracy calculation
-   Timer that starts when typing begins
-   Restart/reset functionality
-   Modern dark glassmorphism UI

------------------------------------------------------------------------

## Project Structure

typing-speed-game/ │ ├── index.html ├── css/ │ └── style.css ├── js/ │
├── data.js │ ├── game.js │ ├── ui.js │ └── main.js

------------------------------------------------------------------------

## Requirements

You only need:

-   A modern web browser
-   A local server

Because the project uses **JavaScript ES modules**, opening `index.html`
directly may not work correctly in some browsers. It is recommended to
run the project using a local server.

------------------------------------------------------------------------

## Running the Project Locally

### Option 1 --- VS Code Live Server (Recommended)

1.  Download or clone this repository
2.  Open the folder in **Visual Studio Code**
3.  Install the **Live Server** extension
4.  Right‑click `index.html`
5.  Click **Open with Live Server**

Your browser will open automatically.

------------------------------------------------------------------------

### Option 2 --- Python

If Python is installed:

``` bash
python -m http.server 8000
```

Then open:

http://localhost:8000

------------------------------------------------------------------------

### Option 3 --- Node.js

Install a static server:

``` bash
npm install -g serve
```

Run the project:

``` bash
serve
```

Then open the URL shown in the terminal.

------------------------------------------------------------------------

## How to Play

1.  Click **Start**
2.  A random sentence will appear
3.  Type the sentence into the input box
4.  The game calculates:
    -   WPM
    -   Time
    -   Accuracy
5.  Click **Restart** to play again

------------------------------------------------------------------------

## Technologies Used

-   HTML5
-   CSS3
-   JavaScript (ES Modules)

------------------------------------------------------------------------

## Possible Future Improvements

-   Character‑by‑character highlighting
-   Final result summary
-   Best score saved with LocalStorage
-   Difficulty levels
-   Additional sentence datasets

------------------------------------------------------------------------

## Author

**Abdil Turdaliyev**
