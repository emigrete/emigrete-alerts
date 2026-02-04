# 🔍 Auditoría: Lógica de Pagos y Suscripciones

## ✅ ¿QUÉ FUNCIONA CORRECTAMENTE?

### 1. **Cambio Automático de TIER después de pago** ✅
```
Usuario paga en Mercado Pago
    ↓
Mercado Pago notifica a /webhook/mercadopago
    ↓
updateSubscriptionAndReferral() ejecuta:
    ├─ tier = planTier ✅ (PRO o PREMIUM)
    ├─ status = 'active' ✅
    ├─ currentPeriodEnd = ahora + 30 días ✅
    └─ Si tiene código creador:
       ├─ Crea CreatorReferral ✅
       └─ Suma earnings ✅
```

**Resultado:** El usuario AUTOMÁTICAMENTE tiene el nuevo plan en la BD.

---

### 2. **Protección de Downgrade** ✅
```javascript
// POST /api/subscription/change-plan
if (tierHierarchy[newTier] < tierHierarchy[current]) {
  // ES DOWNGRADE
  if (currentPeriodEnd > today) {
    // Períod o NO TERMINÓ
    return 403 ❌ "No puedes bajar de plan"
  }
}
```

**Resultado:** Usuario no puede bajar de plan en medio del período (protección correcta).

---

### 3. **Cancelación de Suscripción** ✅ (Parcial)
```javascript
POST /api/subscription/change-plan
Body: { newTier: 'free' }
    ↓
Limpia:
├─ tier = 'free'
├─ stripeSubscriptionId = null ✅
├─ stripeCustomerId = null ✅
└─ currentPeriodEnd = null ✅
```

**Resultado:** El usuario PUEDE cancelar en la BD, pero...

---

## ❌ PROBLEMAS ENCONTRADOS

### PROBLEMA 1: **REFRESH INEFECTIVO DESPUÉS DEL PAGO** 🚨
**Ubicación:** Frontend después de checkout

```
Usuario completa pago en Mercado Pago
    ↓
Redirección a: /pricing?success=1
    ↓
Toast muestra: "Pago completado. Tu suscripción se activará en breve."
    ↓
PROBLEMA: SubscriptionStatus NO se refresca automáticamente
    ├─ useEffect solo se ejecuta si userId cambia
    ├─ El webhook es ASINCRÓNICO (puede tardar 5-30 segundos)
    └─ Usuario ve el plan VIEJO hasta F5 (refresh manual)
```

**Causa Raíz:**
- El webhook de Mercado Pago se ejecuta en background
- El frontend NO espera a que se complete
- `SubscriptionStatus.jsx` solo fetcha al montar con `userId`

---

### PROBLEMA 2: **UPGRADE DE PLAN NO AUTOMATIZADO** ⚠️
**Ubicación:** Lógica de cambio de plan

```
Usuario quiere upgrade (PRO → PREMIUM)
    ↓
OPCIÓN A - El usuario DEBE hacer checkout nuevamente
├─ POST /api/subscription/change-plan (existe) ✅
├─ PERO: Mercado Pago NO PERMITE cambio automático de plan
├─ El usuario debe ir a /pricing nuevamente
└─ El usuario PAGA NUEVAMENTE (sin prorrateado)

OPCIÓN B - Prorrateado
└─ NO ESTÁ IMPLEMENTADO ❌
   (Mercado Pago no prorratea automáticamente)
```

**Problema:**
- Usuario que paga el 5 de febrero por PRO
- Quiere upgrade a PREMIUM el 10 de febrero
- DEBE pagar el precio completo de PREMIUM
- No hay descuento por los días restantes

---

### PROBLEMA 3: **CANCELACIÓN NO IMPLEMENTADA EN MERCADO PAGO** ❌
**Ubicación:** Integración con Mercado Pago

