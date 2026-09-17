import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, MapPin, AlertCircle, X, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '../../context/LocalizationContext';

/* ── Números de emergencia ───────────────────────────────────────────────────
   Contrastado el 17 de septiembre de 2026 con la Comisión Europea (Your
   Europe) y con la EENA, la asociación europea del número de emergencia.

   Lo que dice la fuente, y simplifica media tabla: el 112 funciona en los 27
   países de la Unión Europea, sin excepción. Y además en Albania, Georgia,
   Islandia, Liechtenstein, Macedonia del Norte, Moldavia, Montenegro,
   Noruega, Reino Unido, Serbia, Suiza y Turquía.

   Fuera de Europa no vale nada. En Estados Unidos hay que marcar el 911, en
   Australia el 000 y en Japón el 119.

   Criterio para elegir qué número se enseña: el que funcione siempre en ese
   país. Varios tienen números médicos propios —el 15 en Francia, el 144 en
   Suiza, el 113 en Noruega— pero a alguien de paso le sirve mejor el 112,
   que es el general y no obliga a acordarse de cuál es cuál. Donde el número
   nacional es el principal de verdad, como el 999 británico, va ese delante.

   'alt' solo se rellena cuando la fuente lo confirma. En una pantalla de
   emergencia es mejor quedarse corto que prometer un número que no entre. */
const PAISES = [
  /* ── Unión Europea: el 112 funciona en los 27 ── */
  { id: 'DE', es: 'Alemania',          en: 'Germany',         numero: '112' },
  { id: 'AT', es: 'Austria',           en: 'Austria',         numero: '112' },
  { id: 'BE', es: 'Bélgica',           en: 'Belgium',         numero: '112' },
  { id: 'BG', es: 'Bulgaria',          en: 'Bulgaria',        numero: '112' },
  { id: 'CY', es: 'Chipre',            en: 'Cyprus',          numero: '112' },
  { id: 'HR', es: 'Croacia',           en: 'Croatia',         numero: '112' },
  { id: 'DK', es: 'Dinamarca',         en: 'Denmark',         numero: '112' },
  { id: 'SK', es: 'Eslovaquia',        en: 'Slovakia',        numero: '112' },
  { id: 'SI', es: 'Eslovenia',         en: 'Slovenia',        numero: '112' },
  { id: 'ES', es: 'España',            en: 'Spain',           numero: '112' },
  { id: 'EE', es: 'Estonia',           en: 'Estonia',         numero: '112' },
  { id: 'FI', es: 'Finlandia',         en: 'Finland',         numero: '112' },
  { id: 'FR', es: 'Francia',           en: 'France',          numero: '112', alt: '15'  },
  { id: 'GR', es: 'Grecia',            en: 'Greece',          numero: '112' },
  { id: 'HU', es: 'Hungría',           en: 'Hungary',         numero: '112' },
  { id: 'IE', es: 'Irlanda',           en: 'Ireland',         numero: '112', alt: '999' },
  { id: 'IT', es: 'Italia',            en: 'Italy',           numero: '112', alt: '118' },
  { id: 'LV', es: 'Letonia',           en: 'Latvia',          numero: '112' },
  { id: 'LT', es: 'Lituania',          en: 'Lithuania',       numero: '112' },
  { id: 'LU', es: 'Luxemburgo',        en: 'Luxembourg',      numero: '112' },
  { id: 'MT', es: 'Malta',             en: 'Malta',           numero: '112' },
  { id: 'NL', es: 'Países Bajos',      en: 'Netherlands',     numero: '112' },
  { id: 'PL', es: 'Polonia',           en: 'Poland',          numero: '112' },
  { id: 'PT', es: 'Portugal',          en: 'Portugal',        numero: '112' },
  { id: 'CZ', es: 'República Checa',   en: 'Czechia',         numero: '112' },
  { id: 'RO', es: 'Rumanía',           en: 'Romania',         numero: '112' },
  { id: 'SE', es: 'Suecia',            en: 'Sweden',          numero: '112' },

  /* ── Resto de Europa donde el 112 también funciona ── */
  { id: 'AL', es: 'Albania',           en: 'Albania',         numero: '112' },
  { id: 'GE', es: 'Georgia',           en: 'Georgia',         numero: '112' },
  { id: 'IS', es: 'Islandia',          en: 'Iceland',         numero: '112' },
  { id: 'LI', es: 'Liechtenstein',     en: 'Liechtenstein',   numero: '112' },
  { id: 'MK', es: 'Macedonia del Norte', en: 'North Macedonia', numero: '112' },
  { id: 'MD', es: 'Moldavia',          en: 'Moldova',         numero: '112' },
  { id: 'ME', es: 'Montenegro',        en: 'Montenegro',      numero: '112' },
  { id: 'NO', es: 'Noruega',           en: 'Norway',          numero: '112', alt: '113' },
  { id: 'GB', es: 'Reino Unido',       en: 'United Kingdom',  numero: '999', alt: '112' },
  { id: 'RS', es: 'Serbia',            en: 'Serbia',          numero: '112' },
  { id: 'CH', es: 'Suiza',             en: 'Switzerland',     numero: '112', alt: '144' },
  { id: 'TR', es: 'Turquía',           en: 'Türkiye',         numero: '112' },

  /* ── América ── */
  { id: 'AR', es: 'Argentina',         en: 'Argentina',       numero: '911' },
  { id: 'BR', es: 'Brasil',            en: 'Brazil',          numero: '192', alt: '190' },
  { id: 'CA', es: 'Canadá',            en: 'Canada',          numero: '911' },
  { id: 'US', es: 'Estados Unidos',    en: 'United States',   numero: '911' },
  { id: 'MX', es: 'México',            en: 'Mexico',          numero: '911' },

  /* ── Asia y Oceanía ── */
  { id: 'AU', es: 'Australia',         en: 'Australia',       numero: '000' },
  { id: 'JP', es: 'Japón',             en: 'Japan',           numero: '119', alt: '110' },
  { id: 'NZ', es: 'Nueva Zelanda',     en: 'New Zealand',     numero: '111' },
];

