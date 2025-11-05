import React, { useState } from 'react';
import { LogoIcon, HeartIcon, CopyIcon, BugIcon } from './icons';
import Modal from './Modal';

interface LobbyProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, roomId: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      alert('Vui lòng nhập tên của bạn!');
      return;
    }
    if (isJoining) {
      if (roomId.trim() === '') {
        alert('Vui lòng nhập ID phòng!');
        return;
      }
      onJoinRoom(name, roomId.toUpperCase());
    } else {
      onCreateRoom(name);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Đã sao chép: ${text}`);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md text-center animate-fade-in-up">
        <div className="flex justify-center items-center gap-4 mb-6">
            <LogoIcon className="h-12 w-12 text-lime-400"/>
            <h1 className="text-4xl font-bold text-white tracking-wider">Caro Legends</h1>
        </div>
        <p className="text-gray-400 mb-8">Chơi cùng bạn bè hoặc thử sức với AI</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
            maxLength={15}
            autoFocus
          />
          
          {isJoining && (
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Nhập ID phòng..."
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-lime-500 transition-colors"
              maxLength={5}
            />
          )}

          <div className="flex gap-4">
             <button
              type="button"
              onClick={() => setIsJoining(false)}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${!isJoining ? 'bg-lime-500 text-gray-900 shadow-lg scale-105' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Tạo phòng
            </button>
             <button
              type="button"
              onClick={() => setIsJoining(true)}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${isJoining ? 'bg-fuchsia-500 text-white shadow-lg scale-105' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              Tham gia phòng
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#c084fc] rounded-lg font-bold text-white hover:bg-[#a855f7] focus:outline-none focus:ring-2 focus:ring-[#c084fc] focus:ring-opacity-50 transform hover:scale-105 transition-transform"
          >
            {isJoining ? 'Vào phòng' : 'Tạo mới'}
          </button>
        </form>

        <div className="mt-8 border-t border-gray-700 pt-6 space-y-4">
          <button
            onClick={() => setIsDonateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-fuchsia-500 rounded-lg font-bold text-white hover:bg-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-opacity-50 transform hover:scale-105 transition-all"
          >
            <HeartIcon className="w-5 h-5" />
            <span>Ủng hộ tác giả</span>
          </button>
          <a
            href="https://www.facebook.com/nbm2610"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 rounded-lg font-bold text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transform hover:scale-105 transition-all"
          >
            <BugIcon className="w-5 h-5" />
            <span>Báo lỗi</span>
          </a>
        </div>
      </div>

      {isDonateModalOpen && (
        <Modal title="Ủng hộ tác giả" onClose={() => setIsDonateModalOpen(false)}>
          <div className="text-left space-y-4">
            <p className="text-gray-300">
              Cảm ơn bạn đã quan tâm và ủng hộ để mình có thêm động lực phát triển dự án!
            </p>
            <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-400">Ngân Hàng:</span>
                    <span className="font-bold text-white">VP BANK</span>
                </div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-400">Chủ Tài Khoản:</span>
                    <span className="font-bold text-white">Nguyễn Bình Minh</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-400">Số Tài Khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lime-400 text-lg">0938388603</span>
                      <button onClick={() => handleCopy('0938388603')} className="text-gray-400 hover:text-white transition-colors" aria-label="Copy account number">
                          <CopyIcon className="w-5 h-5" />
                      </button>
                    </div>
                </div>
            </div>
             <p className="text-center text-sm text-gray-500 mt-4">
                Caro Legends Online By Minc
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Lobby;