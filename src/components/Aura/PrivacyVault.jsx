import React, { useState } from 'react';
import { ShieldCheck, Lock, EyeOff, Download, Trash2, ChevronRight, FileText, AlertTriangle, ExternalLink, X, BookOpen, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../utils/storage';
import { vault } from '../../utils/vault';
import jsPDF from 'jspdf';
import { PawScatter } from './Decorations';

/* ── JSON download helper ── */
/**
 * Descarga un objeto como fichero JSON.
 *
 * Dos detalles que parecen menores y rompen la descarga entera:
 *
 *   1. El enlace tiene que estar en el documento. Varios navegadores ignoran
 *      click() sobre un elemento que nunca se insertó en la página.
 *   2. La URL del blob no puede liberarse en la misma vuelta. La descarga
 *      arranca de forma asíncrona, así que revocarla justo después del clic
 *      deja al navegador sin nada que leer: el fichero llega vacío o no se
 *      abre. Se libera más tarde, cuando ya se ha leído.
 */
const downloadJSON = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: filename, rel: 'noopener',
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

/* ── Premium jsPDF medical record ── */
const generateMedicalPDF = (pets, userEmail, t, locale, unidadPeso) => {
  const doc  = new jsPDF('p', 'mm', 'a4');
  const W    = 210;
  const date = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB');

  doc.setFillColor(212, 175, 55);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(10, 10, 15);
  doc.text(t('vaultPdf.header'), 105, 14, { align: 'center' });

  doc.setFillColor(10, 10, 15);
  doc.rect(0, 22, W, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(180, 160, 80);
  doc.text(t('vaultPdf.band', { fecha: date }), 105, 27.5, { align: 'center' });

  let y = 40;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(t('vaultPdf.holder', { correo: userEmail || t('vaultPdf.notRegistered') }), 15, y);
  y += 12;

  if (!pets.length) {
    doc.text(t('vaultPdf.noPets'), 15, y);
    doc.save('AURA_Expediente_Medico.pdf');
    return;
  }

  for (const pet of pets) {
    doc.setFillColor(20, 20, 28);
    doc.roundedRect(10, y, W - 20, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.text(`${pet.avatar || '🐾'} ${pet.name?.toUpperCase() || t('common.noName').toUpperCase()}`, 15, y + 7);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    const fields = [
      [t('vaultPdf.fSpecies'),   pet.speciesLabel || pet.species || '—'],
      [t('vaultPdf.fAge'),       pet.age || '—'],
      [t('vaultPdf.fWeight'),    pet.weight ? `${pet.weight} ${unidadPeso}` : '—'],
      [t('vaultPdf.fMicrochip'), pet.microchip || t('vaultPdf.notRegistered')],
    ];
    for (const [label, value] of fields) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 55, y);
      y += 6;
    }

    const h  = pet.health || {};
    const rv = h.rabiesVaccine    || {};
    const ep = h.europeanPassport || {};
    const hc = h.healthCert       || {};

    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55);
    doc.text(t('vaultPdf.sectionDocs'), 15, y);
    y += 6;
    doc.setTextColor(50, 50, 50);

    const docs = [
      [t('vaultPdf.rabies'),     rv.status === 'ok' ? (rv.expiry ? t('vaultPdf.validUntil', { fecha: rv.expiry }) : t('vaultPdf.completed')) : t('vaultPdf.pending')],
      [t('vaultPdf.euPassport'), ep.status === 'ok' ? (ep.number || t('vaultPdf.registered')) : t('vaultPdf.pending')],
      [t('vaultPdf.healthCert'), hc.status === 'ok' ? t('vaultPdf.issued') : t('vaultPdf.pending')],
    ];
    for (const [label, value] of docs) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 15, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, y);
      y += 6;
    }

    const ec = pet.emergencyConfig;
    if (ec?.medicalAlerts) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 0, 60);
      doc.text(t('vaultPdf.alerts'), 15, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      const lines = doc.splitTextToSize(ec.medicalAlerts, W - 30);
      doc.text(lines, 15, y);
      y += lines.length * 5;
    }

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.3);
    doc.line(10, y + 2, W - 10, y + 2);
    y += 10;

    if (y > 260) { doc.addPage(); y = 20; }
  }

  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(t('vaultPdf.footer', { fecha: date }), 105, 288, { align: 'center' });

  doc.save(`${t('vaultPdf.fileName')}_${date.replace(/\//g, '-')}.pdf`);
};

