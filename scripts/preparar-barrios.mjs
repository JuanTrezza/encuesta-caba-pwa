// Regenera public/barrios.geojson a partir de los datos abiertos de la Ciudad. Corre con: node scripts/preparar-barrios.mjs
// Fuente: "Barrios", Buenos Aires Data (https://data.buenosaires.gob.ar/dataset/barrios), licencia CC BY 2.5 AR.
import { readFileSync, writeFileSync } from 'node:fs'

const ORIGEN = 'https://cdn.buenosaires.gob.ar/datosabiertos/datasets/ministerio-de-educacion/barrios/barrios.geojson'
const DESTINO = new URL('../public/barrios.geojson', import.meta.url)
// 4 decimales son unos 11 metros. Redondear (en vez de simplificar cada polígono) mantiene iguales los bordes compartidos.
const DECIMALES = 4
const DISTINTOS = { paternal: 'La Paternal', monserrat: 'Montserrat', 'villa gral. mitre': 'Villa General Mitre' }

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const fuenteBarrios = readFileSync(new URL('../src/data/barrios.ts', import.meta.url), 'utf8')
const BARRIOS = [...fuenteBarrios.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1])
const porNombre = new Map(BARRIOS.map((b) => [normalizar(b), b]))

const original = await (await fetch(ORIGEN)).json()
const usados = new Set()

const features = original.features.map((f) => {
  const crudo = normalizar(f.properties.nombre)
  const barrio = DISTINTOS[crudo] ?? porNombre.get(crudo)
  if (!barrio) throw new Error(`Barrio sin equivalencia: ${f.properties.nombre}`)
  usados.add(barrio)
  const anillos = f.geometry.coordinates.map((anillo) => {
    const puntos = []
    for (const [x, y] of anillo) {
      const p = [Number(x.toFixed(DECIMALES)), Number(y.toFixed(DECIMALES))]
      const ultimo = puntos[puntos.length - 1]
      if (!ultimo || ultimo[0] !== p[0] || ultimo[1] !== p[1]) puntos.push(p)
    }
    return puntos
  })
  return { type: 'Feature', properties: { barrio }, geometry: { type: f.geometry.type, coordinates: anillos } }
})

const faltan = BARRIOS.filter((b) => !usados.has(b))
if (BARRIOS.length !== 48 || features.length !== 48 || faltan.length > 0) {
  throw new Error(`Se esperaban 48 barrios. Faltan: ${faltan.join(', ') || 'ninguno'}`)
}

features.sort((a, b) => a.properties.barrio.localeCompare(b.properties.barrio, 'es'))
const salida = JSON.stringify({ type: 'FeatureCollection', features })
writeFileSync(DESTINO, salida)
console.log(`public/barrios.geojson: ${features.length} barrios, ${(salida.length / 1024).toFixed(0)} kB`)
