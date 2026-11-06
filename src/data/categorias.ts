// Los ids son los valores que ya están guardados en Firestore (campo `categoria`): no cambiarlos.
export const CATEGORIAS = [
  {
    id: 'limpieza',
    nombre: 'Limpieza',
    descripcion: 'Veredas, contenedores y recolección en tu cuadra.',
  },
  {
    id: 'transporte',
    nombre: 'Transporte',
    descripcion: 'Colectivos, frecuencias, paradas y cómo se viaja.',
  },
  {
    id: 'verdes',
    nombre: 'Espacios Verdes',
    descripcion: 'Plazas, parques, arbolado y lugares para estar.',
  },
  {
    id: 'eventos',
    nombre: 'Eventos Gratuitos',
    descripcion: 'Ferias, recitales y propuestas culturales abiertas.',
  },
  {
    id: 'subte',
    nombre: 'Subte',
    descripcion: 'Estaciones, frecuencias y estado de las líneas.',
  },
  {
    id: 'seguridad',
    nombre: 'Seguridad',
    descripcion: 'Cómo te sentís caminando el barrio, de día y de noche.',
  },
  {
    id: 'accesibilidad',
    nombre: 'Accesibilidad',
    descripcion: 'Rampas, ascensores y veredas transitables para todos.',
  },
] as const

export type Categoria = (typeof CATEGORIAS)[number]
export type CategoriaId = Categoria['id']

export function buscarCategoria(id: string | null | undefined): Categoria | undefined {
  return CATEGORIAS.find((c) => c.id === id)
}
