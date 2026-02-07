import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';

const FeedbackResponseForm = ({ feedbackId, onRespond }) => {
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await axios.put(`${API_URL}/api/admin/feedback/${feedbackId}`, { response });
      setResponse('');
      if (onRespond) onRespond();
    } catch (err) {
      setError('Error al enviar respuesta');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={response}
        onChange={e => setResponse(e.target.value)}
        placeholder="Escribe una respuesta para el usuario..."
        className="w-full p-2 rounded border border-primary bg-dark-secondary text-white mb-2"
        rows={2}
        maxLength={500}
        disabled={sending}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="bg-primary text-white px-4 py-1 rounded font-bold disabled:opacity-60"
          disabled={sending || !response.trim()}
        >Enviar respuesta</button>
        {error && <span className="text-red-500 text-xs">{error}</span>}
      </div>
    </form>
  );
};

export default FeedbackResponseForm;