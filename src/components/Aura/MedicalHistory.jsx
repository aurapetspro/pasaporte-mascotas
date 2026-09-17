import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Download, Calendar, Shield, Activity, Award, FileText, Eye, Pencil } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { storage } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { PawScatter } from './Decorations';
import { sugerirProximaDosis } from '../../utils/intelligence';
import { useTranslation } from '../../context/LocalizationContext';

// ─── Storage ──────────────────────────────────────────────────────────────────
// El historial clínico se guarda cifrado dentro de la bóveda del usuario.
// Antes vivía suelto en localStorage, en claro y sin separar por cuenta.
const EMPTY_DATA = { visits: [], vaccines: [], medications: [], analyses: [] };

const EMPTY_VISIT    = { date: '', clinic: '', vet: '', reason: '', diagnosis: '', treatment: '', cost: '' };
const EMPTY_VACCINE  = { name: '', date: '', nextDose: '', vet: '' };
const EMPTY_MED      = { name: '', dose: '', frequency: '', startDate: '', endDate: '' };
const EMPTY_ANALYSIS = { type: '', date: '', result: '', notes: '' };

const TABS = [
  { id: 'visits',      k: 'history.tabVisits',   icon: Calendar },
  { id: 'vaccines',    k: 'history.tabVaccines', icon: Shield   },
  { id: 'medications', k: 'history.tabMeds',     icon: Activity },
  { id: 'analyses',    k: 'history.tabAnalyses', icon: Award    },
];

const ADD_KEYS = {
  visits:      'history.addVisit',
  vaccines:    'history.addVaccine',
  medications: 'history.addMed',
  analyses:    'history.addAnalysis',
};

const EMPTY_KEYS = {
  visits:      'history.emptyVisits',
  vaccines:    'history.emptyVaccines',
  medications: 'history.emptyMeds',
  analyses:    'history.emptyAnalyses',
};

const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3 MB antes de base64

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loadData = (userId, petId) => {
  if (!userId) return EMPTY_DATA;
  try { return storage.getHistory(userId, petId, EMPTY_DATA) || EMPTY_DATA; }
  catch { return EMPTY_DATA; }
};

const vaccineStatus = (nextDose, t) => {
  if (!nextDose) return null;
  const days = Math.ceil((new Date(nextDose) - new Date()) / 86400000);
  if (days < 0)   return { label: t('history.statusOverdue'), bg: 'rgba(236, 92, 141, 0.15)', color: '#C2255C', border: 'rgba(236, 92, 141, 0.4)' };
  if (days <= 30) return { label: t('history.statusDays', { dias: days }), bg: 'rgba(255,170,0,0.15)', color: '#8A6414', border: 'rgba(255,170,0,0.4)' };
  return               { label: t('history.statusUpToDate'), bg: 'rgba(67, 191, 199, 0.1)', color: '#1F7C83', border: 'rgba(67, 191, 199, 0.3)' };
};

const isActiveMed = (m) => !m.endDate || new Date(m.endDate) >= new Date();

