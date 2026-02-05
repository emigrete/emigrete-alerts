import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../constants/config';

export const Header = ({
  username,
  userId,
  onLogout,
  title,
  subtitle,
  showStatus = true,
  showLogout = true,
  rightSlot
}) => {
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) {
        setLoadingSubscription(false);
        return;
      }
      
      try {
        const res = await axios.get(`${API_URL}/api/subscription/status?userId=${userId}`);
        setSubscription(res.data);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    const checkAdmin = async () => {
      if (!userId) return;
      
      try {
        const res = await axios.get(`${API_URL}/api/admin/check?userId=${userId}`);
        setIsAdmin(res.data.isAdmin);
      } catch (error) {
        console.error('Error checking admin:', error);
        setIsAdmin(false);
      }
    };

    const checkCreator = async () => {
      if (!userId) return;
      
      try {
        const res = await axios.get(`${API_URL}/api/creator/profile?userId=${userId}`);
        if (res.data?.exists && res.data?.isAssigned) {
          setIsCreator(true);
        } else {
          setIsCreator(false);
        }
      } catch (error) {
        console.error('Error checking creator:', error);
        setIsCreator(false);
      }
    };

    fetchSubscription();
    checkAdmin();
    checkCreator();
  }, [userId]);

  const getTierColor = (tier) => {
    switch(tier) {
      case 'free': return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400/50 shadow-gray-500/20';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-400/50 shadow-blue-500/30';
      case 'premium': return 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 border-pink-400/50 shadow-pink-500/40 animate-pulse';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400/50';
    }
  };

  const getTierLabel = (tier) => {
    switch(tier) {
      case 'free': return 'Plan Gratuito';
      case 'pro': return 'Plan Pro';
      case 'premium': return 'Plan Premium';
      default: return tier;
    }
  };

  return (
    <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8 pb-6 border-b-2 border-primary/20">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <img src="/assets/Buho Logo Alertas.png" alt="Welyczko Alerts Logo" className="w-28 h-28 object-contain" />
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            {title || (username ? `Dashboard de ${username}` : 'Tu Dashboard')}
          </h1>
        </div>
        {subtitle && (
          <p className="text-dark-muted text-sm mb-2">
            {subtitle}
          </p>
        )}
        {showStatus && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-dark-muted text-sm font-mono">
                {username ? `${username} (${userId?.substring(0, 8)}...)` : userId}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isCreator && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-400/50 shadow-yellow-500/40 text-dark-bg text-sm font-black uppercase tracking-wide shadow-lg w-fit">
                  Creador
                </div>
              )}
              {!loadingSubscription && subscription && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getTierColor(subscription.subscription.tier)} text-white text-sm font-black uppercase tracking-wide shadow-lg w-fit`}>
                  {getTierLabel(subscription.subscription.tier)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {rightSlot}
        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2 rounded-lg hover:bg-amber-500/20 hover:border-amber-500 transition-all font-semibold text-sm"
          >
            Admin
          </button>
        )}
        <button
          onClick={() => navigate('/pricing')}
          className="bg-primary/10 border border-primary/30 text-primary px-6 py-2 rounded-lg hover:bg-primary/20 hover:border-primary transition-all font-semibold"
        >
          Ver Planes
        </button>
        {showLogout && (
          <button 
            onClick={onLogout}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg hover:bg-red-500/20 hover:border-red-500 transition-all font-semibold"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
};
