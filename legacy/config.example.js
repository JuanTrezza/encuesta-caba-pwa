// INSTRUCCIONES:
// 1. Copia este archivo como: config.js
// 2. Reemplaza los valores XXXXXXX con tus credenciales reales de Firebase
// 3. NO subas config.js a GitHub (ya está en .gitignore)

export const firebaseConfig = {
  apiKey: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "XXXXXXXXXXXX",
  appId: "X:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXXXXXXXXXX"
};

// Para obtener estas credenciales:
// 1. Ve a Firebase Console: https://console.firebase.google.com/
// 2. Selecciona tu proyecto
// 3. Ve a Configuración del proyecto (ícono de engranaje)
// 4. En "Tus apps" → "SDK setup and configuration"
// 5. Copia los valores del objeto firebaseConfig