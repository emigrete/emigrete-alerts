import { useState, useEffect } from 'react';
import axios from 'axios';
import { RewardCreator } from './RewardCreator';
import { API_URL } from '../constants/config';

export const FileUploadSection = ({ 
  file, 
  previewUrl, 
  selectedReward, 
  rewards, 
  uploading, 
  onFileChange, 
  onUpload, 
  fileError, 
  onRewardChange,
  userId,
  onRewardCreated,
  isDemo,
  triggers,
  subscription
}) => {
  // Modal de recompensa
  const [showRewardCreator, setShowRewardCreator] = useState(false);
  // Tipo de media para vista previa
  const [mediaType, setMediaType] = useState(null);
  // Datos de suscripción con fecha de reset
  const [subscriptionData, setSubscriptionData] = useState(null);

  // Obtener datos de suscripción con fecha de reset
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        if (!userId) return;
        const res = await axios.get(`${API_URL}/api/subscription/status`, {
          params: { userId }
        });
        setSubscriptionData(res.data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [userId]);

  // Helper para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Detecta tipo de archivo
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Detectar tipo de archivo
      const type = selected.type.includes('video') ? 'video' 
                 : selected.type.includes('audio') ? 'audio'
                 : selected.type.includes('gif') || selected.type.includes('image') ? 'gif'
                 : 'video';
      setMediaType(type);
    }
    onFileChange(e);
  };

  // Vista previa según tipo
  const getPreviewContent = () => {
    if (!previewUrl) {
      return <div className="text-gray-600 italic">Sin archivo aún</div>;
    }

    switch (mediaType) {
      case 'video':
        return <video src={previewUrl} controls autoPlay loop className="max-w-full max-h-full" />;
      case 'audio':
        return (
          <div className="flex flex-col items-center gap-4 w-full">
            <span className="text-xl font-semibold text-dark-text">Audio</span>
            <audio src={previewUrl} controls className="w-full" />
            <p className="text-sm text-dark-muted">{file?.name}</p>
          </div>
        );
      case 'gif':
        return <img src={previewUrl} alt="Preview" className="max-w-full max-h-full" />;
      default:
        return <div className="text-gray-600 italic">Sin archivo aún</div>;
    }
  };

  // Tipos permitidos
  const getAcceptTypes = () => {
    return 'video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,image/gif';
  };

  // Título dinámico
  const getMediaTypeLabel = () => {
    if (!mediaType) return 'Archivo Multimedia';
    return {
      video: 'Video',
      audio: 'Audio',
      gif: 'GIF'
    }[mediaType];
  };

  // Si no hay recompensas, pantalla de inicio
  if (rewards.length === 0) {
    return (
      <>
        <div className="text-center py-14">
          <div className="mb-8">
            <span className="text-2xl font-semibold block mb-4 text-dark-text">Vista previa</span>
            <h2 className="text-2xl font-bold text-dark-text mb-2">Creá tu primera alerta</h2>
            <p className="text-dark-muted mb-8">Vinculá tus clips con los canjes de Twitch</p>
          </div>

          <button
            onClick={() => setShowRewardCreator(true)}
            className="inline-flex flex-col items-center gap-3 px-8 py-6 bg-gradient-to-br from-primary to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all text-lg"
          >
            <span className="text-4xl">+</span>
            Crear nueva alerta
          </button>

          <div className="mt-12 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">Cómo funciona</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">1</div>
                <p className="text-sm text-dark-muted">Creá una recompensa con nombre y costo</p>
              </div>
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">2</div>
                <p className="text-sm text-dark-muted">Subí tu video, audio o GIF</p>
              </div>
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">3</div>
                <p className="text-sm text-dark-muted">Pegá el link en OBS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de recompensa */}
        {showRewardCreator && (
          <RewardCreator
            userId={userId}
            isDemo={isDemo}
            onRewardCreated={(reward) => {
              setShowRewardCreator(false);
              onRewardCreated(reward);
            }}
            onCancel={() => setShowRewardCreator(false)}
          />
        )}
      </>
    );
  }

  // Si hay recompensas, formulario normal
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Upload Form */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            1. Elegí el canje
          </label>
          <div className="flex gap-2 mb-6">
            <select 
              className="flex-1 p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
              value={selectedReward} 
              onChange={(e) => onRewardChange(e.target.value)}
            >
              <option value="" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>-- Elegí un canje --</option>
              {rewards.map(r => (
                <option key={r.id} value={r.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{r.title}</option>
              ))}
            </select>
            <button
              onClick={() => setShowRewardCreator(true)}
              title="Crear nueva recompensa"
              className="px-4 py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition text-sm whitespace-nowrap"
            >
              + Nueva
            </button>
          </div>

          {/* Info si ya hay alertas y límites */}
          <div className="space-y-3 mb-7">
            {triggers && triggers.length > 0 && (
              <div className="p-4 bg-primary/10 border border-primary/25 rounded-xl">
                <p className="text-sm text-primary font-semibold mb-2">Nota:</p>
                <p className="text-sm text-dark-muted">
                  Tenés <strong>{triggers.length} alerta{triggers.length > 1 ? 's' : ''}</strong>. Podés sumar media o crear otra.
                </p>
              </div>
            )}
            <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-xl">
              <p className="text-sm text-blue-400 font-semibold mb-2">Tu plan:</p>
              <p className="text-sm text-dark-muted">
                Tu plan te permite subir archivos hasta <strong className="text-white text-base">{subscriptionData?.subscription?.maxFileSize || subscription?.maxFileSize || '5MB'}</strong> cada uno.
              </p>
              {subscriptionData?.nextResetDate && (
                <p className="text-xs text-dark-muted mt-2">
                  Se reinicia el <strong>{formatDate(subscriptionData.nextResetDate)}</strong>
                </p>
              )}
            </div>
          </div>

          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            2. {getMediaTypeLabel()}
          </label>
          
          <div className="relative overflow-hidden inline-block w-full mb-3">
            <input
              type="file"
              id="video-upload"
              className="hidden"
              accept={getAcceptTypes()}
              onChange={handleFileChange}
            />
            <label 
              htmlFor="video-upload" 
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                fileError 
                  ? 'border-red-500 bg-red-500/5 text-red-500' 
                  : 'border-dark-secondary bg-white/3 text-dark-muted hover:border-primary'
              }`}
            >
              <span className="text-4xl mb-3">
                {file ? 'Listo' : 'Subir'}
              </span>
              {file ? (
                <span className="text-dark-text font-bold text-center">{file.name}</span>
              ) : (
                <div className="text-center">
                  <span className="block">Arrastrá o hacé clic para subir</span>
                  <small className="text-dark-muted">Video (.mp4, .webm), Audio (.mp3, .wav, .ogg) o GIF</small>
                </div>
              )}
            </label>
          </div>

          {fileError && <p className="text-red-500 text-sm mb-4">{fileError}</p>}

          <div className="text-right mt-6">
            <button
              onClick={onUpload}
              disabled={uploading || !!fileError || !selectedReward || !file}
              className="w-full bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? 'Subiendo...' : 'Guardar Alerta'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            Vista Previa
          </label>
          <div className="rounded-2xl overflow-hidden border border-dark-border bg-black h-72 flex items-center justify-center">
            {getPreviewContent()}
          </div>
        </div>
      </div>

      {/* Modal de recompensa */}
      {showRewardCreator && (
        <RewardCreator
          userId={userId}
          isDemo={isDemo}
          onRewardCreated={(reward) => {
            setShowRewardCreator(false);
            onRewardCreated(reward);
          }}
          onCancel={() => setShowRewardCreator(false)}
        />
      )}
    </>
  );
};
