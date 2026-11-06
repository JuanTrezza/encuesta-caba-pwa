# Configuración de Firebase para Voz Porteña

Esta guía cubre lo que hay que hacer en consolas externas y con la CLI de Firebase. Ningún paso se aplica solo desde el código.

## Antes de empezar: elegí el proyecto correcto

El historial nombra dos proyectos: `encuestacabajuan` y `encuestacaba-e35e5`. Usá el que tenga los datos en la colección `comentarios`.

## 1. Authentication

1. En **Authentication → Sign-in method**, habilitá **Google** y **Correo electrónico/contraseña**.
2. En **Authentication → Settings → Authorized domains**, dejá solo `juantrezza.github.io`, `localhost` y el dominio `.firebaseapp.com` del proyecto.

## 2. Reglas e índices

Las reglas están en `firestore.rules` y los índices en `firestore.indexes.json`. Las dos cosas se despliegan con la CLI.

Antes de desplegar, mirá las reglas publicadas en **Firestore → Rules**: el deploy las reemplaza por completo. Las reglas nuevas rechazan el formato de opinión del front anterior.

Conviene este orden, para que nadie vea errores en el medio:

```bash
npx firebase login
npx firebase projects:list
npx firebase use <ID_DEL_PROYECTO>

# 1. Índices. Esperá a que figuren como "Enabled" en Firestore → Indexes.
npx firebase deploy --only firestore:indexes

# 2. Publicá el front nuevo con git push y esperá a que termine el deploy de GitHub Actions.

# 3. Reglas.
npx firebase deploy --only firestore:rules
```

Si el front nuevo ya está publicado, podés desplegar todo junto:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes
```

Este `firebase.json` no define hosting, así que estos comandos no publican el sitio.

### Índice necesario

| Colección | Campo | Orden |
|---|---|---|
| `comentarios` | `categoria` | Ascendente |
| `comentarios` | `fecha` | Descendente |

Lo usan las dos consultas de comentarios recientes. Si ya lo creaste desde el link de la consola, el deploy no lo duplica. Los conteos por estrellas solo usan igualdades y no necesitan índice compuesto.

## 3. API key web

La config web de Firebase no es secreta: viaja dentro del JavaScript público. Identifica al proyecto, pero no da permisos. Lo que protege los datos son las reglas de Firestore, y la restricción de la key limita desde dónde se puede usar.

En **Google Cloud Console → APIs & Services → Credentials**:

1. **Application restrictions → Websites**. Referrers: `https://juantrezza.github.io/*`, `http://localhost:*/*` y `https://<proyecto>.firebaseapp.com/*`, que el popup de Google necesita. No uses `*` ni `https://*.github.io/*`.
2. **API restrictions → Restrict key**. APIs: Cloud Firestore, Identity Toolkit y Token Service. Sumá Firebase App Check cuando actives App Check, y Firebase Installations y Cloud Messaging cuando vuelva el push.

## 4. App Check (opcional)

1. En la [consola de reCAPTCHA](https://www.google.com/recaptcha/admin), creá una clave **v3** para `juantrezza.github.io`. La consola te da una site key y una secret key.
2. En **Firebase → App Check → Apps**, registrá la app web con **reCAPTCHA** y pegá la **secret key**. Esa clave sí es secreta: va solo ahí, nunca en el repo ni en una variable `VITE_*`.
3. Guardá la **site key** en el secret `VITE_FIREBASE_APPCHECK_SITE_KEY` y hacé un deploy.
4. Mirá las métricas en **App Check → APIs → Cloud Firestore** hasta que casi todo el tráfico aparezca como verificado.
5. Recién entonces tocá **Enforce**. Antes de eso, App Check solo mide y no bloquea nada.

**Desarrollo local después de Enforce:** sin la variable, la app ya no envía token y Firestore rechaza sus pedidos. Para seguir probando contra el proyecto real, generá un [debug token](https://firebase.google.com/docs/app-check/web/debug-provider) y registralo en la consola, o usá un proyecto de Firebase aparte. La integración con debug token no está implementada en esta etapa.

## 5. GitHub

1. En **Settings → Secrets and variables → Actions**, creá estos secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_APPCHECK_SITE_KEY` (opcional)

   Pegá solo el valor, sin el nombre del campo, las comillas ni la coma del `firebaseConfig`. Las comillas y los espacios de los extremos se limpian solos, pero el deploy falla si queda otra cosa inválida, como una coma. El mensaje nombra la variable y no muestra su valor.
2. En **Settings → Pages**, poné **Source** en **GitHub Actions**.
