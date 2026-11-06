import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { fallo: boolean }> {
  override state = { fallo: false }

  static getDerivedStateFromError() {
    return { fallo: true }
  }

  override render() {
    if (!this.state.fallo) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl">Algo se rompió</h1>
        <p className="mt-2">Recargá la página. Si vuelve a pasar, probá en un rato.</p>
        <button type="button" onClick={() => location.reload()} className="boton-primario mt-4">
          Recargar
        </button>
      </div>
    )
  }
}
