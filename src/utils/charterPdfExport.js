// ═══════════════════════════════════════════════════════════════════
// src/utils/charterPdfExport.js
// Pure jsPDF export — no html2canvas, no screenshots.
// Generates a clean, professional multi-page PDF document.
//
// Usage:
//   import { exportCharterPdf } from '../../utils/charterPdfExport'
//   exportCharterPdf(charter, selectedProjet, t, lang)
//
// Install:  npm install jspdf
// ═══════════════════════════════════════════════════════════════════

import { jsPDF } from 'jspdf'

// ── Design tokens ──────────────────────────────────────────────────
const C = {
  blue:       [37,  99,  235],
  blueDark:   [29,  78,  216],
  blueLight:  [239, 246, 255],
  text:       [15,  23,  42],
  text2:      [71,  85,  105],
  text3:      [148, 163, 184],
  border:     [226, 232, 240],
  surface:    [248, 250, 252],
  green:      [22,  163, 74],
  greenLight: [240, 253, 244],
  white:      [255, 255, 255],
  amber:      [217, 119, 6],
  red:        [220, 38,  38],
}

const PAGE_W   = 210   // A4 width mm
const PAGE_H   = 297   // A4 height mm
const MARGIN_X = 16
const MARGIN_Y = 20
const CONTENT_W = PAGE_W - MARGIN_X * 2

// ── Helpers ────────────────────────────────────────────────────────
function setFill(doc, rgb)   { doc.setFillColor(...rgb) }
function setDraw(doc, rgb)   { doc.setDrawColor(...rgb) }
function setTextColor(doc, rgb) { doc.setTextColor(...rgb) }
function setFont(doc, weight, size) {
  doc.setFont('helvetica', weight === 'bold' ? 'bold' : 'normal')
  doc.setFontSize(size)
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2,
  }).format(n || 0)
}

// ── Page class — manages cursor + auto page-break ──────────────────
class Page {
  constructor(doc) {
    this.doc = doc
    this.y   = MARGIN_Y
    this.pageNum = 1
  }

  // Advance cursor, add new page if needed
  advance(h) {
    if (this.y + h > PAGE_H - 16) {
      this.doc.addPage()
      this.pageNum++
      this.y = MARGIN_Y
      this._drawHeader()
    }
  }

  // Draw thin header line on continuation pages
  _drawHeader() {
    setDraw(this.doc, C.border)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN_X, 12, PAGE_W - MARGIN_X, 12)
    setFont(this.doc, 'normal', 8)
    setTextColor(this.doc, C.text3)
    this.doc.text('Project Charter', MARGIN_X, 9)
    this.doc.text(`Page ${this.pageNum}`, PAGE_W - MARGIN_X, 9, { align: 'right' })
    this.y = 18
  }
}

// ── Section heading block ──────────────────────────────────────────
function drawSectionTitle(pg, icon, title) {
  const { doc } = pg
  pg.advance(14)

  // Colored left bar
  setFill(doc, C.blue)
  doc.rect(MARGIN_X, pg.y, 3, 8, 'F')

  // Icon + title
  setFont(doc, 'bold', 11)
  setTextColor(doc, C.text)
  doc.text(`${icon}  ${title}`, MARGIN_X + 6, pg.y + 5.8)

  pg.y += 12

  // Underline
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.line(MARGIN_X, pg.y - 2, PAGE_W - MARGIN_X, pg.y - 2)
  pg.y += 2
}

// ── Two-column key/value row ───────────────────────────────────────
function drawFieldRow(pg, label, value, fullWidth = false) {
  const { doc } = pg
  const labelW  = fullWidth ? CONTENT_W * 0.25 : CONTENT_W * 0.30
  const valueW  = CONTENT_W - labelW - 4
  const valStr  = (value || '—').toString()

  // Estimate height needed
  setFont(doc, 'normal', 9)
  const lines   = doc.splitTextToSize(valStr, valueW)
  const rowH    = Math.max(7, lines.length * 4.5 + 3)

  pg.advance(rowH)

  // Label
  setFont(doc, 'bold', 8)
  setTextColor(doc, C.text3)
  doc.text(label.toUpperCase(), MARGIN_X, pg.y + 4)

  // Value
  setFont(doc, 'normal', 9)
  setTextColor(doc, C.text)
  doc.text(lines, MARGIN_X + labelW, pg.y + 4)

  // Divider
  setDraw(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_X, pg.y + rowH, PAGE_W - MARGIN_X, pg.y + rowH)

  pg.y += rowH + 1
}

