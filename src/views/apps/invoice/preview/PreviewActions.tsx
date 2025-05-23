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

// PDF Imports
import { jsPDF } from 'jspdf'

// Type Imports
import html2canvas from 'html2canvas'

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
      const element = document.querySelector('#preview-content')

      if (!element) {
        console.error('No se encontró el elemento preview-content')

        return
      }

      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const pdf = new jsPDF('p', 'mm', 'a4')

      // Primera página - Contenido dinámico
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)

      // Salto de página para las notas y términos
      pdf.addPage()

      let yPos = 30

      // Notas específicas para tipo A (arriba del título)
      if (previewData.tipoCotizacion === 'A') {
        pdf.setFontSize(8)

        const notasEspecificas = [
          '**Notas:**',
          '**Valores unitarios Neto** ***(sin IVA incluido)***',
          '**Adicionales contra evento:**',
          '• Copia digital adicional tiene un costo de **0.15 UF neto.**',
          '• Anexo de Informe, tendrá un costo de **0.42 UF neto**, salvo que las modificaciones sean de responsabilidad de Laboratorio Pampa Austral Ltda.',
          '• Informe con firma y timbres físicos tiene un costo de **0.58 UF neto.**',
          '**Recargos por jornadas extraordinarias** (a todos los ítem de la cotización):',
          '• **50% Adicional** Lunes a jueves desde 18:00 a 21:00 horas, viernes 17:00 a 21:00 horas.',
          '• **100% Adicional** Sábado, Domingo o Festivo.',
          '**Cualquier requisito adicional**, como certificaciones, acreditaciones de personal, normativas, reglamentos o exigencias de seguridad y medioambiente, debe informarse previamente para su evaluación y nueva cotización si corresponde.'
        ]

        notasEspecificas.forEach(line => {
          if (yPos > 270) {
            pdf.addPage()
            yPos = 20
          }

          // Procesar texto con formato avanzado
          if (line.includes('**')) {
            let xPos = 20
            // Expresión regular: captura ***texto***, luego **texto**, luego texto normal
            const regex = /(\*\*\*[^*]+\*\*\*)|(\*\*[^*]+\*\*)|([^*]+)/g
            const matches = line.match(regex)
            if (matches) {
              matches.forEach(fragment => {
                if (fragment.startsWith('***') && fragment.endsWith('***')) {
                  // Negrita + subrayado
                  const text = fragment.slice(3, -3)
                  pdf.setFont('helvetica', 'bold')
                  pdf.text(text, xPos, yPos)
                  const textWidth = pdf.getTextWidth(text)
                  pdf.line(xPos, yPos + 1, xPos + textWidth, yPos + 1)
                  xPos += textWidth
                } else if (fragment.startsWith('**') && fragment.endsWith('**')) {
                  // Solo negrita
                  const text = fragment.slice(2, -2)
                  pdf.setFont('helvetica', 'bold')
                  pdf.text(text, xPos, yPos)
                  xPos += pdf.getTextWidth(text)
                } else {
                  // Normal
                  pdf.setFont('helvetica', 'normal')
                  pdf.text(fragment, xPos, yPos)
                  xPos += pdf.getTextWidth(fragment)
                }
              })
            }
          } else {
            pdf.setFont('helvetica', 'normal')
            pdf.text(line, 20, yPos)
          }
          yPos += 6
        })
        yPos += 10
      }

      // Salto de página antes de los términos y condiciones
      pdf.addPage()
      pdf.setFont('helvetica')
      pdf.setFontSize(14)
      pdf.text('TÉRMINOS Y CONDICIONES DEL SERVICIO', 105, 20, { align: 'center' })
      yPos = 30

      // Términos y condiciones generales
      pdf.setFontSize(10)

      const terms = [
        '**1. Formalización del Servicio y Condiciones de Facturación:**',
        '    a. El trabajo inicia con la recepción de la  **OC** y el **Formulario de ingreso de obra (RPG-05-03)**,',
        '       confirmando la aceptación de esta cotización.',
        '    b. Los volúmenes de trabajo en la Cotización y OC son referenciales. La facturación se basa',
        '       en los servicios efectivamente realizados y conforme a los informes de ensayo emitidos.',
        '    c. El  **cliente es responsable de verificar la exactitud de la información en OC y documentos**',
        '       **enviados para facturación**. Pampa Austral Ltda. no asume responsabilidad por errores en',
        '       estos documentos, evitando así retrasos en la facturación, pago y entrega de informes.',
        '    d. Si la facturación requiere la aprobación de la  **Minuta de Trabajo**, el  ***plazo máximo para***',
        '       ***ello será de 5 días***. Si no hay observaciones dentro de este período, se procederá a la',
        '       facturación del servicio.',
        '',
        '**2. Programación de servicios en terreno:**',
        '    a. **Los servicios deben programarse con al menos 24 horas de anticipación** al correo',
        '       **recepcion@pampaustral.cl**, directamente con el Laboratorio y no con personal técnico en',
        '       terreno.',
        '    b. ***El envío de solicitud no garantiza la visita.*** Esta debe ser confirmada por el Laboratorio.',
        '    c. Las solicitudes fuera del horario hábil (lunes a viernes, 08:00 - 18:00) se procesarán el',
        '       siguiente día hábil.',
        '    d. Suspensiones sin aviso previo de 24 h generarán cargos por viáticos y movilización.',
        '    e. El laboratorio puede **reprogramar servicios** por condiciones climáticas adversas, según ',
        '       disponibilidad de ambas partes.',
        '    f. Informar ***previo*** a la programación del servicio si se **requiere acreditación del personal**.',
        '    g. El cliente debe facilitar los accesos y colaborar en todo lo necesario para evitar retrasos.',
        '',
        '**3. Toma de Muestras:**',
        '    a. Los trabajos en terreno se registrarán en **Órdenes de Trabajo (OT)**, las cuales ***deberán ser***',
        '       ***firmadas por un representante del cliente (se sugiere Encargo de Obra, Profesional a***',
        '       ***cargo o Administrador de Obra).*** La OT es el documento oficial para la elaboración de',
        '       informes. Una vez firmada, se considera conforme la información y el volumen de trabajo',
        '       registrado. Cualquier modificación a la OT debe solicitarse por correo electrónico y será',
        '       evaluada por el Jefe de Laboratorio.',
        '    b. Para **muestreos consecutivos**, el tiempo de espera máximo es de **30 minutos.**',
        '    c. Las **muestras tomadas por el cliente se informan como auto control.** El laboratorio solo',
        '       garantiza la veracidad de los datos obtenidos por su personal técnico en muestreos o',
        '       controles realizados directamente en obra.',
        '',
        '4. **Consideraciones técnicas del Servicio:**',
        '    a. Serán prestados los servicios de acuerdo a métodos de ensayo y/o normativas vigentes que',
        '       Pampa Austral Ltda., considere adecuado por razones reglamentarias y normativas',
        '       técnicas. **De requerir un criterio de ensayo diferente a los aquí expuestos, deben ser',
        '       establecidos por el mandante previo a la aceptación de esta cotización. Las variantes de',
        '       ensayos pueden incluir una variación en los precios y plazos establecidos.**',
        '    b. **Los rechequeos por resultados insatisfactorios tendrán valores según listado de precios',
        '       del Laboratorio.**',
        '    c. El laboratorio podrá subcontratar servicios acreditados, con acuerdo del cliente.',
        '    d. Las muestras se conservan durante 30 días, previa solicitud.',
        '    e. Los resultados e informes se emiten y entregan exclusivamente al solicitante del servicio.',
        '',
        '5. **Pago de Servicios y Entrega de Informes:**',
        '    a. Los **Informes Oficiales se entregarán únicamente tras pago de facturas relacionadas.**',
        '    b. **No se emiten informes con resultados provisorios.** Los plazos de entrega varían según el',
        '       tipo de material y ensayo. Consultas al correo **info@pampaustral.cl.**',
        '    c. Los Informes Oficiales se entregan en **formato digital** y su distribución a terceros es',
        '       responsabilidad del cliente. Salvo solicitudes formales para **SERVIU**, la cual debe ser',
        '       realizada mediante carta indicando destinatario, dirección, obra, resolución y mandante.',
        '    d. El **comprobante de pago** debe enviarse a **facturacion@pampaustral.cl** con copia a',
        '       **contacto@pampaustral.cl**, indicando: **número de factura y cotización correspondiente.**',
        '    e. En caso de morosidad, el laboratorio podrá suspender o finalizar los servicios y en caso de',
        '       persistir, informar al boletín comercial. El cliente asume costos legales e intereses.',
        '',
        '6 **Modificaciones y/o observaciones a informes de ensayo:**',
        '    a. Se pueden presentar ***observaciones dentro de 48 horas tras recibir el informe.***',
        '       Transcurrido dicho plazo, el Informe Oficial se dará por Aprobado.',
        '    b. Se evaluará la pertinencia de incorporarlas a un **Anexo de Informe**, el cual reemplaza el',
        '       Informe Emitido, atribución exclusiva del Laboratorio. El Anexo de Informe, deberá ser',
        '       entregado al Cliente a los **5 días** de recibida las observaciones. Este nuevo informe tendrá',
        '       un costo, indicado en la presente propuesta económica, salvo que las modificaciones sean',
        '       de responsabilidad de Laboratorio Pampa Austral Ltda. ',
        '',
        '7. **De responsabilidad del solicitante y/o Cliente:**',
        '    a. Gestionar permisos de ingreso del personal, vehículos y equipos, garantizando accesos',
        '       expeditos y medidas de seguridad adecuadas en faena. En caso de desviaciones, el',
        '       laboratorio notificará la ocurrencia y/o recurrencia de las desviaciones, si no hubiera',
        '       respuesta, Pampa Austral Ltda., queda facultado para suspender el servicio y/o adecuar',
        '       estos, notificando al cliente.  Si por responsabilidad del cliente no es posible efectuar el',
        '       servicio en terreno, éste será cobrado como si se hubiese efectuado.',
        '    b. La custodia de probetas de hormigón fresco es responsabilidad exclusiva del cliente. Su ',
        '       pérdida o extravío será de su cargo.',
        '    c. Si se requiere que personal del laboratorio comparezca en procedimientos judiciales o ',
        '       administrativos, los costos asociados serán cotizados previamente.',
        '',
        '8. **Aspectos de confidencialidad e imparcialidad:**',
        '    a. Laboratorio Pampa Austral Ltda. y su personal garantizan la confidencialidad, imparcialidad',
        '       e independencia en la ejecución de sus servicios. Se comprometen a la protección y uso',
        '       reservado de la información obtenida o creada durante sus actividades, incluyendo los',
        '       derechos de propiedad del cliente.',
        '    b. En caso de que la ley exija la divulgación de información confidencial o cuando esté',
        '       autorizado por compromisos contractuales, el cliente será notificado vía correo electrónico',
        '       con anticipación, salvo que esté prohibido por ley.',
        '    c. Laboratorio Pampa Austral Ltda., en su calidad de laboratorio de ensayos acreditado, es',
        '       auditado periódicamente por la División de Acreditación (DAC) del Instituto Nacional de',
        '       Normalización (INN), la cual puede acceder de forma aleatoria a información técnica y',
        '       registros vinculados a los servicios prestados a los clientes, ***previa suscripción del***',
        '       ***compromiso de confidencialidad correspondiente***, conforme a lo establecido en nuestro',
        '       Sistema de Gestión de Calidad.',
        '    d. Al aceptar esta cotización, el cliente (o su representante) autoriza el ingreso del equipo',
        '       evaluador de la DAC del INN a sus instalaciones, en caso de que se requiera verificar in situ',
        '       el desempeño del laboratorio durante la ejecución de ensayos o la toma de muestras, en',
        '       cumplimiento de los requisitos propios de su condición de Organismo Evaluador de la',
        '       Conformidad (OEC).',
      ]

      terms.forEach(line => {
        if (yPos > 280) {
          pdf.addPage()
          yPos = 20
        }

        // Procesar texto con formato avanzado
        if (line.includes('**')) {
          let xPos = 20
          // Expresión regular: captura ***texto***, luego **texto**, luego texto normal
          const regex = /(\*\*\*[^*]+\*\*\*)|(\*\*[^*]+\*\*)|([^*]+)/g
          const matches = line.match(regex)
          if (matches) {
            matches.forEach(fragment => {
              if (fragment.startsWith('***') && fragment.endsWith('***')) {
                // Negrita + subrayado
                const text = fragment.slice(3, -3)
                pdf.setFont('helvetica', 'bold')
                pdf.text(text, xPos, yPos)
                const textWidth = pdf.getTextWidth(text)
                pdf.line(xPos, yPos + 1, xPos + textWidth, yPos + 1)
                xPos += textWidth
              } else if (fragment.startsWith('**') && fragment.endsWith('**')) {
                // Solo negrita
                const text = fragment.slice(2, -2)
                pdf.setFont('helvetica', 'bold')
                pdf.text(text, xPos, yPos)
                xPos += pdf.getTextWidth(text)
              } else {
                // Normal
                pdf.setFont('helvetica', 'normal')
                pdf.text(fragment, xPos, yPos)
                xPos += pdf.getTextWidth(fragment)
              }
            })
          }
        } else {
          pdf.setFont('helvetica', 'normal')
          pdf.text(line, 20, yPos)
        }
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
    </>
  )
}

export default PreviewActions
