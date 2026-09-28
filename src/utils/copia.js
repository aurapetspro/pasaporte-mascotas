/**
 * Leer una copia de seguridad.
 *
 * Esto es lo que decide qué entra en el expediente de alguien, así que vive
 * aparte de la pantalla: metido dentro del componente no había forma de
 * probarlo, y es justo la parte donde un fallo no se ve hasta que alguien lee
 * la ficha equivocada en un veterinario.
 *
 * Dos reglas gobiernan el archivo:
 *
 *   No se da por buena una copia solo porque sea un JSON válido. Cualquier
 *   archivo parsea; lo que importa es que lleve nuestra marca de formato y una
 *   lista de mascotas. Sin eso se rechaza antes de tocar nada.
 *
 *   El identificador que trae el archivo se tira. Puede chocar con uno que ya
 *   exista, y entonces el historial de una mascota se pegaría a otra.
 */

/** Marca que lleva todo archivo exportado por la aplicación. */
export const MARCA_COPIA = 'AURA Pets Data Portability';

const SECCIONES = ['visits', 'vaccines', 'medications', 'analyses'];

/**
 * Comprueba el texto de un archivo y cuenta lo que trae.
 *
 * No escribe nada: solo mira. Devuelve `{ ok: false, error }` con un código de
 * error que la pantalla traduce, o `{ ok: true, ... }` con el resumen que se le
 * enseña al usuario antes de pedirle que confirme.
 */
export const leerCopia = (texto) => {
  let datos;
  try { datos = JSON.parse(texto); }
  catch { return { ok: false, error: 'errNotJson' }; }

  const esNuestra = String(datos?.format || '').startsWith(MARCA_COPIA);
  if (!esNuestra || !Array.isArray(datos.pets)) return { ok: false, error: 'errNotOurs' };
  if (!datos.pets.length) return { ok: false, error: 'errEmpty' };

  const registros = datos.pets.reduce((total, mascota) => {
    const h = mascota?.medicalHistory || {};
    return total + SECCIONES.reduce((n, k) => n + (Array.isArray(h[k]) ? h[k].length : 0), 0);
  }, 0);

  return {
    ok: true,
    pets: datos.pets,
    mascotas: datos.pets.length,
    registros,
    fecha: datos.exportDate || null,
  };
};

/**
 * Deja una mascota del archivo lista para guardarla.
 *
 * Separa la ficha de su historial —la aplicación los guarda en sitios
 * distintos— y le pone identificador y dueño nuevos. Los que traía el archivo
 * se descartan a propósito: pertenecen a la cuenta y al dispositivo de donde
 * salió la copia, y aquí no significan nada.
 */
export const prepararMascota = (mascota, userId, id) => {
  const { medicalHistory, id: _delArchivo, userId: _duenyoAnterior, ...ficha } = mascota || {};
  return {
    ficha: { ...ficha, id, userId },
    historial: medicalHistory || null,
  };
};
