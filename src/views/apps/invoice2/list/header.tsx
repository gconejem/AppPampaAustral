// MUI Imports
import Link from 'next/link'

import { Box, Grid, Typography, Button } from '@mui/material'

const Header = () => {
  return (
    <Box sx={{ backgroundColor: 'white', borderRadius: 2, padding: 3, boxShadow: 1, mb: 6 }}>
      <Grid container justifyContent='space-between' alignItems='center'>
        <Grid item>
          <Typography variant='h6'>Facturación y Cobranza</Typography>
        </Grid>
        <Grid item>
          <Link href='/apps/invoice2/add' passHref>
            <Button variant='contained' color='primary'>
              + Crear Minuta
            </Button>
          </Link>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Header
