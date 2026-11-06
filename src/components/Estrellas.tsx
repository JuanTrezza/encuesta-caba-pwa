const PATH_ESTRELLA = 'M12 2.5l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6-4.9-4.6 6.7-.9Z'

export function IconoEstrella({ llena, className = 'h-5 w-5' }: { llena: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} shrink-0 text-ocre`}
      fill={llena ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATH_ESTRELLA} />
    </svg>
  )
}

export function formatearPromedio(valor: number): string {
  return valor.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Solo lectura. Admite decimales: la fila llena se recorta según el valor. */
export function Estrellas({ valor, className = 'h-5 w-5' }: { valor: number; className?: string }) {
  const posiciones = [1, 2, 3, 4, 5]
  return (
    <span
      role="img"
      aria-label={`${formatearPromedio(valor).replace(/,0$/, '')} de 5 estrellas`}
      className="relative inline-flex w-fit"
    >
      <span className="inline-flex">
        {posiciones.map((n) => (
          <IconoEstrella key={n} llena={false} className={className} />
        ))}
      </span>
      <span className="absolute inset-y-0 left-0 inline-flex overflow-hidden" style={{ width: `${(valor / 5) * 100}%` }}>
        {posiciones.map((n) => (
          <IconoEstrella key={n} llena className={className} />
        ))}
      </span>
    </span>
  )
}
