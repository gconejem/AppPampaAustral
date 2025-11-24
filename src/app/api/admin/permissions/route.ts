import { NextResponse } from 'next/server'

export async function GET() {
    const permissions = [
        'users.read', 'users.write', 'users.delete',
        'roles.read', 'roles.write'
    ]
    console.log('🔐 [API] GET permisos:', permissions)
    return NextResponse.json(permissions)
}
