// Component Imports
import ContactList from '@/views/apps/contacts/list'

// Data Imports
import { prisma } from '@/lib/prisma'

interface Props {
  params: {
    lang: string
  }
}

async function getContactData() {
  try {
    const contactos = await prisma.contacto.findMany({
      include: {
        clientesContactos: {
          include: {
            cliente: true
          }
        }
      }
    })

    // Mapear los datos de Prisma al tipo esperado
    return contactos.map(contacto => ({
      contactId: contacto.contactId,
      nombre: contacto.nombre,
      cargo: contacto.cargo || undefined,
      email: contacto.email,
      telefono1: contacto.telefono1,
      telefono2: contacto.telefono2 || undefined,
      comuna: contacto.comuna || undefined,
      direccion: contacto.direccion || undefined,
      empresa: contacto.empresa || undefined,
      estado: contacto.estado as 'ACTIVO' | 'INACTIVO',
      createdAt: contacto.createdAt.toISOString(),
      updatedAt: contacto.updatedAt.toISOString(),
      rol: 'CONTACTO' // Valor por defecto o mapear según tu lógica
    }))
  } catch (error) {
    console.error('Error fetching contacts:', error)

    return []
  }
}

const ContactListApp = async ({ params }: Props) => {
  const data = await getContactData()

  return <ContactList contactData={data} />
}

export default ContactListApp
