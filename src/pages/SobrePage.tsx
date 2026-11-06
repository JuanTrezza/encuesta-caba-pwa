import { Link } from 'react-router-dom'
import { Filete } from '../components/Adornos'
import { useTitulo } from '../hooks/useTitulo'

export function SobrePage() {
  useTitulo('Sobre el proyecto')

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Sobre el proyecto</h1>
      <Filete className="mt-4 text-ocre" />

      <div className="mt-4 space-y-8 text-lg leading-relaxed">
        <section aria-labelledby="que-es">
          <h2 id="que-es" className="font-display text-2xl">
            Qué es
          </h2>
          <p className="mt-2">
            Voz Porteña junta opiniones de vecinos sobre siete temas de la vida cotidiana en Buenos Aires. Cualquiera
            puede leerlas. Para opinar, alcanza con tener una cuenta.
          </p>
        </section>

        <section aria-labelledby="independiente">
          <h2 id="independiente" className="font-display text-2xl">
            Es independiente
          </h2>
          <p className="mt-2">
            No pertenece a ningún gobierno, partido ni empresa, y las opiniones no llegan a ningún organismo público. Si
            necesitás hacer un reclamo, este no es el lugar para iniciarlo.
          </p>
          <p className="mt-2">
            Los resultados muestran lo que opinó quien quiso participar. No son una encuesta representativa.
          </p>
        </section>

        <section aria-labelledby="datos">
          <h2 id="datos" className="font-display text-2xl">
            Qué pasa con tus datos
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Se publican tu puntuación, tu comentario, la fecha y, si lo elegís, tu barrio.</li>
            <li>Tu nombre y tu mail no se guardan junto a tu opinión.</li>
            <li>
              Cada opinión guarda un código interno de tu cuenta. No muestra quién sos, pero es público en la base de
              datos y permite saber qué opiniones salieron de la misma cuenta.
            </li>
          </ul>
        </section>

        <section aria-labelledby="codigo">
          <h2 id="codigo" className="font-display text-2xl">
            Código abierto
          </h2>
          <p className="mt-2">
            Lo hace Juan Moreno Trezza y el código está en{' '}
            <a
              href="https://github.com/JuanTrezza/encuesta-caba-pwa"
              className="enlace"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>

      <Link to="/opinar" className="boton-primario mt-8">
        Dar mi opinión
      </Link>
    </div>
  )
}
