/**
 * Fuentes oficiales y nivel de riesgo del trayecto.
 *
 * AURA no es la autoridad: es quien lleva al usuario hasta ella. Cada bloque de
 * requisitos se acompaña del enlace al organismo que lo dicta y de la fecha en
 * que se contrastó, para que cualquiera pueda comprobarlo por su cuenta.
 *
 * Eso cambia el papel de la aplicación. No afirma "necesitas esto": dice "esto
 * es lo que suele exigirse, y aquí está la fuente". La diferencia importa
 * cuando el dato caduca, que es lo que acaba pasando siempre.
 *
 * REGLA DE MANTENIMIENTO: si se toca un requisito, se actualiza FECHA_REVISION.
 * Una fecha vieja es una señal honesta; una fecha falsa es peor que ninguna.
 */

/** Última vez que las listas se contrastaron contra las webs oficiales. */
export const FECHA_REVISION = '2026-09-17';

/** Organismo competente por país. */
const ORGANISMO = {
  ES: 'Comisión Europea',
  UK: 'GOV.UK / APHA',
  US: 'CDC · USDA APHIS',
  CA: 'CFIA',
  AU: 'DAFF',
};

/* Perros, gatos y hurones: el régimen de animales de compañía propiamente dicho. */
const COMPANIA = {
  ES: 'https://food.ec.europa.eu/animals/live-animal-movements/dogs-cats-and-ferrets/movements-within-eu_en',
  UK: 'https://www.gov.uk/bring-pet-to-great-britain',
  US: 'https://www.cdc.gov/importation/dogs/index.html',
  CA: 'https://inspection.canada.ca/en/importing-food-plants-animals/pets',
  AU: 'https://www.agriculture.gov.au/biosecurity-trade/cats-dogs/how-to-import/step-by-step-guides/category-3-step-by-step-guide-for-dogs',
};

/* Équidos: normativa de sanidad animal, no la de mascotas. */
const EQUINOS = {
  ES: 'https://food.ec.europa.eu/animals/live-animal-movements/equine-animals_en',
  UK: 'https://www.gov.uk/guidance/export-horses-and-ponies-special-rules',
  US: 'https://www.aphis.usda.gov/live-animal-import/equine',
  CA: 'https://inspection.canada.ca/en/animal-health/terrestrial-animals/imports',
  AU: 'https://bicon.agriculture.gov.au/',
};

/* Conejos, reptiles y todo lo demás: norma nacional, muy variable. */
const OTROS = {
  ES: 'https://www.mapa.gob.es/es/ganaderia/temas/comercio-exterior-ganadero/',
  UK: 'https://www.gov.uk/government/publications/live-animals-not-pet-dogs-cats-ferrets-application-for-import-licence',
  US: 'https://www.fws.gov/program/office-of-law-enforcement/information-importers-exporters',
  CA: 'https://inspection.canada.ca/en/importing-food-plants-animals/airs',
  AU: 'https://www.agriculture.gov.au/biosecurity-trade/travelling/bringing-mailing-goods/unique-exotic-pets',
};

/* Los reptiles no siguen el mismo camino que los conejos: en Reino Unido
   entran por la nota de importación de mascotas, sin licencia, y en Canadá
   los requisitos por especie viven en AIRS. */
const REPTILES = {
  ES: 'https://www.mapa.gob.es/es/ganaderia/temas/comercio-exterior-ganadero/',
  UK: 'https://www.gov.uk/government/publications/invertebrates-amphibians-or-reptiles-live-or-germinal-products-import-information-notes/import-of-pet-invertebrates-other-than-bees-molluscs-and-crustaceans-amphibians-except-salamanders-and-reptiles-import-information-note-iin',
  US: 'https://www.fws.gov/program/office-of-law-enforcement/information-importers-exporters',
  CA: 'https://inspection.canada.ca/en/importing-food-plants-animals/airs',
  AU: 'https://www.agriculture.gov.au/biosecurity-trade/travelling/bringing-mailing-goods/unique-exotic-pets',
};

const POR_ESPECIE = {
  dog: COMPANIA, cat: COMPANIA, ferret: COMPANIA,
  horse: EQUINOS,
  rabbit: OTROS, exotic: REPTILES, other: OTROS,
};

/**
 * Fuente oficial para una especie y un destino.
 * @returns {{ organismo: string, url: string }}
 */
export const fuenteOficial = (species, countryId) => {
  const mapa = POR_ESPECIE[species] || OTROS;
  return {
    organismo: ORGANISMO[countryId] || '',
    url: mapa[countryId] || mapa.ES,
  };
};

/**
 * Nivel de riesgo del trayecto, que decide cuánto avisa la interfaz.
 *
 *   verde  El régimen es único, estable y está bien cubierto. Aviso mínimo.
 *   ambar  Requisitos que cambian por país. Conviene confirmar.
 *   rojo   Cuarentena, permiso previo, CITES o prohibición. Puede tardar meses
 *          y no se arregla con prisa: hay que confirmarlo antes de pagar nada.
 */
export const nivelRiesgo = (species, countryId, origen = 'ES') => {
  if (origen === countryId) return 'verde';

  const esCompania = species === 'dog' || species === 'cat' || species === 'ferret';

  /* Hay trayectos que no son difíciles: son imposibles, y merecen decirlo con
     otra palabra. Australia solo admite conejos procedentes de Nueva Zelanda,
     que no es ninguno de los orígenes que maneja la aplicación. Un aviso de
     «plazos largos» invitaría a empezar a reunir papeles. */
  if (countryId === 'AU' && species === 'rabbit') return 'prohibido';

  /* Australia impone cuarentena y permiso previo a todo lo demás que esté vivo. */
  if (countryId === 'AU') return 'rojo';

  /* Fuera del régimen de mascotas siempre hay trámite previo. */
  if (!esCompania) return 'rojo';

  /* Perro o gato cruzando a un tercer país: requisitos propios del destino. */
  return 'ambar';
};

export const TEXTO_RIESGO = {
  verde: {
    es: 'Movimiento cubierto por un régimen único y estable. Aun así, confirma las fechas con tu veterinario.',
    en: 'Movement covered by a single, stable regime. Even so, confirm the dates with your vet.',
  },
  ambar: {
    es: 'Los requisitos los fija el país de destino y cambian sin previo aviso. Confírmalos en la fuente oficial antes de comprar el billete.',
    en: 'Requirements are set by the destination country and change without notice. Confirm them at the official source before buying the ticket.',
  },
  rojo: {
    es: 'Este trayecto exige permisos previos y puede incluir cuarentena. Los plazos se miden en meses, no en días. No compres billetes ni reserves transporte sin confirmarlo antes con la autoridad competente.',
    en: 'This route requires permits in advance and may involve quarantine. Lead times are measured in months, not days. Do not buy tickets or book transport without confirming with the competent authority first.',
  },
  prohibido: {
    es: 'Este trayecto no está permitido. No es cuestión de plazos ni de papeles: el país de destino no admite la entrada de esta especie desde donde sales. Antes de plantearte nada, confírmalo en la fuente oficial.',
    en: 'This route is not permitted. It is not a matter of lead times or paperwork: the destination does not admit this species from where you are leaving. Before considering anything, confirm it at the official source.',
  },
};
