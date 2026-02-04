# 🎯 Configuración de 4 Planes en Mercado Pago

Ahora tu aplicación soporta **4 planes diferentes**:

## 📊 Estructura de Planes

| Plan | Precio | Cuándo se Usa |
|------|--------|---------------|
| **Pro Regular** | 7.900 ARS | Usuario SIN código de creador |
| **Pro Descuento** | 7.500 ARS | Usuario CON código de creador válido |
| **Premium Regular** | 16.000 ARS | Usuario SIN código de creador |
| **Premium Descuento** | 7.500 ARS | Usuario CON código de creador válido |

---

## ✅ IDs de Planes en Mercado Pago

Basándome en las pantallas que mostraste, ya tienes estos planes creados:

```
Pro Regular:           66b5d9e756f4c03390e6e9bae38455e7
Pro Descuento:         d6b8aee7a9c14e1098d95d5c6e4aa100
Premium Regular:       e21e871ac155448692d949831cc22f8e
Premium Descuento:     3164ecd9d2f340bf9a28810d341be437
```

---

## 🔧 Configurar el `.env`

En tu archivo `.env` (en la carpeta server), añade estas variables:

```env
# Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxx
MP_PREAPPROVAL_PLAN_PRO_ID=66b5d9e756f4c03390e6e9bae38455e7
MP_PREAPPROVAL_PLAN_PRO_DISCOUNT_ID=d6b8aee7a9c14e1098d95d5c6e4aa100
MP_PREAPPROVAL_PLAN_PREMIUM_ID=e21e871ac155448692d949831cc22f8e
MP_PREAPPROVAL_PLAN_PREMIUM_DISCOUNT_ID=3164ecd9d2f340bf9a28810d341be437

# O si usas PayPal (opcional):
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

---

## 🎬 Cómo Funciona Ahora

### Flujo de Checkout:

```
Usuario intenta suscribirse
    ↓
¿Tiene código de creador?
    ├─ SÍ y es válido → Usa plan CON DESCUENTO ✅
    └─ NO o es inválido → Usa plan sin DESCUENTO ✅
    ↓
Se crea la suscripción en Mercado Pago
    ↓
Si el código es válido:
  - Se registra la referencia del creador
  - Se suma a las ganancias estimadas del creador
```

---

## 📝 Ejemplo en el Frontend

El usuario va a `/pricing`, selecciona un plan y opcionalmente ingresa un código de creador:

```jsx
// El CheckoutModal enviará:
{
  userId: "123...",
  planTier: "pro",
  creatorCode: "WELYDEV",  // ← Opcional
  provider: "mercadopago"
}

// El servidor:
// 1. Valida que "WELYDEV" sea un código de creador válido
// 2. Si es válido → USA: d6b8aee7a9c14e1098d95d5c6e4aa100 (Pro Descuento)
// 3. Si NO es válido → USA: 66b5d9e756f4c03390e6e9bae38455e7 (Pro Regular)
```

---

## 🔍 Verificar Configuración

```bash
# Llama a este endpoint para ver el estado:
curl http://localhost:3000/api/billing/diagnostics
```

Deberías ver:
```json
{
  "mercadoPago": {
    "hasAccessToken": true,
    "planIds": {
      "pro": {
        "regular": "✅ 66b5d9e756f4c...",
        "withDiscount": "✅ d6b8aee7a9c14e..."
      },
      "premium": {
        "regular": "✅ e21e871ac15544...",
        "withDiscount": "✅ 3164ecd9d2f340..."
      }
    }
  }
}
```

---

## 🚀 Después de Configurar

1. **Actualiza el `.env`** con los 4 IDs de planes
2. **Obtén el Access Token** de Mercado Pago
3. **Reinicia el servidor**:
   ```bash
   docker-compose restart server
   # O: Ctrl+C y npm start
   ```
4. **Prueba el checkout** en `/pricing`

---

## 🧠 Lógica Nueva en el Código

### Server (billing.js)

```javascript
// La validación ahora retorna {valid, code}:
const creatorCodeResult = await ensureCreatorCode(creatorCode, userId);

// Selecciona automáticamente el plan:
const planVariant = creatorCodeResult.valid ? 'withDiscount' : 'regular';
const planId = MP_PLAN_IDS[planTier][planVariant];
```

### Webhooks

El webhook automáticamente detecta:
- Si la suscripción es con código de creador (en `external_reference`)
- Registra la referencia correctamente
- Actualiza las ganancias del creador

---

## 📋 Checklist antes de Lanzar

- ✅ Los 4 planes creados en Mercado Pago
- ✅ Los 4 IDs en el `.env`
- ✅ `MP_ACCESS_TOKEN` correcto
- ✅ Servidor reiniciado
- ✅ Endpoint `/api/billing/diagnostics` muestra ✅ en todos los planes
- ✅ Prueba con código de creador válido
- ✅ Prueba sin código de creador
- ✅ Verifica webhooks en Mercado Pago

---

## 🆘 troubleshooting

### Error: "Plan ID...does not exist"
- Verifica que los IDs en `.env` son exactamente iguales a Mercado Pago
- Reinicia el servidor después de cambiar `.env`

### No se registra el creador
- El código del creador debe estar en la BD (tabla `CreatorProfile`)
- El campo `isActive` debe ser `true`
- El `userId` del creador debe ser DIFERENTE al usuario que se suscribe

### No veo ✅ en diagnósticos
- Los IDs no están en `.env`
- El servidor no fue reiniciado
- El formato de los IDs es incorrecto

---

## 📚 Recursos

- [Mercado Pago Plans API](https://developers.mercadopago.com.ar/)
- [Check your endpoints](/api/billing/diagnostics)
