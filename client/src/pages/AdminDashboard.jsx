import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigate } from 'react-router-dom';
import { AppFooter } from '../components/AppFooter';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState(localStorage.getItem('twitchUserId'));
  const [username] = useState(localStorage.getItem('twitchUsername'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
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
      setLoading(false);
      return;
    }
    
    fetchUsers();
  }, [userId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/users`, {
        params: { adminId: userId }
      });
      const usersData = response.data.users || [];
      console.log(`Admin Dashboard: Recibidos ${usersData.length} usuarios`);
      console.log('First 3 users:', usersData.slice(0, 3).map(u => ({ id: u.userId, username: u.username, isCreator: u.isCreator })));
      setUsers(usersData);
      
      // Calcular estadísticas totales con validaciones
      const totalStats = usersData.reduce((acc, user) => ({
        totalAlerts: acc.totalAlerts + (user.alerts?.current || 0),
        totalTTS: acc.totalTTS + (user.tts?.current || 0),
        totalStorage: acc.totalStorage + (user.storage?.current || 0),
        totalBandwidth: acc.totalBandwidth + (user.bandwidth?.current || 0),
        totalTriggers: acc.totalTriggers + (user.triggers || 0)
      }), { totalAlerts: 0, totalTTS: 0, totalStorage: 0, totalBandwidth: 0, totalTriggers: 0 });
      
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
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
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

  const getTierLabel = (tier) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  const getUsageColor = (percentage) => {
    if (percentage > 80) return 'text-red-500';
    if (percentage > 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleChangeTier = async (targetUserId, newTier, username) => {
    if (!window.confirm(`¿Cambiar plan de @${username} a ${newTier.toUpperCase()}?`)) {
      return;
    }

    // Mostrar loading en el usuario específico
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.userId === targetUserId 
          ? { ...u, isChangingTier: true }
          : u
      )
    );

    try {
      await axios.put(`${API_URL}/api/admin/users/${targetUserId}/tier`, {
        tier: newTier,
        adminId: userId
      });

      // Recargar usuarios
      await fetchUsers();
      
      // Notificación de éxito
      setSuccessMessage(`Plan de @${username} cambiado a ${newTier.toUpperCase()} exitosamente`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error cambiando tier:', error);
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.userId === targetUserId 
            ? { ...u, isChangingTier: false }
            : u
        )
      );
      alert(error.response?.data?.error || 'Error al cambiar tier');
    }
  };

  const handleResetLimit = async (targetUserId, type, username) => {
    const typeLabels = {
      'alerts': 'contador de alertas',
      'tts': 'caracteres TTS usados',
      'storage': 'storage usado',
      'all': 'TODOS los límites'
    };

    if (!window.confirm(`¿Resetear ${typeLabels[type]} de @${username}?`)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/users/${targetUserId}/reset`, {
        adminId: userId,
        type
      });

      // Recargar usuarios
      await fetchUsers();
      
      // Notificación de éxito
      setSuccessMessage(`Límites de @${username} reseteados exitosamente`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error reseteando límites:', error);
      alert(error.response?.data?.error || 'Error al resetear límites');
    }
  };

  const handleToggleCreator = async (targetUserId, isCurrentlyCreator, username) => {
    if (isCurrentlyCreator) {
      // Remover: pedir confirmación
      if (!window.confirm(`¿Remover rol de creador de @${username}?`)) {
        return;
      }
    }

    try {
      console.log(`[Creator Toggle] Toggling creator role for ${targetUserId}, current: ${isCurrentlyCreator}, new: ${!isCurrentlyCreator}`);
      await axios.post(`${API_URL}/api/admin/users/${targetUserId}/creator-role`, {
        adminId: userId,
        isCreator: !isCurrentlyCreator
      });

      // Recargar usuarios
      await fetchUsers();
      
      // Notificación de éxito
      const action = isCurrentlyCreator ? 'removido' : 'asignado';
      setSuccessMessage(`Rol de creador ${action} a @${username} exitosamente`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error toggling creator role:', error);
      alert(error.response?.data?.error || 'Error al cambiar rol de creador');
    }
  };

  const handleSetCreatorCode = async (targetUserId, currentCode, username) => {
    const newCode = prompt(`Código de creador para @${username}:\n(Actual: ${currentCode || 'Sin código'})`, currentCode || '');
    if (newCode === null) return; // Usuario canceló

    const trimmedCode = newCode.trim();
    if (!trimmedCode) {
      alert('El código no puede estar vacío');
      return;
    }

    try {
      console.log(`[Set Creator Code] Actualizando código para ${targetUserId}`);
      await axios.put(`${API_URL}/api/admin/users/${targetUserId}/creator-code`, {
        adminId: userId,
        code: trimmedCode
      });

      // Recargar usuarios
      await fetchUsers();
      
      // Notificación de éxito
      setSuccessMessage(`Código de creador actualizado a "${trimmedCode.toUpperCase()}" para @${username}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error setting creator code:', error);
      alert(error.response?.data?.error || 'Error al actualizar código de creador');
    }
  };

  if (loading) {
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
            <p className="text-red-400 font-semibold mb-6">
              {error || 'Acceso denegado'}
            </p>
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
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-dark-card/70 border border-dark-border text-white rounded-lg hover:bg-dark-secondary hover:border-primary/50 transition-all font-semibold"
          >
            ← Volver
          </button>
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
              <p className="text-3xl font-black text-white">{stats.totalTriggers}</p>
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
            <p className="text-4xl font-black text-white">{users.filter(u => u.tier === 'premium').length}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-6 hover:border-blue-500/50 transition">
            <p className="text-blue-400 text-sm font-semibold mb-3">Pro</p>
            <p className="text-4xl font-black text-white">{users.filter(u => u.tier === 'pro').length}</p>
          </div>
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
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Triggers</th>                  <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Acciones</th>                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/30">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white text-base">@{user.username}</p>
                          <p className="text-xs text-dark-muted font-mono">{user.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.isChangingTier ? (
                          <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-gray-600 to-gray-700 shadow-lg animate-pulse border-2 border-white/20">
                            Cambiando...
                          </div>
                        ) : (
                          <select
                            value={user.tier}
                            onChange={(e) => handleChangeTier(user.userId, e.target.value, user.username)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTierColor(user.tier)} shadow-lg cursor-pointer hover:opacity-80 transition appearance-none border-2 border-white/20`}
                          >
                            <option value="free" className="bg-gray-800">Free</option>
                            <option value="pro" className="bg-gray-800">Pro</option>
                            <option value="premium" className="bg-gray-800">Premium</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {user.subscription?.currentPeriodStart && (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-dark-muted font-semibold">Período:</span>
                                <span className="text-white font-mono">
                                  {formatDateShort(user.subscription.currentPeriodStart)} → {formatDateShort(user.subscription.currentPeriodEnd)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-dark-muted font-semibold">Status:</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                  user.subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  user.subscription.status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {user.subscription.status}
                                </span>
                              </div>
                            </>
                          )}
                          {user.subscription?.cancelAtPeriodEnd && (
                            <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-amber-300 font-bold">
                              ⚠️ Cancelado al fin del período
                            </div>
                          )}
                          {user.subscription?.requiresManualMpCancellation && (
                            <div className="px-2 py-1 bg-red-500/20 border border-red-500/40 rounded text-red-300 font-bold">
                              🔴 Requiere cancelación en MP
                            </div>
                          )}
                          {user.subscription?.stripeSubscriptionId && (
                            <div className="flex items-center gap-2">
                              <span className="text-dark-muted font-semibold">MP ID:</span>
                              <span className="text-white font-mono text-[10px]">
                                {user.subscription.stripeSubscriptionId.slice(0, 12)}...
                              </span>
                            </div>
                          )}
                          {!user.subscription?.currentPeriodStart && user.tier === 'free' && (
                            <span className="text-dark-muted italic">Plan gratuito</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleToggleCreator(user.userId, user.isCreator, user.username)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all ${
                              user.isCreator
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/50'
                                : 'bg-dark-secondary border border-dark-border hover:border-yellow-500/50'
                            }`}
                          >
                            {user.isCreator ? 'Creador' : 'Sin rol'}
                          </button>
                          {user.isCreator && (
                            <button
                              onClick={() => handleSetCreatorCode(user.userId, user.creatorCode, user.username)}
                              className="px-2 py-1.5 rounded-full text-xs font-bold text-white bg-dark-secondary border border-cyan-500/50 hover:border-cyan-500 transition-all"
                              title="Editar código de creador"
                            >
                              {user.creatorCode ? user.creatorCode : 'Agregar código'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {user.alerts?.current || 0}/{(user.alerts?.isUnlimited || user.alerts?.limit == null) ? 'Ilimitado' : (user.alerts?.limit || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (user.alerts?.percentage || 0) > 80 ? 'bg-red-500' :
                                  (user.alerts?.percentage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.alerts?.percentage || 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.alerts?.percentage || 0)}`}>
                              {user.alerts?.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {(user.tts.current || 0).toLocaleString()} / {(user.tts?.isUnlimited || user.tts?.limit == null) ? 'Ilimitado' : (user.tts.limit || 0).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (user.tts.percentage || 0) > 80 ? 'bg-red-500' :
                                  (user.tts.percentage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.tts.percentage || 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.tts.percentage || 0)}`}>
                              {user.tts.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {formatBytes(user.storage?.current || 0)} / {(user.storage?.isUnlimited || user.storage?.limit == null) ? 'Ilimitado' : formatBytes(user.storage?.limit || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (user.storage?.percentage || 0) > 80 ? 'bg-red-500' :
                                  (user.storage?.percentage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.storage?.percentage || 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.storage?.percentage || 0)}`}>
                              {user.storage?.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {formatBytes(user.bandwidth?.current || 0)} / {(user.bandwidth?.isUnlimited || user.bandwidth?.limit == null) ? 'Ilimitado' : formatBytes(user.bandwidth?.limit || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  (user.bandwidth?.percentage || 0) > 80 ? 'bg-red-500' :
                                  (user.bandwidth?.percentage || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.bandwidth?.percentage || 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.bandwidth?.percentage || 0)}`}>
                              {user.bandwidth?.percentage || 0}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-black text-base">
                          {user.triggers || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResetLimit(user.userId, 'all', user.username)}
                            className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition text-xs font-semibold"
                            title="Resetear todos los límites"
                          >
                            Reset All
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-muted text-lg">No hay usuarios registrados</p>
          </div>
        )}

        <AppFooter />
      </div>
    </div>
  );
};