// ── Two side-by-side fields ────────────────────────────────────────
function drawFieldPair(pg, left, right) {
  const { doc } = pg
  const halfW = CONTENT_W / 2 - 4

  const lLines = doc.splitTextToSize((left.value || '—').toString(), halfW - 30)
  const rLines = doc.splitTextToSize((right.value || '—').toString(), halfW - 30)
  const rowH   = Math.max(7, Math.max(lLines.length, rLines.length) * 4.5 + 3)

  pg.advance(rowH)

  // Left cell
  setFont(doc, 'bold', 8)
  setTextColor(doc, C.text3)
  doc.text(left.label.toUpperCase(), MARGIN_X, pg.y + 4)
  setFont(doc, 'normal', 9)
  setTextColor(doc, C.text)
  doc.text(lLines, MARGIN_X + 30, pg.y + 4)

  // Right cell
  const rx = MARGIN_X + CONTENT_W / 2 + 4
  setFont(doc, 'bold', 8)
  setTextColor(doc, C.text3)
  doc.text(right.label.toUpperCase(), rx, pg.y + 4)
  setFont(doc, 'normal', 9)
  setTextColor(doc, C.text)
  doc.text(rLines, rx + 30, pg.y + 4)

  // Divider
  setDraw(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_X, pg.y + rowH, PAGE_W - MARGIN_X, pg.y + rowH)

  pg.y += rowH + 1
}

// ── Textarea field (multi-line) ────────────────────────────────────
function drawTextField(pg, label, value) {
  const { doc } = pg
  if (!value || !value.trim()) return

  const lines = doc.splitTextToSize(value, CONTENT_W - 4)
  const rowH  = lines.length * 4.5 + 8

  pg.advance(rowH)

  setFont(doc, 'bold', 8)
  setTextColor(doc, C.text3)
  doc.text(label.toUpperCase(), MARGIN_X, pg.y + 4)

  pg.y += 6

  setFont(doc, 'normal', 9)
  setTextColor(doc, C.text)
  doc.text(doc.splitTextToSize(value, CONTENT_W - 4), MARGIN_X, pg.y + 4)

  pg.y += lines.length * 4.5 + 2

  setDraw(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_X, pg.y, PAGE_W - MARGIN_X, pg.y)
  pg.y += 3
}

// ── Three-column textarea section (risks/constraints/assumptions) ──
function drawThreeCol(pg, items) {
  const { doc } = pg
  const colW = CONTENT_W / 3 - 2

  // Measure max height needed
  let maxLines = 1
  items.forEach(({ value }) => {
    if (value) {
      const ls = doc.splitTextToSize(value, colW - 2)
      maxLines = Math.max(maxLines, ls.length)
    }
  })
  const blockH = maxLines * 4.5 + 12

  pg.advance(blockH)

  items.forEach(({ label, value }, idx) => {
    const x = MARGIN_X + idx * (colW + 2)

    // Label
    setFont(doc, 'bold', 8)
    setTextColor(doc, C.text3)
    doc.text(label.toUpperCase(), x, pg.y + 4)

    // Value
    if (value && value.trim()) {
      setFont(doc, 'normal', 9)
      setTextColor(doc, C.text)
      const ls = doc.splitTextToSize(value, colW - 2)
      doc.text(ls, x, pg.y + 9)
    } else {
      setFont(doc, 'normal', 9)
      setTextColor(doc, C.text3)
      doc.text('—', x, pg.y + 9)
    }
  })

  pg.y += blockH

  setDraw(doc, C.border)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_X, pg.y, PAGE_W - MARGIN_X, pg.y)
  pg.y += 4
}

