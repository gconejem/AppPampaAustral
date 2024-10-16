// MUI Imports
import Link from 'next/link'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { Button } from '@mui/material'

// Type Imports
import type { ThemeColor } from '@core/types'

const BillingAddress = () => {
  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-col'>
          <Typography variant='h6' color='textPrimary'>
            Cotización
          </Typography>
          <div className='flex flex-col'>
            <Typography>Folio #4987</Typography>
            <Typography>Desde: 17-07-2024</Typography>
            <Typography>Hasta: 31-07-2024</Typography>
            <Typography>Para: Jordan Stevenson</Typography>
            <Typography>+56 9 61630966</Typography>
            <Typography>email@email.com</Typography>
          </div>
        </div>
        <div className='flex justify-center items-center'>
          <Link href='/en/apps/invoice/edit/4987' passHref>
            <Button
              variant='contained'
              color='primary'
              sx={{ textTransform: 'none' }} // Evita que el texto sea en mayúsculas
            >
              Editar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default BillingAddress
