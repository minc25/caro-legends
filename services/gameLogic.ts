import { GameState, Move, Side, AIOption } from '../types';
import { HARD_AI_DEPTH } from '../constants';

/**
 * Kiểm tra điều kiện thắng sau mỗi nước đi, theo luật Caro (chặn 2 đầu).
 * @param moves - Map chứa tất cả các nước đi hiện tại.
 * @param lastMove - Nước đi vừa thực hiện.
 * @returns Mảng các quân cờ trên đường thắng nếu thắng, ngược lại trả về null.
 */
export const checkWin = (moves: Map<string, Side>, lastMove: Move): Move[] | null => {
  const { x, y, side } = lastMove;
  const opponentSide = side === 'X' ? 'O' : 'X';
  const directions = [
    { dx: 1, dy: 0 }, // Ngang
    { dx: 0, dy: 1 }, // Dọc
    { dx: 1, dy: 1 }, // Chéo chính
    { dx: 1, dy: -1 }, // Chéo phụ
  ];

  for (const { dx, dy } of directions) {
    const line: Move[] = [lastMove];
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
    
    // Bỏ qua nếu không đủ 5 quân
    if (count < 5) continue;

    // Hơn 5 quân (overline) là thắng luôn theo luật Caro phổ thông
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
export const getAIMove = async (gameState: GameState, aiLevel: AIOption): Promise<{updatedGameState: GameState, aiMove: Move | null}> => {
  const aiSide = gameState.currentTurn;
  let bestMove: { x: number; y: number } | null = null;

  if (aiLevel === 'hard') {
    bestMove = findBestMove(gameState.moves, aiSide);
  } else {
      // Các cấp độ AI khác không được hỗ trợ trong phiên bản này
      return { updatedGameState: gameState, aiMove: null };
  }

  if (!bestMove) return {updatedGameState: gameState, aiMove: null};

  const aiMove: Move = { ...bestMove, side: aiSide };
  const newMoves = new Map(gameState.moves);
  newMoves.set(`${aiMove.x},${aiMove.y}`, aiSide);

  const winResult = checkWin(newMoves, aiMove);
  const nextTurn = aiSide === 'X' ? 'O' : 'X';
  
  const updatedGameState: GameState = {
    ...gameState,
    moves: newMoves,
    currentTurn: nextTurn,
    winner: winResult ? aiSide : null,
    winningLine: winResult,
  };

  return { updatedGameState, aiMove };
};

// === AI "SIÊU CẤP": MINIMAX VỚI BỘ NÃO NHẬN DẠNG MẪU ===

// Hệ thống điểm được thiết kế chi tiết để AI có thể lượng giá các thế cờ phức tạp.
const SCORE = {
    FIVE: 100000000,        // Thắng tuyệt đối (PPPPP)
    FOUR_OPEN: 5000000,     // Bốn quân, hai đầu trống (_PPPP_) -> Gần như thắng
    FOUR_BLOCKED_A: 40000,  // Bốn quân, một đầu chặn (OPPPP_ hoặc _PPPPO) -> Đe dọa trực tiếp
    FOUR_BLOCKED_B: 35000,  // Bốn quân bị tách (P_PPP hoặc PP_PP) -> Vẫn rất nguy hiểm
    THREE_OPEN: 20000,      // Ba quân, hai đầu trống (_PPP_) -> Rất mạnh, tạo ra 2 hướng thắng
    THREE_BLOCKED: 500,     // Ba quân, một đầu chặn (OPPP__)
    THREE_SPLIT_OPEN: 400,  // Ba quân tách, hai đầu trống (_P_PP_ hoặc _PP_P_)
    TWO_OPEN: 100,          // Hai quân, hai đầu trống (__PP__)
    TWO_BLOCKED: 10,        // Hai quân, một đầu chặn (OPP___)
    TWO_SPLIT: 5,           // Hai quân tách, trống giữa (_P_P_)
};

// Tập hợp các mẫu cờ và điểm số tương ứng dưới dạng biểu thức chính quy (Regex)
const PATTERNS: { [key: string]: [number, RegExp] } = {
    FIVE: [SCORE.FIVE, /PPPPP/],
    FOUR_OPEN: [SCORE.FOUR_OPEN, /_PPPP_/],
    FOUR_BLOCKED_A: [SCORE.FOUR_BLOCKED_A, /(?=.{6}$)(OPPPP_|_PPPPO)/], // Dùng lookahead để tránh trùng lặp
    FOUR_BLOCKED_B: [SCORE.FOUR_BLOCKED_B, /P_PPP|PPP_P|PP_PP/],
    THREE_OPEN: [SCORE.THREE_OPEN, /_PPP_/],
    THREE_SPLIT_OPEN: [SCORE.THREE_SPLIT_OPEN, /_P_PP_|_PP_P_/],
    THREE_BLOCKED: [SCORE.THREE_BLOCKED, /OPPP__|_PPP_O|O_PPP_|_PPP_O/],
    TWO_OPEN: [SCORE.TWO_OPEN, /__PP__|__P_P__/],
    TWO_BLOCKED: [SCORE.TWO_BLOCKED, /OPP___|__PPO|O_P_P_|_P_P_O/],
    TWO_SPLIT: [SCORE.TWO_SPLIT, /_P_P_/]
};


/**
 * Tìm nước đi tốt nhất cho AI bằng thuật toán Minimax.
 */
function findBestMove(moves: Map<string, Side>, aiSide: Side): { x: number, y: number } {
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
    // Nếu không tìm thấy nước đi nào (trường hợp hiếm), trả về một nước đi mặc định
    if (bestMove.x === -1) {
        if (moves.size === 0) return {x: 0, y: 0};
        const fallbackMove = Array.from(candidates)[0];
        if (fallbackMove) {
             const [x, y] = fallbackMove.split(',').map(Number);
             return {x, y};
        }
        return {x: 0, y: 0}; // Fallback cuối cùng
    }
    return bestMove;
}

/**
 * Thuật toán Minimax với cắt tỉa Alpha-Beta.
 */
function minimax(moves: Map<string, Side>, depth: number, alpha: number, beta: number, isMaximizing: boolean, aiSide: Side, opponentSide: Side): number {
    // Sử dụng checkWin để kiểm tra trạng thái thắng/thua cuối cùng, giúp AI thông minh hơn.
    const lastMoveKey = Array.from(moves.keys()).pop();
    if(lastMoveKey) {
        const [x, y] = lastMoveKey.split(',').map(Number);
        const side = moves.get(lastMoveKey)!;
        if(checkWin(moves, {x, y, side})) {
             // Ưu tiên các chiến thắng sớm hơn
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

/**
 * Hàm lượng giá "siêu cấp", tính điểm cho trạng thái bàn cờ hiện tại.
 */
function evaluateBoard(moves: Map<string, Side>, aiSide: Side, opponentSide: Side): number {
    let aiTotalScore = 0;
    let opponentTotalScore = 0;

    const directions = [{dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: 1, dy: 1}, {dx: 1, dy: -1}];
    const checkedLines = new Set<string>();

    const allPieces = Array.from(moves.keys());
    if (allPieces.length === 0) return 0;

    for (const key of allPieces) {
        const [x, y] = key.split(',').map(Number);
        for (const dir of directions) {
            const lineKey = getLineKey(dir, x, y);

            if (!checkedLines.has(lineKey)) {
                checkedLines.add(lineKey);
                
                const line: (Side | null)[] = [];
                // Lấy một chuỗi 9 ô (từ -4 đến 4) xung quanh quân cờ để có đủ "context"
                for (let i = -4; i <= 4; i++) {
                    line.push(moves.get(`${x + i * dir.dx},${y + i * dir.dy}`) || null);
                }

                // Tính điểm cho AI trên chuỗi này
                const aiLineScore = scoreLineForPlayer(line, aiSide, opponentSide);
                if (aiLineScore >= SCORE.FIVE) return SCORE.FIVE; // Thắng ngay
                aiTotalScore += aiLineScore;

                // Tính điểm cho đối thủ trên chuỗi này
                const opponentLineScore = scoreLineForPlayer(line, opponentSide, aiSide);
                if (opponentLineScore >= SCORE.FIVE) return -SCORE.FIVE; // Thua ngay
                opponentTotalScore += opponentLineScore;
            }
        }
    }
    
    // AI sẽ cân bằng giữa việc tối đa hóa điểm của mình và tối thiểu hóa điểm của đối thủ.
    // Tăng hệ số của điểm đối thủ để AI có xu hướng phòng thủ mạnh hơn.
    return aiTotalScore - opponentTotalScore * 1.5;
}

/**
 * Tính điểm cho một người chơi trên một chuỗi 9 ô bằng cách nhận dạng mẫu.
 * Đây là "bộ não" chính của AI.
 */
function scoreLineForPlayer(line: (Side | null)[], player: Side, opponent: Side): number {
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


/**
 * Lấy một key duy nhất cho một đường thẳng để tránh tính toán lại.
 */
function getLineKey(dir: {dx: number, dy: number}, x: number, y: number): string {
    if (dir.dx === 1 && dir.dy === 0) { // Ngang
        return `h,${y}`;
    }
    if (dir.dx === 0 && dir.dy === 1) { // Dọc
        return `v,${x}`;
    }
    if (dir.dx === 1 && dir.dy === 1) { // Chéo chính \
        return `d1,${y - x}`;
    }
    // Chéo phụ / (dx: 1, dy: -1)
    return `d2,${y + x}`;
}

/**
 * Lấy danh sách các nước đi tiềm năng (các ô trống cạnh các quân đã đi).
 */
function getCandidateMoves(moves: Map<string, Side>): Set<string> {
  const candidates = new Set<string>();
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