// ── Generic table ──────────────────────────────────────────────────
function drawTable(pg, headers, rows, colWidths) {
  const { doc } = pg
  const ROW_H     = 7
  const HEADER_H  = 8

  // ── Table header
  pg.advance(HEADER_H + 2)
  setFill(doc, C.surface)
  doc.rect(MARGIN_X, pg.y, CONTENT_W, HEADER_H, 'F')
  setDraw(doc, C.border)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN_X, pg.y, CONTENT_W, HEADER_H, 'S')

  setFont(doc, 'bold', 8)
  setTextColor(doc, C.text2)

  let cx = MARGIN_X + 2
  headers.forEach((h, i) => {
    doc.text(h.toUpperCase(), cx, pg.y + 5.5)
    cx += colWidths[i]
  })
  pg.y += HEADER_H

  if (rows.length === 0) {
    pg.advance(ROW_H)
    setFont(doc, 'normal', 9)
    setTextColor(doc, C.text3)
    doc.text('—', MARGIN_X + CONTENT_W / 2, pg.y + 5, { align: 'center' })
    setDraw(doc, C.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_X, pg.y + ROW_H, PAGE_W - MARGIN_X, pg.y + ROW_H)
    pg.y += ROW_H
    return
  }

  // ── Data rows
  rows.forEach((row, ri) => {
    // Measure height of tallest cell in this row
    let maxLines = 1
    row.forEach((cell, ci) => {
      const txt = (cell || '').toString()
      const ls  = doc.splitTextToSize(txt, colWidths[ci] - 4)
      maxLines   = Math.max(maxLines, ls.length)
    })
    const rh = Math.max(ROW_H, maxLines * 4.5 + 3)

    pg.advance(rh)

    // Row background
    if (ri % 2 === 0) {
      setFill(doc, C.white)
    } else {
      setFill(doc, [250, 251, 252])
    }
    doc.rect(MARGIN_X, pg.y, CONTENT_W, rh, 'F')

    // Row border
    setDraw(doc, C.border)
    doc.setLineWidth(0.2)
    doc.line(MARGIN_X, pg.y + rh, PAGE_W - MARGIN_X, pg.y + rh)

    // Cells
    let cx2 = MARGIN_X + 2
    row.forEach((cell, ci) => {
      const txt  = (cell || '—').toString()
      const ls   = doc.splitTextToSize(txt, colWidths[ci] - 4)
      const align = ci >= headers.length - 2 && headers.length >= 4 ? 'right' : 'left'

      setFont(doc, 'normal', 9)
      setTextColor(doc, C.text)

      if (align === 'right') {
        doc.text(ls, cx2 + colWidths[ci] - 4, pg.y + 5, { align: 'right' })
      } else {
        doc.text(ls, cx2, pg.y + 5)
      }
      cx2 += colWidths[ci]
    })

    pg.y += rh
  })

  pg.y += 4
}

