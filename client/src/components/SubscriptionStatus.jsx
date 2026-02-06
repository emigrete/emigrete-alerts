import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

export const SubscriptionStatus = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/subscription/status`, {
          params: { userId }
        });
        setStatus(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription status:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [userId]);

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);
      const response = await axios.post(`${API_URL}/api/billing/cancel-subscription`, {
        userId
      });

      setStatus(prevStatus => ({
        ...prevStatus,
        subscription: {
          ...prevStatus.subscription,
          cancelAtPeriodEnd: true
        }
      }));

      if (response.data.manualCancellationRequired) {
        toast.warning('Cancelado en nuestro sistema', {
          description: 'Por favor cancela también en Mercado Pago',
          action: {
            label: 'Ir a Mercado Pago',
            onClick: () => window.open(response.data.mpLink, '_blank')
          },
          duration: 10000
        });
      } else {
        toast.success('Suscripción cancelada', {
          description: 'Tu plan seguirá activo hasta fin del período'
        });
      }
      
      setShowCancelModal(false);
    } catch (err) {
      console.error('Error cancelando suscripción:', err);
      toast.error('Error al cancelar', {
        description: err.response?.data?.error || 'Intenta de nuevo más tarde'
      });
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <div className="text-dark-muted text-base mb-4">Cargando plan...</div>;
  if (error) return null;
  if (!status) return null;

  const { subscription, usage, nextResetDate } = status;
  
  // Calcular días hasta fin de período
  const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
  const today = new Date();
  const daysRemaining = currentPeriodEnd ? Math.ceil((currentPeriodEnd - today) / (1000 * 60 * 60 * 24)) : null;
  const canDowngradePlan = !currentPeriodEnd || currentPeriodEnd <= today || subscription.tier === 'free';
  
  // Helper para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const tierColors = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    premium: 'from-purple-500 via-pink-500 to-purple-600'
  };

  const tierLabels = {
    free: 'FREE',
    pro: 'PRO',
    premium: 'PREMIUM'
  };

  return (
    <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-4 mb-6">
      {/* Header - Solo info básica */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-dark-text">Tu Plan</h3>
          <p className="text-xs text-dark-muted mt-1">
            {subscription.tier !== 'free' && currentPeriodEnd
              ? `Próxima facturación: ${formatDate(currentPeriodEnd)}`
              : 'Plan gratuito'}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <span className={`px-4 py-1.5 rounded-full text-white text-xs font-black uppercase tracking-wide bg-gradient-to-r ${tierColors[subscription.tier]} shadow-lg ${subscription.tier === 'premium' ? 'animate-pulse' : ''}`}>
            {tierLabels[subscription.tier]}
          </span>
          <button
            onClick={() => document.getElementById('usage-stats-button')?.click()}
            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition"
            title="Ver detalles de consumo"
          >
            Ver consumos
          </button>
          {subscription.tier !== 'free' && !subscription.cancelAtPeriodEnd && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white text-xs font-bold transition"
              title="Cancelar suscripción"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Alert si está cerca del límite */}
      {(usage.alerts.percentage > 80 || usage.tts.percentage > 80) && subscription.tier !== 'premium' && (
        <button 
          onClick={() => navigate('/pricing')}
          className="mt-3 w-full text-xs font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg transition"
        >
          Estás cerca del límite - Upgrade Plan
        </button>
      )}

      {subscription.cancelAtPeriodEnd && currentPeriodEnd && (
        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-300 font-semibold">Cancelación programada</p>
          <p className="text-xs text-dark-muted mt-1">
            Tu plan sigue activo hasta {formatDate(currentPeriodEnd)}.
          </p>
        </div>
      )}

      {/* Info sobre cambios de plan protegidos */}
      {subscription.tier !== 'free' && daysRemaining !== null && daysRemaining > 0 && (
        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300 font-semibold">
            Cambios de plan protegidos
          </p>
          <p className="text-xs text-dark-muted mt-1">
            Podés cambiar a un plan superior ahora. Para bajar de plan, esperá {daysRemaining} días.
          </p>
        </div>
      )}

      {/* Modal de confirmación para cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-dark-text mb-2">¿Cancelar suscripción?</h3>
            <p className="text-sm text-dark-muted mb-4">
              Tu plan <strong>{subscription.tier.toUpperCase()}</strong> seguirá activo hasta <strong>{formatDate(subscription.currentPeriodEnd)}</strong>. 
              Después se cambiará a FREE automáticamente.
            </p>
            <p className="text-xs text-yellow-400 mb-6 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
              ⚠️ No perderás tus datos, solo los límites de uso cambiarán.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-dark-secondary text-dark-text font-semibold hover:bg-dark-border transition"
                disabled={cancelLoading}
              >
                Seguir con mi plan
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-50"
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
