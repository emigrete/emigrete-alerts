export const LoginCard = ({ loginUrl, username }) => (
  <div className="min-h-screen w-full overflow-hidden bg-black flex justify-center items-center p-5 relative">
    {/* Fondo animado */}
    <div className="fixed inset-0 z-0">
      {/* Gradiente base */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-card to-primary/10" />
      
      {/* Orbes animadas */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
      <div className="absolute top-1/3 right-0 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />

      {/* Líneas decorativas */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1440 800">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9146FF" />
              <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="150" stroke="url(#grad1)" strokeWidth="2" fill="none" />
          <circle cx="1200" cy="600" r="200" stroke="url(#grad1)" strokeWidth="2" fill="none" />
          <path d="M 100 400 Q 300 200 500 400" stroke="url(#grad1)" strokeWidth="2" fill="none" />
        </svg>
      </div>
    </div>

    {/* Card */}
    <div className="relative z-10 bg-dark-card/40 backdrop-blur-xl p-12 rounded-3xl border border-primary/30 shadow-2xl max-w-md w-full text-center">
      <img src="/assets/Buho Logo Alertas.png" alt="Welyczko" className="w-24 h-24 mx-auto mb-4 object-contain" />
      <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-pink-500 to-cyan-500 bg-clip-text text-transparent mb-3">
        Welyczko Alerts
      </h1>
      <p className="text-dark-muted text-sm mb-6">Alertas profesionales para tu stream</p>

      <p className="text-dark-muted leading-relaxed text-base mb-8">
        Transformá tus canjeadores en momentos especiales. Videos, audios, GIFs y voces IA para alertas personalizadas.
      </p>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 mb-8 text-xs">
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="block text-dark-muted font-semibold">Multimedia</span>
        </div>
        <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
          <span className="block text-dark-muted font-semibold">Voz IA</span>
        </div>
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <span className="block text-dark-muted font-semibold">Gestión</span>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <a href={loginUrl} className="no-underline block">
          <button className="w-full bg-gradient-to-r from-primary via-pink-500 to-primary text-white font-black py-4 px-6 rounded-xl hover:shadow-2xl hover:scale-105 transition-all text-lg">
            Conectate con Twitch
          </button>
        </a>
      </div>

      {/* Footer */}
      <div className="border-t border-dark-border pt-6 text-xs text-dark-muted space-y-2">
        <p>Próximamente: Integración con Kick</p>
        <p>Creá alertas dinámicas para tu streaming</p>
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
