# FICHA TÉCNICA DE CERTIFICACIÓN
# OFFICIAL CERTIFICATION TECHNICAL SHEET

---

<div align="center">

**AURA Pets — Global Health Passport**

| | |
|---|---|
| **Versión / Version** | 1.5.0 |
| **Fecha de emisión / Issue date** | 2026-09-11 |
| **Empresa / Company** | Rodigital Advance |
| **Clasificación / Classification** | Documento Oficial de Certificación / Official Certification Document |
| **Producción / Production** | https://rociogf-aura-pets-final.static.hf.space |
| **Repositorio / Repository** | https://github.com/Rodigitaladvance/mascotas |

</div>

---

## 1. Identificación / Identification

**ES:** AURA Pets — Global Health Passport es una aplicación web de expediente médico premium para mascotas, diseñada para propietarios que requieren documentación veterinaria de nivel profesional con soporte para viajes internacionales, emergencias y cumplimiento normativo.

**EN:** AURA Pets — Global Health Passport is a premium pet medical records web application, designed for owners who require professional-grade veterinary documentation with support for international travel, emergencies, and regulatory compliance.

---

## 2. Arquitectura / Architecture

**ES:** Aplicación web estática de página única (_Static Single-Page Application / SPA_) desarrollada en **React 19** y compilada con **Vite 8**. No existe backend propio ni base de datos remota. Toda la lógica de negocio, el cifrado y el almacenamiento de datos se ejecutan exclusivamente en el dispositivo del usuario (_client-side only_). El enrutamiento opera mediante _HashRouter_ para compatibilidad total con alojamiento estático.

**EN:** Static Single-Page Application (SPA) built with **React 19** and compiled with **Vite 8**. There is no proprietary backend or remote database. All business logic, encryption, and data storage run exclusively on the user's device (client-side only). Routing uses _HashRouter_ for full compatibility with static hosting.

```
┌──────────────────────────────────────────────────────────────┐
│                    NAVEGADOR / BROWSER                        │
│                                                              │
│   contraseña ──PBKDF2-SHA256──> clave AES-256                │
│    password     210.000 iter.    (solo en memoria)           │
│                 sal por usuario  (in memory only)            │
│                       │                                       │
│                       ▼                                       │
│   React 19 (SPA) ─> AES-256-GCM ─> localStorage              │
│   Framer Motion      IV aleatorio   v1.<iv>.<cifrado>        │
│   React Router       por escritura  bóveda por usuario       │
│                                                              │
│          ❌  NINGÚN DATO SALE DEL DISPOSITIVO                │
│          ❌  NO DATA LEAVES THE DEVICE                       │
│          ❌  SIN CLAVES DE API / NO API KEYS                 │
└──────────────────────────────────────────────────────────────┘
                │ Solo ficheros estáticos / Static files only
                ▼
     HuggingFace Spaces (CDN estático / static CDN)
```

### Stack Tecnológico / Technology Stack

| Tecnología / Technology | Versión | Función / Role |
|---|---|---|
| React | 19.2.5 | Framework UI principal / Core UI framework |
| Vite | 8.0.8 | Bundler y compilación / Bundler & build |
| React Router DOM | 7.14.0 | Enrutamiento cliente / Client-side routing |
| Framer Motion | 12.38.0 | Animaciones / Animations |
| Recharts | 3.8.1 | Gráficas de vitales / Vitals charts |
| qrcode.react | 4.2.0 | QR de emergencia / Emergency QR |
| jsPDF | 4.2.1 | Generación PDF / PDF generation |
| Lucide React | 1.8.0 | Iconografía / Icons |
| Web Crypto API | Nativa / Native | PBKDF2-SHA256 y AES-256-GCM / Key derivation & encryption |
| Google Fonts | CDN | Playfair Display + Inter |
| HuggingFace Spaces | Static | Hosting y CDN / Hosting & CDN |

---

## 3. Seguridad / Security

### 3.1 Arquitectura Zero-Knowledge

**ES:** AURA Pets implementa una política de **conocimiento cero** (_Zero-Knowledge Architecture_): los datos personales y sanitarios **nunca se transmiten a ningún servidor externo**. Una vez cargada la aplicación, **ninguna comunicación de red transporta datos del expediente**. No existen cookies de rastreo, telemetría ni análisis de comportamiento.

**EN:** AURA Pets implements a **Zero-Knowledge Architecture**: personal and health data **is never transmitted to any external server**. Once the application is loaded, **no network communication carries record data**. There are no tracking cookies, telemetry, or behavioural analytics.

La afirmación es verificable sobre el propio artefacto desplegado / The claim is verifiable against the deployed artefact itself:

```bash
npm run build

# 1 · Ninguna clave de API en el artefacto / No API key in the artefact
grep -oE 'sk-[A-Za-z0-9-]{20,}|VITE_[A-Z_]+' dist/assets/*.js

# 2 · TODA URL externa, no solo las peticiones fetch / EVERY external URL,
#     not just fetch calls. Una etiqueta <img src="https://…"> también es
#     una petición de red y no aparece buscando 'fetch('.
grep -ohE 'https://[a-z0-9.-]+\.[a-z]{2,}' dist/assets/*.js | sort -u
```

