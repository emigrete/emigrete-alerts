import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Estado inicial desde localStorage o valor por defecto
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? item : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  // Sincronizar cuando localStorage cambia (en otra pestaña, logout, etc)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        setStoredValue(item || initialValue);
      } catch (error) {
        console.error('Error reading localStorage:', error);
      }
    };

    // Escuchar cambios en otras pestañas
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  // Setter que actualiza tanto estado como localStorage
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (valueToStore === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  };

  return [storedValue, setValue];
};
