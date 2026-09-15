/**
 * AURA Vault — cifrado local AES-256-GCM con clave derivada de la contraseña.
 *
 * Modelo de seguridad
 * -------------------
 * Hay dos claves, no una, y la diferencia importa mucho.
 *
 *   La clave de datos (DEK) se sortea al azar una sola vez, al crear la cuenta,
 *   y es la que cifra todo el expediente. No cambia nunca.
 *
 *   La clave de acceso (KEK) se deriva de la contraseña con PBKDF2-SHA256
 *   (210.000 iteraciones, sal aleatoria por usuario) y no cifra los datos: solo
 *   cifra a la clave de datos. Lo que se guarda en el registro del usuario es
 *   esa clave de datos envuelta.
 *
 * Antes la contraseña ERA la clave de los datos, y eso tenía dos consecuencias
 * feas. Cambiar de contraseña obligaba a volver a cifrarlo todo —así que no
 * existía la opción—, y olvidarla significaba perder el expediente entero sin
 * remedio posible.
 *
 * Con la clave envuelta, cambiar la contraseña es volver a envolver la misma
 * clave de datos: los datos ni se tocan, y es instantáneo. Y se puede envolver
 * una segunda vez con un código de recuperación que el usuario guarda aparte,
 * de modo que olvidar la contraseña deje de ser definitivo.
 *
 * Lo que NO cambia: nada de esto sale del dispositivo, y seguimos sin poder
 * leer nada. Quien tenga el código de recuperación abre la bóveda, igual que
 * quien tenga la contraseña; por eso el código se enseña una vez y se dice
 * claramente que hay que guardarlo bien. Si se pierden los dos, los datos son
 * irrecuperables: no hay puerta trasera, ni para el usuario ni para nosotros.
 *
 * Mientras dura la sesión la clave de datos vive en sessionStorage, que es por
 * pestaña y se destruye al cerrarla. Eso permite recargar la página sin volver
 * a escribir la contraseña, y mantiene los datos ilegibles en reposo: quien
 * acceda al dispositivo, a una copia de seguridad del navegador o a un perfil
 * sincronizado encontrará solo texto cifrado.
 *
 * Rendimiento
 * -----------
 * Descifrar en cada lectura haría lenta la interfaz, así que al abrir sesión se
 * descifra todo una vez a un caché en memoria. Las lecturas son síncronas contra
 * ese caché; las escrituras actualizan el caché y devuelven una promesa que se
 * resuelve cuando el dato ya está cifrado en disco.
 */

const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const CIPHER_PREFIX = 'v1';
const SESSION_KEY_PREFIX = 'aura_sk_';
const LEGACY_SALT = 'mascota_salt_2024';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* ── Estado de sesión (solo en memoria) ── */
let activeKey = null;
/* Los bytes en claro de la clave de datos. La versión importada no es
   exportable a propósito, y para volver a envolverla —al cambiar la
   contraseña— hace falta el original. */
let activeDekBytes = null;
let activeUserId = null;
const cache = new Map();

/* ── Base64 ── */
const toB64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  // Recorrido manual: String.fromCharCode(...bytes) desborda la pila con
  // entradas grandes como una foto en base64.
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};
const fromB64 = (text) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

/* ── Derivación de clave ── */
const deriveBits = async (password, salt) => {
  const base = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    512,
  );
  return new Uint8Array(bits);
};

const importAesKey = (rawKey) =>
  crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

/* ── La clave de datos, envuelta ──────────────────────────────────────────
   Envolver es cifrar una clave con otra. Se usa AES-GCM, que además de cifrar
   autentica: si la contraseña es incorrecta el desenvuelto falla solo, sin
   necesidad de guardar ningún verificador aparte. Una contraseña equivocada no
   devuelve basura, devuelve un error. */
const wrapDek = async (kekBytes, dekBytes) => {
  const kek = await importAesKey(kekBytes);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, dekBytes);
  return `${toB64(iv)}.${toB64(cipher)}`;
};

