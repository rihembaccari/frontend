// ═══════════════════════════════════════════════════════════════════
// ProjetModal.jsx  —  Sprint 3  (US-05: pre-filled edit)
// Handles both CREATE (no projet prop) and EDIT (projet prop present)
// ═══════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import './css/ProjetModal.css';

// ─── Empty form default ────────────────────────────────────────────
const EMPTY = {
  nom: '', description: '', chefProjetId: '', statutId: '',
  regionId: '', budgetPrevu: '', dateDebut: '', dateFinPrevue: '',
  lignesFacturation: [], lignesReglement: [],
};

// ─── Map ProjetResponse → form fields (US-05) ──────────────────────
function toFormState(projet) {
  if (!projet) return { ...EMPTY };
  return {
    nom:             projet.nom             ?? '',
    description:     projet.description     ?? '',
    chefProjetId:    projet.chefProjetId    != null ? String(projet.chefProjetId)  : '',
    statutId:        projet.statutId        != null ? String(projet.statutId)      : '',
    regionId:        projet.regionId        != null ? String(projet.regionId)      : '',
    budgetPrevu:     projet.budgetPrevu     != null ? String(projet.budgetPrevu)   : '',
    dateDebut:       projet.dateDebut       ?? '',
    dateFinPrevue:   projet.dateFinPrevue   ?? '',
    lignesFacturation: (projet.lignesFacturation ?? []).map(l => ({
      libelle:   l.libelle   ?? '',
      dateDebut: l.dateDebut ?? '',
      dateFin:   l.dateFin   ?? '',
    })),
    lignesReglement: (projet.lignesReglement ?? []).map(l => ({
      libelle:      l.libelle      ?? '',
      dateEcheance: l.dateEcheance ?? '',
      montant:      l.montant      != null ? String(l.montant) : '',
    })),
  };
}

