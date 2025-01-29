// Third-party Imports
import { getServerSession } from 'next-auth'
import { getCookies } from 'next-auth'
import { headers } from 'next-auth'

// Type Imports
import type { Locale } from '@configs/i18n'
import type { ChildrenType } from '@core/types'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

export default async function AuthGuard({ children, locale }: ChildrenType & { locale: Locale }) {
  try {
    const session = await getServerSession()
    const cookies = await getCookies()
    const headersList = await headers()

    return <>{session ? children : <AuthRedirect lang={locale} />}</>
  } catch (error) {
    console.error('Auth error:', error)
    return <AuthRedirect lang={locale} />
  }
}
