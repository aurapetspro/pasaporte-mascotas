/* ═══════════════════════════════════════════════════════════════════════════
   La bóveda — `npm run probar-boveda`

   Esto prueba la parte de la aplicación donde un fallo no se ve: no rompe una
   pantalla, deja expedientes que ya no abren. Y como los datos están cifrados
   con una clave que nace de la contraseña del usuario, un error aquí no tiene
   arreglo posible después.

   Lo que se comprueba:

     · que lo guardado se puede volver a leer
     · que una contraseña equivocada no abre nada
     · que cambiar la contraseña NO pierde los datos
     · que el código de recuperación devuelve el acceso, con los datos intactos
     · que una bóveda del esquema anterior se migra sin perder nada

   El último es el que importa de verdad: la cuenta que ya existe hoy está
   cifrada con el esquema viejo, y tiene que seguir abriéndose mañana.

   vault.js está escrito para el navegador, así que aquí se le montan los dos
   almacenes que espera. El cifrado es el mismo: Web Crypto viene en Node.
   ═══════════════════════════════════════════════════════════════════════════ */

const almacen = () => {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    _volcado: () => new Map(m),
    _restaurar: (otro) => { m.clear(); for (const [k, v] of otro) m.set(k, v); },
  };
};

globalThis.localStorage = almacen();
globalThis.sessionStorage = almacen();

const { vault } = await import('../src/utils/vault.js');

/* ── Arnés de comprobaciones ─────────────────────────────────────────────── */
let fallos = 0;
const comprobar = (titulo, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`  ${condicion ? 'OK  ' : 'MAL '}  ${titulo}`);
  if (!condicion && detalle) console.log(`          ${detalle}`);
};

const EXPEDIENTE = {
  pets: [{ id: 1, name: 'Lolo', microchip: '941000012345678', species: 'cat' }],
  history: { vaccines: [{ name: 'trivalente', date: '2025-12-12' }] },
};

const limpiar = () => {
  vault.lock();
  localStorage.clear();
  sessionStorage.clear();
};

console.log('');
console.log('  Bóveda cifrada');
console.log('  ──────────────');

/* ── 1. Lo guardado se vuelve a leer ─────────────────────────────────────── */
limpiar();
let usuario = { id: 'u1', email: 'rocio@ejemplo.com' };
usuario = { ...usuario, ...(await vault.createSession(usuario.id, 'contraseña-buena')) };
await vault.setScopedData('u1', 'pets', EXPEDIENTE.pets);
await vault.setScopedData('u1', 'history', EXPEDIENTE.history);