const buscarPais = (codigo) => PAISES.find(p => p.id === codigo?.toUpperCase()) || null;

/* Dónde se recuerda el país elegido a mano. Sobrevive a recargar la página:
   quien está de viaje lo elige una vez, no en cada urgencia. */
const CLAVE_PAIS = 'aura_sos_pais';

/* ── Resolución de país 100 % local ──────────────────────────────────────────
   Antes esto consultaba a Nominatim, lo que enviaba la ubicación exacta del
   usuario a un tercero justo en el momento de una emergencia. Ahora se resuelve
   con cajas delimitadoras en el propio dispositivo: no sale ni un byte.
   Solo cubrimos los países con número de emergencia propio; para el resto se
   cae al idioma del navegador y, en último término, al 112.               */
const COUNTRY_BOXES = [
  // [ISO, latMin, latMax, lonMin, lonMax]  — orden: de más específico a más amplio
  ['PT', 36.9, 42.2, -9.6, -6.2],
  ['ES', 35.9, 43.9, -9.4, 4.4],
  ['IE', 51.4, 55.5, -10.6, -5.9],
  ['GB', 49.8, 60.9, -8.2, 1.8],
  // IT y DE van antes que FR: la caja francesa es ancha y solapa el norte de
  // Italia y la frontera alemana. Sin este orden, Milán marcaría el 15 francés
  // en lugar del 118 italiano.
  ['IT', 35.4, 47.1, 6.6, 18.6],
  ['DE', 47.2, 55.1, 5.8, 15.1],
  ['FR', 41.3, 51.2, -5.2, 9.6],
  ['MX', 14.5, 32.8, -118.5, -86.7],
  ['US', 18.9, 22.3, -160.3, -154.8], // Hawái
  ['NZ', -47.4, -34.3, 166.4, 178.6],
  ['AU', -43.7, -10.6, 112.9, 153.7],
];

/* La frontera EE.UU. / Canadá no es un rectángulo: sube al paralelo 49 en el
   oeste y baja bruscamente en los Grandes Lagos. Con cajas simples, Toronto
   caía en Estados Unidos. Se resuelve por tramos de longitud.               */
const usOrCanada = (lat, lon) => {
  if (lon < -141.0) return lat >= 51.2 ? 'US' : null;   // Alaska
  if (lon > -67.0) return 'CA';                          // Provincias marítimas
  let borderLat;
  if (lon <= -84.0) borderLat = 49.0;                    // Oeste y praderas
  else if (lon <= -74.0) borderLat = 43.5;               // Grandes Lagos
  else borderLat = 45.0;                                 // Quebec / Nueva Inglaterra
  return lat >= borderLat ? 'CA' : 'US';
};

