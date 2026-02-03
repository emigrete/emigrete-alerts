import { COLORS } from '../constants/config';

export const Header = ({ username, userId, onLogout }) => (
  <header className="flex justify-between items-center mb-8 pb-6 border-b-2 border-primary/20">
    <div>
      <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-2">
        Tu Dashboard
      </h1>
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <span className="text-dark-muted text-sm font-mono">
          {username ? `${username} (${userId?.substring(0, 8)}...)` : userId}
        </span>
      </div>
    </div>

    <button 
      onClick={onLogout}
      className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg hover:bg-red-500/20 hover:border-red-500 transition-all font-semibold"
    >
      Desloguearse
    </button>
  </header>
);
