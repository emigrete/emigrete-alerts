import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Overlay() {
  const [queue, setQueue] = useState([]);
  const [currentMedia, setCurrentMedia] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [searchParams] = useSearchParams();

  const filterId = searchParams.get('reward');
  const userId = searchParams.get('user');

  useEffect(() => {
    if (!userId) return;

    const socketConnection = io(SOCKET_URL);

    socketConnection.on('connect', () => {
      console.log(`🟢 Conectado a sala overlay-${userId} en ${SOCKET_URL}`);
      socketConnection.emit('join-overlay', userId);
    });

    socketConnection.on('media-trigger', (data) => {
      console.log('📩 Evento recibido:', data);

      if (filterId && data.rewardId !== filterId) return;
      setQueue((prevQueue) => [...prevQueue, data]);
    });

    return () => socketConnection.disconnect();
  }, [filterId, userId]);

  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      const nextMedia = queue[0];
      setQueue((prev) => prev.slice(1));
      setIsPlaying(true);
      playMedia(nextMedia);
    }
  }, [queue, isPlaying]);

  const playMedia = async (mediaData) => {
    setCurrentMedia(mediaData);

    // Si tiene TTS habilitado, generar y reproducir primero
    if (mediaData.ttsConfig?.enabled) {
      await playTTS(mediaData);
    }

    // Luego reproducir el video/audio/gif
    if (mediaData.type === 'video' && videoRef.current) {
      videoRef.current.volume = mediaData.volume || 1.0;
      videoRef.current.play().catch(e => console.error('Error autoplay:', e));
    } else if (mediaData.type === 'audio' && audioRef.current) {
      audioRef.current.volume = mediaData.volume || 1.0;
      audioRef.current.play().catch(e => console.error('Error autoplay audio:', e));
    } else if (mediaData.type === 'gif') {
      // GIF se muestra por 5 segundos y termina
      setTimeout(() => handleEnded(), 5000);
    }
  };

  const playTTS = async (mediaData) => {
    try {
      const { ttsConfig, viewerMessage, viewerUsername } = mediaData;
      
      let textToSpeak = '';
      
      if (ttsConfig.useViewerMessage) {
        if (ttsConfig.readUsername && viewerUsername) {
          textToSpeak = `${viewerUsername} dice: ${viewerMessage || 'Gracias por el canje!'}`;
        } else {
          textToSpeak = viewerMessage || 'Gracias por el canje!';
        }
      } else {
        textToSpeak = ttsConfig.text || 'Gracias por el canje!';
      }

      console.log('🎤 Generando TTS:', textToSpeak);

      const response = await axios.post(`${API_URL}/api/tts`, {
        text: textToSpeak,
        voiceId: ttsConfig.voiceId,
        stability: ttsConfig.stability,
        similarityBoost: ttsConfig.similarityBoost
      });

      if (response.data.audio) {
        const audio = new Audio(response.data.audio);
        audio.volume = 1.0;
        
        // Esperar a que termine el TTS antes de reproducir el video
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.play();
        });

        console.log('✅ TTS reproducido');
      }
    } catch (error) {
      console.error('❌ Error reproduciendo TTS:', error);
    }
  };

  const handleEnded = () => {
    setCurrentMedia(null);
    setIsPlaying(false);
    setTtsAudio(null);
  };

  if (!currentMedia) return null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {currentMedia.type === 'video' && (
        <video
          ref={videoRef}
          src={currentMedia.url}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
          muted={false}
          autoPlay
          onEnded={handleEnded}
        />
      )}
      {currentMedia.type === 'audio' && (
        <div style={{ textAlign: 'center', color: 'white', fontSize: '4rem' }}>
          🎵
          <audio
            ref={audioRef}
            src={currentMedia.url}
            autoPlay
            onEnded={handleEnded}
          />
        </div>
      )}
      {currentMedia.type === 'gif' && (
        <img
          src={currentMedia.url}
          alt="GIF"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      )}
    </div>
  );
}
