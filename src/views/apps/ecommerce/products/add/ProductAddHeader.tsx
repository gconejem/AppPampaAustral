// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const ProductAddHeader = () => {
  return (
    <Box sx={{ backgroundColor: 'white', padding: 3, borderRadius: 2, boxShadow: 1, marginBottom: 4 }}>
      <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
        <div>
          <Typography variant='h5' className='mbe-1'>
            Nuevo Producto
          </Typography>
          <Typography></Typography>
        </div>
        <div className='flex flex-wrap max-sm:flex-col gap-4'>
          <Button variant='outlined' color='secondary'>
            Descartar
          </Button>
          <Button variant='outlined'>Guardar Borrador</Button>
          <Button variant='contained' startIcon={<i className='ri-add-line' />}>
            Publicar
          </Button>
        </div>
      </div>
    </Box>
  )
}

export default ProductAddHeader
