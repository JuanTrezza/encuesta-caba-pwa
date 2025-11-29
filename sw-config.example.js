// INSTRUCCIONES:
// 1. Copia este archivo como: sw-config.js
// 2. Reemplaza los valores XXXXXXX con tus credenciales reales de Firebase
// 3. NO subas sw-config.js a GitHub (ya está en .gitignore)

// Configuración para Service Worker (debe ser un script plano, no ES module)
var swFirebaseConfig = {
  apiKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "X:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXXXX"
};

// Inicializar Firebase en el service worker
try {
  firebase.initializeApp(swFirebaseConfig);
} catch (e) {
  // Si ya está inicializado, ignorar
  console.warn('Firebase ya inicializado en service worker');
}

// Para obtener estas credenciales:
// Ve a Firebase Console → Tu proyecto → Configuración → SDK setup