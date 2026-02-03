import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId] = useState(localStorage.getItem('twitchUserId'));
  const [username] = useState(localStorage.getItem('twitchUsername'));
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    totalTTS: 0,
    totalStorage: 0,
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
      setUsers(usersData);
      
      // Calcular estadísticas totales
      const totalStats = usersData.reduce((acc, user) => ({
        totalAlerts: acc.totalAlerts + user.alerts.current,
        totalTTS: acc.totalTTS + user.tts.current,
        totalStorage: acc.totalStorage + user.storage.current,
        totalTriggers: acc.totalTriggers + user.triggers
      }), { totalAlerts: 0, totalTTS: 0, totalStorage: 0, totalTriggers: 0 });
      
      setStats(totalStats);
      setIsAdmin(true);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      if (err.response?.status === 403) {
        setError('No tienes permisos para acceder a este dashboard');
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

  const handleChangeTier = async (targetUserId, newTier) => {
    if (!window.confirm(`¿Cambiar plan de usuario a ${newTier.toUpperCase()}?`)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/api/admin/users/${targetUserId}/tier`, {
        tier: newTier,
        adminId: userId
      });

      // Recargar usuarios
      await fetchUsers();
      alert('Plan cambiado exitosamente');
    } catch (error) {
      console.error('Error cambiando tier:', error);
      alert(error.response?.data?.error || 'Error al cambiar tier');
    }
  };

  const handleResetLimit = async (targetUserId, type, displayName) => {
    const typeLabels = {
      'alerts': 'contador de alertas',
      'tts': 'caracteres TTS usados',
      'storage': 'storage usado',
      'all': 'TODOS los límites'
    };

    if (!window.confirm(`¿Resetear ${typeLabels[type]} de ${displayName}?`)) {
      return;
    }

    try {
      await axios.post(`${API_URL}/api/admin/users/${targetUserId}/reset`, {
        adminId: userId,
        type
      });

      // Recargar usuarios
      await fetchUsers();
      alert('Límites reseteados exitosamente');
    } catch (error) {
      console.error('Error reseteando límites:', error);
      alert(error.response?.data?.error || 'Error al resetear límites');
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
              onClick={() => navigate('/dashboard')}
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
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-dark-card/70 border border-dark-border text-white rounded-lg hover:bg-dark-secondary hover:border-primary/50 transition-all font-semibold"
          >
            ← Volver
          </button>
        </div>

        {/* Estadísticas globales */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Consumo Total del Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/40 transition">
              <p className="text-blue-400 text-sm font-semibold mb-3">Alertas Totales</p>
              <p className="text-3xl font-black text-white">{stats.totalAlerts.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition">
              <p className="text-purple-400 text-sm font-semibold mb-3">Caracteres TTS</p>
              <p className="text-3xl font-black text-white">{stats.totalTTS.toLocaleString()}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6 hover:border-green-500/40 transition">
              <p className="text-green-400 text-sm font-semibold mb-3">Storage Usado</p>
              <p className="text-3xl font-black text-white">{formatBytes(stats.totalStorage)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-6 hover:border-orange-500/40 transition">
              <p className="text-orange-400 text-sm font-semibold mb-3">Triggers Activos</p>
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
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Alertas</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">TTS</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Storage</th>
                    <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Triggers</th>                  <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Acciones</th>                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/30">
                  {users.map((user) => (
                    <tr key={user.userId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white text-base">{user.displayName}</p>                        <p className="text-sm text-primary font-semibold">@{user.username}</p>                          <p className="text-xs text-dark-muted font-mono">{user.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.tier}
                          onChange={(e) => handleChangeTier(user.userId, e.target.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTierColor(user.tier)} shadow-lg cursor-pointer hover:opacity-80 transition appearance-none border-2 border-white/20`}
                        >
                          <option value="free" className="bg-gray-800">Free</option>
                          <option value="pro" className="bg-gray-800">Pro</option>
                          <option value="premium" className="bg-gray-800">Premium</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {user.alerts.current}/{user.alerts.limit === Infinity ? '∞' : user.alerts.limit}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  user.alerts.percentage > 80 ? 'bg-red-500' :
                                  user.alerts.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.alerts.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.alerts.percentage)}`}>
                              {user.alerts.percentage}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {user.tts.current.toLocaleString()} / {user.tts.limit === Infinity ? '∞' : user.tts.limit.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  user.tts.percentage > 80 ? 'bg-red-500' :
                                  user.tts.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.tts.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.tts.percentage)}`}>
                              {user.tts.percentage}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-white font-bold">
                            {formatBytes(user.storage.current)} / {user.storage.limit === Infinity ? '∞' : formatBytes(user.storage.limit)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-1.5 bg-dark-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  user.storage.percentage > 80 ? 'bg-red-500' :
                                  user.storage.percentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${user.storage.percentage}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${getUsageColor(user.storage.percentage)}`}>
                              {user.storage.percentage}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-black text-base">
                          {user.triggers}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResetLimit(user.userId, 'all', user.displayName)}
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
      </div>
    </div>
  );
};
