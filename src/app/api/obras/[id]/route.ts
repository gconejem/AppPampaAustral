export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    console.log('ID de obra solicitada:', params.id)

    const obra = await prisma.obra.findUnique({
      where: {
        obraId: Number(params.id)
      },
      select: {
        obraId: true,
        fechaCreacion: true,
        numeroObra: true,
        fechaIngreso: true,
        estado: true,
        estadoObra: true,
        nombreObra: true,
        direccion: true,
        region: true,
        comuna: true,
        telefono: true,
        sitioWeb: true,

        // Datos del mandante
        informeMandante: true,
        textoMandante: true,

        // Requisitos
        acreditacionPersonal: true,
        especificacionesTecnicas: true,
        acreditacionEquipos: true,
        cartaCompromiso: true,
        mandatoServiu: true,
        otrosRequisitos: true,

        // Facturación
        razonSocial: true,
        rut: true,
        giro: true,
        direccionComercial: true,
        comunaFacturacion: true,
        telefonoFacturacion: true,
        listaPrecios: true,
        mailRecepcionFactura: true,

        // Referencias
        estadoPago: true,
        hes: true,
        oc: true,
        otrasReferencias: true,

        // Relaciones
        contactos: {
          select: {
            id: true,
            nombre: true,
            cargo: true,
            email: true,
            telefono1: true,
            telefono2: true,
            isPrincipal: true
          }
        }
      }
    })

    console.log('Datos completos obtenidos de la BD:', obra)

    if (!obra) {
      return new Response(JSON.stringify({ error: 'Obra no encontrada' }), {
        status: 404
      })
    }

    return new Response(JSON.stringify(obra))
  } catch (error) {
    console.error('Error completo:', error)

    return new Response(JSON.stringify({ error: 'Error al obtener la obra' }), {
      status: 500
    })
  }
}
