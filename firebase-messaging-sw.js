importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Configuración de Firebase cargada desde archivo externo (NO VERSIONADO)
// Service workers requieren importScripts, por lo que se carga sw-config.js
// Crea sw-config.js copiando sw-config.example.js y completando tus valores
try {
  importScripts('./sw-config.js');
} catch (e) {
  console.error('Error: sw-config.js no encontrado. Copia sw-config.example.js a sw-config.js');
}

//No hay firebase porque es un servicio worker y no tiene acceso al DOM
//Por eso se usa importScripts para importar las librerias necesarias
//Luego se inicializa la app de firebase con la configuracion del proyecto
//Finalmente se obtiene una instancia de firebase messaging para manejar los mensajes en segundo plano

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/assets/icon.png'
  });
});
