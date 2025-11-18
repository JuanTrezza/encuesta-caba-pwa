import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase config is loaded from a non-versioned file `config.js`.
// Create `config.js` from `config.example.js` and fill your real values.
import { firebaseConfig } from './config.js';

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



