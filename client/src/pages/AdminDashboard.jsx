import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigate } from 'react-router-dom';
import { AppFooter } from '../components/AppFooter';
import { FeedbackResponseForm } from '../components/FeedbackResponseForm';

export const AdminDashboard = () => {
  const navigate = useNavigate();

  // Auth
  const [userId] = useState(localStorage.getItem('twitchUserId'));
  const [username] = useState(localStorage.getItem('twitchUsername'));

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  // UI states
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all'); // all | free | pro | premium

  // Global stats
  const [stats, setStats] = useState({
    totalAlerts: 0,
    totalTTS: 0,
    totalStorage: 0,
    totalBandwidth: 0,
    totalTriggers: 0
  });

  useEffect(() => {
    if (!userId) {
      setError('No estás autenticado');
      setIsAdmin(false);
      setLoadingUsers(false);
      setLoadingFeedbacks(false);
      return;
    }

    fetchUsers();
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const notifySuccess = (msg) => {
    setSuccessMessage(msg);
    window.clearTimeout(notifySuccess._t);
    notifySuccess._t = window.setTimeout(() => setSuccessMessage(null), 5000);
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        params: { adminId: userId }
      });

      const usersData = response.data.users || [];
      setUsers(usersData);

      // Totals
      const totalStats = usersData.reduce(
        (acc, u) => ({
          totalAlerts: acc.totalAlerts + (u?.alerts?.current || 0),
          totalTTS: acc.totalTTS + (u?.tts?.current || 0),
          totalStorage: acc.totalStorage + (u?.storage?.current || 0),
          totalBandwidth: acc.totalBandwidth + (u?.bandwidth?.current || 0),
          totalTriggers: acc.totalTriggers + (u?.triggers || 0)
        }),
        { totalAlerts: 0, totalTTS: 0, totalStorage: 0, totalBandwidth: 0, totalTriggers: 0 }
      );

      setStats(totalStats);
      setIsAdmin(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setError('No tenés permisos para acceder a este panel de administración');
      } else {
        setError(err.response?.data?.error || 'Error al cargar usuarios');
      }
      setIsAdmin(false);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoadingFeedbacks(true);

      // Si tu backend NO requiere adminId, podés sacar params
      const res = await axios.get(`${API_URL}/api/admin/feedback`, {
        params: { adminId: userId }
      });

      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error('Error cargando feedback:', err);
      // No tiramos abajo el admin por feedback
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // ---------- helpers ----------
  const formatBytes = (bytes) => {
    const b = Number(bytes || 0);
    if (!b) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(b) / Math.log(k)), sizes.length - 1);
    const value = b / Math.pow(k, i);
    return `${Math.round(value * 10) / 10} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium':
        return 'from-purple-500 to-pink-500';
      case 'pro':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getUsageColor = (percentage) => {
    const p = Number(percentage || 0);
    if (p > 80) return 'text-red-500';
    if (p > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const safePercent = (p) => {
    const n = Number(p);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  // ---------- actions: users ----------
  const handleChangeTier = async (targetUserId, newTier, targetUsername) => {
    if (!window.confirm(`¿Cambiar plan de @${targetUsername} a ${String(newTier).toUpperCase()}?`)) return;

    setUsers((prev) =>
      prev.map((u) => (u.userId === targetUserId ? { ...u, isChangingTier: true } : u))
    );

    try {
      await axios.put(`${API_URL}/api/admin/users/${targetUserId}/tier`, {
        tier: newTier,
        adminId: userId
      });

      await fetchUsers();
      notifySuccess(`Plan de @${targetUsername} cambiado a ${String(newTier).toUpperCase()} exitosamente`);
    } catch (error) {
      console.error('Error cambiando tier:', error);
      setUsers((prev) =>
        prev.map((u) => (u.userId === targetUserId ? { ...u, isChangingTier: false } : u))
      );
      alert(error.response?.data?.error || 'Error al cambiar tier');
    }
  };

  const handleResetLimit = async (targetUserId, type, targetUsername) => {
    const typeLabels = {
      alerts: 'contador de alertas',
      tts: 'caracteres TTS usados',
      storage: 'storage usado',
      all: 'TODOS los límites'
    };

    if (!window.confirm(`¿Resetear ${typeLabels[type]} de @${targetUsername}?`)) return;

    try {
      await axios.post(`${API_URL}/api/admin/users/${targetUserId}/reset`, {
        adminId: userId,
        type
      });

      await fetchUsers();
      notifySuccess(`Límites de @${targetUsername} reseteados exitosamente`);
    } catch (error) {
      console.error('Error reseteando límites:', error);
      alert(error.response?.data?.error || 'Error al resetear límites');
    }
  };

  const handleToggleCreator = async (targetUserId, isCurrentlyCreator, targetUsername) => {
    if (isCurrentlyCreator) {
      if (!window.confirm(`¿Remover rol de creador de @${targetUsername}?`)) return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/users/${targetUserId}/creator-role`, {
        adminId: userId,
        isCreator: !isCurrentlyCreator
      });

      await fetchUsers();
      notifySuccess(
        `Rol de creador ${isCurrentlyCreator ? 'removido' : 'asignado'} a @${targetUsername} exitosamente`
      );
    } catch (error) {
      console.error('Error toggling creator role:', error);
      alert(error.response?.data?.error || 'Error al cambiar rol de creador');
    }
  };

  const handleSetCreatorCode = async (targetUserId, currentCode, targetUsername) => {
    const newCode = prompt(
      `Código de creador para @${targetUsername}:\n(Actual: ${currentCode || 'Sin código'})`,
      currentCode || ''
    );
    if (newCode === null) return;

    const trimmedCode = newCode.trim();
    if (!trimmedCode) {
      alert('El código no puede estar vacío');
      return;
    }

    try {
      await axios.put(`${API_URL}/api/admin/users/${targetUserId}/creator-code`, {
        adminId: userId,
        code: trimmedCode
      });

      await fetchUsers();
      notifySuccess(`Código de creador actualizado a "${trimmedCode.toUpperCase()}" para @${targetUsername}`);
    } catch (error) {
      console.error('Error setting creator code:', error);
      alert(error.response?.data?.error || 'Error al actualizar código de creador');
    }
  };

  // ---------- actions: feedback delete (responded only) ----------
  const deleteFeedbackWithFallback = async (feedbackId) => {
    const candidates = [
      // REST típico
      { method: 'delete', url: `${API_URL}/api/admin/feedback/${feedbackId}` },

      // variantes comunes
      { method: 'delete', url: `${API_URL}/api/admin/feedback/${feedbackId}/delete` },
      { method: 'post', url: `${API_URL}/api/admin/feedback/${feedbackId}/delete` },

      // variante id en body
      { method: 'post', url: `${API_URL}/api/admin/feedback/delete` }
    ];

    const payload = { adminId: userId, feedbackId };

    let lastErr = null;
    for (const c of candidates) {
      try {
        await axios({
          method: c.method,
          url: c.url,
          data: payload,
          params: c.method === 'delete' ? { adminId: userId } : undefined,
          timeout: 15000
        });
        return true;
      } catch (err) {
        if (err?.response?.status === 404) {
          lastErr = err;
          continue;
        }
        throw err;
      }
    }

    throw lastErr || new Error('No route matched');
  };

  const handleDeleteFeedback = async (fb) => {
    if (!fb?.response) return; // solo respondidos
    const label = fb.username || fb.userId || 'usuario';

    if (!window.confirm(`¿Eliminar este feedback respondido de ${label}?`)) return;

    const prev = feedbacks;
    setFeedbacks((cur) => cur.filter((x) => x._id !== fb._id));

    try {
      await deleteFeedbackWithFallback(fb._id);
      notifySuccess('Feedback eliminado');
    } catch (err) {
      console.error('Error eliminando feedback:', err);
      setFeedbacks(prev);
      const status = err?.response?.status;
      if (status === 404) alert('No existe el endpoint para borrar feedback (404).');
      else alert(err.response?.data?.error || 'Error al eliminar feedback');
    }
  };

  // ---------- filtered users ----------
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => (tierFilter === 'all' ? true : (u.tier || 'free') === tierFilter))
      .filter((u) => {
        if (!q) return true;
        const uname = String(u.username || '').toLowerCase();
        const uid = String(u.userId || '').toLowerCase();
        const code = String(u.creatorCode || '').toLowerCase();
        return uname.includes(q) || uid.includes(q) || code.includes(q);
      });
  }, [users, search, tierFilter]);

  // --- Screens ---
  if (loadingUsers) {
    return (
      <div className="min-h-screen bg-dark-bg p-6">
        <div className="text-center text-dark-muted">Cargando...</div>
      </div>
    );
  }

  if (!isAdmin || error) {
    return (
      <div className="min-h-screen bg-dark-bg p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-8 text-center">
            <p className="text-red-400 font-semibold mb-6">{error || 'Acceso denegado'}</p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-secondary/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <p className="text-dark-muted text-sm">
              Panel de administración · <span className="text-primary font-semibold">{username || 'Admin'}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                fetchUsers();
                fetchFeedbacks();
              }}
              className="px-4 py-2.5 bg-dark-card/70 border border-dark-border text-white rounded-lg hover:bg-dark-secondary hover:border-primary/50 transition-all font-semibold"
              title="Actualizar todo"
            >
              ⟳ Refresh
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-dark-card/70 border border-dark-border text-white rounded-lg hover:bg-dark-secondary hover:border-primary/50 transition-all font-semibold"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Notificación de éxito */}
        {successMessage && (
          <div className="mb-6 animate-fade-in-down">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-xl p-4 shadow-lg">
              <p className="text-green-300 font-semibold text-center text-lg">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Estadísticas globales */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Consumo Total del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition">
              <p className="text-blue-400 text-sm font-semibold mb-3">Alertas</p>
              <p className="text-3xl font-black text-white">{(stats.totalAlerts || 0).toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
              <p className="text-purple-400 text-sm font-semibold mb-3">Caracteres TTS</p>
              <p className="text-3xl font-black text-white">{(stats.totalTTS || 0).toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition">
              <p className="text-green-400 text-sm font-semibold mb-3">Storage</p>
              <p className="text-3xl font-black text-white">{formatBytes(stats.totalStorage)}</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition">
              <p className="text-cyan-400 text-sm font-semibold mb-3">Bandwidth</p>
              <p className="text-3xl font-black text-white">{formatBytes(stats.totalBandwidth)}</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/40 transition">
              <p className="text-orange-400 text-sm font-semibold mb-3">Triggers</p>
              <p className="text-3xl font-black text-white">{stats.totalTriggers || 0}</p>
            </div>
          </div>
        </div>

        {/* Estadísticas por tier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-card/70 border border-dark-border rounded-xl p-6 hover:border-dark-border/80 transition">
            <p className="text-dark-muted text-sm font-semibold mb-3">Total Usuarios</p>
            <p className="text-4xl font-black text-white">{users.length}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 transition">
            <p className="text-purple-400 text-sm font-semibold mb-3">Premium</p>
            <p className="text-4xl font-black text-white">{users.filter((u) => u.tier === 'premium').length}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition">
            <p className="text-blue-400 text-sm font-semibold mb-3">Pro</p>
            <p className="text-4xl font-black text-white">{users.filter((u) => u.tier === 'pro').length}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por @username / userId / creatorCode..."
              className="w-full md:w-96 px-4 py-2 rounded-lg bg-dark-card/70 border border-dark-border text-white placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-dark-card/70 border border-dark-border text-white"
              title="Filtrar por tier"
            >
              <option value="all">Todos</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <p className="text-dark-muted text-sm">
            Mostrando <span className="text-white font-semibold">{filteredUsers.length}</span> de{' '}
            <span className="text-white font-semibold">{users.length}</span>
          </p>
        </div>

        {/* Tabla de usuarios */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Usuarios Registrados</h2>

          <div className="bg-dark-card/70 border border-dark-border rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-dark-secondary to-dark-secondary/50 border-b-2 border-primary/20">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Usuario</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Plan</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Suscripción</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Rol</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Alertas</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">TTS</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Storage</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Bandwidth</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Triggers</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-dark-border/30">
                  {filteredUsers.map((u) => {
                    const alertsPct = safePercent(u?.alerts?.percentage);
                    const ttsPct = safePercent(u?.tts?.percentage);
                    const storagePct = safePercent(u?.storage?.percentage);
                    const bandwidthPct = safePercent(u?.bandwidth?.percentage);

                    return (
                      <tr key={u.userId} className="hover:bg-primary/5 transition-colors">
                        {/* Usuario */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-white text-base">@{u.username}</p>
                            <p className="text-xs text-dark-muted font-mono">{u.userId}</p>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-6 py-4">
                          {u.isChangingTier ? (
                            <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg animate-pulse border-2 border-white/20">
                              Cambiando...
                            </div>
                          ) : (
                            <select
                              value={u.tier || 'free'}
                              onChange={(e) => handleChangeTier(u.userId, e.target.value, u.username)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTierColor(
                                u.tier || 'free'
                              )} shadow-lg cursor-pointer hover:opacity-80 transition appearance-none border-2 border-white/20`}
                            >
                              <option value="free" className="bg-gray-800">
                                Free
                              </option>
                              <option value="pro" className="bg-gray-800">
                                Pro
                              </option>
                              <option value="premium" className="bg-gray-800">
                                Premium
                              </option>
                            </select>
                          )}
                        </td>

                        {/* Suscripción */}
                        <td className="px-6 py-4">
                          <div className="text-xs space-y-1">
                            {u?.subscription?.currentPeriodStart ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-dark-muted font-semibold">Período:</span>
                                  <span className="text-white font-mono">
                                    {formatDateShort(u.subscription.currentPeriodStart)} → {formatDateShort(u.subscription.currentPeriodEnd)}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-dark-muted font-semibold">Status:</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold ${u.subscription.status === 'active'
                                        ? 'bg-green-500/20 text-green-400'
                                        : u.subscription.status === 'canceled'
                                          ? 'bg-red-500/20 text-red-400'
                                          : 'bg-gray-500/20 text-gray-400'
                                      }`}
                                  >
                                    {u.subscription.status}
                                  </span>
                                </div>

                                {u.subscription.cancelAtPeriodEnd && (
                                  <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-300 font-bold">
                                    ⚠️ Cancelado al fin del período
                                  </div>
                                )}

                                {u.subscription.requiresManualMpCancellation && (
                                  <div className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-red-300 font-bold">
                                    🔴 Requiere cancelación en MP
                                  </div>
                                )}

                                {u.subscription.stripeSubscriptionId && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-dark-muted font-semibold">MP ID:</span>
                                    <span className="text-white font-mono text-[10px]">
                                      {String(u.subscription.stripeSubscriptionId).slice(0, 12)}...
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-dark-muted italic">Plan gratuito</span>
                            )}
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleToggleCreator(u.userId, !!u.isCreator, u.username)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all ${u.isCreator
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50'
                                  : 'bg-dark-secondary border border-dark-border hover:border-yellow-500/50'
                                }`}
                            >
                              {u.isCreator ? 'Creador' : 'Sin rol'}
                            </button>

                            {u.isCreator && (
                              <button
                                onClick={() => handleSetCreatorCode(u.userId, u.creatorCode, u.username)}
                                className="px-2 py-1.5 rounded-full text-xs font-bold text-white bg-dark-secondary border border-cyan-500/50 hover:border-cyan-500 transition-all"
                                title="Editar código de creador"
                              >
                                {u.creatorCode ? u.creatorCode : 'Agregar código'}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Alertas */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white font-bold">
                              {u?.alerts?.current || 0}/
                              {u?.alerts?.isUnlimited || u?.alerts?.limit == null ? 'Ilimitado' : u?.alerts?.limit || 0}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${alertsPct > 80 ? 'bg-red-500' : alertsPct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${alertsPct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${getUsageColor(alertsPct)}`}>{alertsPct}%</span>
                            </div>
                          </div>
                        </td>

                        {/* TTS */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white font-bold">
                              {(u?.tts?.current || 0).toLocaleString()} /{' '}
                              {u?.tts?.isUnlimited || u?.tts?.limit == null ? 'Ilimitado' : (u?.tts?.limit || 0).toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${ttsPct > 80 ? 'bg-red-500' : ttsPct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${ttsPct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${getUsageColor(ttsPct)}`}>{ttsPct}%</span>
                            </div>
                          </div>
                        </td>

                        {/* Storage */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white font-bold">
                              {formatBytes(u?.storage?.current || 0)} /{' '}
                              {u?.storage?.isUnlimited || u?.storage?.limit == null ? 'Ilimitado' : formatBytes(u?.storage?.limit || 0)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${storagePct > 80 ? 'bg-red-500' : storagePct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${storagePct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${getUsageColor(storagePct)}`}>{storagePct}%</span>
                            </div>
                          </div>
                        </td>

                        {/* Bandwidth */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-white font-bold">
                              {formatBytes(u?.bandwidth?.current || 0)} /{' '}
                              {u?.bandwidth?.isUnlimited || u?.bandwidth?.limit == null ? 'Ilimitado' : formatBytes(u?.bandwidth?.limit || 0)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${bandwidthPct > 80 ? 'bg-red-500' : bandwidthPct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                  style={{ width: `${bandwidthPct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${getUsageColor(bandwidthPct)}`}>{bandwidthPct}%</span>
                            </div>
                          </div>
                        </td>

                        {/* Triggers */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-black text-base">
                            {u?.triggers || 0}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResetLimit(u.userId, 'all', u.username)}
                              className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition text-xs font-semibold"
                              title="Resetear todos los límites"
                            >
                              Reset All
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-dark-muted text-lg">No hay usuarios que coincidan con el filtro</p>
              </div>
            )}
          </div>
        </div>

        <AppFooter />

        {/* Feedbacks */}
        <div className="mt-12">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h2 className="text-2xl font-black text-primary">Feedback de usuarios</h2>

            <button
              onClick={fetchFeedbacks}
              className="px-3 py-2 bg-dark-card/70 border border-dark-border text-white rounded-lg hover:bg-dark-secondary hover:border-primary/50 transition-all font-semibold"
            >
              ⟳ Refresh feedback
            </button>
          </div>

          {loadingFeedbacks ? (
            <p className="text-dark-muted">Cargando feedback...</p>
          ) : feedbacks.length === 0 ? (
            <p className="text-dark-muted">No hay comentarios enviados.</p>
          ) : (
            <div className="space-y-6">
              {feedbacks.map((fb) => (
                <div key={fb._id} className="bg-dark-card border border-primary/20 rounded-xl p-5 shadow">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-primary">{fb.username || fb.userId}</span>
                    {fb.email && <span className="text-xs text-dark-muted">{fb.email}</span>}
                    {fb.type && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{fb.type}</span>}
                    <span className="text-xs text-dark-muted">{formatDate(fb.createdAt)}</span>
                  </div>

                  <div className="text-white mb-2 whitespace-pre-wrap">{fb.feedback}</div>

                  {fb.response ? (
                    <div className="mt-3">
                      <div className="text-green-400 text-sm whitespace-pre-wrap">Respuesta: {fb.response}</div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={async () => {
                            if (!window.confirm('¿Eliminar este feedback respondido?')) return;
                            await axios.delete(`${API_URL}/api/admin/feedback/${fb._id}`, {
                              params: { adminId: userId } // opcional
                            });
                            await fetchFeedbacks();
                            notifySuccess('Feedback eliminado');
                          }}
                          className="px-3 py-2 bg-red-500/15 border border-red-500/40 text-red-300 rounded-lg hover:bg-red-500/25 transition text-xs font-semibold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <FeedbackResponseForm feedbackId={fb._id} adminId={userId} onRespond={fetchFeedbacks} />
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
