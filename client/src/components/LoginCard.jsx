export const LoginCard = ({ loginUrl, username }) => (
  <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-secondary flex justify-center items-center p-5">
    <div className="bg-dark-card p-10 rounded-3xl border border-dark-border shadow-2xl max-w-md w-full text-center backdrop-blur-sm">
      <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent mb-6">
        Welyczko Alerts
      </h1>
      <p className="text-dark-muted leading-relaxed text-base mb-8">
        La plataforma para que tu stream sea inolvidable. Alertas personalizadas con tus videos favoritos.
      </p>
      <div className="mt-8">
        <a href={loginUrl} className="no-underline">
          <button className="w-full bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all">
            Conectate con Twitch
          </button>
        </a>
      </div>
    </div>
  </div>
);
