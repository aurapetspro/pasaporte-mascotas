---
title: Aura Pets Final
emoji: 🐾
colorFrom: yellow
colorTo: gray
sdk: static
app_file: index.html
---

<div align="center">
  <h1>🐾 AURA Pets</h1>
  <p><strong>Global Sanitary Passport & Premium Pet Health Record System</strong></p>
  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite" />
    <img src="https://img.shields.io/badge/AES--256--GCM-cifrado_local-2E7D32?style=flat&logo=letsencrypt&logoColor=white" />
    <img src="https://img.shields.io/badge/Framer_Motion-12-FF0055?style=flat" />
    <img src="https://img.shields.io/badge/License-Private-gold?style=flat" />
  </p>
  <p>
    <a href="https://rociogf-aura-pets-final.static.hf.space"><strong>🚀 Live Demo</strong></a>
    &nbsp;·&nbsp;
    <a href="./FICHA_TECNICA.md"><strong>📋 Ficha Técnica / Technical Spec</strong></a>
  </p>
</div>

---

## ¿Qué es AURA Pets?

AURA Pets es una aplicación web premium de gestión de expedientes médicos para mascotas. Diseñada con el principio de **soberanía del dato**: toda la información se almacena localmente en el dispositivo del usuario, cifrada con **AES-256-GCM** bajo una clave derivada de la contraseña, sin servidores externos y **sin una sola llamada de red**.

> *"Tu mascota merece el mismo nivel de excelencia médica que cualquier miembro de la familia."*

---

## ✨ Funcionalidades Principales

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Carrusel multi-mascota con medallones dorados, vitales en tiempo real, historial de peso |
| **Pasaporte Global** | Requisitos de viaje por destino (ES/UK/US/CA/AU), disponibilidad en % y exportación PDF |
| **Modo SOS** | Geolocalización, QR de emergencia, ficha médica instantánea, cambio de miembro activo |
| **Protocolo de Baja** | 3 flujos: Extravío (estado BUSCANDO), Fallecimiento (Memorial PDF), Baja del Servicio |
| **Privacy Vault** | Exportación GDPR (JSON/PDF), destrucción certificada de datos, política de privacidad |
| **Onboarding** | Flujo de bienvenida guiado con selección de especie animada |

---

## 🛠️ Stack Tecnológico

```
React 19 + Vite 8          →  SPA framework
React Router 7 (Hash)      →  Navegación client-side
Framer Motion 12           →  Animaciones y transiciones
Lucide React               →  Sistema de iconografía
jsPDF 4                    →  Generación de PDFs
QRCode React               →  QR de emergencia
Recharts 3                 →  Gráficas de vitales
Web Crypto API             →  PBKDF2-SHA256 + AES-256-GCM
LocalStorage               →  Persistencia local cifrada
```

---

## 🗂️ Estructura del Proyecto

```
src/
├── components/
│   ├── Aura/
│   │   ├── Dashboard.jsx          # Panel principal + carrusel
│   │   ├── GlobalPassport.jsx     # Pasaporte sanitario global
│   │   ├── MedicalHistory.jsx     # Historial clínico + adjuntos
│   │   ├── SOSMode.jsx            # Modo emergencia (geolocalización local)
│   │   ├── PetRegistration.jsx    # Registro de mascota
│   │   ├── PetEditModal.jsx       # Edición + protocolo de baja
│   │   ├── PrivacyVault.jsx       # Seguridad, GDPR y fichas legales
│   │   ├── Onboarding.jsx         # Flujo de bienvenida
│   │   └── RecuperarAcceso.jsx    # Recuperación de contraseña
│   ├── Auth.jsx                   # Alta y acceso — abre la bóveda
│   └── IntroVideoPlayer.jsx       # Bienvenida con fondo animado CSS
├── context/
│   ├── AuthContext.jsx            # Sesión y ciclo de vida de la clave
│   └── LocalizationContext.jsx    # i18n ES/EN + divisa
├── utils/
│   ├── vault.js                   # PBKDF2 + AES-256-GCM + caché descifrado
│   ├── storage.js                 # Capa de datos sobre la bóveda
│   ├── imageUpload.js             # Reescalado y compresión de imágenes
│   ├── intelligence.js            # Motor preventivo de vacunas
│   └── translations.js            # Textos ES/EN
└── index.css                      # Design system AURA
```

---

## 🚀 Instalación y Desarrollo

```bash
git clone https://github.com/Rodigitaladvance/mascotas.git
cd mascotas
npm install
npm run dev
```

```bash
npm run build    # Compilar para producción
npm run preview  # Vista previa del build
```

---

## 🔐 Privacidad y Seguridad

- **0 servidores propios y 0 llamadas de red** — la app no habla con nadie
- **0 claves de API** — ningún servicio de terceros que configurar
- **AES-256-GCM** con IV aleatorio en cada escritura
- **PBKDF2-SHA256, 210.000 iteraciones**, sal aleatoria por usuario
- **La clave no se guarda nunca** — se deriva de la contraseña y vive solo mientras dura la sesión
- **Cumplimiento GDPR / CCPA / LOPD** — derecho al olvido, portabilidad y acceso
- **Destrucción certificada** con doble confirmación por palabra clave

> **Sin la contraseña no hay recuperación posible.** Es la contrapartida del conocimiento cero:
> no existe puerta trasera, ni para el usuario ni para nosotros. Restablecer la contraseña
> parte de una bóveda vacía, y la aplicación lo advierte antes de hacerlo.

Puedes verificar las dos primeras afirmaciones sobre el propio build:

```bash
npm run build
grep -oE 'fetch\(\s*"https?://' dist/assets/*.js   # sin resultados
grep -oE 'VITE_[A-Z_]+'         dist/assets/*.js   # sin resultados
```

---

## 📄 Licencia

**Software propietario.** © 2026 Rodigital Advance · Todos los derechos reservados.

No se concede ningún derecho de uso, copia, modificación, distribución, venta ni
desarrollo derivado sin autorización previa, expresa y por escrito. El texto
íntegro está en [LICENSE](./LICENSE), que es el único documento vinculante en
esta materia.
