const FeedbackButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all"
      aria-label="Enviar feedback"
    >
      Feedback
    </button>
  );
};

export default FeedbackButton;
