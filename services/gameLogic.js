/**
 * Kiểm tra điều kiện thắng sau mỗi nước đi, theo luật Caro (chặn 2 đầu).
 * @param {Map<string, 'X' | 'O'>} moves - Map chứa tất cả các nước đi hiện tại.
 * @param {{x: number, y: number, side: 'X' | 'O'}} lastMove - Nước đi vừa thực hiện.
 * @returns {Array<{x: number, y: number, side: 'X' | 'O'}> | null} Mảng các quân cờ trên đường thắng nếu thắng, ngược lại trả về null.
 */
export const checkWin = (moves, lastMove) => {
  const { x, y, side } = lastMove;
  const opponentSide = side === 'X' ? 'O' : 'X';
  const directions = [
    { dx: 1, dy: 0 }, // Ngang
    { dx: 0, dy: 1 }, // Dọc
    { dx: 1, dy: 1 }, // Chéo chính
    { dx: 1, dy: -1 }, // Chéo phụ
  ];

  for (const { dx, dy } of directions) {
    const line = [lastMove];
    let pos_len = 0;
    let neg_len = 0;

    // Đếm số quân cờ liên tiếp theo chiều dương
    for (let i = 1; i < 6; i++) {
      const newX = x + i * dx;
      const newY = y + i * dy;
      if (moves.get(`${newX},${newY}`) === side) {
        line.push({ x: newX, y: newY, side });
        pos_len++;
      } else {
        break;
      }
    }

    // Đếm số quân cờ liên tiếp theo chiều âm
    for (let i = 1; i < 6; i++) {
      const newX = x - i * dx;
      const newY = y - i * dy;
      if (moves.get(`${newX},${newY}`) === side) {
        line.push({ x: newX, y: newY, side });
        neg_len++;
      } else {
        break;
      }
    }

    const count = line.length;

    if (count < 5) continue;

    // Hơn 5 quân (overline) là thắng luôn
    if (count > 5) {
      return line;
    }

    // Nếu đúng 5 quân, kiểm tra xem có bị chặn 2 đầu không
    if (count === 5) {
      const head = { x: x - (neg_len + 1) * dx, y: y - (neg_len + 1) * dy };
      const tail = { x: x + (pos_len + 1) * dx, y: y + (pos_len + 1) * dy };
      
      const headBlocked = moves.get(`${head.x},${head.y}`) === opponentSide;
      const tailBlocked = moves.get(`${tail.x},${tail.y}`) === opponentSide;

      // Không bị chặn cả 2 đầu thì thắng
      if (!headBlocked || !tailBlocked) {
        return line;
      }
    }
  }

  return null;
};

/**
 * Hàm chính để lấy nước đi của AI dựa trên cấp độ.
 */
export const getAIMove = async (gameState, aiLevel) => {
  const aiSide = gameState.currentTurn;
  let bestMove = null;

  if (aiLevel === 'hard') {
    bestMove = findBestMove(gameState.moves, aiSide);
  } else {
      return { updatedGameState: gameState, aiMove: null };
  }

  if (!bestMove) return {updatedGameState: gameState, aiMove: null};

  const aiMove = { ...bestMove, side: aiSide };
  const newMoves = new Map(gameState.moves);
  newMoves.set(`${aiMove.x},${aiMove.y}`, aiSide);

  const winResult = checkWin(newMoves, aiMove);
  const nextTurn = aiSide === 'X' ? 'O' : 'X';
  
  const updatedGameState = {
    ...gameState,
    moves: newMoves,
    currentTurn: nextTurn,
    winner: winResult ? aiSide : null,
    winningLine: winResult,
  };

  return { updatedGameState, aiMove };
};

// === AI "SIÊU CẤP": MINIMAX VỚI BỘ NÃO NHẬN DẠNG MẪU ===

const SCORE = {
    FIVE: 100000000,
    FOUR_OPEN: 5000000,
    FOUR_BLOCKED_A: 40000,
    FOUR_BLOCKED_B: 35000,
    THREE_OPEN: 20000,
    THREE_BLOCKED: 500,
    THREE_SPLIT_OPEN: 400,
    TWO_OPEN: 100,
    TWO_BLOCKED: 10,
    TWO_SPLIT: 5,
};

const PATTERNS = {
    FIVE: [SCORE.FIVE, /PPPPP/],
    FOUR_OPEN: [SCORE.FOUR_OPEN, /_PPPP_/],
    FOUR_BLOCKED_A: [SCORE.FOUR_BLOCKED_A, /(?=.{6}$)(OPPPP_|_PPPPO)/],
    FOUR_BLOCKED_B: [SCORE.FOUR_BLOCKED_B, /P_PPP|PPP_P|PP_PP/],
    THREE_OPEN: [SCORE.THREE_OPEN, /_PPP_/],
    THREE_SPLIT_OPEN: [SCORE.THREE_SPLIT_OPEN, /_P_PP_|_PP_P_/],
    THREE_BLOCKED: [SCORE.THREE_BLOCKED, /OPPP__|_PPP_O|O_PPP_|_PPP_O/],
    TWO_OPEN: [SCORE.TWO_OPEN, /__PP__|__P_P__/],
    TWO_BLOCKED: [SCORE.TWO_BLOCKED, /OPP___|__PPO|O_P_P_|_P_P_O/],
    TWO_SPLIT: [SCORE.TWO_SPLIT, /_P_P_/]
};

