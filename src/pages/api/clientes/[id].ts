import prisma from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handleClientById(req: NextApiRequest, res: NextApiResponse) {
  // Obtener el ID desde query params
  const id = req.query.id as string
  const clientId = Number(id)

  try {
    switch (req.method) {
      case 'GET':
        const client = await prisma.cliente.findUnique({
          where: { id: clientId },
          include: { contactos: true }
        })
        
        if (!client) {
          return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        
        return res.status(200).json(client)

      case 'PUT':
        const { contacts, ...updateData } = req.body
        
        const updatedClient = await prisma.cliente.update({
          where: { id: clientId },
          data: {
            ...updateData,
            contacts: {
              deleteMany: {},
              create: contacts
            }
          },
          include: { contactos: true }
        })
        
        return res.status(200).json(updatedClient)

      case 'DELETE':
        await prisma.cliente.delete({
          where: { id: clientId }
        })
        
        return res.status(204).end()

      default:
        return res.status(405).json({ error: 'Método no permitido' })
    }
    
  } catch (error) {
    console.error('Error en API:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}
