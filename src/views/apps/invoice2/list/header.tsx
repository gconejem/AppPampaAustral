// MUI Imports
import Link from 'next/link'

import { Box, Grid, Typography, Button, Stack } from '@mui/material'

const Header = () => {
  return (
    <Box sx={{ backgroundColor: 'white', borderRadius: 2, padding: 3, boxShadow: 1, mb: 6 }}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography variant='h6'>Facturación y Cobranza</Typography>
        </Grid>
        <Grid item>
          <Stack direction='row' spacing={2}>
            <Button variant='outlined' color='secondary'>
              Informes
            </Button>

            <Link href='/apps/invoice2/add' passHref>
              <Button variant='contained' color='primary'>
                + Crear Minuta
              </Button>
            </Link>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
