'use client'

import { useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Imports para permisos - NUEVO
import { usePermissions } from '@/hooks/usePermissions'
import { permisos } from '@/permisos/permisos'


function RequestListCards2() {
  const router = useRouter()

    // Hook de permisos
  const { hasPermission } = usePermissions()
  
  // Verificar si el usuario solo tiene permisos de lectura
  const soloLectura =
    hasPermission(permisos.empresa.ver) &&
    !hasPermission(permisos.empresa.crear) &&
    !hasPermission(permisos.empresa.editar) &&
    !hasPermission(permisos.empresa.eliminar)

  return (
    <Grid container spacing={2} alignItems='center' justifyContent='space-between' style={{ marginBottom: '24px' }}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Grid container alignItems='center' justifyContent='space-between'>
              <Grid item>
                <Typography variant='h6'>Solicitudes</Typography>
              </Grid>
              <Grid item>
                <Button
                disabled={soloLectura}
                  variant='contained'
                  color='primary'
                  startIcon={<i className='ri-add-line' />}
                  onClick={() => router.push('/home/apps/requests/create')}
                >
                  Nueva Solicitud
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default RequestListCards2
