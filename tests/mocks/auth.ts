// Reemplaza a src/services/auth.ts en el build --mode e2e. `contrato` hace que tsc falle si se desalinean.
import type * as Real from '../../src/services/auth'
import { ErrorServicio, type Usuario } from '../../src/services/types'
import { escenario, esperar } from './escenario'

const oyentes = new Set<(usuario: Usuario | null) => void>()

function emitir(usuario: Usuario | null) {
  escenario().usuario = usuario
  oyentes.forEach((oyente) => oyente(usuario))
}

export function observarUsuario(callback: (usuario: Usuario | null) => void): () => void {
  oyentes.add(callback)
  void esperar(5).then(() => callback(escenario().usuario ?? null))
  return () => oyentes.delete(callback)
}

export async function ingresarConGoogle(): Promise<void> {
  await esperar()
  emitir({ uid: 'google-1', email: 'vecina@example.com', nombre: 'Vecina de Prueba' })
}

export async function ingresarConEmail(email: string, _contrasena: string): Promise<void> {
  await esperar()
  if (email.startsWith('falla')) throw new ErrorServicio('El mail o la contraseña no son correctos.', 'auth/invalid-credential')
  emitir({ uid: 'mail-1', email, nombre: null })
}

export async function registrarConEmail(email: string, _contrasena: string): Promise<void> {
  await esperar()
  if (email.startsWith('existe')) throw new ErrorServicio('Ya hay una cuenta con ese mail. Probá ingresar.', 'auth/email-already-in-use')
  emitir({ uid: 'nuevo-1', email, nombre: null })
}

export async function cerrarSesion(): Promise<void> {
  await esperar()
  emitir(null)
}

export const contrato = {
  observarUsuario,
  ingresarConGoogle,
  ingresarConEmail,
  registrarConEmail,
  cerrarSesion,
} satisfies typeof Real
