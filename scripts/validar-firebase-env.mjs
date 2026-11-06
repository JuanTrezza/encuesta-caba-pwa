// Valida las variables VITE_FIREBASE_* del entorno sin imprimir sus valores. Corre con Node, sin npm ci.
import { formatearErrores, validarFirebaseEnv } from '../src/services/firebaseEnv.mjs'

const errores = validarFirebaseEnv(process.env)

if (errores.length > 0) {
  console.error(formatearErrores(errores))
  process.exit(1)
}

console.log('La config de Firebase tiene un formato válido.')
