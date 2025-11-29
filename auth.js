import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ⚠️ NOTA DE SEGURIDAD: Esta configuración de Firebase es PÚBLICA INTENCIONALMENTE
// Las API Keys de Firebase para web son seguras cuando se configuran correctamente:
// 1. Restricciones de HTTP referrers en Google Cloud Console
// 2. Reglas de seguridad en Firestore (solo autenticados pueden escribir)
// 3. Firebase está diseñado para que estas claves sean públicas en aplicaciones web
// Ref: https://firebase.google.com/docs/projects/api-keys
// Esta es una Progressive Web App pública - la seguridad está en las reglas de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do", // Public API key - Safe for client-side use
  authDomain: "encuestacabajuan.firebaseapp.com",
  projectId: "encuestacabajuan",
  storageBucket: "encuestacabajuan.firebasestorage.app",
  messagingSenderId: "534439491127",
  appId: "1:534439491127:web:41fbee0ad78c89d692b1b2"
};

// Inicializar Firebase y Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function registrar(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function loginConGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function cerrarSesion() {
  return signOut(auth);
}

// Verifica si hay un usuario autenticado
export function usuarioActual(callback) {
  auth.onAuthStateChanged(user => {
    if (user) {
      localStorage.setItem("usuario", JSON.stringify({ email: user.email }));
    } else {
      localStorage.removeItem("usuario");
    }
    callback(user);
  });
}


import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const dbFirestore = getFirestore(app);

export async function guardarComentarioFirestore(comentario) {
await addDoc(collection(dbFirestore, "comentarios"), comentario);
}



import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

export const messaging = getMessaging(app);



