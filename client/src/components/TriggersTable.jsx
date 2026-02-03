import { copyToClipboard } from '../utils/helpers';

export const TriggersTable = ({ triggers, rewards, userId, onDelete, onRefresh }) => {
  const overlayBaseUrl = `${window.location.protocol}//${window.location.host}/overlay?user=${userId}`;

  const getMediaIcon = (type) => {
    switch(type) {
      case 'video': return '📹';
      case 'audio': return '🎵';
      case 'gif': return '🎞️';
      default: return '📄';
    }
  };

  if (triggers.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-dark-secondary rounded-xl text-dark-muted">
        <span className="text-4xl block mb-3">📭</span>
        No tenes alertas activas todavia. ¡Configura la primera arriba!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Recompensa</th>
            <th className="text-left px-4 py-3 text-dark-muted text-xs font-bold uppercase tracking-widest">Medias</th>
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
  );
};
