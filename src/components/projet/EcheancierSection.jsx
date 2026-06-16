import { useCallback } from 'react'
import TextBox from 'devextreme-react/text-box'
import DateBox from 'devextreme-react/date-box'
import NumberBox from 'devextreme-react/number-box'
import Button from 'devextreme-react/button'
import './css/EcheancierSection.css'

// ── Échéancier de Facturation ─────────────────────────────────
export function FacturationSection({ lignes, onChange }) {
  const addLigne = useCallback(() => {
    onChange([...lignes, { libelle: '', dateDebut: null, dateFin: null }])
  }, [lignes, onChange])

  const removeLigne = useCallback((index) => {
    onChange(lignes.filter((_, i) => i !== index))
  }, [lignes, onChange])

  const updateLigne = useCallback((index, field, value) => {
    const updated = lignes.map((l, i) => i === index ? { ...l, [field]: value } : l)
    onChange(updated)
  }, [lignes, onChange])

  return (
    <div className="echeancier-body">
      {lignes.map((ligne, index) => (
        <div key={index} className="echeancier-row">
          <TextBox
            placeholder="Label (e.g. Tranche 1 - Launch)"
            value={ligne.libelle}
            onValueChanged={e => updateLigne(index, 'libelle', e.value)}
            className="ec-libelle"
          />
          <DateBox
            placeholder="Start date"
            value={ligne.dateDebut}
            onValueChanged={e => updateLigne(index, 'dateDebut', e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            className="ec-date"
          />
          <DateBox
            placeholder="Date fin"
            value={ligne.dateFin}
            onValueChanged={e => updateLigne(index, 'dateFin', e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            className="ec-date"
          />
          <Button
            icon="close"
            type="danger"
            stylingMode="outlined"
            onClick={() => removeLigne(index)}
            className="ec-remove"
          />
        </div>
      ))}
      <Button
        text="+ Ajouter Ligne Facturation"
        type="default"
        stylingMode="outlined"
        onClick={addLigne}
        className="ec-add-btn"
      />
    </div>
  )
}

// ── Échéancier de Règlement ───────────────────────────────────
export function ReglementSection({ lignes, onChange }) {
  const addLigne = useCallback(() => {
    onChange([...lignes, { libelle: '', dateEcheance: null, montant: null }])
  }, [lignes, onChange])

  const removeLigne = useCallback((index) => {
    onChange(lignes.filter((_, i) => i !== index))
  }, [lignes, onChange])

  const updateLigne = useCallback((index, field, value) => {
    const updated = lignes.map((l, i) => i === index ? { ...l, [field]: value } : l)
    onChange(updated)
  }, [lignes, onChange])

  return (
    <div className="echeancier-body">
      {lignes.map((ligne, index) => (
        <div key={index} className="echeancier-row">
          <TextBox
            placeholder="Label (e.g. Initial deposit)"
            value={ligne.libelle}
            onValueChanged={e => updateLigne(index, 'libelle', e.value)}
            className="ec-libelle"
          />
          <DateBox
            placeholder="Due date"
            value={ligne.dateEcheance}
            onValueChanged={e => updateLigne(index, 'dateEcheance', e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            className="ec-date"
          />
          <NumberBox
            placeholder="Montant (MAD)"
            value={ligne.montant}
            onValueChanged={e => updateLigne(index, 'montant', e.value)}
            format="#,##0.00"
            className="ec-date"
          />
          <Button
            icon="close"
            type="danger"
            stylingMode="outlined"
            onClick={() => removeLigne(index)}
            className="ec-remove"
          />
        </div>
      ))}
      <Button
        text="+ Add Payment Line"
        type="default"
        stylingMode="outlined"
        onClick={addLigne}
        className="ec-add-btn"
      />
    </div>
  )
}