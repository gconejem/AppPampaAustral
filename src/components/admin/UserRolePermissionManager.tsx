'use client'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'

type Tab = 'usuarios' | 'roles' | 'permisos'

export default function UserRolePermissionManager() {
    const { session } = usePermissions()
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [activeTab, setActiveTab] = useState<Tab>('usuarios')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRoles, setEditRoles] = useState<string[]>([])
    const [editPerms, setEditPerms] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then(setUsers)
        fetch('/api/admin/roles').then(res => res.json()).then(setRoles)
        fetch('/api/admin/permissions').then(res => res.json()).then(setPermissions)
    }, [])

    const startEdit = (user: any) => {
        setEditingId(user.id)
        setEditRoles(user.roles)
        setEditPerms(user.permissions)
    }

    const saveEdit = () => {
        setLoading(true)
        setTimeout(() => {
            setUsers(users.map(u =>
                u.id === editingId ? { ...u, roles: editRoles, permissions: editPerms } : u
            ))
            setMessage('Cambios guardados correctamente')
            setLoading(false)
            setEditingId(null)
        }, 800)
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h1>Gestor de Roles y Permisos</h1>
            <div style={{ marginBottom: 16 }}>
                <button onClick={() => setActiveTab('usuarios')} style={{ marginRight: 8, fontWeight: activeTab === 'usuarios' ? 'bold' : 'normal' }}>Usuarios</button>
                <button onClick={() => setActiveTab('roles')} style={{ marginRight: 8, fontWeight: activeTab === 'roles' ? 'bold' : 'normal' }}>Roles</button>
                <button onClick={() => setActiveTab('permisos')} style={{ fontWeight: activeTab === 'permisos' ? 'bold' : 'normal' }}>Permisos</button>
            </div>
            {message && <div style={{ color: 'green', marginBottom: 8 }}>{message}</div>}
            {activeTab === 'usuarios' && (
                <div>
                    <h2>Usuarios</h2>
                    <ul>
                        {users.map((u: any) => (
                            <li key={u.id} style={{ marginBottom: 16 }}>
                                <strong>{u.name}</strong> ({u.email ?? 'sin email'})
                                {editingId === u.id ? (
                                    <div style={{ marginTop: 8, border: '1px solid #ccc', padding: 8, borderRadius: 4 }}>
                                        <div>
                                            <label>Roles:</label>
                                            {roles.map((role: string) => (
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
                                            {permissions.map((perm: string) => (
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
                                        <button onClick={saveEdit} disabled={loading} style={{ marginTop: 8 }}>Guardar</button>
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
            )}
            {activeTab === 'roles' && (
                <div>
                    <h2>Roles existentes</h2>
                    <ul>
                        {roles.map((role: string) => (
                            <li key={role}><strong>{role}</strong></li>
                        ))}
                    </ul>
                    {/* Aquí puedes agregar gestión de roles */}
                </div>
            )}
            {activeTab === 'permisos' && (
                <div>
                    <h2>Permisos existentes</h2>
                    <ul>
                        {permissions.map((perm: string) => (
                            <li key={perm}>{perm}</li>
                        ))}
                    </ul>
                    {/* Aquí puedes agregar gestión de permisos */}
                </div>
            )}
        </div>
    )
}