// ─── PDF ──────────────────────────────────────────────────────────────────────
const generatePDF = (pet, data, t, locale, simbolo) => {
  const doc = new jsPDF();
  let y = 20;

  const line = (text, indent = 20) => {
    if (y > 270) { doc.addPage(); y = 20; }
    const lines = doc.splitTextToSize(text, 170 - (indent - 20));
    doc.text(lines, indent, y);
    y += lines.length * 6;
  };
  const section = (title) => {
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text(title, 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
  };

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`${t('history.pdfTitle')} — ${pet.name || t('common.noName')}`, 20, y); y += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const fechaHoy = new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB');
  doc.text(`${t('history.pdfGenerated', { fecha: fechaHoy })} · AURA Pets Global`, 20, y); y += 14;

  if (data.visits.length) {
    section(t('history.pdfVisits'));
    data.visits.forEach((v) => {
      line(`${v.date}  ·  ${v.clinic || '—'}  ·  ${v.vet || '—'}`);
      if (v.reason)    line(`${t('history.pdfReason')}: ${v.reason}`, 26);
      if (v.diagnosis) line(`${t('history.pdfDiagnosis')}: ${v.diagnosis}`, 26);
      if (v.treatment) line(`${t('history.pdfTreatment')}: ${v.treatment}`, 26);
      if (v.cost)      line(`${t('history.pdfCost')}: ${simbolo}${v.cost}`, 26);
      y += 3;
    });
  }
  if (data.vaccines.length) {
    section(t('history.pdfVaccines'));
    data.vaccines.forEach((v) => {
      line(`${v.name}  ·  ${v.date}  ·  ${t('history.pdfNext')}: ${v.nextDose || '—'}  ·  ${v.vet || '—'}`);
    });
  }
  if (data.medications.length) {
    section(t('history.pdfMeds'));
    data.medications.forEach((m) => {
      line(`${m.name}  ·  ${m.dose}  ·  ${m.frequency}  (${t(isActiveMed(m) ? 'history.pdfOngoing' : 'history.pdfFinished')})`);
      line(`${t('history.pdfStart')}: ${m.startDate}${m.endDate ? `  ${t('history.pdfEnd')}: ${m.endDate}` : ''}`, 26);
    });
  }
  if (data.analyses.length) {
    section(t('history.pdfAnalyses'));
    data.analyses.forEach((a) => {
      line(`${a.type}  ·  ${a.date}  ·  ${t('history.pdfResult')}: ${a.result}`);
      if (a.notes) line(a.notes, 26);
      if (a.document) line(`[${t('history.pdfAttached', { nombre: a.document.name })}]`, 26);
    });
  }

  const nombreArchivo = (pet.name || t('common.noName')).replace(/\s+/g, '_');
  doc.save(`${nombreArchivo}_${t('history.pdfFileName')}.pdf`);
};

