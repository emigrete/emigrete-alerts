export const TTSGuide = () => {
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
            <p className="text-xs text-dark-muted">Seleccioná entre 2 voces disponibles (más próximamente)</p>
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
          <p><strong className="text-primary">2 voces</strong> naturales disponibles (más en camino)</p>
          <p><strong className="text-primary">Idioma</strong> español</p>
          <p><strong className="text-primary">Límite mensual</strong> de caracteres por usuario</p>
          <p><strong className="text-primary">Personalizable</strong> - nombre, mensaje, estabilidad</p>
        </div>
      </div>
    </div>
  );
};
