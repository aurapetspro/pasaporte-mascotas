import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import logo from '../../assets/logo-aura.png';
import { useTranslation } from '../../context/LocalizationContext';
import { vault } from '../../utils/vault';
import { storage } from '../../utils/storage';

/* ══════════════════════════════════════════════════════════════════════════
   Recuperar acceso
   Ruta: /recuperar-acceso

   Antes esto era un simulacro. Generaba un código de seis cifras, lo enseñaba
   en la propia pantalla —no hay servidor que mande correos— y al terminar
   BORRABA el expediente entero, porque la contraseña era la clave de los
   datos y sin ella no había nada que descifrar. Es decir: pedía un código a
   quien ya lo estaba viendo, para después perderlo todo.

   Ahora el código de recuperación es real. Se entrega al crear la cuenta, no
   se guarda en ninguna parte, y abre una segunda envoltura de la misma clave
   de datos. Por eso recuperar el acceso ya no cuesta el expediente.

   Dos pasos:
     1 — correo y código de recuperación
     2 — contraseña nueva
   ══════════════════════════════════════════════════════════════════════════ */
const RecuperarAcceso = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [step,      setStep]      = useState(1);
  const [email,     setEmail]     = useState('');
  const [code,      setCode]      = useState('');
  const [newPass,   setNewPass]   = useState('');
  const [newPass2,  setNewPass2]  = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [cuenta,    setCuenta]    = useState(null);   // usuario localizado en el paso 1

  const campo = { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem',
    color: 'var(--gold-ink)', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600 };

  /* ── Paso 1 ──────────────────────────────────────────────────────────────
     Se localiza la cuenta y se comprueba que tenga código de recuperación.
     No se valida aquí el código en sí: eso lo hace el desenvuelto de la clave
     en el paso siguiente, que es donde de verdad se autentica. */
  const handleBuscarCuenta = (e) => {
    e.preventDefault();
    setError('');

    const users = storage.getUsers();
    const user = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

    if (!user) { setError(t('recover.errNoAccount')); return; }
    if (!user.wrappedDekRecovery) { setError(t('recover.errNoRecoveryCode')); return; }

    setCuenta(user);
    setStep(2);
  };

  /* ── Paso 2 ──────────────────────────────────────────────────────────── */
  const handleRecuperar = async (e) => {
    e.preventDefault();
    setError('');

    if (newPass.length < 6)    { setError(t('recover.errShort'));    return; }
    if (newPass !== newPass2)  { setError(t('recover.errMismatch')); return; }

    setLoading(true);
    try {
      const actualizado = await vault.recoverWithCode(cuenta, code, newPass);
      if (!actualizado) { setError(t('recover.errWrongCode')); return; }

      storage.updateUser(actualizado);
      vault.lock();   // que entre de forma explícita con la contraseña nueva
      setStep(3);
    } catch {
      setError(t('recover.errUpdate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'var(--aura-black)', padding: '1.5rem',
    }}>
      <div className="aura-card" style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
        <header style={{ marginBottom: '2.5rem' }}>
          <img src={logo} alt="AURA" style={{ height: 58, marginBottom: '1.5rem', filter: 'drop-shadow(0 0 10px rgba(217, 164, 65, 0.35))' }} />
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 0.4rem' }}>
            {t('recover.titleLead')} <span style={{ color: 'var(--gold-ink)' }}>{t('recover.titleAccent')}</span>
          </h1>
          <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.75rem', letterSpacing: '2px', margin: 0 }}>
            {t('recover.subtitle')}
          </p>
        </header>

        <AnimatePresence mode="wait">

          {/* ── Paso 1: correo ── */}
          {step === 1 && (
            <motion.form key="s1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleBuscarCuenta}
              style={{ display: 'grid', gap: '1.5rem', textAlign: 'left' }}
            >
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-body)', lineHeight: 1.7, textAlign: 'center' }}>
                {t('recover.step1Intro')}
              </p>
              <div className="input-group">
                <label style={campo}><Mail size={14} /> {t('auth.emailLabel')}</label>
                <input type="email" required className="aura-input"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {error && <p style={{ color: 'var(--pink-ink)', fontSize: '0.78rem', margin: 0, lineHeight: 1.6 }}>{error}</p>}
              <button type="submit" className="btn-aura" style={{ padding: '1.1rem', width: '100%' }}>
                {t('recover.btnContinue')}
              </button>
            </motion.form>
          )}

          {/* ── Paso 2: código y contraseña nueva ── */}
          {step === 2 && (
            <motion.form key="s2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRecuperar}
              style={{ display: 'grid', gap: '1.5rem', textAlign: 'left' }}
            >
              {/* Lo contrario del aviso que había antes: aquí no se pierde nada */}
              <div style={{
                display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
                padding: '1rem 1.1rem', background: 'rgba(63, 191, 160, 0.08)',
                border: '1px solid rgba(63, 191, 160, 0.35)', borderRadius: '0.6rem',
              }}>
                <CheckCircle2 size={17} color="var(--ok)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
                  {t('recover.keepsData')}
                </p>
              </div>

              <div className="input-group">
                <label style={campo}><KeyRound size={14} /> {t('recover.codeLabel')}</label>
                <input type="text" required className="aura-input"
                  placeholder="AURA-XXXX-XXXX-XXXX-XXXX"
                  value={code} onChange={e => setCode(e.target.value)}
                  style={{ letterSpacing: '1px' }} />
                <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.5 }}>
                  {t('recover.codeHint')}
                </p>
              </div>

              <div className="input-group">
                <label style={campo}>{t('recover.newPass')}</label>
                <input type="password" required className="aura-input" placeholder="••••••••"
                  value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <div className="input-group">
                <label style={{ ...campo, display: 'block' }}>{t('recover.confirmPass')}</label>
                <input type="password" required className="aura-input" placeholder="••••••••"
                  value={newPass2} onChange={e => setNewPass2(e.target.value)} />
              </div>

              {error && <p style={{ color: 'var(--pink-ink)', fontSize: '0.78rem', margin: 0, lineHeight: 1.6 }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-aura" style={{ padding: '1.1rem', width: '100%' }}>
                {loading ? t('recover.btnSetting') : t('recover.btnSet')}
              </button>
            </motion.form>
          )}

          {/* ── Paso 3: hecho ── */}
          {step === 3 && (
            <motion.div key="s3"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: 'grid', gap: '1.5rem' }}
            >
              <CheckCircle2 size={56} color="var(--ok)" style={{ margin: '0 auto' }} />
              <h2 style={{ color: 'var(--cyan-ink)', margin: 0 }}>{t('recover.doneTitle')}</h2>
              <p style={{ color: 'var(--ink-body)', fontSize: '0.82rem', margin: 0, lineHeight: 1.7 }}>
                {t('recover.doneBody')}
              </p>
              <div style={{
                display: 'flex', gap: '0.8rem', alignItems: 'flex-start', textAlign: 'left',
                padding: '0.9rem 1rem', background: 'rgba(240, 167, 60, 0.10)',
                borderLeft: '3px solid var(--warn)', borderRadius: '0 8px 8px 0',
              }}>
                <AlertTriangle size={16} color="var(--gold-ink)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.6, color: 'var(--ink-body)' }}>
                  {t('recover.doneNewCode')}
                </p>
              </div>
              <button className="btn-aura" style={{ padding: '1.1rem' }} onClick={() => navigate('/')}>
                {t('recover.btnGo')}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {step < 3 && (
          <button
            style={{ background: 'none', border: 'none', color: 'var(--aura-text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '2rem auto 0' }}
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}
          >
            <ArrowLeft size={13} /> {t(step > 1 ? 'recover.back' : 'recover.backToLogin')}
          </button>
        )}
      </div>
    </div>
  );
};

export default RecuperarAcceso;
