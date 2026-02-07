import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const typeLabel = (t) => {
  switch (t) {
    case 'bug':
      return { text: 'Bug', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
    case 'feature':
      return { text: 'Mejora', cls: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    case 'suggestion':
      return { text: 'Sugerencia', cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    default:
      return { text: 'Otro', cls: 'bg-gray-500/15 text-gray-300 border-gray-500/30' };
  }
};

const MyFeedbacks = ({ userId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sorted = useMemo(() => {
    return [...(feedbacks || [])].sort((a, b) => {
      const da = new Date(a?.createdAt || 0).getTime();
      const db = new Date(b?.createdAt || 0).getTime();
      return db - da;
    });
  }, [feedbacks]);

  const fetchFeedbacks = async (signal) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // ✅ sin header custom => menos CORS/preflight drama
      const res = await axios.get(`${API_URL}/api/feedback/mine`, {
        params: { userId },
        timeout: 15000,
        signal
      });

      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      // si se cerró el modal / abort, no mostramos error
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;

      // fallback por si tu backend aún espera header:
      // (podés borrar este bloque si no querés)
      try {
        const res2 = await axios.get(`${API_URL}/api/feedback/mine`, {
          timeout: 15000,
          headers: { 'x-user-id': userId },
          signal
        });
        setFeedbacks(res2.data.feedbacks || []);
      } catch {
        setError('Error al cargar feedbacks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    fetchFeedbacks(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!userId) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-primary tracking-wide">Mis feedbacks</h3>

        <button
          onClick={() => {
            const controller = new AbortController();
            fetchFeedbacks(controller.signal);
          }}
          className="px-3 py-1.5 rounded-lg bg-dark-secondary/60 border border-dark-border text-white text-xs font-semibold hover:bg-dark-secondary transition"
          disabled={loading}
        >
          {loading ? 'Actualizando...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <p className="text-dark-muted text-sm">Cargando...</p>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : sorted.length === 0 ? (
        <p className="text-dark-muted text-sm">No has enviado comentarios.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((fb) => {
            const badge = typeLabel(fb?.type);
            return (
              <div key={fb._id} className="bg-dark-secondary/40 rounded-xl p-4 border border-dark-border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-1 rounded-full border ${badge.cls}`}>
                    {badge.text}
                  </span>
                  <span className="text-[10px] text-dark-muted">{formatDate(fb.createdAt)}</span>
                </div>

                <div className="text-white text-sm whitespace-pre-wrap">
                  {fb.feedback}
                </div>

                {fb.response ? (
                  <div className="mt-3 text-green-300 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3 whitespace-pre-wrap">
                    <span className="font-bold">Respuesta del admin:</span> {fb.response}
                  </div>
                ) : (
                  <div className="mt-3 text-dark-muted text-xs italic">
                    Aún sin respuesta.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyFeedbacks;