// ── Outer border around a section block ───────────────────────────
function drawSectionBox(pg, drawFn) {
  const startY = pg.y
  drawFn()
  const endY = pg.y
  setDraw(pg.doc, C.border)
  pg.doc.setLineWidth(0.3)
  pg.doc.rect(MARGIN_X, startY - 2, CONTENT_W, endY - startY + 2, 'S')
  pg.y += 4
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════════
export function exportCharterPdf(charter, projet, t, lang = 'fr') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pg  = new Page(doc)

  const projectName = charter?.projectName || projet?.nom || '—'
  const fileName    = `charter_${(projectName).replace(/\s+/g,'_').toLowerCase()}.pdf`

  // ── COVER / HEADER ────────────────────────────────────────────────
  // Blue header band
  setFill(doc, C.blue)
  doc.rect(0, 0, PAGE_W, 42, 'F')

  // Title
  setFont(doc, 'bold', 20)
  setTextColor(doc, C.white)
  doc.text(t('charter', 'pageTitle'), MARGIN_X, 22)

  // Project name subtitle
  setFont(doc, 'normal', 12)
  setTextColor(doc, [191, 219, 254])
  doc.text(projectName, MARGIN_X, 32)

  // Export date (top-right)
  const today = new Date().toLocaleDateString('fr-FR')
  setFont(doc, 'normal', 8)
  setTextColor(doc, [191, 219, 254])
  doc.text(today, PAGE_W - MARGIN_X, 10, { align: 'right' })

  // Watermark-style "CONFIDENTIAL" stripe (subtle)
  setFont(doc, 'normal', 7)
  setTextColor(doc, [147, 197, 253])
  doc.text('GestionPro  ·  Clinisys', PAGE_W - MARGIN_X, 38, { align: 'right' })

  pg.y = 52

  // ── SECTION 1: Overview ───────────────────────────────────────────
  drawSectionTitle(pg, '🏢', t('charter', 'sec1Title'))

  drawFieldPair(pg,
    { label: t('charter', 'fieldName'),    value: projectName },
    { label: t('charter', 'fieldManager'), value: charter?.projectManager || projet?.chefProjetNomComplet || '—' },
  )
  drawFieldPair(pg,
    { label: t('charter', 'fieldSponsor'), value: charter?.projectSponsor || '—' },
    { label: t('charter', 'fieldStart'),   value: fmtDate(charter?.startDate || projet?.dateDebut) },
  )
  drawFieldRow(pg, t('charter', 'fieldEnd'), fmtDate(charter?.expectedCompletionDate || projet?.dateFinPrevue))

  pg.y += 6

  // ── SECTION 2: Scope ──────────────────────────────────────────────
  drawSectionTitle(pg, '🎯', t('charter', 'sec2Title'))
  drawTextField(pg, t('charter', 'fieldInScope'),  charter?.withinScope)
  drawTextField(pg, t('charter', 'fieldOutScope'), charter?.outsideScope)
  drawTextField(pg, t('charter', 'fieldSpecial'),  charter?.specialNeeds)

  pg.y += 4

  // ── SECTION 3: Risks / Constraints / Assumptions ──────────────────
  drawSectionTitle(pg, '⚠️', t('charter', 'sec3Title'))
  drawThreeCol(pg, [
    { label: t('charter', 'fieldRisks'),       value: charter?.risks        },
    { label: t('charter', 'fieldConstraints'), value: charter?.constraints  },
    { label: t('charter', 'fieldAssumptions'), value: charter?.assumptions  },
  ])

  pg.y += 4

  // ── SECTION 4: Milestones ─────────────────────────────────────────
  drawSectionTitle(pg, '🚩', t('charter', 'sec4Title'))
  drawTable(pg,
    [t('charter','colDescription'), t('charter','colStartDate'), t('charter','colEndDate')],
    (charter?.milestones || []).map(m => [
      m.description || '—',
      fmtDate(m.dateDebut),
      fmtDate(m.dateFin),
    ]),
    [CONTENT_W * 0.55, CONTENT_W * 0.225, CONTENT_W * 0.225],
  )

  // ── SECTION 5: Team ───────────────────────────────────────────────
  drawSectionTitle(pg, '👥', t('charter', 'sec5Title'))
  drawTable(pg,
    [t('charter','colName'), t('charter','colRole'), t('charter','colDescription2')],
    (charter?.teamMembers || []).map(tm => [
      tm.name             || '—',
      tm.roleResponsibility || '—',
      tm.description      || '—',
    ]),
    [CONTENT_W * 0.28, CONTENT_W * 0.38, CONTENT_W * 0.34],
  )

  // ── SECTION 6: Costs ──────────────────────────────────────────────
  drawSectionTitle(pg, '💰', t('charter', 'sec6Title'))
  drawTable(pg,
    [t('charter','colCostType'), t('charter','colVendor'), t('charter','colRate'), t('charter','colQty'), t('charter','colAmount')],
    (charter?.costLines || []).map(c => [
      c.costType        || '—',
      c.vendorLaborName || '—',
      fmtCurrency(c.rate),
      String(c.qty ?? '—'),
      fmtCurrency(c.amount),
    ]),
    [CONTENT_W * 0.22, CONTENT_W * 0.30, CONTENT_W * 0.16, CONTENT_W * 0.10, CONTENT_W * 0.22],
  )

  // Total row
  if (charter?.totalCosts != null && (charter?.costLines || []).length > 0) {
    pg.advance(10)
    setFill(doc, C.blueLight)
    doc.rect(MARGIN_X, pg.y, CONTENT_W, 9, 'F')
    setDraw(doc, C.blue)
    doc.setLineWidth(0.4)
    doc.rect(MARGIN_X, pg.y, CONTENT_W, 9, 'S')

    setFont(doc, 'bold', 9)
    setTextColor(doc, C.blue)
    const totalLabel = t('charter', 'totalLabel').toUpperCase()
    doc.text(totalLabel, MARGIN_X + 4, pg.y + 6)
    doc.text(fmtCurrency(charter.totalCosts), PAGE_W - MARGIN_X - 4, pg.y + 6, { align: 'right' })
    pg.y += 13
  }

  // ── FOOTER on all pages ───────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    setDraw(doc, C.border)
    doc.setLineWidth(0.3)
    doc.line(MARGIN_X, PAGE_H - 12, PAGE_W - MARGIN_X, PAGE_H - 12)
    setFont(doc, 'normal', 7.5)
    setTextColor(doc, C.text3)
    doc.text('GestionPro · Clinisys', MARGIN_X, PAGE_H - 7)
    doc.text(`${i} / ${totalPages}`, PAGE_W - MARGIN_X, PAGE_H - 7, { align: 'right' })
    doc.text(today, PAGE_W / 2, PAGE_H - 7, { align: 'center' })
  }

  // ── Save ──────────────────────────────────────────────────────────
  doc.save(fileName)
}