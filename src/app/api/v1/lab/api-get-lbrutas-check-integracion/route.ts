import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
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
    const estado = searchParams.get('estado')
    const laboratorista = searchParams.get('laboratorista')
    const porRecibir = searchParams.get('porRecibir')
    const persona = searchParams.get('persona[]')
    const sortColumn = searchParams.get('sortColumn') || 'HORA'
    const sortDirection = searchParams.get('sortDirection') || 'ASC'

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
      porRecibir,
      persona,
      sortColumn,
      sortDirection
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
    } else {
      // Si no se especifica rango, devolver solo las visitas de HOY
      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(now)
      endOfDay.setHours(23, 59, 59, 999)
      whereFilter.fechaInicio = {
        gte: startOfDay,
        lte: endOfDay
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
      if (tiposArray.length === 1) {
        const tipo = tiposArray[0]
        if (tipo === 'Evento') {
          whereFilter.esRecurrente = false
        } else if (tipo === 'Recurrente') {
          whereFilter.esRecurrente = true
        }
      }
    }

    // Filtro por estado
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
      orderBy: sortDirection === 'ASC' ? { fechaInicio: 'asc' } : { fechaInicio: 'desc' }
    })

    // Filtrar por laboratoristas si se especifica
    let filteredAgendas = agendas

    // Filtrar por IDs de laboratoristas
    if (laboratoristaIds) {
      const laboratoristaIdsArray = laboratoristaIds.split(',')
      console.log('Filtrando por laboratoristas IDs:', laboratoristaIdsArray)
      filteredAgendas = filteredAgendas.filter(agenda => {
        const agendaLaboratoristaIds = agenda.asignados.map(asignado => asignado.user.id)
        const hasMatch = agendaLaboratoristaIds.some(id =>
          laboratoristaIdsArray.includes(String(id))
        )
        return hasMatch
      })
    }

    // Filtrar por parámetro persona[] si viene en la query (compatibilidad App Terreno)
    if (persona) {
      const personaId = String(persona)
      filteredAgendas = filteredAgendas.filter(agenda =>
        agenda.asignados.some(asignado => String(asignado.user?.id) === personaId)
      )
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

    // Filtrar por "Por Recibir"
    if (porRecibir === 'true') {
      console.log('Filtrando por visitas por recibir (COMPLETADA o EN_REVISION)')
      filteredAgendas = filteredAgendas.filter(agenda => {
        return agenda.estado === 'COMPLETADA' || agenda.estado === 'EN_REVISION'
      })
    }

    // Formatear salida para la App Terreno (compatibilidad de claves esperadas)
    const agendasLimitadas = filteredAgendas.map(agenda => {
      const fechaInicioDate = new Date(agenda.fechaInicio)
      const horaInicio = fechaInicioDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })

      // Construcción de estructura compatible
      const cliente = agenda.cliente
        ? { RAZON: agenda.cliente.razonSocial ?? '' }
        : { RAZON: '' }

      const ciudad = { NOMBRE: (agenda.obra as any)?.comuna ?? '' }

      // Obtener contacto principal (solicitante)
      const contactoPrincipal = agenda.contactos?.find(c => c.isPrincipal)
      const solicitanteNombre = contactoPrincipal?.nombre ?? ''
      const solicitanteTelefono = contactoPrincipal?.telefono1 ?? ''

      // Construir ENSAYO y OBSERV desde servicios
      const ensayo = agenda.servicios?.map(s => s.servicio).join(', ') || ''
      const observ = agenda.servicios?.map(s => s.observacion).filter(Boolean).join(', ') || ''

      return {
        // Claves usadas por la app móvil
        CLAVE: agenda.id, // id de la agenda como clave
        OBRA: (agenda.obra as any)?.numeroObra ?? null,
        DIRECC: (agenda.obra as any)?.direccion ?? '',
        HORA: horaInicio,
        ESTADO: (agenda as any)?.estado ?? 'P',
        cliente,
        ciudad,

        // Campos esperados por la app móvil para solicitante
        SOL_NOM: solicitanteNombre,
        SOL_FON: solicitanteTelefono,

        // Campos esperados para observaciones de servicio
        ENSAYO: ensayo,
        OBSERV: observ,

        // Datos adicionales (no imprescindibles para el flujo actual)
        servicios: agenda.servicios?.map(s => ({ servicio: s.servicio })) || [],
        asignados: agenda.asignados?.map(asignado => ({
          rut: asignado.user?.rut ?? undefined,
          nombre: asignado.user?.name ?? undefined,
          nombreUso: asignado.user?.usuario ?? undefined,
          nombreCom: asignado.user?.name ?? undefined,
          userId: asignado.user?.id,
          roles: asignado.user?.roles?.map(r => r.rol?.nombre).filter(Boolean)
        })) || [],
        equipos: agenda.equipos?.map(eq => ({ codigo: eq.equipo?.codigo })) || []
      }
    })

    console.log(`Total agendas returned: ${agendasLimitadas.length}`, JSON.stringify(agendasLimitadas.map(a => ({ CLAVE: a.CLAVE, OBRA: a.OBRA, HORA: a.HORA, asignados: a.asignados.map(x => x.userId) })), null, 2))

    console.log('=== GET VISITAS BACKEND - ENVIANDO ===');
    console.log('Total agendas:', agendasLimitadas.length);
    if (agendasLimitadas.length > 0) {
      console.log('Primera agenda:', JSON.stringify({
        CLAVE: agendasLimitadas[0].CLAVE,
        OBRA: agendasLimitadas[0].OBRA,
        DIRECC: agendasLimitadas[0].DIRECC,
        cliente: agendasLimitadas[0].cliente,
        SOL_NOM: agendasLimitadas[0].SOL_NOM,
        SOL_FON: agendasLimitadas[0].SOL_FON,
        ENSAYO: agendasLimitadas[0].ENSAYO,
        OBSERV: agendasLimitadas[0].OBSERV,
        servicios: agendasLimitadas[0].servicios?.length || 0
      }, null, 2));
    }

    return NextResponse.json({ data: agendasLimitadas }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Error en api-get-lbrutas-check-integracion:', error)
    return NextResponse.json({ error: 'Error al obtener agendas' }, { status: 500, headers: corsHeaders() })
  }
}
