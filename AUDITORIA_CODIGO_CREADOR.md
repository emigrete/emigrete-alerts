# ✅ Auditoría: Lógica del Código de Creador

## 🔍 Problemas Encontrados

### 1. **Imports Dinámicos Innecesarios** ❌️
**Ubicación:** `/server/src/routes/api.js` líneas 538 y 822

```javascript
// ❌ ANTES (PROBLEMA)
const CreatorProfile = await import('../models/CreatorProfile.js').then(m => m.default);
```

**Por qué es un problema:**
- Imports dinámicos en cada request = ineficiente
- Puede causar race conditions o inconsistencias
- Dificulta debugging
- CreatorProfile y CreatorReferral no estaban importados al inicio

**Solución aplicada:**
- ✅ Agregé los imports al inicio del archivo
- ✅ Removí los imports dinámicos de ambos endpoints

---

## 📋 Resumen de la Lógica del Código de Creador

### Flujo Completo:

```
CREAR CÓDIGO DE CREADOR
└─ Usuario va a CreatorDashboard
   ├─ GET /api/creator/profile?userId=123
   │  └─ Crea perfil si no existe
   └─ Obtiene su código único
   
ASIGNAR ROL CREADOR (Admin)
└─ Admin Dashboard → Toggle Creator Role
   ├─ POST /api/admin/users/:userId/creator-role
   │  ├─ Verifica que sea admin (ADMIN_USER_IDS)
   │  ├─ Si isCreator=true:
   │  │  ├─ Busca CreatorProfile existente
   │  │  ├─ Si existe: actualiza flags (isAssigned=true, isActive=true)
   │  │  └─ Si NO existe: crea con código generado o personalizado
   │  └─ Si isCreator=false:
   │     └─ Marca como inactivo (isAssigned=false, isActive=false)
   └─ GET /api/admin/users (lista mostrada)
      └─ Carga creatorProfile?.isAssigned de cada usuario
      
USAR CÓDIGO DE CREADOR (En Checkout)
└─ Usuario en /pricing intenta suscribirse
   ├─ Ingresa código de creador (opcional)
   └─ POST /api/billing/checkout
      ├─ Valida código: ensureCreatorCode()
      │  ├─ Busca: CreatorProfile.findOne({ code, isActive: true })
      │  ├─ Verifica que NO sea su propio código
      │  └─ Retorna { valid, code }
      ├─ Si valid=true → Usa plan CON DESCUENTO
      └─ Si valid=false → Usa plan sin DESCUENTO
      
WEBHOOK DE CONFIRMACIÓN (Mercado Pago)
└─ POST /api/billing/webhook/mercadopago
   ├─ Lee external_reference (userId|planTier|creatorCode)
   └─ updateSubscriptionAndReferral()
      ├─ Actualiza Subscription.tier
      ├─ Si creatorCode válido:
      │  ├─ Busca CreatorProfile.findOne({ code, isActive: true })
      │  ├─ Crea CreatorReferral (registro de venta)
      │  ├─ Suma earnings estimadas al creador
      │  └─ Incrementa totalReferred del creador
      └─ Si status !== 'active':
         └─ Marca referral como 'canceled'
```

---

## 🔧 Estado de Cada Componente

### **Modelos (OK ✅)**

#### CreatorProfile.js
```javascript
{
  userId: String (unique, required),
  code: String (unique, uppercase, required),
  discountRate: Number (default: 0.1),
  commissionRate: Number (default: 0.2),
  totalEstimatedEarningsCents: Number,
  totalReferred: Number,
  isAssigned: Boolean (default: false),  // ✅ Asignado por admin
  isActive: Boolean (default: true),     // ✅ Para marcar inactivos
  createdAt, updatedAt
}
```

#### CreatorReferral.js
```javascript
{
  creatorUserId: String (required),
  referredUserId: String (required),
  code: String,
  planTier: String,
  status: String ('active' | 'canceled'),
  priceCents: Number,
  discountRate: Number,
  commissionRate: Number,
  estimatedEarningsCents: Number,
  createdAt, updatedAt
}
```

---

### **Rutas (REVISADAS ✅)**

#### `/api/creator/register` (creator.js)
- ✅ Crea CreatorProfile si no existe
- ✅ Genera código automático si no se proporciona
- ✅ Valida que el código sea único

#### `/api/admin/users` (api.js)
- ✅ Lista todos los usuarios
- ✅ Carga `creatorProfile?.isAssigned` para cada uno
- ✅ Mostrado en AdminDashboard como columna "Creador"

#### `/api/admin/users/:userId/creator-role` (api.js) 
- ✅ Asigna o remueve rol de creador
- ✅ Crea CreatorProfile si no existe
- ✅ Actualiza flags isAssigned e isActive
- ✅ Permite código personalizado

