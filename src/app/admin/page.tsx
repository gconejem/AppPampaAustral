'use client'
import { usePermissions } from '@/hooks/usePermissions'
import UserRolePermissionManager from '@/components/admin/UserRolePermissionManager'

export default function AdminPage() {
    const { hasRole, session, status } = usePermissions()
    console.log('🔐 [AdminPage] roles:', session?.user?.roles)
    console.log('🔐 [AdminPage] permisos:', session?.user?.permissions)

    if (status === 'loading') return <div>Cargando...</div>
    if (!hasRole('Administrador')) return <div>No tienes acceso de administrador</div>

    return (
        <div>
            <UserRolePermissionManager />
        </div>
    )
}
