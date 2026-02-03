import { STEP_GUIDES } from '../constants/config';

// Pasos cortitos para no marear al usuario
export const StepGuide = () => (
  <div className="mb-12">
    <h2 className="text-2xl font-bold mb-6 text-dark-text">
      Cómo empezar
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {STEP_GUIDES.map((step) => (
        <div 
          key={step.id}
          className="bg-dark-card p-5 rounded-2xl border border-dark-border hover:border-primary transition relative group"
        >
          <div 
            className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-primary to-pink-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-dark-bg shadow-lg group-hover:scale-110 transition-transform"
          >
            {step.id}
          </div>
          <h4 className="mt-3 mb-2 text-dark-text font-bold text-base">
            {step.title}
          </h4>
          <p className="text-sm text-dark-muted leading-relaxed">
            {step.description}
          </p>
        </div>
      ))}
    </div>
  </div>
);
