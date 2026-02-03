import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Ahora el backend nos redirige con esto:
    // /auth/callback?userId=...&username=...
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (userId) {
      localStorage.setItem('twitchUserId', userId);
      if (username) localStorage.setItem('twitchUsername', username);
      navigate('/');
      return;
    }

    // Si no vino userId, volvemos al home
    navigate('/');
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Fondo animado con gradientes */}
      <div className="fixed inset-0 z-0">
        {/* Gradiente base */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-card to-primary/20" />
        
        {/* Orbes animadas */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" />
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000" />

        {/* Líneas decorativas */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-primary rounded-full" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 border border-pink-500 rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 border border-cyan-500 rounded-full" />
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 text-center">
        <div className="mb-8 animate-pulse">
          <div className="inline-block p-6 bg-gradient-to-br from-primary to-pink-500 rounded-3xl mb-6">
            <span className="text-xl font-semibold text-white block">Twitch</span>
          </div>
        </div>
        <h2 className="text-4xl font-black bg-gradient-to-r from-primary via-pink-500 to-cyan-500 bg-clip-text text-transparent mb-3 animate-bounce">
          Conectando con Twitch...
        </h2>
        <p className="text-dark-muted text-lg font-semibold">
          Preparando tu experiencia.
        </p>

        {/* Loading animation */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
