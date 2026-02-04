# 🚨 Resumen del Error de Suscripción

## El Problema

```
❌ POST /api/billing/checkout → 500 Error
   └─ "The template with id 222d8d5d...  does not exist"
      └─ El plan en Mercado Pago está MAL CONFIGURADO
```

---

## Causa Raíz

Las variables de entorno para los planes de Mercado Pago están:
- ❌ **No configuradas** (vacías), o
- ❌ **Mal configuradas** (IDs inválidos), o  
- ❌ **Obsoletas** (los planes fueron eliminados de Mercado Pago)

---

## ¿Qué Fue Impactado?

| Funcionalidad | Estado |
|---|---|
| Plan FREE ✅ | Funciona (no requiere pago) |
| Plan PRO ❌ | Error al intentar suscribirse |
| Plan PREMIUM ❌ | Error al intentar suscribirse |
| Estado de Suscripción ✅ | Funciona (lectura) |

---

## Solución Rápida (5 pasos)

### 1. **Crea los planes en Mercado Pago**
```
Dashboard → Suscripciones → Crear Plan
├─ Plan PRO: $7.500 ARS/mes
└─ Plan PREMIUM: $15.000 ARS/mes
```

### 2. **Obtén los IDs**
```
Cada plan te dará un ID como:
- 652e6f8d-1234-5678-90ab-cdef12345678
```

### 3. **Obtén el Access Token**
```
Dashboard → Credenciales → Access Token (Producción)
```

### 4. **Actualiza el `.env`**
```env
MP_ACCESS_TOKEN=APP_USR-xxxxxxx
MP_PREAPPROVAL_PLAN_PRO_ID=652e6f8d-xxxxxx
MP_PREAPPROVAL_PLAN_PREMIUM_ID=652e6f8d-yyyyyy
```

### 5. **Reinicia el servidor**
```bash
docker-compose restart server
# O: Ctrl+C y npm start
```

---

## Verificar la Configuración

```bash
# Este endpoint muestra el estado actual
curl http://localhost:3000/api/billing/diagnostics

# Resultado esperado:
{
  "mercadoPago": {
    "hasAccessToken": true,
    "planIds": {
      "pro": "✅ Configurado: 652e6f8d-...",
      "premium": "✅ Configurado: 652e6f8d-..."
    }
  }
}
```

---

## Mejoras Implementadas

Se actualizó `server/src/routes/billing.js` con:

✅ **Mejor validación**
- Verifica que los IDs de plan no sean demasiado cortos
- Detecta si no están configurados

✅ **Mejores mensajes de error**
- Error específico si el template no existe
- Indica exactamente cuál variable configurar

✅ **Mejor logging**
- Muestra qué plan ID se está intentando usar
- Registra los errores de Mercado Pago completos

✅ **Endpoint de diagnóstico**
- `/api/billing/diagnostics` muestra el estado de configuración
- Útil para debugging rápido

---

## Documentación Completa

Ver: [MERCADO_PAGO_SETUP.md](./MERCADO_PAGO_SETUP.md)

---

## Contactar Mercado Pago

Si después de todo aún tienes problemas:
- 📧 [Soporte Mercado Pago](https://www.mercadopago.com.ar/ayuda)
- 🔗 [API Reference](https://developers.mercadopago.com.ar/)
