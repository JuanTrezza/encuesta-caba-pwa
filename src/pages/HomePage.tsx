import { Link } from 'react-router-dom'
import { Filete } from '../components/Adornos'
import { CategoriaIcono } from '../components/CategoriaIcono'
import { CATEGORIAS } from '../data/categorias'
import { useTitulo } from '../hooks/useTitulo'

const PASOS = [
  { titulo: 'Elegí un tema', texto: 'Limpieza, subte, plazas: lo que te toque de cerca.' },
  { titulo: 'Entrá con tu cuenta', texto: 'Con Google o con tu mail. Tu nombre no se publica.' },
  { titulo: 'Puntuá y contá', texto: 'De una a cinco estrellas y un comentario breve. Si querés, sumá tu barrio.' },
]

export function HomePage() {
  useTitulo('Inicio')

  return (
    <>
      <section className="sobre-oscuro bg-rojo text-crema">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_auto] md:py-16">
          <div>
            <h1 className="font-display text-5xl leading-[1.05] md:text-7xl">
              ¿Cómo anda tu barrio? <span className="block">Decilo.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed md:text-xl">
              Voz Porteña es un espacio independiente para puntuar y comentar cómo funciona la vida cotidiana en Buenos
              Aires, de la vereda de tu cuadra al subte de todos los días.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/opinar" className="boton-claro text-lg">
                Dar mi opinión
              </Link>
              <Link
                to="/sobre"
                className="boton border-2 border-crema text-crema hover:bg-crema hover:text-rojo-oscuro"
              >
                Sobre el proyecto
              </Link>
            </div>
          </div>

          {/* Chapa de colectivo: en lugar de un ramal, lo que abarca el proyecto */}
          <div className="w-full max-w-xs rounded-xl bg-crema p-2 text-tinta shadow-[0_6px_0_#86210F] md:w-72">
            <div className="rounded-lg border-2 border-tinta p-5 text-center">
              <p className="font-display text-8xl leading-none text-rojo">48</p>
              <p className="mt-1 text-lg font-bold">barrios</p>
              <Filete className="mx-auto my-3 text-ocre" />
              <p className="font-display text-5xl leading-none text-verde">7</p>
              <p className="mt-1 text-lg font-bold">temas para opinar</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 id="como-funciona" className="font-display text-3xl md:text-4xl">
          Cómo funciona
        </h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {PASOS.map((paso, i) => (
            <li key={paso.titulo} className="flex gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-verde font-display text-2xl text-crema"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold">{paso.titulo}</h3>
                <p className="mt-1 text-adoquin">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="temas" className="mx-auto max-w-6xl px-4 pt-12">
        <h2 id="temas" className="font-display text-3xl md:text-4xl">
          Los temas
        </h2>
        <p className="mt-2 text-adoquin">Entrá a uno para ver el promedio y qué dicen los vecinos.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((categoria) => (
            <li key={categoria.id}>
              <Link
                to={`/categoria/${categoria.id}`}
                className="cartel group flex h-full flex-col p-4 no-underline shadow-cartel transition-colors hover:border-rojo"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-crema text-rojo">
                  <CategoriaIcono id={categoria.id} />
                </span>
                <span className="mt-3 text-lg font-bold group-hover:text-rojo">{categoria.nombre}</span>
                <span className="mt-1 text-adoquin">{categoria.descripcion}</span>
              </Link>
            </li>
          ))}
          <li className="sobre-oscuro flex flex-col justify-between gap-4 rounded-lg bg-verde p-4 text-crema">
            <p className="font-display text-2xl leading-tight">Tu cuadra también cuenta.</p>
            <Link to="/opinar" className="boton-claro self-start text-verde-oscuro">
              Opinar ahora
            </Link>
          </li>
        </ul>
      </section>
    </>
  )
}