comprobar('lo guardado se lee igual',
  JSON.stringify(vault.getScopedData('u1', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

comprobar('en disco está cifrado, no en claro',
  !JSON.stringify([...Array(localStorage.length)].map((_, i) => localStorage.getItem(localStorage.key(i)))).includes('Lolo'));

/* ── 2. Cerrar y volver a abrir ──────────────────────────────────────────── */
vault.lock();
comprobar('al cerrar, la bóveda queda bloqueada', !vault.isUnlocked());

const reabierto = await vault.openSession(usuario, 'contraseña-buena');
comprobar('la contraseña correcta abre', reabierto !== null);
comprobar('los datos siguen ahí tras reabrir',
  JSON.stringify(vault.getScopedData('u1', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

/* ── 3. Una contraseña equivocada no abre ────────────────────────────────── */
vault.lock();
const malo = await vault.openSession(usuario, 'contraseña-mala');
comprobar('la contraseña equivocada NO abre', malo === null);

/* ── 4. Cambiar la contraseña conserva los datos ─────────────────────────── */
limpiar();
usuario = { id: 'u2', email: 'rocio@ejemplo.com' };
usuario = { ...usuario, ...(await vault.createSession(usuario.id, 'la-vieja')) };
await vault.setScopedData('u2', 'pets', EXPEDIENTE.pets);

if (typeof vault.changePassword === 'function') {
  const cambiado = await vault.changePassword(usuario, 'la-vieja', 'la-nueva');
  comprobar('cambiar la contraseña devuelve el usuario actualizado', !!cambiado);

  vault.lock();
  const conNueva = await vault.openSession(cambiado ?? usuario, 'la-nueva');
  comprobar('la contraseña nueva abre', conNueva !== null);
  comprobar('los datos SIGUEN ahí tras cambiar la contraseña',
    JSON.stringify(vault.getScopedData('u2', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

  vault.lock();
  comprobar('la contraseña vieja ya no abre',
    (await vault.openSession(cambiado ?? usuario, 'la-vieja')) === null);
} else {
  comprobar('existe vault.changePassword', false, 'todavía no está implementado');
}

/* ── 5. El código de recuperación ────────────────────────────────────────── */
limpiar();
usuario = { id: 'u3', email: 'rocio@ejemplo.com' };
const alta = await vault.createSession(usuario.id, 'la-que-se-olvida');
usuario = { ...usuario, ...alta };
await vault.setScopedData('u3', 'pets', EXPEDIENTE.pets);

if (alta.recoveryCode && typeof vault.recoverWithCode === 'function') {
  comprobar('el alta entrega un código de recuperación', typeof alta.recoveryCode === 'string' && alta.recoveryCode.length >= 12);

  vault.lock();
  const recuperado = await vault.recoverWithCode(usuario, alta.recoveryCode, 'otra-distinta');
  comprobar('el código de recuperación devuelve el acceso', !!recuperado);
  comprobar('los datos SIGUEN ahí tras recuperar',
    JSON.stringify(vault.getScopedData('u3', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

  vault.lock();
  comprobar('después se entra con la contraseña nueva',
    (await vault.openSession(recuperado ?? usuario, 'otra-distinta')) !== null);

  vault.lock();
  comprobar('un código inventado NO devuelve el acceso',
    (await vault.recoverWithCode(usuario, 'AURA-0000-0000-0000', 'lo-que-sea')) === null);

  /* ── El código sirve todas las veces que haga falta ────────────────────────
     Es la diferencia entre una red de seguridad y un solo cartucho. Quien
     olvida una contraseña suele olvidar también la siguiente, y si el código
     se gastara al usarlo habría que enseñar uno nuevo justo en ese momento
     —con el usuario agobiado y con prisa— y volveríamos a depender de que lo
     guarde bien. Se queda reutilizable a propósito. */
  vault.lock();
  const segunda = await vault.recoverWithCode(recuperado ?? usuario, alta.recoveryCode, 'y-otra-más');
  comprobar('el mismo código sirve una segunda vez', !!segunda);
  comprobar('y los datos siguen ahí después de dos recuperaciones',
    JSON.stringify(vault.getScopedData('u3', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

  vault.lock();
  const tercera = await vault.recoverWithCode(segunda ?? usuario, alta.recoveryCode, 'y-van-tres');
  comprobar('y una tercera', !!tercera);
  comprobar('se entra con la última contraseña puesta',
    (await vault.openSession(tercera ?? usuario, 'y-van-tres')) !== null);
} else {
  comprobar('el alta entrega un código de recuperación', false, 'todavía no está implementado');
}

/* ── 6. Migración desde el esquema anterior ──────────────────────────────────
   El caso que de verdad importa, y el único que no se puede repetir: la cuenta
   que ya existe hoy está cifrada con el esquema viejo, donde la contraseña ERA
   la clave de los datos. Si la migración falla, ese expediente no vuelve.

   La bóveda vieja se fabrica aquí a mano, con el formato exacto que dejaba la
   versión anterior. No se usa el código actual para montarla: si se usara, se
   estaría probando el código nuevo contra sí mismo, y una migración rota
   pasaría la prueba sin enterarse. */
limpiar();

const b64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const ESQUEMA_VIEJO = async (password, datos) => {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' }, base, 512,
  ));
  /* Así era: los primeros 32 bytes cifraban los datos directamente. */
  const clave = await crypto.subtle.importKey('raw', bits.slice(0, 32), { name: 'AES-GCM' }, false, ['encrypt']);

  for (const [k, v] of Object.entries(datos)) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, clave, enc.encode(JSON.stringify(v)));
    localStorage.setItem(`vault_u4_${k}`, `v1.${b64(iv)}.${b64(cipher)}`);
  }
  /* Y el registro del usuario llevaba sal y verificador, sin clave envuelta. */
  return { id: 'u4', email: 'rocio@ejemplo.com', salt: b64(salt), verifier: b64(bits.slice(32)) };
};

const comoAntes = await ESQUEMA_VIEJO('de-toda-la-vida', { pets: EXPEDIENTE.pets, history: EXPEDIENTE.history });

comprobar('la bóveda vieja NO se abre con contraseña equivocada',
  (await vault.openSession(comoAntes, 'otra-cosa')) === null);

vault.lock();
const migrado = await vault.openSession(comoAntes, 'de-toda-la-vida');
comprobar('una bóveda del esquema anterior se abre', migrado !== null);
comprobar('y sus datos siguen intactos',
  JSON.stringify(vault.getScopedData('u4', 'pets')) === JSON.stringify(EXPEDIENTE.pets));

if (migrado) {
  vault.lock();
  const otraVez = await vault.openSession(migrado, 'de-toda-la-vida');
  comprobar('tras migrar, la misma contraseña sigue abriendo', otraVez !== null);
  comprobar('y los datos siguen ahí',
    JSON.stringify(vault.getScopedData('u4', 'pets')) === JSON.stringify(EXPEDIENTE.pets));
}

console.log('');
console.log(fallos ? `  ${fallos} comprobaciones fallan.` : '  Todas pasan.');
console.log('');
process.exit(fallos ? 1 : 0);
