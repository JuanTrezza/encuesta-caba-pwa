# Voz Porteña

[![CI](https://github.com/JuanTrezza/encuesta-caba-pwa/actions/workflows/ci.yml/badge.svg?event=pull_request)](https://github.com/JuanTrezza/encuesta-caba-pwa/actions/workflows/ci.yml)

Sitio para puntuar y comentar cómo funciona la vida cotidiana en los 48 barrios de Buenos Aires: limpieza, transporte, espacios verdes, eventos gratuitos, subte, seguridad y accesibilidad.

Proyecto independiente, sin relación con el Gobierno de la Ciudad de Buenos Aires.

**Demo:** https://juantrezza.github.io/encuesta-caba-pwa/

## Stack

Vite, React 19, TypeScript strict, Tailwind CSS v3, React Router con `HashRouter`, Firebase JS SDK v11 (Auth y Firestore) y Playwright. Se publica en GitHub Pages con GitHub Actions.

## Desarrollo

```bash
npm ci
cp .env.example .env.local   # y completá los valores
npm run dev
```

La app corre en `http://localhost:5173/encuesta-caba-pwa/`.

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | Corre `tsc` |
| `npm run build` | Corre `tsc`, valida `VITE_FIREBASE_*` y genera `dist/`. Falla si la config está incompleta o tiene un formato inválido |
| `npm run test:e2e` | Corre Playwright en 375 y 1440 px, con los services mockeados |
| `npm run test:rules` | Prueba las reglas de Firestore en el emulador. Requiere Java 21 o superior |

Los tests no tocan Firebase: con `--mode e2e`, Vite reemplaza `src/services/auth.ts` y `src/services/comentarios.ts` por `tests/mocks/`. Las capturas quedan en `screenshots/`, que no se versiona. Si es la primera vez, instalá el navegador con `npx playwright install chromium`.

## Seguridad

### Por qué la apiKey web no es secreta

La `apiKey` de la config web de Firebase identifica al proyecto, pero no da acceso a los datos. Tiene que llegar al navegador para que la app funcione, así que cualquiera puede leerla en el JavaScript publicado. Guardarla en `.env.local` y en los secrets de GitHub evita tenerla en el repo, pero no la oculta.

No pasa lo mismo con las credenciales de servidor, como una service account, su `private_key`, un token de la CLI de Firebase o la server key de FCM. Esas dan acceso real: nunca van en este repo ni en una variable `VITE_*`, porque todo lo que empieza con `VITE_` termina en el bundle público.

### Qué protege los datos

| Capa | Qué hace | Dónde se configura |
|---|---|---|
| Reglas de Firestore | Deciden quién puede leer o escribir y validan cada documento. Son la protección principal. | Firestore → Rules |
| Restricción por dominio | Limita desde qué sitios se acepta la key. | Google Cloud → Credentials → Application restrictions |
| Restricción por API | Limita qué APIs de Google se pueden llamar con la key. | Google Cloud → Credentials → API restrictions |
| Dominios autorizados | Limita en qué dominios funciona el login. | Authentication → Settings → Authorized domains |
| App Check | Ayuda a comprobar que los pedidos vienen de esta app. Reduce el abuso automatizado, pero no reemplaza a las reglas. | App Check |

La restricción por dominio se basa en el encabezado `Referer`, que un cliente fuera del navegador puede falsificar. Por eso las reglas tienen que alcanzar por sí solas para proteger los datos.

### App Check

Se activa solo si existe `VITE_FIREBASE_APPCHECK_SITE_KEY`, la site key de reCAPTCHA v3. Sin esa variable, la app funciona igual y no carga reCAPTCHA. Los pasos para activarlo están en [docs/firebase-setup.md](docs/firebase-setup.md).

### Probar las reglas

Las reglas están en [firestore.rules](firestore.rules) y los índices en [firestore.indexes.json](firestore.indexes.json).

```bash
winget install EclipseAdoptium.Temurin.21.JDK   # solo la primera vez; después abrí otra terminal
npm run test:rules
```

El comando levanta el emulador de Firestore con el proyecto `demo-voz-portena`, corre [tests-rules/firestore.spec.ts](tests-rules/firestore.spec.ts) y apaga el emulador. Los proyectos `demo-` no existen en Firebase, así que no se toca ningún dato real. La primera vez descarga el emulador. Los mensajes `PERMISSION_DENIED` del log son los rechazos que los tests esperan.

El emulador no exige índices compuestos, así que estos tests no comprueban que el índice esté creado.

## Estructura

- `src/services/`: capa de datos. Las páginas no importan Firebase.
- `src/pages/` y `src/components/`: interfaz.
- `src/data/`: categorías y barrios.
- `legacy/`: sitio anterior. No se publica.
- `docs/firebase-setup.md`: configuración de Firebase y GitHub.
