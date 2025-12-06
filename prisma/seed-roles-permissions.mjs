/**
 * Seed para limpiar y crear roles y permisos base del sistema.
 * Cada permiso tiene nombre, descripción y categoría.
 * Cada rol tiene nombre, descripción y permisos asignados.
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // 1. Limpia datos existentes de roles y permisos
    await prisma.rolPermiso.deleteMany()
    await prisma.userRol.deleteMany() // <-- Agrega esta línea antes de borrar roles
    await prisma.rol.deleteMany()
    await prisma.permission.deleteMany()

    // 2. Permisos por módulo
    const permisos = [
        // Cotizaciones
        { name: 'cotizaciones.read', descripcion: 'Ver cotizaciones', categoria: 'Cotizaciones' },
        { name: 'cotizaciones.create', descripcion: 'Crear cotizaciones', categoria: 'Cotizaciones' },
        { name: 'cotizaciones.update', descripcion: 'Editar cotizaciones', categoria: 'Cotizaciones' },
        { name: 'cotizaciones.delete', descripcion: 'Eliminar cotizaciones', categoria: 'Cotizaciones' },
        // Solicitudes
        { name: 'solicitudes.read', descripcion: 'Ver solicitudes', categoria: 'Solicitudes' },
        { name: 'solicitudes.create', descripcion: 'Crear solicitudes', categoria: 'Solicitudes' },
        { name: 'solicitudes.update', descripcion: 'Editar solicitudes', categoria: 'Solicitudes' },
        { name: 'solicitudes.delete', descripcion: 'Eliminar solicitudes', categoria: 'Solicitudes' },
        // Agenda
        { name: 'agenda.read', descripcion: 'Ver agenda', categoria: 'Agenda' },
        { name: 'agenda.create', descripcion: 'Crear eventos en agenda', categoria: 'Agenda' },
        { name: 'agenda.update', descripcion: 'Editar eventos de agenda', categoria: 'Agenda' },
        { name: 'agenda.delete', descripcion: 'Eliminar eventos de agenda', categoria: 'Agenda' },
        // Control Interno
        { name: 'control.read', descripcion: 'Ver control interno', categoria: 'Control Interno' },
        { name: 'control.create', descripcion: 'Crear registros de control interno', categoria: 'Control Interno' },
        { name: 'control.update', descripcion: 'Editar registros de control interno', categoria: 'Control Interno' },
        { name: 'control.delete', descripcion: 'Eliminar registros de control interno', categoria: 'Control Interno' },
        // Empresa
        { name: 'empresa.read', descripcion: 'Ver empresas', categoria: 'Empresa' },
        { name: 'empresa.create', descripcion: 'Crear empresas', categoria: 'Empresa' },
        { name: 'empresa.update', descripcion: 'Editar empresas', categoria: 'Empresa' },
        { name: 'empresa.delete', descripcion: 'Eliminar empresas', categoria: 'Empresa' },
        // Productos
        { name: 'productos.read', descripcion: 'Ver productos', categoria: 'Productos' },
        { name: 'productos.create', descripcion: 'Crear productos', categoria: 'Productos' },
        { name: 'productos.update', descripcion: 'Editar productos', categoria: 'Productos' },
        { name: 'productos.delete', descripcion: 'Eliminar productos', categoria: 'Productos' }
    ]

    // 3. Crea permisos en la base
    const permisosDb: Record<string, any> = {}
    for (const p of permisos) {
        const permiso = await prisma.permission.create({ data: p })
        permisosDb[p.name] = permiso
    }

    // 4. Roles y sus permisos
    const roles = [
        {
            nombre: 'Administrador',
            descripcion: 'Acceso total al sistema',
            permisos: permisos.map(p => p.name)
        },
        {
            nombre: 'Laboratorista',
            descripcion: 'Realiza ensayos, análisis en laboratorio, gestiona área de sala y realiza visitas',
            permisos: [
                'solicitudes.read', 'solicitudes.create', 'solicitudes.update',
                'agenda.read', 'agenda.create', 'agenda.update',
                'control.read', 'control.create', 'control.update'
            ]
        },
        {
            nombre: 'E. de Ruta',
            descripcion: 'Gestiona rutas y entregas',
            permisos: [
                'agenda.read', 'agenda.update',
                'solicitudes.read', 'solicitudes.update',
                'control.read', 'control.update'
            ]
        },
        {
            nombre: 'E. Comercial',
            descripcion: 'Gestiona aspectos comerciales',
            permisos: [
                'cotizaciones.read', 'cotizaciones.create', 'cotizaciones.update',
                'solicitudes.read', 'solicitudes.create', 'solicitudes.update'
            ]
        },
        {
            nombre: 'Supervisor',
            descripcion: 'Supervisa y aprueba registros, puede ver y editar en todos los módulos',
            permisos: [
                'cotizaciones.read', 'cotizaciones.update',
                'solicitudes.read', 'solicitudes.update',
                'agenda.read', 'agenda.update',
                'control.read', 'control.update'
            ]
        },
        {
            nombre: 'Mantenedor',
            descripcion: 'Gestiona empresas y productos',
            permisos: [
                'empresa.read', 'empresa.create', 'empresa.update', 'empresa.delete',
                'productos.read', 'productos.create', 'productos.update', 'productos.delete'
            ]
        },
        {
            nombre: 'Consulta',
            descripcion: 'Solo lectura en módulos básicos',
            permisos: [
                'cotizaciones.read',
                'agenda.read'
            ]
        }
    ]

    // 5. Crea roles y asigna permisos
    for (const r of roles) {
        const rol = await prisma.rol.create({
            data: {
                nombre: r.nombre,
                descripcion: r.descripcion
            }
        })
        for (const permName of r.permisos) {
            await prisma.rolPermiso.create({
                data: {
                    rolId: rol.id,
                    permissionId: permisosDb[permName].id
                }
            })
        }
    }
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
