import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { API_URL } from '../constants/config';
import { AppFooter } from '../components/AppFooter';
import { CheckoutModal } from '../components/CheckoutModal';

export default function PricingPage() {
  const [creatorCode, setCreatorCode] = useState('');
  const [planTier, setPlanTier] = useState('pro');
  const [applying, setApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(null); // null | 'pro' | 'premium'
  const userId = localStorage.getItem('twitchUserId');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setCreatorCode(ref);

    if (params.get('success') === '1') {
      toast.success('Pago completado. Tu suscripción se activará en breve.');
    }
    if (params.get('canceled') === '1') {
      toast.warning('Pago cancelado.');
    }

    // Verificar si el usuario es creador
    const checkCreatorStatus = async () => {
      if (!userId) return;
      try {
        const res = await axios.get(`${API_URL}/api/creator/profile?userId=${userId}`);
        if (res.data?.exists && res.data?.isAssigned) {
          setIsCreator(true);
        }
      } catch (error) {
        console.error('Error checking creator status:', error);
      }
    };
    checkCreatorStatus();
  }, [userId]);

  const handleApplyCode = async () => {
    if (!creatorCode.trim()) {
      toast.warning('Ingresá un código');
      return;
    }
    if (!userId) {
      toast.warning('Iniciá sesión para aplicar el código');
      return;
    }

    setApplying(true);
    const toastId = toast.loading('Aplicando código...');
    try {
      const res = await axios.post(`${API_URL}/api/creator/apply`, {
        userId,
        code: creatorCode,
        planTier
      });
      setAppliedDiscount({
        code: res.data.normalizedCode || creatorCode.toUpperCase(),
        discountRate: res.data.discountRate,
        planTier
      });
      toast.success('Código aplicado', { id: toastId });
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudo aplicar el código', { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  const handleClickCheckout = (tier) => {
    if (!userId) {
      toast.warning('Iniciá sesión para suscribirte');
      return;
    }
    // Mostrar modal para código
    setShowCodeModal(tier);
  };

  const getDisplayPrice = (plan) => {
    if (plan.price === 0) return '0';
    if (!appliedDiscount) return plan.price.toFixed(2);

    const planKey = plan.name.toLowerCase();
    if (planKey !== appliedDiscount.planTier) return plan.price.toFixed(2);
    const discounted = plan.price * (1 - appliedDiscount.discountRate);
    return discounted.toFixed(2);
  };

  const plans = [
    {
      name: 'FREE',
      price: 0,
      description: 'Perfecto para empezar',
      color: 'from-gray-500 to-gray-600',
      limits: [
        { label: 'Alertas/mes', value: '20' },
        { label: 'Caracteres TTS/mes', value: '2.000' },
        { label: 'Voces disponibles', value: '2' },
        { label: 'Storage total', value: '100 MB' },
        { label: 'Tamaño máx de archivo', value: '5 MB' },
        { label: 'Bandwidth/mes', value: '500 MB' },
      ],
      cta: 'Tu plan actual',
      ctaColor: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      name: 'PRO',
      price: 4.99,
      description: 'Para creadores activos',
      color: 'from-blue-500 to-blue-600',
      limits: [
        { label: 'Alertas/mes', value: '100' },
        { label: 'Caracteres TTS/mes', value: '20.000' },
        { label: 'Voces disponibles', value: '5' },
        { label: 'Storage total', value: '1 GB' },
        { label: 'Tamaño máx de archivo', value: '30 MB' },
        { label: 'Bandwidth/mes', value: '5 GB' },
      ],
      ctaColor: 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/50'
    },
    {
      name: 'PREMIUM',
      price: 9.99,
      description: 'Sin límites, máximo control',
      color: 'from-purple-500 via-pink-500 to-purple-600',
      limits: [
        { label: 'Alertas/mes', value: '∞ Ilimitadas' },
        { label: 'Caracteres TTS/mes', value: '∞ Ilimitados' },
        { label: 'Voces disponibles', value: '10' },
        { label: 'Storage total', value: '10 GB' },
        { label: 'Bandwidth/mes', value: '50 GB' },
        { label: 'Tamaño máx de archivo', value: '500 MB' },
      ],
      ctaColor: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-pink-500/50'
    }
  ];

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
      <Toaster position="top-right" theme="dark" richColors />
      {/* Fondo decorativo */}
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-pink-500 to-cyan-500 bg-clip-text text-transparent mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-dark-muted text-xl">
            Elige el plan perfecto para tu stream
          </p>
        </div>

        {/* Planes */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl border-2 overflow-hidden transition-all hover:shadow-2xl ${
                plan.name === 'PREMIUM'
                  ? `border-pink-500/50 bg-gradient-to-br from-dark-card to-dark-secondary shadow-2xl shadow-pink-500/20 scale-105`
                  : `border-dark-border/50 bg-dark-card/50`
              }`}
            >
              {/* Badge "Popular" en PREMIUM */}
              {plan.name === 'PREMIUM' && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  MÁS POPULAR
                </div>
              )}

              <div className={`bg-gradient-to-r ${plan.color} h-1`} />

              <div className="p-8">
                {/* Nombre y precio */}
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <p className="text-dark-muted text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-white">${getDisplayPrice(plan)}</span>
                    {plan.price !== 0 && (
                      <span className="text-dark-muted text-sm">/mes USD</span>
                    )}
                  </div>
                  {plan.price !== 0 && (
                    <p className="text-xs text-dark-muted mt-2">
                      ≈ ${(getDisplayPrice(plan) * 1450).toFixed(0)} ARS/mes
                    </p>
                  )}
                  {appliedDiscount && plan.price !== 0 && plan.name.toLowerCase() === appliedDiscount.planTier && (
                    <div className="text-xs text-green-400 mt-2">
                      Antes <span className="line-through text-dark-muted">${plan.price.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Límites/Cuotas */}
                <div className="space-y-4 mb-8">
                  {plan.limits.map((limit, lidx) => (
                    <div key={lidx} className="flex items-center justify-between p-3 rounded-lg bg-dark-secondary/50 border border-dark-border">
                      <span className="text-sm text-dark-muted">{limit.label}</span>
                      <span className="font-bold text-white text-lg">{limit.value}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  disabled={plan.name === 'FREE'}
                  className={`w-full text-white font-bold py-3 px-6 rounded-xl transition-all text-sm ${
                    plan.name === 'FREE' 
                      ? 'opacity-50 cursor-not-allowed bg-gray-500' 
                      : plan.ctaColor
                  }`}
                  onClick={() => plan.name !== 'FREE' && handleClickCheckout(plan.name.toLowerCase())}
                >
                  {plan.name === 'FREE'
                    ? 'Tu plan actual'
                    : checkoutPlan === plan.name.toLowerCase()
                    ? 'Redirigiendo...'
                    : 'Suscribirse'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EJEMPLOS PRÁCTICOS */}
        <div className="bg-gradient-to-r from-primary/10 via-pink-500/10 to-cyan-500/10 border border-primary/30 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">¿Cuánto Rinde Cada Plan?</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* FREE Plan Examples */}
            <div className="bg-dark-card/50 rounded-xl p-6 border border-gray-500/30">
              <h3 className="text-gray-400 font-bold mb-4 text-lg">Plan FREE</h3>
              <div className="space-y-3 text-sm text-dark-muted">
                <div>
                  <p className="font-semibold text-gray-300 mb-1">20 Alertas/mes</p>
                  <p className="text-xs">Para 4-5 streams semanales con triggers simples</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300 mb-1">2,000 Caracteres TTS/mes</p>
                  <p className="text-xs">~40 mensajes TTS cortos (50 chars c/u)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300 mb-1">100 MB Storage</p>
                  <p className="text-xs">Máx. 5 MB por archivo: hasta ~20 archivos de 5 MB (o más archivos si son más pequeños)</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-300 mb-1">500 MB Bandwidth/mes</p>
                  <p className="text-xs">~10-15 horas de streaming con reproducciones ocasionales</p>
                </div>
              </div>
            </div>

            {/* PRO Plan Examples */}
            <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
              <h3 className="text-blue-400 font-bold mb-4 text-lg">Plan PRO</h3>
              <div className="space-y-3 text-sm text-dark-muted">
                <div>
                  <p className="font-semibold text-blue-300 mb-1">100 Alertas/mes</p>
                  <p className="text-xs">Para 20-25 streams semanales con múltiples triggers</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-300 mb-1">20,000 Caracteres TTS/mes</p>
                  <p className="text-xs">~400 mensajes TTS (50 chars c/u) o 20 largos por stream</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-300 mb-1">1 GB Storage</p>
                  <p className="text-xs">Máx. 30 MB por archivo: hasta ~34 archivos de 30 MB (o más archivos si son más pequeños)</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-300 mb-1">5 GB Bandwidth/mes</p>
                  <p className="text-xs">~100-150 horas de streaming con reproducción frecuente</p>
                </div>
              </div>
            </div>

            {/* PREMIUM Plan Examples */}
            <div className="bg-purple-500/10 rounded-xl p-6 border border-purple-500/30">
              <h3 className="text-purple-400 font-bold mb-4 text-lg">Plan PREMIUM</h3>
              <div className="space-y-3 text-sm text-dark-muted">
                <div>
                  <p className="font-semibold text-purple-300 mb-1">Alertas Ilimitadas</p>
                  <p className="text-xs">Streams 24/7 con todos los triggers que necesites</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-300 mb-1">TTS Ilimitado</p>
                  <p className="text-xs">Miles de mensajes, anuncios dinámicos sin restricción</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-300 mb-1">10 GB Storage</p>
                  <p className="text-xs">Máx. 500 MB por archivo: hasta ~20 archivos de 500 MB (o más archivos si son más pequeños)</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-300 mb-1">50 GB Bandwidth/mes</p>
                  <p className="text-xs">~1000+ horas de streaming o distribución a muchos usuarios</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-dark-card rounded-lg border border-dark-border text-xs text-dark-muted">
            <p><strong>Nota:</strong> Los números son estimaciones basadas en uso promedio. Tu consumo real dependerá de la frecuencia de streams, tamaño de archivos y cantidad de usuarios. El <strong>Bandwidth</strong> se resetea cada mes. El <strong>Storage</strong> es acumulativo y además cada plan limita el <strong>tamaño máximo por archivo</strong>.</p>
          </div>
        </div>

        {/* FAQ o Info */}
        <div className="bg-dark-card/50 border border-dark-border rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Preguntas Frecuentes</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-primary mb-2">¿Cómo funcionan los límites?</h3>
              <p className="text-dark-muted text-sm">
                Cada plan tiene límites en: <strong>alertas</strong> (por mes), <strong>TTS</strong> (caracteres por mes), <strong>storage</strong> (total acumulado), <strong>archivo individual</strong> (tamaño máx) y <strong>bandwidth</strong> (ancho de banda por mes).
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Qué es el Bandwidth?</h3>
              <p className="text-dark-muted text-sm">
                Es el ancho de banda que usas cuando la gente descarga/reproduce tus archivos. Se resetea cada mes. Ejemplo: PRO tiene 5GB/mes, si tus videos se reproducen muchas veces, consumirán ese ancho de banda.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Qué pasa si excedo el límite?</h3>
              <p className="text-dark-muted text-sm">
                Si alcanzas el límite de archivo, no podrás subir ese video. Si alcanzas el storage total, deberás borrar alertas o upgraar tu plan.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-dark-muted text-sm">
                <strong>Cambios de plan gratuitos:</strong> No tienen costo adicional. <strong>Subidas de plan</strong> (FREE→PRO, FREE→PREMIUM, PRO→PREMIUM) se procesan inmediatamente. <strong>Bajadas de plan</strong> (PRO→FREE, PREMIUM→PRO, PREMIUM→FREE) se aplican al final de tu período de facturación actual, así no hay sorpresas.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Hay período de prueba?</h3>
              <p className="text-dark-muted text-sm">
                El plan FREE es permanente y sin límite de tiempo. Úsalo cuanto quieras para probar.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Link
            to="/"
            className="text-primary hover:text-pink-500 font-semibold transition"
          >
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Modal de Código */}
        <CheckoutModal
          isOpen={showCodeModal !== null}
          planTier={showCodeModal}
          onClose={() => setShowCodeModal(null)}
          userId={userId}
        />

        <AppFooter />
      </div>
    </div>
  );
}
