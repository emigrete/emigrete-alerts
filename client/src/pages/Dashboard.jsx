import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL, FILE_CONFIG } from '../constants/config';
import { validateFile, validateUpload } from '../utils/helpers';

// Components
import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { StepGuide } from '../components/StepGuide';
import { FileUploadSection } from '../components/FileUploadSection';
import { TriggersTable } from '../components/TriggersTable';
import { DonationFooter } from '../components/DonationFooter';
import { AlertsBadge } from '../components/AlertsBadge';
import { TTSGuide } from '../components/TTSGuide';
import { FeedbackForm } from '../components/FeedbackForm';

export default function Dashboard() {
  // Modo demo: solo en desarrollo
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
  const [selectedReward, setSelectedReward] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [ttsConfig, setTtsConfig] = useState({
    enabled: false,
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    text: '',
    useViewerMessage: true,
    readUsername: true,
    stability: 0.5,
    similarityBoost: 0.75
  });

  const loginUrl = `${API_URL}/auth/twitch`;

  // Fetch data on mount
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

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError('');
    setPreviewUrl(null);

    if (selected) {
      const validation = validateFile(selected);
      
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
          videoUrl: demoMediaType === 'video' ? demoUrl : undefined,
          ttsConfig: ttsConfig
        };

        setTriggers([...triggers, demoTrigger]);
        toast.success('¡Alerta guardada! (simulación demo)', { id: toastId });
        setFile(null);
        setPreviewUrl(null);
        setSelectedReward('');
        setTtsConfig({ enabled: false, voiceId: 'pNInz6obpgDQGcFmaJgB', text: '', useViewerMessage: true, readUsername: true, stability: 0.5, similarityBoost: 0.75 });
      } else {
        // En producción, subir a servidor
        const formData = new FormData();
        formData.append('twitchRewardId', selectedReward);
        formData.append('video', file);
        formData.append('userId', userId);
        formData.append('ttsConfig', JSON.stringify(ttsConfig));

        await axios.post(`${API_URL}/upload`, formData);
        toast.success('¡Alerta guardada!', { id: toastId });
        setFile(null);
        setPreviewUrl(null);
        setSelectedReward('');
        setTtsConfig({ enabled: false, voiceId: 'pNInz6obpgDQGcFmaJgB', text: '', useViewerMessage: true, readUsername: true, stability: 0.5, similarityBoost: 0.75 });
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
            await axios.delete(`${API_URL}/api/triggers/${id}`);
            await fetchTriggers();
            toast.success('Alerta borrada', { id: toastId });
          } catch {
            toast.error('Error al eliminar', { id: toastId });
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
  };

  // Not logged in
  if (!userId) {
    return <LoginCard loginUrl={loginUrl} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-secondary text-dark-text p-5 lg:p-8">
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-3 px-4 text-center font-bold z-50 shadow-lg">
          MODO DEMO - Vista previa sin autenticación
        </div>
      )}
      <Toaster position="top-right" theme="dark" richColors />

      <div className={`max-w-7xl mx-auto ${isDemo ? 'pt-12' : ''}`}>
        {/* Header */}
        <Header username={username} userId={userId} onLogout={handleLogout} />

        {/* Advertencia de desarrollo */}
        <div className="mb-6 p-4 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-yellow-500 font-bold mb-1">App en Desarrollo</h3>
              <p className="text-sm text-dark-muted">
                Esta aplicación está en fase beta. Podés encontrar errores o funcionalidades incompletas. 
                Si experimentás algún problema, contactate con el desarrollador.
              </p>
            </div>
          </div>
        </div>

        {/* Step Guide */}
        <StepGuide />

        {/* Main Content Grid */}
        <div className="space-y-8">
          {/* File Upload Card */}
          <section className="bg-gradient-to-br from-dark-card to-dark-secondary p-6 lg:p-10 rounded-2xl border border-primary/20 shadow-xl hover:shadow-2xl transition-shadow">
            <h3 className="mt-0 mb-8 text-2xl font-bold">
              Nueva Alerta
            </h3>
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
              ttsConfig={ttsConfig}
              onTtsConfigChange={setTtsConfig}
              onRewardCreated={(newReward) => {
                setRewards([...rewards, newReward]);
                setSelectedReward(newReward.id);
              }}
            />
          </section>

          {/* TTS Guide Section */}
          <TTSGuide />

          {/* Triggers Card */}
          <section className="bg-gradient-to-br from-dark-card to-dark-secondary p-6 lg:p-10 rounded-2xl border border-primary/20 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <h3 className="m-0 text-2xl font-bold">
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

          {/* Feedback Form */}
          <FeedbackForm />

          {/* Donation Footer */}
          <DonationFooter />
        </div>
      </div>
    </div>
  );
}
