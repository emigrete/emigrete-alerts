import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';

const MyFeedbacks = ({ userId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetchFeedbacks();
  }, [userId]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/feedback/mine`, {
        headers: { 'x-user-id': userId }
      });
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      setError('Error al cargar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <section className="bg-dark-card border border-primary/20 rounded-2xl p-6 mt-10">
      <h2 className="text-xl font-black text-primary mb-4">Mis feedbacks</h2>
      {loading ? (
        <p className="text-dark-muted">Cargando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : feedbacks.length === 0 ? (
        <p className="text-dark-muted">No has enviado comentarios.</p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(fb => (
            <div key={fb._id} className="bg-dark-secondary rounded-xl p-4 border border-primary/10">
              <div className="text-white mb-2">{fb.feedback}</div>
              {fb.response && (
                <div className="text-green-400 text-sm">Respuesta del admin: {fb.response}</div>
              )}
              <div className="text-xs text-dark-muted mt-1">{new Date(fb.createdAt).toLocaleString('es-ES')}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyFeedbacks;
