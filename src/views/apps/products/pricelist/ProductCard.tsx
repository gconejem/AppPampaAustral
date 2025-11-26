'use client'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import EditIcon from 'react-icons/all/EditIcon'
import DeleteIcon from 'react-icons/all/DeleteIcon'
import OptionMenu from '@mui/material/OptionMenu'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type DataType = {
  title: string
  value: string
  icon: string
  desc: string
  change?: number
}

// Vars
const data: DataType[] = [
  {
    title: 'In-Store Sales',
    value: '$5,345',
    icon: 'ri-home-6-line',
    desc: '5k',
    change: 5.7
  },
  {
    title: 'Website Sales',
    value: '$74,347',
    icon: 'ri-computer-line',
    desc: '21k',
    change: 12.4
  },
  {
    title: 'Discount',
    value: '$14,235',
    icon: 'ri-gift-line',
    desc: '6k'
  },
  {
    title: 'Affiliate',
    value: '$8,345',
    icon: 'ri-money-dollar-circle-line',
    desc: '150',
    change: -3.5
  }
]

const ProductCard = () => {
  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
}

export default ProductCard
