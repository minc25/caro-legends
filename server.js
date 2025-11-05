// server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkWin } from './services/gameLogic.js'; // Import logic game

// Cấu hình để sử dụng __dirname trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Cấu hình CORS cho Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép kết nối từ bất kỳ đâu. Khi deploy, bạn nên đổi thành domain của frontend
    methods: ["GET", "POST"]
  }
});

// Phục vụ các file tĩnh từ thư mục 'dist' (build output của Vite)
// FIX: Sửa đường dẫn để trỏ ra thư mục gốc, nơi thư mục 'dist' được tạo ra.
//const distPath = path.join(__dirname, 'dist');
//app.use(express.static(distPath));

// Biến lưu trữ trạng thái của tất cả các phòng chơi trong memory
const rooms = {};

// Lắng nghe các kết nối từ client
io.on('connection', (socket) => {
  console.log(`Một người dùng đã kết nối: ${socket.id}`);

  // === QUẢN LÝ PHÒNG ===

  socket.on('create_room', (playerData) => {
    let roomId = Math.random().toString(36).substr(2, 5).toUpperCase();
    while (rooms[roomId]) {
      roomId = Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    
    playerData.isHost = true;
    playerData.id = socket.id;

    rooms[roomId] = {
      id: roomId,
      players: [playerData],
      gameState: null,
      aiOpponent: 'none',
    };

    socket.join(roomId);
    console.log(`Người dùng ${playerData.name} (${socket.id}) đã tạo và tham gia phòng ${roomId}`);

    socket.emit('room_created', { room: rooms[roomId], player: playerData });
  });

  socket.on('join_room', ({ roomId, playerData }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('error_message', 'Phòng không tồn tại!');
      return;
    }
    if (room.players.length >= 2) {
      socket.emit('error_message', 'Phòng đã đầy!');
      return;
    }
     if (room.gameState) {
      socket.emit('error_message', 'Ván cờ đã bắt đầu, không thể tham gia!');
      return;
    }

    playerData.id = socket.id;
    playerData.isHost = false;
    room.players.push(playerData);
    socket.join(roomId);
    console.log(`Người dùng ${playerData.name} (${socket.id}) đã tham gia phòng ${roomId}`);

    io.to(roomId).emit('room_update', room);
    socket.emit('player_update', playerData);
  });

  socket.on('update_player_in_room', ({ roomId, player }) => {
    const room = rooms[roomId];
    if (!room) return;
    room.players = room.players.map(p => p.id === player.id ? player : p);
    io.to(roomId).emit('room_update', room);
  });

  socket.on('start_game', (roomId) => {
     const room = rooms[roomId];
     if (!room || !room.players.some(p => p.id === socket.id && p.isHost)) {
       socket.emit('error_message', 'Chỉ host mới có thể bắt đầu game.');
       return;
     }
     if (room.players.length < 2 || !room.players.every(p => p.isReady)) {
        socket.emit('error_message', 'Cần 2 người chơi và cả hai phải sẵn sàng.');
        return;
     }

     // Khởi tạo trạng thái game
     room.gameState = {
        moves: {}, // Lưu dạng object {"x,y": "side"} để dễ serialize qua JSON
        currentTurn: 'X',
        winner: null,
        winningLine: null,
     };

     console.log(`Game bắt đầu trong phòng ${roomId}`);
     io.to(roomId).emit('game_started', room);
  });

  // === LOGIC TRONG GAME ===

  socket.on('player_move', ({ roomId, move }) => {
    const room = rooms[roomId];
    if (!room || !room.gameState) return;

    const { x, y } = move;
    const player = room.players.find(p => p.id === socket.id);
    const { gameState } = room;

    if (!player || player.side !== gameState.currentTurn) {
        socket.emit('error_message', 'Không phải lượt của bạn!');
        return;
    }
    if (gameState.moves[`${x},${y}`]) {
        socket.emit('error_message', 'Ô này đã được đánh!');
        return;
    }

    gameState.moves[`${x},${y}`] = player.side;
    
    // Server-side win check
    const movesMap = new Map(Object.entries(gameState.moves));
    const winResult = checkWin(movesMap, move);
    
    if (winResult) {
        gameState.winner = player.side;
        gameState.winningLine = winResult;
    } else if (Object.keys(gameState.moves).length >= 225) {
        gameState.winner = 'draw';
    } else {
        gameState.currentTurn = gameState.currentTurn === 'X' ? 'O' : 'X';
    }
    
    io.to(roomId).emit('game_state_update', gameState);
  });

  // Rời phòng
  socket.on('leave_room', (roomId) => {
    handleDisconnect(roomId);
  });

  socket.on('disconnect', () => {
    console.log(`Người dùng đã ngắt kết nối: ${socket.id}`);
    handleDisconnect();
  });

  const handleDisconnect = (roomIdFromEvent = null) => {
    const findRoomId = () => {
      if (roomIdFromEvent) return roomIdFromEvent;
      for (const id in rooms) {
        if (rooms[id].players.some(p => p.id === socket.id)) {
          return id;
        }
      }
      return null;
    };

    const roomId = findRoomId();
    if (!roomId) return;
    
    const room = rooms[roomId];
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex === -1) return;

    const disconnectedPlayer = room.players[playerIndex];
    console.log(`Người chơi ${disconnectedPlayer.name} đã rời phòng ${roomId}`);
    socket.leave(roomId);
    room.players.splice(playerIndex, 1);

    if (disconnectedPlayer.isHost && room.players.length > 0) {
        room.players[0].isHost = true;
        console.log(`Chuyển host cho ${room.players[0].name}`);
    }

    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`Phòng ${roomId} đã bị xóa.`);
    } else {
      io.to(roomId).emit('room_update', room);
      io.to(roomId).emit('player_left', {playerId: disconnectedPlayer.id, message: `${disconnectedPlayer.name} đã rời phòng.`});
    }
  };
});

// Route catch-all để phục vụ index.html cho các route của React Router
//app.get('*', (req, res) => {
  //res.sendFile(path.join(distPath, 'index.html'));
//});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});