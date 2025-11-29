# Guía de Seguridad - Firebase & Google Cloud
# Para Aplicación Pública (GitHub/LinkedIn)

⚠️ **IMPORTANTE**: Esta aplicación está diseñada para ser pública. Las claves de Firebase están en el código fuente, lo cual es seguro SOLO si aplicamos las restricciones correctas.

## 1. Restringir API Key en Google Cloud Console

### Paso 1: Acceder a Google Cloud Console
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto: `encuestacabajuan`

### Paso 2: Ir a Credenciales
1. En el menú lateral, navega a: **APIs & Services** → **Credentials**
2. Busca la API Key: `AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do`
3. Haz clic en el ícono de **editar** (lápiz) junto a la key

### Paso 3: Restricciones de Aplicación
En la sección **Application restrictions**, selecciona:
- **HTTP referrers (web sites)**

Agrega los siguientes referrers (dominios permitidos):
```
http://localhost:8000/*
http://localhost:*/*
http://127.0.0.1:*/*
https://*.github.io/*
https://juantrezza.github.io/*
*
```

**Nota para aplicación pública**: Puedes usar `*` (asterisco) para permitir todos los orígenes, O especificar solo tus dominios. Para GitHub Pages, usa `https://tuusuario.github.io/*`.

### Paso 4: Restricciones de API
En la sección **API restrictions**, selecciona:
- **Restrict key**

Marca SOLO las siguientes APIs (desmarca todas las demás):
- ✅ Firebase Authentication API
- ✅ Cloud Firestore API
- ✅ Firebase Cloud Messaging API
- ✅ Firebase Installations API
- ✅ Token Service API
- ✅ Identity Toolkit API

### Paso 5: Guardar
1. Haz clic en **Save** (abajo de la página)
2. Espera 5-10 minutos para que los cambios se propaguen

---

## 2. Configurar Reglas de Firestore

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: `encuestacabajuan`

### Paso 2: Ir a Firestore Database
1. En el menú lateral, navega a: **Build** → **Firestore Database**
2. Haz clic en la pestaña **Rules**

### Paso 3: Actualizar Reglas
Reemplaza las reglas actuales con las siguientes (ACCESO PÚBLICO CONTROLADO):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir lectura pública, escritura solo para autenticados
    match /comentarios/{comentarioId} {
      // Lectura pública - cualquiera puede ver comentarios
      allow read: if true;
      
      // Escritura solo para usuarios autenticados
      allow create: if request.auth != null
                    && request.resource.data.keys().hasAll(['texto', 'calificacion', 'fecha', 'categoria'])
                    && request.resource.data.texto is string
                    && request.resource.data.texto.size() > 0
                    && request.resource.data.texto.size() <= 500
                    && request.resource.data.calificacion is int
                    && request.resource.data.calificacion >= 1
                    && request.resource.data.calificacion <= 5;
      
      // No permitir actualizaciones ni eliminaciones
      allow update, delete: if false;
    }
    
    // Denegar acceso a todas las demás colecciones
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Características de estas reglas (para app pública):**
- ✅ Lectura pública (cualquiera puede ver comentarios sin login)
- ✅ Escritura solo para usuarios autenticados (previene spam)
- ✅ Validación de estructura y contenido
- ✅ Límite de 500 caracteres por comentario
- ✅ Calificación entre 1-5
- ✅ No se pueden editar/eliminar comentarios (previene vandalismo)

### Paso 4: Publicar
1. Haz clic en **Publish** (arriba a la derecha)
2. Las reglas se aplican inmediatamente

### Paso 5: Probar las Reglas (Opcional)
1. Ve a la pestaña **Rules playground**
2. Prueba las reglas con diferentes escenarios:
   - Usuario autenticado: `Authenticated: true`
   - Usuario no autenticado: `Authenticated: false`

---

## 3. Rotar API Key (OPCIONAL - Solo si detectas abuso)

