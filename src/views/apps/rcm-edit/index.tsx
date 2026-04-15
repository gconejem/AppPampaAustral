'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Alert, Box, Card, CardContent, Chip, Grid, Skeleton, Typography, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useRcmForm } from '@views/apps/internalcontrol/hooks/useRcmForm'
import { useEnsayos } from '@views/apps/internalcontrol/hooks/useEnsayos'
import { useProductSearch } from '@views/apps/internalcontrol/hooks/useProductSearch'
import RcmDraftForm from '@views/apps/internalcontrol/components/RcmDraftForm'
import type { EnsayoAsociado, SubmuestraVencimiento } from '@views/apps/internalcontrol/types/rcm-types'

/* ── helpers ────────────────────────────────────────────────────────── */

function isoToDate(iso?: string | null): string {
    if (!iso) return ''
    return new Date(iso).toISOString().split('T')[0]
}

function mapApiToRcmData(data: any) {
    const ensayos: EnsayoAsociado[] = (data.servicios ?? []).map((s: any, idx: number) => ({
        id: s.id ?? idx + 1,
        productoId: s.producto?.productoId ?? 0,
        sku: s.producto?.sku ?? s.codigo ?? '',
        nombre: s.producto?.nombre ?? s.nombre ?? '',
        norma: s.producto?.norma ?? s.norma ?? '',
        cantidad: s.cantidad ?? 1,
        observacion: s.observacion ?? '',
        estadoOperativo: s.estadoOperativo ?? 'CODIFICADO',
        esPaquete: s.esPaquete ?? false,
        subProductos: (s.subProductos ?? []).map((sp: any, spIdx: number) => ({
            id: sp.id ?? spIdx + 1,
            productoId: sp.producto?.productoId ?? 0,
            sku: sp.producto?.sku ?? sp.sku ?? '',
            nombre: sp.producto?.nombre ?? sp.nombre ?? '',
            norma: sp.producto?.norma ?? sp.norma ?? '',
            cantidad: sp.cantidad ?? 1,
            observacion: sp.observacion ?? '',
        })),
    }))

    const probetas = (data.muestras ?? []).flatMap((m: any) => m.probetas ?? [])

    const submuestrasVencimiento: SubmuestraVencimiento[] = probetas.map((p: any, idx: number) => ({
        id: p.id ?? idx + 1,
        submuestra: `RCM - ${p.numero ?? idx + 1}`,
        numero: p.numero ?? idx + 1,
        dias: p.dias ?? 0,
        fechaVencimiento: isoToDate(p.fechaVencimiento),
        cantidad: p.cantidad ?? 1,
    }))

    return {
        id: data.id,
        dbId: data.id,
        rcmType: data.rcmType ?? 'Muestra',
        sede: data.sede ?? 'PA Chillán',
        area: data.area?.nombre ?? '',
        tipoServicio: data.familia?.nombre ?? '',
        numeroTarjeta: data.numeroTarjeta ?? '',
        tomaMuestra: data.tomaMuestra ?? '',
        tipoMaterial: data.tipoMaterial ?? '',
        item: data.item ?? '',
        grado: data.grado ?? '',
        procedencia: data.procedencia ?? '',
        ubicacionSector: data.ubicacionSector ?? '',
        elemento: data.elemento ?? '',
        calicata: '',
        estrato: '',
        cota1: data.cota1 ?? '',
        cota2: data.cota2 ?? '',
        observacionItem: data.observacionItem ?? '',
        observaciones: data.observaciones ?? '',
        informeEnsayo: data.informeEnsayo ?? true,
        cantidadMuestras: String(data.cantidadMuestras ?? '1'),
        fechaServicio: isoToDate(data.fechaServicio ?? data.fechaMuestreo),
        fechaCodificacion: isoToDate(data.fechaCodificacion),
        fechaIngreso: isoToDate(data.fechaIngreso),
        fechaEntrega: isoToDate(data.fechaEntrega),
        fechaConfeccion: isoToDate(data.fechaConfeccion),
        estado: data.estadoOperativo ?? 'CODIFICADO',
        tieneVencimiento: data.vencimiento ?? probetas.length > 0,
        ensayos,
        submuestrasVencimiento,
    }
}

/* ── component ───────────────────────────────────────────────────────── */

interface EditRcmViewProps {
    rcmId: string
}

