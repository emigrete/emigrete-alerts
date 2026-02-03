import { useState } from 'react';
import { FILE_CONFIG } from '../constants/config';
import { RewardCreator } from './RewardCreator';

const ELEVENLABS_VOICES = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (Masculino, profundo)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Femenino, suave)' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Masculino, cálido)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (Masculino, autoritario)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli (Femenino, juvenil)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (Femenino, británico)' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (Masculino, británico)' },
];

export const FileUploadSection = ({ 
  file, 
  previewUrl, 
  selectedReward, 
  rewards, 
  uploading, 
  onFileChange, 
  onUpload, 
  fileError, 
  onRewardChange,
  userId,
  onRewardCreated,
  isDemo,
  triggers,
  ttsConfig,
  onTtsConfigChange
}) => {
  const [showRewardCreator, setShowRewardCreator] = useState(false);
  const [mediaType, setMediaType] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      // Detectar tipo de archivo
      const type = selected.type.includes('video') ? 'video' 
                 : selected.type.includes('audio') ? 'audio'
                 : selected.type.includes('gif') || selected.type.includes('image') ? 'gif'
                 : 'video';
      setMediaType(type);
    }
    onFileChange(e);
  };

  const getPreviewContent = () => {
    if (!previewUrl) {
      return <div className="text-gray-600 italic">Sin archivo seleccionado</div>;
    }

    switch (mediaType) {
      case 'video':
        return <video src={previewUrl} controls autoPlay loop className="max-w-full max-h-full" />;
      case 'audio':
        return (
          <div className="flex flex-col items-center gap-4 w-full">
            <span className="text-6xl">🎵</span>
            <audio src={previewUrl} controls className="w-full" />
            <p className="text-sm text-dark-muted">{file?.name}</p>
          </div>
        );
      case 'gif':
        return <img src={previewUrl} alt="Preview" className="max-w-full max-h-full" />;
      default:
        return <div className="text-gray-600 italic">Sin archivo seleccionado</div>;
    }
  };

  const getAcceptTypes = () => {
    return 'video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg,image/gif';
  };

  const getMediaTypeLabel = () => {
    if (!mediaType) return 'Archivo Multimedia';
    return {
      video: 'Video',
      audio: 'Audio',
      gif: 'GIF'
    }[mediaType];
  };

  // Si no hay recompensas, mostrar pantalla de inicio
  if (rewards.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="mb-8">
            <span className="text-7xl block mb-4">🎬</span>
            <h2 className="text-2xl font-bold text-dark-text mb-2">¡Crea tu primera alerta!</h2>
            <p className="text-dark-muted mb-8">Conecta tus videos favoritos con tus canjes de Twitch</p>
          </div>

          <button
            onClick={() => setShowRewardCreator(true)}
            className="inline-flex flex-col items-center gap-3 px-8 py-6 bg-gradient-to-br from-primary to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all text-lg"
          >
            <span className="text-4xl">+</span>
            Crear Nueva Alerta
          </button>

          <div className="mt-12 text-left max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-dark-text mb-4">¿Cómo funciona?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">1️⃣</div>
                <p className="text-sm text-dark-muted">Crea una nueva recompensa con tu nombre y costo</p>
              </div>
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">2️⃣</div>
                <p className="text-sm text-dark-muted">Sube tu video, audio o GIF</p>
              </div>
              <div className="p-4 bg-dark-secondary rounded-lg border border-dark-border">
                <div className="text-3xl mb-2">3️⃣</div>
                <p className="text-sm text-dark-muted">¡Usa el link en OBS y listo!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reward Creator Modal */}
        {showRewardCreator && (
          <RewardCreator
            userId={userId}
            isDemo={isDemo}
            onRewardCreated={(reward) => {
              setShowRewardCreator(false);
              onRewardCreated(reward);
            }}
            onCancel={() => setShowRewardCreator(false)}
          />
        )}
      </>
    );
  }

  // Si hay recompensas, mostrar el formulario normal
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload Form */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            1. Recompensa de Twitch
          </label>
          <div className="flex gap-2 mb-5">
            <select 
              className="flex-1 p-3 rounded-lg border-2 border-dark-border bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50 font-semibold"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
              value={selectedReward} 
              onChange={(e) => onRewardChange(e.target.value)}
            >
              <option value="">-- Seleccionar Canje --</option>
              {rewards.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <button
              onClick={() => setShowRewardCreator(true)}
              title="Crear nueva recompensa"
              className="px-4 py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition text-sm whitespace-nowrap"
            >
              + Nueva
            </button>
          </div>

          {/* Info si ya hay alertas creadas */}
          {triggers && triggers.length > 0 && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary font-semibold mb-2">💡 Tip:</p>
              <p className="text-sm text-dark-muted">
                Ya tienes <strong>{triggers.length} alerta{triggers.length > 1 ? 's' : ''} creada{triggers.length > 1 ? 's' : ''}</strong>. Puedes agregar más medias a una recompensa existente o crear una nueva.
              </p>
            </div>
          )}

          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            2. {getMediaTypeLabel()}
          </label>
          
          <div className="relative overflow-hidden inline-block w-full mb-2">
            <input
              type="file"
              id="video-upload"
              className="hidden"
              accept={getAcceptTypes()}
              onChange={handleFileChange}
            />
            <label 
              htmlFor="video-upload" 
              className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                fileError 
                  ? 'border-red-500 bg-red-500/5 text-red-500' 
                  : 'border-dark-secondary bg-white/2 text-dark-muted hover:border-primary'
              }`}
            >
              <span className="text-4xl mb-3">
                {file ? '✅' : '📂'}
              </span>
              {file ? (
                <span className="text-dark-text font-bold text-center">{file.name}</span>
              ) : (
                <div className="text-center">
                  <span className="block">Arrastra o clickea para subir</span>
                  <small className="text-dark-muted">Video (.mp4, .webm), Audio (.mp3, .wav, .ogg) o GIF</small>
                </div>
              )}
            </label>
          </div>

          {fileError && <p className="text-red-500 text-sm mb-4">{fileError}</p>}

          {/* Sección TTS */}
          <div className="mt-6 pt-6 border-t border-dark-border">
            <label className="block mb-3 font-semibold text-dark-muted text-sm uppercase tracking-wider">
              3. Tipo de Alerta
            </label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => onTtsConfigChange({ ...ttsConfig, enabled: false })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !ttsConfig?.enabled
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dark-border bg-dark-secondary/30 text-dark-muted hover:border-primary/50'
                }`}
              >
                <div className="text-2xl mb-2">📹</div>
                <div className="font-bold text-sm">Alerta Normal</div>
                <div className="text-xs mt-1 opacity-70">Solo multimedia</div>
              </button>
              <button
                type="button"
                onClick={() => onTtsConfigChange({ ...ttsConfig, enabled: true })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  ttsConfig?.enabled
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dark-border bg-dark-secondary/30 text-dark-muted hover:border-primary/50'
                }`}
              >
                <div className="text-2xl mb-2">🎤</div>
                <div className="font-bold text-sm">Alerta con TTS</div>
                <div className="text-xs mt-1 opacity-70">Multimedia + Voz IA</div>
              </button>
            </div>

            {ttsConfig?.enabled && (
              <div className="bg-dark-secondary/50 border border-primary/30 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
                    Voz
                  </label>
                  <select
                    value={ttsConfig?.voiceId || 'pNInz6obpgDQGcFmaJgB'}
                    onChange={(e) => onTtsConfigChange({ ...ttsConfig, voiceId: e.target.value })}
                    className="w-full p-2 rounded-lg border-2 border-primary/30 bg-gradient-to-br from-dark-card to-dark-secondary text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none cursor-pointer hover:border-primary font-semibold"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239146FF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 0.5rem center',
                      backgroundSize: '1.25em 1.25em',
                      paddingRight: '2rem'
                    }}
                  >
                    {ELEVENLABS_VOICES.map(voice => (
                      <option key={voice.id} value={voice.id}>{voice.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="read-username"
                    checked={ttsConfig?.readUsername !== false}
                    onChange={(e) => onTtsConfigChange({ ...ttsConfig, readUsername: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="read-username" className="text-dark-text text-xs">
                    Decir nombre del usuario
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="use-viewer-message"
                    checked={ttsConfig?.useViewerMessage !== false}
                    onChange={(e) => onTtsConfigChange({ ...ttsConfig, useViewerMessage: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="use-viewer-message" className="text-dark-text text-xs">
                    Leer mensaje del viewer
                  </label>
                </div>

                {!ttsConfig?.useViewerMessage && (
                  <div>
                    <label className="block mb-2 font-semibold text-dark-muted text-xs uppercase tracking-wider">
                      Texto personalizado
                    </label>
                    <textarea
                      value={ttsConfig?.text || ''}
                      onChange={(e) => onTtsConfigChange({ ...ttsConfig, text: e.target.value })}
                      placeholder="Escribe lo que el TTS dirá..."
                      maxLength={300}
                      className="w-full p-2 rounded-lg border border-dark-border bg-black text-white outline-none focus:border-primary transition text-xs h-16 resize-none"
                    />
                    <small className="text-dark-muted">{(ttsConfig?.text || '').length}/300</small>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-right mt-5">
            <button
              onClick={onUpload}
              disabled={uploading || !!fileError || !selectedReward || !file}
              className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? 'Subiendo...' : 'Guardar Alerta'}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <label className="block mb-2 font-semibold text-dark-muted text-sm uppercase tracking-wider">
            Vista Previa
          </label>
          <div className="rounded-xl overflow-hidden border border-dark-border bg-black h-64 flex items-center justify-center">
            {getPreviewContent()}
          </div>
        </div>
      </div>

      {/* Reward Creator Modal */}
      {showRewardCreator && (
        <RewardCreator
          userId={userId}
          isDemo={isDemo}
          onRewardCreated={(reward) => {
            setShowRewardCreator(false);
            onRewardCreated(reward);
          }}
          onCancel={() => setShowRewardCreator(false)}
        />
      )}
    </>
  );
};
