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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-card rounded-2xl border border-dark-border shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-6 text-dark-text">Crear Nueva Alerta</h2>
        {isDemo && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-600 text-sm">
            Modo DEMO: Los datos no se guardan en Twitch
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-dark-muted mb-2">
              Nombre de la alerta
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi Alerta Épica"
              maxLength={45}
              className="w-full bg-dark-secondary border border-dark-border px-4 py-2 rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary transition"
            />
            <p className="text-xs text-dark-muted mt-1">{title.length}/45 caracteres</p>
          </div>

          {/* Costo */}
          <div>
            <label className="block text-sm font-semibold text-dark-muted mb-2">
              Costo en puntos
            </label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="500"
              min="1"
              className="w-full bg-dark-secondary border border-dark-border px-4 py-2 rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary transition"
            />
          </div>

          {/* Descripción (opcional) */}
          <div>
            <label className="block text-sm font-semibold text-dark-muted mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descripción que vean los viewers"
              maxLength={200}
              rows={3}
              className="w-full bg-dark-secondary border border-dark-border px-4 py-2 rounded-lg text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary transition resize-none"
            />
            <p className="text-xs text-dark-muted mt-1">{prompt.length}/200 caracteres</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="require-input"
              checked={requireInput}
              onChange={(e) => setRequireInput(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="require-input" className="text-dark-text text-sm">Requerir mensaje del espectador (texto)</label>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-dark-muted mb-2">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1 bg-dark-secondary border border-dark-border px-4 py-2 rounded-lg text-dark-text font-mono text-sm focus:outline-none focus:border-primary transition"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-dark-secondary border border-dark-border text-dark-text px-4 py-2 rounded-lg hover:border-dark-muted transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
