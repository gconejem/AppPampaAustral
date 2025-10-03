import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Función helper para parsear fechas que vienen del frontend
    const parseLocalDate = (dateString: string) => {
      // La fecha viene ya ajustada desde el frontend para compensar la zona horaria
      return new Date(dateString)
    }

    const agenda = await prisma.agenda.create({
      data: {
        titulo: data.titulo,
        tipoVisita: data.tipoVisita,
        esRecurrente: data.esRecurrente,
        fechaInicio: parseLocalDate(data.fechaInicio),
        fechaFin: parseLocalDate(data.fechaFin),
        clienteId: data.clienteId,
        obraId: data.obraId,
        solicitudId: data.solicitudId,
        sectorComercial: data.sectorComercial || '',
        region: data.region || '',
        comuna: data.comuna || '',
        direccion: data.direccion || '',
        referencia: data.referencia || '',
        georreferencia: data.georreferencia || '',
        observaciones: data.observaciones,
        estado: data.estado || 'CREADA',

        // Crear servicios relacionados
        servicios: {
          create: data.servicios.map((servicio: any) => ({
            codigo: servicio.codigo,
            servicio: servicio.servicio,
            cantidad: servicio.cantidad,
            observacion: servicio.observacion,
            esSegundaVisita: servicio.esSegundaVisita
          }))
        },

        // Crear asignaciones de laboratoristas
        asignados: {
          create: data.laboratoristas.map((lab: any) => ({
            userId: lab.id,
            esPrincipal: false
          }))
        },

        // Crear asignaciones de equipos
        equipos: {
          create: data.equipos.map((equipo: any) => ({
            equipoId: equipo.id,
            cantidad: 1
          }))
        },

        // Crear contactos relacionados
        contactos: {
          create: data.contactos.map((contacto: any) => ({
            nombre: contacto.nombre,
            rol: contacto.rol,
            email: contacto.email,
            telefono1: contacto.telefono1,
            telefono2: contacto.telefono2,
            isPrincipal: contacto.isPrincipal
          }))
        }
      }
    })

    return NextResponse.json(agenda)
  } catch (error) {
    console.error('Error al crear agenda:', error)

    return NextResponse.json({ error: 'Error al crear la agenda' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')
    const clienteId = searchParams.get('clienteId')
    const obraIds = searchParams.get('obraIds')
    const obraId = searchParams.get('obraId')
    const laboratoristaIds = searchParams.get('laboratoristaIds')
    const sectoresComerciales = searchParams.get('sectoresComerciales')
    const regiones = searchParams.get('regiones')
    const comunas = searchParams.get('comunas')
    const tiposEvento = searchParams.get('tiposEvento')
    // Nuevos parámetros para filtros adicionales
    const estado = searchParams.get('estado')
    const laboratorista = searchParams.get('laboratorista')
    const porRecibir = searchParams.get('porRecibir')


    // Construir el filtro base
    const whereFilter: any = {}

    console.log('Query params:', {
      fechaInicio,
      fechaFin,
      clienteId,
      obraIds,
      obraId,
      laboratoristaIds,
      sectoresComerciales,
      regiones,
      comunas,
      tiposEvento,
      estado,
      laboratorista,
      porRecibir
    })

    // Filtro de fechas
    if (fechaInicio && fechaFin) {
      const startDate = new Date(fechaInicio + 'T00:00:00.000Z')
      const endDate = new Date(fechaFin + 'T23:59:59.999Z')

      console.log('Date range filter:', { startDate, endDate })

      whereFilter.fechaInicio = {
        gte: startDate,
        lte: endDate
      }
    } else if (fechaInicio) {
      const startDate = new Date(fechaInicio + 'T00:00:00.000Z')
      console.log('Start date filter:', { startDate })
      whereFilter.fechaInicio = {
        gte: startDate
      }
    } else if (fechaFin) {
      const endDate = new Date(fechaFin + 'T23:59:59.999Z')
      console.log('End date filter:', { endDate })
      whereFilter.fechaInicio = {
        lte: endDate
      }
    }

    // Filtro por cliente
    if (clienteId) {
      whereFilter.clienteId = parseInt(clienteId)
    }

    // Filtro por obras (múltiples)
    if (obraIds) {
      const obraIdsArray = obraIds.split(',').map(id => parseInt(id))
      whereFilter.obraId = {
        in: obraIdsArray
      }
    }

    // Filtro por obra (una sola)
    if (obraId && !obraIds) {
      whereFilter.obraId = parseInt(obraId)
    }

    // Filtro por sectores comerciales
    if (sectoresComerciales) {
      const sectoresArray = sectoresComerciales.split(',')
      whereFilter.sectorComercial = {
        in: sectoresArray
      }
    }

    // Filtro por regiones
    if (regiones) {
      const regionesArray = regiones.split(',')
      whereFilter.region = {
        in: regionesArray
      }
    }

    // Filtro por comunas
    if (comunas) {
      const comunasArray = comunas.split(',')
      whereFilter.comuna = {
        in: comunasArray
      }
    }

    // Filtro por tipo de evento
    if (tiposEvento) {
      const tiposArray = tiposEvento.split(',')
      // Para campos booleanos, solo podemos usar equals, no in
      // Si hay múltiples tipos seleccionados, no aplicamos filtro (mostrar todos)
      if (tiposArray.length === 1) {
        const tipo = tiposArray[0]
        if (tipo === 'Evento') {
          whereFilter.esRecurrente = false
        } else if (tipo === 'Recurrente') {
          whereFilter.esRecurrente = true
        }
      }
      // Si hay múltiples tipos seleccionados, no aplicamos filtro (mostrar todos)
    }

    // Filtro por estado (puede ser múltiple, separado por comas)
    if (estado) {
      const estadosArray = estado.split(',').map(e => e.trim()).filter(e => e.length > 0)
      if (estadosArray.length === 1) {
        whereFilter.estado = estadosArray[0]
      } else if (estadosArray.length > 1) {
        whereFilter.estado = {
          in: estadosArray
        }
      }
    }

    // Nota: El filtro de búsqueda global se maneja en el frontend

    console.log('Final whereFilter:', whereFilter)

    const agendas = await prisma.agenda.findMany({
      where: whereFilter,
      include: {
        cliente: true,
        servicios: true,
        asignados: {
          include: {
            user: {
              include: {
                roles: {
                  include: {
                    rol: true
                  }
                }
              }
            }
          }
        },
        equipos: {
          include: {
            equipo: true
          }
        },
        obra: true,
        contactos: true
      },
      orderBy: {
        fechaInicio: 'asc'
      }
    })

    // Filtrar por laboratoristas si se especifica (esto se hace en memoria porque requiere join complejo)
    let filteredAgendas = agendas

    // Filtrar por IDs de laboratoristas
    if (laboratoristaIds) {
      const laboratoristaIdsArray = laboratoristaIds.split(',')
      console.log('Filtrando por laboratoristas IDs:', laboratoristaIdsArray)
      filteredAgendas = filteredAgendas.filter(agenda => {
        const agendaLaboratoristaIds = agenda.asignados.map(asignado => asignado.user.id)
        console.log('Agenda laboratoristas:', agendaLaboratoristaIds)
        const hasMatch = agendaLaboratoristaIds.some(id =>
          laboratoristaIdsArray.includes(String(id))
        )
        console.log('Tiene coincidencia:', hasMatch)
        return hasMatch
      })
    }

    // Filtrar por nombre de laboratorista
    if (laboratorista) {
      console.log('Filtrando por nombre de laboratorista:', laboratorista)
      filteredAgendas = filteredAgendas.filter(agenda => {
        return agenda.asignados.some(asignado =>
          asignado.user?.name?.toLowerCase().includes(laboratorista.toLowerCase())
        )
      })
    }

    // Filtrar por "Por Recibir" (visitas con estado COMPLETADA o EN_REVISION)
    if (porRecibir === 'true') {
      console.log('Filtrando por visitas por recibir (COMPLETADA o EN_REVISION)')
      filteredAgendas = filteredAgendas.filter(agenda => {
        // Verificar si la agenda tiene estado COMPLETADA o EN_REVISION
        return agenda.estado === 'COMPLETADA' || agenda.estado === 'EN_REVISION'
      })
    }

    return NextResponse.json(filteredAgendas)
  } catch (error) {
    console.error('Error al obtener agendas:', error)

    return NextResponse.json({ error: 'Error al obtener las agendas' }, { status: 500 })
  }
}
