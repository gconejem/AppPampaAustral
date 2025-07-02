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
    const contacts = await prisma.contacto.findMany({
      include: {
        clientesContactos: {
          include: {
            cliente: true
          }
        }
      }
    })

    return contacts
  } catch (error) {
    console.error('Error fetching contacts:', error)

    return []
  }
}

const ContactListApp = async ({ params }: Props) => {
  return <ContactList />
}

export default ContactListApp
