import { mkdirSync } from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { expect, test as base, type Page } from '@playwright/test'
import type {} from './mocks/escenario'

const AVISO = 'Proyecto independiente, sin relación con el Gobierno de la Ciudad de Buenos Aires'
const USUARIO = { uid: 'u1', email: 'vecina@example.com', nombre: 'Vecina' }

interface Escenario {
  usuario?: typeof USUARIO | null
  datos?: 'ok' | 'vacio' | 'error' | 'lento'
  errorUnaVez?: boolean
  envio?: 'ok' | 'error'
  sw?: boolean
  actualizacion?: boolean
}

/** Cada test falla si hubo errores de consola, excepciones o un pedido a Firebase */
const test = base.extend<{ guardia: void }>({
  guardia: [
    async ({ page }, usar) => {
      const problemas: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error') problemas.push(`consola: ${m.text()}`)
      })
      page.on('pageerror', (e) => problemas.push(`excepción: ${e.message}`))
      page.on('request', (r) => {
        if (/firestore\.googleapis|identitytoolkit|securetoken|firebaseapp\.com|firebaseio/.test(r.url())) {
          problemas.push(`pedido a Firebase: ${r.url()}`)
        }
      })
      await usar()
      expect(problemas).toEqual([])
    },
    { auto: true },
  ],
})

async function abrir(page: Page, ruta: string, escenario: Escenario = {}) {
  await page.addInitScript((e) => {
    window.__VP_MOCK__ = e
  }, escenario)
  await page.goto(`./#${ruta}`)
}

/** En pantallas angostas la navegación está dentro del menú */
async function abrirMenuSiHay(page: Page) {
  const boton = page.getByRole('button', { name: 'Abrir el menú' })
  if (await boton.isVisible()) await boton.click()
}

/** Textos visibles que ocupan más de una línea o se salen de la pantalla */
function textosCortados(page: Page, selector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const raiz = document.querySelector(sel)
    if (!raiz) return [`no existe ${sel}`]
    const problemas: string[] = []
    const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
    while (recorrido.nextNode()) {
      const nodo = recorrido.currentNode
      const texto = nodo.textContent?.trim()
      if (!texto) continue
      // Los textos solo para lectores de pantalla no ocupan lugar
      if (nodo.parentElement?.closest('.sr-only')) continue
      const rango = document.createRange()
      rango.selectNodeContents(nodo)
      // Los textos solo para lectores de pantalla miden 1 px
      const cajas = [...rango.getClientRects()].filter((caja) => caja.width > 1 && caja.height > 1)
      const lineas = new Set(cajas.map((caja) => Math.round(caja.top))).size
      if (lineas > 1) problemas.push(`"${texto}" ocupa ${lineas} líneas`)
      if (cajas.some((caja) => caja.left < 0 || caja.right > window.innerWidth + 0.5)) problemas.push(`"${texto}" se sale de la pantalla`)
    }
    return problemas
  }, selector)
}

async function comprobarPagina(page: Page, nombre: string, proyecto: string) {
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.getByRole('contentinfo')).toContainText(AVISO)
  await expect(page.locator('body')).not.toContainText(/oficial/i)

  const scroll = await page.evaluate(() => {
    const raiz = document.documentElement
    return { documento: raiz.scrollWidth, ventana: raiz.clientWidth }
  })
  expect(scroll.documento, 'scroll horizontal').toBeLessThanOrEqual(scroll.ventana)

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])

  mkdirSync('screenshots', { recursive: true })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `screenshots/${proyecto}-${nombre}.png`, fullPage: true })
}

