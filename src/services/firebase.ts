import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { ErrorServicio } from './types'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Inicializa Firebase la primera vez. Si falta config, falla con un error que las páginas muestran. */
export function obtenerApp(): FirebaseApp {
  const existente = getApps()[0]
  if (existente) return existente
  if (!config.apiKey || !config.projectId || !config.appId || !config.authDomain) {
    throw new ErrorServicio('La app no está configurada todavía. Volvé a intentar más tarde.', 'sin-config')
  }
  const app = initializeApp(config)
  // App Check tiene que iniciarse antes de usar Firestore. Sin la site key queda apagado.
  const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
  }
  return app
}
