// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'

// Type Imports
import type { ButtonProps } from '@mui/material/Button'

import type { ThemeColor } from '@core/types'
import type { OrderType } from '@/types/apps/ecommerceTypes'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

type PayementStatusType = {
  text: string
  color: ThemeColor
}

type StatusChipColorType = {
  color: ThemeColor
}

export const paymentStatus: { [key: number]: PayementStatusType } = {
  1: { text: 'Paid', color: 'success' },
  2: { text: 'Pending', color: 'warning' },
  3: { text: 'Cancelled', color: 'secondary' },
  4: { text: 'Failed', color: 'error' }
}

export const statusChipColor: { [key: string]: StatusChipColorType } = {
  Delivered: { color: 'success' },
  'Out for Delivery': { color: 'primary' },
  'Ready to Pickup': { color: 'info' },
  Dispatched: { color: 'warning' }
}

const OrderDetailHeader = ({ orderData, order }: { orderData?: OrderType; order: string }) => {
  // Vars
  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    color,
    variant
  })

  return (
    <Box
      className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'
      sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}
    >
      <div className='flex flex-col items-start gap-1'>
        <div className='flex items-center gap-2'>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>{`Solicitud #${order}`}</Typography>
          <Chip variant='outlined' label='Estado' size='small' />
        </div>
        <Typography variant='body2'>{`${new Date(orderData?.date ?? '').toDateString()}, ${orderData?.time} (GMT-4)`}</Typography>
      </div>
      <div className='flex items-center gap-2'>
        {/* Ajustamos el tamaño a pequeño con size="small" */}
        <TextField
          label='Cliente'
          value='Cliente'
          variant='outlined'
          size='small'
          InputProps={{
            readOnly: true // Desactiva la edición
          }}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label='Obra'
          value='Obra'
          variant='outlined'
          size='small'
          InputProps={{
            readOnly: true
          }}
          sx={{ minWidth: 120 }}
        />
        <OpenDialogOnElementClick
          element={Button}
          elementProps={buttonProps('Deshabilitar Solicitud', 'error', 'outlined')}
          dialog={ConfirmationDialog}
          dialogProps={{ type: 'delete-order' }}
        />
      </div>
    </Box>
  )
}

export default OrderDetailHeader
