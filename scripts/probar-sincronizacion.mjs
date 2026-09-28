/* ═══════════════════════════════════════════════════════════════════════════
   Preparación para el servidor — `npm run probar-sincronizacion`

   Lo que se comprueba aquí no se ve en la pantalla y no tiene arreglo después:
   cada dato que se guarde de hoy en adelante lleva una fecha, y si esa fecha
   está mal puesta, estará mal puesta para siempre.

   Dos fallos concretos son los que se vigilan:

     1. Que apuntar UNA vacuna no le cambie la fecha a todas las demás. El
        historial se guarda entero cada vez que se toca, así que es el error
        natural de cometer, y arrasaría con la información que queremos tener.

     2. Que un borrado deje huella. Un borrado sin huella no se distingue de
        un dato que nunca existió, y el día que haya servidor devolvería la
        mascota borrada desde otro dispositivo.
   ═══════════════════════════════════════════════════════════════════════════ */

/* Node no tiene localStorage. Se pone uno de mentira antes de cargar el módulo. */
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
};

const {
  idDispositivo, sellar, sellarSiCambio, sellarHistorial,
  masReciente, anotarBorrado, podarBorrados, estaBorrado,
} = await import('../src/utils/sincronizacion.js');

let fallos = 0;
const comprobar = (titulo, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`  ${condicion ? 'OK  ' : 'MAL '}  ${titulo}`);
  if (!condicion && detalle) console.log(`          ${detalle}`);
};

const ANTES = '2026-01-15T10:00:00.000Z';
const OTRO = '2026-02-20T09:30:00.000Z';

console.log('');
console.log('  Preparación para el servidor');
console.log('  ───────────────────────────');

/* ── 1. El dispositivo ───────────────────────────────────────────────────── */
const id1 = idDispositivo();
comprobar('el dispositivo tiene identificador', typeof id1 === 'string' && id1.length > 5);
comprobar('y es el mismo la segunda vez', idDispositivo() === id1);
comprobar('sobrevive a recargar la página', memoria.get('aura_dispositivo') === id1);

/* ── 2. La marca ─────────────────────────────────────────────────────────── */
const sellado = sellar({ id: 1, name: 'Lolo' });
comprobar('sellar pone fecha', !Number.isNaN(Date.parse(sellado._actualizado)));
comprobar('sellar pone dispositivo', sellado._dispositivo === id1);
comprobar('sellar no toca los datos', sellado.name === 'Lolo' && sellado.id === 1);

/* ── 3. Solo se sella lo que cambia ──────────────────────────────────────── */
const vacuna = { id: 7, name: 'rabia', date: '2026-03-01', _actualizado: ANTES, _dispositivo: 'x' };

comprobar('un registro que no cambia conserva su fecha',
  sellarSiCambio({ ...vacuna }, vacuna)._actualizado === ANTES);

comprobar('un registro editado estrena fecha',
  sellarSiCambio({ ...vacuna, date: '2026-04-01' }, vacuna)._actualizado !== ANTES);

comprobar('un registro nuevo se sella',
  !!sellarSiCambio({ id: 9, name: 'nueva' }, undefined)._actualizado);

comprobar('un registro viejo sin fecha que no cambia sigue sin fecha',
  sellarSiCambio({ id: 3, name: 'antiguo' }, { id: 3, name: 'antiguo' })._actualizado === undefined);

/* ── 4. EL FALLO IMPORTANTE ───────────────────────────────────────────────
   Un historial con tres vacunas viejas. Se añade una cuarta y se corrige una
   de las tres. Las otras dos NO pueden cambiar de fecha. */
const historialAntes = {
  visits: [{ id: 1, clinic: 'Sur', _actualizado: ANTES }],
  vaccines: [
    { id: 10, name: 'rabia', date: '2025-01-01', _actualizado: ANTES },
    { id: 11, name: 'trivalente', date: '2025-06-01', _actualizado: OTRO },
    { id: 12, name: 'leucemia', date: '2025-09-01', _actualizado: OTRO },
  ],
  medications: [],
  analyses: [],
};

