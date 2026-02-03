import { useState } from 'react';
import { TTSGuide } from './TTSGuide';
import { TTSConfig } from './TTSConfig';

export const TTSManager = ({ triggers, rewards, userId, onRefresh }) => {
  const [selectedTriggerId, setSelectedTriggerId] = useState(null);

  const triggersWithTTS = triggers.filter(t => t.ttsConfig?.enabled);
  const selectedTrigger = triggers.find(t => t._id === selectedTriggerId);

  return (
    <section className="bg-gradient-to-br from-primary/10 via-pink-500/5 to-dark-secondary border border-primary/30 rounded-3xl p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white mb-2">
          Gestión de Text-to-Speech
        </h2>
        <p className="text-dark-muted">
          Administra las configuraciones de voz IA para tus alertas
        </p>
      </div>

      {/* Guía */}
      <TTSGuide />

      {/* Lista de alertas con TTS */}
      {triggersWithTTS.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Alertas con TTS Activo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {triggersWithTTS.map(trigger => {
              const reward = rewards.find(r => r.id === trigger.twitchRewardId);
              return (
                <div
                  key={trigger._id}
                  className="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedTriggerId(trigger._id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-primary text-sm mb-1">
                        {reward?.title || 'Recompensa'}
                      </h4>
                      <p className="text-xs text-dark-muted">
                        Voz: {ELEVENLABS_VOICES.find(v => v.id === trigger.ttsConfig.voiceId)?.name || 'Desconocida'}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-semibold">
                      Activo
                    </span>
                  </div>
                  <div className="text-xs text-dark-muted space-y-1">
                    {trigger.ttsConfig.readUsername && (
                      <p>✓ Leer nombre del usuario</p>
                    )}
                    {trigger.ttsConfig.useViewerMessage && (
                      <p>✓ Leer mensaje del viewer</p>
                    )}
                  </div>
                  <button className="mt-3 w-full py-2 px-4 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/20 transition-all group-hover:border-primary">
                    Editar Configuración
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center py-12 border-2 border-dashed border-dark-border rounded-xl">
          <p className="text-dark-muted text-lg">No tienes alertas con TTS activo todavía</p>
          <p className="text-dark-muted text-sm mt-2">Crea una alerta con TTS desde el formulario de arriba</p>
        </div>
      )}

      {/* Modal de configuración */}
      {selectedTriggerId && selectedTrigger && (
        <TTSConfig
          triggerId={selectedTriggerId}
          initialConfig={selectedTrigger.ttsConfig}
          userId={userId}
          onClose={() => setSelectedTriggerId(null)}
          onUpdate={() => {
            setSelectedTriggerId(null);
            onRefresh();
          }}
        />
      )}
    </section>
  );
};

const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculino, profundo)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Femenino, suave)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Masculino, cálido)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Masculino, autoritario)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Femenino, juvenil)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (Femenino, británico)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Masculino, británico)' },
];
