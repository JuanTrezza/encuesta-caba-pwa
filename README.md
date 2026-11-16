# Voz Porteña

[![CI](https://github.com/JuanTrezza/encuesta-caba-pwa/actions/workflows/ci.yml/badge.svg?event=pull_request)](https://github.com/JuanTrezza/encuesta-caba-pwa/actions/workflows/ci.yml)

Sitio para puntuar y comentar cómo funciona la vida cotidiana en los 48 barrios de Buenos Aires: limpieza, transporte, espacios verdes, eventos gratuitos, subte, seguridad y accesibilidad.

Proyecto independiente, sin relación con el Gobierno de la Ciudad de Buenos Aires.

**Demo:** https://juantrezza.github.io/encuesta-caba-pwa/

## Stack

Vite, React 19, TypeScript strict, Tailwind CSS v3, React Router con `HashRouter`, Firebase JS SDK v11 (Auth y Firestore) y Playwright. Es una PWA (vite-plugin-pwa con Workbox), con mapa en Leaflet y gráficos en Recharts. Se publica en GitHub Pages con GitHub Actions.

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
| `npm run test:e2e` | Corre Playwright en 320, 375 y 1440 px, con los services mockeados |
| `npm run test:rules` | Prueba las reglas de Firestore en el emulador. Requiere Java 21 o superior |

Los tests no tocan Firebase: con `--mode e2e`, Vite reemplaza `src/services/auth.ts`, `src/services/comentarios.ts` y `src/services/pwa.ts` por `tests/mocks/`. La cola offline y el service worker que se prueban son los reales. Las capturas quedan en `screenshots/`, que no se versiona. Si es la primera vez, instalá el navegador con `npx playwright install chromium`.

## PWA y uso sin conexión

- **Instalación y actualización:** el sitio ofrece instalarse con un banner propio y avisa cuando hay una versión nueva. La versión nueva se activa recién al tocar "Actualizar".
- **Service worker:** está en [src/sw.ts](src/sw.ts). Guarda todo el sitio en el dispositivo (unos 1,8 MB), incluidos el mapa y las tipografías, así que cualquier página abre sin conexión.
- **Lectura sin conexión:** los comentarios ya vistos salen de la caché local de Firestore. Los promedios y conteos solo los calcula el servidor, así que se guarda el último valor recibido y se muestra ese.
- **Escritura sin conexión:** la opinión queda en una cola en IndexedDB, figura como "Pendiente de envío" y se manda sola al volver la conexión. La fecha la pone el servidor al enviar, no al escribir.
- **Sitio anterior:** quien todavía tenga su service worker pasa al nuevo sin hacer nada. `public/firebase-messaging-sw.js` existe solo para dar de baja el service worker de notificaciones del sitio anterior.

## Mapa de barrios

Los límites de los 48 barrios salen del conjunto de datos [Barrios](https://data.buenosaires.gob.ar/dataset/barrios) de Buenos Aires Data, publicado por la Secretaría de Innovación y Transformación Digital del GCBA con licencia [CC BY 2.5 AR](https://creativecommons.org/licenses/by/2.5/ar/). El archivo `public/barrios.geojson` es una versión modificada: coordenadas redondeadas a 4 decimales y nombres adaptados a los de este sitio. Se regenera con `node scripts/preparar-barrios.mjs`.

Usar esos datos no implica ningún aval ni relación con el Gobierno de la Ciudad. El mapa no usa un mapa base de terceros: dibuja solo los barrios.

## Resultados y costo de lecturas

El mapa y la página de resultados usan agregados de Firestore (`count()` y `average()`), que no descargan los documentos. Cada agregado se cobra como una lectura por cada 1.000 entradas de índice recorridas.

| Vista | Consultas agregadas |
|---|---|
| Resultados | Entre 73 y 85: 5 de distribución, 7 por tema, de 13 a 25 de evolución mensual y 48 de barrios |
| Mapa | 48 por tema elegido |
| Categoría | 5 |

El resultado se guarda 5 minutos en memoria para no repetir las consultas al volver a la página. No hay un documento de resumen: mantenerlo exige un proceso con credenciales de servidor, y eso está fuera de esta etapa.

## Notificaciones push (pendiente)

No están implementadas. Para sumarlas hace falta:

1. **Clave VAPID pública:** se genera en Firebase Console → Cloud Messaging → Web Push certificates. Es pública por diseño e iría en una variable `VITE_*`.
2. **Permiso y token:** pedir permiso con `Notification.requestPermission()` después de un gesto de la persona, obtener el token con `getToken()` pasándole el registro del service worker actual, y guardar el token en Firestore con reglas propias. Para recibir, hay que manejar el evento `push` en `src/sw.ts`. En iOS solo funciona con la app instalada.
3. **Quién envía:** la API de FCM exige una credencial de servidor, que nunca puede ir en el navegador. Las Cloud Functions necesitan el plan Blaze; el plan gratuito Spark no las incluye. Las alternativas son un servidor propio o una tarea programada, por ejemplo en GitHub Actions, con una service account guardada como secret.

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

- `src/services/`: capa de datos. Las páginas usan `opiniones.ts` y no importan Firebase.
- `src/sw.ts`: service worker.
- `src/pages/` y `src/components/`: interfaz.
- `src/data/`: categorías, barrios y escala de colores del mapa.
- `public/barrios.geojson`: límites de los barrios.
- `legacy/`: sitio anterior. No se publica.
- `docs/firebase-setup.md`: configuración de Firebase y GitHub.
