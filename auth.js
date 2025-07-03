import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDrbPpE1hkNk5T1zdvLnqkJ_zTBgDjL3lI",
  authDomain: "encuestacaba-e35e5.firebaseapp.com",
  projectId: "encuestacaba-e35e5",
  storageBucket: "encuestacaba-e35e5.firebasestorage.app",
  messagingSenderId: "57347474602",
  appId: "1:57347474602:web:b90b9d53add88b8185bcd3"
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

