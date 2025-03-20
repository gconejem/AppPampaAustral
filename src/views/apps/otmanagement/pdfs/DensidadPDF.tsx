'use client'

import React from 'react'

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

interface DensidadPDFProps {
  ot: OrdenTrabajo
}

// Función para generar el PDF
export const generateDensidadPDF = (ot: OrdenTrabajo) => {
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
          content:
            'ORDEN DE TRABAJO\nCONTROL DE\nCOMPACTACIÓN Método\nNuclear\n\nSegún 8.502.1 - 8.502.2 Diciembre 2003 MC-V8',
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
            'R-12-03\n\n' +
            'OT N° ' +
            ot.clave +
            '\n\n' +
            'Autor: Katherine Rivas Castillo\n' +
            'Aprobado por: Juan Salas\n' +
            'Sepúlveda\n' +
            'Fecha Aprobación: 01-11-2021\n' +
            'Versión: 13',
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

  // Información técnica en dos columnas
  const infoY = (doc.previousAutoTable?.finalY || startY) + 10

  doc.autoTable({
    startY: infoY,
    margin: { left: 10, right: 10 },
    body: [
      [
        { content: 'Fecha Control:', styles: { fontStyle: 'bold' } },
        new Date(ot.createdAt).toLocaleDateString(),
        { content: 'Laboratorista:', styles: { fontStyle: 'bold' } },
        ot.user?.name || 'Sin asignar'
      ],
      [
        { content: 'Densímetro', styles: { fontStyle: 'bold' } },
        'D-0-06 Marca:' + (ot.densidad?.marca || '') + ' Modelo:' + (ot.densidad?.modelo || ''),
        { content: 'Item:', styles: { fontStyle: 'bold' } },
        (ot.densidad?.item || '') + ' RELLENO'
      ],
      [
        { content: 'N° de Serie:', styles: { fontStyle: 'bold' } },
        '31784',
        { content: 'Obs. al item:', styles: { fontStyle: 'bold' } },
        'Muro'
      ],
      [{ content: 'Conteo Estándar:', styles: { fontStyle: 'bold' } }, 'D:1997 H:667', { content: '', colSpan: 2 }],
      [{ content: 'Tiempo Medición:', styles: { fontStyle: 'bold' } }, '60 seg', { content: '', colSpan: 2 }],
      [
        { content: 'Descrip. visual suelo:', styles: { fontStyle: 'bold' } },
        'Sin Observaciones',
        { content: '', colSpan: 2 }
      ],
      [{ content: 'Observaciones:', styles: { fontStyle: 'bold' } }, 'Informe 986', { content: '', colSpan: 2 }]
    ],
    theme: 'plain',
    styles: {
      cellPadding: 4,
      fontSize: 11
    }
  })

  // Tabla de controles de densidad
  const controlesY = (doc.previousAutoTable?.finalY || startY + 50) + 10

  doc.autoTable({
    startY: controlesY,
    head: [
      [
        'N°',
        'Ubicación',
        'Frente a',
        'Entre',
        'Faja o Lado',
        'Prof. de Ensayo',
        'Capa',
        'D.C.H.\n(Kg/m3)',
        'W%',
        'D.C.S.\n(Kg/m3)',
        'DMCS / DR\n(Kg/m3)',
        'COMP.\n(%)',
        'Exig.\n(%)'
      ]
    ],
    body: [
      [
        '1',
        'Cuadrante CM\ncolumnas 71-81',
        'Columna\n77',
        'Columnas 77-79',
        'No Aplica',
        '15 cm',
        '10 cota\n58.17',
        '2043',
        '16.1',
        '1760',
        '1820',
        '96.7',
        '95'
      ],
      [
        '2',
        'Cuadrante CM\ncolumnas 63-73',
        'Columna\n63',
        'Columnas 63-68',
        'No Aplica',
        '15 cm',
        '10 cota\n51.91',
        '2035',
        '17.6',
        '1730',
        '1820',
        '95.1',
        '95'
      ],
      [
        '3',
        'Cuadrante CM\ncolumnas 50-62',
        'Columna\n55',
        'Columnas 50-62',
        'No Aplica',
        '15 cm',
        '10 cota\n51.91',
        '2039',
        '16.6',
        '1749',
        '1820',
        '96.1',
        '95'
      ],
      [
        '4',
        'Cuadrante CM\ncolumnas 39-49',
        'Columna\n45',
        'Columnas 41-49',
        'No Aplica',
        '15 cm',
        '10 cota\n51.91',
        '2037',
        '17.5',
        '1734',
        '1820',
        '95.3',
        '95'
      ]
    ],
    theme: 'grid',
    styles: {
      cellPadding: 2,
      fontSize: 8,
      lineHeight: 1.2,
      valign: 'middle',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 25 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 15 },
      6: { cellWidth: 15 },
      7: { cellWidth: 15 },
      8: { cellWidth: 12 },
      9: { cellWidth: 15 },
      10: { cellWidth: 15 },
      11: { cellWidth: 12 },
      12: { cellWidth: 12 }
    }
  })

  return doc
}