/* ── Legal content — locale-aware ── */
const getLegalContent = (locale) => {
  const es = locale === 'es';
  return {
    hipaa: {
      title: 'HIPAA — Health Insurance Portability and Accountability Act',
      accentColor: '#C9A84C',
      icon: <Lock size={22} />,
      cardDesc: es
        ? 'Protege la privacidad y seguridad de la información médica de los pacientes en EE.UU. Otorga a los pacientes el derecho a acceder a sus registros, solicitar correcciones y saber quién ha accedido a sus datos.'
        : 'Protects the privacy and security of patients medical information in the USA. Grants patients the right to access their health records, request corrections, and know who has accessed their data.',
      sections: [
        {
          label: es ? '¿Qué protege?' : 'What it protects',
          text: es
            ? 'Registros médicos, información de facturación, historial de salud, resultados de pruebas'
            : 'Medical records, billing information, health history, test results',
        },
        {
          label: es ? '¿A quién aplica?' : 'Who it applies to',
          text: es
            ? 'Hospitales, clínicas, aseguradoras y cualquier app que maneje datos de salud'
            : 'Hospitals, clinics, insurers, and any app handling health data',
        },
        {
          label: es ? 'Tus derechos' : 'Your rights',
          text: es
            ? '• Acceder a tus registros\n• Solicitar correcciones\n• Saber quién accedió a tus datos\n• Presentar quejas'
            : '• Access your records\n• Request corrections\n• Know who accessed your data\n• File complaints',
        },
      ],
      readLabel: es ? 'Ver ficha completa' : 'Read full brief',
      faqLabel: es ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED',
      faq: [
        {
          q: es ? '¿HIPAA se aplica a los datos de mi mascota?' : 'Does HIPAA apply to my pet’s data?',
          a: es
            ? 'No. HIPAA protege información sanitaria de personas, no de animales. Los expedientes veterinarios no son PHI y ninguna ley federal estadounidense los regula del mismo modo. AURA Pets aplica igualmente el mismo estándar técnico de protección, por decisión propia y no por obligación legal.'
            : 'No. HIPAA protects human health information, not animal records. Veterinary files are not PHI and no US federal law regulates them the same way. AURA Pets applies the same technical protection standard anyway, by choice rather than obligation.',
        },
        {
          q: es ? '¿Qué es exactamente PHI?' : 'What exactly is PHI?',
          a: es
            ? 'Protected Health Information: cualquier dato de salud que permita identificar a una persona concreta. Incluye diagnósticos, tratamientos, facturación médica y resultados de pruebas cuando van unidos a un nombre, una dirección o un número de historia clínica.'
            : 'Protected Health Information: any health data that identifies a specific person. It covers diagnoses, treatments, medical billing and test results whenever they are tied to a name, an address or a medical record number.',
        },
        {
          q: es ? 'Soy veterinario y uso AURA. ¿Tengo obligaciones HIPAA?' : 'I am a vet using AURA. Do I have HIPAA duties?',
          a: es
            ? 'Por los datos del animal, no. Sí las tendrías si además tratases información sanitaria de personas —por ejemplo, si tu clínica gestiona datos médicos de los propietarios. En ese caso la obligación nace de esos datos humanos, nunca del expediente del animal.'
            : 'Not for the animal’s data. You would have duties if you also handled human health information — for instance, if your practice manages owners’ medical data. The obligation would come from that human data, never from the pet record.',
        },
        {
          q: es ? '¿Cómo protege AURA los datos sin estar obligada?' : 'How does AURA protect data without being obliged to?',
          a: es
            ? 'Cifrado AES-256-GCM en tu propio dispositivo, con una clave derivada de tu contraseña que nunca se almacena ni se transmite. No hay servidores propios, no hay copia en la nube y ninguna petición de red transporta información de tus animales.'
            : 'AES-256-GCM encryption on your own device, with a key derived from your password that is never stored or transmitted. There are no servers of ours, no cloud copy, and no network request carries your animals’ information.',
        },
      ],
    },
    gdpr: {
      title: 'GDPR — General Data Protection Regulation',
      accentColor: '#8B5CF6',
      icon: <EyeOff size={22} />,
      cardDesc: es
        ? 'Protege los datos personales y la privacidad de los ciudadanos de la UE. Los usuarios tienen derecho a acceder, corregir, eliminar y transferir sus datos.'
        : 'Protects personal data and privacy of EU citizens. Gives users the right to access, correct, delete and transfer their data. Organizations must report breaches within 72 hours.',
      sections: [
        {
          label: es ? '¿Qué protege?' : 'What it protects',
          text: es
            ? 'Nombre, email, ubicación, datos de salud, comportamiento de navegación, identificadores de dispositivo'
            : 'Name, email, location, health data, browsing behavior, device identifiers',
        },
        {
          label: es ? '¿A quién aplica?' : 'Who it applies to',
          text: es
            ? 'Cualquier organización que procese datos de residentes de la UE, sin importar dónde esté ubicada'
            : 'Any organization processing data of EU residents, regardless of where they are based',
        },
        {
          label: es ? 'Tus derechos' : 'Your rights',
          text: es
            ? '• Acceso\n• Rectificación\n• Supresión (derecho al olvido)\n• Portabilidad de datos\n• Retirar el consentimiento'
            : '• Access\n• Rectification\n• Erasure (right to be forgotten)\n• Data portability\n• Withdraw consent',
        },
      ],
      readLabel: es ? 'Ver ficha completa' : 'Read full brief',
      faqLabel: es ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED',
      faq: [
        {
          q: es ? '¿Los datos de mi mascota son datos personales?' : 'Is my pet’s data personal data?',
          a: es
            ? 'El animal no es titular de derechos, pero su expediente va unido a datos que sí te identifican a ti: tu email, tu ubicación, el número de microchip registrado a tu nombre. Por esa vía el conjunto sí queda amparado por el GDPR, y así lo trata AURA Pets.'
            : 'The animal is not a rights holder, but its record is tied to data that identifies you: your email, your location, the microchip number registered in your name. Through that link the whole set does fall under GDPR, and AURA Pets treats it accordingly.',
        },
        {
          q: es ? '¿Qué es el derecho al olvido y cómo lo ejerzo?' : 'What is the right to erasure and how do I use it?',
          a: es
            ? 'Es el artículo 17 del GDPR: puedes exigir que tus datos se borren por completo. En AURA lo ejerces desde esta misma pantalla, en Destrucción Certificada. Requiere doble confirmación por palabra clave porque es irreversible: no hay copia de seguridad de la que recuperarlos.'
            : 'It is GDPR Article 17: you can demand your data be fully deleted. In AURA you exercise it from this very screen, under Certified Destruction. It requires double keyword confirmation because it is irreversible: there is no backup to restore from.',
        },
        {
          q: es ? '¿Cómo ejerzo la portabilidad de mis datos?' : 'How do I exercise data portability?',
          a: es
            ? 'Artículo 20. Pulsa Exportar datos en esta pantalla y obtendrás un fichero JSON con todo tu contenido en formato abierto y legible por máquina, listo para llevártelo a otro servicio o para guardarlo por tu cuenta.'
            : 'Article 20. Press Export data on this screen and you get a JSON file with all your content in an open, machine-readable format, ready to take to another service or keep for yourself.',
        },
        {
          q: es ? '¿AURA Pets necesita un Delegado de Protección de Datos?' : 'Does AURA Pets need a Data Protection Officer?',
          a: es
            ? 'No. La figura del DPO es obligatoria para autoridades públicas y para quien trate datos sensibles a gran escala o haga observación sistemática de personas. AURA no trata datos en ningún servidor: el tratamiento ocurre íntegramente en tu dispositivo.'
            : 'No. A DPO is mandatory for public authorities and for those processing sensitive data at scale or systematically monitoring individuals. AURA processes no data on any server: processing happens entirely on your device.',
        },
        {
          q: es ? '¿Dónde se almacenan realmente mis datos?' : 'Where is my data actually stored?',
          a: es
            ? 'En el almacenamiento local de tu navegador, cifrados con AES-256-GCM. No se sincronizan, no se suben a ninguna nube y no viajan entre dispositivos. Si borras los datos del navegador o cambias de equipo sin exportar antes, se pierden: es el precio de que nadie más pueda leerlos.'
            : 'In your browser’s local storage, encrypted with AES-256-GCM. They are not synced, not uploaded to any cloud and never travel between devices. If you clear browser data or switch machines without exporting first, they are gone: that is the price of nobody else being able to read them.',
        },
      ],
    },
  };
};

