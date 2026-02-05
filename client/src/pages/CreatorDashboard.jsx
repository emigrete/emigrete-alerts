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

  const formatMoney = (cents, currency = 'USD') => {
    if (currency === 'ARS') {
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format((cents || 0) / 100);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
  };

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
          toast.warning('No tenés rol de creador asignado');
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
    return null;
  }

  if (!profile) {
    return (
      <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
        {/* Líneas decorativas sutiles */}
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

        <div className="max-w-7xl mx-auto relative z-10">
          <Header username={username} userId={userId} onLogout={handleLogout} title="Mi Código" />
          <Navigation />
          <div className="bg-dark-card/70 border border-dark-border rounded-2xl p-8 text-center">
            <p className="text-dark-muted text-lg">No tenés rol de creador</p>
            <p className="text-dark-muted text-sm mt-2">Contactá a un administrador</p>
          </div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const totalEarnings = referrals.reduce((sum, ref) => sum + (ref.estimatedEarningsCents || 0), 0);
  // Separar por moneda (ARS para Mercado Pago, USD para PayPal en el futuro)
  const earningsARS = referrals
    .filter(ref => ref.paymentProvider === 'mercadopago' || !ref.paymentProvider)
    .reduce((sum, ref) => sum + (ref.estimatedEarningsCents || 0), 0);
  const earningsUSD = referrals
    .filter(ref => ref.paymentProvider === 'paypal')
    .reduce((sum, ref) => sum + (ref.estimatedEarningsCents || 0), 0);

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
      {/* Líneas decorativas sutiles */}
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

      <div className="max-w-7xl mx-auto relative z-10">
        <Header username={username} userId={userId} onLogout={handleLogout} title="Mi Código de Creador" />
        <Navigation isCreator={true} />

        {/* CÓDIGO */}
        <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/40 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl shadow-yellow-500/10">
          {/* Decoraciones de fondo */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-orange-500/30 to-yellow-500/30 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">Tu código exclusivo</p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="text-7xl md:text-8xl font-mono font-extrabold bg-gradient-to-r from-yellow-200 via-yellow-100 to-orange-200 bg-clip-text text-transparent tracking-widest drop-shadow-2xl" style={{letterSpacing: '0.15em'}}>
                  {profile.code}
                </div>
                <p className="text-yellow-400/70 text-sm mt-2 font-semibold">Compartí tu código y comenzá a generar ingresos</p>
              </div>
              <button
                onClick={handleCopy}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-bg rounded-xl hover:from-yellow-400 hover:to-orange-400 font-black text-lg transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105 active:scale-95"
              >
                Copiar Código
              </button>
            </div>
            
            {shareLink && (
              <div className="relative">
                <input
                  readOnly
                  value={shareLink}
                  onClick={(e) => e.target.select()}
                  className="w-full bg-dark-bg/80 backdrop-blur-sm border-2 border-yellow-500/30 px-5 py-4 rounded-xl text-yellow-300 text-sm font-mono focus:outline-none focus:border-yellow-500/60 transition-all cursor-pointer hover:border-yellow-500/50"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500/50 text-xs font-bold">
                  Hacé clic para seleccionar
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CÓMO FUNCIONAN LAS COMISIONES */}
        <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-yellow-500/30 rounded-3xl p-8 mb-8 relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/5 to-yellow-500/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              Cómo Ganas Dinero
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1 */}
            <div className="bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-4 left-4 w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 text-dark-bg rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-yellow-500/50 group-hover:scale-125 transition-transform z-20 border-2 border-yellow-400">
                1
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl -z-10" />
              <h4 className="text-yellow-400 font-black mb-3 text-xl mt-14 relative z-10">Descuento para Usuarios</h4>
              <p className="text-dark-muted text-sm leading-relaxed relative z-10">
                Quien use tu código recibe automáticamente <span className="text-yellow-400 font-bold">10% de descuento permanente</span> en todas sus suscripciones.
              </p>
            </div>
            
            {/* Card 2 */}
            <div className="bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-500/20 hover:border-orange-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-4 left-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 text-dark-bg rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/50 group-hover:scale-125 transition-transform z-20 border-2 border-orange-400">
                2
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl -z-10" />
              <h4 className="text-orange-400 font-black mb-3 text-xl mt-14 relative z-10">Tu Comisión Mensual</h4>
              <p className="text-dark-muted text-sm leading-relaxed mb-3 relative z-10">
                Por cada suscriptor activo, <span className="text-orange-400 font-bold">ganás el 20%</span> de su pago mensual:
              </p>
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 bg-dark-secondary/50 rounded-lg px-3 py-2 border border-orange-500/10">
                  <span className="text-blue-400 font-mono text-xs">PRO</span>
                  <span className="text-dark-muted text-xs">$7.500</span>
                  <span className="text-dark-muted text-xs">→</span>
                  <span className="text-orange-400 font-bold text-sm">$1.500/mes</span>
                </div>
                <div className="flex items-center gap-2 bg-dark-secondary/50 rounded-lg px-3 py-2 border border-orange-500/10">
                  <span className="text-purple-400 font-mono text-xs">PREMIUM</span>
                  <span className="text-dark-muted text-xs">$15.000</span>
                  <span className="text-dark-muted text-xs">→</span>
                  <span className="text-orange-400 font-bold text-sm">$3.000/mes</span>
                </div>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-500/20 hover:border-yellow-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-4 left-4 w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 text-dark-bg rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-yellow-500/50 group-hover:scale-125 transition-transform z-20 border-2 border-yellow-400">
                3
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl -z-10" />
              <h4 className="text-yellow-400 font-black mb-3 text-xl mt-14 relative z-10">Ganancias Recurrentes</h4>
              <p className="text-dark-muted text-sm leading-relaxed relative z-10">
                Mientras tu referido mantenga su suscripción activa, <span className="text-yellow-400 font-bold">vos seguís ganando cada mes</span>. Si cancela, se pausa automáticamente.
              </p>
            </div>
            
            {/* Card 4 */}
            <div className="bg-dark-card/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-500/20 hover:border-orange-500/40 transition-all group relative overflow-hidden">
              <div className="absolute top-4 left-4 w-14 h-14 bg-gradient-to-br from-orange-500 to-yellow-500 text-dark-bg rounded-full flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/50 group-hover:scale-125 transition-transform z-20 border-2 border-orange-400">
                4
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl -z-10" />
              <h4 className="text-orange-400 font-black mb-3 text-xl mt-14 relative z-10">Cómo Compartir</h4>
              <p className="text-dark-muted text-sm leading-relaxed relative z-10">
                Usá tu enlace en <span className="text-orange-400 font-bold">redes sociales, Discord, Twitch</span> o donde prefieras. El código se aplica automáticamente al hacer clic.
              </p>
            </div>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-dark-card to-dark-secondary border-2 border-yellow-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/40 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-dark-muted text-sm font-bold">Usuarios Referidos</p>
            </div>
            <p className="text-6xl font-black text-yellow-400 mb-1">{referrals.length}</p>
            <p className="text-yellow-500/60 text-xs font-semibold">Referidos activos en total</p>
          </div>
          
          <div className="bg-gradient-to-br from-dark-card to-dark-secondary border-2 border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-dark-muted text-sm font-bold">Ganancias ARS</p>
            </div>
            <p className="text-5xl font-black text-cyan-400 mb-1">{formatMoney(earningsARS, 'ARS')}</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-cyan-500/10 rounded text-xs text-cyan-400 font-bold border border-cyan-500/20">Mercado Pago</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-dark-card to-dark-secondary border-2 border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center opacity-50">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-dark-muted text-sm font-bold opacity-50">Ganancias USD</p>
            </div>
            <p className="text-4xl font-black text-blue-400 mb-1 opacity-50">Próximamente</p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/10 rounded text-xs text-blue-400 font-bold border border-blue-500/20 opacity-50">PayPal</span>
            </div>
          </div>
        </div>

        {/* REFERRALS */}
        {referrals.length > 0 && (
          <div className="bg-dark-card/70 border-2 border-dark-border rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white">Tus Referidos</h3>
              <span className="ml-auto px-3 py-1 bg-primary/10 border border-primary/30 rounded-full text-primary font-bold text-sm">
                {referrals.length} activos
              </span>
            </div>
            
            <div className="space-y-3 relative z-10">
              {referrals.map((ref) => (
                <div 
                  key={ref._id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-dark-secondary/80 to-dark-secondary/50 backdrop-blur-sm rounded-xl border-2 border-dark-border/50 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-4 mb-3 md:mb-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-bold">{ref.referredUserId.substring(0, 12)}...</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          ref.planTier === 'premium' 
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {ref.planTier === 'pro' ? 'PRO' : 'PREMIUM'}
                        </span>
                        <span className="text-dark-muted text-xs">
                          {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : 'Fecha desconocida'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-dark-muted font-semibold mb-1">Tu comisión mensual</p>
                      <p className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        {formatMoney(ref.estimatedEarningsCents)}
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <div className="bg-gradient-to-br from-dark-card/50 to-dark-secondary/50 border-2 border-dashed border-dark-border rounded-3xl p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Aún no tenés referidos</h3>
              <p className="text-dark-muted mb-6 max-w-md mx-auto">
                Comenzá a compartir tu código para generar comisiones mensuales recurrentes
              </p>
              <button
                onClick={handleCopy}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-bg rounded-xl hover:from-yellow-400 hover:to-orange-400 font-bold transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
              >
                Copiar mi enlace
              </button>
            </div>
          </div>
        )}

        {/* AGRADECIMIENTO */}
        <div className="bg-gradient-to-br from-dark-card/80 via-dark-secondary/60 to-dark-card/80 border-2 border-primary/20 rounded-3xl p-10 md:p-14 relative overflow-hidden mt-12">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/5 to-pink-500/5 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/5 to-primary/5 rounded-full blur-3xl -z-0" />
          
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-black mb-6 bg-gradient-to-r from-primary via-pink-500 to-primary bg-clip-text text-transparent">
              Gracias por ser parte de esto
            </h3>
            <div className="space-y-4 text-dark-muted leading-relaxed">
              <p className="text-lg">
                Tu compromiso como creador es lo que hace posible que cada día más streamers descubran nuevas formas de monetizar su contenido. Valoramos tu dedicación y la confianza que depositás en nosotros.
              </p>
              <p className="text-sm md:text-base">
                Cada referido que compartís, cada comisión generada, es un paso más en la construcción de una comunidad de creadores de contenido que creen en potenciar sus propios proyectos. Seguiremos innovando para brindarte las mejores herramientas y oportunidades.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-dark-border/30">
              <p className="text-dark-muted/70 text-xs md:text-sm font-semibold">
                El equipo de WelyAlerts
              </p>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

