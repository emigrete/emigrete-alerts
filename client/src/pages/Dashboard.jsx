import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const theme = {
  bg: '#09090b',
  card: '#18181b',
  primary: '#9146FF',
  text: '#e4e4e7',
  textMuted: '#a1a1aa',
  danger: '#ef4444',
  success: '#22c55e',
  border: '#27272a',
  stepBg: '#27272a',
  cafecito: '#0ec2c2',
  paypal: '#0070ba'
};

const styles = {
  container: { padding: '40px 20px', color: theme.text, background: theme.bg, minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, borderBottom: `1px solid ${theme.border}`, paddingBottom: 20 },
  title: { fontSize: '2rem', fontWeight: '800', margin: 0, background: 'linear-gradient(to right, #9146FF, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  card: { background: theme.card, padding: 30, borderRadius: 16, marginBottom: 30, border: `1px solid ${theme.border}`, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' },
  label: { display: 'block', marginBottom: 8, fontWeight: '600', color: theme.textMuted, fontSize: '0.9rem', letterSpacing: '0.5px' },
  select: { width: '100%', padding: '12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: '#000', color: 'white', marginBottom: 20, outline: 'none', transition: 'border 0.2s' },

  fileInputWrapper: { position: 'relative', overflow: 'hidden', display: 'inline-block', width: '100%', marginBottom: 10 },
  fileLabel: (isError) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px',
    border: `2px dashed ${isError ? theme.danger : '#3f3f46'}`,
    borderRadius: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
    color: isError ? theme.danger : theme.textMuted, transition: 'all 0.2s', textAlign: 'center'
  }),

  btn: { background: theme.primary, color: 'white', fontWeight: 'bold', border: 'none', padding: '12px 24px', cursor: 'pointer', borderRadius: 8, transition: 'all 0.2s', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 },
  btnLogout: { background: 'transparent', border: `1px solid ${theme.border}`, color: theme.textMuted, padding: '8px 16px', borderRadius: 6, cursor: 'pointer', transition: '0.2s' },

  donationContainer: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  btnDonation: (color) => ({
    background: color, color: 'white', fontWeight: 'bold', border: 'none',
    padding: '8px 16px', cursor: 'pointer', borderRadius: 50, transition: 'transform 0.2s',
    fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
  }),

  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', marginTop: 10 },
  th: { textAlign: 'left', padding: '10px 15px', color: theme.textMuted, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 'bold' },
  td: { padding: '15px', color: theme.text, verticalAlign: 'middle' },

  codeBox: { background: '#000', padding: '8px 12px', borderRadius: 6, fontFamily: 'monospace', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 15, border: `1px solid ${theme.border}` },
  badge: { fontSize: '0.75rem', padding: '2px 8px', borderRadius: 10, background: theme.primary, color: 'white', marginLeft: 10, fontWeight: 'bold' },
  previewContainer: { marginTop: 15, borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}`, background: '#000' },

  stepContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 },
  stepCard: { background: theme.stepBg, padding: 20, borderRadius: 12, border: `1px solid ${theme.border}`, position: 'relative' },
  stepNumber: { position: 'absolute', top: -10, left: -10, width: 30, height: 30, background: theme.primary, color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: `2px solid ${theme.bg}` }
};

export default function Dashboard() {
  const [userId, setUserId] = useState(localStorage.getItem('twitchUserId'));
  const [username, setUsername] = useState(localStorage.getItem('twitchUsername'));
  const [rewards, setRewards] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [selectedReward, setSelectedReward] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');

  // ✅ Login URL ahora lo maneja el backend
  const loginUrl = `${API_URL}/auth/twitch`;

  const overlayBaseUrl = `${window.location.protocol}//${window.location.host}/overlay?user=${userId}`;

  useEffect(() => {
    if (userId) {
      fetchRewards();
      fetchTriggers();
    }
  }, [userId]);

  const fetchRewards = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/twitch/rewards?userId=${userId}`);
      setRewards(res.data);
    } catch (err) {
      console.error('Error cargando recompensas', err);
    }
  };

  const fetchTriggers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/triggers?userId=${userId}`);
      setTriggers(res.data);
    } catch (err) {
      console.error('Error cargando alertas', err);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError('');
    setPreviewUrl(null);

    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setFileError(`⚠️ Muy pesado (${(selected.size / 1024 / 1024).toFixed(2)} MB). Máximo 5MB.`);
        setFile(null);
        toast.error('El archivo excede el límite de 5MB');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedReward) {
      toast.warning('Faltan datos: Elegí recompensa y video.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Subiendo video a la nube...');

    const formData = new FormData();
    formData.append('twitchRewardId', selectedReward);
    formData.append('video', file);
    formData.append('userId', userId);

    try {
      await axios.post(`${API_URL}/upload`, formData);
      toast.success('¡Alerta guardada exitosamente!', { id: toastId });
      setFile(null);
      setPreviewUrl(null);
      fetchTriggers();
    } catch (error) {
      toast.error('Error al subir: ' + error.message, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta alerta?')) return;

    const toastId = toast.loading('Eliminando...');
    try {
      await axios.delete(`${API_URL}/api/triggers/${id}`);
      fetchTriggers();
      toast.success('Alerta eliminada', { id: toastId });
    } catch {
      toast.error('Error al eliminar', { id: toastId });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copiado al portapapeles 📋');
  };

  const logout = () => {
    localStorage.removeItem('twitchUserId');
    localStorage.removeItem('twitchUsername');
    setUserId(null);
    setUsername(null);
  };

  if (!userId) {
    return (
      <div style={{ ...styles.container, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ ...styles.card, textAlign: 'center', maxWidth: 450 }}>
          <h1 style={{ ...styles.title, marginBottom: 10 }}>Emigrete Alerts 🚀</h1>
          <p style={{ color: theme.textMuted, lineHeight: '1.6' }}>
            La plataforma oficial de alertas de Emigrete. Conectá tu Twitch y mejorá tu stream en segundos.
          </p>
          <div style={{ marginTop: 30 }}>
            <a href={loginUrl} style={{ textDecoration: 'none' }}>
              <button style={{ ...styles.btn, width: '100%', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>👾</span> Conectar con Twitch
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Toaster position="top-right" theme="dark" richColors />

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Panel de Control</h1>
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.success }} />
            <span style={{ color: theme.textMuted, fontSize: '0.85rem', fontFamily: 'monospace' }}>
              Usuario: {username ? `${username} (${userId})` : userId}
            </span>
          </div>
        </div>

        <button onClick={logout} style={styles.btnLogout}>Cerrar Sesión</button>
      </header>

      <div style={styles.stepContainer}>
        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>1</div>
          <h4 style={{ margin: '10px 0', color: theme.text }}>Creá el Canje</h4>
          <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>Andá a tu panel de Twitch y creá una recompensa nueva.</p>
        </div>
        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>2</div>
          <h4 style={{ margin: '10px 0', color: theme.text }}>Vinculá el Video</h4>
          <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>Elegí la recompensa abajo y subí tu archivo de video.</p>
        </div>
        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>3</div>
          <h4 style={{ margin: '10px 0', color: theme.text }}>Configurá OBS</h4>
          <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>Copiá el "Link para OBS" y ponelo como Fuente de Navegador.</p>
        </div>
        <div style={styles.stepCard}>
          <div style={styles.stepNumber}>4</div>
          <h4 style={{ margin: '10px 0', color: theme.text }}>¡A Disfrutar!</h4>
          <p style={{ fontSize: '0.85rem', color: theme.textMuted }}>Probá canjearlo en el chat. ¡Funciona al instante!</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 30 }}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, marginBottom: 25, display: 'flex', alignItems: 'center', gap: 10 }}>
            ⚡ Nueva Alerta
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30 }}>
            <div>
              <label style={styles.label}>1. Recompensa de Twitch</label>
              <select style={styles.select} value={selectedReward} onChange={e => setSelectedReward(e.target.value)}>
                <option value="">-- Seleccionar Canje --</option>
                {rewards.map(r => (
                  <option key={r.id} value={r.id}>{r.title}</option>
                ))}
              </select>

              <label style={styles.label}>2. Archivo Multimedia</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  id="video-upload"
                  style={{ display: 'none' }}
                  accept="video/mp4,video/webm"
                  onChange={handleFileChange}
                />
                <label htmlFor="video-upload" style={styles.fileLabel(!!fileError)}>
                  <span style={{ fontSize: '2rem', marginBottom: 10 }}>
                    {file ? '✅' : '📂'}
                  </span>
                  {file ? (
                    <span style={{ color: theme.text, fontWeight: 'bold' }}>{file.name}</span>
                  ) : (
                    <span>
                      Arrastrá o clickeá para subir video<br />
                      <small style={{ color: theme.textMuted }}>Max 5MB (.mp4, .webm)</small>
                    </span>
                  )}
                </label>
              </div>

              <div style={{ textAlign: 'right', marginTop: 20 }}>
                <button
                  onClick={handleUpload}
                  style={{ ...styles.btn, width: '100%', justifyContent: 'center', opacity: uploading || fileError ? 0.6 : 1, cursor: uploading ? 'wait' : 'pointer' }}
                  disabled={uploading || !!fileError}
                >
                  {uploading ? 'Subiendo...' : 'Guardar Alerta'}
                </button>
              </div>
            </div>

            <div>
              <label style={styles.label}>Vista Previa</label>
              <div style={{ ...styles.previewContainer, height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                {previewUrl ? (
                  <video src={previewUrl} controls autoPlay loop style={{ maxWidth: '100%', maxHeight: '100%' }} />
                ) : (
                  <div style={{ color: '#333', fontStyle: 'italic' }}>Sin video seleccionado</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Alertas Activas</h3>
            <span style={styles.badge}>{triggers.length} configuradas</span>
          </div>

          {triggers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50, color: theme.textMuted, border: '2px dashed #3f3f46', borderRadius: 12 }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: 10 }}>📭</span>
              No tenés alertas activas. ¡Configurá la primera arriba!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Recompensa</th>
                    <th style={styles.th}>Link para OBS</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {triggers.map(t => {
                    const specificLink = `${overlayBaseUrl}&reward=${t.twitchRewardId}`;
                    const rewardTitle = rewards.find(r => r.id === t.twitchRewardId)?.title || 'Desconocido';

                    return (
                      <tr key={t._id}>
                        <td style={styles.td}>
                          <strong style={{ color: theme.primary, fontSize: '1rem' }}>{rewardTitle}</strong>
                          <div style={{ fontSize: '0.75rem', color: theme.textMuted, marginTop: 4, fontFamily: 'monospace' }}>
                            {t.twitchRewardId.substring(0, 15)}...
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.codeBox}>
                            <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 250 }}>
                              {specificLink}
                            </span>
                            <button
                              onClick={() => copyToClipboard(specificLink)}
                              style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer' }}
                              title="Copiar Link"
                            >
                              <span style={{ fontSize: '1.2rem' }}>📋</span>
                            </button>
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                            <a href={t.videoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                              <button style={{ ...styles.btnLogout, border: `1px solid ${theme.border}` }}>👁️</button>
                            </a>

                            <button
                              onClick={() => handleDelete(t._id)}
                              style={{ ...styles.btnLogout, borderColor: theme.danger, color: theme.danger }}
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
          )}
        </div>

        <div style={{ ...styles.card, border: '1px solid #3f3f46', background: 'linear-gradient(45deg, #18181b 0%, #1c1c21 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ maxWidth: '500px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>👨‍💻 Proyecto Indie & Soporte</h4>
              <p style={{ color: theme.textMuted, fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
                <strong>Emigrete Alerts</strong> es mantenida por un solo desarrollador.
                El uso es 100% gratuito, pero si te sirve para tus streams, tu ayuda mantiene los servidores encendidos.
              </p>
            </div>

            <div style={styles.donationContainer}>
              <a href="https://cafecito.app/emigrete" target="_blank" rel="noopener noreferrer" style={styles.btnDonation(theme.cafecito)}>
                <span>☕</span> Cafecito 🇦🇷
              </a>

              <a href="https://www.paypal.me/teodorow" target="_blank" rel="noopener noreferrer" style={styles.btnDonation(theme.paypal)}>
                <span>🌍</span> PayPal
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
