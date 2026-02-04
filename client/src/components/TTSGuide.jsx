export const TTSGuide = ({ userTier = 'free' }) => {
  // Calcular cantidad de voces disponibles
  const tierHierarchy = { free: 0, pro: 1, premium: 2 };
  const userTierLevel = tierHierarchy[userTier] || 0;
  
  const allVoices = [
    // FREE: 2 voces
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', tier: 'free' },
    { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Elena', tier: 'free' },
    // PRO: 11 voces más
    { id: 'dlGxemPxFMTY7iXagmOj', name: 'Sofia', tier: 'pro' },
    { id: 'sDh3eviBhiuHKi0MjTNq', name: 'Carlos', tier: 'pro' },
    { id: 'AxFLn9byyiDbMn5fmyqu', name: 'Valentina', tier: 'pro' },
    { id: 'gD1IexrzCvsXPHUuT0s3', name: 'Diego', tier: 'pro' },
    { id: 'ajOR9IDAaubDK5qtLUqQ', name: 'Lucia', tier: 'pro' },
    { id: 'iDEmt5MnqUotdwCIVplo', name: 'Andrés', tier: 'pro' },
    { id: 'ay4iqk10DLwc8KGSrf2t', name: 'Martina', tier: 'pro' },
    { id: '0cheeVA5B3Cv6DGq65cT', name: 'Roberto', tier: 'pro' },
    { id: 'ClNifCEVq1smkl4M3aTk', name: 'Gabriela', tier: 'pro' },
    { id: 'x5IDPSl4ZUbhosMmVFTk', name: 'Miguel', tier: 'pro' },
    { id: 'o2vbTbO3g4GrKUg7rehy', name: 'Narrador', tier: 'premium' },
    // PREMIUM: 10 voces más
    { id: '9oPKasc15pfAbMr7N6Gs', name: 'Locutora', tier: 'premium' },
    { id: 'gBTPbHzRd0ZmV75Z5Zk4', name: 'Streamer', tier: 'premium' },
    { id: 'wBXNqKUATyqu0RtYt25i', name: 'ASMR', tier: 'premium' },
    { id: 'wJqPPQ618aTW29mptyoc', name: 'Villano', tier: 'premium' },
    { id: 'gJEfHTTiifXEDmO687lC', name: 'Comediante', tier: 'premium' },
    { id: 'wcs09USXSN5Bl7FXohVZ', name: 'Informativo', tier: 'premium' },
    { id: 'sRYzP8TwEiiqAWebdYPJ', name: 'Romántica', tier: 'premium' },
    { id: 'rpNe0HOx7heUulPiOEaG', name: 'Suspense', tier: 'premium' },
    { id: 'YNOujSUmHtgN6anjqXPf', name: 'Cómico', tier: 'premium' },
    { id: 'GDzHdQOi6jjf8zaXhCYD', name: 'Deep', tier: 'premium' }
  ];
  
  const availableVoices = allVoices.filter(voice => {
    const voiceTierLevel = tierHierarchy[voice.tier] || 0;
    return voiceTierLevel <= userTierLevel;
  }).length;

  return (
    <div className="bg-dark-card/50 border border-dark-border rounded-2xl p-6 mb-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-black text-white mb-2">
          ¿Cómo funciona?
        </h3>
        <p className="text-dark-muted text-sm">
          Creá alertas con voces IA de ElevenLabs. Idioma: español.
        </p>
      </div>

      {/* Steps compactos */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
            1
          </div>
          <div>
            <h4 className="font-bold text-primary text-sm">Crear con TTS</h4>
            <p className="text-xs text-dark-muted">Elegí "Alerta con TTS" al crear una alerta</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
            2
          </div>
          <div>
            <h4 className="font-bold text-primary text-sm">Configurar Voz</h4>
            <p className="text-xs text-dark-muted">Seleccioná entre {availableVoices} voces disponibles en tu plan</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-sm flex-shrink-0">
            3
          </div>
          <div>
            <h4 className="font-bold text-primary text-sm">Editar Después</h4>
            <p className="text-xs text-dark-muted">Las alertas con TTS aparecen abajo para editar</p>
          </div>
        </div>
      </div>

      {/* Info adicional */}
      <div className="mt-6 pt-6 border-t border-dark-border">
        <div className="space-y-2 text-xs text-dark-muted">
          <p><strong className="text-primary">{availableVoices} voces</strong> disponibles en tu plan {userTier.toUpperCase()}</p>
          <p><strong className="text-primary">Voces adicionales:</strong> FREE (2) → PRO (13) → PREMIUM (23)</p>
          <p><strong className="text-primary">Idioma</strong> español</p>
          <p><strong className="text-primary">Límite mensual</strong> de caracteres por usuario</p>
          <p><strong className="text-primary">Personalizable</strong> - nombre, mensaje, estabilidad</p>
        </div>
      </div>
    </div>
  );
};
