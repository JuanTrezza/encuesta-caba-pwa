import { inicializarDB, guardarComentario, guardarPendiente, traerPendientes, eliminarPendiente } from './db.js';
import { crearRating } from './componentes/rating.js';
import { mostrarComentarios } from './componentes/listaComentarios.js';
import { guardarComentarioFirestore, messaging } from './auth.js';
import { getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js";

const content = document.getElementById('content');
const buttons = document.querySelectorAll('.tabs button');

function crearFormulario(categoria, label) {
  content.innerHTML = `
    <h2>${label}</h2>
    <img src="assets/categorias/${categoria}.jpg" class="imagen-categoria"/>
    <label>Tu comentario:</label><br/>
    <textarea id="comentario"></textarea><br/>
    <label>Tu puntuación:</label>
    <div id="calificacion"></div>
    <button id="submit">Enviar</button>
    <h3>Comentarios anteriores:</h3>
    <div id="comentarios"></div>
  `;
  crearRating(document.getElementById('calificacion'));

  document.getElementById('submit').addEventListener('click', async () => {
    const texto = document.getElementById('comentario').value.trim();
    const calificacion = document.querySelectorAll('.calificacion.selected').length;
    if (!texto || calificacion === 0) {
      alert("Por favor ingresa un comentario y una calificación.");
      return;
    }

    const comentario = { texto, calificacion, fecha: new Date().toISOString(), categoria };

    if (navigator.onLine) {
      await guardarComentario(categoria, comentario);   // Guarda localmente (IndexedDB)
      await guardarComentarioFirestore(comentario);     // Sube a Firestore
    } else {
      await guardarPendiente(categoria, comentario);    // Guarda como pendiente (IndexedDB)
      alert("Estás sin conexión. Tu comentario será enviado cuando se restablezca la conexión.");
    }

    document.getElementById('comentario').value = "";
    mostrarComentarios(categoria, document.getElementById('comentarios'));
  });

  mostrarComentarios(categoria, document.getElementById('comentarios'));
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    crearFormulario(btn.dataset.tab, btn.textContent);
  });
});

window.addEventListener("online", async () => {
  const pendientes = await traerPendientes();
  console.log("Pendientes a enviar:", pendientes);
  for (const comentario of pendientes) {
    await guardarComentario(comentario.categoria, comentario); // Guarda local por si acaso
    await guardarComentarioFirestore(comentario);              // Sube a Firestore
    await eliminarPendiente(comentario.id);                    // Elimina de pendientes
  }
  alert("¡Conexión restaurada! Comentarios pendientes enviados a la nube.");
});

function aplicarTemaGuardado() {
  const tema = localStorage.getItem("tema") || "claro";
  document.body.className = tema;
  document.getElementById("tema-toggle").textContent = tema === "oscuro" ? "☀️ Tema Claro" : "🌙 Tema Oscuro";
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarTemaGuardado();

  document.getElementById("tema-toggle").addEventListener("click", () => {
    const nuevoTema = document.body.className === "oscuro" ? "claro" : "oscuro";
    document.body.className = nuevoTema;
    localStorage.setItem("tema", nuevoTema);
    aplicarTemaGuardado();
  });

  // Nuevo: botón para activar notificaciones push
  const notifBtn = document.getElementById("notificaciones-toggle");
  if (notifBtn) {
    notifBtn.addEventListener('click', solicitarPermisoNotificaciones);
  }
});

// Registrar ambos service workers
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // SW normal de la app
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('✅ Service Worker registrado:', reg.scope);
      })
      .catch(err => {
        console.error('❌ Error al registrar el Service Worker:', err);
      });

    // SW de Firebase Messaging
    navigator.serviceWorker.register('./firebase-messaging-sw.js')
      .then(reg => {
        console.log('✅ Firebase Messaging SW registrado:', reg.scope);
      })
      .catch(err => {
        console.error('❌ Error al registrar el SW de FCM:', err);
      });
  });
}

// ======================== NOTIFICACIONES PUSH (FCM) ========================

// Pide permiso y obtiene el token FCM
async function solicitarPermisoNotificaciones() {
  try {
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: 'BAkE5htq6BP-_RUp3hUNPFcDfMaYP5vAniP7e8ZZGC8ct9lcpeZm96hzDdno16TprBYKs90lD_am174DI4ZG3uU'
      });
      console.log('Token FCM:', token);
      alert('¡Notificaciones activadas!');
      // Si querés, podrías guardar el token en Firestore para enviar notis personalizadas
    } else {
      alert('Permiso de notificaciones denegado.');
      console.log('Permiso de notificaciones denegado');
    }
  } catch (e) {
    console.error('Error solicitando permiso de notificación', e);
    alert('Error activando notificaciones.');
  }
}

// Muestra la notificación si la app está abierta (primer plano)
// Muestra la notificación si la app está abierta (primer plano)
onMessage(messaging, (payload) => {
  console.log('Mensaje recibido en primer plano:', payload);
  alert("FCM recibido (test)."); // Para confirmar si entra
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration) {
        registration.showNotification("Test Notificación", {
          body: "Notificación mostrada por Service Worker.",
          icon: "icon.png"
        });
      } else {
        alert("No hay Service Worker registrado.");
      }
    });
  } else {
    alert("No hay permiso de notificaciones.");
  }
});

// ======================== FIN NOTIFICACIONES PUSH ==========================

inicializarDB();


