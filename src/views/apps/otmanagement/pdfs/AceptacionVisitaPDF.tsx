'use client'

import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { Box, Typography, Paper } from '@mui/material'

import type { OrdenTrabajo } from '@/types/otTypes'

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void
    previousAutoTable?: {
      finalY: number
    }
  }
}

interface AceptacionVisitaPDFProps {
  ot: OrdenTrabajo
}

// Función para generar el PDF
export const generateAceptacionVisitaPDF = (ot: OrdenTrabajo) => {
  const doc = new jsPDF()

  // Configuración inicial
  doc.setFontSize(12)

  // Crear tabla de encabezado con 3 columnas
  doc.autoTable({
    startY: 10,
    margin: { left: 10, right: 10 },
    tableWidth: 190,
    body: [
      [
        {
          content: '', // Espacio para el logo
          styles: {
            cellWidth: 63,
            minCellHeight: 35,
            valign: 'middle'
          }
        },
        {
          content: 'ACEPTACIÓN VISITA TERRENO',
          styles: {
            halign: 'center',
            valign: 'middle',
            fontSize: 12,
            cellPadding: 2,
            lineHeight: 1.5,
            minCellHeight: 35
          }
        },
        {
          content:
            'R-12-47\n\n' +
            'OT N° ' +
            ot.clave +
            '\n\n' +
            'Autor: Katherine Rivas Castillo\n' +
            'Aprobado por: Juan Salas\n' +
            'Sepúlveda\n' +
            'Fecha Aprobación: 04-08-2022\n' +
            'Versión: 2',
          styles: {
            fontSize: 10,
            cellPadding: 2,
            lineHeight: 1.5,
            cellWidth: 63,
            minCellHeight: 35,
            valign: 'middle'
          }
        }
      ]
    ],
    theme: 'plain',
    styles: {
      overflow: 'linebreak',
      cellWidth: 'wrap',
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 63 }, // Logo
      1: { cellWidth: 'auto' }, // Título central
      2: { cellWidth: 63 } // Información de control
    }
  })

  // Agregar logo
  try {
    const logoPath = '/images/logos/LogoPampa.png'
    const img = new Image()

    img.src = logoPath
    doc.addImage(img, 'PNG', 15, 13, 55, 30)
  } catch (error) {
    console.error('Error al cargar el logo:', error)
  }

  // Resto del contenido...
  const startY = (doc.previousAutoTable?.finalY || 30) + 10

  // Información del cliente y obra
  doc.autoTable({
    startY: startY,
    margin: { left: 10, right: 10 },
    body: [
      [
        { content: 'Cliente:', styles: { fontStyle: 'bold' } },
        { content: ot.agenda?.cliente?.rut + ' - ' + ot.agenda?.cliente?.nombreCliente, colSpan: 3 }
      ],
      [
        { content: 'Obra:', styles: { fontStyle: 'bold' } },
        {
          content:
            ot.agenda?.obra?.numeroObra +
            ' - ' +
            ot.agenda?.obra?.nombreObra +
            ' - ' +
            ot.agenda?.obra?.comuna +
            ' - ' +
            ot.agenda?.obra?.region,
          colSpan: 3
        }
      ]
    ],
    theme: 'plain',
    styles: {
      cellPadding: 4,
      fontSize: 11
    }
  })

  return doc
}

// Componente de vista previa
const AceptacionVisitaPDF = ({ ot }: AceptacionVisitaPDFProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: '100%',
        maxWidth: '100%',
        minHeight: '500px',
        backgroundColor: '#fff',
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: 4, width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
          <tbody>
            <tr style={{ height: '120px' }}>
              <td style={{ width: '25%', padding: '16px', verticalAlign: 'middle' }}>
                <Box
                  component='img'
                  src='/images/logos/LogoPampa.png'
                  alt='Logo PampaAustral'
                  sx={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '80px',
                    objectFit: 'contain'
                  }}
                />
              </td>
              <td style={{ width: '50%', padding: '16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 'bold',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.5
                  }}
                >
                  ACEPTACIÓN VISITA TERRENO
                </Typography>
              </td>
              <td style={{ width: '25%', padding: '16px', verticalAlign: 'middle' }}>
                <Typography
                  sx={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.5,
                    fontSize: '0.875rem'
                  }}
                >
                  R-12-47
                  {'\n\n'}OT N° {ot.clave}
                  {'\n\n'}Autor: Katherine Rivas Castillo
                  {'\n'}Aprobado por: Juan Salas
                  {'\n'}Sepúlveda
                  {'\n'}Fecha Aprobación: 04-08-2022
                  {'\n'}Versión: 2
                </Typography>
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      <Box sx={{ mb: 4, width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '120px' }}>Cliente:</td>
              <td style={{ padding: '8px' }} colSpan={3}>
                {ot.agenda?.cliente?.rut} - {ot.agenda?.cliente?.nombreCliente}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Obra:</td>
              <td style={{ padding: '8px' }} colSpan={3}>
                {ot.agenda?.obra?.numeroObra} - {ot.agenda?.obra?.nombreObra} - {ot.agenda?.obra?.comuna} -{' '}
                {ot.agenda?.obra?.region}
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Paper>
  )
}

export default AceptacionVisitaPDF
