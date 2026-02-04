import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';

import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { TTSManager } from '../components/TTSManager';
import { AppFooter } from '../components/AppFooter';
import UsageStatsSidebar from '../components/UsageStatsSidebar';

export default function TTSPage() {
  // Modo demo: solo desarrollo
  const isDevelopment = import.meta.env.DEV;
  const isDemo = isDevelopment && new URLSearchParams(window.location.search).get('demo') === 'true';

  const [userId, setUserId] = useState(
    isDemo ? 'demo_user_123' : localStorage.getItem('twitchUserId')
  );
  const [username, setUsername] = useState(
    isDemo ? 'Demo User' : localStorage.getItem('twitchUsername')
  );
  const [rewards, setRewards] = useState(isDemo ? [
    { id: 'reward_1', title: 'Alert Personalizado', backgroundColor: '#9146FF' },
    { id: 'reward_2', title: 'Notificación Premium', backgroundColor: '#FF6B9D' },
    { id: 'reward_3', title: 'Efecto Especial', backgroundColor: '#00D4FF' },
  ] : []);
  const [triggers, setTriggers] = useState(isDemo ? [
    {
      _id: 'trigger_1',
      twitchRewardId: 'reward_1',
      videoUrl: 'https://example.com/video1.mp4',
      medias: [
        { type: 'video', url: 'https://example.com/video1.mp4', fileName: 'triggers/video/demo1.mp4' }
      ]
    },
    {
      _id: 'trigger_2',
      twitchRewardId: 'reward_2',
      videoUrl: 'https://example.com/video2.mp4',
      medias: [
        { type: 'video', url: 'https://example.com/video2.mp4', fileName: 'triggers/video/demo2.mp4' },
        { type: 'audio', url: 'https://example.com/sound.mp3', fileName: 'triggers/audio/demo_sound.mp3' }
      ]
    },
  ] : []);

  const loginUrl = `${API_URL}/auth/twitch`;

  useEffect(() => {
    if (userId) {
      fetchRewards();
      fetchTriggers();
    }
  }, [userId]);

  const fetchRewards = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/twitch/rewards?userId=${userId}`);
      setRewards(res.data);
    } catch (err) {
      console.error('Error cargando recompensas', err);
      toast.error('Error al cargar recompensas');
    }
  };

  const fetchTriggers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/triggers?userId=${userId}`);
      setTriggers(res.data);
    } catch (err) {
      console.error('Error cargando alertas', err);
      toast.error('Error al cargar alertas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('twitchUserId');
    localStorage.removeItem('twitchUsername');
    setUserId(null);
    setUsername(null);
  };

  if (!userId) {
    return <LoginCard loginUrl={loginUrl} />;
  }

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
      {/* Líneas decorativas sutiles */}
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
      
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-3 px-4 text-center font-bold z-50 shadow-lg">
          MODO DEMO - Usalo sin iniciar sesión
        </div>
      )}
      <Toaster position="top-right" theme="dark" richColors />

      <div className={`max-w-7xl mx-auto ${isDemo ? 'pt-12' : ''} relative z-10`}>
        <Header
          username={username}
          userId={userId}
          onLogout={handleLogout}
          title="Módulo TTS"
          subtitle="Configura voz IA, límites mensuales y alertas con texto a voz en un solo lugar."
        />

        {/* Navigation */}
        <Navigation />

        <TTSManager
          triggers={triggers}
          rewards={rewards}
          userId={userId}
          username={username}
          isDemo={isDemo}
          onRefresh={fetchTriggers}
          onCreated={(newTrigger) => {
            if (isDemo && newTrigger) {
              setTriggers((prev) => [...prev, newTrigger]);
            }
          }}
        />
      </div>

      <UsageStatsSidebar />
      <AppFooter />
    </div>
  );
}
