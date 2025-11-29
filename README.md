# 📊 Encuesta CABA - PWA

**Progressive Web App** para recopilar opiniones sobre servicios de la Ciudad de Buenos Aires.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://juantrezza.github.io/encuesta-caba-pwa/)
[![Firebase](https://img.shields.io/badge/Firebase-10.12.0-orange)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-enabled-blue)](https://web.dev/progressive-web-apps/)

---

## 🚀 Demo en Vivo

**👉 [Ver aplicación](https://juantrezza.github.io/encuesta-caba-pwa/)**

La aplicación está desplegada en GitHub Pages y es **100% funcional** sin necesidad de configuración.

---

## ✨ Características

- 📱 **Progressive Web App** - Instalable en dispositivos móviles
- 🔐 **Autenticación** - Login con Google o Email/Password
- 💾 **Offline First** - Funciona sin conexión (IndexedDB + Service Worker)
- 🔔 **Notificaciones Push** - Firebase Cloud Messaging
- 📊 **7 Categorías de Evaluación**:
  - Limpieza
  - Transporte
  - Espacios Verdes
  - Eventos Gratuitos
  - Subte
  - Seguridad
  - Accesibilidad

---

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Firebase (Firestore, Auth, Messaging)
- **Storage**: IndexedDB (local) + Firestore (cloud)
- **PWA**: Service Workers, Web App Manifest
- **Hosting**: GitHub Pages

---

## 📦 Instalación Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/JuanTrezza/encuesta-caba-pwa.git
cd encuesta-caba-pwa
```

2. **Servir localmente**
```bash
# Con Python
python -m http.server 8000

# O con Node.js
npx http-server -p 8000
```

3. **Abrir en navegador**
```
http://localhost:8000
```

---

## 🔒 Seguridad

Esta es una **aplicación pública** diseñada para ser usada por cualquier persona. La seguridad está garantizada mediante:

✅ **Restricciones de API Key** (HTTP referrers en Google Cloud)  
✅ **Reglas de Firestore** (lectura pública, escritura solo autenticados)  
✅ **Validación de datos** (límite de caracteres, rango de calificaciones)  
✅ **Sin edición/eliminación** de comentarios (previene vandalismo)

### ⚠️ Sobre las API Keys de Firebase

**Las claves de Firebase están en el código INTENCIONALMENTE** - esto es **seguro y es el diseño oficial de Firebase para aplicaciones web**.

Según la [documentación oficial de Firebase](https://firebase.google.com/docs/projects/api-keys):

> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources."

**La seguridad NO está en ocultar la API key, sino en:**
- Restricciones de HTTP referrers (solo dominios autorizados)
- Reglas de seguridad de Firestore (server-side)
- Autenticación requerida para operaciones críticas

Ver [SECURITY.md](./SECURITY.md) para detalles completos sobre el modelo de seguridad.

---

## 📱 Usar como PWA

### En Android/iOS:
1. Abre la app en Chrome/Safari
2. Toca el menú (⋮) → **Agregar a pantalla de inicio**
3. La app se instalará como aplicación nativa

### En Desktop:
1. Abre la app en Chrome
2. Haz clic en el ícono de instalación (➕) en la barra de direcciones
3. Confirma instalación

---

## 🌐 Despliegue en GitHub Pages

La app está configurada para funcionar en GitHub Pages automáticamente:

1. **Fork** este repositorio
2. Ve a **Settings** → **Pages**
3. Source: **Deploy from a branch** → **master** → **/ (root)**
4. Guarda y espera 1-2 minutos
5. Tu app estará en: `https://tuusuario.github.io/encuesta-caba-pwa/`

---

## 📊 Estructura del Proyecto

```
encuesta-caba-pwa/
├── index.html              # Página principal (redirige a login)
├── login.html              # Página de autenticación
├── encuestas.html          # Página de encuestas
├── app.js                  # Lógica principal
├── auth.js                 # Autenticación Firebase
├── db.js                   # IndexedDB (offline)
├── style.css               # Estilos
├── sw.js                   # Service Worker (offline)
├── firebase-messaging-sw.js # Service Worker (notificaciones)
├── manifest.json           # PWA Manifest
├── assets/                 # Imágenes y recursos
│   ├── categorias/         # Imágenes por categoría
│   ├── icon.png            # Ícono de la app
│   └── logo.jpg            # Logo CABA
└── componentes/            # Componentes reutilizables
    ├── rating.js           # Sistema de calificación
    └── listaComentarios.js # Lista de comentarios
```

---

## 🔧 Configuración Firebase (para fork/clone)

Si quieres usar tu propio Firebase:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password + Google)
3. Crea una base de datos **Firestore**
4. Copia las credenciales de configuración
5. Reemplaza en `auth.js` y `firebase-messaging-sw.js`:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};
```

6. Configura las reglas de Firestore (ver [SECURITY_SETUP.md](./SECURITY_SETUP.md))

---

## 📝 Funcionalidades Offline

La app funciona completamente sin conexión gracias a:

- **Service Workers**: Caché de recursos estáticos
- **IndexedDB**: Almacenamiento local de comentarios
- **Sincronización automática**: Al recuperar conexión, los comentarios pendientes se suben a Firestore

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👨‍💻 Autor

**Juan Trezza**

- GitHub: [@JuanTrezza](https://github.com/JuanTrezza)
- LinkedIn: [Tu perfil de LinkedIn]

---

## 🐛 Reporte de Bugs

Si encuentras un bug, por favor abre un [issue](https://github.com/JuanTrezza/encuesta-caba-pwa/issues) con:

- Descripción del problema
- Pasos para reproducir
- Navegador y versión
- Capturas de pantalla (si aplica)

---

## ⭐ Si te gustó este proyecto

Dale una ⭐ en GitHub y compártelo!

