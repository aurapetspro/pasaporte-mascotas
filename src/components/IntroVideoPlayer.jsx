import { createPortal } from 'react-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gatoYPerro from '../assets/gato-y-perro.png';

// ─── Portal Modal ─────────────────────────────────────────────────────────────
export const IntroVideoModal = ({ isOpen, onContinue }) => {
  const [btnHovered, setBtnHovered] = useState(false);
  const [fotoRota, setFotoRota] = useState(false);

  if (!isOpen) return null;

  const modal = (
    <AnimatePresence>
      <motion.div
        key="aura-intro-portal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#FEFBF4',
        }}
      >
        <style>{`
          /* Aquí había un @import a Google Fonts pidiendo Playfair e Inter otra
             vez. Sobraba: las dos ya vienen declaradas en fuentes.css, desde
             nuestro propio dominio. Lo único que añadía era una petición a un
             tercero en la primera pantalla que ve un usuario nuevo. */
          @keyframes aura-nebula {
            0%   { opacity: 0.70; transform: scale(1)    translate(0, 0)         rotate(0deg); }
            50%  { opacity: 1.00; transform: scale(1.14) translate(4vw, 2.5vw)   rotate(6deg); }
            100% { opacity: 0.70; transform: scale(1)    translate(0, 0)         rotate(0deg); }
          }
          @keyframes aura-nebula2 {
            0%   { opacity: 0.55; transform: scale(1.08) translate(0, 0)         rotate(0deg);  }
            50%  { opacity: 0.90; transform: scale(1)    translate(-3vw, -2vw)   rotate(-7deg); }
            100% { opacity: 0.55; transform: scale(1.08) translate(0, 0)         rotate(0deg);  }
          }
          @media (prefers-reduced-motion: reduce) {
            .aura-nebula-layer { animation: none !important; }
          }
        `}</style>

        {/* ── Fondo AURA generado en el dispositivo — sin red, sin terceros ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          {/* Nebulosa púrpura, esquina superior izquierda */}
          <div
            className="aura-nebula-layer"
            style={{
              position: 'absolute',
              width: '80vw', height: '80vw',
              top: '-20vw', left: '-20vw',
              background: 'radial-gradient(circle, rgba(201,189,242,0.85) 0%, rgba(201,189,242,0.42) 42%, rgba(201,189,242,0.14) 66%, transparent 80%)',
              borderRadius: '50%',
              animation: 'aura-nebula 9s ease-in-out infinite',
            }}
          />
          {/* Aurora cyan, esquina inferior derecha */}
          <div
            className="aura-nebula-layer"
            style={{
              position: 'absolute',
              width: '75vw', height: '75vw',
              bottom: '-22vw', right: '-18vw',
              background: 'radial-gradient(circle, rgba(165,227,220,0.90) 0%, rgba(165,227,220,0.45) 44%, rgba(165,227,220,0.14) 68%, transparent 82%)',
              borderRadius: '50%',
              animation: 'aura-nebula2 12s ease-in-out infinite',
            }}
          />
          {/* Viñeta: oscurece los BORDES, no el centro. La versión anterior
              pintaba un óvalo opaco justo encima de las nebulosas y las
              ocultaba por completo. */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse 88% 78% at 50% 45%, transparent 28%, rgba(254,251,244,0.35) 72%, rgba(254,251,244,0.7) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* ── Gradient inferior para legibilidad del botón ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(254,251,244,0.85) 0%, transparent 45%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* ── Layout: texto arriba | espacio central libre | botón abajo ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingTop: '8vh',
            paddingBottom: '8vh',
            paddingLeft: '2rem',
            paddingRight: '2rem',
          }}
        >
          {/* ── Bloque de texto — parte superior con fade-in ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ textAlign: 'center' }}
          >
            {/* AURA */}
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '52px',
                fontWeight: 900,
                color: '#2A2D7C',
                letterSpacing: -2,
                lineHeight: 1,
                textShadow: 'none',
              }}
            >
              AURA
            </div>

            {/* PETS */}
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '38px',
                fontWeight: 600,
                color: '#D9A441',
                letterSpacing: 14,
                lineHeight: 1,
                marginTop: 6,
                textShadow: 'none',
              }}
            >
              PETS
            </div>

            {/* Línea decorativa plateada */}
            <div
              style={{
                width: 60,
                height: 1,
                background: 'linear-gradient(90deg, #A5E3DC, #C9BDF2, #FCE1A8)',
                margin: '20px auto 16px',
                opacity: 0.7,
              }}
            />

            {/* Subtítulo premium */}
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 300,
                color: '#7B7DA3',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                textShadow: 'none',
                opacity: 0.85,
              }}
            >
              Premium Veterinary Health
            </div>
          </motion.div>

          {/* ── El animal ocupa el area central reservada ── */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {/* Si la imagen no llega, el navegador escribe el texto
                alternativo a tamaño completo en mitad de la pantalla, con su
                icono de imagen rota. Queda peor que no poner nada, y encima
                parece que la aplicación está estropeada cuando lo único que ha
                fallado es un adorno.

                El texto alternativo se queda —lo necesita quien usa un lector
                de pantalla—, pero si la carga falla se esconde la imagen y no
                pasa nada: la pantalla sigue teniendo su título y su botón. */}
            {!fotoRota && (
              <motion.img
                src={gatoYPerro}
                alt="Un perro y un gato con sus medallas AURA"
                onError={() => setFotoRota(true)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }}
                style={{
                  maxWidth: 'min(420px, 78vw)',
                  maxHeight: '100%',
                  width: 'auto', height: 'auto', objectFit: 'contain',
                  filter: 'drop-shadow(0 16px 32px rgba(42, 45, 124, 0.20))',
                }}
              />
            )}
          </div>

          {/* ── Botón ENTRAR — parte inferior ── */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={onContinue}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              style={{
                padding: '14px 60px',
                background: 'linear-gradient(100deg, #8B5CF6 0%, #EC5C8D 55%, #F97B4F 100%)',
                border: 'none',
                borderRadius: 50,
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 400,
                color: '#FFFFFF',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                boxShadow: btnHovered ? '0 10px 28px -8px rgba(236,92,141,0.65)' : '0 6px 18px -8px rgba(236,92,141,0.45)',
                transform: btnHovered ? 'translateY(-1px)' : 'none',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                whiteSpace: 'nowrap',
              }}
            >
              Entrar
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};
