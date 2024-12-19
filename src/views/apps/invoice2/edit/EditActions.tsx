'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import AddPaymentDrawer from '@views/apps/invoice/shared/AddPaymentDrawer'
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const EditActions = ({ id }: { id: string }) => {
  // States
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button
              fullWidth
              variant='contained'
              className='capitalize'
              startIcon={<i className='ri-send-plane-line' />}
              onClick={() => setSendDrawerOpen(true)}
            >
              Enviar Correo
            </Button>
            <div className='flex items-center gap-4'>
              <Button
                fullWidth
                component={Link}
                color='secondary'
                variant='outlined'
                className='capitalize'
                href={getLocalizedUrl(`/apps/invoice/preview/${id}`, locale as Locale)}
              >
                Pre-Visualizar
              </Button>
              <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
        <AddPaymentDrawer open={paymentDrawerOpen} handleClose={() => setPaymentDrawerOpen(false)} />
        <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
      </Grid>

      <Grid item xs={12}></Grid>
    </Grid>
  )
}

export default EditActions
