'use client'

// MUI Imports
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@/@core/components/mui/Avatar'

// Vars
const data = [
  {
    title: 24,
    subtitle: 'Total Creadas',
    icon: 'ri-user-3-line'
  },
  {
    title: 165,
    subtitle: 'Activas',
    icon: 'ri-pages-line'
  },
  {
    title: '165',
    subtitle: 'Cerradas',
    icon: 'ri-wallet-line'
  },
  {
    title: '$876',
    subtitle: 'Tota Cotizado',
    icon: 'ri-money-dollar-circle-line'
  }
]

const InvoiceCard = () => {
  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  return (
    <Card>
      <CardContent sx={{ padding: '24px' }}>
        {/* Contenedor para el título y el botón */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h6'>Cotizaciones</Typography>
          <Button
            variant='contained'
            color='primary'
            component={Link}
            href='/apps/invoice/add' // Ruta a la que quieres redirigir
          >
            + Crear Cotización
          </Button>
        </Box>
        <Divider sx={{ mb: 4 }} />
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              key={index}
              className='sm:[&:nth-of-type(odd)>div]:pie-6 sm:[&:nth-of-type(odd)>div]:border-ie md:[&:not(:last-child)>div]:pie-6 md:[&:not(:last-child)>div]:border-ie'
            >
              <div className='flex justify-between'>
                <div className='flex flex-col'>
                  <Typography variant='h4'>{item.title}</Typography>
                  <Typography>{item.subtitle}</Typography>
                </div>
                <CustomAvatar variant='rounded' size={42}>
                  <i className={classnames('text-[26px]', item.icon)} />
                </CustomAvatar>
              </div>
              {isBelowMdScreen && !isBelowSmScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isBelowSmScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default InvoiceCard
