/* ═══════════════════════════════════════════════════════════════════════════
   La próxima dosis — `npm run probar`

   El formulario de vacunas propone la fecha de la próxima dosis a partir del
   nombre de la vacuna y de la fecha en que se puso. Suena sencillo y no lo es:
   los dos campos se escriben en cualquier orden, se corrigen a mitad, y hay
   una regla que manda sobre todo lo demás —si el usuario escribe la fecha a
   mano, no se le toca—.

   Esta comprobación existe porque ya falló una vez. La marca interna de «esta
   fecha la he puesto yo» se apagaba cada vez que la sugerencia no se podía
   calcular en ese instante, cosa que pasa en cada tecla mientras se escribe el
   nombre. Desde ahí la aplicación creía que la fecha era del usuario y dejaba
   de actualizarla: quien se equivocaba de año al teclear la fecha y luego lo
   corregía se quedaba con la próxima dosis mal, un año entero desplazada, sin
   ningún aviso.

   Lo de abajo repite el manejador del componente. Si se cambia allí, hay que
   cambiarlo aquí: es el precio de probar la lógica sin montar media librería
   de pruebas para un proyecto de este tamaño.
   ═══════════════════════════════════════════════════════════════════════════ */

import { sugerirProximaDosis } from '../src/utils/intelligence.js';

/* Copia fiel de `proponerProxima` en MedicalHistory.jsx */
const proponer = (especie) => (prev, campo, valor) => {
  const siguiente = { ...prev, [campo]: valor };
  if (prev.nextDose && !prev.nextDoseSugerida) return siguiente;
  const sug = sugerirProximaDosis(especie, siguiente.name, siguiente.date);
  return {
    ...siguiente,
    nextDose: sug?.fecha || prev.nextDose,
    nextDoseSugerida: sug?.fecha ? true : prev.nextDoseSugerida,
  };
};

/* El campo de próxima dosis tiene su propio manejador: al tocarlo, la fecha
   pasa a ser del usuario y deja de actualizarse sola. */
const aMano = (prev, valor) => ({ ...prev, nextDose: valor, nextDoseSugerida: false });

const VACIO = { name: '', date: '', nextDose: '', nextDoseSugerida: false };

let fallos = 0;
const caso = (titulo, especie, pasos, esperado) => {
  const paso = proponer(especie);
  let f = { ...VACIO };
  for (const [campo, valor] of pasos) {
    f = campo === 'nextDose' ? aMano(f, valor) : paso(f, campo, valor);
  }
  const bien = f.nextDose === esperado;
  if (!bien) fallos += 1;
  console.log(`  ${bien ? 'OK  ' : 'MAL '}  ${titulo}`);
  if (!bien) console.log(`          esperaba ${esperado}, salió ${f.nextDose || '(vacía)'}`);
};

console.log('');
console.log('  Sugerencia de próxima dosis');
console.log('  ───────────────────────────');

caso('gato · trivalente, orden normal', 'cat',
  [['date', '2025-12-12'], ['name', 'trivalente']],
  '2028-12-11');

caso('gato · el nombre primero, la fecha después', 'cat',
  [['name', 'trivalente'], ['date', '2025-12-12']],
  '2028-12-11');

caso('gato · nombre tecleado letra a letra', 'cat',
  [['name', 't'], ['name', 'tri'], ['name', 'trivalente'], ['date', '2025-12-12']],
  '2028-12-11');

/* El fallo que dio origen a esta prueba. */
caso('gato · se equivoca de año y lo corrige', 'cat',
  [['date', '2026-12-12'], ['name', 'trivalente'],
   ['name', 'trivalent'], ['name', 'trivalente'], ['date', '2025-12-12']],
  '2028-12-11');

caso('gato · cambia de vacuna: la rabia es anual', 'cat',
  [['date', '2025-12-12'], ['name', 'trivalente'], ['name', 'rabia']],
  '2026-12-12');

caso('perro · polivalente, tres años', 'dog',
  [['date', '2025-12-12'], ['name', 'hexavalente']],
  '2028-12-11');

caso('conejo · mixomatosis, un año', 'rabbit',
  [['date', '2025-12-12'], ['name', 'mixomatosis']],
  '2026-12-12');

/* La regla que manda sobre todas las demás. */
caso('la fecha escrita a mano no se toca', 'cat',
  [['date', '2025-12-12'], ['name', 'trivalente'],
   ['nextDose', '2027-01-01'], ['date', '2025-06-01']],
  '2027-01-01');

caso('vacuna que no está en el protocolo: no se inventa nada', 'cat',
  [['date', '2025-12-12'], ['name', 'algo que no existe']],
  '');

/* ── Corregir un registro ya guardado ────────────────────────────────────────
   Al guardar no se conserva la marca de «esta fecha la propuso la app», así
   que al abrir el registro hay que deducirla del propio dato: si la próxima
   dosis coincide con la que el protocolo habría propuesto, era nuestra.

   Decide qué pasa al corregir la fecha de administración, y las dos ramas
   tienen que funcionar: arrastrar cuando la fecha era nuestra, y no tocar
   nada cuando la puso el veterinario. */
const alEditar = (especie, registro) => {
  const sug = sugerirProximaDosis(especie, registro.name, registro.date);
  return { ...registro, nextDoseSugerida: !!sug && sug.fecha === registro.nextDose };
};

const casoEdicion = (titulo, especie, registro, cambios, esperado) => {
  const paso = proponer(especie);
  let f = alEditar(especie, registro);
  for (const [campo, valor] of cambios) {
    f = campo === 'nextDose' ? aMano(f, valor) : paso(f, campo, valor);
  }
  const bien = f.nextDose === esperado;
  if (!bien) fallos += 1;
  console.log(`  ${bien ? 'OK  ' : 'MAL '}  ${titulo}`);
  if (!bien) console.log(`          esperaba ${esperado}, salió ${f.nextDose || '(vacía)'}`);
};

console.log('');
console.log('  Al corregir un registro guardado');
console.log('  ────────────────────────────────');

/* El caso que reportó Rocío: se equivocó al teclear el día de la vacuna. */
casoEdicion('corregir la fecha arrastra la próxima dosis', 'dog',
  { name: 'desparasitación interna', date: '2026-07-15', nextDose: '2026-10-13' },
  [['date', '2026-07-05']],
  '2026-10-03');

casoEdicion('corregir el nombre también la recalcula', 'cat',
  { name: 'trivalente', date: '2025-12-12', nextDose: '2028-12-11' },
  [['name', 'rabia']],
  '2026-12-12');

/* Y la otra rama: una fecha que no salió del protocolo es del veterinario. */
casoEdicion('una fecha ajena al protocolo NO se toca', 'cat',
  { name: 'trivalente', date: '2025-12-12', nextDose: '2027-03-01' },
  [['date', '2025-11-01']],
  '2027-03-01');

console.log('');
console.log(fallos ? `  ${fallos} comprobaciones fallan.` : '  Todas pasan.');
console.log('');

process.exit(fallos ? 1 : 0);
