import { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL, COLORS } from '../constants/config';

export const RewardCreator = ({ userId, onRewardCreated, onCancel, isDemo, defaultRequireInput = false }) => {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('500');
  const [prompt, setPrompt] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#9146FF');
  const [requireInput, setRequireInput] = useState(defaultRequireInput);
  const [loading, setLoading] = useState(false);
  const [enableTTS, setEnableTTS] = useState(false);
  const [ttsText, setTtsText] = useState('');
  const [ttsUseViewerMessage, setTtsUseViewerMessage] = useState(true);

  // Lógica: Si TTS está activo Y quiere leer mensaje del espectador, fuerza requireInput a true
  const effectiveRequireInput = (enableTTS && ttsUseViewerMessage) ? true : requireInput;

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('El nombre de la alerta es requerido');
      return;
    }

    if (!cost || isNaN(cost) || parseInt(cost) < 1) {
      toast.error('El costo debe ser mayor a 0');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creando recompensa en Twitch...');

    try {
      if (isDemo) {
        // En demo, simular creación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoReward = {
          id: `demo_reward_${Date.now()}`,
          title,
          cost: parseInt(cost),
          backgroundColor,
          image: `https://via.placeholder.com/30x30/${backgroundColor.slice(1)}?text=${encodeURIComponent(title.charAt(0))}`
        };

        toast.success('¡Recompensa creada! (simulación demo)', { id: toastId });
        onRewardCreated(demoReward);
        setTitle('');
        setCost('500');
        setPrompt('');
      } else {
        // En producción, crear en Twitch
        const response = await axios.post(`${API_URL}/api/create-reward`, {
          userId,
          title,
          cost: parseInt(cost),
          prompt,
          backgroundColor,
          isUserInputRequired: effectiveRequireInput,
          enableTTS,
          ttsText: enableTTS ? ttsText : '',
          ttsUseViewerMessage: enableTTS ? ttsUseViewerMessage : true
        });

        toast.success('¡Recompensa creada!', { id: toastId });
        onRewardCreated(response.data.reward);
        setTitle('');
        setCost('500');
        setPrompt('');
        setEnableTTS(false);
        setTtsText('');
        setTtsUseViewerMessage(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear recompensa', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-dark-secondary rounded-3xl border border-primary/20 shadow-2xl max-w-2xl w-full p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent mb-2">
            Crear Nueva Alerta
          </h2>
          <p className="text-sm text-dark-muted">Configura una recompensa personalizada para tus espectadores</p>
        </div>

        {isDemo && (
          <div className="mb-6 p-4 bg-yellow-500/15 border-l-4 border-yellow-500 rounded-xl text-yellow-600 text-sm font-semibold">
            ⚠️ Modo DEMO: Los datos no se guardan en Twitch
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Fila 1: Nombre y Costo */}
          <div className="grid grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
                📝 Nombre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mi Alerta Épica"
                maxLength={45}
                className="w-full bg-dark-secondary/70 border border-dark-border px-4 py-3 rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <p className="text-xs text-dark-muted mt-2">{title.length}/45</p>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
                💎 Costo
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="500"
                min="1"
                className="w-full bg-dark-secondary/70 border border-dark-border px-4 py-3 rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <p className="text-xs text-dark-muted mt-2">puntos</p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
              📄 Descripción (opcional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe lo que hace tu alerta..."
              maxLength={200}
              rows={3}
              className="w-full bg-dark-secondary/70 border border-dark-border px-4 py-3 rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
            <p className="text-xs text-dark-muted mt-2">{prompt.length}/200</p>
          </div>

          {/* Opciones de Entrada */}
          <div className="bg-dark-secondary/40 border border-dark-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="require-input"
                checked={effectiveRequireInput}
                onChange={(e) => setRequireInput(e.target.checked)}
                disabled={enableTTS && ttsUseViewerMessage}
                className="w-5 h-5 rounded accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="require-input" className={`text-sm font-semibold cursor-pointer ${enableTTS && ttsUseViewerMessage ? 'text-dark-muted' : 'text-dark-text'}`}>
                Requerir mensaje del espectador
              </label>
              {enableTTS && ttsUseViewerMessage && (
                <span className="text-xs text-green-500 ml-auto font-bold">✓ Activado automáticamente</span>
              )}
            </div>
          </div>

          {/* Sección TTS */}
          <div className="border-t border-primary/20 pt-6">
            <div className="flex items-center gap-3 mb-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <input
                type="checkbox"
                id="enable-tts"
                checked={enableTTS}
                onChange={(e) => setEnableTTS(e.target.checked)}
                className="w-5 h-5 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="enable-tts" className="text-sm font-bold text-dark-text cursor-pointer flex items-center gap-2">
                🎙️ Activar TTS (Texto a Voz)
              </label>
            </div>

            {enableTTS && (
              <div className="space-y-4 p-5 bg-gradient-to-br from-primary/5 to-pink-500/5 border border-primary/30 rounded-xl">
                {ttsUseViewerMessage && (
                  <div className="p-4 bg-green-500/15 border-l-4 border-green-500 rounded-lg">
                    <p className="text-sm text-green-400 font-semibold flex items-center gap-2">
                      ✅ Configuración correcta
                    </p>
                    <p className="text-xs text-green-300 mt-2">
                      Los fans escribirán el texto que el TTS leerá
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="use-viewer-message"
                    checked={ttsUseViewerMessage}
                    onChange={(e) => setTtsUseViewerMessage(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="use-viewer-message" className="text-sm font-semibold text-dark-text cursor-pointer">
                    Leer mensaje del espectador
                  </label>
                </div>

                {!ttsUseViewerMessage && (
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
                      Texto personalizado
                    </label>
                    <textarea
                      value={ttsText}
                      onChange={(e) => setTtsText(e.target.value)}
                      placeholder="Escribe lo que dirá el TTS..."
                      maxLength={300}
                      rows={3}
                      className="w-full bg-dark-secondary/70 border border-dark-border px-4 py-3 rounded-xl text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none text-sm"
                    />
                    <p className="text-xs text-dark-muted mt-2">{ttsText.length}/300</p>
                  </div>
                )}
                
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                  💡 Configurarás la voz en el módulo TTS después de crear la alerta
                </div>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-3">
              🎨 Color
            </label>
            <div className="flex gap-3 items-center">
              <div className="relative group">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-12 rounded-xl cursor-pointer border-2 border-primary/50 hover:border-primary transition"
                />
                <div className="absolute inset-0 rounded-xl border-2 border-primary/50 group-hover:border-primary transition pointer-events-none" />
              </div>
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 bg-dark-secondary/70 border border-dark-border px-4 py-3 rounded-xl text-dark-text font-mono text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-dark-secondary/50 border border-dark-border text-dark-text px-4 py-3 rounded-xl font-semibold hover:border-dark-muted hover:bg-dark-secondary/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white px-4 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/50 hover:scale-105 transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Creando...' : '🚀 Crear Alerta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
