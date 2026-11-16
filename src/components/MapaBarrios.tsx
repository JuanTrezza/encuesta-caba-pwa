// Leaflet y su CSS quedan en el chunk de esta página: se descargan recién al entrar al mapa.
import 'leaflet/dist/leaflet.css'
import type { Feature, FeatureCollection } from 'geojson'
import { geoJSON, type Layer, type PathOptions } from 'leaflet'
import { useMemo } from 'react'
import { GeoJSON, MapContainer, ZoomControl } from 'react-leaflet'
import { COLOR_SIN_DATOS, colorPorPromedio } from '../data/escala'
import { MINIMO_OPINIONES, type EstadisticaBarrio } from '../services/types'
import { formatearPromedio } from './Estrellas'

interface Props {
  geo: FeatureCollection
  datos: EstadisticaBarrio[]
  /** Cambia con la categoría: fuerza a redibujar colores y tooltips */
  clave: string
}

export function tieneDatos(estadistica: EstadisticaBarrio | undefined): estadistica is EstadisticaBarrio {
  return estadistica !== undefined && estadistica.total >= MINIMO_OPINIONES
}

export function describirBarrio(estadistica: EstadisticaBarrio | undefined): string {
  const total = estadistica?.total ?? 0
  const opiniones = `${total.toLocaleString('es-AR')} ${total === 1 ? 'opinión' : 'opiniones'}`
  return tieneDatos(estadistica)
    ? `Promedio ${formatearPromedio(estadistica.promedio)} · ${opiniones}`
    : `Sin datos (${opiniones})`
}

/** Coroplético sin mapa base: solo los barrios, así no depende de un servidor de teselas ni de la conexión */
export default function MapaBarrios({ geo, datos, clave }: Props) {
  const porBarrio = useMemo(() => new Map(datos.map((d) => [d.barrio, d])), [datos])
  const limites = useMemo(() => geoJSON(geo).getBounds(), [geo])

  const nombreDe = (feature: Feature | undefined) => String(feature?.properties?.barrio ?? '')

  function estilo(feature?: Feature): PathOptions {
    const estadistica = porBarrio.get(nombreDe(feature))
    const conDatos = tieneDatos(estadistica)
    return {
      fillColor: conDatos ? colorPorPromedio(estadistica.promedio) : COLOR_SIN_DATOS,
      fillOpacity: 1,
      color: '#2B2622',
      weight: 1,
      dashArray: conDatos ? undefined : '3 3',
    }
  }

  function cadaBarrio(feature: Feature, capa: Layer) {
    const nombre = nombreDe(feature)
    const caja = document.createElement('div')
    const titulo = document.createElement('strong')
    titulo.textContent = nombre
    const detalle = document.createElement('div')
    detalle.textContent = describirBarrio(porBarrio.get(nombre))
    caja.append(titulo, detalle)
    capa.bindTooltip(caja, { sticky: true })
  }

  return (
    <MapContainer
      bounds={limites}
      maxBounds={limites.pad(0.3)}
      minZoom={10}
      zoomSnap={0.25}
      zoomControl={false}
      scrollWheelZoom={false}
      // El CSS de Leaflet se carga después que el del sitio: sin ! pisaría el fondo y la tipografía
      className="h-[24rem] w-full rounded-md border-2 border-tinta !bg-crema !font-sans md:h-[34rem]"
    >
      <ZoomControl position="topright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />
      <GeoJSON
        key={clave}
        data={geo}
        style={estilo}
        onEachFeature={cadaBarrio}
        attribution="Límites de barrios: BA Data, CC BY 2.5 AR"
      />
    </MapContainer>
  )
}
