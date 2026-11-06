import type { CategoriaId } from '../data/categorias'

export const MAX_COMENTARIO = 500

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
}

export interface NuevoComentario {
  texto: string
  calificacion: Calificacion
  categoria: CategoriaId
  barrio?: string
}

export interface ResumenCategoria {
  total: number
  /** 0 cuando todavía no hay opiniones */
  promedio: number
  distribucion: Record<Calificacion, number>
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
