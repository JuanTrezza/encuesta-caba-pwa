import type { CategoriaId } from '../data/categorias'

export const MAX_COMENTARIO = 500

/** Con menos opiniones que estas, un barrio figura como "sin datos" en el mapa y en los rankings */
export const MINIMO_OPINIONES = 3

/** Cuántas opiniones propias trae "Mis opiniones". Si hay más, se muestran las más nuevas. */
export const MAX_MIS_OPINIONES = 100

export type Calificacion = 1 | 2 | 3 | 4 | 5

export interface Usuario {
  uid: string
  email: string | null
  nombre: string | null
}

/** Documento de la colección `comentarios`, ya normalizado para la app */
export interface Comentario {
  id: string
  texto: string
  calificacion: Calificacion
  /** Siempre ISO 8601. En Firestore es un Timestamp en los documentos nuevos y un string en los viejos. */
  fecha: string
  categoria: CategoriaId
  /** Campo nuevo y opcional: los documentos viejos no lo tienen */
  barrio?: string
  /**
   * Código de la cuenta que la escribió. Las opiniones viejas no lo tienen, y por eso no se pueden borrar
   * desde la app. Es público en Firestore: la interfaz solo lo compara con el de la sesión.
   */
  uid?: string
}

export interface NuevoComentario {
  texto: string
  calificacion: Calificacion
  categoria: CategoriaId
  barrio?: string
}

/** Opinión escrita sin conexión, guardada en IndexedDB hasta poder enviarla */
export interface OpinionPendiente extends NuevoComentario {
  id: number
  /** Cuenta que la escribió: las reglas exigen enviarla con ese mismo uid */
  uid: string
  /** Cuándo se escribió. Solo se muestra: la fecha del documento la pone el servidor al enviar. */
  creado: string
  /** Si el servidor la rechazó, el motivo. No se reintenta sola. */
  error?: string
}

export interface Promedio {
  total: number
  /** 0 cuando todavía no hay opiniones */
  promedio: number
}

export interface ResumenCategoria extends Promedio {
  distribucion: Record<Calificacion, number>
}

export interface Panorama {
  general: ResumenCategoria
  categorias: (Promedio & { id: CategoriaId })[]
}

export interface PuntoMensual {
  /** AAAA-MM */
  mes: string
  total: number
  /** null si ese mes no hubo opiniones */
  promedio: number | null
}

export interface EstadisticaBarrio extends Promedio {
  barrio: string
}

/** Error con un mensaje listo para mostrar: las páginas no conocen los códigos de Firebase */
export class ErrorServicio extends Error {
  readonly codigo: string

  constructor(mensaje: string, codigo = 'desconocido') {
    super(mensaje)
    this.name = 'ErrorServicio'
    this.codigo = codigo
  }
}

export const CODIGO_CANCELADO = 'cancelado'

/** Fallas de red: la operación se puede reintentar más tarde */
export function esErrorDeRed(error: unknown): boolean {
  return error instanceof ErrorServicio && (error.codigo === 'unavailable' || error.codigo === 'sin-conexion')
}