const unwrapDek = async (kekBytes, envuelto) => {
  if (typeof envuelto !== 'string') return null;
  const [iv, cipher] = envuelto.split('.');
  if (!iv || !cipher) return null;
  try {
    const kek = await importAesKey(kekBytes);
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(iv) }, kek, fromB64(cipher),
    );
    return new Uint8Array(plain);
  } catch {
    return null;   // contraseña o código incorrectos
  }
};

/* ── El código de recuperación ────────────────────────────────────────────
   Se escribe a mano desde un papel, así que el alfabeto evita los caracteres
   que se confunden al leer: nada de O y 0, ni de I, l y 1. Quedan 32 símbolos,
   y 16 de ellos dan 80 bits de azar: de sobra para que no se adivine. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const nuevoCodigo = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const letras = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('');
  return 'AURA-' + letras.match(/.{4}/g).join('-');
};

/* Al comparar se ignoran guiones, espacios y mayúsculas: quien lo copia de un
   papel no tiene por qué reproducir el formato exacto. */
const normalizarCodigo = (texto) => (texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const deriveKek = async (secreto, salt) => (await deriveBits(secreto, salt)).slice(0, 32);

/** Deja la bóveda abierta con la clave de datos indicada. */
const abrirCon = async (userId, dekBytes) => {
  activeKey = await importAesKey(dekBytes);
  activeDekBytes = dekBytes;
  activeUserId = userId;
  sessionStorage.setItem(SESSION_KEY_PREFIX + userId, toB64(dekBytes));
  await hydrate(userId);
};

/* ── Cifrado de cadenas ── */
const encryptString = async (plaintext) => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, activeKey, encoder.encode(plaintext));
  return `${CIPHER_PREFIX}.${toB64(iv)}.${toB64(cipher)}`;
};

const decryptString = async (payload) => {
  if (typeof payload !== 'string') return null;
  const parts = payload.split('.');
  // Los datos de versiones anteriores están en claro: se devuelven tal cual
  // para poder migrarlos al primer guardado.
  if (parts.length !== 3 || parts[0] !== CIPHER_PREFIX) return payload;
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(parts[1]) },
    activeKey,
    fromB64(parts[2]),
  );
  return decoder.decode(plain);
};

/* ── Persistencia ── */
const storageKeyFor = (userId, key) => `vault_${userId}_${key}`;

const persist = async (userId, key, data) => {
  const payload = await encryptString(JSON.stringify(data));
  try {
    localStorage.setItem(storageKeyFor(userId, key), payload);
  } catch (err) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22;

    console.error('[AURA Vault] Error al guardar datos:', err);

    const friendly = new Error(
      isQuota
        ? 'No hay espacio suficiente en este dispositivo para guardar el expediente. Elimina alguna foto o mascota antigua e inténtalo de nuevo.'
        : 'No se ha podido guardar el expediente en este dispositivo.',
    );
    friendly.name = isQuota ? 'StorageQuotaError' : 'StorageWriteError';
    friendly.cause = err;
    throw friendly;
  }
};

/** Descifra todo el espacio del usuario al caché en memoria. */
const hydrate = async (userId) => {
  cache.clear();
  const prefix = `vault_${userId}_`;
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) keys.push(k);
  }
  for (const fullKey of keys) {
    try {
      const plain = await decryptString(localStorage.getItem(fullKey));
      cache.set(fullKey.slice(prefix.length), JSON.parse(plain));
    } catch {
      // Un registro ilegible no debe tumbar la sesión entera: se omite y el
      // resto del expediente sigue accesible.
      console.warn('[AURA Vault] Registro ilegible, se omite:', fullKey);
    }
  }
};

/** Reescribe cifrado todo lo que siga en claro de versiones anteriores. */
const reencryptAll = async (userId) => {
  for (const [key, value] of cache.entries()) {
    await persist(userId, key, value);
  }
};

