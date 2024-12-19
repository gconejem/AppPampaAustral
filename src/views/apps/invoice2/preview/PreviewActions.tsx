// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// PDF Imports
import { jsPDF } from 'jspdf'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import AddPaymentDrawer from '@views/apps/invoice/shared/AddPaymentDrawer'
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const PreviewActions = ({ id, onButtonClick }: { id: string; onButtonClick: () => void }) => {
  // States
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  // Función para generar el PDF
  const generatePDF = () => {
    const doc = new jsPDF()

    // Título del PDF
    doc.setFontSize(18)
    doc.text('Factura N° ' + id, 20, 20)

    // Ejemplo de contenido en el PDF
    doc.setFontSize(12)
    doc.text('Fecha: 2024-09-05', 20, 30)
    doc.text('Cliente: Juan Pérez', 20, 40)
    doc.text('Monto Total: $1,000.00', 20, 50)

    // Guardar el PDF
    doc.save('factura.pdf')
  }

  return (
    <>
      <Card>
        <CardContent className='flex flex-col gap-4'>
          <Button
            fullWidth
            variant='contained'
            className='capitalize'
            startIcon={<i className='ri-send-plane-line' />}
            onClick={() => setSendDrawerOpen(true)}
          >
            Enviar correo
          </Button>
          <Button fullWidth color='secondary' variant='outlined' className='capitalize' onClick={generatePDF}>
            Descargar Factura
          </Button>
          <div className='flex items-center gap-4'>
            <Button fullWidth color='secondary' variant='outlined' className='capitalize' onClick={onButtonClick}>
              Imprimir
            </Button>
            <Button
              fullWidth
              component={Link}
              color='secondary'
              variant='outlined'
              className='capitalize'
              href={getLocalizedUrl(`/apps/invoice/edit/${id}`, locale as Locale)}
            >
              Editar
            </Button>
          </div>

          {}
          <Button
            fullWidth
            color='secondary'
            variant='outlined'
            className='capitalize'
            href='/TerminosyCondiciones.pdf' 
            download 
          >
            Descargar Términos y Condiciones
          </Button>
        </CardContent>
      </Card>

      <AddPaymentDrawer open={paymentDrawerOpen} handleClose={() => setPaymentDrawerOpen(false)} />
      <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
    </>
  )
}

export default PreviewActions
