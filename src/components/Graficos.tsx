// Recharts queda en un chunk aparte: se descarga recién al entrar a Resultados.
// Los gráficos son un refuerzo visual: cada uno tiene al lado una tabla con los mismos datos.
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatearPromedio } from './Estrellas'

const TINTA = '#2B2622'
const ADOQUIN = '#5E564E'
const PIEDRA = '#DDD3C3'
const ESTILO_TOOLTIP = { background: '#FFFBF3', border: `2px solid ${TINTA}`, borderRadius: 6, color: TINTA }

const comoPromedio = (valor: unknown) => (typeof valor === 'number' ? formatearPromedio(valor) : '')

export function GraficoTemas({ datos }: { datos: { nombre: string; promedio: number }[] }) {
  return (
    <div aria-hidden="true" className="h-[20rem]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }} accessibilityLayer={false}>
          <CartesianGrid horizontal={false} stroke={PIEDRA} />
          <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: ADOQUIN, fontSize: 12 }} stroke={PIEDRA} />
          <YAxis type="category" dataKey="nombre" width={112} tick={{ fill: TINTA, fontSize: 12 }} stroke={PIEDRA} />
          <Tooltip cursor={{ fill: PIEDRA, opacity: 0.4 }} contentStyle={ESTILO_TOOLTIP} formatter={(valor) => [comoPromedio(valor), 'Promedio']} />
          <Bar dataKey="promedio" fill="#17594A" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
            <LabelList dataKey="promedio" position="right" formatter={comoPromedio} fill={TINTA} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function GraficoEvolucion({ datos }: { datos: { etiqueta: string; promedio: number | null; total: number }[] }) {
  return (
    <div aria-hidden="true" className="h-[18rem]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 4, left: -24 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} stroke={PIEDRA} />
          <XAxis dataKey="etiqueta" tick={{ fill: ADOQUIN, fontSize: 12 }} stroke={PIEDRA} interval="preserveStartEnd" minTickGap={16} />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: ADOQUIN, fontSize: 12 }} stroke={PIEDRA} />
          <Tooltip contentStyle={ESTILO_TOOLTIP} formatter={(valor) => [comoPromedio(valor), 'Promedio']} />
          <Line
            dataKey="promedio"
            stroke="#A92C1C"
            strokeWidth={2}
            dot={{ r: 4, fill: '#A92C1C', stroke: '#FFFBF3', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
