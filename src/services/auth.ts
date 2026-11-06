import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
} from 'firebase/auth'
import { obtenerApp } from './firebase'
import { CODIGO_CANCELADO, ErrorServicio, type Usuario } from './types'

const MENSAJES: Record<string, string> = {
  'auth/invalid-credential': 'El mail o la contraseña no son correctos.',
  'auth/user-not-found': 'El mail o la contraseña no son correctos.',
  'auth/wrong-password': 'El mail o la contraseña no son correctos.',
  'auth/invalid-email': 'Ese mail no parece válido.',
  'auth/email-already-in-use': 'Ya hay una cuenta con ese mail. Probá ingresar.',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
  'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permitila y volvé a intentar.',
  'auth/network-request-failed': 'No hay conexión. Revisá tu internet y volvé a intentar.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Esperá unos minutos.',
  'auth/operation-not-allowed': 'Ese método de ingreso no está habilitado.',
  'auth/unauthorized-domain': 'Este sitio no está autorizado para ingresar. Avisanos.',
}

function traducir(error: unknown): ErrorServicio {
  if (error instanceof ErrorServicio) return error
  const codigo = (error as { code?: string } | null)?.code ?? 'desconocido'
  if (codigo === 'auth/popup-closed-by-user' || codigo === 'auth/cancelled-popup-request') {
    return new ErrorServicio('Cancelaste el ingreso con Google.', CODIGO_CANCELADO)
  }
  return new ErrorServicio(MENSAJES[codigo] ?? 'No pudimos completar el ingreso. Volvé a intentar.', codigo)
}

function auth(): Auth {
  return getAuth(obtenerApp())
}

async function ejecutar(accion: () => Promise<unknown>): Promise<void> {
  try {
    await accion()
  } catch (error) {
    throw traducir(error)
  }
}

export function observarUsuario(callback: (usuario: Usuario | null) => void): () => void {
  try {
    return onAuthStateChanged(auth(), (u) =>
      callback(u ? { uid: u.uid, email: u.email, nombre: u.displayName } : null),
    )
  } catch (error) {
    // Sin config la app sigue navegable: las páginas muestran el error al pedir datos
    console.error(error)
    callback(null)
    return () => {}
  }
}

export function ingresarConGoogle(): Promise<void> {
  return ejecutar(() => signInWithPopup(auth(), new GoogleAuthProvider()))
}

export function ingresarConEmail(email: string, contrasena: string): Promise<void> {
  return ejecutar(() => signInWithEmailAndPassword(auth(), email, contrasena))
}

export function registrarConEmail(email: string, contrasena: string): Promise<void> {
  return ejecutar(() => createUserWithEmailAndPassword(auth(), email, contrasena))
}

export function cerrarSesion(): Promise<void> {
  return ejecutar(() => signOut(auth()))
}
