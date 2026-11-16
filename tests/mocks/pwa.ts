// Reemplaza a src/services/pwa.ts en el build --mode e2e. `contrato` hace que tsc falle si se desalinean.
import { registerSW } from 'virtual:pwa-register'
import type * as Real from '../../src/services/pwa'
import { escenario, esperar } from './escenario'

let iniciada = false

export function iniciarPwa(alHaberActualizacion: () => void): void {
  if (iniciada) return
  iniciada = true
  // El service worker es el real (src/sw.ts), pero solo se registra si el test lo pide
  if (escenario().sw) registerSW({ immediate: true })
  if (escenario().actualizacion) void esperar(50).then(alHaberActualizacion)
}

export async function aplicarActualizacion(): Promise<void> {
  await esperar()
  escenario().actualizada = true
}

export const contrato = { iniciarPwa, aplicarActualizacion } satisfies typeof Real
