import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// --- URL DINÁMICA (Local vs Producción) ---
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    // Evitamos que React ejecute esto dos veces
    if (code && !processed.current) {
      processed.current = true;
      console.log("Código recibido de Twitch:", code);

      // Usamos la variable API_URL en lugar de localhost fijo
      axios.post(`${API_URL}/auth/twitch/callback`, { code })
        .then(res => {
          console.log("¡Login Exitoso!", res.data);
          localStorage.setItem('twitchUserId', res.data.userId);
          navigate('/'); 
        })
        .catch(err => {
          console.error("Error al canjear token:", err);
          // Un poco más de detalle en el error para debugear
          alert(`Error conectando con el servidor (${API_URL}). Ver consola.`);
          navigate('/');
        });
    }
  }, [searchParams, navigate]);

  return (
    <div style={{color: 'white', padding: 50, background: '#18181b', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <h2 style={{fontFamily: 'sans-serif'}}>Conectando con Twitch... 👾</h2>
    </div>
  );
}