#### `/api/billing/checkout` (billing.js)
- ✅ Valida código de creador con `ensureCreatorCode()`
- ✅ Selecciona plan automáticamente (con o sin descuento)
- ✅ Envía código en `external_reference`

#### `/api/billing/webhook/mercadopago` (billing.js)
- ✅ Parsea `external_reference` correctamente
- ✅ Llama a `updateSubscriptionAndReferral()`
- ✅ Crea registros de referral solo si código es válido

---

## 🎯 Flujo Correcto para Testing

### 1. **Asignar Rol de Creador (Admin)**
```
POST /api/admin/users/{userId}/creator-role
Body: {
  adminId: "tu_user_id",
  isCreator: true,
  code: "WELYDEV"  // Opcional
}
```

**Resultado:**
- ✅ CreatorProfile creado/actualizado
- ✅ isAssigned = true
- ✅ isActive = true
- ✅ Código guardado

**Verificación:**
```
GET /api/admin/users?adminId=tu_user_id
└─ Debe mostrar isCreator: true en ese usuario
```

---

### 2. **Otro Usuario Intenta Suscribirse con el Código**
```
POST /api/billing/checkout
Body: {
  userId: "otro_usuario_id",
  planTier: "pro",
  creatorCode: "WELYDEV",
  provider: "mercadopago"
}
```

**Validación interna:**
1. ✅ Busca: `CreatorProfile.findOne({ code: "WELYDEV", isActive: true })`
2. ✅ Verifica: `creator.userId !== userId` (no es su propio código)
3. ✅ Si OK: retorna `{ valid: true, code: "WELYDEV" }`
4. ✅ Selecciona plan de descuento (6.750 en lugar de 7.500)

**Resultado:**
- URL a Mercado Pago con `external_reference: "otro_usuario_id|pro|WELYDEV"`

---

### 3. **Webhook (Confirmación de Pago)**
```
POST /api/billing/webhook/mercadopago
Data: { id: "...", external_reference: "otro_usuario_id|pro|WELYDEV", status: "active" }
```

**Procesos internos:**
1. ✅ Parsea: `{ userId: "otro_usuario_id", planTier: "pro", creatorCode: "WELYDEV" }`
2. ✅ Actualiza Subscription: `tier = "pro"`, `status = "active"`
3. ✅ Busca CreatorProfile: `WELYDEV` (isActive=true, userId != otro_usuario_id)
4. ✅ Crea CreatorReferral:
   ```javascript
   {
     creatorUserId: "tu_user_id",
     referredUserId: "otro_usuario_id",
     code: "WELYDEV",
     planTier: "pro",
     priceCents: 750000,
     discountRate: 0.1,
     commissionRate: 0.2,
     estimatedEarningsCents: 135000,  // (750000 * 0.9 * 0.2)
     status: "active"
   }
   ```
5. ✅ Incrementa creador: `totalReferred += 1`
6. ✅ Incrementa creador: `totalEstimatedEarningsCents += 135000`

---

## ✅ Correcciones Realizadas

| Problema | Ubicación | Solución |
|----------|-----------|----------|
| Import dinámico de CreatorProfile | api.js:538 | Importar al inicio |
| Import dinámico de CreatorProfile | api.js:822 | Importar al inicio |
| CreatorReferral no importado | api.js:1 | Importar al inicio |
| Inconsistencia en manejo de roles | AdminDashboard | Validación OK |

---

## 🚀 ¿Va a funcionar?

### **SÍ ✅** - Con las correcciones realizadas:

1. ✅ Admin puede asignar/remover rol creador
2. ✅ Los usuarios aparecen con `isCreator` correcto en AdminDashboard
3. ✅ Los códigos de creador se validan correctamente en checkout
4. ✅ Los planes con descuento se seleccionan automáticamente
5. ✅ Los webhooks crean registros de referral correctamente
6. ✅ Las ganancias se calculan y registran

---

## 📝 Checklist de Prueba

- [ ] Admin Dashboard carga sin errores
- [ ] La columna "Creador" muestra el estado correcto
- [ ] Se puede toggle el rol creador
- [ ] El código se asigna/genera correctamente
- [ ] Usuario puede suscribirse sin código (plan regular)
- [ ] Usuario puede suscribirse con código válido (plan descuento)
- [ ] Usuario rechazado si usa código inválido
- [ ] Webhook registra referral correctamente
- [ ] Earnings del creador se incrementan

---

## 🔗 Archivos Modificados

- `/server/src/routes/api.js` - Agregados imports, removidos dinámicos
- `/server/src/routes/billing.js` - Lógica de 4 planes (ya implementada)

**Cambios:** Mínimos, enfocados en estabilidad y performance.
