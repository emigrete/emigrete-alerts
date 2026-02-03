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
  const [isAdmin, setIsAdmin] = useState(false);

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
      setUsers(response.data.users || []);
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
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-dark-secondary text-white rounded-lg hover:bg-dark-border transition"
          >
            Volver
          </button>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-dark-card/70 border border-dark-border rounded-xl p-6">
            <p className="text-dark-muted text-sm mb-2">Total Usuarios</p>
            <p className="text-3xl font-bold text-white">{users.length}</p>
          </div>
          <div className="bg-dark-card/70 border border-dark-border rounded-xl p-6">
            <p className="text-dark-muted text-sm mb-2">Usuarios Premium</p>
            <p className="text-3xl font-bold text-purple-400">{users.filter(u => u.tier === 'premium').length}</p>
          </div>
          <div className="bg-dark-card/70 border border-dark-border rounded-xl p-6">
            <p className="text-dark-muted text-sm mb-2">Usuarios Pro</p>
            <p className="text-3xl font-bold text-blue-400">{users.filter(u => u.tier === 'pro').length}</p>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-dark-card/70 border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-secondary/50 border-b border-dark-border">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">Usuario</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">Plan</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">Alertas</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">TTS</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">Storage</th>
                  <th className="px-6 py-4 text-left font-semibold text-dark-muted">Triggers</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId} className="border-b border-dark-border/30 hover:bg-dark-secondary/20 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-white">{user.displayName}</p>
                        <p className="text-xs text-dark-muted">{user.userId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getTierColor(user.tier)}`}>
                        {getTierLabel(user.tier)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white font-semibold">
                          {user.alerts.current}/{user.alerts.limit === Infinity ? '∞' : user.alerts.limit}
                        </p>
                        <p className={`text-xs font-semibold ${getUsageColor(user.alerts.percentage)}`}>
                          {user.alerts.percentage}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white font-semibold">
                          {user.tts.current.toLocaleString()} / {user.tts.limit === Infinity ? '∞' : user.tts.limit.toLocaleString()}
                        </p>
                        <p className={`text-xs font-semibold ${getUsageColor(user.tts.percentage)}`}>
                          {user.tts.percentage}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-white font-semibold">
                          {formatBytes(user.storage.current)} / {user.storage.limit === Infinity ? '∞' : formatBytes(user.storage.limit)}
                        </p>
                        <p className={`text-xs font-semibold ${getUsageColor(user.storage.percentage)}`}>
                          {user.storage.percentage}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {user.triggers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-muted">No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  );
};
