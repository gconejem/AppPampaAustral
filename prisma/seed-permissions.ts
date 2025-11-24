import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const permissions = [
    // USUARIOS
    { name: 'users.create', descripcion: 'Crear usuarios', categoria: 'USUARIOS' },
    { name: 'users.read', descripcion: 'Ver usuarios', categoria: 'USUARIOS' },
    { name: 'users.update', descripcion: 'Editar usuarios', categoria: 'USUARIOS' },
    { name: 'users.delete', descripcion: 'Eliminar usuarios', categoria: 'USUARIOS' },

    // ROLES
    { name: 'roles.create', descripcion: 'Crear roles', categoria: 'ROLES' },
    { name: 'roles.read', descripcion: 'Ver roles', categoria: 'ROLES' },
    { name: 'roles.update', descripcion: 'Editar roles', categoria: 'ROLES' },
    { name: 'roles.delete', descripcion: 'Eliminar roles', categoria: 'ROLES' },

    // RCM
    { name: 'rcm.create', descripcion: 'Crear RCM', categoria: 'RCM' },
    { name: 'rcm.read', descripcion: 'Ver RCM', categoria: 'RCM' },
    { name: 'rcm.update', descripcion: 'Editar RCM', categoria: 'RCM' },
    { name: 'rcm.delete', descripcion: 'Eliminar RCM', categoria: 'RCM' },
    { name: 'rcm.export', descripcion: 'Exportar RCM', categoria: 'RCM' },
    { name: 'rcm.approve', descripcion: 'Aprobar RCM', categoria: 'RCM' },

    // AGENDA
    { name: 'agenda.create', descripcion: 'Crear agenda', categoria: 'AGENDA' },
    { name: 'agenda.read', descripcion: 'Ver agenda', categoria: 'AGENDA' },
    { name: 'agenda.update', descripcion: 'Editar agenda', categoria: 'AGENDA' },
    { name: 'agenda.delete', descripcion: 'Eliminar agenda', categoria: 'AGENDA' },

    // CLIENTES
    { name: 'clientes.create', descripcion: 'Crear clientes', categoria: 'CLIENTES' },
    { name: 'clientes.read', descripcion: 'Ver clientes', categoria: 'CLIENTES' },
    { name: 'clientes.update', descripcion: 'Editar clientes', categoria: 'CLIENTES' },
    { name: 'clientes.delete', descripcion: 'Eliminar clientes', categoria: 'CLIENTES' },

    // OBRAS
    { name: 'obras.create', descripcion: 'Crear obras', categoria: 'OBRAS' },
    { name: 'obras.read', descripcion: 'Ver obras', categoria: 'OBRAS' },
    { name: 'obras.update', descripcion: 'Editar obras', categoria: 'OBRAS' },
    { name: 'obras.delete', descripcion: 'Eliminar obras', categoria: 'OBRAS' },

    // COTIZACIONES
    { name: 'cotizaciones.create', descripcion: 'Crear cotizaciones', categoria: 'COTIZACIONES' },
    { name: 'cotizaciones.read', descripcion: 'Ver cotizaciones', categoria: 'COTIZACIONES' },
    { name: 'cotizaciones.update', descripcion: 'Editar cotizaciones', categoria: 'COTIZACIONES' },
    { name: 'cotizaciones.delete', descripcion: 'Eliminar cotizaciones', categoria: 'COTIZACIONES' },
    { name: 'cotizaciones.approve', descripcion: 'Aprobar cotizaciones', categoria: 'COTIZACIONES' },

    // PRODUCTOS
    { name: 'productos.create', descripcion: 'Crear productos', categoria: 'PRODUCTOS' },
    { name: 'productos.read', descripcion: 'Ver productos', categoria: 'PRODUCTOS' },
    { name: 'productos.update', descripcion: 'Editar productos', categoria: 'PRODUCTOS' },
    { name: 'productos.delete', descripcion: 'Eliminar productos', categoria: 'PRODUCTOS' },

    // EQUIPOS
    { name: 'equipos.create', descripcion: 'Crear equipos', categoria: 'EQUIPOS' },
    { name: 'equipos.read', descripcion: 'Ver equipos', categoria: 'EQUIPOS' },
    { name: 'equipos.update', descripcion: 'Editar equipos', categoria: 'EQUIPOS' },
    { name: 'equipos.delete', descripcion: 'Eliminar equipos', categoria: 'EQUIPOS' },

    // INFORMES
    { name: 'informes.read', descripcion: 'Ver informes', categoria: 'INFORMES' },
    { name: 'informes.export', descripcion: 'Exportar informes', categoria: 'INFORMES' },

    // EMAIL
    { name: 'email.send', descripcion: 'Enviar emails', categoria: 'EMAIL' },

    // REPORTES
    { name: 'reports.read', descripcion: 'Ver reportes', categoria: 'REPORTES' },
    { name: 'reports.export', descripcion: 'Exportar reportes', categoria: 'REPORTES' },
]

