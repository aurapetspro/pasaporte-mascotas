/**
 * Lo que hace falta para que algún día haya servidor.
 *
 * Todavía no hay servidor y este archivo no habla con ninguno. Lo que hace es
 * dejar los datos en condiciones de poder sincronizarse, porque eso —a
 * diferencia del propio servidor— no se puede añadir después.
 *
 * El problema que resuelve
 * ------------------------
 * Alguien con la aplicación en el móvil y en la tablet apunta una vacuna en el
 * móvil. Días más tarde abre la tablet, que sigue con los datos de antes.
 * Cuando exista el servidor, tendrá que decidir cuál de las dos versiones vale.
 *
 * Sin una marca de cuándo se escribió cada cosa, no hay forma de decidirlo: o
 * machaca lo nuevo con lo viejo —y se pierde la vacuna—, o lo duplica todo. Y
 * la marca no se puede poner a posteriori: un dato guardado hoy sin fecha es
 * un dato de edad desconocida para siempre.
 *
 * Lo mismo con lo borrado, que es menos evidente y más molesto. Si alguien
 * borra una mascota en el móvil y la tablet todavía la tiene, el servidor se
 * la devolverá: desde su punto de vista, la tablet tiene un dato que al móvil
 * le falta. Un borrado que no deja huella es indistinguible de un dato que
 * nunca existió. Por eso se apunta.
 *
 * Nada de esto sale del dispositivo hoy. Se guarda cifrado igual que todo lo
 * demás, y el día que haya servidor ya estará ahí, con fechas de verdad.
 */

/* Cuánto se conserva el rastro de lo borrado. Pasado ese plazo se descarta:
   un dispositivo que lleva más de un año sin abrirse no se va a reconciliar
   bien de todos modos, y guardarlo para siempre engorda el expediente. */
const MESES_RASTRO = 12;

const CLAVE_DISPOSITIVO = 'aura_dispositivo';

/**
 * Identificador de este navegador.
 *
 * No identifica a la persona ni viaja a ninguna parte: sirve para que, cuando
 * haya servidor, se pueda distinguir «esto lo escribí yo» de «esto llegó de
 * otro sitio». Vive fuera de la bóveda a propósito, porque pertenece al
 * dispositivo y no a la cuenta: en un ordenador compartido, dos cuentas
 * distintas son el mismo dispositivo.
 */
