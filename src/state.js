class Board {
  width;
  height;
  food;
  // hazards;
  snakes;
  constructor(gameBoard) {
    this.width = gameBoard.width;
    this.height = gameBoard.height;
    this.food = gameBoard.food;
    // this.hazards = gameBoard.hazards;
    this.snakes = gameBoard.snakes;
  }
}

class State {
  board;
  you;
  constructor(gameState) {
    this.board = new Board(gameState.board);
    this.you = gameState.you;
  }
}

class Node {
  state;
  parent;
  action;
  pathCost;
  constructor(state, parent, action, pathCost) {
    this.state = state;
    this.parent = parent;
    this.action = action;
    this.pathCost = pathCost;
  }
}

const COLORS = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
};

function boxChar(color) {
  return `${color}${String.fromCharCode(9632)}${COLORS.Reset}`;
}

function getOutputGrid({ board, you }) {
  const output = [];
  // print grid
  for (let row = 0; row < board.height; ++row) {
    output.push([]);
    for (let col = 0; col < board.width; ++col) {
      output[row].push(boxChar(COLORS.FgBlack));
    }
  }
  // print food
  for (const foo of board.food) {
    output[board.height-1-foo.y][foo.x] = boxChar(COLORS.FgMagenta);
  }
  // print other snakes
  for (const snake of board.snakes) {
    if (snake.id != you.id) {
      for (const segment of snake.body) {
        try {
          output[board.height-1-segment.y][segment.x] = boxChar(COLORS.FgRed);
        } catch (err) {
          console.error(err);
        }
      }
      try {
        output[board.height-1-snake.head.y][snake.head.x] = boxChar(COLORS.FgYellow);
      } catch (err) {
        console.error(err);
      }
    }
  }
  // print you
  for (const segment of you.body) {
    try {
      output[board.height-1-segment.y][segment.x] = boxChar(COLORS.FgGreen);
    } catch (err) {
      console.error(err);
    }
  }
  try {
    output[board.height-1-you.head.y][you.head.x] = boxChar(COLORS.FgWhite);
  } catch (err) {
    console.error(err);
  }
  return output;
}

function printGrid(grid) {
  console.error('-----------------------');
  for (const row of grid) {
    for (const text of row) {
      process.stderr.write(`${text} `);
    }
    process.stderr.write('\n');
  }
  process.stderr.write('\n');
}

function printState(state) {
  printGrid(getOutputGrid(state));
}

module.exports = {
  State,
  Node,
  COLORS,
  getOutputGrid,
  printGrid,
  printState
}