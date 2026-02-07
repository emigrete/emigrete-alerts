import { useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL, COLORS } from '../constants/config';

export const RewardCreator = ({ userId, onRewardCreated, onCancel, isDemo }) => {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('500');
  const [prompt, setPrompt] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#9146FF');
  const [requireInput, setRequireInput] = useState(false);
  const [loading, setLoading] = useState(false);

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
        const response = await axios.post(`${API_URL}/api/twitch/create-reward`, {
          userId,
          title,
          cost: parseInt(cost),
          prompt,
          backgroundColor,
          isUserInputRequired: requireInput
        });

        toast.success('¡Recompensa creada!', { id: toastId });
        onRewardCreated(response.data.reward);
        setTitle('');
        setCost('500');
        setPrompt('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear recompensa', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-dark-card via-dark-card to-dark-secondary rounded-3xl border border-primary/20 shadow-2xl max-w-lg w-full p-7 max-h-[90vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-black bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent">
            Crear Nueva Alerta
          </h2>
          <p className="text-dark-muted text-sm mt-2">
            Para alertas con voz IA, usá el módulo TTS.
          </p>
        </div>

        {isDemo && (
          <div className="mb-6 p-4 bg-yellow-500/15 border-l-4 border-yellow-500 rounded-xl text-yellow-600 text-sm font-semibold">
            Modo DEMO: Los datos no se guardan en Twitch
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Nombre y Costo - Una fila */}
          <div className="grid grid-cols-2 gap-3">
            {/* Nombre */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mi Alerta"
                maxLength={45}
                className="w-full bg-dark-secondary/70 border border-dark-border px-3 py-2 rounded-xl text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <p className="text-xs text-dark-muted mt-1">{title.length}/45</p>
            </div>

            {/* Costo */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Costo
              </label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="500"
                min="1"
                className="w-full bg-dark-secondary/70 border border-dark-border px-3 py-2 rounded-xl text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
              <p className="text-xs text-dark-muted mt-1">pts</p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Descripción
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe tu alerta..."
              maxLength={200}
              rows={2}
              className="w-full bg-dark-secondary/70 border border-dark-border px-3 py-2 rounded-xl text-dark-text text-sm placeholder-dark-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
            <p className="text-xs text-dark-muted mt-1">{prompt.length}/200</p>
          </div>

          {/* Opciones de Entrada */}
          <div className="bg-dark-secondary/40 border border-dark-border rounded-xl p-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="require-input"
                checked={requireInput}
                onChange={(e) => setRequireInput(e.target.checked)}
                className="w-4 h-4 rounded accent-primary cursor-pointer"
              />
              <label htmlFor="require-input" className="text-xs font-semibold cursor-pointer text-dark-text">
                Requerir mensaje del espectador
              </label>
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">
              Color
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded-xl cursor-pointer border-2 border-primary/50 hover:border-primary transition"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 bg-dark-secondary/70 border border-dark-border px-3 py-2 rounded-xl text-dark-text font-mono text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-dark-secondary/50 border border-dark-border text-dark-text px-3 py-2 rounded-xl font-semibold text-sm hover:border-dark-muted hover:bg-dark-secondary/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white px-3 py-2 rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/50 hover:scale-105 transition disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
