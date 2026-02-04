import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

const ELEVENLABS_VOICES = [
  // FREE: 2 voces
  { id: 'dlGxemPxFMTY7iXagmOj', name: 'Fernando Martínez', tier: 'free' },
  { id: 'ajOR9IDAaubDK5qtLUqQ', name: 'Daniela', tier: 'free' },
  
  // PRO: 3 voces más (total 5 para PRO)
  { id: '9oPKasc15pfAbMr7N6Gs', name: 'Valeria (Argentina)', tier: 'pro' },
  { id: 'L7pBVwjueW3IPcQt4Ej9', name: 'Manuel (Argentina)', tier: 'pro' },
  { id: '0cheeVA5B3Cv6DGq65cT', name: 'Alejandro (Chile)', tier: 'pro' },
  
  // PREMIUM: 5 voces más (total 10 para PREMIUM)
  { id: 'sDh3eviBhiuHKi0MjTNq', name: 'Francis (México)', tier: 'premium' },
  { id: 'x5IDPSl4ZUbhosMmVFTk', name: 'Lumina (Colombia)', tier: 'premium' },
  { id: 'l1zE9xgNpUTaQCZzpNJa', name: 'Alberto Rodríguez', tier: 'premium' },
  { id: 'ClNifCEVq1smkl4M3aTk', name: 'Cristian Cornejo (Chile)', tier: 'premium' },
  { id: 'wBXNqKUATyqu0RtYt25i', name: 'Adam (English)', tier: 'premium' }
];

