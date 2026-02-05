import React, { useState, useEffect } from 'react';

export const LoadingScreen = ({ fullPage = false, isComplete = false }) => {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    'Preparando tus alertas...',
    'Conectando con Twitch...',
    'Sincronizando canjeadores...',
    'Cargando tus configuraciones...',
    'Iniciando dashboard...'
  ];

  useEffect(() => {
    if (isComplete) {
      // Cuando la página está lista, ir directo a 100% instantáneamente
      setProgress(100);
      return;
    }

    // Mientras carga, hacer que el progreso suba gradualmente pero más lentamente
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (isComplete) return 100; // Chequeo adicional para saltar a 100 rápido
        if (prev >= 85) return 85; // Se detiene en 85 mientras carga
        // Incremento variable: más rápido al inicio, más lento después
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : 1.5;
        return prev + increment;
      });
    }, 300); // Más tiempo entre incrementos

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isComplete, messages.length]);

  const content = (
    <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md">
      {/* Logo y título */}
      <div className="flex flex-col items-center gap-3">
        <img 
          src="/assets/Buho Logo Alertas.png" 
          alt="Welyczko" 
          className="w-24 h-24 object-contain"
        />
        <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          Welyczko Alerts
        </h2>
      </div>

      {/* Barra de progreso */}
      <div className="w-full space-y-3">
        <div className="h-1.5 bg-dark-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary via-blue-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Mensaje dinámico */}
        <p className="text-center text-sm text-dark-muted font-medium h-6">
          {messages[messageIndex]}
        </p>
      </div>

      {/* Indicador de porcentaje */}
      <div className="text-center">
        <p className="text-xs text-primary font-black tracking-widest">
          {Math.round(progress)}% COMPLETADO
        </p>
      </div>
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
