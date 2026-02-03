import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';
import { TTSGuide } from './TTSGuide';
import { TTSConfig } from './TTSConfig';

export const TTSManager = ({ triggers, rewards, userId, onRefresh, isDemo, onCreated }) => {
  // Trigger seleccionado
  const [selectedTriggerId, setSelectedTriggerId] = useState(null);
  // Canje elegido
  const [selectedReward, setSelectedReward] = useState('');
  // Estado de guardado
  const [creating, setCreating] = useState(false);
  // Uso mensual de TTS
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);
  // Config base de TTS
  const [ttsConfig, setTtsConfig] = useState({
    enabled: true,
    voiceId: 'pNInz6obpgDQGcFmaJgB',
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

  // Alta TTS sin media
  const handleCreateTTS = async () => {
    if (!selectedReward) {
      toast.warning('Seleccioná un canje.');
      return;
    }

    if (!ttsConfig.useViewerMessage && !ttsConfig.text?.trim()) {
      toast.warning('Agregá un texto o activá el mensaje del espectador.');
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
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        text: '',
        useViewerMessage: true,
        readUsername: true,
        stability: 0.5,
        similarityBoost: 0.75
      });
    } catch (error) {
      toast.error('Error al guardar: ' + error.message, { id: toastId });
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

      {/* Límite mensual */}
      {usage && !loadingUsage && (
        <div className={`mt-8 p-4 rounded-2xl border ${
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

      {/* Crear TTS */}
      <div className="mt-8 bg-dark-card/70 border border-dark-border rounded-2xl p-7">
        <h3 className="text-xl font-bold text-white mb-4">Crear alerta TTS</h3>
        <div className="space-y-5">
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
              Canje
            </label>
            <select
              className="w-full p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold"
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
              <option value="" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>-- Seleccioná un canje --</option>
              {rewards.map(r => (
                <option key={r.id} value={r.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{r.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
              Voz
            </label>
            <select
              value={ttsConfig.voiceId}
              onChange={(e) => setTtsConfig({ ...ttsConfig, voiceId: e.target.value })}
              className="w-full p-2 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none cursor-pointer hover:border-primary font-semibold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1.25em 1.25em',
                paddingRight: '2rem'
              }}
            >
              {ELEVENLABS_VOICES.map(voice => (
                <option key={voice.id} value={voice.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{voice.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 text-xs text-dark-text">
              <input
                type="checkbox"
                checked={ttsConfig.readUsername !== false}
                onChange={(e) => setTtsConfig({ ...ttsConfig, readUsername: e.target.checked })}
                className="w-4 h-4"
              />
              Incluir nombre del usuario
            </label>
            <label className="flex items-center gap-3 text-xs text-dark-text">
              <input
                type="checkbox"
                checked={ttsConfig.useViewerMessage !== false}
                onChange={(e) => setTtsConfig({ ...ttsConfig, useViewerMessage: e.target.checked })}
                className="w-4 h-4"
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
                placeholder="Escribí el texto..."
                maxLength={300}
                className="w-full p-2 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition text-xs h-20 resize-none"
              />
              <small className="text-dark-muted">{(ttsConfig.text || '').length}/300</small>
            </div>
          )}

          <button
            onClick={handleCreateTTS}
            disabled={creating || !selectedReward}
            className="w-full bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {creating ? 'Guardando...' : 'Guardar TTS'}
          </button>
        </div>
      </div>

      {/* Lista de alertas con TTS */}
      {triggersWithTTS.length > 0 ? (
        <div className="mt-9">
          <h3 className="text-xl font-bold text-white mb-4">Alertas con TTS activo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {triggersWithTTS.map(trigger => {
              const reward = rewards.find(r => r.id === trigger.twitchRewardId);
              return (
                <div
                  key={trigger._id}
                  className="bg-dark-card border border-dark-border rounded-2xl p-5 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedTriggerId(trigger._id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-primary text-sm mb-1">
                        {reward?.title || 'Recompensa'}
                      </h4>
                      <p className="text-xs text-dark-muted">
                        Voz: {ELEVENLABS_VOICES.find(v => v.id === trigger.ttsConfig.voiceId)?.name || 'Desconocida'}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-semibold">
                      Activo
                    </span>
                  </div>
                  <div className="text-xs text-dark-muted space-y-1">
                    {trigger.ttsConfig.readUsername && (
                      <p>✓ Incluye nombre del usuario</p>
                    )}
                    {trigger.ttsConfig.useViewerMessage && (
                      <p>✓ Lee el mensaje del espectador</p>
                    )}
                  </div>
                  <button className="mt-3 w-full py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all group-hover:border-primary">
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
    </section>
  );
};

const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: '🇺🇸 Adam (Masculino, profundo)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: '🇺🇸 Sarah (Femenino, suave)' },
  { id: 'ErXwobaYiN019PkySvjV', name: '🇺🇸 Antoni (Masculino, cálido)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: '🇺🇸 Arnold (Masculino, autoritario)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: '🇺🇸 Elli (Femenino, juvenil)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: '🇬🇧 Dorothy (Femenino, británico)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: '🇬🇧 Daniel (Masculino, británico)' },
];
