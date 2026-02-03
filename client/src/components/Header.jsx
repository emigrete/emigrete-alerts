import { useState, useEffect } from 'react';
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

    fetchSubscription();
  }, [userId]);

  const getTierColor = (tier) => {
    switch(tier) {
      case 'FREE': return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'PRO': return 'bg-purple-500/20 border-purple-500/50 text-purple-400';
      case 'PREMIUM': return 'bg-pink-500/20 border-pink-500/50 text-pink-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getTierLabel = (tier) => {
    switch(tier) {
      case 'FREE': return 'Plan Gratuito';
      case 'PRO': return 'Plan Pro';
      case 'PREMIUM': return 'Plan Premium';
      default: return tier;
    }
  };

  return (
    <header className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8 pb-6 border-b-2 border-primary/20">
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mb-2">
          {title || (username ? `Dashboard de ${username}` : 'Tu Dashboard')}
        </h1>
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
            {!loadingSubscription && subscription && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getTierColor(subscription.subscription.tier)} text-xs font-bold w-fit`}>
                {getTierLabel(subscription.subscription.tier)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {rightSlot}
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
