import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const plans = [
    {
      name: '🆓 FREE',
      price: '0',
      description: 'Perfecto para empezar',
      color: 'from-gray-500 to-gray-600',
      limits: [
        { label: 'Alertas/mes', value: '20' },
        { label: 'Caracteres TTS/mes', value: '2.000' },
        { label: 'Voces disponibles', value: '2' },
        { label: 'Storage total', value: '100 MB' },
        { label: 'Tamaño máx de archivo', value: '5 MB' },
      ],
      cta: 'Tu plan actual',
      ctaColor: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      name: '⭐ PRO',
      price: '4.99',
      description: 'Para creadores activos',
      color: 'from-blue-500 to-blue-600',
      limits: [
        { label: 'Alertas/mes', value: '100' },
        { label: 'Caracteres TTS/mes', value: '20.000' },
        { label: 'Voces disponibles', value: 'Todas' },
        { label: 'Storage total', value: '1 GB' },
        { label: 'Tamaño máx de archivo', value: '30 MB' },
      ],
      cta: 'Upgrade a PRO',
      ctaColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50'
    },
    {
      name: '👑 PREMIUM',
      price: '9.99',
      description: 'Sin límites, máximo control',
      color: 'from-purple-500 via-pink-500 to-purple-600',
      limits: [
        { label: 'Alertas/mes', value: '∞ Ilimitadas' },
        { label: 'Caracteres TTS/mes', value: '∞ Ilimitados' },
        { label: 'Voces disponibles', value: 'Todas' },
        { label: 'Storage total', value: '10 GB' },
        { label: 'Tamaño máx de archivo', value: '500 MB' },
      ],
      cta: 'Upgrade a PREMIUM',
      ctaColor: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 hover:shadow-lg hover:shadow-pink-500/50'
    }
  ];

  return (
    <div className="min-h-screen text-dark-text p-5 lg:p-12 relative overflow-hidden">
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
                plan.name.includes('PREMIUM')
                  ? `border-pink-500/50 bg-gradient-to-br from-dark-card to-dark-secondary shadow-2xl shadow-pink-500/20 scale-105`
                  : `border-dark-border/50 bg-dark-card/50`
              }`}
            >
              {/* Badge "Popular" en PREMIUM */}
              {plan.name.includes('PREMIUM') && (
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
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  {plan.price !== '0' && (
                    <span className="text-dark-muted text-sm ml-2">/mes</span>
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
                  disabled={plan.name.includes('FREE')}
                  className={`w-full text-white font-bold py-3 px-6 rounded-xl transition-all text-sm ${
                    plan.name.includes('FREE') ? 'opacity-50 cursor-not-allowed bg-gray-500' : plan.ctaColor
                  }`}
                >
                  {plan.name.includes('FREE') ? 'Tu plan actual' : 'Próximamente'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ o Info */}
        <div className="bg-dark-card/50 border border-dark-border rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Preguntas Frecuentes</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-primary mb-2">¿Cómo funcionan los límites?</h3>
              <p className="text-dark-muted text-sm">
                Cada plan tiene dos tipos de límites: <strong>tamaño máximo por archivo</strong> (individual) y <strong>almacenamiento total</strong> (acumulado). Alertas y TTS se renuevan mensualmente, storage no.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Qué diferencia hay entre Storage y Tamaño de archivo?</h3>
              <p className="text-dark-muted text-sm">
                <strong>Tamaño máx de archivo</strong>: límite por cada video/audio que subas. <strong>Storage total</strong>: suma de todo lo que has subido. Ejemplo: PRO permite archivos de 30MB pero tienes 1GB total.
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
                Sí, puedes cambiar en cualquier momento. Los cambios se aplican inmediatamente y se ajusta tu próxima facturación.
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
      </div>
    </div>
  );
}
