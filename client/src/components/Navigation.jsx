import { Link, useLocation } from 'react-router-dom';

export const Navigation = ({ isCreator = false }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="flex gap-2 mb-8 bg-dark-card/50 p-2 rounded-2xl border border-dark-border/50 backdrop-blur-sm">
      <Link
        to="/"
        className={`flex-1 px-6 py-3 rounded-xl font-bold text-center transition-all no-underline ${
          isActive('/')
            ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg'
            : 'bg-transparent text-dark-muted hover:bg-dark-secondary hover:text-white'
        }`}
      >
        Alertas
      </Link>
      <Link
        to="/tts"
        className={`flex-1 px-6 py-3 rounded-xl font-bold text-center transition-all no-underline ${
          isActive('/tts')
            ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg'
            : 'bg-transparent text-dark-muted hover:bg-dark-secondary hover:text-white'
        }`}
      >
        TTS
      </Link>
      {isCreator && (
        <Link
          to="/creator"
          className={`flex-1 px-6 py-3 rounded-xl font-bold text-center transition-all no-underline ${
            isActive('/creator')
              ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg'
              : 'bg-transparent text-dark-muted hover:bg-dark-secondary hover:text-white'
          }`}
        >
          Creador
        </Link>
      )}
    </nav>
  );
};
