import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FeedbackForm } from './FeedbackForm';
import MyFeedbacks from './MyFeedbacks';

export const FeedbackModal = ({ isOpen, onClose, userId }) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-md">
        <div className="bg-dark-card rounded-2xl shadow-2xl border border-dark-border overflow-hidden">
          <div className="p-6">
            <FeedbackForm onClose={onClose} />
          </div>

          <div className="border-t border-dark-border">
            <div className="px-6 pt-4 pb-6 max-h-[40vh] overflow-y-auto">
              <MyFeedbacks userId={userId} />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
