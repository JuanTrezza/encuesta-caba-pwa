// Sin dependencias y en JavaScript plano: lo usan la app, vite.config.ts y, con Node solo,
// scripts/validar-firebase-env.mjs. Los mensajes nombran la variable, nunca su valor.

const OBLIGATORIAS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

/** Quita espacios y comillas simples o dobles del principio y del final */
export function limpiarValor(valor) {
  return (valor ?? '').replace(/^[\s'"]+|[\s'"]+$/g, '')
}

/** Devuelve un error por cada variable inválida. VITE_FIREBASE_APPCHECK_SITE_KEY es opcional. */
export function validarFirebaseEnv(env) {
  const errores = []
  for (const nombre of OBLIGATORIAS) {
    if (!limpiarValor(env[nombre])) errores.push(`${nombre}: está vacía o no está definida`)
  }
  const apiKey = limpiarValor(env.VITE_FIREBASE_API_KEY)
  if (apiKey && !/^AIza[0-9A-Za-z_-]+$/.test(apiKey)) {
    errores.push('VITE_FIREBASE_API_KEY: tiene que empezar con "AIza" y tener solo letras, números, "-" y "_"')
  }
  const authDomain = limpiarValor(env.VITE_FIREBASE_AUTH_DOMAIN)
  if (authDomain && !authDomain.endsWith('.firebaseapp.com')) {
    errores.push('VITE_FIREBASE_AUTH_DOMAIN: tiene que terminar en ".firebaseapp.com"')
  }
  return errores
}

export function formatearErrores(errores) {
  return [
    'La config de Firebase no es válida:',
    ...errores.map((error) => `  - ${error}`),
    'Revisá los secrets de GitHub o tu .env.local. Por seguridad, este mensaje no muestra los valores.',
  ].join('\n')
}
