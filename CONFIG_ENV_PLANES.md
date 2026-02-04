# 📋 Configuración de .env para los 4 Planes

## Variables de Mercado Pago

Copia y pega esto en tu archivo `.env` (en la carpeta `server`):

```env
# Access Token de Mercado Pago
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# PRO - Price: 7.500 ARS
MP_PREAPPROVAL_PLAN_PRO_ID=c4dd672ef77943c988a390c7508693d6

# PRO con Descuento - Price: 6.750 ARS
MP_PREAPPROVAL_PLAN_PRO_DISCOUNT_ID=b161f23ac6a14f9c8acc0f1f26ad92bf

# PREMIUM - Price: 15.000 ARS
MP_PREAPPROVAL_PLAN_PREMIUM_ID=9e5e6ce66c4944e5b1fb5b9bc8565e5e

# PREMIUM con Descuento - Price: 13.500 ARS
MP_PREAPPROVAL_PLAN_PREMIUM_DISCOUNT_ID=5c10fee57bb840a2a521321880c8b839
```

---

## 📊 Resumen de Planes

| Plan | Precio | ID |
|------|--------|-------|
| **PRO** | 7.500 ARS | `c4dd672ef77943c988a390c7508693d6` |
| **PRO (descuento)** | 6.750 ARS | `b161f23ac6a14f9c8acc0f1f26ad92bf` |
| **PREMIUM** | 15.000 ARS | `9e5e6ce66c4944e5b1fb5b9bc8565e5e` |
| **PREMIUM (descuento)** | 13.500 ARS | `5c10fee57bb840a2a521321880c8b839` |

---

## ✅ Próximos Pasos

1. **Abre tu archivo `.env`** en la carpeta `server`
2. **Añade estas líneas** con los IDs de arriba
3. **Obtén tu `MP_ACCESS_TOKEN`**:
   - Ve a https://www.mercadopago.com.ar/developers
   - Credenciales → Access Token (Producción)
4. **Guarda el archivo**
5. **Reinicia el servidor**:
   ```bash
   docker-compose restart server
   ```

---

## 🔍 Verificar que Funciona

```bash
curl http://localhost:3000/api/billing/diagnostics
```

Deberías ver algo como:
```json
{
  "mercadoPago": {
    "hasAccessToken": true,
    "planIds": {
      "pro": {
        "regular": "✅ c4dd672ef7794...",
        "withDiscount": "✅ b161f23ac6a14f..."
      },
      "premium": {
        "regular": "✅ 9e5e6ce66c494...",
        "withDiscount": "✅ 5c10fee57bb84..."
      }
    }
  }
}
```

✅ = Todo configurado correctamente
❌ = Falta configurar

---

## 🧪 Prueba de Funcionamiento

Después de reiniciar:

1. Abre tu app en `/pricing`
2. Intenta checkout **SIN código creador**
   - Debería usar plan **regular** (7.500 o 15.000)
3. Intenta checkout **CON código creador válido**
   - Debería usar plan **descuento** (6.750 o 13.500)

---

## 📝 Ubicación del .env

```
my-trigger-app/
├── server/
│   └── .env  ← AQUÍ VA LA CONFIGURACIÓN
└── client/
```

Asegúrate de editarlo en la carpeta `server`, no en raíz.
