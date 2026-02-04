# 🛠️ Guía de Configuración de Mercado Pago

## ❌ Error Actual
```
The template with id 222d8d5d94d57b9f7028364caa6 does not exist
```

Este error significa que el ID de plan (`MP_PREAPPROVAL_PLAN_PRO_ID` o `MP_PREAPPROVAL_PLAN_PREMIUM_ID`) no existe en tu cuenta de Mercado Pago.

---

## 🔍 Diagnóstico

Para verificar la configuración actual del servidor:

```bash
# En tu terminal, accede a:
curl http://localhost:3000/api/billing/diagnostics

# O si está en producción:
curl https://tu-dominio/api/billing/diagnostics
```

Esto mostrará algo como:
```json
{
  "mercadoPago": {
    "hasAccessToken": true,
    "planIds": {
      "pro": "❌ No configurado",
      "premium": "❌ No configurado"
    }
  }
}
```

---

## ✅ Pasos para Solucionar

### 1. **Acceder a Mercado Pago** 
- Ve a https://www.mercadopago.com.ar/developers
- Inicia sesión con tu cuenta de negocio
- Ve a **Aplicaciones → Tus Aplicaciones**

### 2. **Crear Planes de Suscripción**

Ve a la sección de **Suscripciones** o **Preapproval Plans** en el Dashboard de Mercado Pago.

**Para el Plan PRO:**
- Nombre: `TriggerApp Plan PRO`
- Frecuencia: Mensual
- Precio: $7.500 ARS (o tu moneda)
- Descripción: `Plan PRO con límites aumentados`
- Copia el **Template/Plan ID** generado

**Para el Plan PREMIUM:**
- Nombre: `TriggerApp Plan PREMIUM`
- Frecuencia: Mensual
- Precio: $15.000 ARS (o tu moneda)
- Descripción: `Plan PREMIUM con límites altos`
- Copia el **Template/Plan ID** generado

### 3. **Obtener el Access Token**
- En el Dashboard de Mercado Pago
- Ve a **Credenciales** en la sección de desarrollo
- Copia el **Access Token** en modo producción (no test)

### 4. **Actualizar Variables de Entorno**

**En tu archivo `.env` (servidor):**
```env
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MP_PREAPPROVAL_PLAN_PRO_ID=<ID_DEL_PLAN_PRO>
MP_PREAPPROVAL_PLAN_PREMIUM_ID=<ID_DEL_PLAN_PREMIUM>
```

**Ejemplo:**
```env
MP_ACCESS_TOKEN=APP_USR-1234567890123456789012345678
MP_PREAPPROVAL_PLAN_PRO_ID=652e6f8d-1234-5678-90ab-cdef12345678
MP_PREAPPROVAL_PLAN_PREMIUM_ID=652e6f8d-9876-5432-10ba-fedcba987654
```

### 5. **Reiniciar el Servidor**

Si estás usando Docker:
```bash
docker-compose restart server
```

Si estás corriendo localmente:
```bash
# Interrumpe el proceso (Ctrl+C) y reinicia
npm start  # o node src/index.js
```

### 6. **Verificar la Configuración**

```bash
# Prueba el diagnóstico nuevamente
curl http://localhost:3000/api/billing/diagnostics
```

Deberías ver:
```json
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

## 🧪 Probar el Checkout

1. Ve a la página `/pricing` en tu app
2. Haz clic en "Continuar" para un plan (PRO o PREMIUM)
3. Selecciona **Mercado Pago**
4. Haz clic en **Continuar**

Si todo está correcto, se redirigirá a Mercado Pago.

---

## 📚 Recursos Útiles

- [API Mercado Pago Preapproval](https://developers.mercadopago.com.ar/es/reference)
- [Dashboard Mercado Pago](https://www.mercadopago.com.ar/business)
- [Documentación de Planes](https://developers.mercadopago.com.ar/es/docs)

---

## 🆘 Problemas Comunes

### "Plan ID no encontrado"
- Verifica que `MP_PREAPPROVAL_PLAN_PRO_ID` está en el `.env`
- El servidor necesita ser reiniciado después de cambiar `.env`

### "Error obteniendo token PayPal"  
- Asegúrate de que `MP_ACCESS_TOKEN` es válido
- Si cambió la contraseña de tu cuenta, regenera el token

### "Signature invalid"
- El webhook de Mercado Pago necesita verificación
- Contacta a soporte de Mercado Pago para verificar webhooks

---

## 📝 Notas Importantes

- Los cambios en variables de entorno **requieren reiniciar** el servidor
- El `MP_ACCESS_TOKEN` debe ser del **modo Producción**, no Test
- Los IDs de plan deben ser exactamente iguales a los de Mercado Pago
- Prueba primero en modo Sandbox de Mercado Pago si tienes dudas