```
Usuario quiere cancelar suscripción
    ↓
La BD: Ya tiene endpoint change-plan ✅
    └─ Cambia tier a 'free'
    
Pero Mercado Pago:
    ├─ NO hay lógica para llamar a Mercado Pago ❌
    ├─ La suscripción SIGUE ACTIVA en Mercado Pago ❌
    └─ El próximo mes VOLVERÁ a cobrar ❌ (error grave)
```

**Escenario problemático:**
1. Usuario se suscribe (paga) ✅
2. Usuario cancela en la app (cambia a free) ✅
3. Usuario CREE que está cancelado
4. **MÁS TARDE:** Mercado Pago cobra nuevamente ❌
5. Usuario ve un cargo no solicitado 😠

---

### PROBLEMA 4: **SIN SINCRONIZACIÓN DE ESTADO** ⚠️
**Ubicación:** Webhook y BD

```
Mercado Pago externa:
├─ La suscripción está activa/cancelada/vencida
└─ Pero la app NO SABE hasta que:
   ├─ El webhook se ejecuta (pasivo), O
   └─ El usuario recarga la página (requiere acción)

Problema:
├─ Usuario ve "Plan PRO" en el frontend
├─ Mercado Pago ya le canceló (por error en pago)
└─ Usuario NO lo sabe hasta que usa el app ❌
```

---

## 📊 TABLA DE ESTADO

| Acción | ¿Funciona? | Detalles |
|--------|-----------|----------|
| **Pagar por plan** | ✅ | Webhook actualiza BD correctamente |
| **Cambio de tier en BD** | ✅ | Automático al webhook |
| **Refresh en UI** | ❌ | No se actualiza hasta F5 |
| **Upgrade de plan** | ⚠️ | Requiere nuevo checkout |
| **Downgrade con protección** | ✅ | Bloquea durante período |
| **Cancelación en BD** | ✅ | Cambia a 'free' |
| **Cancelación en Mercado Pago** | ❌ | NO IMPLEMENTADO |
| **Prorrateado en upgrade** | ❌ | NO IMPLEMENTADO |
| **Sincronización BD ↔ MP** | ❌ | Solo unidireccional |

---

## 🔧 SOLUCIONES NECESARIAS

