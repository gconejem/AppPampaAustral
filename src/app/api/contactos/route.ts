import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Obtener todos los contactos
export async function GET() {
  try {
    const contacts = await prisma.contacto.findMany({
      orderBy: {
        contactId: 'desc'
      }
    })
    
    return NextResponse.json(contacts)
  } catch (error) {
    return NextResponse.json({ error: 'Error getting contacts' }, { status: 500 })
  }
}

// POST - Crear un nuevo contacto
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const contact = await prisma.contacto.create({
      data: body
    })
    
    return NextResponse.json(contact)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating contact' }, { status: 500 })
  }
} 
