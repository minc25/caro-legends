import React, { useState, useCallback, useEffect } from 'react';
import { GameStatus, Room, Player, GameState, AIOption, Side } from './types';
import Lobby from './components/Lobby';
import RoomComponent from './components/Room';
import GameBoard from './components/GameBoard';
import { SKINS } from './constants';
import { getAIMove } from './services/gameLogic';
import Modal from './components/Modal';
import { useSocket } from './hooks/useSocket';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('lobby');
  const [gameMode, setGameMode] = useState<'online' | 'offline' | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  
  // Custom hook để quản lý socket
  const {
    isConnected,
    room: onlineRoom,
    player: onlinePlayer,
    gameState: onlineGameState,
    setRoom: setOnlineRoom,
    setPlayer: setOnlinePlayer,
    setGameState: setOnlineGameState,
    createRoom,
    joinRoom,
    updatePlayerInRoom: updateOnlinePlayer,
    startGame: startOnlineGame,
    makeMove: makeOnlineMove,
    leaveRoom,
  } = useSocket();

  // State cho chế độ offline (local/AI)
  const [offlineRoom, setOfflineRoom] = useState<Room | null>(null);
  const [offlinePlayer, setOfflinePlayer] = useState<Player | null>(null);
  const [offlineGameState, setOfflineGameState] = useState<GameState | null>(null);
  
  // Chọn state phù hợp dựa trên chế độ chơi
  const isOnlineMode = gameMode === 'online';
  const room = isOnlineMode ? onlineRoom : offlineRoom;
  const player = isOnlineMode ? onlinePlayer : offlinePlayer;
  const gameState = isOnlineMode ? onlineGameState : offlineGameState;
  
  const setRoom = isOnlineMode ? setOnlineRoom : setOfflineRoom;
  const setPlayer = isOnlineMode ? setOnlinePlayer : setOfflinePlayer;
  const setGameState = isOnlineMode ? setOnlineGameState : setOfflineGameState;


  // Quay trở lại lobby
  const resetToLobby = () => {
    if (isOnlineMode) {
      leaveRoom();
    }
    setGameStatus('lobby');
    setGameMode(null);
    setOfflineRoom(null);
    setOfflinePlayer(null);
    setOfflineGameState(null);
    setOnlineRoom(null);
    setOnlinePlayer(null);
    setOnlineGameState(null);
    setShowGameOverModal(false);
  };

  // Tạo phòng (online)
  const handleCreateRoom = (name: string) => {
    const newPlayer: Omit<Player, 'id'> = {
      name,
      side: null,
      skin: SKINS.X[0],
      isReady: false,
      isHost: true,
      isBot: false,
    };
    setGameMode('online');
    createRoom(newPlayer);
    setGameStatus('room');
  };
  
  // Tham gia phòng (online)
  const handleJoinRoom = (name: string, roomId: string) => {
     const newPlayer: Omit<Player, 'id'> = {
      name,
      side: null,
      skin: SKINS.X[0],
      isReady: false,
      isHost: false,
      isBot: false,
    };
    setGameMode('online');
    joinRoom(roomId, newPlayer);
    setGameStatus('room');
  };

  // Cập nhật thông tin người chơi
  const handlePlayerUpdate = useCallback((updatedPlayer: Player) => {
    if (isOnlineMode) {
      updateOnlinePlayer(updatedPlayer);
    } else {
      setPlayer(updatedPlayer);
      setRoom(prevRoom => {
        if (!prevRoom) return null;
        return {
          ...prevRoom,
          players: prevRoom.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        };
      });
    }
  }, [isOnlineMode, updateOnlinePlayer, setPlayer, setRoom]);
  
  // Bắt đầu game
  const handleStartGame = () => {
    if (isOnlineMode) {
      startOnlineGame();
    } else {
      // Logic bắt đầu game offline
      if (!room) return;
      let playersToStart: Player[] = [];

      if (room.aiOpponent === 'local') {
          const hostPlayer = room.players[0];
          playersToStart = [
              { ...hostPlayer, side: 'X', skin: SKINS.X[0], name: "Người chơi X" },
              { id: 'local_player_O', name: "Người chơi O", side: 'O', skin: SKINS.O[0], isReady: true, isHost: false, isBot: false },
          ];
      } else {
          playersToStart = [...room.players];
          let playerX = playersToStart.find(p => p.side === 'X');
          let playerO = playersToStart.find(p => p.side === 'O');
          if (!playerX) playersToStart.find(p => !p.side && !p.isBot)!.side = 'X';
          if (!playerO) playersToStart.find(p => !p.side && !p.isBot)!.side = 'O';
      }
      
      setRoom(prevRoom => ({ ...prevRoom!, players: playersToStart }));
      setGameState({
        moves: new Map<string, Side>(),
        currentTurn: 'X',
        winner: null,
        winningLine: null,
      });
    }
  };

  // Thiết lập đối thủ (offline)
  const handleSetOpponent = (type: AIOption) => {
    if (!offlineRoom) { // Chỉ hoạt động khi đang tạo phòng offline
        setGameMode('offline');
        const playerId = `player_${Math.random().toString(36).substr(2, 9)}`;
        const hostPlayer: Player = { id: playerId, name: "Bạn", side: null, skin: SKINS.X[0], isReady: false, isHost: true, isBot: false };
        // FIX: Explicitly type `newRoom` as `Room` to prevent TypeScript from inferring
        // `aiOpponent` as a generic `string` instead of the specific `AIOption` type.
        const newRoom: Room = { id: 'LOCAL', players: [hostPlayer], aiOpponent: 'none' };
        setOfflinePlayer(hostPlayer);
        setOfflineRoom(newRoom);
    }

    setOfflineRoom(prevRoom => {
        if (!prevRoom) return null;
        const newOpponentType = prevRoom.aiOpponent === type ? 'none' : type;
        let players = prevRoom.players.filter(p => !p.isBot);

        if (newOpponentType === 'hard') {
            const humanPlayer = players[0];
            const botSide = humanPlayer.side === 'X' ? 'O' : 'X';
            const newBot: Player = {
                id: `bot_hard`, name: `Super AI`, side: botSide, skin: botSide === 'X' ? SKINS.X[0] : SKINS.O[0],
                isReady: true, isHost: false, isBot: true,
            };
            return { ...prevRoom, players: [humanPlayer, newBot], aiOpponent: 'hard' };
        } else {
            return { ...prevRoom, players, aiOpponent: newOpponentType };
        }
    });
  };

  // Nước đi mới
  const handleMove = (x: number, y: number, newGameState: GameState) => {
    if (isOnlineMode) {
      // FIX: The side making the move is the current turn, not the next one.
      // This was causing the server to check for a win for the wrong player.
      makeOnlineMove(x, y, newGameState.currentTurn);
    } else {
      setGameState(newGameState);
      const isBotTurn = room?.players.find(p => p.side === newGameState.currentTurn)?.isBot;
      if (room?.aiOpponent !== 'none' && !newGameState.winner && isBotTurn) {
        setIsProcessingAI(true);
      }
    }
  };

  // Game kết thúc
  const handleGameOver = (finalGameState: GameState) => {
    setGameState(finalGameState);
    setShowGameOverModal(true);
  }
  
  // Chơi lại (offline)
  const handleRestart = () => {
    if (!room) return;
    setShowGameOverModal(false);

    // In offline mode, find the host and reset the room to a state with only the host.
    const hostPlayer = room.players.find(p => p.isHost);
    if (!hostPlayer) { // Fallback if no host is found
        resetToLobby();
        return;
    }
    
    const initialPlayers: Player[] = [{ ...hostPlayer, isReady: false, side: null }];

    // FIX: Using a typed variable helps TypeScript infer the correct type for aiOpponent,
    // resolving the "string is not assignable to AIOption" error.
    const newRoomState: Room = {
      ...room, 
      players: initialPlayers, 
      aiOpponent: 'none'
    };
    
    setRoom(newRoomState);
    setGameState(null);
    setGameStatus('room');
  };

  // Effect theo dõi trạng thái game online
  useEffect(() => {
    if (onlineRoom && !onlineGameState) {
        setGameStatus('room');
    } else if (onlineRoom && onlineGameState) {
        if(onlineGameState.winner){
            setGameStatus('gameover');
            setShowGameOverModal(true);
        } else {
            setGameStatus('playing');
        }
    }
  }, [onlineRoom, onlineGameState]);
  
  // Effect theo dõi trạng thái game offline
  useEffect(() => {
    if (offlineRoom && !offlineGameState) {
      setGameStatus('room');
    } else if (offlineRoom && offlineGameState) {
       if (offlineGameState.winner) {
         setGameStatus('gameover');
       } else {
         setGameStatus('playing');
       }
    }
  }, [offlineRoom, offlineGameState]);


  // Effect xử lý nước đi của AI
  useEffect(() => {
    if (!isOnlineMode && isProcessingAI && gameState && room && room.aiOpponent === 'hard' && !gameState.winner) {
      const aiPlayer = room.players.find(p => p.isBot && p.side === gameState.currentTurn);
      if (aiPlayer) {
        const timer = setTimeout(async () => {
          const { updatedGameState } = await getAIMove(gameState, room.aiOpponent);
          if (updatedGameState.winner) {
              handleGameOver(updatedGameState);
          } else {
              setGameState(updatedGameState);
          }
          setIsProcessingAI(false);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
         setIsProcessingAI(false);
      }
    }
  }, [isOnlineMode, isProcessingAI, gameState, room]);
  
  // Effect xử lý nước đi đầu tiên của AI
  useEffect(() => {
    if (!isOnlineMode && gameStatus === 'playing' && gameState && gameState.moves.size === 0 && !gameState.winner) {
      if (room?.players.find(p => p.side === gameState.currentTurn)?.isBot) {
        setIsProcessingAI(true);
      }
    }
  }, [isOnlineMode, gameStatus, gameState, room]);


  const renderContent = () => {
    switch (gameStatus) {
      case 'lobby':
        return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
      case 'room':
        if (isOnlineMode && (!room || !player)) {
            return (
                <div className="flex flex-col gap-4 items-center justify-center h-screen">
                    <LogoIcon className="h-16 w-16 text-lime-400 animate-spin" style={{ animationDuration: '3s' }}/>
                    <p className="text-xl text-gray-300 animate-pulse">Đang kết nối tới phòng...</p>
                </div>
            );
        }
        return room && player && (
          <RoomComponent
            room={room}
            player={player}
            isOnlineMode={isOnlineMode}
            onPlayerUpdate={handlePlayerUpdate}
            onStartGame={handleStartGame}
            onSetOpponent={handleSetOpponent}
            onLeaveRoom={resetToLobby}
          />
        );
      case 'playing':
      case 'gameover':
        return room && player && gameState && (
          <>
            <GameBoard
              room={room}
              player={player}
              gameState={gameState}
              isProcessingAI={isProcessingAI}
              onMove={handleMove}
              onGameOver={handleGameOver}
              onRestart={handleRestart}
              isOnlineMode={isOnlineMode}
            />
            {gameStatus === 'gameover' && showGameOverModal && (gameState.winner || gameState.moves.size >= 225) && (
              <Modal
                title={gameState.winner === 'draw' ? "Hòa cờ!" : `Bên ${gameState.winner} thắng!`}
                onClose={() => setShowGameOverModal(false)}
              >
                <p className="text-center text-lg">
                  {gameState.winner === 'draw' 
                    ? "Một trận đấu cân tài cân sức!" 
                    : `Chúc mừng người chơi bên ${gameState.winner}!`}
                </p>
                 {isOnlineMode && (
                     <button onClick={resetToLobby} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700">Về Lobby</button>
                 )}
              </Modal>
            )}
          </>
        );
      default:
        return <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 selection:bg-lime-500 selection:text-gray-900">
       {!isConnected && isOnlineMode && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-center p-2 z-50">
            Đang kết nối tới server...
        </div>
      )}
      <div className="w-full max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;