import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';
import { validateFile, validateUpload } from '../utils/helpers';

// Components
import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { StepGuide } from '../components/StepGuide';
import { FileUploadSection } from '../components/FileUploadSection';
import { TriggersTable } from '../components/TriggersTable';
import { DonationFooter } from '../components/DonationFooter';
import { AlertsBadge } from '../components/AlertsBadge';
import { FeedbackForm } from '../components/FeedbackForm';
import { TTSManager } from '../components/TTSManager';

export default function Dashboard() {
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
  const [selectedReward, setSelectedReward] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const loginUrl = `${API_URL}/auth/twitch`;

  // Cargar datos al iniciar
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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-secondary text-dark-text p-5 lg:p-12">
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-3 px-4 text-center font-bold z-50 shadow-lg">
          MODO DEMO - Usalo sin iniciar sesión
        </div>
      )}
      <Toaster position="top-right" theme="dark" richColors />

      <div className={`max-w-7xl mx-auto ${isDemo ? 'pt-12' : ''}`}>
        {/* Header */}
        <Header username={username} userId={userId} onLogout={handleLogout} />

        {/* Aviso de beta */}
        <div className="mb-10 p-5 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
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
          <section className="bg-gradient-to-br from-dark-card to-dark-secondary p-7 lg:p-12 rounded-[28px] border border-primary/15 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h3 className="m-0 text-2xl font-black">
                Alertas Multimedia
              </h3>
              <span className="text-xs text-dark-muted bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
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
              onRewardCreated={(newReward) => {
                setRewards([...rewards, newReward]);
                setSelectedReward(newReward.id);
              }}
            />
          </section>

          {/* TTS Manager */}
          <TTSManager
            triggers={triggers}
            rewards={rewards}
            userId={userId}
            isDemo={isDemo}
            onRefresh={fetchTriggers}
            onCreated={(newTrigger) => {
              if (isDemo && newTrigger) {
                setTriggers((prev) => [...prev, newTrigger]);
              }
            }}
          />

          {/* Triggers Card */}
          <section className="bg-gradient-to-br from-dark-card to-dark-secondary p-7 lg:p-12 rounded-[28px] border border-primary/15 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
              <h3 className="m-0 text-2xl font-black">
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
        </div>

        {/* Donation Footer - Ancho completo */}
        <div className="mt-8">
          <DonationFooter />
        </div>
      </div>
    </div>
  );
}
