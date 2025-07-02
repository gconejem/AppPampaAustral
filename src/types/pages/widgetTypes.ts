// Widget Types
import type { ReactNode } from 'react'

export interface CardStatsCharacterProps {
  title: string
  stats: string
  chipText: string
  chipColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  avatarImage?: ReactNode
  avatarColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  trend?: 'positive' | 'negative'
  trendNumber?: string
  subtitle?: string
  src?: string
}

export interface StatisticsCardProps {
  title: string
  stats: string
  icon: ReactNode
  subtitle: string
  trendNumber?: string
  trend?: 'positive' | 'negative'
  avatarSkin?: 'filled' | 'outlined'
  avatarColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
}

export interface CardStatsHorizontalProps {
  title: string
  stats: string
  icon: string
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  trend?: 'up' | 'down'
  trendNumber?: string
}

export interface CardStatsVerticalProps {
  title: string
  stats: string
  icon?: ReactNode
  avatarIcon?: string
  chipText?: string
  chipColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  avatarColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  subtitle?: string
  trendNumber?: string | number
  trend?: 'positive' | 'negative'
  avatarSkin?: 'filled' | 'light' | 'light-static'
  avatarSize?: number
  moreOptions?: {
    options: string[]
    iconButtonProps?: object
  }
}

export interface CardStatsCustomerStatsProps {
  title: string
  avatarIcon: string
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  description: string
  stats?: string
  content?: string
  chipLabel?: string
} 

export interface CardStatsHorizontalWithAvatarProps {
  stats: string
  title: string
  avatarIcon: string
  avatarColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  avatarVariant?: 'circular' | 'rounded' | 'square'
  avatarSkin?: 'filled' | 'light' | 'light-static'
  avatarSize?: number
}

export interface CardStatsHorizontalWithBorderProps {
  title: string
  stats: string | number
  trendNumber: number
  avatarIcon: string
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
}
