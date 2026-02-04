import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

export function CheckoutModal({ isOpen, planTier, onClose, userId, paymentProvider }) {
  const [creatorCode, setCreatorCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmCheckout = async () => {
    if (!userId) {
      toast.error('Iniciá sesión primero');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creando checkout...');

    try {
      const res = await axios.post(`${API_URL}/api/billing/checkout`, {
        userId,
        planTier,
        creatorCode: creatorCode.trim(),
        provider: paymentProvider
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('No se pudo iniciar el checkout', { id: toastId });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Error iniciando checkout';
      toast.error(errorMsg, { id: toastId });
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const planName = planTier === 'pro' ? 'Plan PRO' : 'Plan PREMIUM';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-sm w-full">
        <h2 className="text-2xl font-black text-white mb-2">{planName}</h2>
        <p className="text-dark-muted mb-6">¿Tenés código de creador?</p>

        <input
          value={creatorCode}
          onChange={(e) => setCreatorCode(e.target.value)}
          placeholder="Código de creador (opcional)"
          className="w-full p-3 rounded-lg border-2 border-dark-border bg-dark-secondary text-white outline-none focus:border-primary mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-lg border border-dark-border text-white font-bold hover:bg-dark-secondary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmCheckout}
            disabled={loading}
            className="flex-1 py-3 rounded-lg bg-primary text-white font-bold hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
