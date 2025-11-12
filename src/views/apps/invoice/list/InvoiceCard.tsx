'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Link from 'next/link'

import { useParams } from 'next/navigation'

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

// Type Imports
import type { InvoiceType } from '@/types/apps/invoiceTypes'

// Component Imports
import CustomAvatar from '@/@core/components/mui/Avatar'

interface InvoiceCardProps {
  refreshTrigger?: number
  filteredData?: InvoiceType[]
}

const InvoiceCard = ({ refreshTrigger = 0, filteredData }: InvoiceCardProps) => {
  // Estados para los totales
  const [stats, setStats] = useState({
    totalCreadas: 0,
    totalActivas: 0,
    totalCerradas: 0,
    totalCotizado: 0
  })

  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isBelowSmScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  // Obtener el locale
  const params = useParams()
  const locale = params?.lang as string || 'es'

  // Calcular estadísticas cuando cambien los datos filtrados
  useEffect(() => {
    const calculateStats = (cotizaciones: any[]) => {
      const stats = {
        totalCreadas: cotizaciones.length,
        totalActivas: cotizaciones.filter((c: any) => ['BORRADOR', 'COTIZADA', 'GESTIONADA'].includes(c.estado)).length,
        totalCerradas: cotizaciones.filter((c: any) => ['ACEPTADA', 'RECHAZADA', 'SIN_RESPUESTA'].includes(c.estado))
          .length,
        totalCotizado: cotizaciones.reduce((acc: number, c: any) => {
          const subtotal = parseFloat(c.subtotal?.toString() || '0')
          return acc + subtotal
        }, 0)
      }

      setStats(stats)
    }

    if (filteredData) {
      // Usar los datos filtrados que vienen de la tabla
      calculateStats(filteredData)
    } else {
      // Inicializar con valores en 0 mientras se cargan los datos
      setStats({
        totalCreadas: 0,
        totalActivas: 0,
        totalCerradas: 0,
        totalCotizado: 0
      })
    }
  }, [refreshTrigger, filteredData])

  const data = [
    {
      title: stats.totalCreadas,
      subtitle: 'Total Creadas',
      icon: 'ri-user-3-line'
    },
    {
      title: stats.totalActivas,
      subtitle: 'Activas',
      icon: 'ri-pages-line'
    },
    {
      title: stats.totalCerradas,
      subtitle: 'Cerradas',
      icon: 'ri-wallet-line'
    },
    {
      title: `$${stats.totalCotizado.toLocaleString('es-CL')}`,
      subtitle: 'Total Cotizado',
      icon: 'ri-money-dollar-circle-line'
    }
  ]

  return (
    <Card>
      <CardContent sx={{ padding: '24px' }}>
        {/* Contenedor para el título y el botón */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant='h6'>Cotizaciones</Typography>
          <Button variant='contained' color='primary' component={Link} href={`/${locale}/apps/invoice/add`}>
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
