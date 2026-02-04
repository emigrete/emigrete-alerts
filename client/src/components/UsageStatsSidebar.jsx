import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Formatea bytes a unidad legible
 */
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Barra de progreso del consumo
 */
const ProgressBar = ({ current, limit, isUnlimited, label }) => {
  if (isUnlimited) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-dark-muted">{label}</span>
          <span className="text-primary font-bold">Ilimitado</span>
        </div>
        <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-full opacity-30"></div>
        </div>
      </div>
    );
  }

  const percentage = Math.round((current / limit) * 100);
  const isWarning = percentage >= 75;
  const isDanger = percentage >= 95;

  let barColor = 'from-blue-500 to-cyan-500';
  if (isWarning && !isDanger) barColor = 'from-yellow-500 to-orange-500';
  if (isDanger) barColor = 'from-red-500 to-pink-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-dark-muted">{label}</span>
        <span className={`font-bold ${isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-primary'}`}>
          {percentage}%
        </span>
      </div>
      <div className="h-2 bg-dark-secondary rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${barColor} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-dark-muted">
        {formatBytes(current)} / {formatBytes(limit)}
      </p>
    </div>
  );
};

export default function UsageStatsSidebar({ userId }) {
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/subscription/status`, {
        params: { userId }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    if (!expanded) {
      loadStats();
    }
    setExpanded(!expanded);
  };

  if (!userId) return null;

  return (
    <>
      {/* Botón flotante para expandir */}
      <button
        id="usage-stats-button"
        onClick={toggleExpand}
        className={`fixed bottom-6 right-6 z-40 rounded-full shadow-xl transition-all ${
          expanded
            ? 'bg-gradient-to-r from-primary to-pink-500 hover:shadow-2xl text-white'
            : 'bg-gradient-to-br from-dark-card to-dark-secondary border-2 border-primary/30 hover:border-primary text-primary hover:bg-dark-card'
        } w-16 h-16 flex items-center justify-center font-bold text-sm flex-col gap-0.5`}
        title={expanded ? 'Cerrar' : 'Ver consumos'}
      >
        <span className="text-lg">∞</span>
        <span className="text-xs">Uso</span>
      </button>

      {/* Panel lateral expandible */}
      {expanded && (
        <div className="fixed bottom-24 right-6 z-40 w-96 bg-gradient-to-br from-dark-card via-dark-secondary to-dark-card border-2 border-primary/30 rounded-3xl shadow-2xl p-8 max-h-96 overflow-y-auto">
          {/* Header con plan badge */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-primary/20">
            <div>
              <h3 className="text-xl font-black text-white">Dashboard</h3>
              <p className="text-xs text-dark-muted mt-1">Límites y consumo</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-white text-xs font-black uppercase tracking-wider ${
              stats?.subscription?.tier === 'premium' 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : stats?.subscription?.tier === 'pro'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-gray-500 to-gray-600'
            }`}>
              {stats?.subscription?.tier?.toUpperCase() || 'FREE'}
            </span>
          </div>

          {loading && (
            <div className="text-center py-4">
              <p className="text-dark-muted text-sm">Cargando...</p>
            </div>
          )}

          {stats && (
            <div className="space-y-6">
              {/* ALERTAS */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Alertas</h4>
                <ProgressBar
                  current={stats.usage.alerts.current}
                  limit={stats.usage.alerts.limit}
                  isUnlimited={stats.usage.alerts.isUnlimited}
                  label="Alertas/mes"
                />
                <p className="text-xs text-dark-muted mt-2">
                  {stats.usage.alerts.isUnlimited
                    ? 'Ilimitadas'
                    : `${stats.usage.alerts.remaining} disponibles`}
                </p>
              </div>

              {/* TTS */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">TTS (Voz IA)</h4>
                <ProgressBar
                  current={stats.usage.tts.current}
                  limit={stats.usage.tts.limit}
                  isUnlimited={stats.usage.tts.isUnlimited}
                  label="Caracteres/mes"
                />
                <p className="text-xs text-dark-muted mt-2">
                  {stats.usage.tts.isUnlimited
                    ? 'Ilimitados caracteres'
                    : `${stats.usage.tts.current.toLocaleString()} / ${stats.usage.tts.limit?.toLocaleString() || 0} caracteres`}
                </p>
              </div>

              {/* STORAGE */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Almacenamiento</h4>
                <ProgressBar
                  current={stats.usage.storage.current}
                  limit={stats.usage.storage.limit}
                  isUnlimited={stats.usage.storage.isUnlimited}
                  label="Espacio total"
                />
                <p className="text-xs text-dark-muted mt-2">
                  {stats.usage.storage.isUnlimited
                    ? 'Almacenamiento ilimitado'
                    : `${formatBytes(stats.usage.storage.current)} / ${formatBytes(stats.usage.storage.limit)}`}
                </p>
              </div>

              {/* BANDWIDTH */}
              <div>
                <h4 className="text-sm font-semibold text-primary mb-3">Ancho de Banda</h4>
                <ProgressBar
                  current={stats.usage.bandwidth.current}
                  limit={stats.usage.bandwidth.limit}
                  isUnlimited={stats.usage.bandwidth.isUnlimited}
                  label="Tráfico/mes"
                />
                <p className="text-xs text-dark-muted mt-2">
                  {stats.usage.bandwidth.isUnlimited
                    ? 'Tráfico ilimitado'
                    : `${formatBytes(stats.usage.bandwidth.current)} / ${formatBytes(stats.usage.bandwidth.limit)}`}
                </p>
              </div>

              {/* INFO DE RESET */}
              <div className="pt-4 border-t border-dark-border">
                <p className="text-xs text-dark-muted">
                  Próximo reset: <span className="text-primary font-semibold">
                    {new Date(stats.nextResetDate).toLocaleDateString('es-AR')}
                  </span>
                </p>
              </div>

              {/* BOTÓN UPGRADE */}
              {stats.subscription.tier !== 'premium' && (
                <a
                  href="/pricing"
                  className="block w-full mt-4 bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-2 px-4 rounded-lg text-center text-sm hover:shadow-lg transition-all"
                >
                  Cambiar Plan
                </a>
              )}
            </div>
          )}

          {!loading && !stats && (
            <div className="text-center py-4">
              <p className="text-dark-muted text-sm">
                No se pudieron cargar las estadísticas
              </p>
              <button
                onClick={loadStats}
                className="mt-2 text-primary text-sm hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay transparente cuando está expandido */}
      {expanded && (
        <div
          className="fixed inset-0 z-30 cursor-pointer"
          onClick={() => setExpanded(false)}
        />
      )}
    </>
  );
}
