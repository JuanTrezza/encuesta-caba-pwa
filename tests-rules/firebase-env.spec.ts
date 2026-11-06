import { spawnSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import { formatearErrores, limpiarValor, validarFirebaseEnv } from '../src/services/firebaseEnv.mjs'

const VALIDA = {
  VITE_FIREBASE_API_KEY: 'AIzaFalsa_1-a',
  VITE_FIREBASE_AUTH_DOMAIN: 'proyecto-falso.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'proyecto-falso',
  VITE_FIREBASE_STORAGE_BUCKET: 'proyecto-falso.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  VITE_FIREBASE_APP_ID: '1:000000000000:web:falso',
}

test.describe('limpiarValor', () => {
  for (const crudo of ['"valor"', "'valor'", '  valor  ', ' "valor" ', `'" valor "'`, '\tvalor\n']) {
    test(`deja "valor" a partir de ${JSON.stringify(crudo)}`, () => {
      expect(limpiarValor(crudo)).toBe('valor')
    })
  }

  test('no toca las comillas ni los espacios del medio', () => {
    expect(limpiarValor(`"a'b c"`)).toBe(`a'b c`)
  })

  test('sin valor devuelve un string vacío', () => {
    expect(limpiarValor(undefined)).toBe('')
    expect(limpiarValor(' "" ')).toBe('')
  })
})

test.describe('validarFirebaseEnv', () => {
  test('acepta una config válida, también con comillas pegadas de firebaseConfig', () => {
    expect(validarFirebaseEnv(VALIDA)).toEqual([])
    const conComillas = Object.fromEntries(Object.entries(VALIDA).map(([k, v]) => [k, ` "${v}" `]))
    expect(validarFirebaseEnv(conComillas)).toEqual([])
  })

  for (const nombre of Object.keys(VALIDA)) {
    test(`rechaza ${nombre} vacía`, () => {
      for (const valor of [undefined, '', '   ', '""']) {
        const errores = validarFirebaseEnv({ ...VALIDA, [nombre]: valor })
        expect(errores).toHaveLength(1)
        expect(errores[0]).toContain(nombre)
      }
    })
  }

  test('la site key de App Check es opcional', () => {
    expect(validarFirebaseEnv({ ...VALIDA, VITE_FIREBASE_APPCHECK_SITE_KEY: '' })).toEqual([])
  })

  for (const apiKey of ['otra-cosa', 'aiZaminusculas', 'AIzaConComa",', 'AIza con espacio']) {
    test(`rechaza la apiKey ${JSON.stringify(apiKey)}`, () => {
      expect(validarFirebaseEnv({ ...VALIDA, VITE_FIREBASE_API_KEY: apiKey }).join()).toContain('AIza')
    })
  }

  for (const authDomain of ['proyecto.web.app', 'proyecto.firebaseapp.com",', 'firebaseapp.com']) {
    test(`rechaza el authDomain ${JSON.stringify(authDomain)}`, () => {
      expect(validarFirebaseEnv({ ...VALIDA, VITE_FIREBASE_AUTH_DOMAIN: authDomain }).join()).toContain('.firebaseapp.com')
    })
  }

  test('los mensajes nunca incluyen el valor', () => {
    const valor = 'VALOR-QUE-NO-TIENE-QUE-APARECER'
    const texto = formatearErrores(
      validarFirebaseEnv({ ...VALIDA, VITE_FIREBASE_API_KEY: valor, VITE_FIREBASE_AUTH_DOMAIN: valor }),
    )
    expect(texto).toContain('VITE_FIREBASE_API_KEY')
    expect(texto).not.toContain(valor)
  })
})

test.describe('scripts/validar-firebase-env.mjs', () => {
  function correr(env: Record<string, string>) {
    const { PATH, Path, SystemRoot } = process.env
    const base = { ...(PATH ? { PATH } : {}), ...(Path ? { Path } : {}), ...(SystemRoot ? { SystemRoot } : {}) }
    return spawnSync(process.execPath, ['scripts/validar-firebase-env.mjs'], { env: { ...base, ...env }, encoding: 'utf8' })
  }

  test('sale con 0 si la config es válida', () => {
    expect(correr(VALIDA).status).toBe(0)
  })

  test('sale con 1 y no imprime valores si es inválida', () => {
    const valor = 'VALOR-QUE-NO-TIENE-QUE-APARECER'
    const { status, stdout, stderr } = correr({ ...VALIDA, VITE_FIREBASE_API_KEY: valor })
    expect(status).toBe(1)
    expect(stderr).toContain('VITE_FIREBASE_API_KEY')
    expect(stdout + stderr).not.toContain(valor)
  })
})