**ES:** La segunda comprobación debe hacerse sobre **cualquier URL**, no solo sobre llamadas `fetch`. Una etiqueta `<img>` apuntando a un servidor externo genera una petición idéntica y no aparece buscando `fetch(`. El resultado esperado son únicamente las conexiones declaradas más abajo; el resto de coincidencias proceden del interior de las librerías —textos de mensajes de error— y no llegan a ejecutarse.

**EN:** The second check must cover **any URL**, not only `fetch` calls. An `<img>` tag pointing at an external server produces an identical request and does not show up when searching for `fetch(`. The expected result is only the connections declared below; any other matches come from inside library code as error-message strings and are never executed.

**Sin claves de API. Sin servicios de terceros.** La aplicación no depende de ningún proveedor externo para funcionar:

**No API keys. No third-party services.** The application depends on no external provider to operate:

| Función / Feature | Resuelto mediante / Resolved by |
|---|---|
| Detección de país en modo SOS / SOS country detection | Cálculo local sobre coordenadas — el GPS no sale del dispositivo / Local computation on coordinates — GPS never leaves the device |
| Fondo animado de bienvenida / Animated welcome background | Gradientes y `@keyframes` CSS generados en el navegador / CSS gradients and keyframes rendered in-browser |
| Contenido legal GDPR y HIPAA / GDPR & HIPAA legal content | Textos bilingües empaquetados en la aplicación / Bilingual copy bundled in the application |
| Tipografías / Typefaces | Google Fonts (CDN público, sin datos de usuario) / Google Fonts (public CDN, no user data) |
| Miniaturas de especie / Species thumbnails | Empaquetadas en la aplicación / Bundled with the application |

#### Conexiones externas declaradas / Declared external connections

| Conexión / Connection | Cuándo / When | Qué se transmite / What is transmitted |
|---|---|---|
| `fonts.googleapis.com` | Al cargar la aplicación / On application load | Nada del usuario ni del animal / Nothing about the user or the animal |
| `google.com/maps` | **Solo al pulsar** «buscar veterinario 24 h» en el modo SOS / **Only on pressing** "find a 24 h vet" in SOS mode | Las coordenadas, a petición expresa del usuario y en una pestaña nueva / The coordinates, at the user's explicit request and in a new tab |
| Organismos oficiales (`cdc.gov`, `gov.uk`, `europa.eu`, `inspection.canada.ca`, `agriculture.gov.au`, `aphis.usda.gov`, `fws.gov`) | **Solo al pulsar** el enlace a la fuente en el Pasaporte Global / **Only on pressing** the source link in the Global Passport | Nada. Es un enlace `<a>` a una página pública que abre en pestaña nueva; no se envía ningún dato del expediente / Nothing. It is an `<a>` link to a public page opening in a new tab; no record data is sent |

**ES:** Los enlaces a organismos oficiales **no generan ninguna petición hasta que el usuario los pulsa**, y cuando lo hace abren una web pública en otra pestaña sin transmitir nada del expediente. Se declaran aquí porque el criterio de esta ficha es enumerar **toda URL externa presente en el artefacto**, se ejecute o no automáticamente.

**EN:** Links to official bodies **generate no request until the user clicks them**, and when clicked they open a public page in another tab without transmitting anything from the record. They are declared here because this sheet's criterion is to enumerate **every external URL present in the artefact**, whether or not it executes automatically.

**ES:** Ninguna de las dos transporta datos del expediente. La segunda es una acción deliberada del usuario en una situación de emergencia, no una petición automática de la aplicación, y se declara aquí por transparencia.

**EN:** Neither carries record data. The second is a deliberate user action in an emergency, not an automatic request by the application, and is declared here for transparency.

### 3.2 Derivación de Clave / Key Derivation

La contraseña **nunca se almacena, ni siquiera hasheada**. De ella se derivan 512 bits mediante **PBKDF2-HMAC-SHA256** con **210.000 iteraciones** y una **sal aleatoria de 128 bits distinta por usuario**, conforme a la recomendación vigente de OWASP. Los 256 primeros bits constituyen la clave AES; los 256 restantes forman un **verificador** que permite comprobar la contraseña sin poder descifrar nada con él.

The password is **never stored, not even hashed**. 512 bits are derived from it using **PBKDF2-HMAC-SHA256** with **210,000 iterations** and a **random 128-bit salt unique per user**, per current OWASP guidance. The first 256 bits form the AES key; the remaining 256 form a **verifier** that validates the password without being able to decrypt anything.

```javascript
// src/utils/vault.js
const bits = await crypto.subtle.deriveBits(
  { name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' }, base, 512,
);
const keyBytes = bits.slice(0, 32);   // clave AES-256
const verifier = bits.slice(32);      // verificación de contraseña
```

### 3.3 Cifrado de Datos AES-256-GCM / AES-256-GCM Data Encryption