// Componente de vista previa
const DensidadPDF: React.FC<DensidadPDFProps> = ({ ot }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: '100%',
        maxWidth: '900px',
        minHeight: '500px',
        backgroundColor: '#fff'
      }}
    >
      <Box sx={{ mb: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #eee' }}>
          <tbody>
            <tr style={{ height: '120px' }}>
              <td style={{ width: '33%', padding: '16px', verticalAlign: 'middle' }}>
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
              <td style={{ width: '34%', padding: '16px', textAlign: 'center', verticalAlign: 'middle' }}>
                <Typography
                  sx={{
                    fontWeight: 'bold',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.5,
                    fontSize: '1rem'
                  }}
                >
                  ORDEN DE TRABAJO
                  {'\n'}CONTROL DE
                  {'\n'}COMPACTACIÓN Método
                  {'\n'}Nuclear
                  {'\n\n'}Según 8.502.1 - 8.502.2 Diciembre 2003 MC-V8
                </Typography>
              </td>
              <td style={{ width: '33%', padding: '16px', verticalAlign: 'middle' }}>
                <Typography
                  sx={{
                    whiteSpace: 'pre-line',
                    lineHeight: 1.5,
                    fontSize: '0.9rem'
                  }}
                >
                  R-12-03
                  {'\n\n'}OT N° {ot.clave}
                  {'\n\n'}Autor: Katherine Rivas Castillo
                  {'\n'}Aprobado por: Juan Salas
                  {'\n'}Sepúlveda
                  {'\n'}Fecha Aprobación: 01-11-2021
                  {'\n'}Versión: 13
                </Typography>
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      <Box sx={{ mb: 4 }}>
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

      <Box sx={{ mb: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '120px' }}>Fecha Control:</td>
              <td style={{ padding: '8px' }}>{new Date(ot.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '120px' }}>Laboratorista:</td>
              <td style={{ padding: '8px' }}>{ot.user?.name || 'Sin asignar'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Densímetro</td>
              <td style={{ padding: '8px' }}>
                D-0-06 Marca:{ot.densidad?.marca || ''} Modelo:{ot.densidad?.modelo || ''}
              </td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Item:</td>
              <td style={{ padding: '8px' }}>{ot.densidad?.item || ''} RELLENO</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>N° de Serie:</td>
              <td style={{ padding: '8px' }}>31784</td>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Obs. al item:</td>
              <td style={{ padding: '8px' }}>Muro</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Conteo Estándar:</td>
              <td style={{ padding: '8px' }}>D:1997 H:667</td>
              <td colSpan={2}></td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Tiempo Medición:</td>
              <td style={{ padding: '8px' }}>60 seg</td>
              <td colSpan={2}></td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Descrip. visual suelo:</td>
              <td style={{ padding: '8px' }}>Sin Observaciones</td>
              <td colSpan={2}></td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>Observaciones:</td>
              <td style={{ padding: '8px' }}>Informe 986</td>
              <td colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </Box>

      <Box sx={{ mb: 4, overflowX: 'auto' }}>
        <Typography variant='h6' sx={{ mb: 2 }}>
          Controles de Densidad
        </Typography>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>N°</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Ubicación</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Frente a</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Entre</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Faja o Lado</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Prof. de Ensayo</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Capa</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>D.C.H. (Kg/m3)</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>W%</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>D.C.S. (Kg/m3)</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>DMCS / DR (Kg/m3)</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>COMP. (%)</th>
              <th style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>Exig. (%)</th>
            </tr>
          </thead>
          <tbody>
            {[
              {
                no: '1',
                ubicacion: 'Cuadrante CM columnas 71-81',
                frentea: 'Columna 77',
                entre: 'Columnas 77-79',
                faja: 'No Aplica',
                prof: '15 cm',
                capa: '10 cota 58.17',
                dch: '2043',
                w: '16.1',
                dcs: '1760',
                dmcs: '1820',
                comp: '96.7',
                exig: '95'
              },
              {
                no: '2',
                ubicacion: 'Cuadrante CM columnas 63-73',
                frentea: 'Columna 63',
                entre: 'Columnas 63-68',
                faja: 'No Aplica',
                prof: '15 cm',
                capa: '10 cota 51.91',
                dch: '2035',
                w: '17.6',
                dcs: '1730',
                dmcs: '1820',
                comp: '95.1',
                exig: '95'
              },
              {
                no: '3',
                ubicacion: 'Cuadrante CM columnas 50-62',
                frentea: 'Columna 55',
                entre: 'Columnas 50-62',
                faja: 'No Aplica',
                prof: '15 cm',
                capa: '10 cota 51.91',
                dch: '2039',
                w: '16.6',
                dcs: '1749',
                dmcs: '1820',
                comp: '96.1',
                exig: '95'
              },
              {
                no: '4',
                ubicacion: 'Cuadrante CM columnas 39-49',
                frentea: 'Columna 45',
                entre: 'Columnas 41-49',
                faja: 'No Aplica',
                prof: '15 cm',
                capa: '10 cota 51.91',
                dch: '2037',
                w: '17.5',
                dcs: '1734',
                dmcs: '1820',
                comp: '95.3',
                exig: '95'
              }
            ].map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.no}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'left' }}>{row.ubicacion}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.frentea}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.entre}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.faja}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.prof}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.capa}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.dch}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.w}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.dcs}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.dmcs}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.comp}</td>
                <td style={{ padding: '4px', border: '1px solid #ddd', textAlign: 'center' }}>{row.exig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Paper>
  )
}

export default DensidadPDF
