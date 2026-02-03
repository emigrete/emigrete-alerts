export const TTSGuide = () => {
  return (
    <section className="bg-gradient-to-br from-primary/10 via-pink-500/5 to-dark-secondary border border-primary/30 rounded-3xl p-8 mb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-primary to-pink-500 rounded-xl">
            <span className="text-3xl block">🎤</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Text-to-Speech Premium
            </h2>
            <p className="text-dark-muted text-sm">Voces IA naturales con ElevenLabs</p>
          </div>
        </div>
        <p className="text-dark-muted mb-6">
          Transforma tus alertas en experiencias auditivas inolvidables. Cada canjeador escuchará una voz natural diciendo su nombre y mensaje personalizado.
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
            <h3 className="font-bold text-primary">Click 🎤</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Presiona el botón "Activar TTS" en la columna Acciones
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
            Elige voz, opciones y prueba con el botón 🔊
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6 hover:border-primary/50 transition">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center font-black text-white text-lg">
              4
            </div>
            <h3 className="font-bold text-primary">¡Listo!</h3>
          </div>
          <p className="text-xs text-dark-muted">
            Guarda y disfruta de alertas con voz IA
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6">
          <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
            <span>✨</span> Voces Disponibles
          </h4>
          <div className="space-y-2 text-sm text-dark-muted">
            <p>🎙️ <strong>Adam</strong> - Voz masculina profunda</p>
            <p>🎙️ <strong>Sarah</strong> - Voz femenina suave</p>
            <p>🎙️ <strong>Antoni</strong> - Voz masculina cálida</p>
            <p>🎙️ <strong>+4 voces más</strong> - Elige tu favorita</p>
          </div>
        </div>

        <div className="bg-dark-secondary/50 border border-dark-border rounded-2xl p-6">
          <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
            <span>⚙️</span> Opciones Inteligentes
          </h4>
          <div className="space-y-2 text-sm text-dark-muted">
            <p>✅ Leer <strong>nombre del canjeador</strong></p>
            <p>✅ Leer <strong>mensaje personalizado</strong></p>
            <p>✅ Ajustar <strong>estabilidad y expresión</strong></p>
            <p>✅ <strong>Máx. 300 caracteres</strong> (seguro de costos)</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-l-4 border-green-500 rounded-lg p-4">
        <p className="text-sm text-green-400 font-semibold mb-1">
          💡 Plan Gratuito: 10,000 caracteres/mes (30+ TTS)
        </p>
        <p className="text-xs text-dark-muted">
          ElevenLabs ofrece un plan gratuito más que suficiente. Si necesitas más, upgrade a $5/mes.
        </p>
      </div>
    </section>
  );
};
