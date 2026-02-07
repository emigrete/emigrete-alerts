import React from 'react';

const FeedbackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-50 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all"
      style={{ boxShadow: '0 4px 16px rgba(255,0,0,0.2)' }}
      aria-label="Enviar feedback"
    >
      Feedback
    </button>
  );
};

export default FeedbackButton;
