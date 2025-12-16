import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verificarContactos() {
  try {
    const contactos = await prisma.contactoAgenda.findMany({ 
      take: 10,
      select: {
        contactId: true,
        email: true,
        nombre: true
      }
    })
    
    console.log('Primeros 10 contactos en la base de datos:')
    contactos.forEach(c => {
      console.log(`ID: ${c.contactId}, Email: "${c.email}", Nombre: "${c.nombre}"`)
    })
    
    // Buscar un email específico del Excel
    const emailBuscar = 'rodrigomedinadonnay@gmail.com'
    console.log(`\nBuscando email: "${emailBuscar}"`)
    
    const contactoEspecifico = await prisma.contactoAgenda.findFirst({
      where: { email: emailBuscar }
    })
    
    if (contactoEspecifico) {
      console.log('✓ Contacto encontrado:', contactoEspecifico)
    } else {
      console.log('✗ Contacto NO encontrado')
      
      // Buscar emails similares
      const similares = await prisma.contactoAgenda.findMany({
        where: {
          email: {
            contains: 'rodrigomedina'
          }
        },
        take: 5
      })
      console.log('Emails similares encontrados:', similares.length)
      similares.forEach(s => console.log(`  - "${s.email}"`))
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verificarContactos()
