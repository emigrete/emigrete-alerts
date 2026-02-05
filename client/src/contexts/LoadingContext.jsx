import { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // No mostrar loading en la ruta del overlay
    if (location.pathname === '/overlay' || location.pathname === '/creator-overlay') {
      setIsLoading(false);
      setIsComplete(false);
      return;
    }

    let mounted = true;
    let showLoadingTimer;
    let completionTimer;

    // Delay antes de mostrar el loader (si carga rápido, no se ve)
    showLoadingTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(true);
      }
    }, 300); // Si carga en menos de 300ms, no se muestra

    const handleContentReady = () => {
      if (!mounted) return;
      
      // Limpiar el timer de mostrar loading si aún no se ejecutó
      clearTimeout(showLoadingTimer);
      
      // Si el loader ya está visible, marcar como completo
      setIsComplete(true);
      completionTimer = setTimeout(() => {
        if (mounted) {
          setIsLoading(false);
        }
      }, 300);
    };

    // Esperar a que el DOM esté listo
    if (document.readyState === 'complete') {
      handleContentReady();
    } else {
      window.addEventListener('load', handleContentReady);
    }

    // Fallback: después de 3 segundos, forzar que se cierre
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        handleContentReady();
      }
    }, 3000);

    return () => {
      mounted = false;
      window.removeEventListener('load', handleContentReady);
      clearTimeout(showLoadingTimer);
      clearTimeout(fallbackTimer);
      clearTimeout(completionTimer);
    };
  }, [location.pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, isComplete }}>
      {children}
    </LoadingContext.Provider>
  );
}
