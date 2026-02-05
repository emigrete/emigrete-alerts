import { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // No mostrar loading en la ruta del overlay (es una página transparente)
    if (location.pathname === '/overlay') {
      setIsLoading(false);
      return;
    }

    // Mostrar loading cuando cambia la ruta
    setIsLoading(true);
    
    // Esconder loading después de que la página cargue completamente
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
