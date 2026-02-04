import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';

import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { AppFooter } from '../components/AppFooter';

export default function CreatorDashboard() {
  const [userId, setUserId] = useState(localStorage.getItem('twitchUserId'));
  const [username, setUsername] = useState(localStorage.getItem('twitchUsername'));

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);

  const loginUrl = `${API_URL}/auth/twitch`;

  const formatMoney = (cents) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

  const shareLink = useMemo(() => {
    if (!profile?.code) return '';
    return `${window.location.origin}/pricing?ref=${profile.code}`;
  }, [profile]);

  const loadDashboard = async () => {
    if (!userId) return;

    try {
      const profileRes = await axios.get(`${API_URL}/api/creator/profile?userId=${userId}`);
      if (!profileRes.data?.exists || !profileRes.data?.isAssigned) {
        setProfile(null);
        setReferrals([]);
        setLoading(false);
        if (profileRes.data?.exists) {
          toast.warning('No tienes rol de creador asignado');
        }
        return;
      }

      const dashboardRes = await axios.get(`${API_URL}/api/creator/dashboard?userId=${userId}`);
      setProfile(dashboardRes.data.profile);
      setReferrals(dashboardRes.data.referrals || []);
    } catch (error) {
      console.error('Error cargando dashboard creador:', error);
      toast.error('No se pudo cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [userId]);

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    toast.success('Link copiado');
  };

  const handleLogout = () => {
    localStorage.removeItem('twitchUserId');
    localStorage.removeItem('twitchUsername');
    setUserId(null);
    setUsername(null);
  };

  if (!userId) {
    return <LoginCard loginUrl={loginUrl} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen text-dark-text p-5 lg:p-12">
        <Header username={username} userId={userId} onLogout={handleLogout} title="Mi Código" />
        <Navigation />
        <div className="max-w-7xl mx-auto">
          <div className="bg-dark-card/60 border border-dark-border rounded-2xl p-8 text-center text-dark-muted">
            Cargando...
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen text-dark-text p-5 lg:p-12">
        <Header username={username} userId={userId} onLogout={handleLogout} title="Mi Código" />
        <Navigation />
        <div className="max-w-7xl mx-auto">
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-8 text-center">
            <p className="text-dark-muted text-lg">No tienes rol de creador</p>
            <p className="text-dark-muted text-sm mt-2">Contacta a un administrador</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const totalEarnings = referrals.reduce((sum, ref) => sum + (ref.estimatedEarningsCents || 0), 0);

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12">
      <div className="max-w-7xl mx-auto">
        <Header username={username} userId={userId} onLogout={handleLogout} title="Mi Código de Creador" />
        <Navigation isCreator={true} />

        {/* CÓDIGO */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-8 mb-8">
          <p className="text-xs font-semibold text-primary uppercase mb-2">Tu código</p>
          <div className="flex items-center justify-between mb-4">
            <div className="text-6xl font-black text-white">{profile.code}</div>
            <button
              onClick={handleCopy}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 font-bold"
            >
              Copiar
            </button>
          </div>
          {shareLink && (
            <input
              readOnly
              value={shareLink}
              className="w-full bg-black/50 border border-primary/30 px-4 py-2 rounded-lg text-green-400 text-sm font-mono focus:outline-none"
            />
          )}
        </div>

        {/* MÉTRICAS */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-6">
            <p className="text-dark-muted text-sm mb-2">Usuarios Referidos</p>
            <p className="text-5xl font-black text-white">{referrals.length}</p>
          </div>
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-6">
            <p className="text-dark-muted text-sm mb-2">Ganancias Estimadas</p>
            <p className="text-4xl font-black text-primary">{formatMoney(totalEarnings)}</p>
          </div>
        </div>

        {/* REFERRALS */}
        {referrals.length > 0 && (
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-6">
            <h3 className="text-xl font-black text-white mb-4">Tus Referidos</h3>
            <div className="space-y-3">
              {referrals.map((ref) => (
                <div key={ref._id} className="flex justify-between items-center p-4 bg-dark-secondary/50 rounded-lg border border-dark-border/50">
                  <div>
                    <p className="text-white font-semibold">{ref.referredUserId}</p>
                    <p className="text-dark-muted text-xs">Plan {ref.planTier === 'pro' ? 'PRO' : 'PREMIUM'}</p>
                  </div>
                  <p className="text-accent font-bold">{formatMoney(ref.estimatedEarningsCents)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-12 text-center">
            <p className="text-dark-muted">Aún sin referidos</p>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
