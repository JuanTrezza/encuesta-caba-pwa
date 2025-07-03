import { inicializarDB, guardarComentario, guardarPendiente, traerPendientes, eliminarPendiente } from './db.js';
import { crearRating } from './componentes/rating.js';
import { mostrarComentarios } from './componentes/listaComentarios.js';

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
      await guardarComentario(categoria, comentario);
    } else {
      await guardarPendiente(categoria,comentario);
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
    await guardarComentario(comentario.categoria, comentario);
    await eliminarPendiente(comentario.id);
  }
  alert("¡Conexión restaurada! Comentarios pendientes enviados.");
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
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker registrado:', reg.scope);
      })
      .catch(err => {
        console.error('❌ Error al registrar el Service Worker:', err);
      });
  });
}


inicializarDB();