const rolesPermissions = {
    'Administrador': [
        ...permissions.map(p => p.name) // Todos los permisos
    ],
    'ADMIN': [
        ...permissions.map(p => p.name) // Todos los permisos
    ],
    'Laboratorista': [
        'rcm.read', 'rcm.update', 'rcm.create',
        'agenda.read', 'agenda.update',
        'clientes.read',
        'obras.read',
        'productos.read',
        'equipos.read',
        'informes.read', 'informes.export'
    ],
    'LABORATORISTA': [
        'rcm.read', 'rcm.update', 'rcm.create',
        'agenda.read', 'agenda.update',
        'clientes.read',
        'obras.read',
        'productos.read',
        'equipos.read',
        'informes.read', 'informes.export'
    ],
    'E. de Ruta': [
        'agenda.read', 'agenda.update',
        'obras.read',
        'clientes.read'
    ],
    'E. Comercial': [
        'clientes.create', 'clientes.read', 'clientes.update',
        'obras.create', 'obras.read', 'obras.update',
        'cotizaciones.create', 'cotizaciones.read', 'cotizaciones.update',
        'productos.read'
    ],
    'ENCODER': [
        'rcm.create', 'rcm.read', 'rcm.update',
        'agenda.read',
        'clientes.read',
        'obras.read',
        'productos.read'
    ],
    'SUPERVISOR': [
        'rcm.read', 'rcm.approve',
        'agenda.read', 'agenda.update', 'agenda.create',
        'clientes.read',
        'obras.read',
        'equipos.read', 'equipos.update',
        'informes.read', 'informes.export'
    ],
    'VIENER': [
        'rcm.read',
        'agenda.read',
        'clientes.read',
        'obras.read',
        'informes.read'
    ],
    'No definido': []
}

async function main() {
    console.log('🌱 Iniciando seed de permisos (modo seguro)...')

    // 1. Crear/actualizar permisos (solo agrega descripción y categoría)
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { name: perm.name },
            update: {
                descripcion: perm.descripcion,
                categoria: perm.categoria
                // NO tocamos assignedTo (lo mantiene)
            },
            create: {
                name: perm.name,
                descripcion: perm.descripcion,
                categoria: perm.categoria,
                assignedTo: [] // Array vacío para nuevos
            }
        })
    }
    console.log(`✅ ${permissions.length} permisos procesados`)

    // 2. Asignar permisos a roles (solo crea relaciones RolPermiso)
    for (const [rolNombre, permisoNames] of Object.entries(rolesPermissions)) {
        const rol = await prisma.rol.findUnique({
            where: { nombre: rolNombre }
        })

        if (!rol) {
            console.warn(`⚠️ Rol "${rolNombre}" no encontrado, saltando...`)
            continue
        }

        // Eliminar solo las relaciones de este rol
        await prisma.rolPermiso.deleteMany({
            where: { rolId: rol.id }
        })

        // Crear nuevas relaciones
        let count = 0
        for (const permName of permisoNames) {
            const permission = await prisma.permission.findUnique({
                where: { name: permName }
            })

            if (permission) {
                await prisma.rolPermiso.create({
                    data: {
                        rolId: rol.id,
                        permissionId: permission.id
                    }
                })
                count++
            }
        }

        console.log(`✅ ${count} permisos asignados al rol "${rolNombre}"`)
    }

    console.log('🎉 Seed completado sin afectar datos existentes')
}

main()
    .catch((e) => {
        console.error('❌ Error en seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
