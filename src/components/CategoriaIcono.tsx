import type { ReactNode } from 'react'
import type { CategoriaId } from '../data/categorias'

const TRAZOS: Record<CategoriaId, ReactNode> = {
  limpieza: (
    <>
      <path d="M20 3l-8.5 8.5" />
      <path d="M9.8 9.5l4.7 4.7c-1 3.3-4.5 6-9.5 6.8L3 19c2.7-2 3-6.5 6.8-9.5Z" />
      <path d="M8 18l1.8-1.8" />
    </>
  ),
  transporte: (
    <>
      <rect x="4" y="3.5" width="16" height="14" rx="2.5" />
      <path d="M4 11h16M12 3.5V11" />
      <path d="M7.5 17.5V20M16.5 17.5V20" />
      <circle cx="8" cy="14.3" r=".8" fill="currentColor" />
      <circle cx="16" cy="14.3" r=".8" fill="currentColor" />
    </>
  ),
  verdes: (
    <>
      <path d="M12 3a6 6 0 0 0-5.6 8.1A3.8 3.8 0 0 0 8 18.3h8a3.8 3.8 0 0 0 1.6-7.2A6 6 0 0 0 12 3Z" />
      <path d="M12 21.5v-9M12 15.5l-2.8-2.5M12 14l2.3-2" />
    </>
  ),
  eventos: (
    <>
      <path d="M3.5 8a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v2.3a1.8 1.8 0 0 0 0 3.4V16a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-2.3a1.8 1.8 0 0 0 0-3.4Z" />
      <path d="M15 6v2M15 11v2M15 16v2" />
    </>
  ),
  subte: (
    <>
      <rect x="6" y="3" width="12" height="14" rx="3" />
      <path d="M6 10h12" />
      <circle cx="9.5" cy="13.5" r=".8" fill="currentColor" />
      <circle cx="14.5" cy="13.5" r=".8" fill="currentColor" />
      <path d="M9 17l-2.5 4M15 17l2.5 4M7.7 19h8.6" />
    </>
  ),
  seguridad: (
    <>
      <path d="M12 3l7 2.8V11c0 4.7-2.8 8.2-7 10-4.2-1.8-7-5.3-7-10V5.8Z" />
      <path d="M9 12l2.2 2.2L15.2 10" />
    </>
  ),
  accesibilidad: (
    <>
      <circle cx="10.5" cy="4.5" r="1.7" />
      <path d="M10.5 8.5v6h4.8l2.7 5" />
      <path d="M10.5 11h4.5" />
      <path d="M7.8 12.2a4.8 4.8 0 1 0 6.9 5.8" />
    </>
  ),
}

export function CategoriaIcono({ id, className = 'h-7 w-7' }: { id: CategoriaId; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[id]}
    </svg>
  )
}