// Giá trị này được lấy từ constants.ts để tránh lỗi import trong môi trường Node.js
const HARD_AI_DEPTH = 3;

function findBestMove(moves, aiSide) {
    let bestVal = -Infinity;
    let bestMove = { x: -1, y: -1 };
    const candidates = getCandidateMoves(moves);
    const opponentSide = aiSide === 'X' ? 'O' : 'X';

    for (const move of candidates) {
        const [x, y] = move.split(',').map(Number);
        
        moves.set(move, aiSide);
        const moveVal = minimax(moves, HARD_AI_DEPTH, -Infinity, Infinity, false, aiSide, opponentSide);
        moves.delete(move);
        
        if (moveVal > bestVal) {
            bestMove = { x, y };
            bestVal = moveVal;
        }
    }
    if (bestMove.x === -1) {
        if (moves.size === 0) return {x: 0, y: 0};
        const fallbackMove = Array.from(candidates)[0];
        if (fallbackMove) {
             const [x, y] = fallbackMove.split(',').map(Number);
             return {x, y};
        }
        return {x: 0, y: 0};
    }
    return bestMove;
}

function minimax(moves, depth, alpha, beta, isMaximizing, aiSide, opponentSide) {
    const lastMoveKey = Array.from(moves.keys()).pop();
    if (lastMoveKey) {
        const [x, y] = lastMoveKey.split(',').map(Number);
        const side = moves.get(lastMoveKey);
        if (checkWin(moves, { x, y, side })) {
            return (side === aiSide ? SCORE.FIVE : -SCORE.FIVE) * (depth + 1);
        }
    }

    if (depth === 0) {
        return evaluateBoard(moves, aiSide, opponentSide);
    }

    const candidates = getCandidateMoves(moves);
    
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of candidates) {
            moves.set(move, aiSide);
            const evaluation = minimax(moves, depth - 1, alpha, beta, false, aiSide, opponentSide);
            moves.delete(move);
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else { // Minimizing
        let minEval = Infinity;
        for (const move of candidates) {
            moves.set(move, opponentSide);
            const evaluation = minimax(moves, depth - 1, alpha, beta, true, aiSide, opponentSide);
            moves.delete(move);
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(moves, aiSide, opponentSide) {
    let aiTotalScore = 0;
    let opponentTotalScore = 0;

    const directions = [{dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}, {dx: 1, dy: -1}];
    const checkedLines = new Set();

    const allPieces = Array.from(moves.keys());
    if (allPieces.length === 0) return 0;

    for (const key of allPieces) {
        const [x, y] = key.split(',').map(Number);
        for (const dir of directions) {
            const lineKey = getLineKey(dir, x, y);

            if (!checkedLines.has(lineKey)) {
                checkedLines.add(lineKey);
                
                const line = [];
                for (let i = -4; i <= 4; i++) {
                    line.push(moves.get(`${x + i * dir.dx},${y + i * dir.dy}`) || null);
                }

                const aiLineScore = scoreLineForPlayer(line, aiSide, opponentSide);
                if (aiLineScore >= SCORE.FIVE) return SCORE.FIVE;
                aiTotalScore += aiLineScore;

                const opponentLineScore = scoreLineForPlayer(line, opponentSide, aiSide);
                if (opponentLineScore >= SCORE.FIVE) return -SCORE.FIVE;
                opponentTotalScore += opponentLineScore;
            }
        }
    }
    
    return aiTotalScore - opponentTotalScore * 1.5;
}

function scoreLineForPlayer(line, player, opponent) {
    const lineStr = line.map(c => c === player ? 'P' : c === opponent ? 'O' : '_').join('');
    let totalScore = 0;

    for (const key in PATTERNS) {
        const [score, regex] = PATTERNS[key];
        const matches = lineStr.match(new RegExp(regex.source, 'g'));
        if (matches) {
            totalScore += matches.length * score;
        }
    }
    return totalScore;
}

function getLineKey(dir, x, y) {
    if (dir.dx === 1 && dir.dy === 0) {
        return `h,${y}`;
    }
    if (dir.dx === 0 && dir.dy === 1) {
        return `v,${x}`;
    }
    if (dir.dx === 1 && dir.dy === 1) {
        return `d1,${y - x}`;
    }
    return `d2,${y + x}`;
}

function getCandidateMoves(moves) {
  const candidates = new Set();
  if (moves.size === 0) {
      candidates.add("0,0");
      return candidates;
  }
  for (const key of moves.keys()) {
    const [x, y] = key.split(',').map(Number);
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        const newKey = `${x + i},${y + j}`;
        if (!moves.has(newKey)) {
          candidates.add(newKey);
        }
      }
    }
  }
  return candidates;
}