Los expedientes médicos, historiales clínicos, documentos sanitarios y datos de mascotas se cifran con **AES-256-GCM**, un modo autenticado que además de confidencialidad garantiza que el dato no ha sido manipulado. Cada escritura usa un **vector de inicialización aleatorio de 96 bits**, de modo que guardar el mismo contenido dos veces produce cifrados distintos.

Medical records, clinical histories, health documents, and pet data are encrypted with **AES-256-GCM**, an authenticated mode that guarantees both confidentiality and tamper detection. Every write uses a **random 96-bit initialisation vector**, so storing identical content twice produces different ciphertexts.

Formato en disco / On-disk format: `v1.<iv en base64>.<texto cifrado en base64>`

Cada usuario dispone de un espacio de bóveda independiente / Each user has an independent vault:

```
vault_[userId]_pets             →  Expedientes de mascotas / Pet records
vault_[userId]_history_[petId]  →  Historial clínico / Clinical history
vault_[userId]_docs_[petId]     →  Documentos adjuntos / Attached documents
mascota_health_users            →  Email, sal y verificador / Email, salt, verifier
```

**La lista de cuentas no contiene ningún dato descifrable.** Solo email, sal y verificador; con ellos no es posible recuperar la clave ni leer un solo expediente.

**The account list contains no decryptable data.** Only email, salt, and verifier; none of which allows recovering the key or reading a single record.

#### Ciclo de vida de la clave / Key lifecycle

| Momento / Event | Comportamiento / Behaviour |
|---|---|
| Inicio de sesión / Login | Se deriva de la contraseña y se abre la bóveda |
| Recarga de página / Page reload | Persiste en `sessionStorage` — no se vuelve a pedir la contraseña |
| Cierre de pestaña / Tab close | El navegador destruye `sessionStorage`: la clave desaparece |
| Cierre de sesión / Logout | Se destruye explícitamente en memoria y en `sessionStorage` |
| Reposo / At rest | **No existe en ninguna parte** — solo el dato cifrado |

Sin la contraseña del usuario, los expedientes son **computacionalmente irrecuperables**. No existe puerta trasera, mecanismo de recuperación ni copia de la clave: ni el propietario del software puede acceder a ellos.

Without the user's password, records are **computationally unrecoverable**. There is no backdoor, recovery mechanism, or key escrow: not even the software owner can access them.

#### Migración desde versiones anteriores / Migration from earlier versions

Las cuentas creadas antes de esta versión se validan con el esquema previo, sus datos se leen, se reescriben cifrados y el hash antiguo se elimina. El proceso es automático y no supone pérdida de información.

Accounts created before this version are validated against the previous scheme, their data is read, rewritten encrypted, and the old hash removed. The process is automatic and lossless.

### 3.4 Gestión de Sesiones / Session Management

| Parámetro / Parameter | Valor / Value |
|---|---|
| Duración máxima / Max duration | 2 horas / 2 hours |
| Alerta de expiración / Expiry alert | Modal con renovación opcional / Modal with optional renewal |
| Cierre automático / Auto logout | Al expirar / On timeout |
| Persistencia de sesión / Session persistence | No — login por sesión / No — per-session login required |
| Clave de cifrado / Encryption key | En `sessionStorage`, por pestaña; destruida al cerrarla / In `sessionStorage`, per tab; destroyed on close |
| Recarga de página / Page reload | Reabre la bóveda sin pedir contraseña / Reopens the vault without asking for the password |

### 3.5 Recuperación de Contraseña / Password Recovery

**ES:** La clave de cifrado se deriva de la contraseña, de modo que restablecerla **no puede** devolver el acceso a los datos previos: sin la contraseña anterior son matemáticamente ilegibles. El flujo de recuperación advierte de ello de forma explícita y exige confirmación mediante casilla antes de continuar, tras lo cual la cuenta parte de una bóveda vacía.

**EN:** The encryption key derives from the password, so resetting it **cannot** restore access to previous data: without the former password it is mathematically unreadable. The recovery flow states this explicitly and requires checkbox confirmation before proceeding, after which the account starts from an empty vault.

Es la contrapartida inevitable del conocimiento cero, y se comunica al usuario antes de actuar, no después.

This is the unavoidable trade-off of zero knowledge, and it is communicated to the user before acting, not after.

### 3.6 Destrucción Certificada de Datos / Certified Data Destruction

La eliminación permanente requiere doble confirmación por palabra clave (`BAJA` / `ELIMINAR`), cumpliendo el protocolo técnico del derecho al olvido GDPR Art. 17.

Permanent deletion requires double keyword confirmation (`BAJA` / `ELIMINAR`), fulfilling the technical protocol for the GDPR Art. 17 right to erasure.

El borrado alcanza **todo** el rastro del usuario, no solo los expedientes visibles / Deletion reaches **every** trace of the user, not just visible records:

