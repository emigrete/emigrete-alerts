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
    <div style={{
      color: 'white',
      padding: 50,
      background: '#18181b',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h2 style={{ fontFamily: 'sans-serif' }}>Conectando con Twitch... 👾</h2>
    </div>
  );
}