export default function ProjetModal({ projet, statuts, utilisateurs, regions, onSave, onClose }) {
  const isEdit = !!projet;

  const [form, setForm]         = useState(() => toFormState(projet));
  const [errors, setErrors]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState('');

  // US-05: re-sync if projet prop changes
  useEffect(() => {
    setForm(toFormState(projet));
    setErrors({});
    setSaveErr('');
  }, [projet?.id]);

  // ─── Generic field setter ──────────────────────────────────────
  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  // ─── Facturation lines ─────────────────────────────────────────
  const addFact    = () => setForm(f => ({
    ...f, lignesFacturation: [...f.lignesFacturation, { libelle: '', dateDebut: '', dateFin: '' }],
  }));
  const removeFact = i => setForm(f => ({
    ...f, lignesFacturation: f.lignesFacturation.filter((_, idx) => idx !== i),
  }));
  const setFact = (i, field, val) => setForm(f => {
    const lines = [...f.lignesFacturation];
    lines[i] = { ...lines[i], [field]: val };
    return { ...f, lignesFacturation: lines };
  });

  // ─── Reglement lines ───────────────────────────────────────────
  const addRegl    = () => setForm(f => ({
    ...f, lignesReglement: [...f.lignesReglement, { libelle: '', dateEcheance: '', montant: '' }],
  }));
  const removeRegl = i => setForm(f => ({
    ...f, lignesReglement: f.lignesReglement.filter((_, idx) => idx !== i),
  }));
  const setRegl = (i, field, val) => setForm(f => {
    const lines = [...f.lignesReglement];
    lines[i] = { ...lines[i], [field]: val };
    return { ...f, lignesReglement: lines };
  });

  // ─── Client-side validation ────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.nom.trim())      e.nom       = 'Project name is required';
    if (!form.statutId)        e.statutId  = 'Status is required';
    if (!form.chefProjetId)    e.chefProjetId = 'Project manager is required';
    if (!form.dateFinPrevue)   e.dateFinPrevue = 'End date is required';
    return e;
  };

  // ─── Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setSaveErr('');
    try {
      await onSave({
        nom:           form.nom.trim(),
        description:   form.description.trim() || null,
        chefProjetId:  form.chefProjetId  ? Number(form.chefProjetId)  : null,
        statutId:      form.statutId      ? Number(form.statutId)      : null,
        regionId:      form.regionId      ? Number(form.regionId)      : null,
        budgetPrevu:   form.budgetPrevu   ? parseFloat(form.budgetPrevu) : null,
        dateDebut:     form.dateDebut     || null,
        dateFinPrevue: form.dateFinPrevue,
        lignesFacturation: form.lignesFacturation.map(l => ({
          libelle:   l.libelle,
          dateDebut: l.dateDebut || null,
          dateFin:   l.dateFin   || null,
        })),
        lignesReglement: form.lignesReglement.map(l => ({
          libelle:      l.libelle,
          dateEcheance: l.dateEcheance || null,
          montant:      l.montant ? parseFloat(l.montant) : null,
        })),
      });
    } catch (err) {
      setSaveErr(err.message || 'Save error');
    } finally {
      setSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  return (
    <div className="pm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pm-container">

        {/* Header */}
        <div className="pm-header">
          <div className="pm-header__info">
            <h2 className="pm-title">
              {isEdit ? 'Edit Project' : 'New Project'}
            </h2>
            {isEdit && (
              <p className="pm-subtitle">ID #{projet.id} · {projet.nom}</p>
            )}
          </div>
          <button className="pm-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form className="pm-form" onSubmit={handleSubmit} noValidate>
          <div className="pm-body">

            {/* ── Section 1: General Information ── */}
            <fieldset className="pm-section">
              <legend className="pm-section__title">General Information</legend>

              <div className="pm-row pm-row--full">
                <div className="pm-field">
                  <label className="pm-label">
                    Project Name <span className="pm-req">*</span>
                  </label>
                  <input
                    type="text"
                    className={`pm-input${errors.nom ? ' pm-input--err' : ''}`}
                    placeholder="e.g. Assalam Clinic – Nador"
                    value={form.nom}
                    onChange={e => set('nom', e.target.value)}
                  />
                  {errors.nom && <span className="pm-err-msg">{errors.nom}</span>}
                </div>
              </div>

              <div className="pm-row pm-row--full">
                <div className="pm-field">
                  <label className="pm-label">Description</label>
                  <textarea
                    className="pm-textarea"
                    rows={3}
                    placeholder="Optional description…"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>

            {/* ── Section 2: Details ── */}
            <fieldset className="pm-section">
              <legend className="pm-section__title">Details &amp; Assignments</legend>

              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">
                    Project Manager <span className="pm-req">*</span>
                  </label>
                  <select
                    className={`pm-select${errors.chefProjetId ? ' pm-input--err' : ''}`}
                    value={form.chefProjetId}
                    onChange={e => set('chefProjetId', e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {utilisateurs.map(u => (
                      <option key={u.id} value={u.id}>{u.nomComplet}</option>
                    ))}
                  </select>
                  {errors.chefProjetId && <span className="pm-err-msg">{errors.chefProjetId}</span>}
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Statut <span className="pm-req">*</span>
                  </label>
                  <select
                    className={`pm-select${errors.statutId ? ' pm-input--err' : ''}`}
                    value={form.statutId}
                    onChange={e => set('statutId', e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {statuts.map(s => (
                      <option key={s.id} value={s.id}>{s.libelle}</option>
                    ))}
                  </select>
                  {errors.statutId && <span className="pm-err-msg">{errors.statutId}</span>}
                </div>
              </div>

              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Region</label>
                  <select
                    className="pm-select"
                    value={form.regionId}
                    onChange={e => set('regionId', e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{r.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="pm-field">
                  <label className="pm-label">Planned Budget (MAD)</label>
                  <input
                    type="number"
                    className="pm-input"
                    placeholder="0.00"
                    value={form.budgetPrevu}
                    onChange={e => set('budgetPrevu', e.target.value)}
                    min="0" step="0.01"
                  />
                </div>
              </div>

              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Start Date</label>
                  <input
                    type="date"
                    className="pm-input"
                    value={form.dateDebut}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => { set('dateDebut', e.target.value); if (form.dateFinPrevue && e.target.value > form.dateFinPrevue) set('dateFinPrevue', '') }}
                  />
                </div>

                <div className="pm-field">
                  <label className="pm-label">
                    Expected End Date <span className="pm-req">*</span>
                  </label>
                  <input
                    type="date"
                    className={`pm-input${errors.dateFinPrevue ? ' pm-input--err' : ''}`}
                    value={form.dateFinPrevue}
                    min={form.dateDebut || new Date().toISOString().split('T')[0]}
                    onChange={e => set('dateFinPrevue', e.target.value)}
                  />
                  {errors.dateFinPrevue && <span className="pm-err-msg">{errors.dateFinPrevue}</span>}
                </div>
              </div>
            </fieldset>

            {/* ── Section 3: Facturation ── */}
            <fieldset className="pm-section">
              <div className="pm-section__head">
                <legend className="pm-section__title">Billing Schedule</legend>
                <span className="pm-section__count">{form.lignesFacturation.length} line(s)</span>
              </div>

              {form.lignesFacturation.map((l, i) => (
                <div key={i} className="pm-ligne">
                  <span className="pm-ligne__num">{i + 1}</span>
                  <input type="text"    className="pm-input pm-ligne__lib"   placeholder="Label"  value={l.libelle}   onChange={e => setFact(i,'libelle',  e.target.value)} />
                  <input type="date"    className="pm-input pm-ligne__date"                         value={l.dateDebut} min={new Date().toISOString().split('T')[0]} onChange={e => setFact(i,'dateDebut',e.target.value)} />
                  <span className="pm-ligne__arrow">→</span>
                  <input type="date"    className="pm-input pm-ligne__date"                         value={l.dateFin}   min={l.dateDebut || new Date().toISOString().split('T')[0]} onChange={e => setFact(i,'dateFin',  e.target.value)} />
                  <button type="button" className="pm-ligne__del" onClick={() => removeFact(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="pm-add-line" onClick={addFact}>
                <span>+</span> Add billing line
              </button>
            </fieldset>

            {/* ── Section 4: Payment ── */}
            <fieldset className="pm-section">
              <div className="pm-section__head">
                <legend className="pm-section__title">Payment Schedule</legend>
                <span className="pm-section__count">{form.lignesReglement.length} line(s)</span>
              </div>

              {form.lignesReglement.map((l, i) => (
                <div key={i} className="pm-ligne">
                  <span className="pm-ligne__num">{i + 1}</span>
                  <input type="text"    className="pm-input pm-ligne__lib"     placeholder="Label"    value={l.libelle}      onChange={e => setRegl(i,'libelle',     e.target.value)} />
                  <input type="date"    className="pm-input pm-ligne__date"                             value={l.dateEcheance} min={new Date().toISOString().split('T')[0]} onChange={e => setRegl(i,'dateEcheance',e.target.value)} />
                  <input type="number"  className="pm-input pm-ligne__montant" placeholder="Montant"   value={l.montant}      onChange={e => setRegl(i,'montant',     e.target.value)} min="0" step="0.01"/>
                  <button type="button" className="pm-ligne__del" onClick={() => removeRegl(i)}>✕</button>
                </div>
              ))}
              <button type="button" className="pm-add-line" onClick={addRegl}>
                <span>+</span> Add payment line
              </button>
            </fieldset>

          </div>

          {/* Footer */}
          <div className="pm-footer">
            {saveErr && (
              <div className="pm-save-err">⚠ {saveErr}</div>
            )}
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving
                ? <><span className="btn-spinner" /> Saving…</>
                : isEdit ? '✓ Save changes' : '✓ Create project'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
