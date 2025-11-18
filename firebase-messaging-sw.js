importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
});

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
