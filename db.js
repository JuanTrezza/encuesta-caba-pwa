let db;
// db.js - Manejo de IndexedDB para comentarios y pendientes
export function inicializarDB() {
  const request = indexedDB.open("EncuestasCABA", 2);
  request.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("comentarios")) {
      db.createObjectStore("comentarios", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("pendientes")) {
      db.createObjectStore("pendientes", { keyPath: "id", autoIncrement: true });
    }
  };
  request.onsuccess = e => { db = e.target.result; };
}
//Guardador de comentarios y pendientes
export function guardarComentario(categoria, comentario) {
  return new Promise(resolve => {
    const tx = db.transaction("comentarios", "readwrite");
    const store = tx.objectStore("comentarios");
    store.add({ ...comentario, categoria });
    tx.oncomplete = resolve;
  });
}
// Trae los comentarios de una categoría específica
export function traerComentarios(categoria) {
  return new Promise(resolve => {
    const tx = db.transaction("comentarios", "readonly");
    const store = tx.objectStore("comentarios");
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(c => c.categoria === categoria));
    };
  });
}

// Guarda un comentario pendiente para enviar más tarde
export function guardarPendiente(categoria, comentario) {
  return new Promise(resolve => {
    const tx = db.transaction("pendientes", "readwrite");
    const store = tx.objectStore("pendientes");
    store.add({ ...comentario, categoria });
    tx.oncomplete = resolve;
  });
}

// Trae los comentarios pendientes
export function traerPendientes() {
  return new Promise(resolve => {
    const tx = db.transaction("pendientes", "readonly");
    const store = tx.objectStore("pendientes");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

// Elimina un comentario pendiente
export function eliminarPendiente(id) {
  return new Promise(resolve => {
    const tx = db.transaction("pendientes", "readwrite");
    const store = tx.objectStore("pendientes");
    store.delete(id);
    tx.oncomplete = resolve;
  });
}
