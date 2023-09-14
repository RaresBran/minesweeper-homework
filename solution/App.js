/*
 * "board" is a matrix that holds data about the
 * game board, in a form of BoardSquare objects
 */
let board = [];

/*
 *
 * the probability of a bomb in each square
 *
 */
let bombProbability = 15; // %

function generateBoard(difficulty) {
  board = [];
  let rowCount = difficulty.rowCount;
  let colCount = difficulty.colCount;
  
  // Create the board matrix
  for (let i = 0; i < rowCount; i++) {
    board[i] = new Array(colCount);
  }

  // Intialize the board with squares that may or may not be bombs
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      let isBomb = Math.random() * 100 < bombProbability;
      board[i][j] = new BoardSquare(isBomb);
    }
  }

  // Count the number of bombs around each square
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      let bombsAround = 0;

      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          if (
            i + x >= 0 &&
            i + x < rowCount &&
            j + y >= 0 &&
            j + y < colCount &&
            board[i + x][j + y].isBomb
          ) {
            bombsAround++;
          }
        }
      }

      board[i][j].bombsAround = bombsAround;
    }
  }

  // Print the board to the console
  console.log(board);
}

/*
 * simple object to keep the data for each square
 * of the board
 */
class BoardSquare {
  constructor(isBomb) {
    this.isOpened = false;
    this.isBomb = isBomb;
    this.isFlagged = false;
    this.bombsAround = 0;
  }
}

// Class to represent the difficulty of the game
class Difficulty {
  rowCount = 0;
  colCount = 0;

  constructor(rowCount, colCount) {
    this.rowCount = rowCount;
    this.colCount = colCount;
  }
}

// Classes to represent the different difficulty levels
class EasyDifficulty extends Difficulty {
  constructor() {
    super(9, 9);
  }
}

class MediumDifficulty extends Difficulty {
  constructor() {
    super(16, 16);
  }
}

class HardDifficulty extends Difficulty {
  constructor() {
    super(16, 30);
  }
}

// Get the board element from the DOM
const boardElement = $("#board");

// Update the game when the difficulty is changed
$("#difficultyDropdown").change(initializeGame);

// Function to initialize the game based on the selected difficulty
function initializeGame() {
  const difficultySelect = document.getElementById("difficultyDropdown");
  const selectedDifficulty = difficultySelect.value;

  switch (selectedDifficulty) {
    case "easy":
      generateBoard(new EasyDifficulty());
      break;
    case "medium":
      generateBoard(new MediumDifficulty());
      break;
    case "hard":
      generateBoard(new HardDifficulty());
      break;
    default:
      alert("Invalid difficulty selection.");
      return;
  }

  renderBoard();
}

// Function to reveal a square based on the input fields
function revealSquareFromForm() {
  const rowInput = document.getElementById("rowInput");
  const colInput = document.getElementById("colInput");
  const row = parseInt(rowInput.value);
  const col = parseInt(colInput.value);

  revealSquare(row, col);
}

// Function to reveal a square and any adjacent squares
function revealSquare(row, col) {
  if (
    row < 0 ||
    col < 0 ||
    col >= board[0].length ||
    row >= board.length ||
    board[row][col].isOpened
  ) {
    // Exit if coordinates are out of bounds or the square is already opened
    return;
  }

  let squre = board[row][col];
  squre.isOpened = true;
  squre.isFlagged = false;

  if (board[row][col].isBomb) {
    renderBoard(true);
    return;
  }

  // Call the recursive function to reveal adjacent squares
  revealAdjacent(row, col);
}

// Function to reveal adjacent squares iteratively
function revealAdjacent(row, col) {
  const queue = [{ row, col }];

  // Iterate through the queue until it's empty
  while (queue.length > 0) {
    const { row, col } = queue.pop();
    const square = board[row][col];

    if (
      row < 0 ||
      col < 0 ||
      col >= board[0].length ||
      row >= board.length ||
      square.isBomb ||
      square.isFlagged
    ) {
      // Skip if coordinates are out of bounds, the square is a bomb, or it's flagged
      continue;
    }

    // Mark the square as opened
    square.isOpened = true;

    if (square.bombsAround === 0) {
      // Add adjacent squares to the queue if there are no bombs around
      const neighbors = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, -1],
        [0, 1],
        [1, -1],
        [1, 0],
        [1, 1],
      ];

      for (const [dx, dy] of neighbors) {
        const newRow = row + dx;
        const newCol = col + dy;

        // Ensure the adjacent square is within bounds and hasn't been visited
        if (
          newRow >= 0 &&
          newRow < board.length &&
          newCol >= 0 &&
          newCol < board[0].length &&
          !board[newRow][newCol].isOpened
        ) {
          queue.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  // Update the board display to reflect the revealed squares
  renderBoard();
}

// Function to flag a square
function flagSquare(row, col) {
  if (
    row < 0 ||
    col < 0 ||
    row >= board.length ||
    col >= board[0].length ||
    board[row][col].isOpened
  ) {
    // Exit if coordinates are out of bounds or the square is already opened
    return;
  }

  const square = board[row][col];
  square.isFlagged = !square.isFlagged; // Toggle the flag status

  // Update the board display to reflect the flagged square
  renderBoard();
}

// Function to render the board to the DOM or display a game over message
function renderBoard(gameOver = false) {
  boardElement.empty();
  if (gameOver)
    boardElement.append($('<h1 style="color: red">Game Over!<br>You Lost</h1>'));
  else {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const square = board[i][j];
        const squareElement = document.createElement("div");
        squareElement.style.display = "inline-block";
        squareElement.style.width = "20px";
        if (square.isOpened) {
          squareElement.textContent = square.isBomb
            ? "💣"
            : square.bombsAround || " ";
        } else {
          squareElement.textContent = square.isFlagged ? "🚩" : "⏹️";
          if (!gameOver) {
            squareElement.addEventListener("click", () => revealSquare(i, j));
            squareElement.addEventListener("contextmenu", (e) => {
              e.preventDefault(); // Prevent the default context menu from appearing
              flagSquare(i, j);
            });
          }
        }
        boardElement.append(squareElement);
      }
      boardElement.append($("<br>"));
    }
  }
}
