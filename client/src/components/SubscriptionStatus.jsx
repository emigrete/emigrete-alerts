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

  const { subscription, usage } = status;
  
  // Helper para formatear bytes a unidad legible
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };

  const tierColors = {
    free: 'from-gray-500 to-gray-600',
    pro: 'from-blue-500 to-blue-600',
    premium: 'from-purple-500 to-pink-500'
  };

  const tierLabels = {
    free: 'FREE',
    pro: 'PRO',
    premium: 'PREMIUM'
  };

  return (
    <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-dark-text">Tu Plan</h3>
        <span className={`px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${tierColors[subscription.tier]}`}>
          {tierLabels[subscription.tier]}
        </span>
      </div>

      {/* Uso */}
      <div className="grid grid-cols-3 gap-3 text-xs">
        {/* Alertas */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-dark-muted">Alertas</span>
            <span className="font-bold text-dark-text">
              {usage.alerts.current}/{usage.alerts.limit === Infinity ? '∞' : usage.alerts.limit}
            </span>
          </div>
          {usage.alerts.limit !== Infinity && (
            <div className="w-full bg-dark-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.alerts.percentage > 80
                    ? 'bg-red-500'
                    : usage.alerts.percentage > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${usage.alerts.percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* TTS */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-dark-muted">TTS</span>
            <span className="font-bold text-dark-text">
              {usage.tts.current}/{usage.tts.limit === Infinity ? '∞' : usage.tts.limit}
            </span>
          </div>
          {usage.tts.limit !== Infinity && (
            <div className="w-full bg-dark-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.tts.percentage > 80
                    ? 'bg-red-500'
                    : usage.tts.percentage > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${usage.tts.percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-dark-muted">Storage</span>
            <span className="font-bold text-dark-text text-xs">
              {formatBytes(usage.storage.current)} / {usage.storage.limit === Infinity ? '∞' : formatBytes(usage.storage.limit)}
            </span>
          </div>
          {usage.storage.limit !== Infinity && (
            <div className="w-full bg-dark-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usage.storage.percentage > 80
                    ? 'bg-red-500'
                    : usage.storage.percentage > 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${usage.storage.percentage}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upgrade button si está cerca del límite */}
      {(usage.alerts.percentage > 80 || usage.tts.percentage > 80) && subscription.tier !== 'premium' && (
        <button 
          onClick={() => navigate('/pricing')}
          className="mt-3 w-full text-xs font-bold py-2 px-3 rounded-lg bg-gradient-to-r from-primary to-pink-500 text-white hover:shadow-lg transition"
        >
          Upgrade Plan
        </button>
      )}
    </div>
  );
};