| Elemento / Item | Estado / Status |
|---|---|
| Expedientes de mascotas / Pet records | Eliminado / Deleted |
| Historiales clínicos / Clinical histories | Eliminado / Deleted |
| Documentos adjuntos / Attached documents | Eliminado / Deleted |
| Cuenta, email, sal y verificador / Account, email, salt, verifier | Eliminado / Deleted |
| Preferencias y marcadores / Preferences and flags | Eliminado / Deleted |
| Clave de cifrado en memoria / In-memory encryption key | Destruida / Destroyed |
| Datos de otros usuarios del dispositivo / Other users' data on the device | Intactos / Untouched |

Verificado mediante prueba automatizada que ejecuta el procedimiento real de borrado y comprueba que no sobrevive ninguna clave del usuario eliminado.

Verified by an automated test that runs the real deletion routine and asserts that no key belonging to the deleted user survives.

---

## 4. Privacidad y Cumplimiento Normativo / Privacy & Regulatory Compliance

La política de privacidad completa, bilingüe (ES/EN), está disponible en:  
The full bilingual (ES/EN) privacy policy is available at:

> **`[base_url]/politicas.html`**

### 4.1 GDPR — Reglamento General de Protección de Datos (UE 2016/679)

| Artículo / Article | Derecho / Right | Implementación / Implementation |
|---|---|---|
| Art. 17 | Derecho al olvido / Right to erasure | Eliminación permanente con doble confirmación en PrivacyVault |
| Art. 20 | Portabilidad / Data portability | Exportación JSON con expedientes e historial clínico completo |
| Art. 25 | Privacidad por diseño / Privacy by design | Arquitectura Zero-Knowledge sin datos en servidores |
| Art. 32 | Seguridad del tratamiento / Security of processing | AES-256-GCM con clave PBKDF2 (210.000 iteraciones); sesión con TTL |

### 4.2 CCPA — California Consumer Privacy Act (Cal. Civ. Code § 1798.100)

| Derecho / Right | Estado / Status |
|---|---|
| Derecho a saber / Right to know | ✅ Exportación JSON íntegra en todo momento / Full JSON export always available |
| Derecho a eliminar / Right to delete | ✅ Eliminación permanente con doble confirmación / Permanent deletion with double confirmation |
| Derecho a no vender / Right to opt-out of sale | ✅ No se venden ni transfieren datos — arquitectura sin servidor / No data sold or transferred — serverless architecture |
| No discriminación / Non-discrimination | ✅ Servicio idéntico independientemente del ejercicio de derechos / Identical service regardless of rights exercise |

### 4.3 LOPD-GDD — Ley Orgánica 3/2018 (España)

Cumplimiento alineado con GDPR. El tratamiento de datos de salud animal se realiza exclusivamente en el dispositivo del titular, sin cesión a terceros.

Compliance aligned with GDPR. Animal health data is processed exclusively on the data subject's device, with no transfer to third parties.

---

## 5. Funcionalidades Principales / Core Features

### 5.1 Pasaporte Sanitario Global / Global Sanitary Passport

**ES:** Genera un pasaporte sanitario oficial personalizado por país de destino. Un motor de reglas evalúa el expediente médico del animal frente a los requisitos oficiales de cada país y devuelve un índice de preparación con lista de acciones pendientes. Exportación en PDF compatible con iOS Safari y Android Chrome.

**EN:** Generates an official health passport customised per destination country. A rules engine evaluates the animal's medical record against each country's official requirements and returns a readiness score with a list of pending actions. PDF export compatible with iOS Safari and Android Chrome.

| Destino / Destination | Requisitos clave / Key requirements |
|---|---|
| 🇪🇸 España / Spain | Microchip ISO, vacuna antirrábica, certificado TRACES |
| 🇬🇧 Reino Unido / UK | Microchip ISO 15 dígitos, antirrábica, tratamiento tapeworm |
| 🇺🇸 Estados Unidos / USA | Certificado sanitario USDA-endorsed, antirrábica |
| 🇨🇦 Canadá / Canada | Permiso de importación CFIA, microchip, historial vacunal |
| 🇦🇺 Australia | Permiso DAWR, cuarentena 6 meses, certificado libre de rabia |

### 5.2 Selector de Especies / Species Selector

**ES:** Carrusel horizontal con scroll táctil nativo, flechas de navegación doradas, degradados de opacidad en los extremos y puntos indicadores de posición. Seis categorías con campos específicos por especie y formularios dinámicos.

**EN:** Horizontal carousel with native touch scroll, golden navigation arrows, edge opacity fades, and position indicator dots. Six categories with species-specific fields and dynamic forms.

| Especie / Species | Campos específicos / Specific fields |
|---|---|
| 🐕 Perro / Dog | Datos básicos, vacunas, microchip |
| 🐈 Gato / Cat | Datos básicos, vacunas, microchip |
| 🐴 Caballo / Horse | Ubicación del microchip, pasaporte equino, UELN, REGA, sexo, capa, marcas distintivas, tatuaje o hierro, herrador, competición |
| 🦜 Ave / Bird | Tipo de identificación, nº de anilla, especie científica, apéndice y certificado CITES, criador, muda, canto |
| 🐇 Conejo / Rabbit | Tatuaje auricular o microchip, criador, mixomatosis, enfermedad hemorrágica (RHD) |
| 🦎 Reptil / Reptile | Temperatura de hábitat, humedad, estado de muda, CITES |
| ➕ Otra / Other | Campo de especie personalizado / Custom species field |

