import { useState } from 'react';
import { copyToClipboard } from '../utils/helpers';
import { TTSConfig } from './TTSConfig';

export const TriggersTable = ({ triggers, rewards, userId, onDelete, onRefresh }) => {
  const [ttsModalTriggerId, setTtsModalTriggerId] = useState(null);
  const overlayBaseUrl = `${window.location.protocol}//${window.location.host}/overlay?user=${userId}`;

  const getMediaIcon = (type) => {
    switch(type) {
      case 'video': return '[Video]';
      case 'audio': return '[Audio]';
      case 'gif': return '[GIF]';
      default: return '[Medio]';
    }
  };

  const selectedTrigger = triggers.find(t => t._id === ttsModalTriggerId);

  if (triggers.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-dark-secondary rounded-xl text-dark-muted">
        <p className="text-lg font-semibold">No tenes alertas activas todavía</p>
        <p className="text-sm mt-2">¡Configura la primera arriba!</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Recompensa</th>
              <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Medias</th>
              <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">TTS</th>
              <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Link para OBS</th>
              <th className="text-right px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="[&_tr]:border-b [&_tr]:border-dark-border">
            {triggers.map(t => {
              const specificLink = `${overlayBaseUrl}&reward=${t.twitchRewardId}`;
              const rewardTitle = rewards.find(r => r.id === t.twitchRewardId)?.title || 'Desconocido';

              return (
                <tr key={t._id} className="hover:bg-dark-secondary/30 transition">
                  <td className="px-4 py-4">
                    <strong className="text-primary text-base">{rewardTitle}</strong>
                    <div className="text-xs text-dark-muted mt-1 font-mono">
                      {t.twitchRewardId.substring(0, 15)}...
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {t.medias && t.medias.length > 0 ? (
                        t.medias.map((media, idx) => (
                          <div
                            key={idx}
                            title={media.type}
                            className="px-2 py-1 bg-dark-secondary rounded text-sm flex items-center gap-1"
                          >
                            <span>{getMediaIcon(media.type)}</span>
                            <span className="text-xs text-dark-muted capitalize">{media.type}</span>
                          </div>
                        ))
                      ) : t.videoUrl ? (
                        <div className="px-2 py-1 bg-dark-secondary rounded text-sm flex items-center gap-1">
                          <span>📹</span>
                          <span className="text-xs text-dark-muted">video</span>
                        </div>
                      ) : (
                        <span className="text-xs text-dark-muted">Sin medias</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {t.ttsConfig?.enabled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        <span className="text-xs text-green-500 font-semibold">Activo</span>
                      </div>
                    ) : (
                      <span className="text-xs text-dark-muted">Desactivado</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="bg-black p-3 rounded-lg border border-dark-border flex items-center justify-between gap-3 font-mono text-sm text-green-400">
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
                        {specificLink}
                      </span>
                      <button
                        onClick={() => copyToClipboard(specificLink)}
                        className="bg-none border-none text-dark-muted hover:text-primary cursor-pointer text-lg transition"
                        title="Copiar Link"
                      >
                        📋
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setTtsModalTriggerId(t._id)}
                        className={`font-black py-2 px-4 rounded-xl transition-all ${
                          t.ttsConfig?.enabled 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-2xl scale-105'
                            : 'bg-gradient-to-r from-primary to-pink-500 text-white hover:shadow-xl'
                        }`}
                        title="Configurar TTS"
                      >
                        {t.ttsConfig?.enabled ? '🎤 TTS ACTIVO' : '🎤 Activar TTS'}
                      </button>
                      {t.videoUrl && (
                        <a href={t.videoUrl} target="_blank" rel="noreferrer">
                          <button className="bg-transparent border border-dark-border text-dark-muted px-3 py-2 rounded-lg hover:border-primary hover:text-primary transition" title="Ver video">
                            👁️
                          </button>
                        </a>
                      )}
                      <button
                        onClick={() => onDelete(t._id)}
                        className="bg-transparent border border-red-500 text-red-500 px-3 py-2 rounded-lg hover:bg-red-500/10 transition"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* TTS Config Modal */}
      {ttsModalTriggerId && selectedTrigger && (
        <TTSConfig
          triggerId={ttsModalTriggerId}
          initialConfig={selectedTrigger.ttsConfig}
          userId={userId}
          onClose={() => setTtsModalTriggerId(null)}
          onUpdate={() => {
            setTtsModalTriggerId(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
};
