'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SaveIcon from '@mui/icons-material/Save'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'

// PDF Imports
import { jsPDF } from 'jspdf'

// Type Imports
import html2canvas from 'html2canvas'

const PreviewActions = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [htmlPreview, setHtmlPreview] = useState('')

  const handleGuardarCotizacion = async () => {
    try {
      setLoading(true)
      const previewData = JSON.parse(localStorage.getItem('cotizacionPreview') || '{}')

      // Solo validamos el número de cotización
      if (!previewData.numeroCotizacion) {
        throw new Error('El número de cotización es requerido')
      }

      // Debug: Ver todos los detalles y sus productoId
      console.log('Detalles antes de filtrar:', JSON.stringify(previewData.detalles, null, 2))

      // Mapear el tipo de cotización al valor del enum en prisma
      let tipoCotizacionValue = 'A'

      // Convertir los valores al formato más simple
      if (previewData.tipoCotizacion === 'A' || previewData.tipoCotizacion === 'VALORES_UNITARIOS') {
        tipoCotizacionValue = 'A'
      } else if (previewData.tipoCotizacion === 'B' || previewData.tipoCotizacion === 'EMS') {
        tipoCotizacionValue = 'B'
      } else if (previewData.tipoCotizacion === 'C' || previewData.tipoCotizacion === 'MENSUAL') {
        tipoCotizacionValue = 'C'
      }

      // Debug: ver el tipo de cotización
      console.log('Tipo de cotización original:', previewData.tipoCotizacion)
      console.log('Tipo de cotización a enviar:', tipoCotizacionValue)

      // Para debugging y pruebas, crear un detalle básico si no hay detalles válidos
      let detallesParaEnviar = []

      // Validamos que haya al menos un detalle con productoId válido
      const detallesValidos = previewData.detalles
        .filter((detalle: any) => {
          // Debug: mostrar cada detalle y su productoId
          console.log(
            'Verificando detalle:',
            detalle,
            'productoId:',
            detalle.productoId,
            'esNumero:',
            !isNaN(parseInt(detalle.productoId || '0')),
            'esPositivo:',
            parseInt(detalle.productoId || '0') > 0
          )

          // Solo usar detalles que tengan un productoId válido
          return detalle.productoId && !isNaN(parseInt(detalle.productoId)) && parseInt(detalle.productoId) > 0
        })
        .map((detalle: any) => ({
          productoId: parseInt(detalle.productoId),
          cantidad: Number(detalle.cantidad),
          precioUnitario: parseFloat(detalle.precioUnitarioUF || 0),
          descuento: 0,
          subtotal: parseFloat(detalle.totalNetoUF || 0)
        }))

      // Debug: ver los detalles válidos
      console.log('Detalles válidos:', detallesValidos)

      // Si no hay detalles válidos, usamos un detalle de prueba con ID 1
      if (detallesValidos.length === 0) {
        console.log('No hay detalles válidos, usando un detalle de prueba')

        // Verificar si se han agregado productos
        if (!previewData.detalles || previewData.detalles.length === 0) {
          throw new Error('No hay productos en la cotización')
        }

        // Si hay productos pero sin ID válido, mostrar error
        throw new Error(
          'No hay productos válidos para guardar en la cotización. Asegúrate de seleccionar productos desde la lista.'
        )
      } else {
        detallesParaEnviar = detallesValidos
      }

      const dataToSend = {
        numeroCotizacion: previewData.numeroCotizacion,
        tipoCotizacion: tipoCotizacionValue,
        estado: 'BORRADOR',
        clienteId: previewData.cliente?.clienteId ? parseInt(previewData.cliente.clienteId) : null,
        obraId: previewData.obra?.obraId ? parseInt(previewData.obra.obraId) : null,
        contactId: previewData.contactId
          ? parseInt(previewData.contactId)
          : previewData.contactoId
            ? parseInt(previewData.contactoId)
            : null,
        listaPrecioId: previewData.listaPrecioId ? parseInt(previewData.listaPrecioId) : null,
        fechaInicio: previewData.fechaInicio || new Date().toISOString(),
        fechaFin: previewData.fechaFin || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        nombreProyecto: previewData.nombreProyecto || '',
        empresa: previewData.empresa || '',
        ubicacion: previewData.ubicacion || '',
        formaPago: previewData.formaPago || 'CONTADO',
        subtotal: parseFloat(previewData.subtotal),
        descuento: parseFloat(previewData.descuento || 0),
        impuesto: parseFloat(previewData.impuesto),
        total: parseFloat(previewData.total),
        observaciones: previewData.observaciones || '',

        //EMS
        superficieEMS: previewData.superficieEMS || '',
        antecedentesEMS: previewData.antecedentesEMS || '',
        plazoEntregaEMS: previewData.plazoEntregaEMS || '',
        //FIN EMS

        detalles: {
          create: detallesParaEnviar
        }
      }

      console.log('Data to send:', dataToSend)

      const response = await fetch('/api/cotizaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar la cotización')
      }

      setShowSuccess(true)
      setTimeout(() => {
        window.close()
        if (window.opener) {
          window.opener.location.href = '/es/apps/invoice/list'
        }
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error al guardar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const previewData = JSON.parse(localStorage.getItem('cotizacionPreview') || '{}')

      console.log('previewData', previewData)
      
      const response = await fetch('/api/cotizaciones/pdf/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(previewData)
      })

      if (!response.ok) {
        throw new Error('Error al generar el PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotizacion-preview.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      setError('Error al generar PDF')
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className='flex flex-col gap-4'>
            <Button
              fullWidth
              color='primary'
              variant='contained'
              onClick={handleGuardarCotizacion}
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              {loading ? 'Guardando...' : 'Guardar Cotización'}
            </Button>
            <Button
              fullWidth
              color='secondary'
              variant='contained'
              onClick={handleDownloadPDF}
              startIcon={<FileDownloadIcon />}
            >
              Descargar PDF
            </Button>
            {/* <Button
              fullWidth
              color='info'
              variant='outlined'
              onClick={async () => {
                const previewData = JSON.parse(localStorage.getItem('cotizacionPreview') || '{}')
                try {
                  const response = await fetch('/api/cotizaciones/pdf/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(previewData)
                  })
                  if (!response.ok) throw new Error('Error al obtener el HTML')
                  const html = await response.text()
                  setHtmlPreview(html)
                  setShowHtmlPreview(true)
                } catch (err) {
                  setHtmlPreview('<div style="color:red">Error al obtener el HTML</div>')
                  setShowHtmlPreview(true)
                }
              }}
            >
              Ver Preview HTML
            </Button> */}
            <Button fullWidth color='secondary' variant='outlined' onClick={() => window.close()}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>

      <Snackbar open={showSuccess} autoHideDuration={6000} onClose={() => setShowSuccess(false)}>
        <Alert onClose={() => setShowSuccess(false)} severity='success'>
          Cotización guardada exitosamente
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity='error'>
          {error}
        </Alert>
      </Snackbar>

      <Dialog open={showHtmlPreview} onClose={() => setShowHtmlPreview(false)} maxWidth='md' fullWidth>
        <DialogTitle>Preview HTML de Cotización</DialogTitle>
        <DialogContent>
          <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PreviewActions
