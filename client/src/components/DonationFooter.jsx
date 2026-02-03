import { useState } from 'react';
import { COLORS } from '../constants/config';
import { FeedbackModal } from './FeedbackModal';

export const DonationFooter = () => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-dark-secondary via-dark-card to-dark-secondary border-2 border-primary/30 rounded-2xl p-8 lg:p-10 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 flex-wrap">
          <div className="max-w-xl">
            <h4 className="m-0 mb-3 text-2xl font-bold text-dark-text">
              Hecho con amor
            </h4>
            <p className="text-dark-muted text-base leading-relaxed m-0">
              <strong className="text-dark-text">Welyczko Alerts</strong> es una plataforma pensada para streamers que quieren que sus alertas sean inolvidables.
              Es totalmente gratis. Si te sirve, tu apoyo nos ayuda a mejorar cada vez más.
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setShowFeedback(true)}
              className="bg-gradient-to-r from-primary/20 to-pink-500/20 border-2 border-primary/40 text-white font-bold px-6 py-3 rounded-xl transition-all hover:border-primary hover:shadow-lg flex items-center gap-2 text-base"
            >
              Enviar comentario
            </button>
            
            <a 
              href="https://cafecito.app/welyczko" 
              target="_blank" 
              rel="noopener noreferrer"
              className="no-underline"
            >
              <button 
                className="text-white font-bold border-none px-6 py-3 rounded-xl transition-all hover:scale-110 hover:shadow-xl flex items-center gap-2 text-base shadow-lg"
                style={{ background: '#0ec2c2' }}
              >
                Apoyar
              </button>
            </a>

            <a 
              href="https://www.paypal.me/welyczko" 
              target="_blank" 
              rel="noopener noreferrer"
              className="no-underline"
            >
              <button 
                className="text-white font-bold border-none px-6 py-3 rounded-xl transition-all hover:scale-110 hover:shadow-xl flex items-center gap-2 text-base shadow-lg"
                style={{ background: '#0070ba' }}
              >
                PayPal
              </button>
            </a>
          </div>
        </div>
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </>
  );
};
