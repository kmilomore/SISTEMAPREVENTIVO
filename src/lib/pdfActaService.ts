import { jsPDF } from 'jspdf'
import type { ActaVisita } from '../types/actas'

// TODO: INSERTAR AQUÍ FORMATO INSTITUCIONAL DEL ACTA EN PDF
// El template actual es un placeholder funcional. Reemplazar con el diseño
// gráfico definitivo del SLEP Colchagua cuando esté disponible.

const LOGO_PATH = '/image1.webp'

function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('No se pudo cargar el logo'))
    img.src = src
  })
}

function addSectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(0, 51, 160)
  doc.rect(14, y, 182, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(text.toUpperCase(), 17, y + 5)
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'normal')
  return y + 11
}

function addField(doc: jsPDF, label: string, value: string, x: number, y: number, maxWidth = 85): number {
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text(label.toUpperCase(), x, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(9)
  const lines = doc.splitTextToSize(value || 'Sin dato', maxWidth)
  doc.text(lines, x, y + 4)
  return y + 4 + lines.length * 4.5
}

function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 275) {
    doc.addPage()
    return 20
  }
  return y
}

export async function generarActaPdf(acta: ActaVisita & { id: string }): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // ── LOGO ──────────────────────────────────────────────────────────────────
  try {
    const logoB64 = await loadImageAsBase64(LOGO_PATH)
    doc.addImage(logoB64, 'PNG', 14, 10, 22, 22)
  } catch {
    // logo opcional
  }

  // ── ENCABEZADO ────────────────────────────────────────────────────────────
  doc.setDrawColor(213, 43, 30)
  doc.setLineWidth(0.8)
  doc.line(14, 35, 196, 35)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('SERVICIO LOCAL DE EDUCACIÓN PÚBLICA COLCHAGUA', 40, 18)
  doc.text('Unidad de Prevención de Riesgos', 40, 23)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 51, 160)
  doc.text('ACTA DE VISITA — ASESORÍA', 40, 31)

  // Folio (caja destacada, esquina superior derecha)
  const folio = acta.folio ?? 'SIN FOLIO'
  doc.setFillColor(0, 51, 160)
  doc.roundedRect(140, 8, 56, 14, 2, 2, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('FOLIO', 168, 14, { align: 'center' })
  doc.setFontSize(11)
  doc.text(folio, 168, 20, { align: 'center' })

  // Metadata inferior
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`ID: ${acta.id}`, 14, 40)
  doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 120, 40)

  let y = 47

  // ── IDENTIFICACIÓN DEL ESTABLECIMIENTO ───────────────────────────────────
  y = addSectionTitle(doc, '1. Identificación del establecimiento', y)

  const nombreEnd = addField(doc, 'Nombre', acta.establecimiento_nombre ?? '', 14, y, 115)
  const rbdEnd = addField(doc, 'RBD', acta.establecimiento_rbd ?? '', 140, y, 55)
  y = Math.max(nombreEnd, rbdEnd) + 2

  const comunaEnd = addField(doc, 'Comuna', acta.establecimiento_comuna ?? '', 14, y, 55)
  const tipoEnd = addField(doc, 'Tipo de acta', 'Asesoría', 80, y, 55)
  const estadoEnd = addField(doc, 'Estado', acta.estado ?? 'Registrada', 140, y, 55)
  y = Math.max(comunaEnd, tipoEnd, estadoEnd) + 4

  // ── FECHA Y HORA ──────────────────────────────────────────────────────────
  y = checkPageBreak(doc, y)
  y = addSectionTitle(doc, '2. Fecha y horario', y)

  const fechaFmt = acta.fecha_visita
    ? new Date(acta.fecha_visita + 'T12:00:00').toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  const fEnd = addField(doc, 'Fecha de visita', fechaFmt, 14, y, 90)
  const hIEnd = addField(doc, 'Hora inicio', acta.hora_inicio, 110, y, 35)
  const hTEnd = addField(doc, 'Hora término', acta.hora_termino, 155, y, 35)
  y = Math.max(fEnd, hIEnd, hTEnd) + 4

  // ── PARTICIPANTES ─────────────────────────────────────────────────────────
  y = checkPageBreak(doc, y)
  y = addSectionTitle(doc, `3. Participantes (${acta.participantes.length})`, y)

  if (acta.participantes.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('Sin participantes registrados.', 14, y + 4)
    y += 10
  } else {
    // Encabezado tabla
    doc.setFillColor(235, 240, 255)
    doc.rect(14, y, 182, 6, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 51, 160)
    doc.text('NOMBRE', 16, y + 4)
    doc.text('ROL / ESTAMENTO', 90, y + 4)
    doc.text('CONTACTO', 150, y + 4)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    for (const [i, p] of acta.participantes.entries()) {
      y = checkPageBreak(doc, y, 8)
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y - 1, 182, 6.5, 'F')
      }
      doc.setFontSize(8.5)
      doc.text(p.nombre || '', 16, y + 4)
      doc.text(p.rol_estamento || '', 90, y + 4)
      doc.text(p.contacto || '', 150, y + 4)
      y += 6.5
    }
    y += 4
  }

  // ── DESARROLLO DE LA VISITA ───────────────────────────────────────────────
  y = checkPageBreak(doc, y, 30)
  y = addSectionTitle(doc, '4. Desarrollo de la visita', y)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('TEMAS ANTERIORES TRATADOS', 14, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  const temasLines = doc.splitTextToSize(acta.temas_anteriores || 'Sin información registrada.', 182)
  for (const line of temasLines) {
    y = checkPageBreak(doc, y, 6)
    doc.text(line as string, 14, y)
    y += 4.5
  }
  y += 4

  y = checkPageBreak(doc, y, 20)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(80, 80, 80)
  doc.text('ACTIVIDAD REALIZADA', 14, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  const actLines = doc.splitTextToSize(acta.actividad_realizada || 'Sin información registrada.', 182)
  for (const line of actLines) {
    y = checkPageBreak(doc, y, 6)
    doc.text(line as string, 14, y)
    y += 4.5
  }
  y += 4

  // ── ACUERDOS ──────────────────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 30)
  y = addSectionTitle(doc, `5. Acuerdos, medidas o compromisos (${acta.acuerdos.length})`, y)

  if (acta.acuerdos.length === 0) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text('Sin acuerdos registrados.', 14, y + 4)
    y += 10
  } else {
    doc.setFillColor(235, 240, 255)
    doc.rect(14, y, 182, 6, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 51, 160)
    doc.text('N°', 16, y + 4)
    doc.text('DESCRIPCIÓN', 24, y + 4)
    doc.text('RESPONSABLE', 120, y + 4)
    doc.text('PLAZO', 155, y + 4)
    doc.text('ESTADO', 172, y + 4)
    y += 7

    for (const [i, a] of acta.acuerdos.entries()) {
      y = checkPageBreak(doc, y, 10)
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(14, y - 1, 182, 8, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(30, 30, 30)
      doc.text(String(i + 1), 16, y + 4)
      const descLines = doc.splitTextToSize(a.descripcion || '', 90)
      doc.text(descLines, 24, y + 4)
      doc.text(a.responsable || '', 120, y + 4)
      doc.text(a.plazo || '', 155, y + 4)
      doc.text(a.estado || 'Pendiente', 172, y + 4)
      y += Math.max(descLines.length * 4.5, 8) + 1
    }
    y += 4
  }

  // ── NOTA DE REGISTRO ──────────────────────────────────────────────────────
  if (acta.created_by_nombre) {
    y = checkPageBreak(doc, y, 12)
    y += 6
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(`Registrado por: ${acta.created_by_nombre}`, 14, y)
  }

  // ── PIE DE PÁGINA ─────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(...([213, 43, 30] as [number, number, number]))
    doc.setLineWidth(0.4)
    doc.line(14, 287, 196, 287)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text('SLEP Colchagua · Unidad de Prevención de Riesgos', 14, 291)
    doc.text(`Página ${i} de ${pageCount}`, 176, 291)
  }

  const buffer = await doc.output('arraybuffer')
  return new Uint8Array(buffer)
}

export function descargarActaPdf(pdfBytes: Uint8Array, nombre: string) {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}
