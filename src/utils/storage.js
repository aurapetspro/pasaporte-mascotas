import { vault } from './vault';
import {
  sellar,
  sellarSiCambio,
  sellarHistorial,
  anotarBorrado,
  podarBorrados,
} from './sincronizacion';

/**
 * Capa de almacenamiento multiusuario.
 *
 * Las lecturas son síncronas porque van contra el caché descifrado que el vault
 * carga al abrir sesión. Las escrituras devuelven una promesa: hay que esperarla
 * antes de dar por buena la operación, porque es donde afloran los errores de
 * cifrado o de falta de espacio.
 *
 * Todo lo que se escribe pasa por `sincronizacion.js`, que le pone la fecha y el
 * dispositivo. Hoy no sirve para nada visible; el día que haya servidor será lo
 * que le permita saber qué versión de cada dato es la buena. Se hace aquí, en un
 * solo sitio, para que ninguna pantalla tenga que acordarse.
 */
export const storage = {
  /* ── Usuarios ── */
  // La lista de cuentas no va cifrada: solo contiene email, sal y verificador.
  // El verificador no permite descifrar nada, únicamente comprobar la contraseña.
  getUsers: () => {
    try {
      return JSON.parse(localStorage.getItem('mascota_health_users') || '[]');
    } catch {
      return [];
    }
  },

  saveUser: (user) => {
    const users = storage.getUsers();
    localStorage.setItem('mascota_health_users', JSON.stringify([...users, sellar(user)]));
  },

  updateUser: (user) => {
    const anterior = storage.getUsers().find((u) => u.id === user.id);
    const sellado = sellarSiCambio(user, anterior);
    const users = storage.getUsers().map((u) => (u.id === user.id ? sellado : u));
    localStorage.setItem('mascota_health_users', JSON.stringify(users));
  },

  /* ── Mascotas ── */
  getPets: (userId) => vault.getScopedData(userId, 'pets') || [],

  savePet: (userId, pet) => {
    const allPets = storage.getPets(userId);
    return vault.setScopedData(userId, 'pets', [...allPets, sellar(pet)]);
  },

  updatePet: (userId, petId, updateFn) => {
    const updated = storage
      .getPets(userId)
      .map((p) => (p.id === petId ? sellarSiCambio(updateFn(p), p) : p));
    return vault.setScopedData(userId, 'pets', updated);
  },

  deletePet: async (userId, petId) => {
    const remaining = storage.getPets(userId).filter((p) => p.id !== petId);

    /* Primero desaparece de verdad, y solo después se apunta en el rastro. Al
       revés, si fallara la segunda escritura quedaría anotado el borrado de una
       mascota que sigue estando, y el día que hubiera servidor la borraría de
       todos los dispositivos. En este orden, lo peor que puede pasar es que un
       borrado no deje huella, que es lo que pasaba hasta ahora. */
    await vault.removeScopedData(userId, `history_${petId}`);
    await vault.removeScopedData(userId, `docs_${petId}`);
    const resultado = await vault.setScopedData(userId, 'pets', remaining);

    /* El apunte no puede hacer fracasar el borrado. Llegados aquí la mascota ya
       ha desaparecido; si esta última escritura falla y se dejara subir el
       error, la pantalla diría que no se ha podido borrar una mascota que sí se
       ha borrado. Se intenta y, si no sale, se sigue. */
    try {
      await storage.anotarBorrado(userId, 'pet', petId);
    } catch {
      /* Sin huella. El día que haya servidor podría reaparecer; es un mal
         menor comparado con mentirle al usuario. */
    }
    return resultado;
  },

  /* ── Documentos adjuntos ── */
  getDocuments: (userId, petId) => vault.getScopedData(userId, `docs_${petId}`) || [],

  saveDocument: (userId, petId, doc) => {
    const docs = storage.getDocuments(userId, petId);
    return vault.setScopedData(userId, `docs_${petId}`, [...docs, sellar(doc)]);
  },

  /* ── Historial clínico ── */
  // Antes vivía suelto en localStorage, sin cifrar y sin separar por usuario.
  getHistory: (userId, petId, fallback) => vault.getScopedData(userId, `history_${petId}`) ?? fallback,

  saveHistory: (userId, petId, data) => {
    /* Se lee lo que había para sellar solo los registros que cambian. Sin esto,
       una sola vacuna nueva le pondría la fecha de hoy a todo el historial. */
    const anterior = vault.getScopedData(userId, `history_${petId}`);
    return vault.setScopedData(userId, `history_${petId}`, sellarHistorial(data, anterior));
  },

  /* ── Rastro de lo borrado ──────────────────────────────────────────────────
     Nadie lo mira todavía. Existe porque un borrado sin huella no se puede
     reconstruir después: cuando haya servidor, esto es lo que evitará que
     reaparezca una mascota que alguien borró desde otro dispositivo. */
  getBorrados: (userId) => podarBorrados(vault.getScopedData(userId, 'borrados')),

  anotarBorrado: (userId, tipo, id) => {
    const rastro = podarBorrados(vault.getScopedData(userId, 'borrados'));
    return vault.setScopedData(userId, 'borrados', anotarBorrado(rastro, tipo, id));
  },
};