export const TTSConfig = ({ triggerId, initialConfig, onClose, onUpdate, userId, userTier = 'free' }) => {
  // Estado local del modal
  const [config, setConfig] = useState({
    enabled: false,
    voiceId: 'onwK4e9ZLuTAKqWW03F9',
    text: '',
    useViewerMessage: true,
    readUsername: true,
    stability: 0.5,
    similarityBoost: 0.75,
    ...initialConfig
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(true);

  // Helper para obtener voces disponibles según tier
  const getAvailableVoices = () => {
    const tierHierarchy = { free: 0, pro: 1, premium: 2 };
    const userTierLevel = tierHierarchy[userTier] || 0;
    
    return ELEVENLABS_VOICES.filter(voice => {
      const voiceTierLevel = tierHierarchy[voice.tier] || 0;
      return voiceTierLevel <= userTierLevel;
    });
  };

  // Traer uso del usuario
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/tts/usage/${userId}`);
        setUsage(response.data);
      } catch (error) {
        console.error('Error cargando uso:', error);
      } finally {
        setLoadingUsage(false);
      }
    };
    
    if (userId) {
      fetchUsage();
    }
  }, [userId]);

  const handleTest = async () => {
    if (!usage || config.text.length > usage.charsRemaining) {
      toast.error(`No te quedan caracteres suficientes. Te quedan ${usage?.charsRemaining || 0}`)
      return;
    }

    setTesting(true);
    // helper: speak via browser Web Speech API
    const speakWithBrowser = async (text) => {
      try {
        if (!('speechSynthesis' in window)) {
          toast.error('SpeechSynthesis no soportado en este navegador');
          return false;
        }

        const speakNow = () => {
          const utter = new SpeechSynthesisUtterance(text);
          utter.lang = 'es-ES';
          const voices = window.speechSynthesis.getVoices();
          const v = voices.find(v => v.lang && v.lang.startsWith('es')) || voices[0];
          if (v) utter.voice = v;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        };

        // Some browsers populate voices asynchronously
        let voices = window.speechSynthesis.getVoices();
        if (!voices || voices.length === 0) {
          await new Promise((resolve) => {
            window.speechSynthesis.onvoiceschanged = () => {
              resolve();
            };
            // safety timeout
            setTimeout(resolve, 500);
          });
        }
        speakNow();
        return true;
      } catch (e) {
        console.error('Fallback TTS error', e);
        return false;
      }
    };

    try {
      const testText = config.readUsername 
        ? `Usuario dice: ${config.text || 'Gracias por el canje'}`
        : config.text || 'Gracias por el canje';

      const response = await axios.post(`${API_URL}/api/tts`, {
        text: testText,
        voiceId: config.voiceId,
        stability: config.stability,
        similarityBoost: config.similarityBoost,
        userId
      });

      if (response.data.audio) {
        const audio = new Audio(response.data.audio);
        audio.volume = 1.0;
        audio.play();
        
        // Actualizar uso
        setUsage(prev => ({
          ...prev,
          charsUsed: response.data.charsUsed + prev.charsUsed,
          charsRemaining: response.data.charsRemaining,
          percentageUsed: Math.round((response.data.charsUsed + prev.charsUsed) / prev.charsLimit * 100)
        }));
        
        toast.success(`Muestra reproducida (${testText.length} caracteres usados)`);
      }
    } catch (error) {
      console.error('Error al generar TTS:', error);
      
      // Manejar error 402 (límite de TTS excedido)
      if (error.response?.status === 402) {
        toast.error('Límite de TTS alcanzado. Upgrade tu plan para más caracteres.');
        return;
      }
      
      const message = error.response?.data?.error || error.message || 'Error al generar audio';

      // Si ElevenLabs bloqueó por actividad inusual, usar fallback del navegador
      const msgStr = typeof message === 'string' ? message : JSON.stringify(message);
      if (msgStr.includes('detected_unusual_activity') || msgStr.includes('Free Tier usage disabled')) {
        toast.warning('ElevenLabs bloqueó la petición. Usando TTS del navegador como fallback.');
        const ok = await speakWithBrowser(testText);
        if (ok) {
          toast.success('Muestra reproducida (fallback navegador)');
        } else {
          toast.error('No se pudo reproducir fallback de TTS');
        }
      } else {
        toast.error(msgStr);
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/triggers/${triggerId}/tts`, { ttsConfig: config });
      toast.success('Configuración TTS guardada');
      onUpdate?.(config);
      onClose();
    } catch (error) {
      console.error('Error guardando TTS:', error);
      toast.error('Error al guardar: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-dark-card via-dark-secondary to-dark-card border border-primary/50 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent">
            Configuración de Voz Sintética
          </h2>
          <p className="text-dark-muted text-sm mt-2">Personaliza la voz generada por IA para tus alertas</p>
        </div>

        {/* Límite de usuario */}
        {usage && !loadingUsage && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            usage.percentageUsed > 80 
              ? 'border-red-500 bg-red-500/10' 
              : usage.percentageUsed > 50 
              ? 'border-yellow-500 bg-yellow-500/10'
              : 'border-green-500 bg-green-500/10'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <p className={`font-bold text-sm ${
                usage.percentageUsed > 80 
                  ? 'text-red-400' 
                  : usage.percentageUsed > 50 
                  ? 'text-yellow-400'
                  : 'text-green-400'
              }`}>
                Límite Mensual de Caracteres
              </p>
              <span className="text-xs font-bold text-dark-muted">
                {usage.percentageUsed}%
              </span>
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
              <strong>{usage.charsRemaining}</strong> caracteres disponibles de <strong>{usage.charsLimit}</strong> este mes
            </p>
          </div>
        )}

        {/* Habilitar TTS */}
        <div className="mb-6 flex items-center gap-3">
          <input
            type="checkbox"
            id="tts-enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5"
          />
          <label htmlFor="tts-enabled" className="text-dark-text font-semibold">
            Habilitar voz sintética para esta alerta
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Voz */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
                Seleccionar voz
              </label>
              <p className="text-xs text-dark-muted mb-2">
                Para español, pega el ID de voz de ElevenLabs (opcional).
              </p>
              <select
                value={config.voiceId}
                onChange={(e) => setConfig({ ...config, voiceId: e.target.value })}
                className="w-full p-3 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary font-semibold"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.75rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {getAvailableVoices().map(voice => (
                  <option key={voice.id} value={voice.id} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{voice.name}</option>
                ))}
              </select>
              <p className="text-xs text-dark-muted mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                <strong>Plan {userTier.toUpperCase()}:</strong> {getAvailableVoices().length} voces disponibles
              </p>
            </div>

            {/* Usar mensaje del viewer */}
            <div className="mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="use-viewer-message"
                checked={config.useViewerMessage}
                onChange={(e) => setConfig({ ...config, useViewerMessage: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="use-viewer-message" className="text-dark-text text-sm">
                Leer mensaje del espectador
              </label>
            </div>

            {/* Leer nombre del usuario */}
            <div className="mb-6 flex items-center gap-3">
              <input
                type="checkbox"
                id="read-username"
                checked={config.readUsername}
                onChange={(e) => setConfig({ ...config, readUsername: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="read-username" className="text-dark-text text-sm">
                Incluir nombre del usuario
              </label>
            </div>

            {/* Texto personalizado */}
            {!config.useViewerMessage && (
              <div className="mb-6">
                <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
                  Texto a decir
                </label>
                <textarea
                  value={config.text}
                  onChange={(e) => setConfig({ ...config, text: e.target.value })}
                  placeholder="Escribe el texto que quieras que diga la voz..."
                  maxLength={300}
                  className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition h-24 resize-none"
                />
                <small className="text-dark-muted">{config.text.length}/300 caracteres</small>
              </div>
            )}

            {/* Stability */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
                Estabilidad: {config.stability.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.stability}
                onChange={(e) => setConfig({ ...config, stability: parseFloat(e.target.value) })}
                className="w-full"
              />
              <small className="text-dark-muted">Mayor = más consistente, Menor = más expresivo</small>
            </div>

            {/* Similarity Boost */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
                Similaridad: {config.similarityBoost.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.similarityBoost}
                onChange={(e) => setConfig({ ...config, similarityBoost: parseFloat(e.target.value) })}
                className="w-full"
              />
              <small className="text-dark-muted">Mayor = más similar a la voz original</small>
            </div>


            {/* Botón de prueba */}
            <button
              onClick={handleTest}
              disabled={testing}
              className="w-full mb-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white font-black py-4 px-6 rounded-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all text-lg"
            >
              {testing ? 'Generando audio...' : 'Escuchar muestra'}
            </button>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 bg-dark-secondary text-dark-muted font-bold py-3 px-6 rounded-xl hover:bg-dark-border transition text-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-primary via-pink-500 to-primary text-white font-black py-3 px-6 rounded-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed transition-all text-lg"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};
