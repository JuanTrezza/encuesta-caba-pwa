import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'
import { obtenerApp } from './firebase'

let db: Firestore | undefined

/** Firestore con caché en IndexedDB: los comentarios ya vistos se pueden leer sin conexión */
export function obtenerDb(): Firestore {
  db ??= initializeFirestore(obtenerApp(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  return db
}
