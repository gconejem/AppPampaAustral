import { NextResponse } from 'next/server'

export async function GET() {
    const users = [
        { id: '1', name: 'Admin', email: 'admin@pampaustral.com', roles: ['ADMIN'], permissions: ['users.read', 'users.write'] },
        { id: '2', name: 'Viewer', email: 'viewer@pampaustral.com', roles: ['VIEWER'], permissions: ['users.read'] }
    ]
    console.log('🔐 [API] GET usuarios:', users)
    return NextResponse.json(users)
}
