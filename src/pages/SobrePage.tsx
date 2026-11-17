import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Filete } from '../components/Adornos'
import { useTitulo } from '../hooks/useTitulo'

const REPO = 'https://github.com/JuanTrezza/encuesta-caba-pwa'

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="font-display text-2xl">
        {titulo}
      </h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function Externo({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="enlace" target="_blank" rel="noreferrer">
      {children}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  )
}

export function SobrePage() {
  useTitulo('Sobre el proyecto')

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <h1 className="font-display text-4xl leading-tight">Sobre el proyecto</h1>
      <Filete className="mt-4 text-ocre" />

      <div className="mt-4 space-y-8 text-lg leading-relaxed">
        <Seccion id="que-es" titulo="Qué es">
          <p>
            Voz Porteña junta opiniones de vecinos sobre siete temas de la vida cotidiana en Buenos Aires. Cualquiera
            puede leerlas. Para opinar, alcanza con tener una cuenta.
          </p>
        </Seccion>

        <Seccion id="independiente" titulo="Es independiente">
          <p>
            Este sitio no es del Gobierno de la Ciudad de Buenos Aires ni tiene relación con él. Tampoco pertenece a un
            partido ni a una empresa. Lo hace una persona, por su cuenta.
          </p>
          <p>
            Las opiniones no llegan a ningún organismo público. Si necesitás hacer un reclamo, este no es el lugar para
            iniciarlo.
          </p>
          <p>Los resultados muestran lo que opinó quien quiso participar. No son una encuesta representativa.</p>
        </Seccion>

        <Seccion id="datos" titulo="Qué datos se guardan">
          <p>Cuando opinás, se guarda esto, y cualquiera puede verlo:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>tu puntuación y tu comentario;</li>
            <li>el tema y, si lo elegiste, el barrio;</li>
            <li>la fecha;</li>
            <li>
              un código de tu cuenta, que es una serie de letras y números. No dice quién sos, pero permite saber qué
              opiniones salieron de la misma cuenta.
            </li>
          </ul>
          <p>
            <strong>Tu nombre y tu mail no se guardan en la opinión.</strong> Quedan solo en el sistema de ingreso
            (Firebase Authentication, un servicio de Google), que es lo que te permite entrar. Quien mantiene el
            proyecto puede verlos ahí, y nadie más.
          </p>
          <p>
            En tu dispositivo se guardan las opiniones que escribiste sin conexión, hasta que se envían, y lo que ya
            viste, para poder mostrarlo sin conexión.
          </p>
        </Seccion>

        <Seccion id="borrar" titulo="Cómo borrar una opinión">
          <p>
            Cada persona borra lo suyo. Las opiniones no se pueden editar, para que nadie altere lo que dijo otro, pero
            podés borrar las tuyas cuando quieras.
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              Ingresá y abrí <strong>Mis opiniones</strong> desde el menú de tu cuenta. Ahí están todas las que
              publicaste, cada una con su botón <strong>Borrar</strong>.
            </li>
            <li>
              También ves ese botón en tus opiniones cuando entrás a un tema, y las demás no lo tienen.
            </li>
            <li>Te pedimos confirmación antes de borrar. Una vez borrada, no se puede recuperar.</li>
          </ul>
          <p>
            <strong>Las opiniones viejas</strong>, de antes de que el sitio guardara el código de cuenta, no se pueden
            borrar desde acá: no tienen ningún dato que permita saber de quién son. Si una es tuya, pedí que la borren:
          </p>
          <ol className="list-decimal space-y-1 pl-6">
            <li>
              Abrí un pedido en <Externo href={`${REPO}/issues/new`}>la página del proyecto en GitHub</Externo>.
              Necesitás una cuenta de GitHub.
            </li>
            <li>Indicá el tema, la fecha y las primeras palabras del comentario.</li>
            <li>Quien mantiene el proyecto la revisa, la borra a mano y te avisa en ese mismo pedido.</li>
          </ol>
          <p>
            El pedido es público: no pongas ahí tu mail ni otros datos personales. Por el mismo medio podés pedir que se
            elimine tu cuenta.
          </p>
        </Seccion>

        <Seccion id="codigo" titulo="Código abierto">
          <p>
            Lo hace Juan Moreno Trezza y el código está en <Externo href={REPO}>GitHub</Externo>. Los límites de los
            barrios del mapa salen de los datos abiertos de la Ciudad, con licencia CC BY 2.5 AR.
          </p>
        </Seccion>
      </div>

      <Link to="/opinar" className="boton-primario mt-8">
        Dar mi opinión
      </Link>
    </div>
  )
}
