import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_URL } from '../constants/config';

export const FeedbackResponseForm = ({ feedbackId, adminId, onRespond }) => {
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = response.trim();
    if (!trimmed) {
      toast.error('Escribí una respuesta');
      return;
    }

    setSending(true);

    const MAX_RETRIES = 2;
    const TIMEOUT_MS = 15000;
    const RETRY_DELAY_MS = 2000;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const sendRequest = async (retryCount = 0) => {
      try {
        //  CAMBIÁ ESTA RUTA SI TU BACKEND USA OTRA
        await axios.post(
          `${API_URL}/api/admin/feedback/${feedbackId}/response`,
          { adminId, response: trimmed },
          {
            timeout: TIMEOUT_MS,
            headers: { 'x-admin-id': adminId } // opcional, por si lo usás del lado backend
          }
        );

        toast.success('Respuesta enviada');
        setResponse('');
        onRespond?.();
      } catch (error) {
        const isNetworkError =
          error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';

        if (isNetworkError && retryCount < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS);
          return sendRequest(retryCount + 1);
        }

        if (isNetworkError) {
          toast.error('El servidor no responde. Revisá tu conexión.');
        } else {
          toast.error(error.response?.data?.error || 'No se pudo enviar la respuesta');
        }
      }
    };

    await sendRequest();
    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Responder al usuario..."
        maxLength={1200}
        className="w-full p-3 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition h-24 resize-none"
      />

      <div className="flex items-center justify-between">
        <small className="text-[10px] text-dark-muted uppercase">
          {response.length}/1200
        </small>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setResponse('')}
            className="px-3 py-2 rounded-lg bg-dark-secondary/60 border border-dark-border text-white text-xs font-semibold hover:bg-dark-secondary transition"
            disabled={sending}
          >
            Limpiar
          </button>

          <button
            type="submit"
            disabled={sending || !response.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-pink-500 text-white text-xs font-bold disabled:opacity-50 transition"
          >
            {sending ? 'Enviando...' : 'Enviar respuesta'}
          </button>
        </div>
      </div>
    </form>
  );
};
export default FeedbackResponseForm;