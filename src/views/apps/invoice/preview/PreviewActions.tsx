// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'

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
  const [termsOpen, setTermsOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

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
          <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
            Descargar
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
          <Button
            fullWidth
            color='secondary'
            variant='outlined'
            className='capitalize'
            onClick={() => setTermsOpen(true)}
          >
            Términos y Condiciones
          </Button>
        </CardContent>
      </Card>

      <AddPaymentDrawer open={paymentDrawerOpen} handleClose={() => setPaymentDrawerOpen(false)} />
      <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />

      {/* Modal for Terms and Conditions */}
      <Dialog open={termsOpen} onClose={() => setTermsOpen(false)} maxWidth='md' fullWidth>
        <DialogTitle>Términos y Condiciones</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <p>
              <strong>TÉRMINOS Y CONDICIONES DEL SERVICIO:</strong>
            </p>
            <p>
              <strong>De responsabilidad del Solicitante y/o Cliente:</strong>
            </p>
            <p>
              ✔ Gestionar los permisos de acreditación e ingreso del personal, vehículos y equipos de laboratorio a las
              áreas de trabajo consideradas.
              <br />
              El cliente debe asegurar que se adopten y administren todas las medidas de seguridad en el trabajo, de tal
              forma de garantizar los accesos, resguardo y prevención de riesgos durante toda la prestación de los
              servicios,
              <br />
              Laboratorio notificará la ocurrencia y/o recurrencia de las desviaciones, si no hubiera respuesta Pampa
              Austral Ltda. queda facultado para suspender el servicio y/o redefinir la adecuación de estos, notificando
              al cliente.
              <br />
              Si por responsabilidad del cliente no es posible efectuar la muetra o control, el servicio será cobrado
              como si se hubiese efectuado.
            </p>

            <p>
              ✔ Errores en la información contenida en la OTT será de exclusiva responsabilidad del cliente.
              <br />
              Lo anterior puede ser causa de demoras en la ejecución de los ensayos y/o controles e incluso la emisión
              incorrecta del Estudio.
            </p>

            <p>
              ✔ En el evento que los Estudios preparados por Pampa Austral Ltda., se presenten en algún procedimiento
              judicial o administrativo y se requiera por esa causa, la comparecencia de los profesionales responsables
              para prestar declaración en ese contexto,
              <br />
              los costos y gastos asociados a esa comparecencia serán cotizados en su oportunidad.
            </p>

            <p>
              <strong>Consideraciones Técnicas del Servicio, Confidencialidad y Resguardo de la información:</strong>
            </p>
            <p>
              ✔ Serán prestados los servicios de acuerdo con métodos de ensayo y/o normativas vigentes que Pampa
              Austral Ltda., considere adecuado por razones reglamentarias y normativas técnicas.
              <br />
              De requerir un criterio de ensayo diferente a los aquí expuestos, deben ser establecidos por el mandante
              previo a la aceptación de esta cotización.
              <br />
              Las Variantes de ensayos pueden incluir una variación en los precios y plazos establecidos.
            </p>

            <p>
              ✔ Laboratorio Pampa Austral Ltda., podrá subcontratar servicios requeridos a otros agentes, previo
              acuerdo con el cliente.
            </p>
            <p>
              ✔ Luego de ensayadas las muestras, estas se conservan de forma estándar por 30 días en el laboratorio.
              <br />
              Excepciones de plazo deberán ser indicadas por escrito por el cliente.
            </p>

            <p>
              ✔ El laboratorio Pampa Austral Ltda., cuenta con protocolos de calidad de servicio que respaldan la
              confidencialidad e imparcialidad de cada proceso involucrado en la prestación del servicio.
            </p>
            <p>
              ✔ Los resultados y Estudios de Mecánica de Suelos son emitidos y entregados únicamente al solicitante del
              servicio.
              <br />
              El laboratorio Pampa Austral guardará reserva absoluta de los resultados o estado del proceso a terceras
              personas, asegurando la confidencialidad de toda la información relacionada al trabajo encomendado.
              <br />
              Nuestros procedimientos y Sistema de Calidad aseguran mantener lo antes mencionado, con excepción de la
              Casa Matriz:
              <br />
              Calle Santa Blanca N° 51, Chillán - Chile Fono: 42-223 82 90 | 42-224 02 55 – Horario 8:00 a 18:00 Horas
              contacto@pampaustral.cl Código: RPG-05-02 COTIZACION Nº 1290- E - I - 2024
            </p>

            <p>
              <strong>Manejo de modificaciones y observaciones a los Estudios de Mecánica de Suelo:</strong>
            </p>
            <p>
              ✔ Recibido el Estudio de Mecánica de Suelo, el cliente tiene un plazo de 3 meses para efectuar
              observaciones, transcurrido dicho plazo y si no se reciben observaciones, dicho documento se dará por
              Validado.
              <br />
              Dichas modificaciones deben ser cotizadas previamente.
            </p>
            <p>
              ✔ De haber observaciones, el Laboratorio Pampa Austral Ltda. evaluará la pertinencia de incorporarlas a
              una nueva versión del estudio, el cual reemplaza el emitido, atribución exclusiva del Laboratorio.
              <br />
              La versión definitiva del Estudio será entregada al Cliente a los 10 días a contar de la recepción de las
              observaciones.
              <br />
              Esta nueva versión tendrá un costo adicional, el que deberá ser cotizado y aprobado oportunamente por el
              cliente, salvo que las modificaciones realizadas sean de responsabilidad del Laboratorio Pampa Austral
              Ltda.
            </p>

            <p>
              <strong>Notas:</strong>
            </p>
            <p>
              Nota 1: Este presupuesto se elaboró con la información disponible hasta el momento, si se establecen
              exigencias especiales, solicitamos a Ud., nos remitan dichos antecedentes para su elaboración y disponer
              las acciones necesarias de manera de cumplir satisfactoriamente para desarrollar los trabajos como:
              <br />
              certificación del personal y maquinaria, reglamentos, ordenanzas, requerimientos de seguridad y
              ambientales u otras.
              <br />
              Si dichas exigencias no están cotizadas deberán ser presupuestadas nuevamente.
            </p>
            <p>
              Nota 2: Recuerde siempre que contamos con: la experiencia, infraestructura y la tecnología, para prestarle
              el mejor servicio en controles y ensayos de Laboratorio.
            </p>
            <p>En espera de una favorable acogida, le saluda cordialmente.</p>

            <p>
              <strong>MERCEDES LILLO REYES</strong>
            </p>
            <p>
              p.p: Laboratorio Pampa Austral Ltda.
              <br />
              Casa Matriz: Calle Santa Blanca N° 51, Chillán - Chile
              <br />
              Fono: 42-223 82 90 | 42-224 02 55 – Horario 8:00 a 18:00 Horas contacto@pampaustral.cl
              <br />
              COTIZACION Nº 1290- E - I - 2024
              <br />
              Laboratorio Oficial Acreditado INN Chile
            </p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermsOpen(false)} color='primary'>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PreviewActions
