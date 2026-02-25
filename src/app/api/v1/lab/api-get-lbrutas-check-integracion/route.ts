import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const ALLOWED_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost'
])

function corsHeaders(origin?: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : null
  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: corsHeaders(request.headers.get('origin')) })
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get('origin')
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

    const mapAgendaEstadoToAppEstado = (raw?: string | null): string => {
      const value = String(raw ?? '').trim().toUpperCase()
      if (!value) return 'P'

      // Si ya viene como código de la app, lo respetamos
      if (value.length === 1) return value

      switch (value) {
        case 'AGENDADA':
        case 'ACORDADA':
          return 'A'
        case 'CREADA':
          return 'P'
        case 'COMPLETADA':
          // En la lista, AppLab considera "terminada" cuando es 'T' (o 'R').
          // Además, no permite iniciar visitas con estado 'T'.
          return 'T'
        case 'RECIBIDA_OK':
        case 'EN_REVISION':
          return 'R'
        case 'SUSPENDIDA':
          return 'S'
        case 'ELIMINADA':
          return 'Z'
        case 'CANCELADA':
          return 'X'
        default:
          return 'P'
      }
    }

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
      // Si no se especifica rango, devolver solo las visitas de HOY.
      // AppLab usa el día local (Chile). Si el servidor corre en UTC, el "hoy" puede correrse
      // y dejar al cliente sin citas. Por eso calculamos el día en America/Santiago.

      const TZ = 'America/Santiago'
      const now = new Date()

      const dtf = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })

      // yyyy-mm-dd (en-CA)
      const ymd = dtf.format(now)
      const parts = ymd.split('-')
      const year = Number(parts[0])
      const month = Number(parts[1])
      const day = Number(parts[2])

      // Rango "naive" en UTC para el mismo YYYY-MM-DD.
      // Esto cubre el caso en que `fechaInicio` se guarda como "hora local" pero sin conversión a UTC
      // (p.ej. 2026-02-25 00:00 se persiste como 2026-02-25T00:00:00Z). En ese escenario,
      // el rango calculado con offset podría dejar fuera las 00:00.
      const startOfDayUtcNoOffset = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
      const endOfDayUtcNoOffset = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

      // Calcula el offset del timezone en minutos usando timeZoneName: shortOffset (Node >= 18)
      const getOffsetMinutes = (date: Date) => {
        const off = new Intl.DateTimeFormat('en-US', {
          timeZone: TZ,
          timeZoneName: 'shortOffset'
        }).format(date)
        const m = off.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/)
        if (!m) return 0
        const hours = Number(m[1])
        const mins = m[2] ? Number(m[2]) : 0
        return hours * 60 + (hours >= 0 ? mins : -mins)
      }

      // Creamos un Date aproximado en UTC para estimar offset de ese día.
      const approx = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      const offsetMinutes = getOffsetMinutes(approx)
      const startOfDayUtc = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60_000)
      const endOfDayUtc = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - offsetMinutes * 60_000)

      console.log('Default date range (Chile):', { ymd, startOfDayUtc, endOfDayUtc, offsetMinutes })
      console.log('Default date range (UTC no offset):', { ymd, startOfDayUtcNoOffset, endOfDayUtcNoOffset })

      // Filtro robusto: incluye ambos rangos para evitar que visitas 00:00 se pierdan
      // por discrepancias de timezone/almacenamiento.
      whereFilter.OR = [
        { fechaInicio: { gte: startOfDayUtc, lte: endOfDayUtc } },
        { fechaInicio: { gte: startOfDayUtcNoOffset, lte: endOfDayUtcNoOffset } }
      ]
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
    // Nota: En BD el estado suele ser textual (AGENDADA/CREADA/COMPLETADA...),
    // pero AppLab históricamente filtra con letras (A/P/T/R/S/Z/X). Soportamos ambos.
    const estadoParam = estado
      ? estado.split(',').map(e => e.trim()).filter(e => e.length > 0)
      : []
    const appEstadoFilter = new Set(
      estadoParam
        .map(e => e.toUpperCase())
        .filter(e => e.length === 1)
    )

    const dbEstadoFilter = estadoParam.filter(e => e.length !== 1)
    if (dbEstadoFilter.length === 1) {
      whereFilter.estado = dbEstadoFilter[0]
    } else if (dbEstadoFilter.length > 1) {
      whereFilter.estado = { in: dbEstadoFilter }
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
      const rawPersona = String(persona)
      const personaNorm = rawPersona.trim().toLowerCase()

      const normalizeRut = (rut?: string | null) =>
        (rut || '').toString().trim().toLowerCase().replace(/[^0-9k]/g, '')

      const personaRutNorm = normalizeRut(rawPersona)

      const beforeCount = filteredAgendas.length
      filteredAgendas = filteredAgendas.filter(agenda =>
        agenda.asignados.some(asignado => {
          const u = asignado.user
          if (!u) return false

          const idMatch = String(u.id) === rawPersona
          const usuarioMatch = (u.usuario || '').toString().trim().toLowerCase() === personaNorm
          const emailMatch = (u.email || '').toString().trim().toLowerCase() === personaNorm
          const nameMatch = (u.name || '').toString().trim().toLowerCase().includes(personaNorm)
          const rutMatch = personaRutNorm.length > 0 && normalizeRut(u.rut) === personaRutNorm

          return idMatch || usuarioMatch || emailMatch || nameMatch || rutMatch
        })
      )

      console.log('Filtro persona[] aplicado:', {
        persona: rawPersona,
        beforeCount,
        afterCount: filteredAgendas.length
      })

      if (beforeCount > 0 && filteredAgendas.length === 0) {
        const sampleAsignados = agendas.slice(0, 5).map(a => ({
          agendaId: a.id,
          asignados: (a.asignados || []).map(x => ({
            id: x.user?.id,
            usuario: x.user?.usuario,
            name: x.user?.name,
            rut: x.user?.rut,
            email: x.user?.email
          }))
        }))
        console.log('WARN: persona[] no matcheó agendas. Sample asignados (max 5 agendas):', sampleAsignados)
      }
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
        return agenda.estado === 'COMPLETADA' || agenda.estado === 'EN_REVISION' || agenda.estado === 'RECIBIDA_OK'
      })
    }

    // Si el cliente pidió estados con letras (AppLab), filtramos por el mapeo.
    if (appEstadoFilter.size > 0) {
      filteredAgendas = filteredAgendas.filter(agenda => appEstadoFilter.has(mapAgendaEstadoToAppEstado(agenda.estado)))
    }

    // Formatear salida para la App Terreno (compatibilidad de claves esperadas)
    const agendasLimitadas = filteredAgendas.map(agenda => {
      const fechaInicioDate = new Date(agenda.fechaInicio)
      const horaInicio = fechaInicioDate.toLocaleTimeString('es-CL', {
        timeZone: 'America/Santiago',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      // Construcción de estructura compatible
      const cliente = agenda.cliente
        ? { RAZON: agenda.cliente.razonSocial ?? '' }
        : { RAZON: '' }

      const direccionAgenda = agenda.direccion ?? ''
      const direccionObra = ((agenda.obra as any)?.direccion ?? '') as string
      const direccionFinal = direccionAgenda || direccionObra || ''

      // La App Terreno muestra `visita.DIRECC` y `visita.ciudad.NOMBRE`.
      // Si el usuario cambió la dirección en Agenda, debe primar sobre la dirección de la Obra.
      const ciudad = { NOMBRE: (agenda.comuna ?? (agenda.obra as any)?.comuna ?? '') }

      // Obtener contacto principal (solicitante)
      const contactoPrincipal = agenda.contactos?.find(c => c.isPrincipal)
      const solicitanteNombre = contactoPrincipal?.nombre ?? ''
      const solicitanteTelefono = contactoPrincipal?.telefono1 ?? ''

      // Construir ENSAYO y OBSERV desde servicios
      const ensayo = agenda.servicios?.map(s => s.servicio).join(', ') || ''
      // OBSERV en AppLab corresponde a la observación general de la visita (Agenda), no a la observación por SKU.
      // La observación por servicio se envía en `servicios[].observacion`.
      const observ = (agenda.observaciones ?? '').toString()

      return {
        // Claves usadas por la app móvil
        CLAVE: agenda.id, // id de la agenda como clave
        OBRA: (agenda.obra as any)?.numeroObra ?? null,
        DIRECC: direccionFinal,
        HORA: horaInicio,
        ESTADO: mapAgendaEstadoToAppEstado((agenda as any)?.estado),
        cliente,
        ciudad,

        // Campos esperados por la app móvil para solicitante
        SOL_NOM: solicitanteNombre,
        SOL_FON: solicitanteTelefono,

        // Campos esperados para observaciones de servicio
        ENSAYO: ensayo,
        OBSERV: observ,

        // Datos adicionales (no imprescindibles para el flujo actual)
        servicios: agenda.servicios?.map(s => ({
          codigo: s.codigo,
          servicio: s.servicio,
          cantidad: s.cantidad,
          observacion: s.observacion ?? ''
        })) || [],
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

    // Debug acotado para validar incidencia QA: dirección tomada de Obra vs Visita (Agenda)
    try {
      const sample = filteredAgendas.slice(0, 5).map(a => ({
        agendaId: a.id,
        obraNumero: (a.obra as any)?.numeroObra ?? null,
        direccionAgenda: a.direccion ?? null,
        direccionObra: (a.obra as any)?.direccion ?? null,
        direccionEnviada: (a.direccion ?? (a.obra as any)?.direccion ?? null)
      }))
      console.log('Sample direcciones (primeras 5):', JSON.stringify(sample, null, 2))
    } catch (e) {
      console.warn('No se pudo loguear sample direcciones', e)
    }

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

    return NextResponse.json({ data: agendasLimitadas }, { headers: corsHeaders(origin) })
  } catch (error) {
    console.error('Error en api-get-lbrutas-check-integracion:', error)
    return NextResponse.json({ error: 'Error al obtener agendas' }, { status: 500, headers: corsHeaders(request.headers.get('origin')) })
  }
}
