importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
// Load local service worker config if present (ignored in git)
try {
  importScripts('./sw-config.js');
} catch (e) {
  // sw-config.js not found; service worker will need manual initialization.
}

// Load firebase config from a non-versioned `config.js` file during build/deploy.
// Service workers don't support ES module imports in all environments, so
// for the service worker we expect a generated `sw-config.js` to exist that
// calls `firebase.initializeApp(swFirebaseConfig);` with the proper values.
// If you don't have a build step, copy the values into this file manually
// (but do NOT commit them). You can create `sw-config.js` with:
//   var swFirebaseConfig = { apiKey: '...', authDomain: '...', projectId: '...', storageBucket: '...', messagingSenderId: '...', appId: '...' };
// and then add `importScripts('sw-config.js');` above so the worker can initialize.

// Example (development only):
// firebase.initializeApp({ apiKey: 'YOUR_KEY', authDomain: '...', projectId: '...', storageBucket: '...', messagingSenderId: '...', appId: '...' });

//No hay firebase porque es un servicio worker y no tiene acceso al DOM
//Por eso se usa importScripts para importar las librerias necesarias
//Luego se inicializa la app de firebase con la configuracion del proyecto
//Finalmente se obtiene una instancia de firebase messaging para manejar los mensajes en segundo plano

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/assets/icon.png'
  });
});
