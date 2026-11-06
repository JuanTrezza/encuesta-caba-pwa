/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crema: '#F8F1E4', // papel de cartel: fondo general
        papel: '#FFFBF3', // tarjetas y campos
        tinta: '#2B2622', // adoquín mojado: texto principal
        adoquin: '#5E564E', // adoquín seco: texto secundario
        piedra: '#DDD3C3', // bordes decorativos y grilla
        junta: '#7A7066', // bordes de controles (3:1 sobre crema y papel)
        rojo: { DEFAULT: '#A92C1C', oscuro: '#86210F' }, // chapa de colectivo
        verde: { DEFAULT: '#17594A', oscuro: '#0F4337' }, // filete
        ocre: '#B26B00', // estrellas y detalles de filete
      },
      fontFamily: {
        display: ['"Rozha One"', 'Georgia', 'serif'],
        sans: ['"Atkinson Hyperlegible"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        cartel: '0 2px 0 #DDD3C3',
      },
    },
  },
  plugins: [],
}
