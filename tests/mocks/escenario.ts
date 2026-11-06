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
