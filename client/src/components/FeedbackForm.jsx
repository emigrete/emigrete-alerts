import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '../constants/config';

export const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('suggestion');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Por favor, detallá tu comentario');
      return;
    }

    setSending(true);
    const TIMEOUT_MS = 20000;
    const RETRY_DELAY_MS = 1200;
    const isRetryableError = (err) => {
      const code = err?.code;
      return code === 'ECONNABORTED' || code === 'ERR_NETWORK';
    };
    try {
      const payload = { feedback, email, type };
      try {
        await axios.post(`${API_URL}/api/feedback`, payload, { timeout: TIMEOUT_MS });
      } catch (err) {
        if (!isRetryableError(err)) throw err;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        await axios.post(`${API_URL}/api/feedback`, payload, { timeout: TIMEOUT_MS });
      }

      toast.success('Gracias por tu comentario.');
      setFeedback('');
      setEmail('');
      setType('suggestion');
    } catch (error) {
      if (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK') {
        toast.error('El servidor está lento. Intentá de nuevo en unos segundos.');
      } else {
        toast.error('No se pudo enviar el comentario. Intentá de nuevo.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 via-pink-500/5 to-dark-secondary border border-primary/30 rounded-3xl p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-3">Enviá tu comentario</h2>
        <p className="text-dark-muted text-sm">
          Si tenés sugerencias, reportes de fallas o consultas, nos interesa conocer tu opinión sobre la app.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
              Correo electrónico (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition"
            />
          </div>

          {/* Tipo de feedback */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="suggestion" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Sugerencia</option>
              <option value="bug" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Reporte de falla</option>
              <option value="feature" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Solicitud de mejora</option>
              <option value="other" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>Otro</option>
            </select>
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            Mensaje
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Contanos tu experiencia o sugerencia."
            maxLength={1000}
            className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition h-28 resize-none"
          />
          <small className="text-dark-muted">{feedback.length}/1000 caracteres</small>
        </div>

        {/* Botón */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={sending || !feedback.trim()}
            className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {sending ? 'Enviando...' : 'Enviar comentario'}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-dark-muted text-center">
          También podés escribir a <strong>teodorowelyczko@gmail.com</strong>
        </p>
      </form>
    </section>
  );
};