export const idDispositivo = () => {
  try {
    let id = localStorage.getItem(CLAVE_DISPOSITIVO);
    if (!id) {
      id = (crypto.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(CLAVE_DISPOSITIVO, id);
    }
    return id;
  } catch {
    /* Modo privado o almacenamiento bloqueado: se devuelve algo válido para
       esta sesión en vez de reventar. Sin persistencia el dispositivo cambiará
       de nombre cada vez, que es peor pero no rompe nada. */
    return 'sin-guardar';
  }
};

/**
 * Pone la marca de «esto se escribió aquí y ahora».
 *
 * Los campos van con guion bajo delante para que se distingan de un vistazo de
 * los datos del animal: el nombre y el microchip los escribe una persona,
 * esto lo pone la aplicación.
 */
export const sellar = (objeto) => ({
  ...objeto,
  _actualizado: new Date().toISOString(),
  _dispositivo: idDispositivo(),
});

/** Sella cada elemento de una lista. */
export const sellarLista = (lista) => (Array.isArray(lista) ? lista.map(sellar) : lista);

/**
 * Cuál de dos versiones del mismo dato es la buena.
 *
 * Gana la más reciente. Es la regla más simple que existe y tiene un defecto
 * conocido —si dos dispositivos tocan lo mismo a la vez, uno de los dos
 * cambios se pierde— pero para un expediente que lleva una sola persona es
 * más que suficiente, y cualquier cosa más lista exige un servidor que decida.
 *
 * Un dato sin fecha se considera más viejo que cualquiera que la tenga: es el
 * que venía de antes de que existiera esta marca.
 */
export const masReciente = (a, b) => {
  const fa = a?._actualizado || '';
  const fb = b?._actualizado || '';
  return fb > fa ? b : a;
};

/* ── El rastro de lo borrado ──────────────────────────────────────────────── */

/**
 * Apunta que algo se borró, para que un servidor no lo resucite.
 *
 * Recibe la lista de borrados que ya hubiera y devuelve la nueva: quien llama
 * se encarga de guardarla, porque este archivo no sabe —ni debe saber— cómo se
 * guardan las cosas.
 */
export const anotarBorrado = (rastroActual, tipo, id) => {
  const rastro = Array.isArray(rastroActual) ? rastroActual : [];
  /* Si ya estaba anotado se actualiza la fecha en vez de duplicar la entrada. */
  const limpio = rastro.filter((b) => !(b.tipo === tipo && String(b.id) === String(id)));
  return [
    ...limpio,
    { tipo, id, cuando: new Date().toISOString(), dispositivo: idDispositivo() },
  ];
};

/** Quita del rastro lo que ya es demasiado viejo para servir de algo. */
export const podarBorrados = (rastroActual) => {
  if (!Array.isArray(rastroActual)) return [];
  const limite = new Date();
  limite.setMonth(limite.getMonth() - MESES_RASTRO);
  const corte = limite.toISOString();
  return rastroActual.filter((b) => (b?.cuando || '') > corte);
};

/** ¿Está esto borrado? Lo usará el servidor el día que exista. */
export const estaBorrado = (rastro, tipo, id) =>
  Array.isArray(rastro) &&
  rastro.some((b) => b.tipo === tipo && String(b.id) === String(id));

/* ── Sellar solo lo que ha cambiado ───────────────────────────────────────── */

/**
 * El objeto sin las marcas, para poder comparar contenidos.
 */
const sinMarcas = (o) => {
  const { _actualizado, _dispositivo, ...resto } = o || {};
  return resto;
};

/**
 * Sella un registro únicamente si su contenido ha cambiado.
 *
 * Esto importa más de lo que parece. El historial clínico se guarda entero cada
 * vez que se toca una sola vacuna. Si en cada guardado se sellaran los cuarenta
 * registros, todos acabarían con la misma fecha —la del último guardado— y la
 * marca dejaría de decir nada: se perdería justo la información que se quería
 * conservar.
 *
 * Comparando con lo que ya había, cada registro conserva la fecha del día en
 * que se escribió de verdad.
 *
 * Un registro que ya existía y no ha cambiado se devuelve tal cual, sin marca,
 * si nunca la tuvo: es de antes de que esto existiera, y `masReciente` ya lo
 * trata como el más antiguo.
 */
export const sellarSiCambio = (nuevo, anterior) => {
  if (!anterior) return sellar(nuevo);
  /* La comparación por texto es sensible al orden de las claves, pero estos
     objetos los construye siempre el mismo código. Y si alguna vez se
     equivocara, el error es inofensivo: sella algo que no había cambiado. */
  if (JSON.stringify(sinMarcas(nuevo)) !== JSON.stringify(sinMarcas(anterior))) return sellar(nuevo);
  if (!anterior._actualizado) return nuevo;
  return { ...nuevo, _actualizado: anterior._actualizado, _dispositivo: anterior._dispositivo };
};

/**
 * Lo mismo para una lista, emparejando cada elemento con el que tenía el mismo
 * identificador. Lo que no aparecía antes es nuevo y se sella con la fecha de
 * hoy, que es exactamente lo que toca.
 */
export const sellarCambios = (nueva, anterior) => {
  if (!Array.isArray(nueva)) return nueva;
  const antes = new Map(
    (Array.isArray(anterior) ? anterior : []).map((x) => [String(x?.id), x]),
  );
  return nueva.map((x) => sellarSiCambio(x, antes.get(String(x?.id))));
};

/**
 * Y para el historial clínico, que no es una lista sino cuatro.
 */
export const sellarHistorial = (nuevo, anterior) => {
  if (!nuevo || typeof nuevo !== 'object') return nuevo;
  const salida = { ...nuevo };
  for (const seccion of ['visits', 'vaccines', 'medications', 'analyses']) {
    if (Array.isArray(nuevo[seccion])) {
      salida[seccion] = sellarCambios(nuevo[seccion], anterior?.[seccion]);
    }
  }
  return salida;
};
