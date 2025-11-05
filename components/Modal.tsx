import React, { useEffect } from 'react';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  buttonText?: string; // Giữ lại prop này nếu cần dùng ở nơi khác, nhưng trong gameover sẽ không dùng
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, buttonText }) => {
    // Thêm event listener để đóng modal khi nhấn phím Escape
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

  return (
    // Giảm độ mờ của lớp phủ nền để bàn cờ rõ hơn
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Áp dụng hiệu ứng trong suốt, mờ nền (glassmorphism) và viền để nổi bật */}
      <div className="relative bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 transform transition-all animate-fade-in-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="Đóng"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center">
          <h3 id="modal-title" className="text-2xl font-bold text-white mb-4">{title}</h3>
          <div className="text-gray-300 mb-6">
            {children}
          </div>
          {buttonText && (
            <button
                onClick={onClose}
                className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
