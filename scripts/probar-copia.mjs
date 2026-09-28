/* ═══════════════════════════════════════════════════════════════════════════
   Restaurar una copia — `npm run probar-copia`

   Esta es la parte que decide qué entra en el expediente de alguien, y los
   fallos aquí son de los que no se ven: una mascota que hereda el historial
   de otra no da ningún error, simplemente enseña las vacunas equivocadas el
   día que alguien lee la ficha en un veterinario.

   Se comprueban dos cosas:

     1. Que no se dé por buena una copia que no lo es. Cualquier archivo
        parsea como JSON; hace falta rechazar los que no son nuestros ANTES de
        escribir nada.

     2. Que la vuelta completa —exportar y volver a importar— conserve los
        datos. Es la promesa entera de la función: si se pierde algo por el
        camino, la copia de seguridad no sirve.
   ═══════════════════════════════════════════════════════════════════════════ */

import { leerCopia, prepararMascota, MARCA_COPIA } from '../src/utils/copia.js';

let fallos = 0;
const comprobar = (titulo, condicion, detalle = '') => {
  if (!condicion) fallos += 1;
  console.log(`  ${condicion ? 'OK  ' : 'MAL '}  ${titulo}`);
  if (!condicion && detalle) console.log(`          ${detalle}`);
};

/* Una copia como la que descarga la aplicación. */
const EXPEDIENTE = {
  exportDate: '2026-05-12T10:00:00.000Z',
  format: `${MARCA_COPIA} v2`,
  user: { email: 'rocio@ejemplo.com', id: 'u1' },
  pets: [
    {
      id: 111, userId: 'u1', name: 'Lolo', species: 'cat', microchip: '941000012345678',
      medicalHistory: {
        visits: [{ id: 1, date: '2026-01-10', clinic: 'Clínica Sur' }],
        vaccines: [{ id: 2, name: 'trivalente', date: '2025-12-12', nextDose: '2028-12-11' }],
        medications: [], analyses: [],
      },
    },
    {
      id: 222, userId: 'u1', name: 'Nala', species: 'dog',
      medicalHistory: { visits: [], vaccines: [{ id: 3, name: 'rabia', date: '2026-03-01' }], medications: [], analyses: [] },
    },
  ],
};

console.log('');
console.log('  Restaurar una copia');
console.log('  ───────────────────');

/* ── 1. Lo que NO debe aceptarse ─────────────────────────────────────────── */
comprobar('un archivo que no es JSON se rechaza',
  leerCopia('esto no es un json').error === 'errNotJson');

comprobar('un JSON cualquiera se rechaza',
  leerCopia('{"hola":"mundo"}').error === 'errNotOurs');

comprobar('un JSON con mascotas pero sin nuestra marca se rechaza',
  leerCopia(JSON.stringify({ pets: [{ name: 'X' }] })).error === 'errNotOurs');

comprobar('una copia nuestra pero vacía se rechaza',
  leerCopia(JSON.stringify({ format: `${MARCA_COPIA} v2`, pets: [] })).error === 'errEmpty');

comprobar('ninguna de esas devuelve datos',
  ['esto no es un json', '{"hola":"mundo"}'].every(x => !leerCopia(x).ok));

/* ── 2. La copia buena ───────────────────────────────────────────────────── */
const leida = leerCopia(JSON.stringify(EXPEDIENTE));

comprobar('una copia válida se acepta', leida.ok === true);
comprobar('cuenta bien las mascotas', leida.mascotas === 2, `salió ${leida.mascotas}`);
comprobar('cuenta bien los registros médicos', leida.registros === 3, `salió ${leida.registros}`);
comprobar('conserva la fecha de la copia', leida.fecha === EXPEDIENTE.exportDate);

/* ── 3. La vuelta completa ────────────────────────────────────────────────
   Se simula lo que hace la pantalla: preparar cada mascota y guardarla en dos
   cajones, el de la ficha y el del historial. Luego se compara con lo que
   había al principio. */
const boveda = { pets: [], historiales: {} };
let n = 0;
for (const mascota of leida.pets) {
  const { ficha, historial } = prepararMascota(mascota, 'u9', 5000 + n);
  boveda.pets.push(ficha);
  if (historial) boveda.historiales[ficha.id] = historial;
  n += 1;
}

comprobar('entran las dos mascotas', boveda.pets.length === 2);
comprobar('con sus nombres', boveda.pets.map(p => p.name).join() === 'Lolo,Nala');
comprobar('y con sus datos intactos',
  boveda.pets[0].microchip === '941000012345678' && boveda.pets[0].species === 'cat');

/* Lo más importante de todo: que cada historial siga con SU mascota. */
const lolo = boveda.pets.find(p => p.name === 'Lolo');
const nala = boveda.pets.find(p => p.name === 'Nala');
comprobar('el historial de Lolo sigue siendo el de Lolo',
  boveda.historiales[lolo.id].vaccines[0].name === 'trivalente');
comprobar('el de Nala sigue siendo el de Nala',
  boveda.historiales[nala.id].vaccines[0].name === 'rabia');
comprobar('no se ha perdido ningún registro',
  Object.values(boveda.historiales).reduce((t, h) =>
    t + h.visits.length + h.vaccines.length + h.medications.length + h.analyses.length, 0) === 3);

/* ── 4. Los identificadores del archivo se tiran ──────────────────────────
   Si se conservaran, una copia restaurada en una cuenta que ya tenga una
   mascota con ese número machacaría la suya, o le pegaría el historial
   ajeno. */
comprobar('las mascotas NO conservan el identificador del archivo',
  boveda.pets.every(p => p.id !== 111 && p.id !== 222));
comprobar('cada mascota tiene identificador distinto',
  boveda.pets[0].id !== boveda.pets[1].id);
comprobar('pasan a ser de quien restaura, no de quien exportó',
  boveda.pets.every(p => p.userId === 'u9'));
comprobar('el historial no viaja dentro de la ficha',
  boveda.pets.every(p => p.medicalHistory === undefined));

/* ── 5. Una copia con partes ausentes no revienta ─────────────────────── */
const incompleta = leerCopia(JSON.stringify({
  format: `${MARCA_COPIA} v2`,
  pets: [{ name: 'Sin historial' }],
}));
comprobar('una mascota sin historial se acepta', incompleta.ok === true);
comprobar('y cuenta cero registros', incompleta.registros === 0);
const prep = prepararMascota(incompleta.pets[0], 'u9', 1);
comprobar('y se prepara sin historial', prep.historial === null && prep.ficha.name === 'Sin historial');

console.log('');
console.log(fallos ? `  ${fallos} comprobaciones fallan.` : '  Todas pasan.');
console.log('');
process.exit(fallos ? 1 : 0);