**ES:** Las miniaturas del carrusel se sirven desde el propio dominio. En versiones anteriores se cargaban desde un banco de imágenes externo, lo que generaba cinco peticiones a un tercero cada vez que se abría el alta e impedía usar la pantalla sin conexión.

**EN:** Carousel thumbnails are served from the application's own origin. Earlier versions loaded them from an external image bank, which fired five third-party requests each time the registration screen opened and prevented the screen from working offline.

### 5.3 Sistema de Requisitos Internacionales / International Requirements System

#### Regímenes normativos por especie / Regulatory regimes by species

**ES:** No existe un único régimen de viaje aplicable a todos los animales de compañía. El motor de reglas selecciona el que corresponde a cada especie, porque exigir a un conejo la vacuna antirrábica de un perro, o a un camaleón un tratamiento antiparasitario, produce una lista de requisitos que no sirve para nada.

**EN:** There is no single travel regime covering all companion animals. The rules engine selects the one that applies to each species, because asking a rabbit for a dog's rabies vaccination, or a chameleon for a tapeworm treatment, produces a checklist that helps nobody.

| Especie / Species | Régimen aplicable / Applicable regime | Documento central / Core document |
|---|---|---|
| 🐕 🐈 Perro y gato / Dog and cat | Régimen de animales de compañía / Pet travel scheme | Pasaporte o certificado sanitario / Passport or health certificate |
| 🐴 Caballo / Horse | Sanidad animal equina / Equine animal health law | Documento de identificación equina con UELN |
| 🦜 Ave / Bird | CITES + sanidad aviar / CITES + avian health | Permisos CITES de exportación e importación |
| 🐇 Conejo / Rabbit | **Fuera del reglamento europeo** — norma nacional del destino / **Outside the EU pet regulation** — destination's national rules | Certificado sanitario y licencia según destino |
| 🦎 Reptil / Reptile | CITES por encima de la sanidad animal / CITES above animal health | Certificado CITES por espécimen |
| ➕ Sin determinar / Undetermined | No se emite valoración / No assessment issued | Consulta previa a la autoridad del destino |

#### Dependencia del corredor / Corridor dependency

**ES:** Para las especies distintas de perro y gato, los requisitos no dependen solo del destino sino del corredor completo de salida y llegada. La aplicación incorpora un selector de país de origen sobre los cinco mercados cubiertos, lo que da lugar a veinticinco combinaciones evaluables.

**EN:** For species other than dogs and cats, requirements depend not only on the destination but on the full departure-arrival corridor. The application provides an origin-country selector across the five covered markets, giving twenty-five assessable combinations.

| Ejemplo / Example | Motivo / Reason |
|---|---|
| Piroplasmosis exigida solo con origen España | Zona endémica / Endemic area |
| Metritis contagiosa equina solo hacia EE. UU. y desde España o Reino Unido | Orígenes afectados hacia destino libre / Affected origins into a free destination |
| Vacuna de gripe equina solo hacia Australia | Destino libre de la enfermedad / Destination free of the disease |
| Origen igual a destino | Movimiento nacional, sin trámite de exportación / Domestic movement, no export procedure |

#### Advertencia sobre el alcance / Scope disclaimer

**ES:** AURA Pets prepara y custodia documentación; **no emite documentos oficiales ni sustituye la consulta a la autoridad competente**. Los requisitos sanitarios cambian con frecuencia y su verificación corresponde al organismo del país de destino. La aplicación muestra esta advertencia al usuario en las especies cuyo régimen es más variable.

**EN:** AURA Pets prepares and safeguards documentation; **it does not issue official documents nor replace consulting the competent authority**. Sanitary requirements change frequently and their verification rests with the destination country's body. The application displays this warning to the user for the species whose regime varies most.

#### Trazabilidad de los requisitos / Requirement traceability

**ES:** Cada bloque de requisitos se muestra acompañado del **enlace directo al organismo competente** y de la **fecha en que la lista se contrastó** contra esa fuente. La aplicación no afirma un requisito: lo atribuye y permite comprobarlo. Los enlaces y la fecha viajan también en el PDF exportado, que es el documento que el usuario acaba presentando.

La fecha de contraste vive en una sola constante, `FECHA_REVISION` en `src/utils/fuentes.js`, y la norma de mantenimiento es que **toda modificación de un requisito obliga a actualizarla**. Una fecha antigua es una señal honesta de que el dato conviene reconfirmarlo; una fecha falsa sería peor que no mostrar ninguna.

El registro completo de la última revisión —qué se comprobó, contra qué fuente, qué se corrigió y qué queda pendiente— está en `REVISION_NORMATIVA.md`.