test.describe('recorrido de páginas', () => {
  test('inicio', async ({ page }, info) => {
    await abrir(page, '/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Cómo anda tu barrio?')
    const temas = page.getByRole('region', { name: 'Los temas' })
    await expect(temas.getByRole('listitem').getByRole('link').filter({ hasNotText: 'Opinar ahora' })).toHaveCount(7)
    await comprobarPagina(page, 'inicio', info.project.name)
  })

  test('categoría con datos', async ({ page }, info) => {
    await abrir(page, '/categoria/transporte')
    await expect(page.getByRole('heading', { level: 1, name: 'Transporte' })).toBeVisible()
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await expect(page.getByText('4,3', { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Distribución de estrellas' }).getByRole('listitem')).toHaveCount(5)
    await expect(page.getByText('68 (53%)')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Opinar', exact: true })).toHaveAttribute('href', '#/opinar?categoria=transporte')
    await expect(page.getByText('Villa General Mitre')).toBeVisible()
    await expect(page.getByText('Comentario guardado por la app anterior.')).toBeVisible()
    await comprobarPagina(page, 'categoria', info.project.name)
  })

  test('opinar', async ({ page }, info) => {
    await abrir(page, '/opinar?categoria=subte', { usuario: USUARIO })
    await expect(page.getByLabel(/^Tema/)).toHaveValue('subte')
    await comprobarPagina(page, 'opinar', info.project.name)
  })

  test('ingresar y registrarse', async ({ page }, info) => {
    await abrir(page, '/ingresar')
    await expect(page.getByRole('heading', { level: 1, name: 'Ingresar' })).toBeVisible()
    await comprobarPagina(page, 'ingresar', info.project.name)
    await page.getByRole('button', { name: 'Registrate' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeVisible()
    await comprobarPagina(page, 'registrarse', info.project.name)
  })

  test('sobre el proyecto', async ({ page }, info) => {
    await abrir(page, '/sobre')
    await expect(page.getByRole('heading', { level: 1, name: 'Sobre el proyecto' })).toBeVisible()
    await comprobarPagina(page, 'sobre', info.project.name)
  })

  test('404, por ruta y por categoría inexistente', async ({ page }, info) => {
    await abrir(page, '/no-existe')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Este colectivo no pasa por acá')
    await comprobarPagina(page, '404', info.project.name)
    await page.goto('./#/categoria/inventada')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Este colectivo no pasa por acá')
  })
})

test.describe('estados de la categoría', () => {
  test('vacío', async ({ page }, info) => {
    await abrir(page, '/categoria/verdes', { datos: 'vacio' })
    await expect(page.getByText('Todavía nadie opinó sobre este tema')).toBeVisible()
    await expect(page.getByText('Todavía no hay puntuaciones en este tema.')).toBeVisible()
    await comprobarPagina(page, 'categoria-vacia', info.project.name)
  })

  test('cargando', async ({ page }, info) => {
    await abrir(page, '/categoria/verdes', { datos: 'lento' })
    await expect(page.getByRole('status', { name: 'Cargando los comentarios' })).toBeVisible()
    await expect(page.getByRole('status', { name: 'Cargando el resumen' })).toBeVisible()
    await comprobarPagina(page, 'categoria-cargando', info.project.name)
  })

  test('error con reintento', async ({ page }, info) => {
    await abrir(page, '/categoria/verdes', { errorUnaVez: true })
    await expect(page.getByRole('alert')).toHaveCount(2)
    await comprobarPagina(page, 'categoria-error', info.project.name)
    await page.evaluate(() => {
      window.__VP_MOCK__!.errorUnaVez = false
    })
    // Cada sección reintenta por su cuenta y su botón desaparece al apretarlo
    const reintentar = page.getByRole('button', { name: 'Reintentar' })
    await reintentar.first().click()
    await expect(reintentar).toHaveCount(1)
    await reintentar.click()
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('el contenido de un comentario nunca se interpreta como HTML', async ({ page }) => {
    await abrir(page, '/categoria/verdes')
    await expect(page.getByText('<img src=x', { exact: false })).toBeVisible()
    expect(await page.evaluate(() => 'xss' in window || '__xss' in window)).toBe(false)
  })
})

test.describe('opinar', () => {
  test('sin sesión manda a ingresar y vuelve con la categoría', async ({ page }) => {
    await abrir(page, '/opinar?categoria=seguridad')
    await expect(page.getByRole('heading', { level: 1, name: 'Ingresar' })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar con Google' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dar mi opinión' })).toBeVisible()
    await expect(page.getByLabel(/^Tema/)).toHaveValue('seguridad')
  })

  test('el rating funciona solo con teclado', async ({ page }) => {
    await abrir(page, '/opinar?categoria=limpieza', { usuario: USUARIO })
    const seleccionada = () => page.locator('input[type="radio"]:checked').inputValue()

    await page.getByLabel(/^Tema/).focus()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('radio', { name: /^1 estrella/ })).toBeFocused()
    // El foco tiene que verse: la estrella activa se contornea
    const contorno = await page
      .locator('input[type="radio"]:focus + span + span')
      .evaluate((el) => getComputedStyle(el).outlineStyle)
    expect(contorno).toBe('solid')

    await page.keyboard.press('Space')
    expect(await seleccionada()).toBe('1')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    expect(await seleccionada()).toBe('4')
    await page.keyboard.press('ArrowLeft')
    expect(await seleccionada()).toBe('3')
    await expect(page.getByRole('radio', { name: /^3 estrellas/ })).toBeFocused()

    // Sigue hasta enviar sin tocar el mouse
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/^Tu comentario/)).toBeFocused()
    await page.keyboard.type('Enviado solo con teclado')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel(/^Barrio/)).toBeFocused()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.locator('main').getByRole('status')).toContainText('¡Gracias! Tu opinión ya está publicada.')
  })

  test('el rating también funciona con mouse o toque', async ({ page }) => {
    await abrir(page, '/opinar', { usuario: USUARIO })
    await page.locator('label', { hasText: '4 estrellas' }).click()
    await expect(page.getByRole('radio', { name: /^4 estrellas/ })).toBeChecked()
  })

  test('valida, anuncia y lleva el foco al primer error', async ({ page }) => {
    await abrir(page, '/opinar', { usuario: USUARIO })
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.locator('main').getByRole('status')).toContainText('Revisá los campos marcados.')
    await expect(page.getByText('Elegí un tema.')).toBeVisible()
    await expect(page.getByText('Elegí de 1 a 5 estrellas.')).toBeVisible()
    await expect(page.getByText('Escribí un comentario.')).toBeVisible()
    await expect(page.getByLabel(/^Tema/)).toBeFocused()
  })

  test('tiene los 48 barrios, limita el comentario y publica con los campos correctos', async ({ page }, info) => {
    await abrir(page, '/opinar?categoria=accesibilidad', { usuario: USUARIO })
    // 48 barrios + "Prefiero no decirlo"
    await expect(page.getByLabel(/^Barrio/).locator('option')).toHaveCount(49)

    const comentario = page.getByLabel(/^Tu comentario/)
    await comentario.fill('x'.repeat(600))
    await expect(comentario).toHaveValue('x'.repeat(500))
    await expect(page.getByText('500 de 500 caracteres')).toBeVisible()

    await comentario.fill('  Faltan rampas en la esquina.  ')
    await page.locator('label', { hasText: '2 estrellas' }).click()
    await page.getByLabel(/^Barrio/).selectOption('Boedo')
    await page.getByRole('button', { name: 'Enviar opinión' }).click()

    await expect(page.locator('main').getByRole('status')).toContainText('¡Gracias!')
    await expect(page.getByRole('link', { name: 'Ver opiniones de Accesibilidad' })).toBeVisible()
    expect(await page.evaluate(() => window.__VP_MOCK__?.publicados)).toEqual([
      { texto: 'Faltan rampas en la esquina.', calificacion: 2, categoria: 'accesibilidad', barrio: 'Boedo' },
    ])
    await expect(comentario).toHaveValue('')
    await comprobarPagina(page, 'opinar-enviado', info.project.name)
  })

  test('un error de envío se anuncia y conserva lo escrito', async ({ page }, info) => {
    await abrir(page, '/opinar?categoria=eventos', { usuario: USUARIO, envio: 'error' })
    await page.locator('label', { hasText: '5 estrellas' }).click()
    await page.getByLabel(/^Tu comentario/).fill('Muy buena feria.')
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.locator('main').getByRole('status')).toContainText('No tenés permiso')
    await expect(page.getByLabel(/^Tu comentario/)).toHaveValue('Muy buena feria.')
    await comprobarPagina(page, 'opinar-error', info.project.name)
  })
})

