import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';
import { validateFile, validateUpload } from '../utils/helpers';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Components
import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { StepGuide } from '../components/StepGuide';
import { FileUploadSection } from '../components/FileUploadSection';
import { TriggersTable } from '../components/TriggersTable';
import { AlertsBadge } from '../components/AlertsBadge';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { AppFooter } from '../components/AppFooter';
import FeedbackButton from '../components/FeedbackButton';
import { FeedbackForm } from '../components/FeedbackForm';
import MyFeedbacks from '../components/MyFeedbacks';
import { LoadingScreen } from '../components/LoadingScreen';
import UsageStatsSidebar from '../components/UsageStatsSidebar';

export default function Dashboard() {
    // Estado para mostrar el modal de feedback
    const [showFeedback, setShowFeedback] = useState(false);
  // Modo demo: solo desarrollo
  const isDevelopment = import.meta.env.DEV;
  const isDemo = isDevelopment && new URLSearchParams(window.location.search).get('demo') === 'true';
  
  const [userId, setUserId] = useLocalStorage(
    'twitchUserId',
    isDemo ? 'demo_user_123' : null
  );
  const [username, setUsername] = useLocalStorage(
    'twitchUsername',
    isDemo ? 'Demo User' : null
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
  const [selectedReward, setSelectedReward] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const loginUrl = `${API_URL}/auth/twitch`;

  // Cargar datos al iniciar
  useEffect(() => {
    if (userId) {
      fetchRewards();
      fetchTriggers();
      checkCreatorStatus();
      fetchSubscriptionData();
    }
  }, [userId]);

  const fetchSubscriptionData = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/api/subscription/status`, {
        params: { userId }
      });
      setSubscriptionData(res.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const checkCreatorStatus = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/api/creator/profile?userId=${userId}`);
      if (res.data?.exists && res.data?.isAssigned) {
        setIsCreator(true);
      }
    } catch (error) {
      console.error('Error checking creator status:', error);
    }
  };

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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError('');
    setPreviewUrl(null);

    if (selected) {
      // Usar maxFileBytes del servidor, o fallback a 5MB si no está disponible
      const maxFileBytes = subscriptionData?.subscription?.maxFileSizeBytes || (5 * 1024 * 1024);
      const validation = validateFile(selected, maxFileBytes);
      
      if (!validation.valid) {
        setFileError(validation.error);
        setFile(null);
        toast.error(validation.error);
        return;
      }

      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!validateUpload(file, selectedReward)) return;

    setUploading(true);
    const toastId = toast.loading('Subiendo alerta...');

    try {
      if (isDemo) {
        // En demo, simular subida
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const demoMediaType = file.type.includes('video') ? 'video' 
                            : file.type.includes('audio') ? 'audio'
                            : file.type.includes('gif') || file.type.includes('image') ? 'gif'
                            : 'video';
        
        const demoUrl = URL.createObjectURL(file);
        const demoTrigger = {
          _id: `demo_trigger_${Date.now()}`,
          twitchRewardId: selectedReward,
          medias: [{
            type: demoMediaType,
            url: demoUrl,
            fileName: `triggers/${demoMediaType}/demo_${Date.now()}.${file.name.split('.').pop()}`
          }],
          videoUrl: demoMediaType === 'video' ? demoUrl : undefined
        };

        setTriggers([...triggers, demoTrigger]);
        toast.success('¡Alerta guardada! (simulación demo)', { id: toastId });
        setFile(null);
        setPreviewUrl(null);
        setSelectedReward('');
      } else {
        // En producción, subir a servidor
        const formData = new FormData();
        formData.append('twitchRewardId', selectedReward);
        formData.append('video', file);
        formData.append('userId', userId);

        await axios.post(`${API_URL}/upload`, formData);
        toast.success('¡Alerta guardada!', { id: toastId });
        setFile(null);
        setPreviewUrl(null);
        setSelectedReward('');
        fetchTriggers();
      }
    } catch (error) {
      toast.error('Error al subir: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    toast('¿Borramos esta alerta?', {
      description: 'Se va a borrar la alerta y el video junto con ella.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          const toastId = toast.loading('Eliminando...');
          try {
            // Validar que userId exista
            if (!userId) {
              toast.error('Error: Debes estar autenticado', { id: toastId });
              return;
            }
            
            console.log(`Eliminando alerta ${id} - userId: ${userId}`);
            // Usar query string simple
            const response = await axios.delete(`${API_URL}/api/triggers/${id}`, {
              params: { userId }
            });
            await fetchTriggers();
            toast.success('Alerta borrada', { id: toastId });
            if (response.data?.warning) {
              toast.warning('Alerta borrada, pero no se pudo borrar la recompensa en Twitch. Eliminá esa recompensa en Twitch antes de volver a crearla o asociarle un video.');
            }
          } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error('Error al eliminar: ' + (error.response?.data?.error || error.message), { id: toastId });
          }
        }
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('twitchUserId');
    localStorage.removeItem('twitchUsername');
    setUserId(null);
    setUsername(null);
    toast.info('Sesión expirada por inactividad');
  };

  // Auto logout después de 30 minutos de inactividad
  useSessionTimeout(userId, handleLogout);

  // Not logged in
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
        {/* Header */}
        <Header username={username} userId={userId} onLogout={handleLogout} />

        {/* Navigation */}
        <Navigation isCreator={isCreator} />

        {/* Subscription Status */}
        {!isDemo && userId && <SubscriptionStatus userId={userId} />}

        {/* Alertas Overview */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl">
            <h4 className="text-lg font-bold text-white mb-2">Alertas Multimedia</h4>
            <p className="text-dark-muted text-sm mb-3">
              Alertas con video, audio o GIF (sin TTS)
            </p>
            <div className="text-3xl font-black text-blue-400">
              {triggers.filter(t => !t.ttsConfig?.enabled).length}
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-primary/10 to-pink-500/5 border border-primary/30 rounded-2xl">
            <h4 className="text-lg font-bold text-white mb-2">Alertas con TTS</h4>
            <p className="text-dark-muted text-sm mb-3">
              Alertas con voz IA activa
            </p>
            <div className="text-3xl font-black text-primary">
              {triggers.filter(t => t.ttsConfig?.enabled).length}
            </div>
          </div>
        </div>

        {/* Aviso de beta */}
        <div className="mb-10 p-5 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-2xl">
          <div className="flex items-start gap-3">
            <div>
              <h3 className="text-yellow-500 font-bold mb-1">App en beta</h3>
              <p className="text-sm text-dark-muted">
                Puede haber ajustes pendientes. Si detectás algo, avisá.
              </p>
            </div>
          </div>
        </div>

        {/* Step Guide */}
        <StepGuide />

        {/* Main Content (una arriba de la otra) */}
        <div className="space-y-10 mt-2">
          {/* Multimedia Alerts */}
          <section className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-dark-secondary p-7 lg:p-12 rounded-[28px] border border-blue-500/20 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="m-0 text-2xl font-black text-blue-400">
                Alertas Multimedia
              </h3>
              <span className="text-xs text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/30">
                Video, audio o GIF
              </span>
            </div>
              <p className="text-sm text-dark-muted mb-8">
                Subí el archivo, elegí el canje y guardá.
              </p>
            <FileUploadSection
              file={file}
              previewUrl={previewUrl}
              selectedReward={selectedReward}
              rewards={rewards}
              uploading={uploading}
              fileError={fileError}
              onFileChange={handleFileChange}
              onUpload={handleUpload}
              onRewardChange={setSelectedReward}
              userId={userId}
              isDemo={isDemo}
              triggers={triggers}
              subscription={subscriptionData || { subscription: { maxFileSize: '5MB' } }}
              onRewardCreated={(newReward) => {
                setRewards([...rewards, newReward]);
                setSelectedReward(newReward.id);
              }}
            />
          </section>

          {/* Triggers Card */}
          <section className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-dark-secondary p-7 lg:p-12 rounded-[28px] border border-blue-500/20 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <h3 className="m-0 text-2xl font-black text-blue-400">
                Alertas Activas
              </h3>
              <AlertsBadge count={triggers.length} />
            </div>
            <TriggersTable 
              triggers={triggers} 
              rewards={rewards} 
              userId={userId}
              onDelete={handleDelete}
              onRefresh={fetchTriggers}
            />
          </section>
        </div>

        <UsageStatsSidebar userId={userId} />
        <AppFooter />
              {/* Botón de feedback fijo */}
              <FeedbackButton onClick={() => setShowFeedback(true)} />
              {/* Modal de feedback */}
              {showFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                  <div className="bg-dark-card rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
                    <button
                      className="absolute top-3 right-3 text-white bg-dark-secondary rounded-full p-2 hover:bg-red-500 transition"
                      onClick={() => setShowFeedback(false)}
                      aria-label="Cerrar"
                    >✕</button>
                    <FeedbackForm />
                    <MyFeedbacks userId={userId} />
                  </div>
                </div>
              )}
      </div>
    </div>
  );
}
