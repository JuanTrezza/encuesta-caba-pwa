# 🔒 Instrucciones Urgentes: Rotar API Key de Firebase

## ⚠️ IMPORTANTE: Tu API Key fue expuesta públicamente en GitHub

Aunque ya la removimos del código, la key anterior estuvo en commits públicos del repositorio. Debes rotarla (regenerarla) INMEDIATAMENTE.

---

## Paso 1: Generar Nueva API Key

### 1.1 Ir a Google Cloud Console
🔗 [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

1. Selecciona tu proyecto: **encuestacabajuan**
2. En la lista de API Keys, verás tu key actual

### 1.2 Crear Nueva API Key
1. Haz clic en **"+ CREATE CREDENTIALS"** (arriba)
2. Selecciona **"API key"**
3. Se creará una nueva key → **Cópiala inmediatamente**
4. Ejemplo: `AIzaXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 1.3 Restringir la Nueva API Key (MUY IMPORTANTE)
1. Haz clic en **"RESTRICT KEY"** (o edita la nueva key)
2. **Application restrictions:**
   - Selecciona: **"HTTP referrers (web sites)"**
   - Agrega estos referrers:
     ```
     http://localhost:8000/*
     http://localhost:*/*
     http://127.0.0.1:*/*
     https://*.github.io/*
     ```
   - Si tienes un dominio propio, agrégalo también

3. **API restrictions:**
   - Selecciona: **"Restrict key"**
   - Marca SOLO estas APIs:
     - ✅ Cloud Firestore API
     - ✅ Firebase Authentication API
     - ✅ Firebase Cloud Messaging API
     - ✅ Firebase Installations API
     - ✅ Identity Toolkit API
     - ✅ Token Service API

4. Haz clic en **"SAVE"**

---

## Paso 2: Actualizar tus Archivos Locales

### 2.1 Editar `config.js`
```bash
notepad config.js
```

Reemplaza `apiKey` con la nueva key:
```javascript
export const firebaseConfig = {
  apiKey: "TU_NUEVA_API_KEY_AQUI",  // ← Pega la nueva key
  authDomain: "encuestacabajuan.firebaseapp.com",
  projectId: "encuestacabajuan",
  storageBucket: "encuestacabajuan.firebasestorage.app",
  messagingSenderId: "534439491127",
  appId: "1:534439491127:web:41fbee0ad78c89d692b1b2"
};
```

### 2.2 Editar `sw-config.js`
```bash
notepad sw-config.js
```

Reemplaza `apiKey` con la misma nueva key:
```javascript
var swFirebaseConfig = {
  apiKey: "TU_NUEVA_API_KEY_AQUI",  // ← Pega la nueva key
  authDomain: "encuestacabajuan.firebaseapp.com",
  projectId: "encuestacabajuan",
  storageBucket: "encuestacabajuan.firebasestorage.app",
  messagingSenderId: "534439491127",
  appId: "1:534439491127:web:41fbee0ad78c89d692b1b2"
};
```

---

## Paso 3: Probar la Nueva Configuración

```bash
# Inicia el servidor local
python -m http.server 8000

# Abre en navegador: http://localhost:8000
```

Verifica que:
- ✅ Puedes hacer login
- ✅ Puedes crear comentarios
- ✅ Puedes leer comentarios

---

## Paso 4: Eliminar la API Key Antigua (CRÍTICO)

⚠️ **SOLO después de confirmar que la nueva key funciona:**

1. Ve a: [Google Cloud Credentials](https://console.cloud.google.com/apis/credentials)
2. Busca la key antigua: `AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do`
3. Haz clic en el ícono de **basura** (🗑️)
4. Confirma la eliminación

Esto invalida completamente la key antigua y evita cualquier uso no autorizado.

---

## Paso 5: Limpiar el Historial de Git (Opcional pero Recomendado)

La key antigua todavía existe en el historial de commits. Para eliminarla completamente:

### Opción A: Usar BFG Repo-Cleaner (Recomendado)

```bash
# Instalar Java si no lo tienes
# Descargar BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Crear archivo con la key a eliminar
echo "AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do" > passwords.txt

# Ejecutar BFG
java -jar bfg.jar --replace-text passwords.txt encuesta-caba-pwa.git

# Limpiar repositorio
cd encuesta-caba-pwa
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Subir cambios (FORZADO)
git push --force origin master
```

### Opción B: Crear Nuevo Repositorio (Más Simple)

1. Crea un nuevo repositorio en GitHub
2. Clona tu código actual (ya sin las keys)
3. Sube al nuevo repositorio
4. Elimina el repositorio antiguo
5. Actualiza el remote:
   ```bash
   git remote set-url origin https://github.com/JuanTrezza/nuevo-repo.git
   ```

---

## Paso 6: Cerrar Alerta de Seguridad en GitHub

1. Ve a: [Security Alerts](https://github.com/JuanTrezza/encuesta-caba-pwa/security/secret-scanning)
2. Haz clic en la alerta "Google API Key"
3. Haz clic en **"Close as revoked"** o **"Close as used in tests"**
4. Agrega comentario: "API key rotated and removed from codebase"

---

## Checklist Final

- [ ] Nueva API Key creada en Google Cloud
- [ ] Nueva API Key restringida (HTTP referrers + APIs específicas)
- [ ] `config.js` actualizado con nueva key
- [ ] `sw-config.js` actualizado con nueva key
- [ ] Aplicación probada localmente (login + comentarios funcionan)
- [ ] API Key antigua ELIMINADA de Google Cloud
- [ ] (Opcional) Historial de Git limpiado
- [ ] Alerta de seguridad cerrada en GitHub

---

## Monitoreo Futuro

1. **Configura alertas de uso** en Firebase Console
2. **Revisa logs** periódicamente en:
   - Firebase Console → Usage and billing
   - Google Cloud Console → APIs & Services → Dashboard
3. **Rota la key cada 6-12 meses** como buena práctica

---

## Soporte

Si tienes problemas con algún paso:
1. Revisa la consola del navegador (F12) para errores
2. Verifica que las restricciones de la key sean correctas
3. Espera 5-10 minutos para que los cambios se propaguen

**¿Necesitas ayuda?** Abre un issue privado o contáctame.
