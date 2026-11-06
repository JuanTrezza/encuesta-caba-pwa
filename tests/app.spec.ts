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
    await expect(temas.getByRole('link').filter({ hasNotText: 'Opinar ahora' })).toHaveCount(7)
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
    await expect(page.getByRole('status')).toContainText('¡Gracias! Tu opinión ya está publicada.')
  })

  test('el rating también funciona con mouse o toque', async ({ page }) => {
    await abrir(page, '/opinar', { usuario: USUARIO })
    await page.locator('label', { hasText: '4 estrellas' }).click()
    await expect(page.getByRole('radio', { name: /^4 estrellas/ })).toBeChecked()
  })

  test('valida, anuncia y lleva el foco al primer error', async ({ page }) => {
    await abrir(page, '/opinar', { usuario: USUARIO })
    await page.getByRole('button', { name: 'Enviar opinión' }).click()
    await expect(page.getByRole('status')).toContainText('Revisá los campos marcados.')
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

    await expect(page.getByRole('status')).toContainText('¡Gracias!')
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
    await expect(page.getByRole('status')).toContainText('No tenés permiso')
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
    await expect(page.getByRole('status')).toContainText('El mail o la contraseña no son correctos.')
    await page.getByLabel('Mail').fill('ok@example.com')
    await page.getByLabel('Contraseña').press('Enter')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('¿Cómo anda tu barrio?')
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
  })

  test('registro con mail y cierre de sesión', async ({ page }) => {
    await abrir(page, '/ingresar')
    await page.getByRole('button', { name: 'Registrate' }).click()
    await page.getByLabel('Mail').fill('existe@example.com')
    await page.getByLabel('Contraseña').fill('secreto1')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
    await expect(page.getByRole('status')).toContainText('Ya hay una cuenta con ese mail')
    await page.getByLabel('Mail').fill('nueva@example.com')
    await page.getByRole('button', { name: 'Crear cuenta' }).click()
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