/* ════════════════ Legal Info Modal — contenido local, sin red ════════════════ */
const LegalInfoModal = ({ type, onClose }) => {
  const { locale } = useTranslation();
  const es = locale === 'es';
  const content = getLegalContent(locale)[type];
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42, 45, 124, 0.42)',
        backdropFilter: 'blur(18px)', zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF7FE 100%)',
          border: `1px solid ${content.accentColor}40`,
          borderRadius: '1.2rem',
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 24px 80px rgba(42, 45, 124, 0.42), 0 0 40px ${content.accentColor}18`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.9rem',
          padding: '1.4rem 1.6rem',
          borderBottom: `1px solid ${content.accentColor}25`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `${content.accentColor}18`,
            border: `1px solid ${content.accentColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: content.accentColor, flexShrink: 0,
          }}>
            {content.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              margin: 0, fontSize: 'clamp(0.85rem, 2.5vw, 1.05rem)',
              color: content.accentColor, fontWeight: 700, lineHeight: 1.3,
              textShadow: `0 0 16px ${content.accentColor}50`,
            }}>
              {content.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={es ? 'Cerrar' : 'Close'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--aura-text-muted)', padding: '0.3rem', flexShrink: 0,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

          {/* Legal summary sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {content.sections.map((s, i) => (
              <div key={i} style={{
                background: `${content.accentColor}08`,
                border: `1px solid ${content.accentColor}20`,
                borderRadius: '0.8rem',
                padding: '1rem 1.2rem',
              }}>
                <p style={{
                  margin: '0 0 0.4rem',
                  fontSize: '0.68rem',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: content.accentColor,
                  fontWeight: 700,
                }}>
                  {s.label}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  color: 'var(--aura-text-muted)',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-line',
                }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            color: 'var(--aura-text-muted)', fontSize: '0.72rem', letterSpacing: '2px',
          }}>
            <div style={{ flex: 1, height: 1, background: `${content.accentColor}20` }} />
            <BookOpen size={13} color={content.accentColor} />
            <span style={{ color: content.accentColor }}>{content.faqLabel}</span>
            <div style={{ flex: 1, height: 1, background: `${content.accentColor}20` }} />
          </div>

          {/* FAQ — contenido local, sin ninguna llamada de red */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {content.faq.map((item, i) => {
              const open = openIdx === i;
              return (
                <div key={i} style={{
                  border: `1px solid ${open ? `${content.accentColor}40` : '#FFFFFF'}`,
                  borderRadius: '0.7rem',
                  background: open ? `${content.accentColor}0A` : '#FFFFFF',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}>
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', gap: '0.8rem',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: '0.85rem 1.1rem',
                      textAlign: 'left',
                      color: open ? content.accentColor : '#FFFFFF',
                      fontSize: '0.83rem',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ flex: 1 }}>{item.q}</span>
                    <ChevronRight
                      size={15}
                      style={{
                        flexShrink: 0,
                        transform: open ? 'rotate(90deg)' : 'none',
                        transition: 'transform 0.2s',
                        opacity: 0.8,
                      }}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        style={{ overflow: 'hidden' }}
                      >
                        <p style={{
                          margin: 0,
                          padding: '0 1.1rem 1rem',
                          fontSize: '0.82rem',
                          lineHeight: 1.75,
                          color: 'var(--aura-text-muted)',
                        }}>
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          padding: '0.9rem 1.6rem',
          borderTop: `1px solid ${content.accentColor}20`,
          flexShrink: 0,
          background: 'var(--bg-soft)',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <Lock size={12} color={content.accentColor} style={{ flexShrink: 0, opacity: 0.8 }} />
          <p style={{
            margin: 0,
            fontSize: '0.7rem',
            lineHeight: 1.6,
            color: 'var(--aura-text-muted)',
            opacity: 0.85,
          }}>
            {es
              ? 'Información general orientativa, no asesoramiento jurídico. Se muestra desde tu dispositivo, sin consultar ningún servicio externo.'
              : 'General guidance, not legal advice. Served from your device, with no external service consulted.'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ════════════════ Destruction Modal ════════════════ */
const DestructionModal = ({ onConfirm, onClose, locale }) => {
  const es = locale === 'es';
  const [step, setStep] = useState(1);
  const [typed, setTyped]   = useState('');
  const KEYWORD = es ? 'ELIMINAR' : 'DELETE';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(42, 45, 124, 0.42)',
        backdropFilter: 'blur(16px)', zIndex: 3000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="aura-card"
        style={{ maxWidth: 460, width: '100%', padding: '2.5rem' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid var(--aura-neon-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <AlertTriangle size={24} color="var(--aura-neon-pink)" />
        </div>
        <h2 style={{ textAlign: 'center', color: 'var(--pink-ink)', fontSize: '1.4rem', marginBottom: '1rem' }}>
          {es ? 'Destrucción Permanente de Datos' : 'Permanent Data Destruction'}
        </h2>

        {step === 1 && (
          <>
            <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.82rem', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center' }}>
              {es
                ? 'Esta acción eliminará permanentemente todos los expedientes médicos, documentación sanitaria y datos de mascotas. Es irreversible y cumple con el derecho al olvido GDPR/LOPD.'
                : 'This action permanently deletes all medical records, health documentation, and pet data. It is irreversible and complies with GDPR right to erasure.'}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-aura btn-ghost" style={{ flex: 1 }} onClick={onClose}>
                {es ? 'CANCELAR' : 'CANCEL'}
              </button>
              <button className="btn-aura btn-ghost"
                style={{ flex: 1, '--btn-accent': 'var(--danger)' }}
                onClick={() => setStep(2)}>
                {es ? 'CONTINUAR' : 'CONTINUE'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.82rem', lineHeight: 1.8, marginBottom: '1.2rem', textAlign: 'center' }}>
              {es ? `Escriba "${KEYWORD}" para confirmar:` : `Type "${KEYWORD}" to confirm:`}
            </p>
            <input
              className="aura-input"
              autoFocus
              placeholder={KEYWORD}
              value={typed}
              onChange={e => setTyped(e.target.value.toUpperCase())}
              style={{ marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 700 }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-aura btn-ghost" style={{ flex: 1 }} onClick={() => { setStep(1); setTyped(''); }}>
                {es ? 'ATRÁS' : 'BACK'}
              </button>
              <button className="btn-aura btn-ghost"
                style={{
                  flex: 2,
                  '--btn-accent': 'var(--danger)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                }}
                disabled={typed !== KEYWORD}
                onClick={onConfirm}>
                <Trash2 size={14} />
                {es ? 'DESTRUIR DATOS' : 'DESTROY DATA'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Seguridad de la cuenta

   Dos operaciones que con el esquema de cifrado anterior no podían existir:

   · Cambiar la contraseña. Antes la contraseña ERA la clave de los datos, así
     que cambiarla habría obligado a descifrar y volver a cifrar el expediente
     entero. Ahora solo se vuelve a envolver la misma clave de datos, y es
     instantáneo aunque haya cien fotos dentro.

   · Tener un código de recuperación. Antes, olvidar la contraseña era perder
     el expediente. Las cuentas creadas hoy reciben el código al darse de alta;
     las que vienen del esquema anterior no lo tienen, y aquí pueden crearlo.
   ════════════════════════════════════════════════════════════════════════════ */
const SeguridadCuenta = () => {
  const { locale, t } = useTranslation();
  const { user } = useAuth();
  const es = locale === 'es';

  const [abierto, setAbierto]   = useState(null);   // 'clave' | 'codigo' | null
  const [actual, setActual]     = useState('');
  const [nueva, setNueva]       = useState('');
  const [nueva2, setNueva2]     = useState('');
  const [aviso, setAviso]       = useState('');
  const [hecho, setHecho]       = useState('');
  const [codigo, setCodigo]     = useState(null);
  const [cargando, setCargando] = useState(false);

  const registro = storage.getUsers().find(u => u.id === user?.id);
  const tieneCodigo = !!registro?.wrappedDekRecovery;

  const limpiar = () => { setActual(''); setNueva(''); setNueva2(''); setAviso(''); };

  const cambiarClave = async (e) => {
    e.preventDefault();
    setAviso(''); setHecho('');
    if (nueva.length < 6)  { setAviso(t('recover.errShort'));    return; }
    if (nueva !== nueva2)  { setAviso(t('recover.errMismatch')); return; }

    setCargando(true);
    try {
      const actualizado = await vault.changePassword(registro, actual, nueva);
      if (!actualizado) { setAviso(t('security.errWrongCurrent')); return; }
      storage.updateUser(actualizado);
      limpiar();
      setAbierto(null);
      setHecho(t('security.passChanged'));
    } finally {
      setCargando(false);
    }
  };

  const generarCodigo = async () => {
    setAviso(''); setHecho('');
    setCargando(true);
    try {
      const nuevo = await vault.createRecoveryCode();
      if (!nuevo) { setAviso(t('errors.VaultLockedError')); return; }
      const { recoveryCode, ...envuelto } = nuevo;
      storage.updateUser({ ...registro, ...envuelto });
      setCodigo(recoveryCode);
      setAbierto('codigo');
    } finally {
      setCargando(false);
    }
  };

  const fila = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', textAlign: 'left',
  };

  return (
    <div className="aura-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
      <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>{t('security.title')}</h3>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {/* ── Cambiar la contraseña ── */}
        <button className="btn-aura" style={fila}
          onClick={() => { setAbierto(abierto === 'clave' ? null : 'clave'); limpiar(); setHecho(''); }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Lock size={16} />
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block' }}>{t('security.changePass')}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.85, letterSpacing: '0.5px' }}>
                {t('security.changePassHint')}
              </span>
            </div>
          </div>
          <ChevronRight size={17} />
        </button>

        {abierto === 'clave' && (
          <form onSubmit={cambiarClave} style={{ display: 'grid', gap: '0.9rem', padding: '0 0.2rem' }}>
            <input type="password" required className="aura-input" autoComplete="current-password"
              placeholder={t('security.currentPass')} value={actual} onChange={e => setActual(e.target.value)} />
            <input type="password" required className="aura-input" autoComplete="new-password"
              placeholder={t('recover.newPass')} value={nueva} onChange={e => setNueva(e.target.value)} />
            <input type="password" required className="aura-input" autoComplete="new-password"
              placeholder={t('recover.confirmPass')} value={nueva2} onChange={e => setNueva2(e.target.value)} />
            <p style={{ margin: 0, fontSize: '0.72rem', lineHeight: 1.6, color: 'var(--ink-muted)' }}>
              {t('security.changePassNote')}
            </p>
            {aviso && <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--pink-ink)' }}>{aviso}</p>}
            <button type="submit" disabled={cargando} className="btn-aura" style={{ fontSize: '0.72rem' }}>
              {cargando ? t('recover.btnSetting') : t('security.changePass')}
            </button>
          </form>
        )}

        {/* ── Código de recuperación ── */}
        <button className="btn-aura btn-ghost" style={{ ...fila, '--btn-accent': 'var(--gold-ink)' }}
          onClick={generarCodigo} disabled={cargando}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <KeyRound size={16} />
            <div style={{ textAlign: 'left' }}>
              <span style={{ display: 'block' }}>
                {tieneCodigo ? t('security.replaceCode') : t('security.createCode')}
              </span>
              <span style={{ fontSize: '0.65rem', opacity: 0.85, letterSpacing: '0.5px' }}>
                {tieneCodigo ? t('security.replaceCodeHint') : t('security.createCodeHint')}
              </span>
            </div>
          </div>
          <ChevronRight size={17} />
        </button>

        {abierto === 'codigo' && codigo && (
          <div style={{ display: 'grid', gap: '0.8rem', padding: '0 0.2rem' }}>
            <div style={{
              background: 'var(--bg-soft)', border: '1.5px solid var(--border-strong)',
              borderRadius: 12, padding: '1rem', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-mono, monospace)', fontSize: '1rem',
                fontWeight: 700, letterSpacing: '2px', color: 'var(--ink)', wordBreak: 'break-all' }}>
                {codigo}
              </p>
            </div>
            <p style={{ margin: 0, fontSize: '0.76rem', lineHeight: 1.65, color: 'var(--ink-body)' }}>
              {t('recoveryCode.warning')}
            </p>
            <button type="button" className="btn-aura btn-ghost" style={{ fontSize: '0.72rem' }}
              onClick={() => { setAbierto(null); setCodigo(null); }}>
              {t('security.codeSaved')}
            </button>
          </div>
        )}

        {hecho && (
          <p role="status" style={{
            margin: 0, padding: '0.7rem 0.9rem', fontSize: '0.78rem', lineHeight: 1.6,
            background: 'rgba(63, 191, 160, 0.10)', borderLeft: '3px solid var(--ok)',
            borderRadius: '0 8px 8px 0', color: 'var(--ink-body)',
          }}>
            {hecho}
          </p>
        )}
      </div>
    </div>
  );
};

/* ════════════════ Main Component ════════════════ */
const PrivacyVault = () => {
  const { locale, t, units } = useTranslation();
  const { user, logout } = useAuth();
  const es = locale === 'es';

  const [showDestruction, setShowDestruction] = useState(false);
  const [destroyed, setDestroyed]             = useState(false);
  const [legalModal, setLegalModal]           = useState(null); // 'hipaa' | 'gdpr' | null

  const legalContent = getLegalContent(locale);

  const getPets = () => user ? storage.getPets(user.id) : [];

  const handleExportJSON = () => {
    const pets = getPets();
    // La portabilidad del art. 20 GDPR exige entregar TODO, no solo la ficha:
    // el historial clínico se adjunta a cada mascota.
    const payload = {
      exportDate: new Date().toISOString(),
      format: 'AURA Pets Data Portability v2',
      user: { email: user?.email, id: user?.id },
      pets: pets.map(p => ({
        ...p,
        medicalHistory: user ? storage.getHistory(user.id, p.id, null) : null,
      })),
    };
    downloadJSON(payload, `AURA_datos_${new Date().toLocaleDateString('es-ES').replace(/\//g,'-')}.json`);
  };

  const handleExportPDF = () => {
    const pets = getPets();
    generateMedicalPDF(pets, user?.email, t, locale, units);
  };

  const handleDestroy = () => {
    if (!user) return;
    // Borrado real y completo: expedientes, historiales clínicos, documentos
    // adjuntos y la propia cuenta. Antes solo se limpiaban las claves `aura_*`
    // y todo el contenido cifrado del vault sobrevivía a la "destrucción".
    //
    // Se recogen las claves antes de borrar: eliminar mientras se recorre por
    // índice desplaza los que quedan y deja registros sin borrar.
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(`vault_${user.id}_`) ||
                  key.startsWith(`aura_${user.id}_`) ||
                  key === `aura_onboarding_${user.id}`)) {
        claves.push(key);
      }
    }
    claves.forEach(key => localStorage.removeItem(key));
    // Historiales de versiones anteriores, que iban sueltos y sin cifrar
    getPets().forEach(p => localStorage.removeItem(`aura_medical_${p.id}`));
    // Y la cuenta, para que no quede ni el email ni la sal
    const remaining = storage.getUsers().filter(u => u.id !== user.id);
    localStorage.setItem('mascota_health_users', JSON.stringify(remaining));

    setShowDestruction(false);
    setDestroyed(true);
    setTimeout(() => logout(), 1800); // logout() destruye además la clave en memoria
  };

  if (destroyed) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      <Trash2 size={48} color="var(--aura-neon-pink)" />
      <h2 style={{ color: 'var(--pink-ink)' }}>{es ? 'Datos eliminados' : 'Data destroyed'}</h2>
      <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.82rem' }}>
        {es ? 'Cerrando sesión…' : 'Signing out…'}
      </p>
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '2rem 0' }}>
      <AnimatePresence>
        {showDestruction && (
          <DestructionModal
            onConfirm={handleDestroy}
            onClose={() => setShowDestruction(false)}
            locale={locale}
          />
        )}
        {legalModal && (
          <LegalInfoModal
            key={legalModal}
            type={legalModal}
            onClose={() => setLegalModal(null)}
          />
        )}
      </AnimatePresence>

      <header style={{ marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '4px', opacity: 0.68, textTransform: 'uppercase' }}>
          {es ? 'Protocolo de Seguridad' : 'Security Protocol'}
        </span>
        <h1 className="luxury-title" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', margin: '0.5rem 0' }}>
          {es ? 'Privacidad y Seguridad' : 'Privacy & Security'}
        </h1>
      </header>

      <div className="vault-layout">
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Shield card */}
          <div className="aura-card aura-card--bloom" style={{ padding: '2.5rem', position: 'relative' }}>
            <PawScatter variante="b" />
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'start', flexWrap: 'wrap' }}>
              <div style={{ padding: '1rem', background: 'rgba(67, 191, 199, 0.05)', borderRadius: '50%', flexShrink: 0 }}>
                <ShieldCheck color="var(--aura-neon-cyan)" size={28} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', margin: '0 0 0.8rem' }}>{es ? 'El Escudo AURA™' : 'AURA Shield™'}</h3>
                <p style={{ color: 'var(--aura-text-muted)', lineHeight: '1.8', margin: 0, maxWidth: '90%' }}>
                  {es
                    ? 'Utilizamos encriptación de grado militar AES-256 para proteger cada dato registrado. La clave de cifrado se genera localmente en su dispositivo y nunca se transmite a nuestros servidores. Solo usted tiene el control absoluto sobre la información sanitaria de sus miembros.'
                    : 'We use military-grade AES-256 encryption to protect every registered record. The encryption key is generated locally on your device and never transmitted to our servers.'}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance cards — clickable */}
          <div className="compliance-grid">
            <div
              className="aura-card"
              onClick={() => setLegalModal('hipaa')}
              style={{
                padding: '2rem', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                borderColor: 'rgba(201,168,76,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.55)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(42, 45, 124, 0.28), 0 0 24px rgba(201,168,76,0.18)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Lock size={24} color="var(--aura-gold)" style={{ marginBottom: '1.5rem' }} />
              <h4 style={{ margin: '0 0 0.5rem' }}>HIPAA (USA)</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)', margin: '0 0 1rem' }}>
                {legalContent.hipaa.cardDesc}
              </p>
              <span style={{
                fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: 'var(--gold-ink)', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <BookOpen size={11} /> {legalContent.hipaa.readLabel}
              </span>
            </div>

            <div
              className="aura-card"
              onClick={() => setLegalModal('gdpr')}
              style={{
                padding: '2rem', cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                borderColor: 'rgba(181,123,255,0.2)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'rgba(181,123,255,0.55)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(42, 45, 124, 0.28), 0 0 24px rgba(181,123,255,0.18)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'rgba(181,123,255,0.2)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <EyeOff size={24} color="#8B5CF6" style={{ marginBottom: '1.5rem' }} />
              <h4 style={{ margin: '0 0 0.5rem' }}>GDPR (Europa)</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--aura-text-muted)', margin: '0 0 1rem' }}>
                {legalContent.gdpr.cardDesc}
              </p>
              <span style={{
                fontSize: '0.65rem', letterSpacing: '1.5px', textTransform: 'uppercase',
                color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '0.3rem',
              }}>
                <BookOpen size={11} /> {legalContent.gdpr.readLabel}
              </span>
            </div>
          </div>

          {/* ── Seguridad de la cuenta ──────────────────────────────────────
              Las dos cosas que antes no se podían hacer. Cambiar la
              contraseña no existía —con el esquema anterior habría obligado a
              volver a cifrar el expediente entero—, y el código de
              recuperación no existía en absoluto: olvidar la contraseña era
              perderlo todo. */}
          <SeguridadCuenta />

          {/* Data management */}
          <div className="aura-card" style={{ padding: '2rem', borderStyle: 'dashed' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem' }}>
              {es ? 'Gestión de Datos' : 'Data Management'}
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <button className="btn-aura"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}
                onClick={handleExportPDF}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <FileText size={16} color="var(--aura-gold)" />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block' }}>
                      {es ? 'Exportar Expediente Médico (PDF)' : 'Export Medical Record (PDF)'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--aura-text-muted)', letterSpacing: '1px' }}>
                      {es ? 'Diseño premium · jsPDF' : 'Premium design · jsPDF'}
                    </span>
                  </div>
                </div>
                <Download size={17} color="var(--aura-gold)" />
              </button>

              <button className="btn-aura"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}
                onClick={handleExportJSON}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Download size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block' }}>
                      {es ? 'Portabilidad de Datos (JSON)' : 'Data Portability (JSON)'}
                    </span>
                    {/* El artículo 20 obliga a entregar los datos en un formato que
                        otra máquina pueda leer, no en uno cómodo de leer para una
                        persona. Conviene decirlo: quien abre el fichero esperando
                        su expediente se encuentra una pared de texto técnico. */}
                    <span style={{ fontSize: '0.65rem', color: 'var(--aura-text-muted)', letterSpacing: '1px' }}>
                      {es ? 'Copia completa · GDPR Art. 20' : 'Full copy · GDPR Art. 20'}
                    </span>
                    <span style={{
                      display: 'block', marginTop: 4, fontSize: '0.66rem', lineHeight: 1.5,
                      color: 'var(--aura-text-muted)', letterSpacing: 0, whiteSpace: 'normal',
                    }}>
                      {es
                        ? 'Formato técnico, para trasladar tus datos a otro servicio. Si quieres leerlos tú, usa el PDF de arriba.'
                        : 'A technical format, for moving your data to another service. To read it yourself, use the PDF above.'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={17} />
              </button>

              <button className="btn-aura"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left' }}
                onClick={() => window.open('/politicas.html', '_blank', 'noopener,noreferrer')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <ExternalLink size={16} color="var(--aura-text-muted)" />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block' }}>
                      {es ? 'Política de Privacidad' : 'Privacy Policy'}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--aura-text-muted)', letterSpacing: '1px' }}>
                      {es ? 'GDPR / LOPD · Rodigital Advance' : 'GDPR / LOPD · Rodigital Advance'}
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} color="var(--aura-text-muted)" />
              </button>

              <button className="btn-aura"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', textAlign: 'left', '--btn-accent': 'var(--danger)' }}
                onClick={() => setShowDestruction(true)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Trash2 size={16} />
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block' }}>
                      {es ? 'Destrucción Permanente de Datos' : 'Permanent Data Destruction'}
                    </span>
                    <span style={{ fontSize: '0.65rem', letterSpacing: '1px', opacity: 0.7 }}>
                      {es ? 'Doble confirmación requerida · GDPR Art. 17' : 'Double confirmation · GDPR Art. 17'}
                    </span>
                  </div>
                </div>
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside>
          <div className="aura-card" style={{ textAlign: 'center', borderColor: 'var(--aura-neon-cyan)', padding: '2.5rem' }}>
            <div className="bio-ring" style={{ width: '120px', height: '120px', margin: '0 auto 2rem', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--aura-neon-cyan)', borderRadius: '50%', opacity: 0.2 }} />
              <div style={{ position: 'absolute', inset: '10px', border: '2px solid var(--aura-neon-cyan)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'rotate 3s linear infinite' }} />
              <ShieldCheck size={40} color="var(--aura-neon-cyan)" />
            </div>
            <h4 style={{ color: 'var(--cyan-ink)', letterSpacing: '2px', fontSize: '0.7rem', margin: '0 0 0.5rem' }}>
              {es ? 'ESTADO DE SEGURIDAD' : 'SECURITY STATUS'}
            </h4>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              {es ? 'CIFRADO ACTIVO' : 'ENCRYPTION ACTIVE'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--aura-text-muted)', margin: '0 0 1.5rem' }}>
              {es ? 'Última auditoría' : 'Last audit'}: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
            </p>
            <div style={{ borderTop: '1px solid var(--aura-border)', paddingTop: '1.2rem' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.65rem', color: 'var(--aura-text-muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                {es ? 'Mascotas registradas' : 'Registered pets'}
              </p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: 'var(--gold-ink)' }}>
                {getPets().length}
              </p>
            </div>
          </div>
        </aside>
      </div>

      <style>{`
        @keyframes rotate { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PrivacyVault;
