import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useLocalStorage } from '../hooks/useLocalStorage';

export const FeedbackForm = ({ onClose }) => {
  const [userId] = useLocalStorage('twitchUserId');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('suggestion');
  const [sending, setSending] = useState(false);

  const reset = () => {
    setFeedback('');
    setEmail('');
    setType('suggestion');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Tenés que iniciar sesión para enviar feedback.');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Por favor, detallá tu comentario');
      return;
    }

    setSending(true);

    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 15000;
    const RETRY_DELAY_MS = 2000;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const sendRequest = async (retryCount = 0) => {
      try {
        const payload = { feedback, email, type, userId };

        await axios.post(`${API_URL}/api/feedback`, payload, {
          timeout: TIMEOUT_MS
          // ✅ sin headers custom => menos quilombo de CORS
        });

        toast.success('¡Gracias! Tu feedback nos ayuda a mejorar.');
        reset();
        onClose?.();
      } catch (error) {
        const isNetworkError =
          error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

        if (isNetworkError && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          return sendRequest(retryCount + 1);
        }

        if (isNetworkError) toast.error('El servidor no responde. Revisá tu conexión.');
        else toast.error(error.response?.data?.error || 'No se pudo enviar. Intentá de nuevo.');
      }
    };

    await sendRequest();
    setSending(false);
  };

  return (
    <section className="w-full bg-dark-card rounded-2xl shadow-2xl p-6 relative border border-dark-border">
      <button
        className="absolute top-3 right-3 text-dark-muted hover:text-white bg-dark-secondary/50 rounded-full p-1.5 transition-colors"
        onClick={handleClose}
        type="button"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <header className="mb-6">
        <h2 className="text-xl font-black text-white">Enviá tu comentario</h2>
        <p className="text-dark-muted text-sm">Tu opinión ayuda a mejorar la Beta.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 text-xs font-semibold text-dark-muted uppercase tracking-wider">
            Email (Opcional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="w-full p-2.5 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold text-dark-muted uppercase tracking-wider">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2.5 rounded-lg border border-dark-border bg-dark-secondary text-white outline-none focus:border-primary transition appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.2em'
            }}
          >
            <option value="suggestion">Sugerencia</option>
            <option value="bug">Reporte de falla</option>
            <option value="feature">Solicitud de mejora</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 text-xs font-semibold text-dark-muted uppercase tracking-wider">
            Mensaje
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Contanos tu experiencia..."
            maxLength={1000}
            className="w-full p-2.5 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition h-28 resize-none"
          />
          <div className="flex justify-end">
            <small className="text-[10px] text-dark-muted uppercase">{feedback.length}/1000</small>
          </div>
        </div>

        <button
          type="submit"
          disabled={sending || !feedback.trim()}
          className="w-full bg-gradient-to-r from-primary to-pink-500 text-white font-bold py-3 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
        >
          {sending ? 'Enviando...' : 'Enviar comentario'}
        </button>

        <p className="text-[10px] text-dark-muted text-center pt-2">
          O escribinos a <span className="text-primary/80 font-medium">teodorowelyczko@gmail.com</span>
        </p>
      </form>
    </section>
  );
};
