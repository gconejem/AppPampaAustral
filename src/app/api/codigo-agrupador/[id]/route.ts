import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

const mergeLinkedRcms = (agrupador: any) => {
    if (!agrupador) return agrupador

    const linkedRcms = Array.isArray(agrupador.rcmLinks)
        ? agrupador.rcmLinks.map((link: any) => link.rcm).filter(Boolean)
        : []
    const sourceRcms = linkedRcms.length > 0 ? linkedRcms : (agrupador.rcms ?? [])

    const rcmsById = new Map<number, any>()
    for (const rcm of sourceRcms) rcmsById.set(rcm.id, rcm)

    const rest = { ...agrupador }
    delete rest.rcmLinks

    return {
        ...rest,
        rcms: Array.from(rcmsById.values()).sort((a, b) => {
            const aNum = Number(a.numeroRcm)
            const bNum = Number(b.numeroRcm)
            if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum
            return Number(a.id) - Number(b.id)
        }),
    }
}

export async function GET(request: Request, { params }: Params) {
    const { id } = params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const url = new URL(request.url)
    const view = String(url.searchParams.get('view') ?? '').trim().toLowerCase()
    const isSkusView = view === 'skus' || view === 'informe' || view === 'informes'
    const isDialogView = view === 'dialog' || view === 'popup' || view === 'lite'

    const agrupador = await prisma.codigoAgrupador.findUnique({
        where: { id: agrupadorId },
        select: isSkusView
            ? {
                id: true,
                codigoNombre: true,
                descripcionServicio: true,
                notasInternas: true,
                ordenTrabajo: { select: { clave: true, correlativ: true } },
                ensayos: {
                    select: {
                        sku: true,
                        nombre: true,
                        producto: {
                            select: {
                                sku: true,
                                nombre: true,
                                esPaquete: true,
                                productosEnPaquete: {
                                    select: {
                                        cantidad: true,
                                        producto: {
                                            select: {
                                                sku: true,
                                                nombre: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            : isDialogView
                ? {
                    id: true,
                    codigoNombre: true,
                    descripcionServicio: true,
                    notasInternas: true,
                    ordenTrabajo: { select: { clave: true, correlativ: true } },
                    ensayos: {
                        select: {
                            sku: true,
                            nombre: true,
                            producto: {
                                select: {
                                    sku: true,
                                    nombre: true,
                                    esPaquete: true,
                                    productosEnPaquete: {
                                        select: {
                                            cantidad: true,
                                            producto: {
                                                select: {
                                                    sku: true,
                                                    nombre: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    rcms: {
                        orderBy: { numeroRcm: 'asc' },
                        select: {
                            id: true,
                            servicios: {
                                select: {
                                    codigo: true,
                                    cantidad: true,
                                    subProductos: {
                                        select: {
                                            sku: true,
                                            nombre: true,
                                            cantidad: true
                                        }
                                    }
                                }
                            },
                            RCMHistory: {
                                orderBy: { createdAt: 'desc' },
                                take: 1,
                                select: {
                                    tipo: true,
                                    tipoEstado: true,
                                    motivo: true,
                                    observacion: true,
                                    createdAt: true,
                                    fechaAccion: true,
                                    estNuevo: true
                                }
                            }
                        }
                    },
                    rcmLinks: {
                        select: {
                            rcm: {
                                select: {
                                    id: true,
                                    servicios: {
                                        select: {
                                            codigo: true,
                                            cantidad: true,
                                            subProductos: {
                                                select: {
                                                    sku: true,
                                                    nombre: true,
                                                    cantidad: true
                                                }
                                            }
                                        }
                                    },
                                    RCMHistory: {
                                        orderBy: { createdAt: 'desc' },
                                        take: 1,
                                        select: {
                                            tipo: true,
                                            tipoEstado: true,
                                            motivo: true,
                                            observacion: true,
                                            createdAt: true,
                                            fechaAccion: true,
                                            estNuevo: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                : {
                    id: true,
                    codigoNombre: true,
                    descripcionServicio: true,
                    notasInternas: true,
                    ordenTrabajo: {
                        select: {
                            clave: true,
                            correlativ: true,
                        },
                    },
                    ensayos: {
                        include: { producto: true },
                    },
                    rcms: {
                        orderBy: { numeroRcm: 'asc' },
                        select: {
                            id: true,
                            numeroRcm: true,
                            fechaMuestreo: true,
                            fechaServicio: true,
                            numeroTarjeta: true,
                            rcmType: true,
                            estadoOperativo: true,
                            estadoAdministrativo: true,
                            sede: true,
                            vencimiento: true,
                            cantidadMuestras: true,
                            cliente: {
                                select: {
                                    razonSocial: true,
                                    nombreCliente: true
                                }
                            },
                            obra: {
                                select: {
                                    numeroObra: true,
                                    nombreObra: true,
                                    comuna: true
                                }
                            },
                            tipoMaterial: true,
                            item: true,
                            tomaMuestra: true,
                            procedencia: true,
                            ubicacionSector: true,
                            area: { select: { nombre: true } },
                            familia: { select: { nombre: true } },
                            servicios: {
                                select: {
                                    cantidad: true,
                                    estadoOperativo: true,
                                    estado: true,
                                    codigo: true,
                                    nombre: true,
                                },
                            },
                            muestras: {
                                orderBy: { id: 'asc' },
                                take: 1,
                                select: {
                                    tipoMaterial: true,
                                    item: true,
                                },
                            },
                            RCMHistory: {
                                orderBy: { createdAt: 'desc' },
                                take: 20,
                                select: {
                                    tipo: true,
                                    tipoEstado: true,
                                    estNuevo: true,
                                    motivo: true,
                                    observacion: true,
                                    createdAt: true,
                                    fechaAccion: true,
                                },
                            },
                        },
                    },
                    rcmLinks: {
                        select: {
                            rcm: {
                                select: {
                                    id: true,
                                    numeroRcm: true,
                                    fechaMuestreo: true,
                                    fechaServicio: true,
                                    numeroTarjeta: true,
                                    rcmType: true,
                                    estadoOperativo: true,
                                    estadoAdministrativo: true,
                                    sede: true,
                                    vencimiento: true,
                                    cantidadMuestras: true,
                                    cliente: {
                                        select: {
                                            razonSocial: true,
                                            nombreCliente: true
                                        }
                                    },
                                    obra: {
                                        select: {
                                            numeroObra: true,
                                            nombreObra: true,
                                            comuna: true
                                        }
                                    },
                                    tipoMaterial: true,
                                    item: true,
                                    tomaMuestra: true,
                                    procedencia: true,
                                    ubicacionSector: true,
                                    area: { select: { nombre: true } },
                                    familia: { select: { nombre: true } },
                                    servicios: {
                                        select: {
                                            cantidad: true,
                                            estadoOperativo: true,
                                            estado: true,
                                            codigo: true,
                                            nombre: true,
                                        },
                                    },
                                    muestras: {
                                        orderBy: { id: 'asc' },
                                        take: 1,
                                        select: {
                                            tipoMaterial: true,
                                            item: true,
                                        },
                                    },
                                    RCMHistory: {
                                        orderBy: { createdAt: 'desc' },
                                        take: 20,
                                        select: {
                                            tipo: true,
                                            tipoEstado: true,
                                            estNuevo: true,
                                            motivo: true,
                                            observacion: true,
                                            createdAt: true,
                                            fechaAccion: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
    })

    if (!agrupador) return NextResponse.json({ error: 'Agrupador no encontrado' }, { status: 404 })
    return NextResponse.json(mergeLinkedRcms(agrupador))
}

export async function PUT(request: Request, { params }: Params) {
    const { id } = params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    try {
        const body = await request.json()
        const { codigoNombre, descripcionServicio, notasInternas, cantidad, unidad, facturacion, ensayos, rcmIds } = body

        // Recreate ensayos if provided
        if (ensayos !== undefined) {
            await prisma.codigoAgrupadorEnsayo.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
        }

        const skus: string[] = (ensayos ?? []).map((e: { sku: string }) => e.sku)
        const productosMap: Record<string, number> = {}
        if (skus.length > 0) {
            const productos = await prisma.producto.findMany({
                where: { sku: { in: skus } },
                select: { productoId: true, sku: true },
            })
            for (const p of productos) productosMap[p.sku] = p.productoId
        }

        const agrupador = await prisma.$transaction(async tx => {
            if (rcmIds !== undefined) {
                const uniqueRcmIds = Array.from(new Set((rcmIds as number[]).map(id => Number(id)).filter(Number.isFinite)))
                await tx.codigoAgrupadorRcm.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
                if (uniqueRcmIds.length > 0) {
                    await tx.codigoAgrupadorRcm.createMany({
                        data: uniqueRcmIds.map(rcmId => ({ codigoAgrupadorId: agrupadorId, rcmId })),
                        skipDuplicates: true,
                    })
                    await tx.rCM.updateMany({
                        where: {
                            id: { in: uniqueRcmIds },
                            codigoAgrupadorId: null,
                        },
                        data: { codigoAgrupadorId: agrupadorId },
                    })
                }
            }

            return tx.codigoAgrupador.update({
                where: { id: agrupadorId },
                data: {
                    ...(codigoNombre !== undefined && { codigoNombre }),
                    ...(descripcionServicio !== undefined && { descripcionServicio }),
                    ...(notasInternas !== undefined && { notasInternas }),
                    ...(cantidad !== undefined && { cantidad }),
                    ...(unidad !== undefined && { unidad }),
                    ...(facturacion !== undefined && { facturacion }),
                    ...(ensayos !== undefined && {
                        ensayos: {
                            create: ensayos
                                .filter((e: { sku: string }) => productosMap[e.sku] !== undefined)
                                .map((e: { sku: string; nombre: string }) => ({
                                    sku: e.sku,
                                    nombre: e.nombre,
                                    producto: { connect: { productoId: productosMap[e.sku] } },
                                })),
                        },
                    }),
                },
                include: {
                    ensayos: { include: { producto: true } },
                    rcms: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true } },
                    rcmLinks: { include: { rcm: { select: { id: true, numeroRcm: true, rcmType: true, numeroTarjeta: true } } } },
                },
            })
        })

        return NextResponse.json(mergeLinkedRcms(agrupador))
    } catch (error) {
        console.error('Error al actualizar agrupador:', error)
        return NextResponse.json(
            { error: 'Error al actualizar el agrupador', message: error instanceof Error ? error.message : 'Error desconocido' },
            { status: 500 }
        )
    }
}

export async function DELETE(_request: Request, { params }: Params) {
    const { id } = params
    const agrupadorId = parseInt(id)
    if (isNaN(agrupadorId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    try {
        // Desvincular RCMs antes de eliminar
        await prisma.codigoAgrupadorRcm.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
        await prisma.rCM.updateMany({
            where: { codigoAgrupadorId: agrupadorId },
            data: { codigoAgrupadorId: null },
        })
        await prisma.codigoAgrupadorEnsayo.deleteMany({ where: { codigoAgrupadorId: agrupadorId } })
        await prisma.codigoAgrupador.delete({ where: { id: agrupadorId } })

        return NextResponse.json({ message: 'Agrupador eliminado' })
    } catch (error) {
        console.error('Error al eliminar agrupador:', error)
        return NextResponse.json({ error: 'Error al eliminar el agrupador' }, { status: 500 })
    }
}
