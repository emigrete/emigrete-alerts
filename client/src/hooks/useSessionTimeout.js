import { useEffect, useRef } from 'react';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export const useSessionTimeout = (userId, onLogout) => {
  const timeoutRef = useRef(null);
  const activityTimeoutRef = useRef(null);

  const resetTimeout = () => {
    // Limpiar timeouts anteriores
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);

    // Configura el timeout para logout automático
    timeoutRef.current = setTimeout(() => {
      onLogout();
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    if (!userId) return;

    // Eventos que resetean el timeout
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    // Inicializar timeout
    resetTimeout();

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [userId, onLogout]);
};
