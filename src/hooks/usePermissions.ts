import { useSession } from 'next-auth/react'

export function usePermissions() {
    const { data: session, status } = useSession()
    console.log('🔐 [usePermissions] session:', session)
    return {
        hasPermission: (perm: string) =>
            session?.user?.permissions?.includes(perm) ?? false,
        hasRole: (role: string) =>
            session?.user?.roles?.includes(role) ?? false,
        session,
        status
    }
}
