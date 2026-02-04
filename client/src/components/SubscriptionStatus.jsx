import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../constants/config';

export const SubscriptionStatus = ({ userId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  if (loading) return <div className="text-dark-muted text-base mb-4">⏳ Cargando plan...</div>;
  if (error) return null;
  if (!status) return null;

  const { subscription, usage, nextResetDate } = status;
  
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
            Se reinicia el {formatDate(nextResetDate)}
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
            📊 Ver consumos
          </button>
        </div>
      </div>

      {/* Alert si está cerca del límite */}
      {(usage.alerts.percentage > 80 || usage.tts.percentage > 80) && subscription.tier !== 'premium' && (
        <button 
          onClick={() => navigate('/pricing')}
          className="mt-3 w-full text-xs font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg transition"
        >
          ⚠️ Estás cerca del límite - Upgrade Plan
        </button>
      )}
    </div>
  );
};
