import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
    const filePath = path.join(process.cwd(), 'public', 'informes', 'Informe_Densidad.pdf')
    try {
        const buffer = await fs.promises.readFile(filePath)
        return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } })
    } catch {
        return new NextResponse(JSON.stringify({ error: 'PDF not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
}
