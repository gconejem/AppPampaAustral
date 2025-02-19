// Component Imports
import ContactList from '@/views/apps/contacts/list'

// Data Imports
import { prisma } from '@/lib/prisma'

interface Props {
  params: {
    lang: string
  }
}

const getContactData = async () => {
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

    return contactos
  } catch (error) {
    console.error('Error fetching contacts:', error)

    return []
  }
}

const ContactListApp = async ({ params: { lang } }: Props) => {
  // Vars
  const data = await getContactData()

  return <ContactList contactData={data} />
}

export default ContactListApp
