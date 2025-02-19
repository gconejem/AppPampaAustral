'use client'

import { useEffect, useState } from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ThemeColor } from '@core/types'

type StatsCardProps = {
  title: string
  stats: string
  icon: string
  color: ThemeColor
  subtitle: string
}

const StatsCard = ({ title, stats, icon, color, subtitle }: StatsCardProps) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant='h6' color='text.secondary'>
              {title}
            </Typography>
            <Typography variant='h4'>{stats}</Typography>
            <Typography variant='body2' color='text.secondary'>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '50%',
              backgroundColor: `${color}.light`,
              color: `${color}.main`
            }}
          >
            <i className={`${icon} text-2xl`} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

function RequestListCards() {
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    finalizadas: 0
  })

  useEffect(() => {
    fetch('/home/apps/requests/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(error => console.error('Error cargando estadísticas:', error))
  }, [])

  const data = [
    {
      title: 'Solicitudes',
      stats: stats.total.toString(),
      icon: 'ri-file-list-3-line',
      color: 'primary',
      subtitle: 'Total Solicitudes'
    },
    {
      title: 'Pendientes',
      stats: stats.pendientes.toString(),
      icon: 'ri-time-line',
      color: 'warning',
      subtitle: 'Solicitudes pendientes'
    },
    {
      title: 'En Proceso',
      stats: stats.enProceso.toString(),
      icon: 'ri-loader-4-line',
      color: 'info',
      subtitle: 'Solicitudes en proceso'
    },
    {
      title: 'Finalizadas',
      stats: stats.finalizadas.toString(),
      icon: 'ri-check-double-line',
      color: 'success',
      subtitle: 'Solicitudes finalizadas'
    }
  ]

  return (
    <Grid container spacing={6}>
      {data.map((item, i) => (
        <Grid key={i} item xs={12} sm={6} md={3}>
          <StatsCard {...item} />
        </Grid>
      ))}
    </Grid>
  )
}

export default RequestListCards