**EN:** Every requirement block is shown alongside a **direct link to the competent authority** and the **date the list was checked** against that source. The application does not assert a requirement: it attributes it and lets the reader verify it. Links and date also travel in the exported PDF, which is the document the user ends up presenting.

The check date lives in a single constant, `FECHA_REVISION` in `src/utils/fuentes.js`, and the maintenance rule is that **any change to a requirement obliges updating it**. A stale date is an honest signal that the data is worth reconfirming; a false date would be worse than showing none.

The full record of the last review — what was checked, against which source, what was corrected and what remains open — is in `REVISION_NORMATIVA.md`.

#### Niveles de aviso / Warning tiers

**ES:** Un aviso que aparece siempre e igual deja de leerse. La interfaz gradúa la advertencia según lo que esté realmente en juego, mediante `nivelRiesgo()`:

| Nivel | Cuándo | Tratamiento |
|---|---|---|
| **Verde** | Origen y destino coinciden, o régimen único y estable | Aviso breve; se recuerda confirmar fechas |
| **Ámbar** | Perro o gato hacia un tercer país | Aviso visible: los requisitos los fija el destino y cambian sin previo aviso |
| **Rojo** | Cualquier destino con cuarentena o permiso previo (Australia), y toda especie fuera del régimen de animales de compañía | Advertencia destacada: plazos de meses, no comprar billetes sin confirmar |

**EN:** A warning that always appears in the same form stops being read. The interface grades the warning to what is actually at stake, through `nivelRiesgo()`: **green** for movements under a single stable regime, **amber** for dogs and cats entering a third country, and **red** for any destination involving quarantine or a prior permit, and for every species outside the pet travel scheme.

**ES:** Motor de reglas que cruza el expediente médico real de la mascota con los requisitos sanitarios oficiales del país de destino. Devuelve: porcentaje de cumplimiento, lista de requisitos cumplidos y pendientes, detalle de cada requisito, y exportación en PDF del informe completo.

**EN:** Rules engine that cross-references the pet's actual medical record with the official sanitary requirements of the destination country. Returns: compliance percentage, list of fulfilled and pending requirements, per-requirement detail, and PDF export of the full report.

### 5.4 Historial Médico Completo / Full Medical History

**ES:** Módulo de expediente clínico digital organizado en cuatro categorías con persistencia local cifrada. Accesible desde el Dashboard principal del animal.

**EN:** Digital clinical record module organised in four categories with encrypted local persistence. Accessible from the pet's main Dashboard.

| Categoría / Category | Campos / Fields |
|---|---|
| **Visitas** | Fecha, clínica, veterinario, motivo, diagnóstico, tratamiento, coste |
| **Vacunas** | Nombre, fecha administración, próxima dosis, estado (al día / próxima / vencida) |
| **Medicación** | Medicamento, dosis, frecuencia, fecha inicio/fin, indicador activo/finalizado |
| **Análisis** | Tipo, fecha, resultado, observaciones, documento adjunto (JPG / PNG / PDF ≤ 3 MB) |

Funcionalidades adicionales / Additional features:
- Adjunto de documentos con vista previa in-app y visor PDF fullscreen
- Captura directa desde cámara del dispositivo / Direct device camera capture
- Exportación del historial completo en **PDF** (jsPDF) con todos los apartados
- Línea de tiempo visual con puntos dorados para visitas / Visual timeline with gold dots

#### Gestión del almacenamiento / Storage management

**ES:** El navegador concede aproximadamente **5 MB por dominio**. Una fotografía de móvil sin procesar consume esa cuota entera, así que toda imagen se reescala a 640 px en su lado mayor y se recodifica en JPEG antes de guardarse, con lo que pasa de varios megabytes a unos 60 KB. La orientación EXIF se respeta, de modo que las fotos verticales no aparecen giradas.

**EN:** Browsers grant roughly **5 MB per origin**. A single unprocessed phone photo consumes that entire quota, so every image is downscaled to 640 px on its longest side and re-encoded as JPEG before storage, going from several megabytes to about 60 KB. EXIF orientation is honoured, so portrait photos are not rotated.

Cuando la cuota se agota, la escritura falla de forma **visible y explícita**: la interfaz no muestra como guardado nada que no esté efectivamente en disco.

When the quota is exhausted, the write fails **visibly and explicitly**: the interface never shows as saved anything that is not actually on disk.

### 5.5 Botón de Emergencia SOS / SOS Emergency Button

**ES:** Sistema de respuesta a emergencias con activación desde la barra de navegación inferior (botón central elevado, siempre visible en móvil). Funcionalidades:

**EN:** Emergency response system activated from the bottom navigation bar (elevated central button, always visible on mobile). Features:

| Funcionalidad / Feature | Descripción / Description |
|---|---|
| **Geolocalización / Geolocation** | Coordenadas GPS en tiempo real via Geolocation API / Real-time GPS via Geolocation API |
| **Código QR / QR Code** | Ficha de emergencia con datos médicos, alertas y contactos / Emergency card with medical data, alerts, and contacts |
| **Llamada directa / Direct call** | Marcación al número de emergencias veterinarias del país detectado / Dials country-detected veterinary emergency number |
| **Cambio de mascota / Pet switch** | Cambio de animal activo sin perder la sesión GPS / Switch active pet without losing GPS session |
| **Estado BUSCANDO / SEARCHING** | Indicador visual pulsante para animales extraviados / Pulsing visual badge for lost animals |

