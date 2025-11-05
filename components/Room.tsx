import React, { useMemo } from 'react';
import { Room, Player, Side, AIOption } from '../types';
import { SKINS } from '../constants';
import { CopyIcon, LeaveIcon, BotIcon } from './icons';

interface RoomProps {
  room: Room;
  player: Player;
  isOnlineMode: boolean;
  onPlayerUpdate: (player: Player) => void;
  onStartGame: () => void;
  onSetOpponent: (level: AIOption) => void;
  onLeaveRoom: () => void;
}

const RoomComponent: React.FC<RoomProps> = ({ room, player, isOnlineMode, onPlayerUpdate, onStartGame, onSetOpponent, onLeaveRoom }) => {
  const isHost = player.isHost;
  
  const canStart = useMemo(() => {
    if (!isHost) return false;
    if (room.aiOpponent === 'local' || room.aiOpponent === 'hard') {
        return true;
    }
    // Online mode
    if (room.players.length < 2) return false;
    // Check if both players have selected a side
    const playerX = room.players.find(p => p.side === 'X');
    const playerO = room.players.find(p => p.side === 'O');
    if (!playerX || !playerO) return false;
    
    return room.players.every(p => p.isReady);
  }, [room, isHost]);

  const handleSideSelect = (side: Side) => {
    const isTaken = room.players.some(p => p.id !== player.id && p.side === side);
    if (isTaken) {
      alert('Bên này đã có người chọn!');
      return;
    }
    const newSkin = side === 'X' ? SKINS.X[0] : SKINS.O[0];
    onPlayerUpdate({ ...player, side, skin: newSkin, isReady: false });
  };

  const handleReady = () => {
    if (!player.side) {
      alert('Vui lòng chọn bên X hoặc O trước khi sẵn sàng!');
      return;
    }
    if (!isOnlineMode) {
        alert('Chế độ sẵn sàng chỉ dành cho chơi Online.');
        return;
    }
    onPlayerUpdate({ ...player, isReady: !player.isReady });
  };
  
  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id).then(() => {
        alert(`Đã sao chép mã phòng: ${room.id}`);
    });
  };

  const playerIsX = room.players.find(p => p.side === 'X');
  const playerIsO = room.players.find(p => p.side === 'O');
  
  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-white">Phòng chờ {isOnlineMode ? '(Online)' : '(Offline)'}</h2>
        {isOnlineMode && (
          <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-gray-400">Mã phòng:</span>
            <span className="text-lime-400 font-mono text-2xl tracking-widest">{room.id}</span>
            <button onClick={copyRoomId} className="text-gray-400 hover:text-white transition-colors" aria-label="Copy Room ID"><CopyIcon className="w-5 h-5"/></button>
          </div>
        )}
        <button onClick={onLeaveRoom} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition-colors">
          <LeaveIcon className="w-5 h-5"/> {isOnlineMode ? 'Rời phòng' : 'Về Lobby'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Người chơi</h3>
          <ul className="space-y-3">
            {room.players.map(p => (
              <li key={p.id} className={`p-3 rounded-lg transition-all ${p.id === player.id ? 'bg-lime-900/50 ring-2 ring-lime-500' : 'bg-gray-700'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg truncate">{p.name} {p.isHost && '(Host)'} {p.isBot && <BotIcon className="inline w-5 h-5 mb-1"/>}</span>
                  {isOnlineMode && (
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${p.isReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-gray-900'}`}>
                      {p.isReady ? 'Sẵn sàng' : 'Chưa SS'}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  Bên: {p.side || 'Chưa chọn'} | Skin: {p.skin || 'Mặc định'}
                </div>
              </li>
            ))}
             {isOnlineMode && room.players.length < 2 && (
                <li className="p-3 rounded-lg bg-gray-700/50 border-2 border-dashed border-gray-600 text-center text-gray-400">
                    Đang chờ người chơi thứ 2...
                </li>
             )}
          </ul>
        </div>

        <div className="md:col-span-2 bg-gray-900/50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Tùy chỉnh của bạn</h3>
          
          <div className="mb-6">
            <h4 className="font-semibold mb-3">1. Chọn bên</h4>
            <div className="flex gap-4">
               <button
                onClick={() => handleSideSelect('X')}
                disabled={!!playerIsX && playerIsX.id !== player.id}
                className={`flex-1 py-4 text-4xl font-black rounded-lg transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed ${
                    player.side === 'X' 
                    ? 'bg-lime-500 text-white scale-105 shadow-lg shadow-lime-500/40 ring-4 ring-lime-400 ring-offset-2 ring-offset-gray-900' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >X</button>
               <button
                onClick={() => handleSideSelect('O')}
                disabled={!!playerIsO && playerIsO.id !== player.id}
                className={`flex-1 py-4 text-4xl font-black rounded-lg transition-all duration-300 ease-in-out disabled:opacity-40 disabled:cursor-not-allowed ${
                    player.side === 'O' 
                    ? 'bg-fuchsia-500 text-white scale-105 shadow-lg shadow-fuchsia-500/40 ring-4 ring-fuchsia-400 ring-offset-2 ring-offset-gray-900' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >O</button>
            </div>
          </div>
          
          {isHost && !isOnlineMode && (
             <div className="mb-6">
              <h4 className="font-semibold mb-3">2. Chọn chế độ chơi (Offline)</h4>
               <div className="flex gap-4">
                <button onClick={() => onSetOpponent('local')} className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${room.aiOpponent === 'local' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Chơi 2 Người</button>
                <button onClick={() => onSetOpponent('hard')} className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${room.aiOpponent === 'hard' ? 'bg-orange-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Chơi với Super AI</button>
               </div>
               <p className="text-sm text-gray-400 mt-2">Chọn một chế độ sẽ hủy chế độ khác.</p>
             </div>
          )}

          <div className="flex gap-4 mt-8">
            {isOnlineMode ? (
              <button
                onClick={handleReady}
                disabled={!player.side}
                className={`flex-1 py-3 text-lg font-bold rounded-lg transition-transform transform hover:scale-105 ${player.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
              >
                {player.isReady ? 'Bỏ sẵn sàng' : 'Sẵn sàng'}
              </button>
            ) : <div className="flex-1"></div>}

            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="flex-1 py-3 text-lg font-bold rounded-lg bg-indigo-600 transition-all transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100"
              >
                Bắt đầu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomComponent;