import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API_URL } from '../constants/config';

export const FeedbackForm = () => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Por favor escribe tu recomendación');
      return;
    }

    setSending(true);
    try {
      // Enviar feedback por email (usando un servicio simple)
      // Por ahora lo mostramos en consola del servidor
      console.log('📮 Feedback recibido:', { feedback, email });
      
      toast.success('¡Gracias por tu feedback! 💝');
      setFeedback('');
      setEmail('');
    } catch (error) {
      toast.error('Error al enviar feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 via-pink-500/5 to-dark-secondary border border-primary/30 rounded-3xl p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white mb-3">Envíanos tu Feedback</h2>
        <p className="text-dark-muted text-sm">
          ¿Tienes sugerencias, reportes de bugs o simplemente quieres saludarnos? Nos encantaría saber qué piensas de la app.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
              Tu Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition"
            />
          </div>

          {/* Tipo de feedback */}
          <div>
            <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
              Tipo
            </label>
            <select className="w-full p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="suggestion" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>💡 Sugerencia</option>
              <option value="bug" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>🐛 Reporte de Bug</option>
              <option value="feature" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>✨ Solicitud de Feature</option>
              <option value="other" style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>💬 Otro</option>
            </select>
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            Tu Mensaje
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Cuéntanos qué piensas... ¡nos importa tu opinión!"
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
            {sending ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-dark-muted text-center">
          También puedes contactarnos a <strong>teodorowelyczko@gmail.com</strong>
        </p>
      </form>
    </section>
  );
};
