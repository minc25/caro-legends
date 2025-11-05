// constants.ts

// Danh sách skin. Trong ứng dụng thực, bạn có thể đọc tự động từ thư mục /assets.
// Hiện tại, chúng ta dùng text để đại diện và sẽ style nó.
export const SKINS = {
  X: ['X'],
  O: ['O'],
};

// Các hằng số cho bàn cờ (Canvas)
export const CELL_SIZE = 40;     // Kích thước mỗi ô cờ (pixels)
export const MIN_ZOOM = 0.5;     // Mức zoom nhỏ nhất
export const MAX_ZOOM = 2.5;     // Mức zoom lớn nhất
export const ZOOM_SENSITIVITY = 0.001; // Độ nhạy khi cuộn chuột để zoom

// Các hằng số cho AI
export const AI_THINKING_TIME = 800; // Thời gian suy nghĩ của AI (ms)
export const HARD_AI_DEPTH = 3;      // Độ sâu cho thuật toán Minimax (3 là cân bằng tốt cho web)