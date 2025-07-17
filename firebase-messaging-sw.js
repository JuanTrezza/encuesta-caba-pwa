importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCEv6nDnAbN2WAgQ2aaS7V70RLgzq905do",
  authDomain: "encuestacabajuan.firebaseapp.com",
  projectId: "encuestacabajuan",
  storageBucket: "encuestacabajuan.firebasestorage.app",
  messagingSenderId: "534439491127",
  appId: "1:534439491127:web:41fbee0ad78c89d692b1b2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/assets/icon.png'
  });
});
