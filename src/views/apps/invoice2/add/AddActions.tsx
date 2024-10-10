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
import Typography from '@mui/material/Typography'

// Type Imports
import type { Locale } from '@configs/i18n'

// Component Imports
import SendInvoiceDrawer from '@views/apps/invoice/shared/SendInvoiceDrawer'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const AddActions = () => {
  // States
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)

  // Hooks
  const { lang: locale } = useParams()

  return (
    <Grid container spacing={6}>
      {/* Header with title Minutas, Emitir, Guardar, Imprimir, Cerrar, Editar */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container spacing={3} alignItems='center'>
              {/* Title Minutas */}
              <Grid item xs={12} sm={2}>
                <Typography variant='h5'>Minutas</Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
                  Cerrar
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
                  Imprimir
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
                  Editar
                </Button>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  component={Link}
                  color='secondary'
                  variant='outlined'
                  className='capitalize'
                  href={getLocalizedUrl('/apps/invoice/preview/4987', locale as Locale)}
                >
                  Guardar Borrador
                </Button>
              </Grid>

              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant='contained'
                  className='capitalize'
                  startIcon={<i className='ri-send-plane-line' />}
                  onClick={() => setSendDrawerOpen(true)}
                >
                  Emitir
                </Button>
              </Grid>

              {/* Guardar Borrador Button */}

              {/* Editar Button */}
            </Grid>
          </CardContent>
        </Card>
        <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
      </Grid>
    </Grid>
  )
}

export default AddActions