const countryFromCoords = (lat, lon) => {
  // Norteamérica continental primero, por el tramo de frontera irregular
  if (lat >= 24.4 && lat <= 83.2 && lon >= -168.2 && lon <= -52.6) {
    const mx = COUNTRY_BOXES.find(([iso]) => iso === 'MX');
    if (lat >= mx[1] && lat <= mx[2] && lon >= mx[3] && lon <= mx[4]) return 'MX';
    const na = usOrCanada(lat, lon);
    if (na) return na;
  }
  for (const [iso, latMin, latMax, lonMin, lonMax] of COUNTRY_BOXES) {
    if (lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax) return iso;
  }
  return null;
};

/* Último recurso: la región declarada en el idioma del navegador (es-ES → ES) */
const countryFromLocale = () => {
  const tag = navigator.language || '';
  const region = tag.split('-')[1];
  return region ? region.toUpperCase() : null;
};

/* ── Build QR text from pet data ── */
const buildQRText = (pet, t, unidadPeso) => {
  const lines = [
    `🚨 ${t('sos.qrHeader')} — AURA Pets`,
    pet?.name ? `${t('sos.qrPet')}: ${pet.name}` : null,
    (pet?.speciesLabel || pet?.species) ? `${t('sos.qrSpecies')}: ${pet.speciesLabel || pet.species}` : null,
    pet?.breed ? `${t('sos.qrBreed')}: ${pet.breed}` : null,
    pet?.microchip ? `${t('sos.qrMicrochip')}: ${pet.microchip}` : null,
    pet?.age ? `${t('sos.qrAge')}: ${pet.age}` : null,
    pet?.weight ? `${t('sos.qrWeight')}: ${pet.weight} ${unidadPeso}` : null,
    '---',
    pet?.emergencyConfig?.medicalAlerts ? `${t('sos.qrAlerts')}: ${pet.emergencyConfig.medicalAlerts}` : null,
    ...(pet?.emergencyConfig?.contacts ?? []).map(c => `${t('sos.qrContact')}: ${c.name} ${c.phone}`),
  ];
  return lines.filter(Boolean).join('\n');
};

