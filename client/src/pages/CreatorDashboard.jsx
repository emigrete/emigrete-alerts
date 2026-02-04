import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';

import { LoginCard } from '../components/LoginCard';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { AppFooter } from '../components/AppFooter';

export default function CreatorDashboard() {
  const isDevelopment = import.meta.env.DEV;
  const isDemo = isDevelopment && new URLSearchParams(window.location.search).get('demo') === 'true';

  const [userId, setUserId] = useState(
    isDemo ? 'demo_user_123' : localStorage.getItem('twitchUserId')
  );
  const [username, setUsername] = useState(
    isDemo ? 'Demo User' : localStorage.getItem('twitchUsername')
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [totals, setTotals] = useState({ totalEstimatedEarningsCents: 0, totalReferred: 0 });
  const [codeInput, setCodeInput] = useState('');
  const [creating, setCreating] = useState(false);

  const loginUrl = `${API_URL}/auth/twitch`;

  const formatMoney = (cents) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);

  const shareLink = useMemo(() => {
    if (!profile?.code) return '';
    return `${window.location.origin}/pricing?ref=${profile.code}`;
  }, [profile]);

  const loadDashboard = async () => {
    if (!userId) return;

    if (isDemo) {
      const demoProfile = {
        code: 'DEMO10',
        discountRate: 0.1,
        commissionRate: 0.2
      };
      const demoReferrals = [
        {
          _id: 'ref_1',
          referredUserId: 'user_874',
          planTier: 'pro',
          priceCents: 499,
          estimatedEarningsCents: 90,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'ref_2',
          referredUserId: 'user_291',
          planTier: 'premium',
          priceCents: 999,
          estimatedEarningsCents: 180,
          createdAt: new Date().toISOString()
        }
      ];
      setProfile(demoProfile);
      setReferrals(demoReferrals);
      setTotals({ totalEstimatedEarningsCents: 270, totalReferred: 2 });
      setLoading(false);
      return;
    }

    try {
      const profileRes = await axios.get(`${API_URL}/api/creator/profile?userId=${userId}`);
      if (!profileRes.data?.exists) {
        setProfile(null);
        setReferrals([]);
        setTotals({ totalEstimatedEarningsCents: 0, totalReferred: 0 });
        setLoading(false);
        return;
      }

      const dashboardRes = await axios.get(`${API_URL}/api/creator/dashboard?userId=${userId}`);
      setProfile(dashboardRes.data.profile);
      setReferrals(dashboardRes.data.referrals || []);
      setTotals(dashboardRes.data.totals || { totalEstimatedEarningsCents: 0, totalReferred: 0 });
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

  const handleCreateProfile = async () => {
    if (!userId) return;

    setCreating(true);
    const toastId = toast.loading('Creando código...');

    try {
      const res = await axios.post(`${API_URL}/api/creator/register`, {
        userId,
        code: codeInput
      });
      setProfile(res.data.profile);
      toast.success('Código creado', { id: toastId });
      await loadDashboard();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error creando código', { id: toastId });
    } finally {
      setCreating(false);
    }
  };

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

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9146FF" />
              <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="200" r="150" stroke="url(#grad1)" strokeWidth="2" fill="none" />
          <circle cx="1200" cy="600" r="200" stroke="url(#grad1)" strokeWidth="2" fill="none" />
          <path d="M 100 400 Q 300 200 500 400" stroke="url(#grad1)" strokeWidth="2" fill="none" />
        </svg>
      </div>

      <Toaster position="top-right" theme="dark" richColors />

      <div className="max-w-7xl mx-auto relative z-10">
        <Header
          username={username}
          userId={userId}
          onLogout={handleLogout}
          title="Programa de Creadores"
          subtitle="Ganá comisiones y ofrece descuentos con tu código."
        />

        <Navigation />

        {loading ? (
          <div className="bg-dark-card/60 border border-dark-border rounded-2xl p-8 text-center text-dark-muted">
            Cargando datos...
          </div>
        ) : !profile ? (
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-8">
            <h3 className="text-2xl font-black text-white mb-2">Creá tu código de creador</h3>
            <p className="text-dark-muted mb-6">
              Ofrecé <strong className="text-white">10% de descuento</strong> y ganá
              <strong className="text-white"> 20% de comisión</strong> por cada suscripción.
            </p>

            <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Tu código (opcional)"
                className="w-full p-3 rounded-lg border-2 border-dark-border bg-dark-secondary text-white outline-none focus:border-primary"
              />
              <button
                onClick={handleCreateProfile}
                disabled={creating}
                className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {creating ? 'Creando...' : 'Crear código'}
              </button>
            </div>

            <p className="text-xs text-dark-muted mt-3">
              Si no elegís un código, se genera automáticamente.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Tu código</h3>
                  <p className="text-3xl font-black text-primary mt-1">{profile.code}</p>
                  <p className="text-xs text-dark-muted mt-2">
                    Descuento {Math.round(profile.discountRate * 100)}% • Comisión {Math.round(profile.commissionRate * 100)}%
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90"
                  >
                    Copiar link
                  </button>
                </div>
              </div>
              {shareLink && (
                <div className="mt-4">
                  <input
                    readOnly
                    value={shareLink}
                    className="w-full bg-black border border-dark-border px-3 py-2 rounded-lg text-green-400 text-xs font-mono focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-gradient-to-br from-primary/10 to-pink-500/5 border border-primary/30 rounded-2xl">
                <h4 className="text-lg font-bold text-white mb-2">Ingresos estimados</h4>
                <div className="text-3xl font-black text-primary">
                  {formatMoney(totals.totalEstimatedEarningsCents)}
                </div>
                <p className="text-xs text-dark-muted mt-2">Basado en suscripciones activas con tu código.</p>
              </div>
              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-2xl">
                <h4 className="text-lg font-bold text-white mb-2">Usuarios referidos</h4>
                <div className="text-3xl font-black text-blue-400">
                  {totals.totalReferred}
                </div>
                <p className="text-xs text-dark-muted mt-2">Total de usuarios con tu código.</p>
              </div>
            </div>

            <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Usuarios con tu código</h3>
              {referrals.length === 0 ? (
                <p className="text-dark-muted">Todavía no tenés referidos.</p>
              ) : (
                <div className="space-y-3">
                  {referrals.map((ref) => (
                    <div
                      key={ref._id}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-dark-secondary/60 border border-dark-border rounded-lg p-4"
                    >
                      <div>
                        <p className="text-white font-semibold">Usuario: {ref.referredUserId}</p>
                        <p className="text-xs text-dark-muted">Plan {ref.planTier.toUpperCase()} • {formatMoney(ref.priceCents)}</p>
                      </div>
                      <div className="text-sm text-primary font-bold">
                        +{formatMoney(ref.estimatedEarningsCents)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
