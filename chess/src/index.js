import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';


const pieces = new Map([
  ["wk","♔"],
  ["bk","♚"],
  ["wq","♕"],
  ["bq","♛"],
  ["wr","♖"],
  ["br","♜"],
  ["wb","♗"],
  ["bb","♝"],
  ["wn","♘"],
  ["bn","♞"],
  ["wp","♙"],
  ["bp","♟"],
  [null,null]]);


const piecesToEnglish = new Map([
  ["wk","White King"],
  ["bk","Black King"],
  ["wq","White Queen"],
  ["bq","Black Queen"],
  ["wr","White Rook"],
  ["br","Black Rook"],
  ["wb","White Bishop"],
  ["bb","Black Bishop"],
  ["wn","White Knight"],
  ["bn","Black Knight"],
  ["wp","White Pawn"],
  ["bp","Black Pawn"],
  [null,null]]);

const alphabet = ["a","b","c","d","e","f","g","h"]

function Square(props) {
  return (
    <button className = {"square "+props.color} onClick={props.onClick}>
      {pieces.get(props.value)}
    </button>
  );
}

class PromotionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: 'q', handlePromotion: this.props.handlePromotion};
    
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({value: event.target.value});
  }

  handleSubmit(event) {
    this.state.handlePromotion(this.state.value);
    event.preventDefault();
  }

  render() {
    if (this.props.show) {
      return (
	<form onSubmit={this.handleSubmit}>
	  <label>
	    Pick piece:
	    <select value={this.state.value} onChange={this.handleChange}>
	      <option value="q">Queen</option>
	      <option value="r">Rook</option>
	      <option value="b">Bishop</option>
	      <option value="n">Knight</option>
	    </select>
	  </label>
	  <input type="submit" value="Submit" />
	</form>
      );
    }
  }
}

class Move {
  constructor(piece, fromSquareNo, toSquareNo) {
    this.fromRow = 8-(Math.floor(fromSquareNo / 8));
    this.fromCol = alphabet[(fromSquareNo % 8)];
    this.toRow = 8-(Math.floor(toSquareNo / 8));
    this.toCol = alphabet[(toSquareNo % 8)];
    this.piece = piecesToEnglish.get(piece);
  };
}

class Board extends React.Component {
  renderSquare(i) {
    let color;
    if (this.props.selectedSquare == i) {
      color = "yellow";
    /*} else if (this.props.moves.indexOf(i) != -1 ) {
      color = "orange";*/
    } else if (((i % 2) == 1 && (Math.floor(i/8) % 2) == 0) || ((i % 2) == 0 && (Math.floor(i/8) % 2) == 1)) {
      color = "brown";
    } else {
      color = "white";
    }
    return <Square key={i} color={color} value={this.props.squares[i]}
    onClick={() => this.props.onClick(i)}/>;
  }

