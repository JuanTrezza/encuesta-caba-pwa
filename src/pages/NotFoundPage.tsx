import { Link } from 'react-router-dom'
import { useTitulo } from '../hooks/useTitulo'

export function NotFoundPage() {
  useTitulo('Página no encontrada')

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <p className="font-display text-8xl leading-none text-rojo" aria-hidden="true">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl">Este colectivo no pasa por acá</h1>
      <p className="mt-2 text-adoquin">La página que buscás no existe o cambió de recorrido.</p>
      <Link to="/" className="boton-primario mt-6">
        Volver al inicio
      </Link>
    </div>
  )
}