export const vault = {
  /* ── Hash heredado: solo para validar cuentas creadas antes del cifrado ── */
  hashPassword: async (password) => {
    const data = encoder.encode(password + LEGACY_SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Comprueba la contraseña y abre la bóveda.
   * Devuelve el registro de usuario actualizado —con sal y verificador— para
   * que quien llame lo persista, o null si la contraseña no es correcta.
   */
  openSession: async (user, password) => {
    /* ── Camino normal: la clave de datos va envuelta ──────────────────── */
    if (user.wrappedDek) {
      const kek = await deriveKek(password, fromB64(user.salt));
      const dek = await unwrapDek(kek, user.wrappedDek);
      if (!dek) return null;           // el desenvuelto autentica: si falla, la contraseña no es
      await abrirCon(user.id, dek);
      return user;                     // no hay nada que actualizar
    }

    /* ── Cuentas del esquema anterior ───────────────────────────────────────
       Aquí la contraseña ERA la clave de los datos. La migración se apoya en
       eso: la clave de datos pasa a ser exactamente la misma que ya cifró el
       expediente, y lo único que se añade es la envoltura. Así no hay que
       volver a cifrar nada, y por tanto no hay forma de corromper nada. Lo
       guardado en disco no se toca ni un byte. */
    const isLegacy = !user.salt;

    if (isLegacy) {
      const legacyHash = await vault.hashPassword(password);
      if (legacyHash !== user.password) return null;
    }

    const salt = isLegacy ? crypto.getRandomValues(new Uint8Array(SALT_BYTES)) : fromB64(user.salt);
    const bits = await deriveBits(password, salt);
    const keyBytes = bits.slice(0, 32);
    const verifier = toB64(bits.slice(32));

    if (!isLegacy && verifier !== user.verifier) return null;

    await abrirCon(user.id, keyBytes);
    if (isLegacy) await reencryptAll(user.id); // migra lo que estuviera en claro

    /* La envoltura se hace con una sal propia, distinta de la que derivó la
       clave de datos: así la clave que envuelve y la envuelta son
       independientes. */
    const saltEnvoltura = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const kek = await deriveKek(password, saltEnvoltura);

    const upgraded = {
      ...user,
      salt: toB64(saltEnvoltura),
      wrappedDek: await wrapDek(kek, keyBytes),
    };
    delete upgraded.password;   // el hash antiguo deja de ser necesario
    delete upgraded.verifier;   // ahora autentica el propio desenvuelto
    return upgraded;
  },

  /**
   * Crea la bóveda de un usuario nuevo.
   * Devuelve lo que hay que guardar en su registro, más el código de
   * recuperación, que se enseña UNA vez y no se guarda en ninguna parte:
   * de él solo queda la clave de datos envuelta con él.
   */
  createSession: async (userId, password) => {
    const dek = crypto.getRandomValues(new Uint8Array(32));

    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const kek = await deriveKek(password, salt);

    const recoveryCode = nuevoCodigo();
    const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const rk = await deriveKek(normalizarCodigo(recoveryCode), recoverySalt);

    cache.clear();
    await abrirCon(userId, dek);

    return {
      salt: toB64(salt),
      wrappedDek: await wrapDek(kek, dek),
      recoverySalt: toB64(recoverySalt),
      wrappedDekRecovery: await wrapDek(rk, dek),
      recoveryCode,
    };
  },

  /**
   * Cambia la contraseña sin tocar los datos.
   *
   * Solo se vuelve a envolver la misma clave de datos con una clave de acceso
   * nueva. El expediente entero sigue cifrado exactamente igual que estaba, así
   * que esto es instantáneo aunque haya cien fotos dentro, y no hay ningún
   * momento en el que los datos queden a medio migrar.
   *
   * Devuelve el registro actualizado, o null si la contraseña actual no es.
   */
  changePassword: async (user, currentPassword, newPassword) => {
    if (!user?.wrappedDek) return null;

    const kekActual = await deriveKek(currentPassword, fromB64(user.salt));
    const dek = await unwrapDek(kekActual, user.wrappedDek);
    if (!dek) return null;

    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const kek = await deriveKek(newPassword, salt);

    return { ...user, salt: toB64(salt), wrappedDek: await wrapDek(kek, dek) };
  },

  /**
   * Devuelve el acceso con el código de recuperación, conservando los datos.
   *
   * El código abre la segunda envoltura de la misma clave de datos, así que el
   * expediente sigue intacto. Se establece la contraseña nueva envolviéndola
   * otra vez, y la bóveda queda abierta.
   *
   * Devuelve el registro actualizado, o null si el código no es correcto.
   */
  recoverWithCode: async (user, code, newPassword) => {
    if (!user?.wrappedDekRecovery || !user?.recoverySalt) return null;

    const rk = await deriveKek(normalizarCodigo(code), fromB64(user.recoverySalt));
    const dek = await unwrapDek(rk, user.wrappedDekRecovery);
    if (!dek) return null;

    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const kek = await deriveKek(newPassword, salt);

    cache.clear();
    await abrirCon(user.id, dek);

    return { ...user, salt: toB64(salt), wrappedDek: await wrapDek(kek, dek) };
  },

  /**
   * Genera un código de recuperación nuevo para una bóveda ya abierta.
   *
   * Sirve para las cuentas que vienen del esquema anterior, que no lo tienen, y
   * para reemplazar uno que se haya perdido o visto. El anterior deja de valer
   * en cuanto se guarda el registro: solo hay una envoltura de recuperación.
   */
  createRecoveryCode: async () => {
    if (!activeDekBytes) return null;

    const recoveryCode = nuevoCodigo();
    const recoverySalt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const rk = await deriveKek(normalizarCodigo(recoveryCode), recoverySalt);

    return {
      recoveryCode,
      recoverySalt: toB64(recoverySalt),
      wrappedDekRecovery: await wrapDek(rk, activeDekBytes),
    };
  },

  /**
   * Reabre la bóveda tras recargar la página, con la clave que quedó en
   * sessionStorage. Devuelve false si no hay clave y hay que pedir contraseña.
   */
  restoreSession: async (userId) => {
    const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + userId);
    if (!raw) return false;
    try {
      await abrirCon(userId, fromB64(raw));
      return true;
    } catch {
      vault.lock();
      return false;
    }
  },

  /** Cierra la bóveda y destruye la clave. */
  lock: () => {
    if (activeUserId) sessionStorage.removeItem(SESSION_KEY_PREFIX + activeUserId);
    activeKey = null;
    activeDekBytes = null;
    activeUserId = null;
    cache.clear();
  },

  isUnlocked: () => activeKey !== null,

  /* ── Datos ── */

  /** Lectura síncrona desde el caché descifrado. */
  getScopedData: (userId, key) => {
    if (activeUserId !== userId) return null;
    return cache.has(key) ? cache.get(key) : null;
  },

  /** Escritura: actualiza el caché y devuelve la promesa del guardado cifrado. */
  setScopedData: (userId, key, data) => {
    if (activeUserId !== userId || !activeKey) {
      const cerrada = new Error('La bóveda está cerrada. Vuelve a iniciar sesión.');
      cerrada.name = 'VaultLockedError';
      return Promise.reject(cerrada);
    }
    cache.set(key, data);
    return persist(userId, key, data);
  },

  removeScopedData: (userId, key) => {
    cache.delete(key);
    localStorage.removeItem(storageKeyFor(userId, key));
  },

  /** Espacio aproximado ocupado por este usuario, en bytes. */
  getUsedBytes: (userId) => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`vault_${userId}_`)) total += k.length + (localStorage.getItem(k)?.length ?? 0);
    }
    return total * 2; // UTF-16: 2 bytes por carácter
  },

  /* ── Caducidad de sesión ── */
  sessionDuration: 2 * 60 * 60 * 1000, // 2 horas

  isSessionExpired: (startTime) => Date.now() - startTime > vault.sessionDuration,
};