⚠️ **Para aplicación pública NO es necesario rotar la key regularmente**. Solo hazlo si detectas uso indebido o límites excedidos.

La seguridad está garantizada por:
- Restricciones de HTTP referrers en la API Key
- Reglas de Firestore que controlan acceso
- Límites de Firebase (cuota gratuita)

### Si necesitas rotar por abuso detectado:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a: **APIs & Services** → **Credentials**
3. Haz clic en **+ CREATE CREDENTIALS** → **API key**
4. Se creará una nueva key. **Cópiala inmediatamente** (ej: `AIzaXXXXXXXXXXXXXXXXX`)

### Paso 2: Aplicar Restricciones a la Nueva Key
Repite el **Paso 1** (Restricciones) de esta guía para la nueva API Key:
- Restricciones de HTTP referrers
- Restricciones de APIs permitidas

### Si necesitas rotar por abuso detectado:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a: **APIs & Services** → **Credentials**
3. Haz clic en **+ CREATE CREDENTIALS** → **API key**
4. Copia la nueva key
5. Reemplaza en `auth.js` y `firebase-messaging-sw.js`
6. Commitea y pushea los cambios
7. Elimina la key antigua

---

## 4. Configuración para GitHub Pages

Si quieres alojar esta app en GitHub Pages:

### Paso 1: Habilitar GitHub Pages
1. Ve a tu repositorio en GitHub
2. **Settings** → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **master** o **main** → **/ (root)**
5. Haz clic en **Save**

### Paso 2: Acceder a tu app
Tu app estará disponible en:
```
https://juantrezza.github.io/encuesta-caba-pwa/
```

### Paso 3: Actualizar restricciones de API Key
Agrega este dominio a los HTTP referrers en Google Cloud Console:
```
https://juantrezza.github.io/*
```

---

## 5. Seguridad para Aplicación Pública - Checklist

- [ ] **API Key restringida por HTTP referrers** (permite GitHub Pages + localhost)
- [ ] **API Key restringida a Firebase APIs específicas**
- [ ] **Reglas de Firestore: Lectura pública, escritura autenticada**
- [ ] **Validación de datos en reglas de Firestore** (límite 500 chars, calificación 1-5)
- [ ] **Autenticación habilitada** (Email/Password y Google)
- [ ] **Cuotas de Firebase monitoreadas** (para prevenir abuso)

---

## 6. Monitoreo de Uso (Importante para apps públicas)

### Configurar Alertas de Cuota
1. Firebase Console → **Usage and billing**
2. Configura alertas cuando alcances:
   - 50% de cuota gratuita de Firestore
   - 50% de cuota de autenticación
   - 80% de cualquier límite

### Revisar Logs
1. Firebase Console → **Analytics**
2. Monitorea usuarios activos
3. Revisa patrones de uso inusuales

---

## 7. Diferencia: App Pública vs App Privada

| Aspecto | App Pública (tu caso) | App Privada |
|---------|----------------------|-------------|
| **API Key en código** | ✅ Sí (seguro con restricciones) | ❌ No (usar variables de entorno) |
| **Firestore lectura** | ✅ Pública | ❌ Solo autenticados |
| **Firestore escritura** | ✅ Solo autenticados | ❌ Solo autenticados |
| **HTTP Referrers** | ✅ GitHub Pages, localhost, etc. | ❌ Solo dominios específicos |
| **Usuarios** | ✅ Cualquiera (con Google/Email) | ❌ Usuarios invitados/aprobados |

---

## 8. Comandos Git para Publicar

```powershell
# Ver cambios
git status

# Agregar archivos modificados
git add auth.js firebase-messaging-sw.js SECURITY_SETUP.md

# Commitear
git commit -m "Restaurar config pública para GitHub Pages"

# Pushear a GitHub
git push origin master

# Verificar en GitHub Pages (espera 1-2 minutos)
# https://juantrezza.github.io/encuesta-caba-pwa/
```
