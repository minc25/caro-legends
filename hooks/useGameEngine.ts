import { useRef, useEffect, useCallback } from 'react';
import { GameState, Side, Viewport } from '../types';
import { CELL_SIZE, MIN_ZOOM, MAX_ZOOM, ZOOM_SENSITIVITY } from '../constants';

const useGameEngine = (
  gameState: GameState,
  skinMap: Map<Side, string>,
  onCellClick: (x: number, y: number) => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const isSpaceDownRef = useRef(false);
  const initialPinchDistanceRef = useRef(0); // Dành cho zoom cảm ứng

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x: viewX, y: viewY, zoom } = viewportRef.current;

    // Xóa canvas và đặt nền
    ctx.fillStyle = '#111827'; // bg-gray-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- Vẽ lưới và đường thắng (trong không gian world-space) ---
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-viewX, -viewY);

    // Tính toán phạm vi lưới có thể nhìn thấy để tối ưu hiệu suất
    const startX = Math.floor((viewX - canvas.width / (2 * zoom)) / CELL_SIZE);
    const endX = Math.ceil((viewX + canvas.width / (2 * zoom)) / CELL_SIZE);
    const startY = Math.floor((viewY - canvas.height / (2 * zoom)) / CELL_SIZE);
    const endY = Math.ceil((viewY + canvas.height / (2 * zoom)) / CELL_SIZE);

    // Vẽ các đường lưới
    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    for (let i = startX; i <= endX; i++) {
      ctx.moveTo(i * CELL_SIZE, startY * CELL_SIZE);
      ctx.lineTo(i * CELL_SIZE, endY * CELL_SIZE);
    }
    for (let i = startY; i <= endY; i++) {
      ctx.moveTo(startX * CELL_SIZE, i * CELL_SIZE);
      ctx.lineTo(endX * CELL_SIZE, i * CELL_SIZE);
    }
    ctx.stroke();

    // Vẽ đường thắng
    if (gameState.winningLine && gameState.winningLine.length > 0) {
        ctx.strokeStyle = '#facc15'; // yellow-400
        ctx.lineWidth = 5 / zoom;
        ctx.beginPath();
        const sortedLine = [...gameState.winningLine].sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y);
        const firstMove = sortedLine[0];
        const lastMove = sortedLine[sortedLine.length - 1];
        ctx.moveTo(firstMove.x * CELL_SIZE + CELL_SIZE / 2, firstMove.y * CELL_SIZE + CELL_SIZE / 2);
        ctx.lineTo(lastMove.x * CELL_SIZE + CELL_SIZE / 2, lastMove.y * CELL_SIZE + CELL_SIZE / 2);
        ctx.stroke();
    }
    ctx.restore(); // Khôi phục lại từ transform pan/zoom

    // --- Vẽ các quân cờ (trong không gian screen-space) để tránh bị mờ khi co giãn ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    gameState.moves.forEach((side, key) => {
        const [x, y] = key.split(',').map(Number);

        // Tính toán tâm quân cờ trong world coordinates
        const pieceWorldX = x * CELL_SIZE + CELL_SIZE / 2;
        const pieceWorldY = y * CELL_SIZE + CELL_SIZE / 2;

        // Chuyển từ world coordinates sang screen coordinates
        const screenX = (pieceWorldX - viewX) * zoom + canvas.width / 2;
        const screenY = (pieceWorldY - viewY) * zoom + canvas.height / 2;
        
        // Tính toán kích thước trên màn hình
        const screenSize = CELL_SIZE * zoom;

        // Tối ưu: Không vẽ các quân cờ nằm ngoài màn hình
        if (
            screenX + screenSize / 2 < 0 ||
            screenX - screenSize / 2 > canvas.width ||
            screenY + screenSize / 2 < 0 ||
            screenY - screenSize / 2 > canvas.height
        ) {
            return;
        }

        const skin = skinMap.get(side) || side;
        const fontSize = screenSize * 0.85;

        // Không render nếu quá nhỏ
        if (fontSize < 2) return;

        ctx.font = `bold ${fontSize}px 'Segoe UI', 'Helvetica Neue', sans-serif`;

        const neonColor = side === 'X' ? '#a3e635' : '#e879f9'; // lime-400, fuchsia-400
        const pieceColor = side === 'X' ? '#84cc16' : '#d946ef'; // lime-500, fuchsia-500
        
        ctx.save();
        ctx.shadowColor = neonColor;
        // Sử dụng shadow blur cố định trong screen-space
        ctx.shadowBlur = 15;
        ctx.fillStyle = pieceColor;
        ctx.fillText(skin, screenX, screenY);
        
        ctx.shadowBlur = 5;
        ctx.fillStyle = neonColor;
        ctx.fillText(skin, screenX, screenY);
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#f0f9ff';
        ctx.fillText(skin, screenX, screenY);
        ctx.restore();
    });
  }, [gameState, skinMap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        draw();
    });
    resizeObserver.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    return () => resizeObserver.disconnect();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [gameState, draw]);
  
  const getGridCoordsFromMouseEvent = useCallback((e: MouseEvent): {x: number, y: number} => {
    const canvas = canvasRef.current;
    if (!canvas) return {x: 0, y: 0};
    const rect = canvas.getBoundingClientRect();
    const { x: viewX, y: viewY, zoom } = viewportRef.current;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - canvas.width / 2) / zoom + viewX;
    const worldY = (mouseY - canvas.height / 2) / zoom + viewY;

    return { 
        x: Math.floor(worldX / CELL_SIZE), 
        y: Math.floor(worldY / CELL_SIZE) 
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' && !isPanningRef.current) {
            isSpaceDownRef.current = true;
            canvas.style.cursor = 'grab';
            e.preventDefault();
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ') {
            isSpaceDownRef.current = false;
            if (!isPanningRef.current) {
                canvas.style.cursor = '';
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && isSpaceDownRef.current)) { 
        isPanningRef.current = true;
        lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
        if (isPanningRef.current) {
            const dx = e.clientX - lastMousePositionRef.current.x;
            const dy = e.clientY - lastMousePositionRef.current.y;
            viewportRef.current.x -= dx / viewportRef.current.zoom;
            viewportRef.current.y -= dy / viewportRef.current.zoom;
            lastMousePositionRef.current = { x: e.clientX, y: e.clientY };
            draw();
        }
    };

    const handleMouseUp = () => {
        if (isPanningRef.current) {
            isPanningRef.current = false;
            canvas.style.cursor = isSpaceDownRef.current ? 'grab' : '';
        }
    };

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -ZOOM_SENSITIVITY;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewportRef.current.zoom + delta));
        viewportRef.current.zoom = newZoom;
        draw();
    };
    
    const handleClick = (e: MouseEvent) => {
        if (isPanningRef.current || e.button !== 0 || isSpaceDownRef.current) return;
        const {x, y} = getGridCoordsFromMouseEvent(e);
        onCellClick(x, y);
    }

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // === Xử lý Cảm ứng (Touch) ===
    const handleTouchStart = (e: TouchEvent) => {
      // Pan và Zoom bằng hai ngón tay
      if (e.touches.length === 2) {
        isPanningRef.current = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // Vị trí trung điểm để pan
        lastMousePositionRef.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        // Khoảng cách ban đầu để zoom
        initialPinchDistanceRef.current = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isPanningRef.current && e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];

        // --- Logic Pan ---
        const midPoint = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
        const dx = midPoint.x - lastMousePositionRef.current.x;
        const dy = midPoint.y - lastMousePositionRef.current.y;
        viewportRef.current.x -= dx / viewportRef.current.zoom;
        viewportRef.current.y -= dy / viewportRef.current.zoom;
        lastMousePositionRef.current = midPoint;

        // --- Logic Zoom (Pinch) ---
        const newDist = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
        if (initialPinchDistanceRef.current > 0) {
            const scale = newDist / initialPinchDistanceRef.current;
            const newZoom = viewportRef.current.zoom * scale;
            viewportRef.current.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
        }
        initialPinchDistanceRef.current = newDist;

        draw();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Khi số ngón tay < 2, dừng pan/zoom
      if (e.touches.length < 2) {
        isPanningRef.current = false;
        initialPinchDistanceRef.current = 0;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draw, onCellClick, getGridCoordsFromMouseEvent]);

  const centerView = useCallback(() => {
      viewportRef.current.x = 0;
      viewportRef.current.y = 0;
      viewportRef.current.zoom = 1;
      draw();
  }, [draw]);

  const zoomIn = useCallback(() => {
    viewportRef.current.zoom = Math.min(MAX_ZOOM, viewportRef.current.zoom + 0.2);
    draw();
  }, [draw]);

  const zoomOut = useCallback(() => {
    viewportRef.current.zoom = Math.max(MIN_ZOOM, viewportRef.current.zoom - 0.2);
    draw();
  }, [draw]);
  
  return { canvasRef, centerView, zoomIn, zoomOut };
};

export default useGameEngine;