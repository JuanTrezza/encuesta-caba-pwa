/** Filete reinterpretado: dos rulos en espejo y un rombo, sin relleno. Solo decorativo. */
export function Filete({ className = 'text-ocre' }: { className?: string }) {
  const rulo = 'M0 12h44c10 0 16-3 16-8 0-3.5-5-4.5-6.5-1.5-1 2 1 3.5 2.5 2.5'
  return (
    <svg viewBox="0 0 160 24" className={`h-5 w-40 ${className}`} fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d={rulo} transform="translate(4 2)" />
        <path d={rulo} transform="translate(156 2) scale(-1 1)" />
      </g>
      <path fill="currentColor" d="M80 8l6 6-6 6-6-6Z" />
    </svg>
  )
}

/** Las franjas de la carrocería de un colectivo: rojo, crema, verde */
export function Franjas() {
  return (
    <div aria-hidden="true">
      <div className="h-1.5 bg-rojo" />
      <div className="h-1 bg-crema" />
      <div className="h-1 bg-verde" />
    </div>
  )
}

/** Banda de adoquines en hilera trabada */
export function Adoquines() {
  return (
    <svg className="block h-8 w-full text-tinta" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="adoquines" width="44" height="32" patternUnits="userSpaceOnUse">
          <g fill="#7A7066">
            <rect x="1" y="1" width="42" height="14" rx="3" />
            <rect x="-21" y="17" width="42" height="14" rx="3" />
            <rect x="23" y="17" width="42" height="14" rx="3" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="currentColor" />
      <rect width="100%" height="100%" fill="url(#adoquines)" />
    </svg>
  )
}
