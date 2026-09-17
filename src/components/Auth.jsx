import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LocalizationContext';
import { vault } from '../utils/vault';
import { storage } from '../utils/storage';
import { KeyRound, Mail, ShieldCheck, UserPlus, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo-aura.png';
import { IntroVideoModal } from './IntroVideoPlayer';
import PawPrint from './Aura/PawPrint';
import { PlaneTrail, Sparkle, HeartOutline, Rays, Blob } from './Aura/Decorations';

/* Huellas en azules y verdes pastel repartidas por la tarjeta de acceso.
   Posiciones fijas: si fueran aleatorias saltarían en cada render. */
const AUTH_BLOBS = [
  { size: 190, color: '#A5E3DC', top: '-6%',    left: '-16%', opacity: 0.55 },
  { size: 150, color: '#C9BDF2', top: '-4%',    right: '-14%', opacity: 0.50 },
  { size: 170, color: '#F9C9D8', bottom: '6%',  right: '-18%', opacity: 0.42 },
  { size: 140, color: '#BFE0F5', bottom: '-8%', left: '-12%', opacity: 0.45 },
  { size: 110, color: '#FCE1A8', top: '42%',    right: '-13%', opacity: 0.40 },
];

const AUTH_PAWS = [
  { size: 54, top: '4%',   left: '-3%',  color: '#A5E3DC', opacity: 0.55, rot: -20 },
  { size: 34, top: '18%',  right: '2%',  color: '#BFE0F5', opacity: 0.60, rot: 26 },
  { size: 26, top: '46%',  left: '2%',   color: '#C9BDF2', opacity: 0.45, rot: 12 },
  { size: 44, bottom: '18%', right: '-2%', color: '#A5E3DC', opacity: 0.42, rot: -34 },
  { size: 30, bottom: '4%',  left: '6%',  color: '#BFE0F5', opacity: 0.50, rot: 40 },
  { size: 20, top: '62%',  right: '9%',  color: '#A5E3DC', opacity: 0.38, rot: -8 },
];

const Auth = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  /* Código de recuperación recién creado: se enseña antes de entrar. */
  const [codigoNuevo, setCodigoNuevo] = useState(null);
  const [codigoGuardado, setCodigoGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const users = storage.getUsers();

      if (isRegister) {
        if (users.find(u => u.email === formData.email)) {
          setError(t('auth.errEmailTaken'));
          return;
        }
        const id = Date.now().toString();
        /* Sortea la clave de datos, la envuelve con la contraseña y abre la
           bóveda. El código de recuperación viene aparte y no se guarda. */
        const { recoveryCode, ...claves } = await vault.createSession(id, formData.password);
        const newUser = { id, email: formData.email, ...claves };
        storage.saveUser(newUser);
        /* No se entra todavía: primero hay que enseñar el código. */
        setCodigoNuevo({ codigo: recoveryCode, usuario: newUser });
      } else {
        const candidate = users.find(u => u.email === formData.email);
        // openSession valida la contraseña y descifra el expediente. Devuelve el
        // usuario ya migrado al esquema cifrado si venía de una versión antigua.
        const opened = candidate ? await vault.openSession(candidate, formData.password) : null;
        if (opened) {
          storage.updateUser(opened);
          login(opened);
        } else {
          setError(t('auth.errBadCredentials'));
        }
      }
    } catch (err) {
      console.error('[AURA] Error de autenticación:', err);
      setError(t('auth.errGeneric'));
    } finally {
      setLoading(false);
    }
  };

  /* ── El código de recuperación, una sola vez ────────────────────────────
     Se enseña entre crear la cuenta y entrar en ella. No hay «verlo más
     tarde»: de él solo queda guardada la clave de datos envuelta, que sin el
     código no abre. Por eso la casilla es obligatoria — no para cubrirnos,
     sino porque quien pase de largo pierde la única red que tiene. */
  if (codigoNuevo) {
    return (
      <div className="auth-container fade-in" style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
        background: 'var(--aura-black)', padding: '1.5rem',
      }}>
        <div className="aura-card" style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <KeyRound size={30} color="var(--gold-ink)" style={{ marginBottom: '0.9rem' }} />
            <h2 style={{ fontSize: '1.45rem', margin: '0 0 0.5rem' }}>{t('recoveryCode.title')}</h2>
            <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--ink-body)' }}>
              {t('recoveryCode.intro')}
            </p>
            {/* Que se enseña una sola vez va aparte y en gris: es un aviso
                práctico, no la razón por la que hay que guardarlo. La razón va
                arriba, con el peso que merece. */}
            <p style={{ margin: '0.7rem 0 0', fontSize: '0.75rem', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
              {t('recoveryCode.once')}
            </p>
          </div>

          <div style={{
            background: 'var(--bg-soft)', border: '1.5px solid var(--border-strong)',
            borderRadius: 12, padding: '1.2rem', textAlign: 'center', marginBottom: '1rem',
          }}>
            <p style={{
              margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '1.1rem',
              fontWeight: 700, letterSpacing: '2px', color: 'var(--ink)', wordBreak: 'break-all',
            }}>
              {codigoNuevo.codigo}
            </p>
          </div>

          <button
            type="button"
            className="btn-aura btn-ghost"
            style={{ width: '100%', marginBottom: '1.4rem', fontSize: '0.72rem' }}
            onClick={() => {
              navigator.clipboard?.writeText(codigoNuevo.codigo)
                .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500); })
                .catch(() => {});
            }}
          >
            {copiado ? t('recoveryCode.copied') : t('recoveryCode.copy')}
          </button>

          {/* Dónde guardarlo y quién puede usarlo. */}
          <div style={{
            display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
            padding: '0.9rem 1rem', marginBottom: '0.8rem',
            background: 'rgba(240, 167, 60, 0.10)', borderLeft: '3px solid var(--warn)',
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
              {t('recoveryCode.warning')}
            </p>
          </div>

          {/* ── Y qué pasa si lo pierdes ──────────────────────────────────────
              Esto iba en gris pequeño junto al «solo se enseña una vez», y no
              es un detalle: es el único estado del que no se sale. Perder el
              código no duele el día que pasa —la contraseña sigue en la
              cabeza— y por eso nadie corre a reponerlo. El daño llega meses
              después, cuando la contraseña se olvida y ya no hay con qué
              abrir. Hay que decirlo cuando todavía se puede arreglar. */}
          <div style={{
            display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
            padding: '0.9rem 1rem', marginBottom: '1.4rem',
            background: 'rgba(239, 95, 122, 0.10)', borderLeft: '3px solid var(--danger)',
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
              <strong style={{ color: '#B3324C' }}>{t('recoveryCode.lostTitle')}</strong>{' '}
              {t('recoveryCode.lostBody')}
            </p>
          </div>

          <label style={{
            display: 'flex', gap: '0.7rem', alignItems: 'flex-start', cursor: 'pointer',
            fontSize: '0.8rem', lineHeight: 1.6, color: 'var(--ink-body)', marginBottom: '1.4rem',
          }}>
            <input
              type="checkbox"
              checked={codigoGuardado}
              onChange={e => setCodigoGuardado(e.target.checked)}
              style={{ marginTop: 3, accentColor: 'var(--violet)', width: 16, height: 16, flexShrink: 0 }}
            />
            <span>{t('recoveryCode.confirm')}</span>
          </label>

          <button
            type="button"
            className="btn-aura"
            style={{ width: '100%', padding: '1.1rem', opacity: codigoGuardado ? 1 : 0.5 }}
            disabled={!codigoGuardado}
            onClick={() => login(codigoNuevo.usuario)}
          >
            {t('recoveryCode.continue')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <IntroVideoModal
      isOpen={showIntroModal}
      onContinue={() => { setShowIntroModal(false); setIsRegister(true); }}
    />
    <div className="auth-container fade-in" style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh',
      background: 'var(--aura-black)',
      padding: '1.5rem'
    }}>
      <div className="aura-card" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', position: 'relative' }}>
        {AUTH_BLOBS.map((b, i) => (
          <Blob key={`b${i}`} size={b.size} color={b.color}
            style={{ top: b.top, left: b.left, right: b.right, bottom: b.bottom, opacity: b.opacity, zIndex: 0 }} />
        ))}

        {/* Avión con estela de corazón, arriba a la derecha */}
        <PlaneTrail size={118} style={{ position: 'absolute', top: '3%', right: '-4%', color: 'var(--violet)', opacity: 0.65, zIndex: 0, pointerEvents: 'none' }} />
        {/* Corazón suelto, abajo a la izquierda */}
        <HeartOutline size={30} style={{ position: 'absolute', bottom: '9%', left: '4%', color: '#F19FB8', opacity: 0.75, zIndex: 0, pointerEvents: 'none' }} />

        {AUTH_PAWS.map((h, i) => (
          <PawPrint
            key={i}
            size={h.size}
            style={{
              position: 'absolute', top: h.top, left: h.left, right: h.right, bottom: h.bottom,
              color: h.color, opacity: h.opacity, transform: `rotate(${h.rot}deg)`,
              pointerEvents: 'none', zIndex: 0,
            }}
          />
        ))}
        <div style={{ position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '3.5rem' }}>
          <div style={{ position: 'relative', display: 'block', width: 'fit-content', marginInline: 'auto', marginBottom: '0.9rem' }}>
              <Sparkle size={15} style={{ position: 'absolute', top: '4%',  left: '-2%',  color: '#FCE1A8', zIndex: 2 }} />
              <Sparkle size={11} style={{ position: 'absolute', top: '20%', right: '-4%', color: '#C9BDF2', zIndex: 2 }} />
              <Rays size={38} style={{ position: 'absolute', top: '26%', left: '-30%', transform: 'scaleX(-1)', zIndex: 2 }} />
              <img
                src={logo}
                alt="Aura Pets Global"
                style={{
                  height: 'clamp(120px, 22vw, 158px)',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                  filter: 'drop-shadow(0 10px 22px rgba(42, 45, 124, 0.14))',
                }}
              />
            </div>

          {/* Distintivo: las dos pantallas comparten formulario, así que sin
              una señal visible el usuario no sabe en cuál está. */}
          {isRegister && (
            <div style={{
              display: 'inline-block',
              margin: '0.4rem 0 0.9rem',
              padding: '0.3rem 0.9rem',
              border: '1px solid var(--aura-gold)',
              borderRadius: '2rem',
              color: 'var(--gold-ink)',
              fontSize: '0.65rem',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: 600,
              background: 'rgba(217, 164, 65, 0.08)',
            }}>
              {t('auth.badgeNew')}
            </div>
          )}

          <p style={{ color: 'var(--ink)', fontSize: '0.78rem', letterSpacing: '2.6px', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>
              {isRegister ? t('auth.taglineRegister') : t('auth.taglineLogin')}
            </p>
            {!isRegister && (
              <p className="aura-script" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', margin: '0.1rem 0 0' }}>
                {t('auth.taglineScript')}
              </p>
            )}
            <div className="aura-rainbow-rule" style={{ width: 118, height: 4, margin: '0.9rem auto 0' }} />

          {isRegister && (
            <p style={{
              color: 'var(--aura-text-muted)', fontSize: '0.78rem',
              lineHeight: 1.6, margin: '0.8rem auto 0', maxWidth: '30ch', opacity: 0.8,
            }}>
              {t('auth.registerHint')}
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', textAlign: 'left' }}>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--gold-ink)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '1px' }}>
              <Mail size={16} /> {t('auth.emailLabel')}
            </label>
            <input 
              type="email" 
              required
              placeholder={t('auth.emailPlaceholder')}
              style={{ 
                width: '100%', background: '#FFFFFF', border: '1px solid var(--aura-border)', 
                padding: '1.2rem', color: 'var(--ink)', fontSize: '1rem', outline: 'none'
              }}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--gold-ink)', fontWeight: 500, fontSize: '0.8rem', letterSpacing: '1px' }}>
              <Lock size={16} /> {t('auth.passLabel')}
            </label>
            <input 
              type="password" 
              required
              placeholder="••••••••"
              style={{ 
                width: '100%', background: '#FFFFFF', border: '1px solid var(--aura-border)', 
                padding: '1.2rem', color: 'var(--ink)', fontSize: '1rem', outline: 'none'
              }}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {/* ── El aviso que hay que leer antes, no después ──────────────
                Iba en gris claro, a 0,73 rem, debajo del campo: del tamaño y
                del color de una nota al pie. Y lo que dice no es una nota al
                pie, es la regla que gobierna todo lo demás — quien pierde las
                dos llaves pierde el expediente, y no hay nada que podamos
                hacer. Un aviso que nadie lee es un aviso que no existe.

                El texto también estaba desfasado: decía que olvidar la
                contraseña era perderlo todo, y desde que hay código de
                recuperación eso ya no es exacto. Media verdad en un aviso de
                este peso es peor que ninguna. */}
            {isRegister && (
              <div style={{
                margin: '1.1rem 0 0',
                padding: '1rem 1.1rem',
                background: 'rgba(240, 167, 60, 0.12)',
                border: '1.5px solid rgba(240, 167, 60, 0.55)',
                borderRadius: 10,
                textAlign: 'left',
              }}>
                <p style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700,
                  color: 'var(--gold-ink)',
                }}>
                  <KeyRound size={15} style={{ flexShrink: 0 }} />
                  {t('auth.warnTitle')}
                </p>
                <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
                  {t('auth.warnBody')}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
                  <strong>{t('auth.warnNoBackdoor')}</strong>
                </p>
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              padding: '1rem', background: 'rgba(236, 92, 141, 0.05)', border: '1px solid var(--aura-neon-pink)',
              color: 'var(--pink-ink)', fontSize: '0.8rem', textAlign: 'center', letterSpacing: '1px'
            }}>
              {error.toUpperCase()}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-aura"
            style={{ padding: '1.2rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem' }}>
            <PawPrint size={17} />
            {loading
              ? t(isRegister ? 'auth.btnCreating' : 'auth.btnEntering')
              : t(isRegister ? 'auth.btnCreate'   : 'auth.btnEnter')}
          </button>
        </form>

        <footer style={{ marginTop: '2.5rem', display: 'grid', gap: '0.8rem', justifyItems: 'center' }}>
          <button
            style={{
              background: 'none', border: 'none', color: 'var(--aura-text-muted)',
              fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', letterSpacing: '1px'
            }}
            onClick={() => {
              if (!isRegister) {
                setShowIntroModal(true);
              } else {
                setIsRegister(false);
              }
            }}
          >
            {t(isRegister ? 'auth.switchToLogin' : 'auth.switchToRegister')}
          </button>
          {!isRegister && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', maxWidth: 300, margin: '0.2rem 0' }}>
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <PawPrint size={13} style={{ color: 'var(--pastel-lavender)', flexShrink: 0 }} />
                <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
            )}
            {/* Con <a href="/recuperar-acceso"> no pasaba nada, y era por el
                tipo de enrutador. La aplicación usa HashRouter, donde las
                rutas viven detrás de la almohadilla: #/recuperar-acceso. Un
                enlace absoluto hacía que el navegador pidiera al servidor una
                página que no existe, éste devolvía el index de siempre, y la
                app volvía a arrancar en la pantalla de acceso. Desde fuera,
                pulsar el enlace no hacía nada.

                <Link> deja que sea el enrutador quien navegue, así que
                funciona con el que haya montado. */}
            {!isRegister && (
              <Link
                to="/recuperar-acceso"
              style={{
                color: 'var(--gold-ink)', fontSize: '0.75rem', letterSpacing: '1.5px',
                textDecoration: 'none', opacity: 0.75, fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.75'}
            >
              {t('auth.forgot')}
            </Link>
          )}
        </footer>
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
