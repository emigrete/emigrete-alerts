import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';
import { TTSGuide } from './TTSGuide';
import { TTSConfig } from './TTSConfig';
import { RewardCreatorTTS } from './RewardCreatorTTS';

export const TTSManager = ({ triggers, rewards, userId, username, onRefresh, isDemo, onCreated }) => {
  const [selectedTriggerId, setSelectedTriggerId] = useState(null);
  const [selectedReward, setSelectedReward] = useState('');
  const [showRewardCreator, setShowRewardCreator] = useState(false);
  const [creating, setCreating] = useState(false);
  // Uso mensual de TTS
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  // Config base de TTS
  const [ttsConfig, setTtsConfig] = useState({
    enabled: true,
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    text: '',
    useViewerMessage: true,
    readUsername: true,
    stability: 0.5,
    similarityBoost: 0.75
  });

  // Solo TTS activos
  const triggersWithTTS = triggers.filter(t => t.ttsConfig?.enabled);
  const selectedTrigger = triggers.find(t => t._id === selectedTriggerId);

  // Traer límite del usuario
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        if (!userId) return;
        const res = await axios.get(`${API_URL}/api/tts/usage/${userId}`);
        setUsage(res.data);
      } catch (error) {
        console.error('Error cargando uso TTS:', error);
      } finally {
        setLoadingUsage(false);
      }
    };

    fetchUsage();
  }, [userId]);

  // Helper para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  // Crear alerta TTS desde recompensa existente
  // Calcular caracteres totales que se usarán
  const calculateCharCount = () => {
    let total = 0;
    if (ttsConfig.readUsername) total += (username || 'Usuario').length + 1; // +1 para espacio
    if (ttsConfig.useViewerMessage) {
      total += 50; // Estimado promedio de mensajes de espectadores
    } else {
      total += (ttsConfig.text || '').length;
    }
    return total;
  };

  const estimatedChars = calculateCharCount();
  const canCreateTTS = selectedReward && 
    (!ttsConfig.useViewerMessage ? ttsConfig.text?.trim() : true) &&
    usage && 
    usage.charsRemaining >= estimatedChars;

  const handleCreateTTS = async () => {
    if (!selectedReward) {
      toast.warning('Seleccioná un canje.');
      return;
    }

    if (!ttsConfig.useViewerMessage && !ttsConfig.text?.trim()) {
      toast.warning('Agregá un texto o activá el mensaje del espectador.');
      return;
    }

    // Verificar límite antes de intentar
    if (usage && usage.charsRemaining < estimatedChars) {
      toast.error(`No hay suficientes caracteres. Necesitás ${estimatedChars}, disponibles: ${usage.charsRemaining}`);
      return;
    }

    setCreating(true);
    const toastId = toast.loading('Guardando TTS...');

    try {
      if (isDemo) {
        const demoTrigger = {
          _id: `demo_tts_${Date.now()}`,
          twitchRewardId: selectedReward,
          medias: [],
          ttsConfig: { ...ttsConfig, enabled: true }
        };
        if (onCreated) onCreated(demoTrigger);
        toast.success('TTS creado (demo).', { id: toastId });
      } else {
        const formData = new FormData();
        formData.append('twitchRewardId', selectedReward);
        formData.append('userId', userId);
        formData.append('ttsConfig', JSON.stringify({ ...ttsConfig, enabled: true }));

        const res = await axios.post(`${API_URL}/upload`, formData);
        if (onCreated && res.data?.trigger) onCreated(res.data.trigger);
        toast.success('TTS guardado.', { id: toastId });
        onRefresh();
      }

      setSelectedReward('');
      setTtsConfig({
        enabled: true,
        voiceId: 'onwK4e9ZLuTAKqWW03F9',
        text: '',
        useViewerMessage: true,
        readUsername: true,
        stability: 0.5,
        similarityBoost: 0.75
      });
    } catch (error) {
      // Manejar error 402 (límite excedido)
      if (error.response?.status === 402) {
        const errData = error.response.data;
        toast.error(`Límite de TTS alcanzado. Upgrade tu plan para más caracteres.`, { id: toastId });
      } else {
        toast.error('Error al guardar: ' + error.message, { id: toastId });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/10 via-pink-500/5 to-dark-secondary border border-primary/25 rounded-[28px] p-9">
      {/* Header */}
      <div className="mb-9">
        <h2 className="text-3xl font-black text-white mb-2">
          Módulo TTS
        </h2>
        <p className="text-dark-muted">
          Gestión de voz IA en español.
        </p>
      </div>

      {/* Guía */}
      <TTSGuide />

      {/* Límite mensual y aclaración */}
      <div className="mt-8 space-y-3">
        {usage && !loadingUsage && (
          <div className={`p-4 rounded-2xl border ${
            usage.percentageUsed > 80
              ? 'border-red-500/60 bg-red-500/10'
              : usage.percentageUsed > 50
              ? 'border-yellow-500/60 bg-yellow-500/10'
              : 'border-green-500/60 bg-green-500/10'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-white">Límite mensual de TTS</p>
              <span className="text-xs text-dark-muted font-semibold">{usage.percentageUsed}%</span>
            </div>
            <div className="w-full bg-dark-secondary rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  usage.percentageUsed > 80
                    ? 'bg-red-500'
                    : usage.percentageUsed > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-dark-muted mt-2">
              Disponible: <strong>{usage.charsRemaining}</strong> de <strong>{usage.charsLimit}</strong> caracteres
            </p>
          </div>
        )}
        <div className="p-4 bg-purple-500/10 border border-purple-500/25 rounded-2xl">
          <p className="text-sm text-purple-400 font-semibold mb-2">Tu plan:</p>
          <p className="text-sm text-dark-muted">
            Tu plan te permite hasta <strong>{usage?.charsLimit || '2.000'} caracteres de TTS</strong> por mes.
          </p>
          {usage?.nextResetDate && (
            <p className="text-xs text-dark-muted mt-2">
              Se reinicia el <strong>{formatDate(usage.nextResetDate)}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Crear TTS */}
      <div className="mt-8 bg-dark-card/70 border border-dark-border rounded-2xl p-7">
        <h3 className="text-xl font-bold text-white mb-4">Agregar TTS a una recompensa</h3>

        <div className="space-y-4">
          {/* Canje */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
              Canje
            </label>
            <select
              className="w-full p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold text-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
              value={selectedReward}
              onChange={(e) => setSelectedReward(e.target.value)}
            >
              <option value="" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Seleccioná un canje</option>
              {rewards.map(r => (
                <option key={r.id} value={r.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{r.title}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowRewardCreator(true)}
              className="mt-2 text-xs font-semibold px-3 py-2 rounded-lg bg-primary/20 border border-primary/30 hover:border-primary text-primary transition w-full"
            >
              + Crear nueva alerta
            </button>
          </div>

          {/* Voz */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
              Voz (obligatorio)
            </label>
            <select
              value={ttsConfig.voiceId}
              onChange={(e) => setTtsConfig({ ...ttsConfig, voiceId: e.target.value })}
              className="w-full p-3 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary font-semibold text-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              {ELEVENLABS_VOICES.map(voice => (
                <option key={voice.id} value={voice.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{voice.name}</option>
              ))}
            </select>
            <p className="text-xs text-dark-muted mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
              <strong>Próximamente:</strong> Más voces en español disponibles
            </p>
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 text-xs text-dark-text cursor-pointer">
              <input
                type="checkbox"
                checked={ttsConfig.readUsername !== false}
                onChange={(e) => setTtsConfig({ ...ttsConfig, readUsername: e.target.checked })}
                className="w-4 h-4 rounded accent-primary"
              />
              Incluir nombre del usuario
            </label>
            <label className="flex items-center gap-3 text-xs text-dark-text cursor-pointer">
              <input
                type="checkbox"
                checked={ttsConfig.useViewerMessage !== false}
                onChange={(e) => setTtsConfig({ ...ttsConfig, useViewerMessage: e.target.checked })}
                className="w-4 h-4 rounded accent-primary"
              />
              Leer mensaje del espectador
            </label>
          </div>

          {!ttsConfig.useViewerMessage && (
            <div>
              <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
                Texto personalizado
              </label>
              <textarea
                value={ttsConfig.text}
                onChange={(e) => setTtsConfig({ ...ttsConfig, text: e.target.value })}
                placeholder="Texto a decir..."
                maxLength={300}
                rows={2}
                className="w-full p-2 rounded-lg border border-dark-border bg-dark-secondary text-white outline-none focus:border-primary transition text-xs resize-none"
              />
              <small className="text-dark-muted">{(ttsConfig.text || '').length}/300</small>
            </div>
          )}

          {/* Mostrar información de caracteres estimados y disponibles */}
          {usage && !loadingUsage && (
            <div className={`p-3 rounded-lg border text-xs ${
              usage.charsRemaining < estimatedChars
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : usage.charsRemaining < estimatedChars * 3
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                : 'border-green-500/50 bg-green-500/10 text-green-400'
            }`}>
              <p className="font-semibold mb-1">Caracteres estimados: <strong>{estimatedChars}</strong></p>
              <p>Disponibles: <strong>{usage.charsRemaining}</strong> de {usage.charsLimit}</p>
              {usage.charsRemaining < estimatedChars && (
                <p className="mt-2 text-red-400">⚠️ No hay caracteres suficientes. Upgrade tu plan.</p>
              )}
            </div>
          )}

          <button
            onClick={handleCreateTTS}
            disabled={creating || !canCreateTTS || loadingUsage}
            title={!canCreateTTS ? 'Seleccioná un canje y asegurate de tener caracteres disponibles' : ''}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {creating ? 'Guardando...' : loadingUsage ? 'Cargando límites...' : 'Guardar TTS'}
          </button>
        </div>
      </div>

      {/* Lista de alertas con TTS */}
      {triggersWithTTS.length > 0 ? (
        <div className="mt-9">
          <h3 className="text-xl font-bold text-white mb-4">Alertas con TTS activo</h3>
          <div className="space-y-4">
            {triggersWithTTS.map(trigger => {
              const reward = rewards.find(r => r.id === trigger.twitchRewardId);
              const rewardName = reward?.title || trigger.alertConfig?.displayName || 'Sin nombre';
              const specificLink = `${window.location.protocol}//${window.location.host}/overlay?user=${userId}&reward=${trigger.twitchRewardId}`;
              
              return (
                <div
                  key={trigger._id}
                  className="bg-dark-card border border-dark-border rounded-2xl p-5 hover:border-primary/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-primary text-base mb-1">
                        {rewardName}
                      </h4>
                      <p className="text-xs text-dark-muted mb-2">
                        Voz: {ELEVENLABS_VOICES.find(v => v.id === trigger.ttsConfig.voiceId)?.name || 'Desconocida'}
                      </p>
                      <div className="flex gap-2 flex-wrap text-xs text-dark-muted">
                        {trigger.ttsConfig.readUsername && (
                          <span className="px-2 py-1 rounded bg-dark-secondary border border-dark-border">✓ Incluye nombre</span>
                        )}
                        {trigger.ttsConfig.useViewerMessage && (
                          <span className="px-2 py-1 rounded bg-dark-secondary border border-dark-border">✓ Lee mensaje</span>
                        )}
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-semibold whitespace-nowrap">
                      TTS Activo
                    </span>
                  </div>

                  {/* Link único para esta alerta */}
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
                      Link para OBS
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={specificLink}
                        className="flex-1 bg-black border border-dark-border px-3 py-2 rounded-lg text-green-400 text-xs font-mono focus:outline-none focus:border-primary"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(specificLink);
                          if (typeof toast !== 'undefined') toast.success('Link copiado');
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition whitespace-nowrap text-sm"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTriggerId(trigger._id)}
                    className="w-full py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all"
                  >
                    Editar configuración
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-12 border-2 border-dashed border-dark-border rounded-xl">
          <p className="text-dark-muted text-lg">No hay alertas con TTS</p>
          <p className="text-dark-muted text-sm mt-2">Creá alertas desde el módulo de arriba</p>
        </div>
      )}

      {/* Modal de configuración */}
      {selectedTriggerId && selectedTrigger && (
        <TTSConfig
          triggerId={selectedTriggerId}
          initialConfig={selectedTrigger.ttsConfig}
          userId={userId}
          onClose={() => setSelectedTriggerId(null)}
          onUpdate={() => {
            setSelectedTriggerId(null);
            onRefresh();
          }}
        />
      )}

      {/* Crear recompensa desde TTS */}
      {showRewardCreator && (
        <RewardCreatorTTS
          userId={userId}
          isDemo={isDemo}
          onCancel={() => setShowRewardCreator(false)}
          onRewardCreated={(reward) => {
            // Cerrar modal
            setShowRewardCreator(false);
            setSelectedReward('');
            // Refrescar lista de triggers si no es demo
            if (!isDemo) {
              onRefresh();
            }
          }}
        />
      )}
    </section>
  );
};

const ELEVENLABS_VOICES = [
  { id: 'onwK4e9ZLuTAKqWW03F9', name: '🇦🇷 Daniel (Masculino, Argentina)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: '🇨🇱 Elena (Femenino, Chile)' }
];