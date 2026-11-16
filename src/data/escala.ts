// Escala secuencial de un solo tono, de claro a oscuro: se distingue por luminosidad, así que
// funciona igual con cualquier tipo de daltonismo. Los valores siempre se muestran también en texto.
export const ESCALA = [
  { hasta: 1.7, color: '#E3EFE9', texto: '1,0 a 1,7' },
  { hasta: 2.5, color: '#B5D4C7', texto: '1,8 a 2,5' },
  { hasta: 3.3, color: '#7FB5A1', texto: '2,6 a 3,3' },
  { hasta: 4.1, color: '#45907A', texto: '3,4 a 4,1' },
  { hasta: 5, color: '#17594A', texto: '4,2 a 5,0' },
] as const

export const COLOR_SIN_DATOS = '#FFFBF3'

export function colorPorPromedio(promedio: number): string {
  const redondeado = Math.round(promedio * 10) / 10
  return (ESCALA.find((tramo) => redondeado <= tramo.hasta) ?? ESCALA[4]).color
}