---

## 6. Diseño y Compatibilidad / Design & Compatibility

### Design System AURA — v4.0 "Cybersecurity Command Center"

Sistema de diseño premium implementado íntegramente en `src/index.css` (~1 500 líneas, 25 secciones). Estética de banca de lujo: void negro-púrpura, glassmorfismo, oro metálico y brillo cyan neón.

Premium design system fully implemented in `src/index.css` (~1,500 lines, 25 sections). Luxury banking aesthetic: black-purple void, glassmorphism, metallic gold, and neon cyan glow.

| Variable CSS | Valor / Value | Uso / Use |
|---|---|---|
| `--aura-gold` | `#D4AF37` | Acento primario / Primary accent |
| `--aura-gold-light` | `#F9E1A4` | Variante clara / Light variant |
| `--aura-neon-cyan` | `#00E8FF` | Estado activo / Active state |
| `--aura-neon-pink` | `#E24B4A` | Alerta / SOS / Error |
| `--aura-black` | `#080010` | Fondo negro profundo / Deep black background |
| `--bg-card` | `rgba(20,6,40,0.88)` | Tarjetas glassmorfismo / Glassmorphism cards |
| `--gold-gradient` | `linear-gradient(140deg, #f9e1a4, #d4af37, #a07820)` | Degradado dorado premium |
| `--font-serif` | `'Playfair Display', Georgia, serif` | Tipografía editorial / Editorial type |
| `--font-sans` | `'Inter', system-ui, sans-serif` | UI y formularios / UI & forms |

**Técnicas visuales / Visual techniques:**
- Glassmorfismo: `backdrop-filter: blur(24px)` + fondos semitransparentes
- Anillos orbitales animados: `::before` / `::after` en `.shield-icon` y `.bio-ring`
- Grano de película: `body::after` con SVG `feTurbulence` en data-URI
- Transición blur-fade: `filter: blur(6px) → 0` en `@keyframes auraFade`
- Separador shimmer: gradiente animado deslizante en `.aura-separator`
- Inputs de fecha oscuros: `color-scheme: dark` + icono dorado vía `filter`
- Protección de movimiento: `@media (prefers-reduced-motion: reduce)`

### Compatibilidad Responsive / Responsive Compatibility

| Breakpoint | Comportamiento / Behaviour |
|---|---|
| `> 900px` | Desktop: nav superior, layouts 2 columnas |
| `≤ 900px` | Móvil: bottom tab bar 5 tabs, layouts 1 columna, safe-areas |
| `768–1024px` | Tablet: colapso a columna única |
| `≤ 375px` | iPhone SE / Galaxy A: tipografía y padding reducidos |

### Compatibilidad Cross-Platform

| Plataforma | Estado |
|---|---|
| iOS Safari (iPhone 12+) | ✅ Verificado — viewport-fit=cover, font-size 16px en inputs |
| Android Chrome (API 26+) | ✅ Verificado — theme-color, tap-highlight eliminado |
| Desktop Chrome / Edge / Firefox | ✅ Verificado |
| PWA instalable | ✅ manifest.json + apple-mobile-web-app-capable |

### 6.3 Modal de Bienvenida / Welcome Intro Modal

Pantalla de introducción con fondo animado generado íntegramente en el dispositivo: nebulosa púrpura y aurora cyan compuestas con gradientes radiales y `@keyframes` CSS, sobre viñeta central. No depende de ningún servicio externo, por lo que aparece de forma instantánea y funciona sin conexión. Respeta `prefers-reduced-motion`, deteniendo la animación en dispositivos configurados para reducir el movimiento.

Introduction screen with an animated background generated entirely on-device: a purple nebula and cyan aurora composed from radial gradients and CSS `@keyframes` over a central vignette. It depends on no external service, so it appears instantly and works offline. It honours `prefers-reduced-motion`, halting the animation on devices configured to reduce motion.

---

## 7. Internacionalización / Internationalization

- **Idiomas / Languages:** Español 🇪🇸 (por defecto / default) · English 🇬🇧
- **Detección / Detection:** Automática por idioma del navegador / Automatic from browser language
- **Toggle manual:** Visible en desktop nav y barra móvil / Visible in desktop nav and mobile bar
- **Divisas / Currencies:** EUR · USD · GBP · AUD (seleccionable / selectable)
- **Persistencia / Persistence:** Configuración guardada en `localStorage`

---

## 8. Despliegue / Deployment

```
npm run build  →  /dist/  →  HF_TOKEN=$HF_TOKEN node deploy-hf.mjs  →  HuggingFace Spaces CDN
```

