'use client'
import { useEffect, useState } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Button,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    TablePagination,
    TextField,
    TableSortLabel,
    Chip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Tooltip from '@mui/material/Tooltip'
import AddIcon from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'

type TabType = 'usuarios' | 'roles' | 'permisos'

export default function UserRolePermissionManager() {
    const { session } = usePermissions()
    const [users, setUsers] = useState([])
    const [roles, setRoles] = useState([])
    const [permissions, setPermissions] = useState([])
    const [activeTab, setActiveTab] = useState<TabType>('usuarios')
    const [editingUser, setEditingUser] = useState<any | null>(null)
    const [editRoles, setEditRoles] = useState<string[]>([])
    const [editPerms, setEditPerms] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [deleteUser, setDeleteUser] = useState<any | null>(null)
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(5)
    const [search, setSearch] = useState('')
    const [orderBy, setOrderBy] = useState<'name'>('name') // Solo por nombre
    const [order, setOrder] = useState<'asc' | 'desc'>('asc')
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', email: '', roles: [], permissions: [] })
    const [showInactive, setShowInactive] = useState(false)
    const [viewPermsUser, setViewPermsUser] = useState<any | null>(null)
    const [orderByPerm, setOrderByPerm] = useState<'categoria' | 'name' | 'descripcion'>('name')
    const [orderPerm, setOrderPerm] = useState<'asc' | 'desc'>('asc')

    // Agrega estos estados para filtro avanzado
    const [roleFilter, setRoleFilter] = useState<string>('')

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then(data => {
            console.log('Usuarios recibidos:', data)
            setUsers(data)
        })
        fetch('/api/admin/roles').then(res => res.json()).then(setRoles)
        fetch('/api/admin/permissions').then(res => res.json()).then(setPermissions)
    }, [])

    const handleTabChange = (_: any, newValue: TabType) => {
        setActiveTab(newValue)
    }

    const startEdit = (user: any) => {
        setEditingUser(user)
        setEditRoles(user.roles)
        setEditPerms(user.permissions)
    }

    const saveEdit = async () => {
        setLoading(true)
        await fetch(`/api/admin/users/${editingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: editingUser.name,
                email: editingUser.email,
                roles: editRoles,
                permissions: editPerms
            })
        })
        setMessage('Cambios guardados correctamente')
        fetch('/api/admin/users').then(res => res.json()).then(setUsers)
        setLoading(false)
        setEditingUser(null)
    }

    const confirmDelete = (user: any) => {
        setDeleteUser(user)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
        if (res.ok) {
            fetch('/api/admin/users').then(res => res.json()).then(setUsers)
            setDeleteUser(null) // <-- Cierra el popup
        }
    }

    const handleAddUser = async () => {
        setLoading(true)
        // Solo envía name, email y roles
        const payload = {
            name: newUser.name,
            email: newUser.email,
            roles: newUser.roles
        }
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if (res.ok) {
            setMessage('Usuario agregado correctamente')
            fetch('/api/admin/users').then(res => res.json()).then(setUsers)
        }
        setLoading(false)
        setAddDialogOpen(false)
        setNewUser({ name: '', email: '', roles: [], permissions: [] })
    }

    // Paginación handlers
    const handleChangePage = (_: any, newPage: number) => {
        setPage(newPage)
    }
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    // Ordenamiento
    const handleSort = (property: 'name') => {
        const isAsc = orderBy === property && order === 'asc'
        setOrder(isAsc ? 'desc' : 'asc')
        setOrderBy(property)
    }

    // Ordenamiento permisos
    const handleSortPerm = (property: 'categoria' | 'name' | 'descripcion') => {
        const isAsc = orderByPerm === property && orderPerm === 'asc'
        setOrderPerm(isAsc ? 'desc' : 'asc')
        setOrderByPerm(property)
    }

    // Filtrado y ordenamiento mejorado
    const filteredUsers = users
        .filter((u: any) =>
            showInactive
                ? u.active === 'INACTIVO'
                : u.active === 'ACTIVO'
        )
        .filter((u: any) =>
            (search.trim() === '' ||
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
                u.roles.join(', ').toLowerCase().includes(search.toLowerCase()) ||
                u.permissions.join(', ').toLowerCase().includes(search.toLowerCase()))
            &&
            (roleFilter === '' || u.roles.includes(roleFilter))
        )
        .sort((a: any, b: any) => {
            return order === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name)
        })

    const sortedFilteredPermissions = permissions
        .filter(p =>
            search.trim() === '' ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.descripcion ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (p.categoria ?? '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let aVal = a[orderByPerm] ?? ''
            let bVal = b[orderByPerm] ?? ''
            return orderPerm === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal))
        })

    // Explicaciones por tab
    const tabExplanations: Record<TabType, React.ReactNode> = {
        usuarios: (
            <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Usuarios:</strong> Aquí puedes ver, buscar, editar y eliminar usuarios del sistema. Solo usuarios con rol <strong>ADMIN</strong> pueden acceder a esta sección.<br />
                <strong>Seguridad:</strong> La edición/eliminación está protegida y solo disponible para administradores.<br />
                <strong>¿Por qué ves permisos?</strong> Los permisos que aparecen son los que el usuario recibe a través de los roles asignados. No se pueden agregar permisos directamente a usuarios, solo mediante roles. Si no aparecen, revisa que los roles tengan permisos correctamente asignados en la base de datos.
            </Alert>
        ),
        roles: (
            <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Roles:</strong> Aquí se listan todos los roles disponibles en el sistema. Los roles definen grupos de permisos y acceso.<br />
                <strong>Seguridad:</strong> Los roles suelen ser gestionados por el equipo de desarrollo o administradores avanzados, ya que afectan el acceso global.<br />
                <strong>Nota:</strong> No se pueden crear o eliminar roles desde esta interfaz para evitar riesgos de seguridad.
            </Alert>
        ),
        permisos: (
            <Alert severity="info" sx={{ mb: 2 }}>
                <strong>Permisos:</strong> Aquí se listan todos los permisos disponibles en el sistema. Los permisos definen acciones específicas que pueden realizar los usuarios.<br />
                <strong>Seguridad:</strong> Los permisos se asignan a roles y no directamente a usuarios, para mantener el control y la trazabilidad.<br />
                <strong>Nota:</strong> Si necesitas agregar nuevos permisos, contacta al equipo de desarrollo o administración.
            </Alert>
        )
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
            <Typography variant="h4" gutterBottom>Gestor de Roles y Permisos</Typography>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Usuarios" value="usuarios" />
                <Tab label="Roles" value="roles" />
                <Tab label="Permisos" value="permisos" />
            </Tabs>
            {tabExplanations[activeTab]}
            {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
            {activeTab === 'usuarios' && (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <TextField
                            label="Buscar usuario, rol o permiso"
                            variant="outlined"
                            size="small"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            sx={{ width: 250, mr: 2 }}
                        />
                        <TextField
                            label="Filtrar por rol"
                            variant="outlined"
                            size="small"
                            select
                            SelectProps={{ native: true }}
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            sx={{ width: 220, mr: 2 }} // <-- Agrandado de 180 a 220px
                        >
                            <option value="">Todos</option>
                            {roles.map((role: any) => (
                                <option key={role.id} value={role.nombre}>{role.nombre}</option>
                            ))}
                        </TextField>
                        <Box>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={showInactive}
                                        onChange={e => setShowInactive(e.target.checked)}
                                    />
                                }
                                label="Mostrar inactivos"
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setAddDialogOpen(true)}
                                sx={{ ml: 2 }}
                            >
                                Agregar usuario
                            </Button>
                        </Box>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderBy === 'name'}
                                            direction={order}
                                            onClick={() => handleSort('name')}
                                        >
                                            Nombre
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Roles</TableCell>
                                    <TableCell>Permisos</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">
                                        Acciones
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            Editar / Eliminar
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u: any) => (
                                    <TableRow key={u.id} sx={{
                                        bgcolor: u.active === 'INACTIVO' ? '#fff3e0' : undefined
                                    }}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email ?? 'sin email'}</TableCell>
                                        <TableCell>
                                            {u.roles.length > 0
                                                ? u.roles.map((role: string, idx: number) => (
                                                    <Chip key={idx} label={role} size="small" sx={{ mr: 0.5 }} />
                                                ))
                                                : <span style={{ color: '#888' }}>Sin roles</span>
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {u.permissions && u.permissions.length > 0 ? (
                                                <>
                                                    {u.permissions.slice(0, 2).map((perm: string, idx: number) => (
                                                        <Chip key={idx} label={perm} size="small" sx={{ mr: 0.5 }} />
                                                    ))}
                                                    {u.permissions.length > 2 && (
                                                        <Tooltip title="Ver todos los permisos">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setViewPermsUser(u)}
                                                                sx={{ ml: 1 }}
                                                            >
                                                                <VisibilityIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </>
                                            ) : (
                                                <span style={{ color: '#888' }}>Sin permisos</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span style={{
                                                color: u.active === 'ACTIVO' ? 'green' : 'red',
                                                fontWeight: 500
                                            }}>
                                                {u.active}
                                            </span>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Editar usuario">
                                                <IconButton color="primary" onClick={() => startEdit(u)} disabled={u.active === 'INACTIVO'}>
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Eliminar usuario">
                                                <IconButton color="error" onClick={() => confirmDelete(u)} disabled={u.active === 'INACTIVO'}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={filteredUsers.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}
                            labelDisplayedRows={({ from, to, count }) => `Página ${page + 1} (${from}-${to} de ${count})`}
                        />
                        {/* Diálogo de edición */}
                        <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="sm" fullWidth>
                            <DialogTitle>Editar usuario</DialogTitle>
                            <DialogContent>
                                {editingUser && (
                                    <>
                                        <Typography variant="subtitle2">Roles:</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                            {roles.map((role: any) => (
                                                <FormControlLabel
                                                    key={role.id}
                                                    control={
                                                        <Checkbox
                                                            checked={editRoles.includes(role.nombre)}
                                                            onChange={e => {
                                                                setEditRoles(e.target.checked
                                                                    ? [...editRoles, role.nombre]
                                                                    : editRoles.filter(r => r !== role.nombre))
                                                            }}
                                                        />
                                                    }
                                                    label={role.nombre}
                                                />
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={saveEdit}
                                    disabled={loading}
                                    startIcon={loading && <CircularProgress size={18} />}
                                >
                                    Guardar
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setEditingUser(null)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </DialogActions>
                        </Dialog>
                        {/* Diálogo de eliminación */}
                        <Dialog open={!!deleteUser} onClose={() => setDeleteUser(null)}>
                            <DialogTitle>Eliminar usuario</DialogTitle>
                            <DialogContent>
                                <Typography>¿Seguro que deseas eliminar a <strong>{deleteUser?.name}</strong>?</Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleDelete(deleteUser?.id)}
                                    disabled={loading}
                                    startIcon={loading && <CircularProgress size={18} />}
                                >
                                    Eliminar
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setDeleteUser(null)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </DialogActions>
                        </Dialog>
                        {/* Diálogo de agregar usuario */}
                        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
                            <DialogTitle>Agregar usuario</DialogTitle>
                            <DialogContent>
                                <TextField
                                    label="Nombre"
                                    fullWidth
                                    margin="normal"
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                />
                                <TextField
                                    label="Email"
                                    fullWidth
                                    margin="normal"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                                <TextField
                                    label="Usuario"
                                    fullWidth
                                    margin="normal"
                                    value={newUser.usuario}
                                    onChange={e => setNewUser({ ...newUser, usuario: e.target.value })}
                                />
                                <TextField
                                    label="RUT"
                                    fullWidth
                                    margin="normal"
                                    value={newUser.rut}
                                    onChange={e => setNewUser({ ...newUser, rut: e.target.value })}
                                />
                                <Typography variant="subtitle2" sx={{ mt: 2 }}>Roles:</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {roles.map((role: any) => (
                                        <FormControlLabel
                                            key={role.id}
                                            control={
                                                <Checkbox
                                                    checked={newUser.roles.includes(role.nombre)}
                                                    onChange={e => {
                                                        setNewUser({
                                                            ...newUser,
                                                            roles: e.target.checked
                                                                ? [...newUser.roles, role.nombre]
                                                                : newUser.roles.filter(r => r !== role.nombre)
                                                        })
                                                    }}
                                                />
                                            }
                                            label={role.nombre}
                                        />
                                    ))}
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleAddUser}
                                    disabled={loading}
                                    startIcon={loading && <CircularProgress size={18} />}
                                >
                                    Agregar
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setAddDialogOpen(false)}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </DialogActions>
                        </Dialog>
                        {/* Diálogo de ver permisos de usuario */}
                        <Dialog open={!!viewPermsUser} onClose={() => setViewPermsUser(null)}>
                            <DialogTitle>Permisos de {viewPermsUser?.name}</DialogTitle>
                            <DialogContent>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>#</TableCell>
                                            <TableCell>Permiso</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {viewPermsUser?.permissions?.map((perm: string, idx: number) => (
                                            <TableRow key={idx}>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell>{perm}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setViewPermsUser(null)}>Cerrar</Button>
                            </DialogActions>
                        </Dialog>
                    </TableContainer>
                </>
            )}
            {activeTab === 'roles' && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Roles existentes</Typography>
                    <Stack spacing={1}>
                        {roles.map((role: any) => (
                            <Paper key={role.id} sx={{ p: 2 }}>
                                <Typography variant="body1">
                                    <strong>{role.nombre}</strong>
                                    <br />
                                    <span style={{ color: '#888' }}>
                                        {role.descripcion}
                                    </span>
                                    <br />
                                    <strong>Permisos:</strong>{' '}
                                    {role.permisos && role.permisos.length > 0
                                        ? role.permisos.map((p: any) => p.permission?.name).join(', ')
                                        : 'Sin permisos'}
                                </Typography>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}
            {activeTab === 'permisos' && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Permisos existentes</Typography>
                    <TextField
                        label="Buscar permiso"
                        variant="outlined"
                        size="small"
                        sx={{ mb: 2, width: 350 }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <TableContainer component={Paper} sx={{ width: '100%' }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>N°</TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByPerm === 'categoria'}
                                            direction={orderPerm}
                                            onClick={() => handleSortPerm('categoria')}
                                        >
                                            Categoría
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByPerm === 'name'}
                                            direction={orderPerm}
                                            onClick={() => handleSortPerm('name')}
                                        >
                                            Nombre
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={orderByPerm === 'descripcion'}
                                            direction={orderPerm}
                                            onClick={() => handleSortPerm('descripcion')}
                                        >
                                            Descripción
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedFilteredPermissions
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((p, idx) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                                            <TableCell>{p.categoria}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>
                                                {p.descripcion && p.descripcion.length > 40 ? (
                                                    <Tooltip title={p.descripcion}>
                                                        <span>{p.descripcion.slice(0, 40)}...</span>
                                                    </Tooltip>
                                                ) : (
                                                    p.descripcion
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={sortedFilteredPermissions.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25]}
                        />
                    </TableContainer>
                </Box>
            )}
        </Box>
    )
}
