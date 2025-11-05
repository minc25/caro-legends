// Kiểu dữ liệu cho các bên cờ
export type Side = 'X' | 'O';

// Interface đại diện cho một người chơi
export interface Player {
  id: string;         // ID duy nhất (socket.id trong môi trường thật)
  name: string;       // Tên người chơi
  side: Side | null;  // Bên 'X' hoặc 'O'
  skin: string;       // Skin đã chọn (ví dụ: 'X1', 'O2')
  isReady: boolean;   // Trạng thái sẵn sàng
  isHost: boolean;    // Có phải là chủ phòng không
  isBot: boolean;     // Có phải là máy (AI) không
}

// Các tùy chọn chế độ chơi: không có đối thủ (chờ online), chơi 2 người, hoặc chơi với AI khó
export type AIOption = 'none' | 'local' | 'hard';

// Interface đại diện cho một phòng chơi
export interface Room {
  id: string;
  players: Player[];
  aiOpponent: AIOption;
  // FIX: Add gameState to the room, as the server will send it when a game starts.
  gameState?: GameState | null;
}

// Interface đại diện cho một nước đi
export interface Move {
  x: number;
  y: number;
  side: Side;
}

// Interface đại diện cho trạng thái của ván cờ
export interface GameState {
  moves: Map<string, Side>; // Key là "x,y", value là 'X' hoặc 'O'
  currentTurn: Side;
  winner: Side | 'draw' | null; // Người thắng, hòa, hoặc chưa kết thúc
  winningLine: Move[] | null;   // Mảng các quân cờ trên đường thắng
}

// Các trạng thái chính của ứng dụng
export type GameStatus = 'lobby' | 'room' | 'playing' | 'gameover';

// Interface cho viewport của canvas (pan & zoom)
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
