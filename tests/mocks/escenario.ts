import type { Usuario } from '../../src/services/types'

/** Lo define cada test con page.addInitScript antes de cargar la app */
export interface EscenarioMock {
  usuario?: Usuario | null
  datos?: 'ok' | 'vacio' | 'error' | 'lento'
  /** Si es true, el primer pedido falla y el reintento funciona */
  errorUnaVez?: boolean
  envio?: 'ok' | 'error'
  /** Reflejo de lo publicado, para que los tests lo verifiquen */
  publicados?: unknown[]
  /** Con 'error', borrar una opinión falla como si las reglas lo rechazaran */
  borrado?: 'ok' | 'error'
  /** Ids de las opiniones borradas, para que los tests lo verifiquen */
  borrados?: string[]
  /** Registra el service worker real. Por defecto no, para que los tests no dependan de su caché. */
  sw?: boolean
  /** Simula que hay una versión nueva esperando */
  actualizacion?: boolean
  /** Lo marca el mock cuando la persona toca "Actualizar" */
  actualizada?: boolean
}

declare global {
  interface Window {
    __VP_MOCK__?: EscenarioMock
  }
}

export function escenario(): EscenarioMock {
  window.__VP_MOCK__ ??= {}
  return window.__VP_MOCK__
}

export const esperar = (ms = 30) => new Promise<void>((resolver) => setTimeout(resolver, ms))
