'use client'
import { useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

const mockUsers = [
    { id: '1', name: 'Admin', roles: ['ADMIN'], permissions: ['users.read', 'users.write'] },
    { id: '2', name: 'Viewer', roles: ['VIEWER'], permissions: ['users.read'] }
]

const allRoles = ['ADMIN', 'VIEWER', 'ENCODER', 'SUPERVISOR']
const allPermissions = [
    'users.read', 'users.write', 'users.delete', 'roles.read', 'roles.write'
]

export default function UserRolePermissionManager() {
    const { session } = usePermissions()
    const [users, setUsers] = useState(mockUsers)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRoles, setEditRoles] = useState<string[]>([])
    const [editPerms, setEditPerms] = useState<string[]>([])

    const startEdit = (user: any) => {
        setEditingId(user.id)
        setEditRoles(user.roles)
        setEditPerms(user.permissions)
    }

    const saveEdit = () => {
        setUsers(users.map(u =>
            u.id === editingId ? { ...u, roles: editRoles, permissions: editPerms } : u
        ))
        setEditingId(null)
    }

    return (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h1>Gestor de Roles y Permisos</h1>
            <h2>Usuarios</h2>
            <ul>
                {users.map(u => (
                    <li key={u.id} style={{ marginBottom: 16 }}>
                        <strong>{u.name}</strong>
                        {editingId === u.id ? (
                            <div style={{ marginTop: 8 }}>
                                <div>
                                    <label>Roles:</label>
                                    {allRoles.map(role => (
                                        <label key={role} style={{ marginLeft: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={editRoles.includes(role)}
                                                onChange={e => {
                                                    setEditRoles(e.target.checked
                                                        ? [...editRoles, role]
                                                        : editRoles.filter(r => r !== role))
                                                }}
                                            />
                                            {role}
                                        </label>
                                    ))}
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <label>Permisos:</label>
                                    {allPermissions.map(perm => (
                                        <label key={perm} style={{ marginLeft: 8 }}>
                                            <input
                                                type="checkbox"
                                                checked={editPerms.includes(perm)}
                                                onChange={e => {
                                                    setEditPerms(e.target.checked
                                                        ? [...editPerms, perm]
                                                        : editPerms.filter(p => p !== perm))
                                                }}
                                            />
                                            {perm}
                                        </label>
                                    ))}
                                </div>
                                <button onClick={saveEdit} style={{ marginTop: 8 }}>Guardar</button>
                                <button onClick={() => setEditingId(null)} style={{ marginLeft: 8 }}>Cancelar</button>
                            </div>
                        ) : (
                            <span>
                                {' '} - Roles: {u.roles.join(', ')} - Permisos: {u.permissions.join(', ')}
                                <button onClick={() => startEdit(u)} style={{ marginLeft: 8 }}>Editar</button>
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
