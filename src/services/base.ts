// Base IndexedDB de la app: la cola de opiniones sin enviar y la caché de agregados.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { OpinionPendiente } from './types'

export interface AgregadoGuardado {
  clave: string
  valor: unknown
  /** Cuándo lo respondió el servidor, en milisegundos */
  momento: number
}

interface Esquema extends DBSchema {
  pendientes: { key: number; value: OpinionPendiente }
  agregados: { key: string; value: AgregadoGuardado }
}

let base: Promise<IDBPDatabase<Esquema>> | undefined

export function abrirBase(): Promise<IDBPDatabase<Esquema>> {
  base ??= openDB<Esquema>('voz-portena', 2, {
    upgrade(db, versionAnterior) {
      if (versionAnterior < 1) db.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true })
      if (versionAnterior < 2) db.createObjectStore('agregados', { keyPath: 'clave' })
    },
  })
  return base
}