export default function EditRcmView({ rcmId }: EditRcmViewProps) {
    const params = useParams()
    const router = useRouter()
    const lang = (params?.lang as string) || 'es'

    const [apiData, setApiData] = useState<any>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [loadingData, setLoadingData] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [saveSuccess, setSaveSuccess] = useState(false)

    const [ensayosAsociados, setEnsayosAsociados] = useState<EnsayoAsociado[]>([])

    const form = useRcmForm({ otData: null })
    const ensayoHooks = useEnsayos({ ensayosAsociados, setEnsayosAsociados })
    const productSearch = useProductSearch({
        area: form.area,
        anchorEl: null,
        agrupadorSearchAnchor: null,
        skuSearchAnchor: null,
        isInline: true,
    })

    /* fetch RCM data */
    const fetchedRef = useRef(false)
    useEffect(() => {
        if (!rcmId || fetchedRef.current) return
        fetchedRef.current = true
        fetch(`/api/rcm/${rcmId}`)
            .then(r => { if (!r.ok) throw new Error('RCM no encontrado'); return r.json() })
            .then(d => { setApiData(d); setLoadingData(false) })
            .catch(e => { setLoadError(e.message); setLoadingData(false) })
    }, [rcmId])

    /* populate form once areas + familias are ready */
    const populatedRef = useRef(false)
    useEffect(() => {
        if (populatedRef.current) return
        if (!apiData) return
        if (productSearch.areas.length === 0 || productSearch.todasLasFamilias.length === 0) return
        populatedRef.current = true

        const rcmData = mapApiToRcmData(apiData)
        form.populateFormFromRcm(
            rcmData,
            productSearch.areas,
            productSearch.todasLasFamilias,
            'edit',
            productSearch.parametrosArea,
        )
        setEnsayosAsociados(rcmData.ensayos)

        // populateFormFromRcm only sets fechaServicio; set the rest explicitly
        if (rcmData.fechaIngreso) form.setFechaIngreso(rcmData.fechaIngreso)
        if (rcmData.fechaEntrega) form.setFechaEntrega(rcmData.fechaEntrega)
        if (rcmData.fechaConfeccion) form.setFechaConfeccion(rcmData.fechaConfeccion)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiData, productSearch.areas, productSearch.todasLasFamilias, productSearch.parametrosArea])

    /* save handler */
    const handleSave = async () => {
        const v = form.getFormValues()

        if (v.rcmType === 'Muestra' && !v.numeroTarjeta.trim()) {
            form.setErrorVencimiento('El número de tarjeta es obligatorio para RCM tipo Muestra')
            return
        }
        if (ensayosAsociados.length === 0) {
            form.setErrorVencimiento('Debe agregar al menos un ensayo antes de guardar el RCM')
            return
        }
        if (v.tieneVencimiento) {
            if (v.submuestrasVencimiento.length === 0) {
                form.setErrorVencimiento('Debe agregar al menos una submuestra cuando el vencimiento está activado')
                return
            }
            const suma = v.submuestrasVencimiento.reduce((acc, s) => acc + s.cantidad, 0)
            const requerida = parseInt(v.cantidadMuestras) || 0
            if (suma !== requerida) {
                form.setErrorVencimiento(`La suma de cantidades (${suma}) debe coincidir con la Cantidad de Muestras (${requerida})`)
                return
            }
            if (v.submuestrasVencimiento.some(s => !s.fechaVencimiento)) {
                form.setErrorVencimiento('Todas las submuestras deben tener una fecha de vencimiento')
                return
            }
        }
        form.setErrorVencimiento('')

        const payload = {
            rcmType: v.rcmType,
            sede: v.sede,
            areaId: v.area || null,
            familiaId: v.tipoServicio || null,
            fechaCodificacion: form.getTodayDateForInput(),
            fechaServicio: v.fechaServicio,
            fechaMuestreo: v.fechaServicio,
            fechaIngreso: v.fechaIngreso,
            fechaEntrega: v.fechaEntrega || null,
            fechaConfeccion: v.fechaConfeccion || null,
            observaciones: v.observaciones,
            observacionItem: v.observacionItem,
            informeEnsayo: v.informeEnsayo,
            numeroTarjeta: v.numeroTarjeta,
            tipoMaterial: v.tipoMaterial,
            item: v.item,
            grado: v.grado,
            procedencia: v.procedencia,
            ubicacionSector: v.ubicacionSector,
            elemento: v.elemento,
            cota1: v.cota1,
            cota2: v.cota2,
            tomaMuestra: v.tomaMuestra,
            cantidadMuestras: parseInt(v.cantidadMuestras) || 1,
            vencimiento: v.tieneVencimiento,
            estadoOperativo: apiData?.estadoOperativo,
            ensayos: ensayosAsociados.map(e => ({
                productoId: e.productoId,
                sku: e.sku,
                nombre: e.nombre,
                norma: e.norma,
                cantidad: e.cantidad,
                observacion: e.observacion,
                estadoOperativo: e.estadoOperativo,
                esPaquete: e.esPaquete,
                subProductos: e.subProductos?.map(sp => ({
                    productoId: sp.productoId,
                    sku: sp.sku,
                    nombre: sp.nombre,
                    norma: sp.norma,
                    cantidad: sp.cantidad,
                    observacion: sp.observacion,
                })),
            })),
            submuestrasVencimiento: v.submuestrasVencimiento,
        }

        setIsSaving(true)
        setSaveError(null)
        try {
            const res = await fetch(`/api/rcm/${rcmId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Error al actualizar el RCM')
            }
            setSaveSuccess(true)
            setTimeout(() => router.push(`/${lang}/apps/rcmnavigatordetail`), 1500)
        } catch (e) {
            setSaveError(e instanceof Error ? e.message : 'Error al guardar')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => router.push(`/${lang}/apps/rcmnavigatordetail`)

    /* loading */
    if (loadingData) {
        return (
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Card><CardContent><Skeleton variant='rectangular' height={60} /></CardContent></Card>
                </Grid>
                <Grid item xs={12}>
                    <Card><CardContent><Skeleton variant='rectangular' height={400} /></CardContent></Card>
                </Grid>
            </Grid>
        )
    }

    /* error */
    if (loadError || !apiData) {
        return (
            <Card>
                <CardContent>
                    <Typography color='error' textAlign='center'>{loadError ?? 'No se pudo cargar el RCM.'}</Typography>
                </CardContent>
            </Card>
        )
    }

    const rcmLabel = apiData.numeroRcm
        ? `RCM-${String(apiData.numeroRcm).padStart(3, '0')}`
        : `RCM #${apiData.id}`

    const estadoColor: Record<string, string> = {
        CODIFICADO: '#0000b4',
        ENSAYADO: '#FF8F00',
        EJECUTADO: '#388E3C',
    }

    return (
        <Grid container spacing={4}>
            {/* Header */}
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                onClick={handleCancel}
                                variant='outlined'
                                size='small'
                                sx={{ textTransform: 'none' }}
                            >
                                Volver
                            </Button>
                            <Typography variant='h5' sx={{ fontWeight: 700 }}>{rcmLabel}</Typography>
                            <Chip
                                label={apiData.estadoOperativo ?? 'SIN ESTADO'}
                                size='small'
                                sx={{
                                    bgcolor: estadoColor[apiData.estadoOperativo] ?? '#757575',
                                    color: 'white',
                                    fontWeight: 700,
                                    letterSpacing: 0.5,
                                }}
                            />
                            <Chip
                                label={apiData.rcmType ?? 'MUESTRA'}
                                size='small'
                                variant='outlined'
                                sx={{ fontWeight: 700 }}
                            />
                            <Typography variant='body2' color='text.secondary' sx={{ ml: 'auto' }}>
                                Modo edición — los cambios reemplazarán todos los datos actuales
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {saveSuccess && (
                <Grid item xs={12}>
                    <Alert severity='success'>RCM actualizado correctamente. Redirigiendo...</Alert>
                </Grid>
            )}
            {saveError && (
                <Grid item xs={12}>
                    <Alert severity='error'>{saveError}</Alert>
                </Grid>
            )}

            {/* Form */}
            <Grid item xs={12}>
                <RcmDraftForm
                    form={form}
                    ensayoHandlers={ensayoHooks}
                    ensayosAsociados={ensayosAsociados}
                    areas={productSearch.areas}
                    todasLasFamilias={productSearch.todasLasFamilias}
                    parametrosArea={productSearch.parametrosArea}
                    isEditingRcm={true}
                    isSavingRcm={isSaving}
                    onSaveRcm={handleSave}
                    onCancelEdit={handleCancel}
                    searchTerm={productSearch.searchTerm}
                    onSearchChange={productSearch.handleSearchChange}
                    paginatedProductos={productSearch.paginatedProductos}
                    totalProductos={productSearch.totalProductos}
                    productsPage={productSearch.productsPage}
                    onPageChange={page => productSearch.setProductsPage(page)}
                    showOnlyPaquetes={productSearch.showOnlyPaquetes}
                    onShowOnlyPaquetesChange={productSearch.handleShowOnlyPaquetesChange}
                    onSelectProduct={ensayoHooks.handleSelectProduct}
                />
            </Grid>
        </Grid>
    )
}