### SOLUCIÓN 1: Mejorar Refresh del Frontend
```javascript
// En Pricing.jsx useEffect
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  if (params.get('success') === '1') {
    // ESPERAR a que el webhook se complete
    let retries = 0;
    const maxRetries = 12; // 60 segundos con polls cada 5s
    
    const pollSubscription = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/subscription/status`, {
          params: { userId }
        });
        
        // Verificar si la suscripción realmente cambió
        if (res.data?.subscription?.tier !== 'free') {
          // ✅ La suscripción se actualizó
          toast.success('Bienvenido a tu nuevo plan!');
          // FUERZA REFRESH de componentes
          window.location.reload();
          return;
        }
        
        // Aún no se actualizó, reintentar
        if (retries < maxRetries) {
          retries++;
          setTimeout(pollSubscription, 5000);
        } else {
          // Después de 60s, asumir que el webhook está lento
          toast.info('Por favor recarga la página para ver los cambios');
        }
      } catch (error) {
        console.error('Error polling subscription:', error);
      }
    };
    
    // Esperar 2 segundos antes de empezar a chequear
    setTimeout(pollSubscription, 2000);
  }
}, []);
```

---

### SOLUCIÓN 2: Implementar Cancelación en Mercado Pago
```javascript
// NUEVA RUTA: POST /api/billing/cancel-subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { userId, adminId } = req.body;
    
    // Obtener suscripción
    const subscription = await Subscription.findOne({ userId });
    if (!subscription?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'Sin suscripción activa' });
    }
    
    const preapprovalId = subscription.stripeSubscriptionId;
    
    // CANCELAR en Mercado Pago
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'cancelled'
        })
      }
    );
    
    if (!response.ok) {
      console.error('Error cancelando en MP:', await response.json());
      return res.status(500).json({ error: 'No se pudo cancelar en Mercado Pago' });
    }
    
    // ACTUALIZAR en BD
    subscription.tier = 'free';
    subscription.status = 'canceled';
    subscription.stripeSubscriptionId = null;
    subscription.currentPeriodEnd = null;
    await subscription.save();
    
    console.log(`✅ Suscripción ${preapprovalId} cancelada`);
    res.json({ success: true, message: 'Suscripción cancelada' });
    
  } catch (error) {
    console.error('Error en cancelación:', error);
    res.status(500).json({ error: 'Error cancelando suscripción' });
  }
});
```

---

### SOLUCIÓN 3: Implementar Upgrade de Plan
```javascript
// NUEVA RUTA: POST /api/billing/upgrade-subscription
router.post('/upgrade-subscription', async (req, res) => {
  try {
    const { userId, newTier } = req.body;
    
    const subscription = await Subscription.findOne({ userId });
    
    // Validar jerarquía
    const tierHierarchy = { free: 0, pro: 1, premium: 2 };
    if (tierHierarchy[newTier] <= tierHierarchy[subscription?.tier || 'free']) {
      return res.status(400).json({ error: 'Solo puedes hacer upgrade' });
    }
    
    // Para upgrade: crear NUEVO checkout
    // El usuario paga la diferencia (calcular prorrateado)
    const currentDaysUsed = subscription?.currentPeriodEnd 
      ? Math.floor((new Date(subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // TODO: Implementar prorrateado
    // Por ahora, redirigir a checkout normal
    
    return res.json({
      message: 'Ve a /pricing para completar el upgrade',
      newTier,
      daysRemaining: currentDaysUsed
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Error en upgrade' });
  }
});
```

---

### SOLUCIÓN 4: Sincronización Periódica
```javascript
// En server/index.js - Cada hora chequear suscripciones
setInterval(async () => {
  try {
    const subscriptions = await Subscription.find({ status: 'active' });
    
    for (const sub of subscriptions) {
      // Consultar estado en Mercado Pago
      const mpData = await fetch(`https://api.mercadopago.com/preapproval/${sub.stripeSubscriptionId}`, {
        headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
      }).then(r => r.json());
      
      // Si en MP está cancelado pero en BD está activo, actualizar
      if (mpData.status === 'cancelled' && sub.status === 'active') {
        sub.status = 'canceled';
        sub.tier = 'free';
        await sub.save();
        console.log(`⚠️ Suscripción ${sub.userId} sincronizada (cancelada en MP)`);
      }
    }
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}, 60 * 60 * 1000); // Cada hora
```

---

## 📋 RESUMEN EJECUTIVO

### ¿Se cambia el rol automáticamente?
**SÍ ✅** - El webhook lo hace de forma automática.

### ¿Se refresca?
**NO ❌** - El usuario ve el plan viejo hasta hacer reload manual.

### ¿Puede hacer upgrade?
**SÍ ⚠️** - Pero requiere nuevo checkout y pagar el precio completo (sin prorrateado).

### ¿Puede cancelar?
**PARCIALMENTE ❌** - La BD sí, pero Mercado Pago sigue cobrando.

---

## 🚨 IMPACTO EN NEGOCIO

| Riesgo | Severidad | Descripción |
|--------|-----------|------------|
| Cobros duplicados | 🔴 CRÍTICO | Usuario cancela pero MP sigue cobrando |
| Experiencia lenta | 🟡 MEDIO | Usuario ve plan viejo durante 5-30s |
| Falta de upgrade | 🟡 MEDIO | Usuario debe hacer nuevo pago |
| Desincronización | 🟠 ALTO | BD ≠ Mercado Pago |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Implementar polling en frontend post-checkout
- [ ] Crear POST /api/billing/cancel-subscription
- [ ] Crear POST /api/billing/upgrade-subscription  
- [ ] Implementar sincronización horaria
- [ ] Agregar manejo de errores en webhook
- [ ] Documentar limita ciones de Mercado Pago
- [ ] Crear dashboard para admin (ver sincronización)
- [ ] Agregar eventos y logs de suscripción
