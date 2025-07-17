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
apiKey: "AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do",
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