test.describe('cuenta', () => {
  test('ingreso con mail: error anunciado y luego éxito', async ({ page }) => {
    await abrir(page, '/ingresar')
    await page.getByLabel('Mail').fill('falla@example.com')
    await page.getByLabel('Contraseña').fill('secreto1')
    await page.getByRole('button', { name: 'Ingresar', exact: true }).last().click()
    await expect(page.locator('main').getByRole('status')).toContainText('El mail o la contraseña no son correctos.')
    await page.getByLabel('Mail').fill('ok@example.com')
    await page.getByLabel('Contraseña').press('Enter')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Cómo anda tu barrio?')
    await abrirMenuSiHay(page)
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  })

  test('registro con mail y cierre de sesión', async ({ page }) => {
    await abrir(page, '/ingresar')
    await page.getByRole('button', { name: 'Registrate' }).click()
    await page.getByLabel('Mail').fill('existe@example.com')
    await page.getByLabel('Contraseña').fill('secreto1')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.locator('main').getByRole('status')).toContainText('Ya hay una cuenta con ese mail')
    await page.getByLabel('Mail').fill('nueva@example.com')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Cómo anda tu barrio?')
    await abrirMenuSiHay(page)
    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page.getByRole('link', { name: 'Ingresar' })).toBeVisible()
  })
})

