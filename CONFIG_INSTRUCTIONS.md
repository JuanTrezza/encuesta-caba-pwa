Instrucciones para manejar la configuración de Firebase sin exponerla públicamente

- Copiar los archivos de ejemplo y completarlos con tus valores reales:
  - `config.example.js` -> `config.js` (este archivo es un módulo ES6 y exporta `firebaseConfig`).
  - `sw-config.example.js` -> `sw-config.js` (este es un script plano para `importScripts` en el service worker).

- NO comitees `config.js` ni `sw-config.js`. Ya están añadidos a `.gitignore`.

- Cliente (navegador): `auth.js` ahora importa `firebaseConfig` desde `./config.js`.
  - Asegúrate de que tu HTML incluya el `auth.js` como `type="module"` (si no lo hacía antes).

- Service Worker: `firebase-messaging-sw.js` no inicializa Firebase con valores en repositorio.
  - Crea `sw-config.js` a partir de `sw-config.example.js` y agrega `importScripts('./sw-config.js');`
    arriba en `firebase-messaging-sw.js` antes de llamar a `firebase.initializeApp(swFirebaseConfig)`.

- Recomendaciones de seguridad adicionales:
  - En la consola de Google Cloud, restringe la API Key por origen HTTP (referrers) y por APIs.
  - Configura reglas de Firestore/Storage para requerir `request.auth != null` si corresponde.
  - Si la clave fue publicada en un repositorio público, considera rotarla en Google Cloud.

Ejemplo de comandos PowerShell para crear los archivos locales desde los ejemplos:

```powershell
Copy-Item .\config.example.js .\config.js
Copy-Item .\sw-config.example.js .\sw-config.js
# Edita los archivos para completar los valores
notepad .\config.js
notepad .\sw-config.js
```

Si quieres, puedo:
- Crear `config.js` y `sw-config.js` temporales aquí con valores de ejemplo para pruebas locales.
- Guiarte paso a paso para restringir la API Key en la consola de Google Cloud.
- Ayudarte a regenerar/rotar la API Key si la consideras comprometida.
