import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    const filePath = path.join(process.cwd(), 'public', 'informes', 'Informe_Hormigon.pdf')
    try {
        const buffer = await fs.promises.readFile(filePath)
        return new NextResponse(buffer, {
            headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename=Informe_Hormigon.pdf' }
        })
    } catch (err) {
        return new NextResponse(JSON.stringify({ error: 'mock PDF not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
}