// ─── Field ────────────────────────────────────────────────────────────────────
const Field = ({ label, as, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <label style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--gold-ink)', textTransform: 'uppercase' }}>
      {label}
    </label>
    {as === 'textarea'
      ? <textarea rows={2} className="aura-input" style={{ resize: 'vertical', minHeight: 56 }} {...props} />
      : <input className="aura-input" {...props} />}
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
const MedicalHistory = ({ pet, onClose }) => {
  const { user } = useAuth();
  const { t, locale, getCurrencySymbol } = useTranslation();
  const simbolo = getCurrencySymbol();
  const [tab, setTab]             = useState('visits');
  const [data, setData]           = useState(() => loadData(user?.id, pet.id));
  const [saveError, setSaveError]  = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editando, setEditando]   = useState(null);   // id del registro que se corrige
  const [form, setForm]           = useState(EMPTY_VISIT);
  const [docPreview, setDocPreview] = useState(null);   // { dataUrl, type, name }
  const [viewDoc, setViewDoc]     = useState(null);     // { dataUrl, type, name }
  const [dragOver, setDragOver]   = useState(false);
  const [fileError, setFileError] = useState('');

  const fileInputRef   = useRef(null);
  const cameraInputRef = useRef(null);

  // ── Persistence ───────────────────────────────────────────────────────────
  /** Devuelve true si el historial quedó guardado y cifrado en disco. */
  /* Mismo criterio que en App: el código manda, el mensaje original es el
     último recurso. */
  const textoError = (err) => {
    const clave = `errors.${err?.name}`;
    const texto = t(clave);
    return texto === clave ? (err?.message || '') : texto;
  };

  const persist = async (newData) => {
    if (!user) return false;
    // La pantalla solo se actualiza si el guardado cifrado ha ido bien: antes
    // un fallo de espacio dejaba el dato visible pero sin escribir en disco.
    try {
      await storage.saveHistory(user.id, pet.id, newData);
    } catch (err) {
      setSaveError(t('history.saveFailed', { detalle: textoError(err) }));
      return false;
    }
    setData(newData);
    setSaveError('');
    return true;
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  /* ── El nombre y la fecha de la vacuna proponen la próxima dosis ──────────
     Dos cosas que hay que hacer con cuidado, y las dos fallaban.

     La primera: el cálculo va DENTRO del actualizador y parte de `prev`. Fuera
     usaba el nombre o la fecha del render anterior, así que dos cambios
     seguidos se pisaban entre sí.

     La segunda es la que rompía de verdad. La marca «esta fecha la puse yo»
     se apagaba cada vez que la sugerencia no se podía calcular en ese
     instante, y eso pasa en cada tecla mientras se escribe el nombre: con
     «trivalent» a medias no hay protocolo que valga. Desde ese momento la
     aplicación creía que la fecha la había escrito el usuario y dejaba de
     actualizarla, de modo que una fecha calculada con un año equivocado se
     quedaba clavada aunque después se corrigiera el año.

     La marca solo se apaga en un sitio: cuando el usuario toca el campo de la
     próxima dosis con su propia mano. Que es lo que significa. */
  const proponerProxima = (campo) => (e) => {
    const valor = e.target.value;
    setForm(prev => {
      const siguiente = { ...prev, [campo]: valor };
      /* Nunca se pisa una fecha escrita a mano. */
      if (prev.nextDose && !prev.nextDoseSugerida) return siguiente;
      const sug = sugerirProximaDosis(pet?.species, siguiente.name, siguiente.date);
      return {
        ...siguiente,
        nextDose: sug?.fecha || prev.nextDose,
        nextDoseSugerida: sug?.fecha ? true : prev.nextDoseSugerida,
      };
    });
  };

  const VACIOS = { visits: EMPTY_VISIT, vaccines: EMPTY_VACCINE, medications: EMPTY_MED, analyses: EMPTY_ANALYSIS };

  const openForm = () => {
    setForm({ ...VACIOS[tab] });
    setEditando(null);
    setDocPreview(null);
    setFileError('');
    setShowForm(true);
  };

  /* Corregir lo que ya está anotado. Se carga tal cual en el formulario; el
     documento adjunto viaja con él para no perderlo al guardar. */
  const editarRegistro = (item) => {
    const { id, document: adjunto, ...campos } = item;

    /* ── ¿La próxima dosis la puso la app o el veterinario? ─────────────────
       Al guardar no se conserva esa marca, así que al abrir el registro para
       corregirlo hay que deducirla. Y se puede deducir del propio dato: si la
       fecha guardada es exactamente la que el protocolo habría propuesto para
       esa fecha de administración, era nuestra.

       Importa porque decide qué pasa al corregir la fecha. Si la propuso la
       app, corregir el día de la vacuna tiene que arrastrar la próxima dosis
       —para eso se está corrigiendo—. Si la escribió el veterinario, no: ese
       es un dato suyo y manda sobre cualquier calendario.

       Antes no se deducía nada y se trataba todo como escrito a mano, así que
       arreglar una fecha mal tecleada dejaba la próxima dosis apuntando al
       cálculo viejo, sin avisar. */
    const sug = tab === 'vaccines'
      ? sugerirProximaDosis(pet?.species, campos.name, campos.date)
      : null;

    setForm({
      ...VACIOS[tab],
      ...campos,
      nextDoseSugerida: !!sug && sug.fecha === campos.nextDose,
    });
    setEditando(id);
    setDocPreview(adjunto || null);
    setFileError('');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditando(null);
    setDocPreview(null);
    setFileError('');
  };

  const submit = async () => {
    const { nextDoseSugerida, ...campos } = form;   // marca interna, no se guarda
    const item = { id: editando ?? Date.now(), ...campos };
    if (tab === 'analyses' && docPreview) item.document = docPreview;

    /* Al corregir se sustituye en su sitio, sin moverlo de la lista: cambiar
       el orden al guardar despista sobre qué se acaba de tocar. */
    const lista = editando
      ? data[tab].map(i => (i.id === editando ? item : i))
      : [item, ...data[tab]];

    const ok = await persist({ ...data, [tab]: lista });
    // Si el guardado falla, el formulario sigue abierto con lo escrito para
    // que el usuario pueda reintentar en lugar de perderlo.
    if (!ok) return;
    setShowForm(false);
    setEditando(null);
    setDocPreview(null);
  };

  const remove = (section, id) =>
    persist({ ...data, [section]: data[section].filter((i) => i.id !== id) });

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return;
    setFileError('');
    if (file.size > MAX_FILE_BYTES) {
      setFileError(t('history.errTooBig'));
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setFileError(t('history.errFormat'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setDocPreview({ dataUrl: e.target.result, type: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const activeMeds = data.medications.filter(isActiveMed).length;

  // ── Shared styles ─────────────────────────────────────────────────────────
  const formWrap  = { background: 'rgba(217, 164, 65, 0.05)', border: '1px solid rgba(217, 164, 65, 0.25)', borderRadius: 10, padding: '1.4rem', marginBottom: '1rem', display: 'grid', gap: '1rem' };
  const grid2     = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' };
  const cardStyle = { background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 10, padding: '1.2rem', boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(42,45,124,0.06))' };
  const mutedLabel = { margin: '0 0 3px', fontSize: '0.62rem', letterSpacing: '2px', color: 'var(--aura-text-muted)', textTransform: 'uppercase' };
  const deleteBtn  = { background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', padding: 4, lineHeight: 1, flexShrink: 0 };
  const editBtn    = { ...deleteBtn, color: 'var(--violet)' };
  const empty = (msg) => <p style={{ color: 'var(--aura-text-muted)', fontSize: '0.88rem', padding: '2.5rem 0', textAlign: 'center' }}>{msg}</p>;

  // ── Drop zone (solo Análisis) ──────────────────────────────────────────────
  const DropZone = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--gold-ink)', textTransform: 'uppercase' }}>
        {t('history.fAttachment')}
      </label>

      {!docPreview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '1.5px dashed rgba(217, 164, 65, 0.45)',
            borderRadius: 8,
            padding: '1.5rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(217, 164, 65, 0.1)' : 'rgba(217, 164, 65, 0.04)',
            transition: 'background 0.2s',
          }}
        >
          <p style={{ margin: '0 0 0.9rem', color: 'var(--aura-text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
            {t('history.dropHint')}
          </p>
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ padding: '7px 14px', background: 'rgba(217, 164, 65, 0.1)', border: '1px solid rgba(217, 164, 65, 0.35)', borderRadius: 6, color: 'var(--gold-ink)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              📎 {t('history.btnUpload')}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
              style={{ padding: '7px 14px', background: 'rgba(217, 164, 65, 0.1)', border: '1px solid rgba(217, 164, 65, 0.35)', borderRadius: 6, color: 'var(--gold-ink)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              📷 {t('history.btnCamera')}
            </button>
          </div>
          {fileError && (
            <p style={{ margin: '0.7rem 0 0', fontSize: '0.73rem', color: '#EC5C8D' }}>{fileError}</p>
          )}
        </div>
      ) : (
        /* Preview del documento seleccionado */
        <div style={{ position: 'relative', border: '1px solid rgba(217, 164, 65, 0.3)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-soft)' }}>
          {docPreview.type.startsWith('image/') ? (
            <img
              src={docPreview.dataUrl}
              alt={docPreview.name}
              style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block', background: '#000' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem' }}>
              <FileText size={32} color="var(--aura-gold)" />
              <p style={{ margin: 0, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {docPreview.name}
              </p>
            </div>
          )}
          {/* Botón quitar */}
          <button
            type="button"
            onClick={() => setDocPreview(null)}
            style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(42, 45, 124, 0.62)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );

  // ── Forms ─────────────────────────────────────────────────────────────────
  const renderForm = () => {
    if (tab === 'visits') return (
      <div style={formWrap}>
        <div style={grid2}>
          <Field label={t('history.fDate')} type="date"   value={form.date} onChange={f('date')} />
          <Field label={t('history.fCost', { divisa: simbolo })} type="number" placeholder="85" value={form.cost} onChange={f('cost')} />
        </div>
        <div style={grid2}>
          <Field label={t('history.fClinic')} type="text" placeholder={t('history.pClinic')} value={form.clinic} onChange={f('clinic')} />
          <Field label={t('history.fVet')}    type="text" placeholder={t('history.pVet')}    value={form.vet}    onChange={f('vet')} />
        </div>
        <Field label={t('history.fReason')}    type="text"   placeholder={t('history.pReason')}    value={form.reason}    onChange={f('reason')} />
        <Field label={t('history.fDiagnosis')} as="textarea" placeholder={t('history.pDiagnosis')} value={form.diagnosis} onChange={f('diagnosis')} />
        <Field label={t('history.fTreatment')} as="textarea" placeholder={t('history.pTreatment')} value={form.treatment} onChange={f('treatment')} />
      </div>
    );

    if (tab === 'vaccines') return (
      <div style={formWrap}>
        <div style={grid2}>
          <Field label={t('history.fVaccineName')} type="text" placeholder={t('history.pVaccine')} value={form.name}
            onChange={proponerProxima('name')} />
          <Field label={t('history.fVet')} type="text" placeholder={t('history.pVet')} value={form.vet} onChange={f('vet')} />
        </div>
        <div style={grid2}>
          <Field label={t('history.fAdminDate')} type="date" value={form.date}
            onChange={proponerProxima('date')} />
          <Field label={t('history.fNextDose')} type="date" value={form.nextDose}
            onChange={(e) => setForm(prev => ({ ...prev, nextDose: e.target.value, nextDoseSugerida: false }))} />
        </div>

        {/* La nota del protocolo.

            Antes salía siempre que hubiera una fecha escrita, dijera lo que
            dijera esa fecha. Así que junto a una próxima dosis puesta a mano a
            cuatro años vista se leía «refuerzo cada 3 años», y parecía que ese
            plazo lo había calculado la aplicación. Lo que dice el protocolo y
            lo que dice el campo son dos cosas distintas, y cuando no coinciden
            hay que decirlo en vez de dejar que se contradigan en silencio. */}
        {(() => {
          const sug = sugerirProximaDosis(pet?.species, form.name, form.date);
          if (!sug || !form.nextDose) return null;

          const enPalabras = (dias) => {
            const meses = Math.round(dias / 30.4);
            return meses >= 12
              ? t('history.boosterYears',  { n: Math.round(meses / 12) })
              : t('history.boosterMonths', { n: meses });
          };

          /* Lo que de verdad hay entre los dos campos.

             Se comparan las dos frases, no los días: un veterinario pone
             fechas redondas, y avisar de que «tres años y tres semanas» no son
             exactamente tres años sería ruido. Lo que hay que cantar es cuando
             el usuario lee un número distinto del que dice el protocolo. */
          const real = Math.round((new Date(form.nextDose) - new Date(form.date)) / 86400000);
          const mesesReales = Math.round(real / 30.4);
          const desvia = Number.isFinite(real) && real > 0
            && enPalabras(real) !== enPalabras(sug.dias);

          return (
            <p style={{
              margin: '0.6rem 0 0', fontSize: '0.68rem', lineHeight: 1.55,
              color: desvia ? 'var(--gold-ink)' : 'var(--aura-text-muted)',
            }}>
              {form.nextDoseSugerida ? '✨ ' : ''}
              {(locale === 'es' ? sug.etiqueta : (sug.etiquetaEn || sug.etiqueta))}: {enPalabras(sug.dias)}
              {form.nextDoseSugerida
                ? `. ${t('history.suggestedNote')}`
                : desvia
                  ? `. ${t(mesesReales >= 12 ? 'history.gapYears' : 'history.gapMonths', {
                      n: mesesReales >= 12 ? Math.round(mesesReales / 12) : mesesReales,
                    })}`
                  : '.'}
              {(locale === 'es' ? sug.nota : (sug.notaEn || sug.nota)) && (
                <span style={{ display: 'block', marginTop: '0.35rem', opacity: 0.85 }}>
                  {locale === 'es' ? sug.nota : (sug.notaEn || sug.nota)}
                </span>
              )}
            </p>
          );
        })()}
      </div>
    );

    if (tab === 'medications') return (
      <div style={formWrap}>
        <div style={grid2}>
          <Field label={t('history.fMedName')} type="text" placeholder={t('history.pMed')}  value={form.name} onChange={f('name')} />
          <Field label={t('history.fDose')}    type="text" placeholder={t('history.pDose')} value={form.dose} onChange={f('dose')} />
        </div>
        <Field label={t('history.fFrequency')} type="text" placeholder={t('history.pFrequency')} value={form.frequency} onChange={f('frequency')} />
        <div style={grid2}>
          <Field label={t('history.fStart')} type="date" value={form.startDate} onChange={f('startDate')} />
          <Field label={t('history.fEnd')}   type="date" value={form.endDate}   onChange={f('endDate')} />
        </div>
      </div>
    );

    // Análisis — incluye drop zone
    return (
      <div style={formWrap}>
        <div style={grid2}>
          <Field label={t('history.fType')} type="text" placeholder={t('history.pType')} value={form.type} onChange={f('type')} />
          <Field label={t('history.fDate')} type="date"                                 value={form.date} onChange={f('date')} />
        </div>
        <Field label={t('history.fResult')} type="text"   placeholder={t('history.pResult')} value={form.result} onChange={f('result')} />
        <Field label={t('history.fNotes')}  as="textarea" placeholder={t('history.pNotes')}  value={form.notes}  onChange={f('notes')} />
        <DropZone />
      </div>
    );
  };

  // ── Tab content ────────────────────────────────────────────────────────────
  const Visits = () => (
    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
      {data.visits.length > 0 && (
        <div style={{ position: 'absolute', left: 7, top: 10, bottom: 10, width: 1, background: 'linear-gradient(to bottom, #D9A441, rgba(217, 164, 65, 0.08))' }} />
      )}
      {!data.visits.length && empty(t(EMPTY_KEYS.visits))}
      {data.visits.map((v) => (
        <div key={v.id} style={{ position: 'relative', marginBottom: '1.1rem' }}>
          <div style={{ position: 'absolute', left: -29, top: 14, width: 10, height: 10, borderRadius: '50%', background: '#D9A441', border: '2px solid #FEFBF4', boxShadow: '0 0 8px rgba(217, 164, 65, 0.6)' }} />
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '0.68rem', color: 'var(--gold-ink)', letterSpacing: '2px' }}>{v.date}</p>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.98rem' }}>{v.clinic || '—'}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--aura-text-muted)' }}>{v.vet}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {v.cost && <span style={{ fontWeight: 700, color: 'var(--gold-ink)' }}>{simbolo}{v.cost}</span>}
                <button style={editBtn} title={t('history.edit')} aria-label={t('history.edit')}
                  onClick={() => editarRegistro(v)}><Pencil size={14} /></button>
                <button style={deleteBtn} title={t('history.remove')} aria-label={t('history.remove')}
                  onClick={() => remove('visits', v.id)}><X size={14} /></button>
              </div>
            </div>
            {(v.reason || v.diagnosis || v.treatment) && (
              <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #FFFFFF', display: 'grid', gap: '0.6rem' }}>
                {v.reason    && <div><p style={mutedLabel}>{t('history.fReason')}</p>    <p style={{ margin: 0, fontSize: '0.85rem' }}>{v.reason}</p></div>}
                {v.diagnosis && <div><p style={mutedLabel}>{t('history.fDiagnosis')}</p> <p style={{ margin: 0, fontSize: '0.85rem' }}>{v.diagnosis}</p></div>}
                {v.treatment && <div><p style={mutedLabel}>{t('history.fTreatment')}</p> <p style={{ margin: 0, fontSize: '0.85rem' }}>{v.treatment}</p></div>}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const Vaccines = () => (
    <div style={{ display: 'grid', gap: '0.8rem' }}>
      {!data.vaccines.length && empty(t(EMPTY_KEYS.vaccines))}
      {data.vaccines.map((v) => {
        const st = vaccineStatus(v.nextDose, t);
        return (
          <div key={v.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.98rem' }}>{v.name}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>
                {v.date}{v.vet ? ` · ${v.vet}` : ''}{v.nextDose ? ` · ${t('history.nextShort')}: ${v.nextDose}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
              {st && <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>}
              <button style={editBtn} title={t('history.edit')} aria-label={t('history.edit')}
                  onClick={() => editarRegistro(v)}><Pencil size={14} /></button>
                <button style={deleteBtn} title={t('history.remove')} aria-label={t('history.remove')}
                  onClick={() => remove('vaccines', v.id)}><X size={14} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const Medications = () => (
    <div>
      {activeMeds > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 1.2rem', background: 'rgba(67, 191, 199, 0.05)', border: '1px solid rgba(67, 191, 199, 0.18)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#43BFC7', boxShadow: '0 0 8px #43BFC7', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#43BFC7' }}>
            {activeMeds === 1 ? t('history.medsActiveOne') : t('history.medsActiveMany', { n: activeMeds })}
          </p>
        </div>
      )}
      <div style={{ display: 'grid', gap: '0.8rem' }}>
        {!data.medications.length && empty(t(EMPTY_KEYS.medications))}
        {data.medications.map((m) => {
          const active = isActiveMed(m);
          return (
            <div key={m.id} style={{ ...cardStyle, border: `1px solid ${active ? 'rgba(63, 191, 160, 0.45)' : 'var(--border)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#43BFC7', flexShrink: 0 }} />}
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.98rem' }}>{m.name}</p>
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>
                  {m.dose}{m.frequency ? ` · ${m.frequency}` : ''}{m.startDate ? ` · ${t('history.fromShort')}: ${m.startDate}` : ''}{m.endDate ? ` ${t('history.untilShort')} ${m.endDate}` : ''}
                </p>
              </div>
              <button style={editBtn} title={t('history.edit')} aria-label={t('history.edit')}
                  onClick={() => editarRegistro(m)}><Pencil size={14} /></button>
                <button style={deleteBtn} title={t('history.remove')} aria-label={t('history.remove')}
                  onClick={() => remove('medications', m.id)}><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Analyses = () => (
    <div style={{ display: 'grid', gap: '0.8rem' }}>
      {!data.analyses.length && empty(t(EMPTY_KEYS.analyses))}
      {data.analyses.map((a) => (
        <div key={a.id} style={cardStyle}>
          {/* Cabecera */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '0.98rem' }}>{a.type}</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--aura-text-muted)' }}>{a.date}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              {a.result && (
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: 'rgba(217, 164, 65, 0.1)', color: 'var(--gold-ink)', border: '1px solid rgba(217, 164, 65, 0.3)' }}>
                  {a.result}
                </span>
              )}
              <button style={editBtn} title={t('history.edit')} aria-label={t('history.edit')}
                  onClick={() => editarRegistro(a)}><Pencil size={14} /></button>
                <button style={deleteBtn} title={t('history.remove')} aria-label={t('history.remove')}
                  onClick={() => remove('analyses', a.id)}><X size={14} /></button>
            </div>
          </div>

          {/* Notas */}
          {a.notes && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--aura-text-muted)', borderTop: '1px solid #FFFFFF', paddingTop: '0.75rem' }}>
              {a.notes}
            </p>
          )}

          {/* Documento adjunto */}
          {a.document && (
            <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem', borderTop: '1px solid #FFFFFF', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              {/* Miniatura / icono PDF */}
              {a.document.type.startsWith('image/') ? (
                <img
                  src={a.document.dataUrl}
                  alt={a.document.name}
                  style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(217, 164, 65, 0.3)', flexShrink: 0, cursor: 'pointer' }}
                  onClick={() => setViewDoc(a.document)}
                />
              ) : (
                <div style={{ width: 52, height: 52, background: 'rgba(217, 164, 65, 0.08)', border: '1px solid rgba(217, 164, 65, 0.25)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} color="var(--aura-gold)" />
                </div>
              )}

              {/* Nombre + botón ver */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 5px', fontSize: '0.72rem', color: 'var(--aura-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.document.name}
                </p>
                <button
                  onClick={() => setViewDoc(a.document)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '5px 12px', background: 'rgba(217, 164, 65, 0.08)', border: '1px solid rgba(217, 164, 65, 0.3)', borderRadius: 6, color: 'var(--gold-ink)', fontSize: '0.72rem', cursor: 'pointer' }}
                >
                  <Eye size={12} /> {t('history.btnViewDoc')}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const CONTENT = { visits: Visits, vaccines: Vaccines, medications: Medications, analyses: Analyses };
  const TabContent = CONTENT[tab];

  return (
    <>
      {/* ── Modal principal ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#FEFBF4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        {/* Las huellas van sobre el fondo de la pantalla completa, no dentro de
            una tarjeta: aquí el contenido se desplaza y quedarían cortadas. */}
        <PawScatter variante="c" />

        {/* Header */}
        <div style={{ padding: '1.4rem 2rem', borderBottom: '1px solid rgba(217, 164, 65, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--gold-ink)', textTransform: 'uppercase' }}>
              {t('history.eyebrow')} · {pet.name || t('common.noName')}
            </p>
            <h2 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 700 }}>{t('history.title')}</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <button onClick={() => generatePDF(pet, data, t, locale, simbolo)} className="btn-aura"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.72rem', padding: '0.55rem 1rem' }}>
              <Download size={13} /> PDF
            </button>
            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: '50%', background: '#FFFFFF', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--aura-text)' }}>
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Aviso de fallo al guardar — antes esto fallaba en silencio */}
        {saveError && (
          <div role="alert" style={{
            display: 'flex', alignItems: 'center', gap: '0.7rem', flexShrink: 0,
            padding: '0.8rem 2rem', background: 'rgba(236, 92, 141, 0.08)',
            borderBottom: '1px solid rgba(236, 92, 141, 0.35)',
          }}>
            <p style={{ margin: 0, flex: 1, fontSize: '0.76rem', lineHeight: 1.5, color: '#C93B5C' }}>
              {saveError}
            </p>
            <button
              onClick={() => setSaveError('')}
              aria-label={t('history.dismiss')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C93B5C', display: 'flex', padding: '0.2rem' }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(217, 164, 65, 0.12)', overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(({ id, k, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id}
                onClick={() => { setTab(id); setShowForm(false); setEditando(null); setDocPreview(null); setFileError(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.9rem 1.4rem', background: 'none', border: 'none', cursor: 'pointer', borderBottom: active ? '2px solid var(--aura-gold)' : '2px solid transparent', color: active ? 'var(--gold-ink)' : 'var(--aura-text-muted)', fontSize: '0.8rem', fontWeight: active ? 600 : 400, letterSpacing: '0.5px', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
              >
                <Icon size={14} /> {t(k)}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 2rem' }}>
          {/* Botón añadir / formulario */}
          {!showForm ? (
            <div style={{ marginBottom: '1.2rem' }}>
              <button onClick={openForm} className="btn-aura"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', padding: '0.55rem 1.1rem' }}>
                <Plus size={13} /> {t(ADD_KEYS[tab])}
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '1.2rem' }}>
              {editando && (
                <p style={{
                  margin: '0 0 0.8rem', fontSize: '0.72rem', fontWeight: 600,
                  letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--violet)',
                }}>
                  {t('history.editing')}
                </p>
              )}
              {renderForm()}
              <div style={{ display: 'flex', gap: '0.7rem' }}>
                <button className="btn-aura btn-ghost" style={{ flex: 1, fontSize: '0.75rem' }} onClick={cancelForm}>{t('common.cancel')}</button>
                <button className="btn-aura" style={{ flex: 2, fontSize: '0.75rem' }} onClick={submit}>
                  {editando ? t('history.saveEdit') : t('common.save')}
                </button>
              </div>
            </div>
          )}

          {/* Contenido del tab */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              <TabContent />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer de marca ── */}
        <div style={{ padding: '0.6rem 2rem', borderTop: '1px solid var(--aura-border)', flexShrink: 0, textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.55rem', letterSpacing: '1.8px', color: 'var(--aura-text-muted)', opacity: 0.68, textTransform: 'uppercase' }}>
            {t('history.footer')}
          </p>
        </div>
      </motion.div>

      {/* ── Visor de documento fullscreen ── */}
      <AnimatePresence>
        {viewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#FEFBF4', display: 'flex', flexDirection: 'column' }}
          >
            {/* Barra superior */}
            <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid rgba(217, 164, 65, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--aura-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {viewDoc.name}
              </p>
              <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                {/* Abrir en nueva pestaña (útil para PDFs en móvil) */}
                <a
                  href={viewDoc.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '6px 12px', background: 'rgba(217, 164, 65, 0.08)', border: '1px solid rgba(217, 164, 65, 0.3)', borderRadius: 6, color: 'var(--gold-ink)', fontSize: '0.72rem', textDecoration: 'none' }}
                >
                  <Download size={12} /> {t('history.btnOpenDoc')}
                </a>
                <button
                  onClick={() => setViewDoc(null)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #FAF7FE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--aura-text)' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
              {viewDoc.type.startsWith('image/') ? (
                <img
                  src={viewDoc.dataUrl}
                  alt={viewDoc.name}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <iframe
                  src={viewDoc.dataUrl}
                  title={viewDoc.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MedicalHistory;
