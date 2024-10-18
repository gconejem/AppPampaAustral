// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

const ProductAddHeader = () => {
  return (
    <div className='flex flex-wrap sm:items-center justify-between max-sm:flex-col gap-6'>
      <div>
        <Typography variant='h4' className='mbe-1'>
          Añadir Ensayo/Servicio
        </Typography>
        <Typography></Typography>
      </div>
      <div className='flex flex-wrap max-sm:flex-col gap-4'>
        <Button variant='outlined' color='secondary'>
          Cancelar
        </Button>
        <Button variant='outlined'>Guardar Borrador</Button>
        <Button variant='contained'>Publicar Item</Button>
      </div>
    </div>
  )
}

export default ProductAddHeader
