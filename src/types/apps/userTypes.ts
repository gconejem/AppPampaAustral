// Type Imports
import type { ThemeColor } from '@core/types'

export type UsersType = {
  rut: string
  id: number
  role: string
  email: string
  status: string
  avatar: string
  company: string
  country: string
  contact: string
  fullName: string
  username: string
  currentPlan: string
  avatarColor?: ThemeColor
}