test('navegación: el salto de contenido y el cambio de ruta mueven el foco', async ({ page }) => {
  await abrir(page, '/')
  await page.keyboard.press('Tab')
  const salto = page.getByRole('link', { name: 'Saltar al contenido' })
  await expect(salto).toBeFocused()
  await salto.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await page.getByRole('link', { name: /Limpieza/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Limpieza' })).toBeVisible()
  await expect(page.locator('main')).toBeFocused()
  await expect(page).toHaveTitle('Limpieza · Voz Porteña')
})

test.describe('header', () => {
  for (const ancho of [299, 320, 375]) {
    test(`a ${ancho} px no se corta ningún texto y el menú es un panel con foco atrapado`, async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile-320', 'Este test fija su propio ancho')
      await page.setViewportSize({ width: ancho, height: 640 })
      await abrir(page, '/')
      expect(await textosCortados(page, 'header')).toEqual([])
      const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(desborde, 'scroll horizontal').toBeLessThanOrEqual(0)

      const abrirMenu = page.getByRole('button', { name: 'Abrir el menú' })
      await expect(abrirMenu).toHaveAttribute('aria-expanded', 'false')
      await abrirMenu.click()
      const panel = page.getByRole('dialog', { name: 'Menú' })
      await expect(panel).toBeVisible()
      await expect(panel.getByRole('link')).toHaveText(['Inicio', 'Mapa', 'Resultados', 'Sobre el proyecto', 'Ingresar'])
      // Espera a que termine de deslizarse antes de medir
      await page.waitForTimeout(300)
      expect(await textosCortados(page, '[role="dialog"]')).toEqual([])

      // El foco no sale del panel
      const cerrar = panel.getByRole('button', { name: 'Cerrar el menú' })
      await expect(cerrar).toBeFocused()
      await page.keyboard.press('Shift+Tab')
      await expect(panel.getByRole('link', { name: 'Ingresar' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(cerrar).toBeFocused()
      if (ancho === 320) await page.screenshot({ path: 'screenshots/mobile-320-menu.png' })

      await page.keyboard.press('Escape')
      await expect(panel).toBeHidden()
      await expect(abrirMenu).toBeFocused()

      // Elegir un link navega y cierra el panel
      await abrirMenu.click()
      await panel.getByRole('link', { name: 'Sobre el proyecto' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Sobre el proyecto' })).toBeVisible()
      await expect(panel).toBeHidden()
    })
  }

  test('en escritorio los links están a la vista, sin menú', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1440', 'Solo aplica a pantallas anchas')
    await abrir(page, '/')
    await expect(page.getByRole('button', { name: 'Abrir el menú' })).toBeHidden()
    await expect(page.getByRole('banner').getByRole('link')).toHaveText(['Voz Porteña', 'Mapa', 'Resultados', 'Sobre el proyecto', 'Ingresar'])
    expect(await textosCortados(page, 'header')).toEqual([])
  })
})

test.describe('mapa', () => {
  test('muestra los 48 barrios, con tooltip, referencias y tabla alternativa', async ({ page }, info) => {
    await abrir(page, '/mapa?categoria=subte')
    await expect(page.getByRole('heading', { level: 2, name: 'Subte en el mapa' })).toBeVisible()
    const barrios = page.locator('path.leaflet-interactive')
    await expect(barrios).toHaveCount(48)

    await barrios.nth(20).hover()
    await expect(page.locator('.leaflet-tooltip')).toContainText(/Promedio \d,\d · \d+ opiniones|Sin datos \(\d+ opini/)

    await expect(page.getByRole('list', { name: /Referencias del mapa/ }).getByRole('listitem')).toHaveCount(6)

    // La tabla tiene los mismos datos que el mapa
    const filas = page.getByRole('table').locator('tbody tr')
    await expect(filas).toHaveCount(48)
    await expect(filas.filter({ hasText: 'Almagro' })).toContainText('4,7')
    await expect(filas.filter({ hasText: 'Agronomía' })).toContainText('Sin datos')
    await expect(filas.filter({ hasText: 'Sin datos' })).toHaveCount(8)

    // Los colores salen de la escala: 5 tramos más "sin datos"
    const colores = await barrios.evaluateAll((caminos) => [...new Set(caminos.map((c) => c.getAttribute('fill')))])
    expect(colores.length).toBe(6)
    await comprobarPagina(page, 'mapa', info.project.name)

    await page.getByLabel('Tema').selectOption('limpieza')
    await expect(page.getByRole('heading', { level: 2, name: 'Limpieza en el mapa' })).toBeVisible()
    await expect(barrios).toHaveCount(48)
  })

  test('si los datos fallan, se puede reintentar', async ({ page }) => {
    await abrir(page, '/mapa', { errorUnaVez: true })
    await expect(page.getByRole('alert')).toBeVisible()
    await page.evaluate(() => {
      window.__VP_MOCK__!.errorUnaVez = false
    })
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(page.locator('path.leaflet-interactive')).toHaveCount(48)
  })
})

test.describe('resultados', () => {
  test('muestra promedios, gráficos, evolución y rankings de barrios', async ({ page }, info) => {
    await abrir(page, '/resultados')
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await expect(page.getByRole('list', { name: 'Distribución de estrellas' }).getByRole('listitem')).toHaveCount(5)
    await expect(page.locator('svg.recharts-surface')).toHaveCount(2)
    // 6 barras: el tema sin opiniones no se grafica
    await expect(page.locator('.recharts-bar-rectangle')).toHaveCount(6)

    await page.getByText('Ver los promedios por tema en una tabla').click()
    const temas = page.getByRole('table').first().locator('tbody tr')
    await expect(temas).toHaveCount(7)
    await expect(temas.filter({ hasText: 'Eventos Gratuitos' })).toContainText('Sin opiniones')

    await page.getByText('Ver la evolución mensual en una tabla').click()
    const meses = page.getByRole('table').nth(1).locator('tbody tr')
    await expect(meses).toHaveCount(12)
    await expect(meses.filter({ hasText: 'Sin opiniones' })).toHaveCount(2)

    const mejores = page.locator('div', { has: page.getByRole('heading', { name: 'Mejor puntuados' }) }).last().getByRole('listitem')
    const peores = page.locator('div', { has: page.getByRole('heading', { name: 'Peor puntuados' }) }).last().getByRole('listitem')
    await expect(mejores).toHaveCount(5)
    await expect(peores).toHaveCount(5)
    await expect(mejores.first()).toContainText('5,0')
    await expect(peores.first()).toContainText('1,0')
    await comprobarPagina(page, 'resultados', info.project.name)
  })

  test('vacío', async ({ page }, info) => {
    await abrir(page, '/resultados', { datos: 'vacio' })
    await expect(page.getByText('Todavía no hay opiniones')).toBeVisible()
    await comprobarPagina(page, 'resultados-vacio', info.project.name)
  })

  test('error con reintento', async ({ page }) => {
    await abrir(page, '/resultados', { errorUnaVez: true })
    await expect(page.getByRole('alert')).toBeVisible()
    await page.evaluate(() => {
      window.__VP_MOCK__!.errorUnaVez = false
    })
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await expect(page.getByText('128 opiniones')).toBeVisible()
  })
})

test.describe('sin conexión', () => {
  test('opinar offline deja la opinión pendiente y la envía al volver la conexión', async ({ page, context }, info) => {
    const texto = 'Escrita en el subte, sin señal.'
    await abrir(page, '/categoria/subte', { usuario: USUARIO })
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await page.getByRole('link', { name: 'Opinar', exact: true }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Dar mi opinión' })).toBeVisible()

    await context.setOffline(true)
    const indicador = page.getByRole('status').first()
    await expect(indicador).toContainText('Sin conexión.')

    await page.locator('label', { hasText: '3 estrellas' }).click()
    await page.getByLabel(/^Tu comentario/).fill(texto)
    await page.getByLabel(/^Barrio/).selectOption('Chacarita')
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.locator('main').getByRole('status')).toContainText('quedó pendiente de envío')
    await expect(indicador).toContainText('1 opinión pendiente de envío.')
    expect(await page.evaluate(() => window.__VP_MOCK__?.publicados ?? [])).toEqual([])

    // La opinión figura como pendiente y lo ya visto se sigue leyendo
    await page.getByRole('link', { name: 'Ver opiniones de Subte' }).click()
    const pendientes = page.getByRole('list', { name: 'Tus opiniones sin enviar' })
    await expect(pendientes.getByRole('listitem')).toContainText(['Pendiente de envío'])
    await expect(pendientes).toContainText(texto)
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await expect(page.getByText('Comentario guardado por la app anterior.')).toBeVisible()
    await comprobarPagina(page, 'categoria-pendiente', info.project.name)

    // La cola está en IndexedDB y todavía no tiene fecha de envío
    const enCola = await page.evaluate(
      () =>
        new Promise<Record<string, unknown>[]>((resolver, rechazar) => {
          const pedido = indexedDB.open('voz-portena')
          pedido.onerror = () => rechazar(pedido.error)
          pedido.onsuccess = () => {
            const todos = pedido.result.transaction('pendientes').objectStore('pendientes').getAll()
            todos.onsuccess = () => resolver(todos.result as Record<string, unknown>[])
          }
        }),
    )
    expect(enCola).toHaveLength(1)
    expect(enCola[0]).toMatchObject({ uid: USUARIO.uid, texto, calificacion: 3, categoria: 'subte', barrio: 'Chacarita' })
    expect(enCola[0]).not.toHaveProperty('fecha')

    await context.setOffline(false)
    await expect(indicador).toContainText('Se envió 1 opinión pendiente.')
    await expect(pendientes).toHaveCount(0)
    await expect(page.getByText(texto)).toBeVisible()
    expect(await page.evaluate(() => window.__VP_MOCK__?.publicados)).toEqual([
      { texto, calificacion: 3, categoria: 'subte', barrio: 'Chacarita' },
    ])
  })

  test('una opinión rechazada al enviar queda a la vista y se puede descartar', async ({ page, context }) => {
    // Pasa primero por la categoría: sin conexión no se puede descargar una página que nunca se abrió
    await abrir(page, '/categoria/verdes', { usuario: USUARIO, envio: 'error' })
    await page.getByRole('link', { name: 'Opinar', exact: true }).click()
    await expect(page.getByLabel(/^Tema/)).toHaveValue('verdes')
    await context.setOffline(true)
    await page.locator('label', { hasText: '5 estrellas' }).click()
    await page.getByLabel(/^Tu comentario/).fill('Linda plaza.')
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await page.getByRole('link', { name: 'Ver opiniones de Espacios Verdes' }).click()
    await context.setOffline(false)

    const pendientes = page.getByRole('list', { name: 'Tus opiniones sin enviar' })
    await expect(pendientes).toContainText('No se pudo enviar')
    await expect(pendientes).toContainText('No tenés permiso')
    await pendientes.getByRole('button', { name: 'Descartar' }).click()
    await expect(pendientes).toHaveCount(0)
  })

  test('las opiniones pendientes del sitio anterior se envían al ingresar', async ({ page }) => {
    // Una página del mismo origen que no carga la app, para preparar la base del sitio anterior
    await page.goto('./logo.svg')
    await page.evaluate(
      () =>
        new Promise<void>((resolver, rechazar) => {
          const pedido = indexedDB.open('EncuestasCABA', 2)
          pedido.onupgradeneeded = () => {
            pedido.result.createObjectStore('comentarios', { keyPath: 'id', autoIncrement: true })
            pedido.result.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true })
          }
          pedido.onerror = () => rechazar(pedido.error)
          pedido.onsuccess = () => {
            const tx = pedido.result.transaction('pendientes', 'readwrite')
            tx.objectStore('pendientes').add({ texto: 'Quedó sin enviar', calificacion: 4, fecha: '2025-08-01T10:00:00.000Z', categoria: 'limpieza' })
            tx.objectStore('pendientes').add({ texto: 'Inválida', calificacion: 9, fecha: '2025-08-01T10:00:00.000Z', categoria: 'limpieza' })
            tx.oncomplete = () => {
              pedido.result.close()
              resolver()
            }
          }
        }),
    )

    await abrir(page, '/categoria/limpieza', { usuario: USUARIO })
    await expect(page.getByRole('status').first()).toContainText('Se envió 1 opinión pendiente.')
    expect(await page.evaluate(() => window.__VP_MOCK__?.publicados)).toEqual([
      { texto: 'Quedó sin enviar', calificacion: 4, categoria: 'limpieza' },
    ])
    expect(await page.evaluate(async () => (await indexedDB.databases()).map((b) => b.name))).not.toContain('EncuestasCABA')
  })
})

test.describe('PWA', () => {
  test('el manifest tiene el nombre, los colores y los íconos', async ({ page, request }) => {
    await abrir(page, '/')
    const enlace = await page.locator('link[rel="manifest"]').getAttribute('href')
    const base = page.url().split('#')[0] ?? ''
    const respuesta = await request.get(new URL(enlace ?? '', base).href)
    const manifest = (await respuesta.json()) as { name: string; theme_color: string; background_color: string; display: string; icons: { src: string; sizes: string; purpose?: string }[] }
    expect(manifest).toMatchObject({ name: 'Voz Porteña', theme_color: '#A92C1C', background_color: '#F8F1E4', display: 'standalone' })
    expect(manifest.icons.map((i) => `${i.sizes} ${i.purpose ?? 'any'}`)).toEqual(['192x192 any', '512x512 any', '512x512 maskable'])
    for (const icono of manifest.icons) {
      const imagen = await request.get(new URL(icono.src, respuesta.url()).href)
      expect(imagen.headers()['content-type']).toBe('image/png')
    }
  })

  test('avisa cuando hay una versión nueva y la aplica', async ({ page }, info) => {
    await abrir(page, '/', { actualizacion: true })
    const aviso = page.getByRole('status').filter({ hasText: 'Nueva versión disponible.' })
    await expect(aviso).toBeVisible()
    await comprobarPagina(page, 'aviso-actualizacion', info.project.name)
    await aviso.getByRole('button', { name: 'Actualizar' }).click()
    await expect.poll(() => page.evaluate(() => window.__VP_MOCK__?.actualizada)).toBe(true)
  })

  test('ofrece instalar la app con un banner propio', async ({ page }, info) => {
    await abrir(page, '/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const banner = page.getByRole('region', { name: 'Instalar la app' })
    await expect(banner).toBeHidden()
    await page.evaluate(() => {
      const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
        prompt: () => {
          ;(window as Window & { __instalo?: boolean }).__instalo = true
          return Promise.resolve()
        },
      })
      window.dispatchEvent(evento)
    })
    await expect(banner).toBeVisible()
    await comprobarPagina(page, 'banner-instalar', info.project.name)
    await banner.getByRole('button', { name: 'Instalar app' }).click()
    expect(await page.evaluate(() => (window as Window & { __instalo?: boolean }).__instalo)).toBe(true)
    await expect(banner).toBeHidden()
  })

  test('con el service worker, la app abre y navega sin conexión', async ({ page, context }) => {
    await abrir(page, '/categoria/subte', { sw: true })
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await page.evaluate(() => navigator.serviceWorker.ready)
    // Una instalación limpia toma el control recién en la carga siguiente
    await page.reload()
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Subte' })).toBeVisible()
    // El resumen sale del respaldo local y los comentarios de la caché
    await expect(page.getByText('128 opiniones')).toBeVisible()
    await expect(page.getByText('Comentario guardado por la app anterior.')).toBeVisible()
    await expect(page.getByRole('status').first()).toContainText('Sin conexión.')
    // Tipografías propias: sin conexión siguen cargadas
    expect(await page.evaluate(() => document.fonts.ready.then(() => document.fonts.check('16px "Rozha One"')))).toBe(true)

    // Las páginas de carga diferida también están en el precache
    await page.goto('./#/sobre')
    await expect(page.getByRole('heading', { level: 1, name: 'Sobre el proyecto' })).toBeVisible()
    await page.goto('./#/mapa')
    await expect(page.getByRole('heading', { level: 1, name: 'Mapa de barrios' })).toBeVisible()
    await context.setOffline(false)
  })

  test('quien tenía el service worker anterior pasa al nuevo sin recargar a mano', async ({ page }) => {
    // Deja la caché que usaba el service worker del sitio anterior
    await page.goto('./logo.svg')
    await page.evaluate(async () => {
      const cache = await caches.open('caba-encuesta-cache-v3')
      await cache.put('./encuestas.html', new Response('sitio viejo'))
    })

    await abrir(page, '/', { sw: true })
    const estado = () =>
      page
        .evaluate(async () => ({
          cacheVieja: (await caches.keys()).some((nombre) => nombre.startsWith('caba-encuesta-cache')),
          controlada: Boolean(navigator.serviceWorker.controller),
        }))
        // El service worker recarga la pestaña: durante la recarga no hay página que evaluar
        .catch(() => null)
    // Antes de activarse, el service worker descarga todo el precache
    await expect.poll(estado, { timeout: 25_000 }).toEqual({ cacheVieja: false, controlada: true })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Cómo anda tu barrio?')
  })
})
