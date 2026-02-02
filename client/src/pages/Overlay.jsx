import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSearchParams } from 'react-router-dom';

// Solo definimos la URL afuera, NO la conexión
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function Overlay() {
    // --- ESTADOS ---
    const [queue, setQueue] = useState([]);      
    const [currentMedia, setCurrentMedia] = useState(null); 
    const [isPlaying, setIsPlaying] = useState(false);      
    
    const videoRef = useRef(null);
    const [searchParams] = useSearchParams();
    
    const filterId = searchParams.get('reward'); 
    const userId = searchParams.get('user');

    // 1. CONEXIÓN Y ESCUCHA
    useEffect(() => {
        if (!userId) return;

        // Creamos la conexión aquí adentro
        const socketConnection = io(SOCKET_URL);
        
        socketConnection.on('connect', () => {
            console.log(`🟢 Conectado a sala: overlay-${userId} en ${SOCKET_URL}`);
            socketConnection.emit('join-overlay', userId);
        });

        socketConnection.on('media-trigger', (data) => {
            console.log("📩 Evento recibido:", data);

            if (filterId && data.rewardId !== filterId) return;

            setQueue((prevQueue) => [...prevQueue, data]);
        });

        // Limpieza: Desconectamos al desmontar para no dejar zombies
        return () => {
            socketConnection.disconnect();
        };
    }, [filterId, userId]);

    // 2. PROCESADOR DE LA COLA
    useEffect(() => {
        if (!isPlaying && queue.length > 0) {
            const nextMedia = queue[0]; 
            setQueue((prev) => prev.slice(1)); 
            
            setIsPlaying(true); 
            setCurrentMedia(nextMedia); 
        }
    }, [queue, isPlaying]);

    // 3. CONTROL DE REPRODUCCIÓN
    useEffect(() => {
        if (currentMedia && videoRef.current) {
            videoRef.current.volume = currentMedia.volume || 1.0;
            videoRef.current.play().catch(e => console.error("Error autoplay:", e));
        }
    }, [currentMedia]);

    // 4. AL TERMINAR
    const handleEnded = () => {
        console.log("✅ Terminó el video");
        setCurrentMedia(null); 
        setIsPlaying(false);   
    };

    if (!currentMedia) return null;

    return (
        <div style={{ 
            width: '100vw', height: '100vh', background: 'transparent',
            display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' 
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
        </div>
    );
}