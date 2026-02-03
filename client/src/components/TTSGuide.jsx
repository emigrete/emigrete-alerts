export const TTSGuide = () => {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-pink-500/5 to-dark-secondary border border-primary/30 rounded-3xl p-8 mb-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-black text-white mb-2">
            Text-to-Speech con IA
          </h2>
          <p className="text-dark-muted text-sm mb-4">Voces naturales de ElevenLabs</p>
        </div>
        <p className="text-dark-muted mb-6">
          Transforma tus alertas en experiencias auditivas épicas. Cada viewer escuchará una voz natural diciendo su nombre y mensaje personalizado.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Step 1 */}
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6 hover:border-primary/50 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-lg">
              1
            </div>
            <h3 className="font-bold text-primary">Selecciona Alerta</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Elige cualquier recompensa de la lista abajo
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6 hover:border-primary/50 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-lg">
              2
            </div>
            <h3 className="font-bold text-primary">Presiona el botón</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Dale en la columna Acciones para activar TTS
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6 hover:border-primary/50 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-lg">
              3
            </div>
            <h3 className="font-bold text-primary">Configura</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Elige voz, opciones y probá
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6 hover:border-primary/50 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-lg">
              4
            </div>
            <h3 className="font-bold text-primary">Listo</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Guarda y disfruta de alertas con voz IA
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6">
          <h4 className="font-bold text-primary mb-4">Voces Disponibles</h4>
          <div className="space-y-2 text-sm text-dark-muted">
            <p><strong>Adam</strong> - Voz masculina profunda</p>
            <p><strong>Sarah</strong> - Voz femenina suave</p>
            <p><strong>Antoni</strong> - Voz masculina cálida</p>
            <p><strong>Más opciones</strong> - 4 voces adicionales</p>
          </div>
        </div>

        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6">
          <h4 className="font-bold text-primary mb-4">Opciones Inteligentes</h4>
          <div className="space-y-2 text-sm text-dark-muted">
            <p>Leer nombre del viewer</p>
            <p>Leer mensaje personalizado</p>
            <p>Ajustar estabilidad y expresión</p>
            <p>Máx. 300 caracteres por mensaje</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-primary/10 to-pink-500/10 border-l-4 border-primary rounded-lg p-4">
        <p className="text-sm text-primary font-semibold mb-1">
          Feature Disponible para Todos
        </p>
        <p className="text-xs text-dark-muted">
          Cada usuario tiene un límite mensual de caracteres para mantener la calidad del servicio. Úsalo con inteligencia y disfrutá de alertas con voz IA.
        </p>
      </div>
    </section>
  );
};
