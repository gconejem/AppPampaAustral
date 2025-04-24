'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import SaveIcon from '@mui/icons-material/Save'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// PDF Imports
import { jsPDF } from 'jspdf'

// Type Imports
import html2canvas from 'html2canvas'

import type { Locale } from '@configs/i18n'

// Component Imports
import AddPaymentDrawer from '@views/apps/invoice/shared/AddPaymentDrawer'
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const PreviewActions = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

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
          cantidad: parseInt(detalle.cantidad) || 1,
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
        router.push('/es/apps/invoice/list')
      }, 2000)
    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Error al guardar la cotización')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const element = document.querySelector('#preview-content')

      if (!element) {
        console.error('No se encontró el elemento preview-content')

        return
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const pdf = new jsPDF('p', 'mm', 'a4')

      // Primera página - Contenido dinámico
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)

      // Agregar nueva página para términos y condiciones
      pdf.addPage()

      // Configurar fuente y tamaños
      pdf.setFont('helvetica')

      // Título
      pdf.setFontSize(14)
      pdf.text('TÉRMINOS Y CONDICIONES DEL SERVICIO', 105, 20, { align: 'center' })

      // Contenido
      pdf.setFontSize(10)

      const terms = [
        '1. Formalización del Servicio y Condiciones de Facturación:',
        '    a. El trabajo inicia con la recepción de la OC y el Formulario de ingreso de obra (RPG-05-03),',
        '       confirmando la aceptación de esta cotización.',
        '    b. Los volúmenes de trabajo en la Cotización y OC son referenciales. La facturación se basa',
        '       en los servicios efectivamente realizados y conforme a los informes de ensayo emitidos.',
        '    c. El cliente es responsable de verificar la exactitud de la información en OC y documentos',
        '       enviados para facturación. Pampa Austral Ltda. no asume responsabilidad por errores en',
        '       estos documentos, evitando así retrasos en la facturación, pago y entrega de informes.',
        '    d. Si la facturación requiere la aprobación de la Minuta de Trabajo, el plazo máximo para',
        '       ello será de 5 días. Si no hay observaciones dentro de este período, se procederá a la',
        '       facturación del servicio.',
        '',
        '2. Programación de servicios en terreno:',
        '    a. Los servicios deben programarse con al menos 24 horas de anticipación al correo',
        '       recepcion@pampaustral.cl, directamente con el Laboratorio y no con personal técnico en',
        '       terreno. La visita debe ser confirmada por el Laboratorio por el mismo medio y está sujeta',
        '       a disponibilidad del Laboratorio. El envío de la solicitud de agenda del cliente no garantiza',
        '       visita a terreno.',
        '    b. Las solicitudes fuera del horario hábil (lunes a viernes, 08:00 - 18:00) se procesarán el',
        '       siguiente día hábil.',
        '    c. La suspensión del servicio agendado por parte del cliente, sin 24 horas de aviso, generará',
        '       cobros por viáticos y movilización. El laboratorio puede reprogramar servicios por',
        '       condiciones climáticas adversas, según disponibilidad de ambas partes.',
        '    d. Si la programación del servicio requiere acreditación del personal, esto deberá',
        '       informarse previamente. El cliente debe facilitar los accesos y colaborar en todo lo',
        '       necesario para evitar retrasos o contratiempos.',
        '',
        '3. Toma de Muestras:',
        '    a. Los trabajos en terreno se registrarán en Órdenes de Trabajo (OT), las cuales deberán ser',
        '       firmadas por un representante del cliente (se sugiere Encargo de Obra, Profesional a',
        '       cargo o Administrador de Obra). La OT es el documento oficial para la elaboración de',
        '       informes. Una vez firmada, se considera conforme la información y el volumen de trabajo',
        '       registrado. Cualquier modificación a la OT debe solicitarse por correo electrónico y será',
        '       evaluada por el Jefe de Laboratorio.',
        '    b. Para muestreos consecutivos, el tiempo de espera máximo es de 30 minutos.',
        '    c. Las muestras tomadas por el cliente se informan como auto control. El laboratorio solo',
        '       garantiza la veracidad de los datos obtenidos por su personal técnico en muestreos o',
        '       controles realizados directamente en obra.',
        '',
        '4. Pago de Servicios y Entrega de Informes:',
        '    a. Los Informes Oficiales se entregarán únicamente tras el pago de las facturas',
        '       correspondientes.',
        '    b. No se emiten informes con resultados provisorios. Los plazos de entrega varían según el',
        '       tipo de material y ensayo. Consultas al correo info@pampaustral.cl.',
        '    c. Los Informes Oficiales se entregan en formato digital y su distribución a terceros es',
        '       responsabilidad del cliente. Salvo solicitudes formales para Serviu, la cual debe ser',
        '       realizada mediante carta indicando destinatario, dirección, obra, resolución y mandante.',
        '    d. El comprobante de pago debe enviarse a facturacion@pampaustral.cl con copia a',
        '       contacto@pampaustral.cl, indicando: número de factura y cotización correspondiente.'
      ]

      let yPos = 30

      terms.forEach(line => {
        if (yPos > 280) {
          pdf.addPage()
          yPos = 20
        }

        pdf.text(line, 20, yPos)
        yPos += line === '' ? 5 : 6
      })

      // Firma al final
      pdf.addPage()
      pdf.text(['', '', 'MERCEDES LILLO REYES', 'p.p: Sociedad Laboratorio Pampa Austral Ltda.'], 105, 250, {
        align: 'center'
      })

      // Pie de página con numeración
      const pageCount = pdf.getNumberOfPages()

      pdf.setFontSize(10)

      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.text(`Página ${i} de ${pageCount}`, pdf.internal.pageSize.width / 2, pdf.internal.pageSize.height - 10, {
          align: 'center'
        })
      }

      pdf.save('cotizacion.pdf')
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
            <Button fullWidth color='secondary' variant='outlined' onClick={() => router.push('/es/apps/invoice/list')}>
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
    </>
  )
}

export default PreviewActions
