// ═══════════════════════════════════════════════════════════════════
// charterVisualExport.js  —  Export charter as visual/image
// ═══════════════════════════════════════════════════════════════════

/**
 * Export the charter visual representation as a PDF using html2canvas
 * @param {React.Ref} charterBodyRef - Reference to the charter DOM element
 * @param {string} projectName - Name of the project for the filename
 */
export async function exportCharterVisual(charterBodyRef, projectName) {
  try {
    const html2canvas = (await import('html2canvas')).default
    const jsPDF = (await import('jspdf')).jsPDF

    if (!charterBodyRef?.current) {
      alert('Charter content not found')
      return
    }

    const canvas = await html2canvas(charterBodyRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let yPosition = 10

    if (imgHeight > pageHeight - 20) {
      const numPages = Math.ceil(imgHeight / (pageHeight - 20))
      for (let i = 0; i < numPages; i++) {
        if (i > 0) pdf.addPage()
        const sourceY = i * ((canvas.height * (pageHeight - 20)) / imgHeight)
        const sourceHeight = Math.min(
          canvas.height - sourceY,
          (canvas.height * (pageHeight - 20)) / imgHeight
        )

        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight
        const ctx = pageCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, -sourceY, canvas.width, canvas.height)
        const pageImgData = pageCanvas.toDataURL('image/png')
        pdf.addImage(pageImgData, 'PNG', 10, yPosition, imgWidth, (sourceHeight * imgWidth) / canvas.width)
      }
    } else {
      pdf.addImage(imgData, 'PNG', 10, yPosition, imgWidth, imgHeight)
    }

    const filename = `charter_${projectName || 'export'}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(filename)
  } catch (error) {
    console.error('Visual export failed:', error)
    alert('Visual export failed. Ensure html2canvas and jsPDF are installed: npm install html2canvas jspdf')
  }
}