> El deploy usa el paquete `@huggingface/hub` (Node.js) para subir los archivos del build directamente vía API, evitando las restricciones de almacenamiento Xet de HuggingFace para binarios.
>
> Deployment uses the `@huggingface/hub` (Node.js) package to upload build files directly via API, bypassing HuggingFace's Xet binary storage restrictions.

| Entorno / Environment | Plataforma / Platform | URL |
|---|---|---|
| Producción / Production | HuggingFace Spaces (static) | https://rociogf-aura-pets-final.static.hf.space |
| Código fuente / Source code | GitHub | https://github.com/Rodigitaladvance/mascotas |

### Comandos / Commands

```bash
npm run dev      # Servidor local / Local server — http://localhost:5173
npm run build    # Build de producción / Production build → /dist
npm run preview  # Vista previa del build / Build preview
npm run lint     # Análisis estático ESLint / ESLint static analysis
```

---

## 9. Automatización y Monitorización / Automation & Monitoring

### 9.1 Monitor de Disponibilidad Principal — n8n

**ES:** Workflow automatizado en n8n que comprueba cada 15 minutos si la aplicación está disponible en producción. Si el servidor devuelve un código de error HTTP ≥ 500, se envía una alerta instantánea por Telegram.

**EN:** Automated n8n workflow that checks every 15 minutes whether the application is available in production. If the server returns an HTTP error code ≥ 500, an instant Telegram alert is sent.

```
Cada 15 minutos → GET https://rociogf-aura-pets-final.static.hf.space
                      ↓
              ¿statusCode ≥ 500?
               /             \
             Sí               No
             ↓                ↓
    Telegram - Alerta    App OK - No hacer nada
```

| Parámetro | Valor |
|---|---|
| Plataforma / Platform | n8n (self-hosted en automation.rodigitaladvance.link) |
| Intervalo / Interval | 15 minutos / 15 minutes |
| Condición de alerta / Alert condition | HTTP statusCode ≥ 500 |
| Canal de notificación / Notification channel | Telegram Bot @aurapetsrodigital_bot |

### 9.2 Monitor de Respaldo — Make (Integromat)

**ES:** Escenario en Make configurado como sistema de respaldo para cuando n8n no esté disponible. Misma lógica: GET a la URL de producción, filtro statusCode ≥ 500, alerta Telegram.

**EN:** Make scenario configured as a backup system for when n8n is unavailable. Same logic: GET to the production URL, statusCode ≥ 500 filter, Telegram alert.

| Parámetro | Valor |
|---|---|
| Plataforma / Platform | Make (make.com) |
| Estado / Status | En espera — activar si n8n falla / Standby — activate if n8n fails |
| Canal de notificación / Notification channel | Telegram Bot @aurapetsrodigital_bot |

---

## 10. Licencia / License

**Software propietario. Todos los derechos reservados.**
**Proprietary software. All rights reserved.**

**ES:** El código, el diseño, los textos, la documentación y el registro de
verificación normativa son propiedad exclusiva de Rodigital Advance. No se
concede ningún derecho de uso, copia, modificación, distribución, venta ni
desarrollo derivado sin autorización previa, expresa y por escrito. El texto
íntegro de la licencia está en el archivo `LICENSE` en la raíz del repositorio,
que es el único documento vinculante en esta materia.

**EN:** The code, design, texts, documentation and regulatory verification
register are the exclusive property of Rodigital Advance. No right to use,
copy, modify, distribute, sell or create derivative works is granted without
prior express written authorisation. The full licence text is in the `LICENSE`
file at the root of the repository, which is the only binding document on this
matter.

Las dependencias de terceros conservan sus respectivas licencias.
Third-party dependencies retain their respective licences.

---

## 11. Declaración de Conformidad / Conformity Declaration

Se declara que la aplicación **AURA Pets — Global Health Passport** ha sido desarrollada, auditada y desplegada en conformidad con:

It is declared that the application **AURA Pets — Global Health Passport** has been developed, audited, and deployed in conformity with:

- ✅ **Privacy by Design** — Art. 25 GDPR
- ✅ **Security by Default** — Art. 32 GDPR
- ✅ **Zero-Knowledge Architecture** — datos exclusivamente en dispositivo del usuario / data exclusively on user's device
- ✅ **GDPR** — Reglamento UE 2016/679
- ✅ **CCPA** — California Consumer Privacy Act § 1798.100
- ✅ **LOPD-GDD** — Ley Orgánica 3/2018 (España)
- ✅ **Licencia propietaria** — todos los derechos reservados / all rights reserved
- ✅ **Accesibilidad universal** — Responsive PWA, cross-browser, cross-platform

---

<div align="center">

| | |
|---|---|
| **Empresa / Company** | Rodigital Advance |
| **Versión / Version** | 1.5.0 |
| **Fecha de emisión / Issue date** | 2026-09-11 |
| **Válido hasta / Valid until** | 2027-09-10 |

*Este documento es de carácter oficial y ha sido generado para auditoría de certificación.*  
*This document is official in nature and has been generated for certification audit purposes.*

© 2026 Rodigital Advance · AURA Pets · All rights reserved

</div>
