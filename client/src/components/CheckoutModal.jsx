import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

export function CheckoutModal({ isOpen, planTier, onClose, userId }) {
  const [creatorCode, setCreatorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('mercadopago');

  const handleConfirmCheckout = async () => {
    if (!userId) {
      toast.error('Iniciá sesión primero');
      return;
    }

    setLoading(true);
    const providerName = selectedProvider === 'paypal' ? 'PayPal' : 'Mercado Pago';
    const toastId = toast.loading('Creando checkout con ' + providerName + '...');

    try {
      console.log('📦 Iniciando checkout:', { userId, planTier, selectedProvider });
      
      const res = await axios.post(`${API_URL}/api/billing/checkout`, {
        userId,
        planTier,
        creatorCode: creatorCode.trim(),
        provider: selectedProvider
      });

      console.log('✅ Checkout response:', res.data);

      if (res.data?.url) {
        console.log('🔄 Redirigiendo a:', res.data.url);
        window.location.href = res.data.url;
      } else {
        toast.error('No se pudo iniciar el checkout - sin URL de redirección', { id: toastId });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error iniciando checkout';
      console.error('❌ Checkout error:', { error: error.response?.data, status: error.response?.status, message: error.message });
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const planName = planTier === 'pro' ? 'Plan PRO' : 'Plan PREMIUM';

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-black text-white mb-1">{planName}</h2>
        <p className="text-dark-muted text-sm mb-6">Selecciona tu método de pago</p>

        {/* Payment Provider Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedProvider('mercadopago')}
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
              selectedProvider === 'mercadopago'
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-dark-border bg-dark-secondary hover:border-cyan-500/50'
            }`}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="#009ee3" />
              <circle cx="12" cy="12" r="8" fill="#fff" opacity="0.2" />
            </svg>
            <span className="text-xs font-bold text-white">Mercado Pago</span>
          </button>
          <button
            onClick={() => setSelectedProvider('paypal')}
            disabled
            className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 opacity-50 cursor-not-allowed ${
              selectedProvider === 'paypal'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-dark-border bg-dark-secondary'
            }`}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.696 3.059c-.248.054-.53.166-.697.31-.175.154-.257.42-.219.704.039.278.149.5.373.74.184.199.45.35.756.435l.15.04.182.05c.33.09.612.252.792.45.142.153.22.35.22.6 0 .275-.1.525-.327.715-.215.177-.516.27-.95.27-.353 0-.66-.08-.876-.24l-.024-.016-.024.015c-.212.156-.46.41-.623.683l-.122.218.195.156c.234.189.55.396.925.521.291.098.687.145 1.13.145.893 0 1.588-.21 1.996-.614.463-.45.702-1.103.702-1.914 0-.562-.133-1.016-.396-1.34-.213-.26-.532-.47-.932-.612l-.144-.047c-.33-.106-.6-.23-.778-.37-.12-.1-.19-.236-.19-.4 0-.185.062-.33.181-.416.115-.083.3-.131.56-.131.21 0 .41.035.581.105.17.068.348.172.524.31l.013.01.015-.01c.18-.137.372-.325.554-.557l.14-.173-.168-.152c-.274-.25-.588-.437-.94-.556-.363-.124-.78-.187-1.226-.187-.505 0-.918.09-1.22.27z" fill="#003087" />
            </svg>
            <span className="text-xs font-bold text-white">PayPal</span>
          </button>
        </div>

        {/* Creator Code Input */}
        <input
          value={creatorCode}
          onChange={(e) => setCreatorCode(e.target.value)}
          placeholder="Código de creador (opcional)"
          className="w-full p-3 rounded-lg border-2 border-dark-border bg-dark-secondary text-white outline-none focus:border-cyan-500 mb-6"
        />

        {/* Buttons */}
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
            disabled={loading || selectedProvider === 'paypal'}
            className={`flex-1 py-3 rounded-lg text-white font-bold disabled:opacity-60 transition-all ${
              selectedProvider === 'paypal'
                ? 'bg-dark-secondary cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-600'
            }`}
          >
            {loading ? 'Procesando...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
}
