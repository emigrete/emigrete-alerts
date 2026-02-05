export const LoadingScreen = ({ fullPage = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Spinner minimalista */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-dark-border/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
      </div>
      
      {/* Texto opcional */}
      <p className="text-dark-muted text-sm font-semibold">Cargando...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center text-dark-text bg-dark-bg relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
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
        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 bg-dark-card/60 border border-dark-border rounded-2xl">
      {content}
    </div>
  );
};
