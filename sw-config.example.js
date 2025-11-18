// Example for service worker config. Copy to `sw-config.js` and fill values.
// This file is a plain script (not an ES module) so it can be loaded with importScripts().
var swFirebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// After copying to `sw-config.js`, ensure `importScripts('./sw-config.js');` is called
// before firebase.initializeApp(swFirebaseConfig) inside `firebase-messaging-sw.js`.