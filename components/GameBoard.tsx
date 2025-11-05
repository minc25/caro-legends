import React from 'react';
import { Room, Player, GameState, Move, Side } from '../types';
import useGameEngine from '../hooks/useGameEngine';
import { checkWin } from '../services/gameLogic';
import { CenterIcon, ZoomInIcon, ZoomOutIcon } from './icons';

interface GameBoardProps {
  room: Room;
  player: Player;
  gameState: GameState;
  isProcessingAI: boolean;
  isOnlineMode: boolean;
  onMove: (x: number, y: number, newGameState: GameState) => void;
  onGameOver: (finalGameState: GameState) => void;
  onRestart: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ room, player, gameState, isProcessingAI, isOnlineMode, onMove, onGameOver, onRestart }) => {
  const { moves, currentTurn, winner } = gameState;
  
  const isMyTurn = !winner && (currentTurn === player.side || room.aiOpponent === 'local');

  const skinMap = new Map<Side, string>();
  room.players.forEach(p => {
    if (p.side) {
        skinMap.set(p.side, p.skin);
    }
  });

  const handleCellClick = (x: number, y: number) => {
    if (!isMyTurn || isProcessingAI) return;
    const moveKey = `${x},${y}`;
    if (moves.has(moveKey)) return;

    // Trong chế độ online, chỉ gửi nước đi. Server sẽ tính toán và gửi lại state.
    if (isOnlineMode) {
        onMove(x, y, gameState); // onMove bây giờ chỉ cần tọa độ
        return;
    }
    
    // Logic cho chế độ offline
    const newMoves = new Map<string, Side>(moves);
    newMoves.set(moveKey, currentTurn);

    const lastMove: Move = { x, y, side: currentTurn };
    const winResult = checkWin(newMoves, lastMove);

    const nextTurn = currentTurn === 'X' ? 'O' : 'X';

    if (winResult) {
      const finalState: GameState = {
        ...gameState,
        moves: newMoves,
        winner: currentTurn,
        winningLine: winResult,
      };
      onGameOver(finalState);
    } else if (newMoves.size >= 225) {
      const finalState: GameState = { ...gameState, moves: newMoves, winner: 'draw', winningLine: null };
      onGameOver(finalState);
    }
    else {
       const newState: GameState = {
        ...gameState,
        moves: newMoves,
        currentTurn: nextTurn,
      };
      onMove(x, y, newState);
    }
  };

  const { canvasRef, centerView, zoomIn, zoomOut } = useGameEngine(gameState, skinMap, handleCellClick);
  
  const turnPlayer = room.players.find(p => p.side === currentTurn);
  
  const getStatusText = () => {
    if (winner) {
        return winner === 'draw' ? 'Hòa cờ!' : `Bên ${winner} thắng!`;
    }
    if (room.aiOpponent === 'local') {
        return `Lượt của bên: ${currentTurn}`;
    }
    if (isProcessingAI) {
        return `Lượt của ${turnPlayer?.name}... (AI đang tính)`;
    }
    const turnText = isMyTurn ? "Lượt của bạn" : `Lượt của ${turnPlayer?.name}`;
    return `${turnText} (${turnPlayer?.side})`;
  };
  const statusText = getStatusText();

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-7xl bg-gray-800 p-3 rounded-t-lg shadow-lg flex justify-between items-center flex-wrap gap-4">
         <div className="flex items-center gap-4">
            {room.players.map(p => (
                <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-300 ${p.side === currentTurn && !winner ? 'bg-lime-600/50 ring-2 ring-lime-400 scale-105' : 'bg-gray-700'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-2xl ${p.side === 'X' ? 'bg-lime-500' : 'bg-fuchsia-500'}`}>{p.skin}</div>
                    <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-400">Bên {p.side}</div>
                    </div>
                </div>
            ))}
         </div>
         <div className={`text-xl font-semibold px-4 py-2 rounded-lg ${winner ? (winner === 'draw' ? 'bg-yellow-600' : 'bg-green-600') : 'bg-gray-700'}`}>
            {statusText}
         </div>
      </div>
      
      <div className="relative w-full flex-1">
        {winner && !isOnlineMode && (
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={onRestart}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg animate-pulse-slow transition-transform hover:scale-110"
                >
                    Về phòng chờ
                </button>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`absolute top-0 left-0 w-full h-full bg-gray-900 ${isMyTurn ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
        />
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button onClick={zoomIn} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors shadow-lg" aria-label="Zoom In"><ZoomInIcon/></button>
            <button onClick={zoomOut} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors shadow-lg" aria-label="Zoom Out"><ZoomOutIcon/></button>
            <button onClick={() => centerView()} className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors shadow-lg" aria-label="Center View"><CenterIcon/></button>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
