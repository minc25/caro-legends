// hooks/useSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, Room } from '../types';

// URL của server. Sử dụng biến môi trường để dễ dàng thay đổi giữa local và production.
// FIX: Sử dụng optional chaining để truy cập biến môi trường một cách an toàn, tránh lỗi khi `import.meta.env` không tồn tại.
const SERVER_URL = (import.meta as any)?.env?.VITE_SERVER_URL || 'http://localhost:3000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Chỉ khởi tạo socket một lần
    if (socketRef.current) return;

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Đã kết nối tới server với ID:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Đã ngắt kết nối với server.');
      setIsConnected(false);
      // Có thể thêm logic reset state ở đây nếu cần
    });

    socket.on('error_message', (message: string) => {
      alert(`Lỗi từ server: ${message}`);
    });

    // Lắng nghe các sự kiện cập nhật từ server
    socket.on('room_created', ({ room, player }) => {
      setRoom(room);
      setPlayer(player);
    });

    socket.on('room_update', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      // Cập nhật thông tin player hiện tại nếu có thay đổi
      const currentPlayer = updatedRoom.players.find(p => p.id === socket.id);
      if (currentPlayer) {
        setPlayer(currentPlayer);
      }
    });
    
    socket.on('player_update', (updatedPlayer: Player) => {
        setPlayer(updatedPlayer);
    });

    // FIX: Handle the server payload correctly. `updatedRoom` has `gameState.moves` as an object.
    // It needs to be converted to a Map to match the client-side `GameState` type.
    socket.on('game_started', (updatedRoom: any) => {
      let processedGameState: GameState | null = null;
      if (updatedRoom.gameState && updatedRoom.gameState.moves) {
          const movesMap = new Map<string, 'X' | 'O'>(Object.entries(updatedRoom.gameState.moves));
          processedGameState = { ...updatedRoom.gameState, moves: movesMap };
      }
      
      setGameState(processedGameState);
      // Also update the room state with the correctly processed gameState
      setRoom({ ...updatedRoom, gameState: processedGameState });
    });
    
    // FIX: Type the server payload as `any` and correctly convert `moves` from an object to a Map.
    socket.on('game_state_update', (newGameState: any) => {
       const movesMap = new Map<string, 'X' | 'O'>(Object.entries(newGameState.moves));
       setGameState({ ...newGameState, moves: movesMap });
    });

    return () => {
      console.log('Ngắt kết nối socket...');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);
  
  // === Các hàm để gửi sự kiện lên server ===
  const createRoom = useCallback((playerData: Omit<Player, 'id'>) => {
    socketRef.current?.emit('create_room', playerData);
  }, []);

  const joinRoom = useCallback((roomId: string, playerData: Omit<Player, 'id'>) => {
    socketRef.current?.emit('join_room', { roomId, playerData });
  }, []);

  const updatePlayerInRoom = useCallback((updatedPlayer: Player) => {
     if (room) {
        socketRef.current?.emit('update_player_in_room', { roomId: room.id, player: updatedPlayer });
     }
  }, [room]);

  const startGame = useCallback(() => {
    if (room) {
        socketRef.current?.emit('start_game', room.id);
    }
  }, [room]);

  const makeMove = useCallback((x: number, y: number, side: 'X' | 'O') => {
    if (room) {
        socketRef.current?.emit('player_move', { roomId: room.id, move: {x, y, side} });
    }
  }, [room]);

  const leaveRoom = useCallback(() => {
    if (room) {
      socketRef.current?.emit('leave_room', room.id);
    }
    setRoom(null);
    setPlayer(null);
    setGameState(null);
  }, [room]);

  return { 
    socket: socketRef.current,
    isConnected,
    room,
    player,
    gameState,
    setRoom,
    setPlayer,
    setGameState,
    createRoom,
    joinRoom,
    updatePlayerInRoom,
    startGame,
    makeMove,
    leaveRoom,
   };
};