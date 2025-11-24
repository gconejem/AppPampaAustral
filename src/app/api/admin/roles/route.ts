import { NextResponse } from 'next/server'

export async function GET() {
    const roles = ['ADMIN', 'VIEWER', 'ENCODER', 'SUPERVISOR']
    console.log('🔐 [API] GET roles:', roles)
    return NextResponse.json(roles)
}
