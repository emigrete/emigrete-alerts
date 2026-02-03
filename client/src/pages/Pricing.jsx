import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function PricingPage() {
  const plans = [
    {
      name: 'FREE',
      price: '0',
      description: 'Perfecto para empezar',
      color: 'from-gray-500 to-gray-600',
      features: [
        { text: '20 alertas', included: true },
        { text: '2000 caracteres TTS/mes', included: true },
        { text: '3 voces IA', included: true },
        { text: '100 MB de storage', included: true },
        { text: 'Webhooks', included: false },
        { text: 'API access', included: false },
        { text: 'Analytics avanzado', included: false },
      ],
      cta: 'Comenzar',
      ctaColor: 'bg-gray-500 hover:bg-gray-600'
    },
    {
      name: 'PRO',
      price: '4.99',
      description: 'Para creadores activos',
      color: 'from-blue-500 to-blue-600',
      features: [
        { text: '100 alertas', included: true },
        { text: '20,000 caracteres TTS/mes', included: true },
        { text: '10 voces IA', included: true },
        { text: '1 GB de storage', included: true },
        { text: 'Webhooks', included: true },
        { text: 'API access', included: false },
        { text: 'Analytics avanzado', included: false },
      ],
      cta: 'Upgrade a PRO',
      ctaColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/50'
    },
    {
      name: 'PREMIUM',
      price: '9.99',
      description: 'Sin límites, máximo control',
      color: 'from-purple-500 to-pink-500',
      features: [
        { text: 'Alertas ilimitadas', included: true },
        { text: 'TTS ilimitado', included: true },
        { text: 'Todas las voces IA', included: true },
        { text: '10 GB de storage', included: true },
        { text: 'Webhooks', included: true },
        { text: 'API access', included: true },
        { text: 'Analytics avanzado', included: true },
      ],
      cta: 'Upgrade a PREMIUM',
      ctaColor: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/50'
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
                plan.name === 'PREMIUM'
                  ? `border-pink-500/50 bg-gradient-to-br from-dark-card to-dark-secondary shadow-2xl shadow-pink-500/20 scale-105`
                  : `border-dark-border/50 bg-dark-card/50`
              }`}
            >
              {/* Badge "Popular" en PREMIUM */}
              {plan.name === 'PREMIUM' && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
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

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-3">
                      {feature.included ? (
                        <span className="text-green-500 text-lg">✓</span>
                      ) : (
                        <span className="text-dark-muted/50 text-lg">✗</span>
                      )}
                      <span className={feature.included ? 'text-dark-text' : 'text-dark-muted/50'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  disabled
                  className={`w-full text-white font-bold py-3 px-6 rounded-xl transition-all text-sm opacity-50 cursor-not-allowed ${plan.ctaColor}`}
                >
                  {plan.name === 'FREE' ? 'Tu plan actual' : 'Próximamente'}
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
              <h3 className="font-bold text-primary mb-2">¿Puedo cambiar de plan?</h3>
              <p className="text-dark-muted text-sm">
                Sí, puedes upgraar o downgradar en cualquier momento. Los cambios se aplican inmediatamente.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Se renueva automáticamente?</h3>
              <p className="text-dark-muted text-sm">
                Sí, tu suscripción se renueva automáticamente cada mes. Puedes cancelar cuando quieras.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Hay período de prueba?</h3>
              <p className="text-dark-muted text-sm">
                El plan FREE es permanente. Prueba PRO y PREMIUM sin compromiso.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-dark-muted text-sm">
                Tarjeta de crédito, débito y wallets digitales via Stripe.
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