  render() {
    let components = [];
    for (let i = 0; i < 8; i++) {
      components.push(<div key={(i+1)*100} className="board-row"/>);
      for (let j = 0; j < 8; j++) {
	components.push(this.renderSquare(8*i+j));
      }
      components.push(<div key={(i+1)*-1}/>);
    }
    return(<div>{components}</div>);
  }
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      history: [{
	squares: ["br","bn","bb","bq","bk","bb","bn","br"].concat(new Array(8).fill("bp")).concat(new
	Array(32)).concat(new Array(8).fill("wp")).concat(["wr","wn","wb","wq","wk","wb","wn","wr"]),
	move: null,
	whiteLeftRookNotMoved: true,
	whiteRightRookNotMoved: true,
	whiteKingNotMoved: true,
	blackLeftRookNotMoved: true,
	blackRightRookNotMoved: true,
	blackKingNotMoved: true,
	inCheck: false,
	noMoves: false,
      }],
      selectedSquare: null,
      whiteIsNext: true,
      stepNumber: 0,
      moves: [],
      promotionPos: null,
    };
  }

  isSameSide(squares,i) {
    if (!squares[i]) {
      return false;
    }
    return ((this.state.whiteIsNext && squares[i].slice(0,1) == "w") || (!this.state.whiteIsNext && squares[i].slice(0,1)
    == "b"));
  }

  handleClick(i) {
    if (this.state.promotionPos) {
      return;
    }

    const history = this.state.history.slice(0, this.state.stepNumber + 1); //Allows us to wipe
									    //history when making
									    //another move
    const current = history[history.length - 1];
    const squares = current.squares.slice(); //.slice() creates copy - it is better to avoid
						// mutating data
    
    let prevSquares;
    if (history.length < 2) {
      prevSquares = null;
    } else {
      prevSquares = history[history.length -2].squares.slice();
    }
    let moved = false;
    let newMove;
    let newCurrent = {
      whiteLeftRookNotMoved: current.whiteLeftRookNotMoved,
      whiteRightRookNotMoved: current.whiteRightRookNotMoved,
      whiteKingNotMoved: current.whiteKingNotMoved,
      blackLeftRookNotMoved: current.blackLeftRookNotMoved,
      blackRightRookNotMoved: current.blackRightRookNotMoved,
      blackKingNotMoved: current.blackKingNotMoved,
      inCheck: current.inCheck,
    };
    if (this.isSameSide(squares,i)) {
      let moves  = 	getMoves(squares,i,this.state.whiteIsNext,prevSquares);
      this.setState({
	selectedSquare: i,
	moves: moves,
      });
    } else if (this.state.selectedSquare+1 &&
    this.state.moves.includes(i)) {
      newMove = new Move(squares[this.state.selectedSquare],this.state.selectedSquare,i);
      if (!squares[i]) {
	enPassant(squares, this.state.selectedSquare, i);
      }
      squares[i] = squares[this.state.selectedSquare];
      squares[this.state.selectedSquare] = null;
      if ((squares[i] == "wp" && i < 8) || (squares[i] == "bp" && i > 55)) {
	this.setState({promotionPos: i});
	return;
      }
      switch (this.state.selectedSquare) {
	case 0:
	  newCurrent.blackLeftRookNotMoved = false;
	  break;
	case 4:
	  newCurrent.blackKingNotMoved = false;
	  break;
	case 7:
	  newCurrent.blackRightRookNotMoved = false;
	  break;
	case 56:
	  newCurrent.whiteLeftRookNotMoved = false;
	  break;
	case 60:
	  newCurrent.whiteKingNotMoved = false;
	  break;
	case 63:
	  newCurrent.whiteRightRookNotMoved = false;
	  break;
      }

      moved = true;
    } else if (this.state.selectedSquare == 60 && current.whiteKingNotMoved &&
    !current.inCheck) {
      if (i == 62 && current.whiteRightRookNotMoved && castleable(squares, 61) &&
	castleable(squares, 62)) {
	squares[60] = null;
	squares[63] = null;
	squares[61] = "wr";
	squares[62] = "wk";
	newCurrent.whiteKingNotMoved = false;
	newCurrent.whiteRightRookNotMoved = false;
	moved = true;
        newMove = new Move("wk",60,62);
      } else if (i == 58 && current.whiteLeftRookNotMoved && !squares[57] && castleable(squares, 58) &&
      castleable(squares, 59)) {
	squares[60] = null;
	squares[56] = null;
	squares[58] = "wk";
	squares[59] = "wr";
	newCurrent.whiteKingNotMoved = false;
	newCurrent.whiteLeftRookNotMoved = false;
	moved = true;
        newMove = new Move("wk",60,58);
      }
    } else if (this.state.selectedSquare == 4 && current.blackKingNotMoved &&
    !current.inCheck) {
      if (i == 6 && current.blackRightRookNotMoved && castleable(squares,5) && castleable(squares,6)) {
	squares[4] = null;
	squares[7] = null;
	squares[5] = "br";
	squares[6] = "bk";
	newCurrent.blackKingNotMoved = false;
	newCurrent.blackRightRookNotMoved = false;
	moved = true;
	newMove = new Move("bk",4,6);
      } else if (i == 2 && current.blackLeftRookNotMoved && !squares[1] && castleable(squares,2) &&
      castleable(squares,3)) {
	squares[0] = null;
	squares[4] = null;
	squares[2] = "bk";
	squares[3] = "br";
	newCurrent.blackKingNotMoved = false;
	newCurrent.blackLeftRookNotMoved = false;
	moved = true;
	newMove = new Move("bk",4,2);
      }
    }
    if (moved) {
      this.setState({
        history: history.concat([{
	  squares: squares,
	  move: newMove,
	  whiteLeftRookNotMoved: newCurrent.whiteLeftRookNotMoved,
	  whiteRightRookNotMoved: newCurrent.whiteRightRookNotMoved,
	  whiteKingNotMoved: newCurrent.whiteKingNotMoved,
	  blackLeftRookNotMoved: newCurrent.blackLeftRookNotMoved,
	  blackRightRookNotMoved: newCurrent.blackRightRookNotMoved,
	  blackKingNotMoved: newCurrent.blackKingNotMoved,
	  inCheck: inCheck(squares, !this.state.whiteIsNext),
	  noMoves: noMoves(squares, current.squares, !this.state.whiteIsNext),
	}]),
	selectedSquare: null,
	stepNumber: history.length,
        whiteIsNext: !this.state.whiteIsNext,
      });
    }
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step,
      whiteIsNext: (step % 2) === 0,
      selectedSquare: null,
      moves: [],
    });
  }

  handlePromotion(value) {
    const history = this.state.history.slice(0, this.state.stepNumber + 1); //Allows us to wipe
    const current = history[this.state.stepNumber];
    const squares = current.squares.slice();
    const newMove = new
    Move(squares[this.state.selectedSquare],this.state.selectedSquare,this.state.promotionPos);
    squares[this.state.selectedSquare] = null;
    if (this.state.whiteIsNext) {
      squares[this.state.promotionPos] = "w"+value;
    } else {
      squares[this.state.promotionPos] = "b"+value;
    }
    this.setState({
      history: history.concat([{
	squares: squares,
	move: newMove,	
	whiteLeftRookNotMoved: current.whiteLeftRookNotMoved,
        whiteRightRookNotMoved: current.whiteRightRookNotMoved,
        whiteKingNotMoved: current.whiteKingNotMoved,
        blackLeftRookNotMoved: current.blackLeftRookNotMoved,
        blackRightRookNotMoved: current.blackRightRookNotMoved,
        blackKingNotMoved: current.blackKingNotMoved,
        inCheck: inCheck(squares, !this.state.whiteIsNext),
        noMoves: noMoves(squares, current.squares, !this.state.whiteIsNext),
      }]),
      selectedSquare: null,
      stepNumber: history.length,
      whiteIsNext: !this.state.whiteIsNext,
      promotionPos: null,
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    let status;
    if (current.noMoves) {
      if (current.inCheck) {
	status = 'Winner: ' + (this.state.whiteIsNext ? 'Black' : 'White');
      } else {
	status = 'Draw';
      }
    } else {
      status = 'Next player: ' + (this.state.whiteIsNext ? 'White' : 'Black');
      if (current.inCheck) {
	status = status + " - " + (this.state.whiteIsNext ? 'White' : 'Black') + " is in check";
      }
    }

    const moves = history.map((step,move) => {
      const desc = move ?
	history[move].move.piece + ' on '+ history[move].move.fromCol +
	history[move].move.fromRow  + ' to ' + history[move].move.toCol +
	history[move].move.toRow :
	'Go to game start';
      let style;
      if (this.state.stepNumber == move) {
	style = new Map([['font-weight', 'bold']]);
      }
      return (
	<button key={move} onClick={() => this.jumpTo(move)}>{desc}</button>
      );
    });

    const start = moves[0];
    delete moves[0];

    const moves1 = moves.filter((elem, i) => {return i%2 == 1});
    const moves2 = moves.filter((elem, i) => {return i%2 == 0});
    
    const movesTable = new Array();

    for (let i = 0; i < moves1.length; i++) {
      movesTable.push(
	<tr key={i}>
	  <td><b>{i+1}</b></td>
	  <td>{moves1[i]}</td>
	  <td>{moves2[i]}</td>
	</tr>
      );
    }

    

    return (
      <div className="game">
        <div className="game-board">
          <Board squares={current.squares} moves={this.state.moves} selectedSquare={this.state.selectedSquare} onClick = {i => this.handleClick(i)}/>
	  <PromotionForm show = {Boolean(this.state.promotionPos)} handlePromotion = {value => this.handlePromotion(value)}/>
        </div>
        <div className="game-info">
          <div>{status}<br/>{start}</div>
	  <table><tbody>
	  <tr><td><b>#</b></td><td><b>White</b></td><td><b>Black</b></td></tr>
	  {movesTable}
	  </tbody></table>
        </div>
      </div>
    );
  }
}

function castleable(squares, pos) {
  if (squares[pos]) {
    return false;
  }
  let isWhite = pos > 31;
  let testSquares = squares.slice();
  if (isWhite) {
    testSquares[pos] = "wk";
    testSquares[60] = null;
  } else {
    testSquares[pos] = "bk";
    testSquares[4] = null;
  }
  return !inCheck(testSquares, isWhite);
}

function noMoves(squares, oldSquares, isWhite) {
  for (let i = 0; i < 64; i++) {
    if (!isNotSameColor(squares, i, isWhite) && anyMovesPiece(squares, getMoves(squares, i, isWhite,
      oldSquares), isWhite)) {
      return false;
    }
  }
  return true;
}

function anyMovesPiece(squares, moves, isWhite) {
  for (let move of moves) {
    if (move >=0 && move < 64 && isNotSameColor(squares, move, isWhite)) {
      return true;
    }
  }
  return false;
}

function moveIntoCheck(pos, board, selectedSquare, whiteIsNext) {
  let newBoard = board.slice();
  newBoard[pos] = newBoard[selectedSquare];
  newBoard[selectedSquare] = null;
  return inCheck(newBoard,whiteIsNext);
}


function getPawnMoves(squares, pos, isWhite, oldSquares) {
  let moves = [];
  let moveFunc;
  if (isWhite) {
    moveFunc = ((i) => {return i-8});
  } else {
    moveFunc = ((i) => {return i+8});
  }
  if (!squares[moveFunc(pos)]) {
    moves.push(moveFunc(pos));
    if (((isWhite && (Math.floor(pos/8) == 6)) || (!isWhite && (Math.floor(pos/8) == 1))) &&
      !squares[moveFunc(moveFunc(pos))]) {
      moves.push(moveFunc(moveFunc(pos)));
    }
  }
  if (!((pos % 8) == 0) && (isDiffColor(squares, moveFunc(pos)-1, isWhite))) {
    moves.push(moveFunc(pos)-1);
  }
  if (!((pos % 8) == 7) && (isDiffColor(squares, moveFunc(pos)+1, isWhite))) {
    moves.push(moveFunc(pos)+1);
  }
  if (oldSquares && isWhite && Math.floor(pos/8) == 3) {
    if (oldSquares[pos-15] && !squares[pos-15] && squares[pos+1] == "bp") {
      moves.push(pos-7); //en passant
    } else if (oldSquares[pos-17] && !squares[pos-17] && squares[pos-1] == "bp") {
      moves.push(pos-9);
    }
  } else if (oldSquares && Math.floor(pos/8) == 4) {
    if (oldSquares[pos+17] && !squares[pos+17] && squares[pos+1] == "wp") {
      moves.push(pos+9);
    } else if (oldSquares[pos+15] && !squares[pos+15] && squares[pos-1] == "wp") {
      moves.push(pos+7);
    }
  }
  return moves;
}

function getKingMoves(squares, pos, isWhite, oldSquares) {
  let moves = [pos-8, pos+8];
  if ((pos % 8) != 0) {
    moves = moves.concat([pos-9,pos-1,pos+7]);
  }
  if ((pos % 8) != 7) {
    moves = moves.concat([pos-7,pos+1,pos+9]);
  }
  return moves;
}

function getKnightMoves(squares, pos, isWhite, oldSquares) {
  let moves = [];
  if ((pos % 8) > 0) {
    moves = moves.concat([pos-17,pos+15]);
    if ((pos % 8) > 1) {
      moves = moves.concat([pos-10,pos+6]);
    }
  }
  if ((pos % 8) < 7) {
    moves = moves.concat([pos-15,pos+17]);
    if ((pos % 8) < 6) {
      moves = moves.concat([pos-6,pos+10]);
    }
  }
  return moves;
}

function getRookMoves(squares, pos, isWhite, oldSquares) {
  let moves = [];
  forLoop(squares, moves, pos, (i) => {return i >= 0}, (i) => {return i - 8});
  forLoop(squares, moves, pos, (i) => {return i < 64}, (i) => {return i + 8});
  forLoop(squares,  moves, pos, (i) => {return i >= (Math.floor(pos / 8))*8}, (i) =>
  {return i-1});
  forLoop(squares, moves, pos, (i) => {return i < (Math.ceil(pos / 8))*8}, (i) =>
  {return i+1});
  return moves;
}

function getBishopMoves(squares, pos, isWhite, oldSquares) {
  let moves = [];
  const stop1 = (i) => {return (i % 8) == 0;};
  const stop2 = (i) => {return (i % 8) == 7;};
  forLoop(squares, moves, pos, (i) => {return i >= 0}, (i) => {return i - 9}, stop1);
  forLoop(squares, moves, pos, (i) => {return i < 64}, (i) => {return i + 7}, stop1);
  forLoop(squares, moves, pos, (i) => {return i >= 0}, (i) => {return i - 7}, stop2);
  forLoop(squares, moves, pos, (i) => {return i < 64}, (i) => {return i + 9}, stop2);
  return moves;
}

function getQueenMoves(squares, pos, isWhite, oldSquares) {
  return getRookMoves(squares, pos, isWhite, oldSquares).concat(getBishopMoves(squares, pos,
  isWhite, oldSquares));
}


function forLoop(squares, moves, init, condition, update, stop = (i) => {return false}) {
  for (let i = init; condition(i); i = update(i)) {
    moves.push(i);
    if ((squares[i] && i != init) || stop(i)) {
      break;
    }
  }
}

function isPieceWhite(squares, pos) {
  return (squares[pos].slice(0,1) === "w");
}

function isSameColor(squares, pos, isWhite) {
  return isPieceWhite(squares, pos) == isWhite;
}

function isNotSameColor(squares, pos, isWhite) {
  return !squares[pos] || !isSameColor(squares, pos, isWhite);
}

function isDiffColor(squares, pos, isWhite) {
  return squares[pos] && !isSameColor(squares, pos, isWhite);
}

function inCheck(squares, isWhite) {
  let kingPos;
  let side;
  if (isWhite) {
    kingPos = squares.findIndex(val => val == "wk");
    side = "b";
  } else {
    kingPos = squares.findIndex(val => val == "bk");
    side = "w";
  }
  
  for (let i = 0; i < 64; i++) {
    if (squares[i] && squares[i].slice(0,1) === side && getMovesNoCheck(squares, i, !isWhite,
      null).includes(kingPos)) {
	return true;
    }
  }
  return false;
}

function getMoves(squares, pos, isWhite, prevSquares) {
  let getMoves;
  switch(squares[pos].substring(1)) {
    case "p":
      getMoves = getPawnMoves;
      break;
    case "k":
      getMoves = getKingMoves; 
      break;
    case "n":
      getMoves = getKnightMoves;
      break;
    case "r":
      getMoves = getRookMoves;
      break;
    case "b":
      getMoves = getBishopMoves;
      break;
    case "q":
      getMoves = getQueenMoves;
      break;
    default:
      console.log(squares[pos].substring(1));
  }
  let firstMoves  = getMoves(squares, pos, isWhite, prevSquares);
  let moves = [];
  for (let move of firstMoves) {
    if (!moveIntoCheck(move, squares, pos, isWhite)) {
      moves.push(move);
    }
  }
  return moves;
}

function getMovesNoCheck(squares, pos, isWhite, prevSquares) {
  let getMoves;
  switch(squares[pos].substring(1)) {
    case "p":
      getMoves = getPawnMoves;
      break;
    case "k":
      getMoves = getKingMoves; 
      break;
    case "n":
      getMoves = getKnightMoves;
      break;
    case "r":
      getMoves = getRookMoves;
      break;
    case "b":
      getMoves = getBishopMoves;
      break;
    case "q":
      getMoves = getQueenMoves;
      break;
    default:
      console.log(squares[pos].substring(1));
  }
  return getMoves(squares, pos, isWhite, prevSquares);
}

function enPassant(squares, from, to) {
  if (squares[from] == "wp") {
    if (to == from-7) {
      squares[from+1] = null;
    } else if (to == from-9) {
      squares[from-1] = null;
    }
  } else if (squares[from] == "bp") {
    if (to == from+9) {
      squares[from+1] = null;
    } else if (to == from+7) {
      squares[from-1] = null;
    }
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Game />);
