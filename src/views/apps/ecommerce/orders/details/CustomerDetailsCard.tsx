// MUI Imports
import Card from '@mui/material/Card'
import Avatar from '@mui/material/Avatar'
import type { TypographyProps } from '@mui/material/Typography'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { OrderType } from '@/types/apps/ecommerceTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import EditUserInfo from '@components/dialogs/edit-user-info'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'

// Util Imports
import { getInitials } from '@/utils/getInitials'

const getAvatar = (params: Pick<OrderType, 'avatar' | 'customer'>) => {
  const { avatar, customer } = params

  if (avatar) {
    return <Avatar src={avatar} />
  } else {
    return <Avatar>{getInitials(customer as string)}</Avatar>
  }
}

// Vars
const userData = {
  firstName: 'Gabrielle',
  lastName: 'Feyer',
  userName: '@gabriellefeyer',
  billingEmail: 'gfeyer0@nyu.edu',
  status: 'active',
  role: 'Customer',
  taxId: 'Tax-8894',
  contact: '+1 (234) 464-0600',
  language: ['English'],
  country: 'France',
  useAsBillingAddress: true
}

const CustomerDetails = ({ orderData }: { orderData?: OrderType }) => {
  // Vars
  const typographyProps = (children: string, color: ThemeColor, className: string): TypographyProps => ({
    children,
    color,
    className
  })

  return <Card></Card>
}

export default CustomerDetails
