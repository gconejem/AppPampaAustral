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
      <Grid item xs={12}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button fullWidth color='secondary' variant='outlined' className='capitalize'>
              Guardar
            </Button>
            <Button
              fullWidth
              component={Link}
              color='secondary'
              variant='outlined'
              className='capitalize'
              href={getLocalizedUrl('/apps/invoice/preview/4987', locale as Locale)}
            >
              Visualizar
            </Button>
          </CardContent>
        </Card>
        <SendInvoiceDrawer open={sendDrawerOpen} handleClose={() => setSendDrawerOpen(false)} />
      </Grid>

      <Grid item xs={12}>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-payment-terms' className='cursor-pointer'></InputLabel>
        </div>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-client-notes' className='cursor-pointer'></InputLabel>
        </div>
        <div className='flex items-center justify-between'>
          <InputLabel htmlFor='invoice-edit-payment-stub' className='cursor-pointer'></InputLabel>
        </div>
      </Grid>
    </Grid>
  )
}

export default AddActions