const historialDespues = {
  ...historialAntes,
  vaccines: [
    { id: 10, name: 'rabia', date: '2025-01-01', _actualizado: ANTES },
    { id: 11, name: 'trivalente', date: '2025-06-15', _actualizado: OTRO }, // corregida
    { id: 12, name: 'leucemia', date: '2025-09-01', _actualizado: OTRO },
    { id: 13, name: 'tos de las perreras', date: '2026-09-28' },            // nueva
  ],
};

const resultado = sellarHistorial(historialDespues, historialAntes);
const porId = (n) => resultado.vaccines.find((v) => v.id === n);

comprobar('la vacuna corregida estrena fecha', porId(11)._actualizado !== OTRO);
comprobar('la vacuna nueva tiene fecha', !!porId(13)._actualizado);
comprobar('la primera vacuna NO cambia de fecha', porId(10)._actualizado === ANTES,
  `salió ${porId(10)._actualizado}`);
comprobar('la tercera vacuna NO cambia de fecha', porId(12)._actualizado === OTRO,
  `salió ${porId(12)._actualizado}`);
comprobar('la visita, que está en otra sección, tampoco cambia',
  resultado.visits[0]._actualizado === ANTES);
comprobar('no se ha perdido ni añadido ninguna vacuna', resultado.vaccines.length === 4);
comprobar('las secciones vacías siguen existiendo',
  Array.isArray(resultado.medications) && Array.isArray(resultado.analyses));

/* ── 5. Cuál de dos versiones gana ───────────────────────────────────────── */
comprobar('gana la versión más reciente',
  masReciente({ v: 'vieja', _actualizado: ANTES }, { v: 'nueva', _actualizado: OTRO }).v === 'nueva');
comprobar('y da igual el orden en que se pregunte',
  masReciente({ v: 'nueva', _actualizado: OTRO }, { v: 'vieja', _actualizado: ANTES }).v === 'nueva');
comprobar('un dato sin fecha pierde contra uno que la tiene',
  masReciente({ v: 'sin fecha' }, { v: 'con fecha', _actualizado: ANTES }).v === 'con fecha');

/* ── 6. El rastro de lo borrado ──────────────────────────────────────────── */
let rastro = anotarBorrado([], 'pet', 111);
comprobar('un borrado se apunta', rastro.length === 1 && estaBorrado(rastro, 'pet', 111));
comprobar('con fecha y dispositivo', !!rastro[0].cuando && rastro[0].dispositivo === id1);

rastro = anotarBorrado(rastro, 'pet', 222);
comprobar('caben varios', rastro.length === 2 && estaBorrado(rastro, 'pet', 222));

rastro = anotarBorrado(rastro, 'pet', 111);
comprobar('borrar dos veces lo mismo no duplica la anotación', rastro.length === 2);

comprobar('lo que no se borró no aparece como borrado', !estaBorrado(rastro, 'pet', 999));
comprobar('el tipo importa: otra cosa con el mismo número no está borrada',
  !estaBorrado(rastro, 'doc', 111));

/* Lo viejo se descarta; lo reciente se queda. */
const viejo = new Date();
viejo.setFullYear(viejo.getFullYear() - 2);
const podado = podarBorrados([
  { tipo: 'pet', id: 1, cuando: viejo.toISOString() },
  { tipo: 'pet', id: 2, cuando: new Date().toISOString() },
]);
comprobar('un borrado de hace dos años se descarta', !estaBorrado(podado, 'pet', 1));
comprobar('uno de hoy se conserva', estaBorrado(podado, 'pet', 2));
comprobar('podar algo que no es una lista no revienta',
  Array.isArray(podarBorrados(null)) && podarBorrados(null).length === 0);

console.log('');
console.log(fallos ? `  ${fallos} comprobaciones fallan.` : '  Todas pasan.');
console.log('');
process.exit(fallos ? 1 : 0);