const SOSMode = ({ pet, pets = [], onActivePetChange, onExit }) => {
  const { t, locale, units } = useTranslation();
  const es = locale === 'es';
  /* local active pet — starts with prop, can be switched without leaving SOS */
  const [activeSosPetId, setActiveSosPetId] = useState(() => pet?.id ?? null);
  const [showSwitcher, setShowSwitcher]     = useState(false);
  const activePet = pets.find(p => p.id === activeSosPetId) || pet;

  const switchTo = (id) => {
    setActiveSosPetId(id);
    onActivePetChange?.(id);
    setShowSwitcher(false);
  };

  const [location, setLocation]     = useState(null);
  const [country, setCountry]       = useState(null);
  const [geoStatus, setGeoStatus]   = useState('idle'); // idle | loading | ok | error
  const [showQR, setShowQR]         = useState(false);
  /* País elegido a mano. Manda sobre lo detectado: quien lo toca sabe mejor
     que el GPS dónde está, y muchas veces lo toca porque el GPS no contestó. */
  const [paisManual, setPaisManual] = useState(() => {
    try { return localStorage.getItem(CLAVE_PAIS) || ''; } catch { return ''; }
  });

  /* ── Geolocation + reverse geocode ── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocation({ lat, lon });
        setGeoStatus('ok');
        /* Resolución local: las coordenadas nunca abandonan el dispositivo */
        setCountry(countryFromCoords(lat, lon) ?? countryFromLocale());
      },
      () => {
        setGeoStatus('error');
        setCountry(countryFromLocale());
      },
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const pais = buscarPais(paisManual) || buscarPais(country);
  const emergencyNumber = pais?.numero || '112';

  const elegirPais = (id) => {
    setPaisManual(id);
    try { id ? localStorage.setItem(CLAVE_PAIS, id) : localStorage.removeItem(CLAVE_PAIS); } catch { /* modo privado */ }
  };

  const handleCall = () => window.open(`tel:${emergencyNumber}`);

  const handleMap = () => {
    const busqueda = encodeURIComponent(t('sos.mapsQuery'));
    window.open(
      location
        ? `https://www.google.com/maps/search/${busqueda}/@${location.lat},${location.lon},14z`
        : `https://www.google.com/maps/search/${busqueda}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const qrText = buildQRText(activePet, t, units);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--aura-black)', position: 'fixed', inset: 0, zIndex: 1000,
      overflowY: 'auto', color: 'var(--ink)',
    }}>
      {/* ── Pulsing SOS banner ── */}
      <motion.div
        animate={{ backgroundColor: ['#EC5C8D', '#F6839F', '#EC5C8D'] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        style={{
          background: 'var(--pink)', color: 'var(--ink-strong)', padding: '0.9rem',
          textAlign: 'center', letterSpacing: '6px', fontWeight: 900, fontSize: '1rem',
        }}
      >
        🚨 {t('sos.active')}
      </motion.div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2rem 6rem' }}>
        {/* ── Header ── */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.2rem', margin: '0 0 4px', fontFamily: 'var(--font-serif)' }}>
              {t('sos.title')}
            </h1>
            {/* ── Dónde estás ──────────────────────────────────────────────
                El número cambia con el país, así que esto no es un adorno: es
                el dato del que depende la llamada. Antes solo lo ponía el GPS,
                y si no contestaba —dentro de un edificio, sin permiso, en un
                aeropuerto— se quedaba en el 112 sin que hubiera forma de
                corregirlo. El 112 vale en toda Europa; en Estados Unidos o en
                Australia no sirve para nada.

                Ahora se puede elegir a mano, y lo elegido manda sobre lo
                detectado: quien lo toca sabe dónde está mejor que el GPS. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {geoStatus === 'loading'
                ? <span style={{ fontSize: '0.74rem', color: 'var(--gold-ink)', letterSpacing: '1px', fontWeight: 600 }}>{t('sos.geoLoading')}</span>
                : paisManual
                  ? <MapPin size={14} color="var(--cyan-ink)" />
                  : geoStatus === 'ok'
                    ? <Wifi size={14} color="var(--cyan-ink)" />
                    : <WifiOff size={14} color="var(--gold-ink)" />}

              <label style={{ fontSize: '0.74rem', letterSpacing: '0.5px', fontWeight: 600, color: 'var(--ink-body)' }}>
                {t('sos.whereAreYou')}
              </label>

              <select
                className="aura-input aura-select"
                value={pais?.id || ''}
                onChange={(e) => elegirPais(e.target.value)}
                style={{ width: 'auto', minWidth: 150, padding: '0.35rem 0.6rem', fontSize: '0.8rem', fontWeight: 600 }}
              >
                <option value="">{t('sos.pickCountry')}</option>
                {[...PAISES]
                  .sort((a, b) => (es ? a.es : a.en).localeCompare(es ? b.es : b.en, locale))
                  .map(p => (
                    <option key={p.id} value={p.id}>{es ? p.es : p.en}</option>
                  ))}
              </select>

              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--pink-ink)' }}>
                {t('sos.emergencyWord')}: {emergencyNumber}
              </span>
            </div>

            {/* Por qué sale ese país, y cómo cambiarlo */}
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--ink-muted)' }}>
              {!pais
                ? t('sos.noCountry')
                : paisManual
                  ? t('sos.countryManual')
                  : geoStatus === 'ok'
                    ? t('sos.countryDetected')
                    : t('sos.countryGuessed')}
              {pais?.alt ? ' ' + t('sos.alsoWorks', { numero: pais.alt }) : ''}
            </p>
          </div>
          <button onClick={onExit} className="btn-aura btn-ghost">
            {t('sos.exit')}
          </button>
        </header>

        {/* ── Member switcher bar (shown when >1 pet) ── */}
        {pets.length > 1 && (
          <div style={{ marginBottom: '1.8rem' }}>
            <AnimatePresence>
              {showSwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap',
                    background: '#FFFFFF', border: '1px solid rgba(236, 92, 141, 0.3)',
                    borderRadius: 4, padding: '1rem 1.4rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.7rem', letterSpacing: '1.5px', color: 'var(--pink-ink)', fontWeight: 700, flexShrink: 0 }}>
                    {t('sos.selectMember')}
                  </span>
                  {pets.map(p => {
                    const sel = p.id === activeSosPetId;
                    return (
                      <button key={p.id} onClick={() => switchTo(p.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: 0 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                          border: sel ? '2px solid var(--aura-neon-pink)' : '2px solid #FAF7FE',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.3rem', background: '#FFFFFF',
                          boxShadow: sel ? '0 0 14px rgba(236, 92, 141, 0.6)' : 'none',
                        }}>
                          {p.customImage
                            ? <img src={p.customImage} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : p.avatar || '🐾'}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: sel ? 'var(--pink-ink)' : 'var(--ink-body)',
                          letterSpacing: '0.5px', fontWeight: sel ? 700 : 500 }}>
                          {p.name}
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={() => setShowSwitcher(v => !v)} className="btn-aura btn-ghost"
              style={{ fontSize: '0.7rem', '--btn-accent': 'var(--pink-ink)',
                display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚡ {t('sos.switchMember')} ({pets.length})
            </button>
          </div>
        )}

        <div className="sos-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* ── La ficha del animal ──────────────────────────────────────────
              Una rejilla estira las dos columnas a la misma altura. Como aquí
              dentro solo hay una foto y un nombre, y al lado va toda la lista
              de qué hacer, la ficha se convertía en un caserón rosa con el
              contenido pegado arriba y medio metro de vacío debajo.

              Con alignSelf la tarjeta deja de estirarse: se queda del alto de
              lo que lleva dentro y se centra frente a la columna larga. Y con
              un ancho máximo tampoco se ensancha de más en pantallas grandes,
              que era la otra mitad del problema. */}
          <div className="aura-card" style={{
            background: 'rgba(255,0,80,0.07)', borderColor: 'var(--aura-neon-pink)',
            padding: '2.2rem', textAlign: 'center',
            alignSelf: 'center', maxWidth: 360, width: '100%', margin: '0 auto',
          }}>
            <div style={{
              width: 130, height: 130, borderRadius: '50%', margin: '0 auto 1.5rem',
              background: '#FFFFFF', border: '2px solid var(--aura-neon-pink)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {activePet?.customImage
                ? <img src={activePet.customImage} alt={activePet?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '3.5rem' }}>{activePet?.avatar || '🐾'}</span>}
            </div>
            <h2 style={{ fontSize: '2rem', margin: '0 0 4px', color: 'var(--ink)' }}>{activePet?.name || t('common.noName')}</h2>
            <p style={{ margin: '0 0 0.4rem', opacity: 0.7 }}>{activePet?.speciesLabel || activePet?.breed || '—'}</p>
            {activePet?.microchip && (
              <p style={{ margin: 0, fontSize: '0.78rem', letterSpacing: '1px', color: 'var(--gold-ink)', fontWeight: 600 }}>
                {t('sos.chip')}: {activePet.microchip}
              </p>
            )}
          </div>

          {/* ── Qué hacer, y en qué orden ────────────────────────────────────
              El orden lo es todo en esta pantalla. Antes abría el número
              general de emergencias, con el botón lleno y arriba del todo, y
              el veterinario quedaba debajo como una opción más.

              Está al revés. Un 112 no manda un veterinario: lo que salva a un
              animal es llegar a una clínica de guardia, y eso es lo primero
              que hay que hacer. El número general sirve para lo que sí es —un
              atropello, un incendio, una mordedura a una persona— y por eso
              sigue estando, pero detrás y con menos peso.

              Quien abre esta pantalla está asustado y no va a leer: va a
              pulsar lo primero grande que vea. Así que lo primero grande tiene
              que ser lo correcto. */}
          <div style={{ display: 'grid', gap: '1.2rem', alignContent: 'start' }}>

            {/* ── 1. El veterinario de guardia ── */}
            <div className="aura-card" style={{
              padding: '1.8rem',
              border: '2px solid var(--pink)',
              background: 'rgba(236, 92, 141, 0.06)',
            }}>
              <p style={{
                margin: '0 0 0.5rem', fontSize: '0.64rem', fontWeight: 800,
                letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--pink-ink)',
              }}>
                {t('sos.firstStep')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <MapPin size={32} color="var(--pink)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 3px', fontSize: '1.15rem', lineHeight: 1.25 }}>
                    {t('sos.hospital24')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: 'var(--ink-body)' }}>
                    {t(geoStatus === 'ok' ? 'sos.searchNear' : 'sos.searchMaps')}
                  </p>
                </div>
              </div>
              <button
                className="btn-aura"
                style={{ width: '100%', marginTop: '1.2rem', padding: '1.1rem', fontSize: '0.82rem' }}
                onClick={handleMap}
              >
                {t('sos.btnFindVet')}
              </button>
              <p style={{ margin: '0.7rem 0 0', fontSize: '0.72rem', lineHeight: 1.5, color: 'var(--ink-muted)' }}>
                {t('sos.vetHint')}
              </p>
            </div>

            {/* Emergency contacts */}
            {activePet?.emergencyConfig?.contacts?.map((c, i) => c.phone ? (
              <div key={i} className="aura-card" style={{ padding: '1.4rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <Phone size={22} color="var(--aura-gold)" />
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px', fontSize: '0.9rem' }}>{c.name}</h3>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>{c.phone}</p>
                </div>
                <button
                  className="btn-aura btn-ghost"
                  style={{ '--btn-accent': 'var(--gold-ink)', fontSize: '0.7rem' }}
                  onClick={() => window.open(`tel:${c.phone}`)}
                >
                  {t('sos.btnCall')}
                </button>
              </div>
            ) : null)}

            {/* ── 2. El número general, que es otra cosa ── */}
            <div className="aura-card" style={{ padding: '1.6rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <Phone size={24} color="var(--ink-muted)" />
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 2px', fontSize: '0.95rem' }}>{t('sos.generalEmergency')}</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-body)' }}>
                  {t('sos.callNumber', { numero: emergencyNumber })}
                  {pais ? ` · ${es ? pais.es : pais.en}` : ''}
                </p>
                {/* Un 112 no manda un veterinario, y quien llama en mitad de
                    un susto no tiene por qué saberlo. */}
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', lineHeight: 1.45, color: 'var(--ink-muted)' }}>
                  {t('sos.generalEmergencyHint')}
                </p>
              </div>
              <button
                className="btn-aura btn-ghost"
                style={{ whiteSpace: 'nowrap', '--btn-accent': 'var(--pink-ink)' }}
                onClick={handleCall}
              >
                {t('sos.btnCall')} {emergencyNumber}
              </button>
            </div>

            {/* QR toggle */}
            <button
              className="btn-aura btn-ghost"
              style={{ '--btn-accent': 'var(--cyan-ink)', padding: '1rem' }}
              onClick={() => setShowQR(v => !v)}
            >
              {t(showQR ? 'sos.qrHide' : 'sos.qrShow')}
            </button>
          </div>
        </div>

        {/* ── QR Code panel ── */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="aura-card"
              style={{ marginTop: '2rem', padding: '2.5rem', display: 'flex', gap: '2.5rem', alignItems: 'center', flexWrap: 'wrap' }}
            >
              <div style={{ background: 'white', padding: '1rem', borderRadius: 4 }}>
                <QRCodeSVG
                  value={qrText}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0A0A0F"
                  level="M"
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.72rem', letterSpacing: '2px', color: 'var(--cyan-ink)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 0.8rem' }}>
                  {t('sos.qrTitle')}
                </p>
                <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--ink-body)', lineHeight: 1.7 }}>
                  {t('sos.qrBody', { nombre: activePet?.name || t('sos.qrThePet') })}
                </p>
                <pre style={{
                  margin: 0, fontSize: '0.72rem', color: 'var(--ink-body)',
                  background: '#FFFFFF', border: '1px solid var(--aura-border)',
                  borderRadius: 4, padding: '0.8rem', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                }}>
                  {qrText}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Medical alerts ── */}
        {activePet?.emergencyConfig?.medicalAlerts && (
          <div className="aura-card" style={{ marginTop: '2rem', background: 'white', color: 'black', padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--pink-ink)', marginBottom: '1rem', fontSize: '1.1rem' }}>
              <AlertCircle size={24} /> {t('sos.alerts')}
            </h3>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, lineHeight: 1.7 }}>
              {activePet.emergencyConfig.medicalAlerts}
            </p>
          </div>
        )}

        <div style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.68, fontSize: '0.7rem', letterSpacing: '2px' }}>
          AURA Pets · {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB')}
        </div>
      </div>
    </div>
  );
};

export default SOSMode;
