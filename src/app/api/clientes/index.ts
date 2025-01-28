import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// Crear un cliente
export const createCliente = async (data: Prisma.ClienteCreateInput) => {
  try {
    console.log('Datos recibidos:', JSON.stringify(data, null, 2))

    // Validar datos requeridos
    if (!data.rut || !data.razonSocial || !data.nombreCliente) {
      throw new Error('Faltan campos requeridos')
    }

    // Verificar si ya existe un cliente con ese RUT
    const clienteExistente = await prisma.cliente.findUnique({
      where: { rut: data.rut }
    })

    if (clienteExistente) {
      throw new Error(`Ya existe un cliente con el RUT ${data.rut}`)
    }

    // Preparar los datos del cliente
    const clienteData = {
      rut: data.rut,
      estado: data.estado || 'active',
      razonSocial: data.razonSocial,
      nombreCliente: data.nombreCliente,
      pais: data.pais,
      region: String(data.region),
      comuna: String(data.comuna),
      ciudad: data.ciudad || 'Santiago',
      direccion: data.direccion,
      telefono: data.telefono,
      sitioWeb: data.sitioWeb || '',
      segmento: data.segmento,
      industria: data.industria,
      fechaCreacion: data.fechaCreacion || new Date(),
      updatedAt: new Date(),
      createdAt: new Date()
    }

    // Crear el cliente primero
    const cliente = await prisma.cliente.create({
      data: clienteData
    })

    // Crear los contactos si existen
    if (data.clientesContactos?.create) {
      for (const contactoData of data.clientesContactos.create) {
        try {
          // Crear el contacto primero
          const contacto = await prisma.contacto.create({
            data: {
              nombre: contactoData.contacto.create.nombre,
              cargo: contactoData.contacto.create.cargo,
              email: contactoData.contacto.create.email,
              telefono1: contactoData.contacto.create.telefono1,
              telefono2: contactoData.contacto.create.telefono2 || '',
              updatedAt: new Date()
            }
          })

          // Crear la relación ClienteContacto usando create simple
          await prisma.clienteContacto.create({
            data: {
              isPrincipal: contactoData.isPrincipal,
              Cliente: {
                connect: {
                  clienteId: cliente.clienteId
                }
              },
              Contacto: {
                connect: {
                  contactId: contacto.contactId
                }
              }
            }
          })
        } catch (error) {
          console.error('Error al crear contacto o relación:', error)
        }
      }
    }

    // Crear la condición comercial si existe
    if (data.condicionesComerciales?.create) {
      try {
        await prisma.condicionComercial.create({
          data: {
            vendedor: data.condicionesComerciales.create.vendedor,
            condicionVenta: data.condicionesComerciales.create.condicionVenta,
            observaciones: data.condicionesComerciales.create.observaciones || '',
            Cliente: {
              connect: {
                clienteId: cliente.clienteId
              }
            }
          }
        })
      } catch (error) {
        console.error('Error al crear condición comercial:', error)
      }
    }

    // Retornar el cliente con todas sus relaciones
    const clienteCreado = await prisma.cliente.findUnique({
      where: { clienteId: cliente.clienteId },
      include: {
        ClienteContacto: {
          include: {
            Contacto: true
          }
        },
        CondicionComercial: true
      }
    })

    if (!clienteCreado) {
      throw new Error('Error al crear el cliente')
    }

    return clienteCreado
  } catch (error) {
    console.error('Error detallado al crear cliente:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        throw new Error(`Ya existe un cliente con el RUT ${data.rut}`)
      }
    }

    throw error
  }
}

// Obtener todos los clientes
export const getClientes = async () => {
  return prisma.cliente.findMany({
    include: {
      ClienteContacto: {
        include: {
          contacto: true
        }
      },
      CondicionComercial: true
    }
  })
}

// Obtener un cliente por ID
export const getClienteById = async (id: number) => {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      ClienteContacto: {
        include: {
          contacto: true
        }
      },
      CondicionComercial: true
    }
  })
}

// Actualizar un cliente
export const updateCliente = async (id: number, data: Prisma.ClienteUpdateInput) => {
  return prisma.cliente.update({
    where: { id },
    data,
    include: {
      ClienteContacto: {
        include: {
          contacto: true
        }
      },
      CondicionComercial: true
    }
  })
}

// Eliminar un cliente
export const deleteCliente = async (id: number) => {
  // Iniciamos una transacción para asegurar que todo se ejecute o nada
  return prisma.$transaction(async (tx: typeof prisma) => {
    try {
      // 1. Eliminamos los contactos asociados
      await tx.clienteContacto.deleteMany({
        where: { clienteId: id }
      })

      // 2. Eliminamos las condiciones comerciales
      await tx.condicionComercial.deleteMany({
        where: { clienteId: id }
      })

      // 3. Finalmente eliminamos el cliente usando clienteId
      return tx.cliente.delete({
        where: { clienteId: id }
      })
    } catch (error) {
      console.error('Error en la transacción de eliminación:', error)
      throw error
    }
  })
}
