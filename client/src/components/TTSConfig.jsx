import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculino, profundo)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Femenino, suave)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Masculino, cálido)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Masculino, autoritario)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Femenino, juvenil)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (Femenino, británico)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Masculino, británico)' },
];

export const TTSConfig = ({ triggerId, initialConfig, onClose, onUpdate }) => {
  const [config, setConfig] = useState({
    enabled: false,
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    text: '',
    useViewerMessage: true,
    readUsername: true,
    stability: 0.5,
    similarityBoost: 0.75,
    ...initialConfig
  });

  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      // Texto de ejemplo
      const testText = config.readUsername 
        ? `GokuSSJ3 dice: ${config.text || 'Gracias por el canje!'}`
        : config.text || 'Gracias por el canje!';

      const response = await axios.post(`${API_URL}/api/tts`, {
        text: testText,
        voiceId: config.voiceId,
        stability: config.stability,
        similarityBoost: config.similarityBoost
      });

      // Reproducir audio
      const audio = new Audio(response.data.audio);
      audio.volume = 1.0;
      audio.play();
      toast.success('Reproduciendo audio de prueba');
    } catch (error) {
      console.error('Error al generar TTS:', error);
      toast.error('Error al generar audio: ' + (error.response?.data?.error || error.message));
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
      <div className="bg-dark-card border border-primary/30 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          ⚡ Configuración TTS (ElevenLabs)
        </h2>

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
            Habilitar Text-to-Speech
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Voz */}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
                Voz
              </label>
              <select
                value={config.voiceId}
                onChange={(e) => setConfig({ ...config, voiceId: e.target.value })}
                className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition"
              >
                {ELEVENLABS_VOICES.map(voice => (
                  <option key={voice.id} value={voice.id}>{voice.name}</option>
                ))}
              </select>
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
                Leer mensaje del viewer al canjear
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
                Decir nombre del usuario antes del mensaje
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
                  placeholder="Escribe el texto que quieras que diga el TTS..."
                  maxLength={300}
                  className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition h-24 resize-none"
                />
                <small className="text-dark-muted">{config.text.length}/300 caracteres (máx. para reducir costos)</small>
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
              className="w-full mb-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {testing ? '🎤 Generando...' : '🔊 Probar Voz'}
            </button>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-dark-secondary text-dark-muted font-semibold py-3 px-6 rounded-lg hover:bg-dark-border transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
