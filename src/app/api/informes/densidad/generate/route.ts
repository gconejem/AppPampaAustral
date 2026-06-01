import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const escapeHtml = (value: unknown): string => {
  const s = String(value ?? '')
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return ''
  try {
    if (value instanceof Date) {
      const yyyy = value.getFullYear()
      const mm = String(value.getMonth() + 1).padStart(2, '0')
      const dd = String(value.getDate()).padStart(2, '0')
      return `${dd}-${mm}-${yyyy}`
    }

    // string ISO o YYYY-MM-DD
    const s = value.includes('T') ? value.split('T')[0] : value
    const [yyyy, mm, dd] = s.split('-').map(Number)
    if (!yyyy || !mm || !dd) return ''
    return `${String(dd).padStart(2, '0')}-${String(mm).padStart(2, '0')}-${yyyy}`
  } catch {
    return ''
  }
}

function renderInformeDensidadHTML(input: {
  informeNumero: string
  codigoNombre: string
  descripcionServicio: string
  clienteNombre: string
  clienteRut: string
  clienteDireccion: string
  atencionNombre: string
  contactoEmail: string
  obraNumero: string
  obraNombre: string
  obraDireccion: string
  obraComuna: string
  obraRegion: string
  mandante: string
  otClave: string
  otCorrelativ: string
  rcmNumero: string
  fechaMuestreo: string
  fechaEmision: string
  laboratorista: string
  equipoMarca: string
  equipoModelo: string
  equipoCodigo: string
  numeroSerie: string
  conteoEstandar: string
  procedimiento: string
  referencia: string
  item: string
  descripSuelo: string
  ensayos: Array<{ sku: string; nombre: string }>
  controles: unknown
  innLogoBase64: string
  pampaLogoBase64: string
}) {
  const join = (parts: Array<string | null | undefined>, sep: string) => parts.map(x => String(x ?? '').trim()).filter(Boolean).join(sep)

  // Tabla 2: etiquetas fijas a la izquierda + valores dinámicos a la derecha (si no hay valor, se deja vacío)
  const antecedentesRows: Array<{ label: string; value: string }> = [
    { label: 'MANDANTE', value: input.mandante },
    { label: 'OBRA', value: join([input.obraNumero, input.obraNombre, input.obraComuna, input.obraRegion], ' - ') },
    { label: 'DIRECCIÓN OBRA', value: input.obraDireccion },
    { label: 'EMPRESA Y/O CLIENTE', value: join([input.clienteRut, input.clienteNombre], ' - ') },
    { label: 'ATENCIÓN', value: input.atencionNombre },
    { label: 'CONTACTO', value: input.contactoEmail },
    { label: 'DIRECCIÓN CLIENTE', value: input.clienteDireccion },
    { label: 'CÓDIGO', value: input.codigoNombre },
    { label: 'ÓRDEN DE TRABAJO', value: input.otClave || input.otCorrelativ },
    { label: 'ITEM', value: input.item },
    { label: 'ENSAYO SOLICITADO', value: input.descripcionServicio },
    { label: 'PROCEDIMIENTO', value: input.procedimiento },
    { label: 'CÓDIGO DENSÍMETRO NUCLEAR', value: input.equipoCodigo },
    { label: 'MARCA DEL DENSÍMETRO', value: input.equipoMarca },
    { label: 'MODELO DEL DENSÍMETRO', value: input.equipoModelo },
    { label: 'NÚMERO DE SERIE DEL DENSÍMETRO', value: input.numeroSerie },
    { label: 'CONTEO ESTANDAR', value: input.conteoEstandar },
    { label: 'DESCRIPCIÓN VISUAL DEL SUELO', value: input.descripSuelo },
    { label: 'CONTROLADO POR', value: input.laboratorista },
    { label: 'FECHA DE CONTROL', value: input.fechaMuestreo },
    { label: 'FECHA DE EMISIÓN', value: input.fechaEmision },
    { label: 'REFERENCIA', value: input.referencia }
  ]

  const controlesValue: any = input.controles as any
  const controles = Array.isArray(controlesValue)
    ? (controlesValue as any[])
    : Array.isArray(controlesValue?.controles)
      ? (controlesValue.controles as any[])
      : []

  const controlRowsHtml = controles.length
    ? controles
      .map((c: any, idx: number) => {
        const get = (...keys: string[]) => {
          for (const k of keys) {
            if (c && c[k] != null && String(c[k]).trim() !== '') return String(c[k])
          }
          return ''
        }

        const isTrue = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1'

        const numero = get('numero', 'nro', 'NRO') || String(idx + 1)

        const ubicacion = get('ubicacion', 'UBICACION', 'calle_pasaje', 'callePasaje', 'ubica', 'UBICA')

        const frenteA = get('frenteA', 'frente_a', 'frentea', 'FRENTEA')

        const entreDirecto = get('entre', 'ENTRE')
        const entre1 = get('entre_1', 'entre1')
        const entre2 = get('entre_2', 'entre2')
        const entreNa = get('entre_na', 'entreNA')
        const entre =
          entreDirecto || (entreNa && isTrue(entreNa) ? 'No Aplica' : (entre2 || entre1 || ''))

        const fajaOLado = get('faja', 'lado', 'faja_lado', 'fajaLado', 'FAJA', 'LADO')

        return `
            <tr>
              <td class="tc">${escapeHtml(numero)}</td>
              <td>${escapeHtml(ubicacion)}</td>
              <td>${escapeHtml(frenteA)}</td>
              <td>${escapeHtml(entre)}</td>
              <td>${escapeHtml(fajaOLado)}</td>
              <td class="tc">${escapeHtml(get('profundidad', 'prof', 'PROF'))}</td>
              <td>${escapeHtml(get('capa', 'CAPA'))}</td>
              <td class="tr">${escapeHtml(get('dch', 'DCH', 'dchh'))}</td>
              <td class="tr">${escapeHtml(get('w', 'W', 'humedad', 'HUMEDAD'))}</td>
              <td class="tr">${escapeHtml(get('dcs', 'DCS'))}</td>
              <td class="tr">${escapeHtml(get('dmcs', 'DMCS', 'dr', 'DR'))}</td>
              <td class="tr">${escapeHtml(get('comp', 'COMP', 'compactacion'))}</td>
              <td class="tr">${escapeHtml(get('exig', 'EXIG'))}</td>
            </tr>
          `.trim()
      })
      .join('')
    : `<tr><td colspan="13" class="empty">Sin datos de controles</td></tr>`

  const ensayosHtml = (input.ensayos ?? []).length
    ? `
      <table class="table" style="margin-top: 10px;">
        <thead>
          <tr>
            <th style="width: 22%;">SKU</th>
            <th>ENSAYO</th>
          </tr>
        </thead>
        <tbody>
          ${input.ensayos
      .map(e => {
        return `<tr><td>${escapeHtml(e.sku)}</td><td>${escapeHtml(e.nombre)}</td></tr>`
      })
      .join('')}
        </tbody>
      </table>
    `
    : ''

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800,900&display=swap" rel="stylesheet">
      <style>
        body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #111827; font-size: 12px; }

        /* Header estático (NO modificar: replica mock) */
        .static-header { padding: 6px 0 0 0; }
        .static-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; padding: 0 0 6px 0; }
        .inn-logo { height: 72px; width: auto; object-fit: contain; }
        .pampa-logo { height: 72px; width: auto; object-fit: contain; }
        .title-box { border: 1px solid #000; padding: 10px 8px; text-align: center; margin-top: 10px; }
        .title-main { font-size: 12px; font-weight: 900; color: #000; }
        .title-sub { font-size: 11px; font-weight: 700; color: #000; margin-top: 2px; }
        .title-correl { font-size: 11px; font-weight: 700; color: #000; margin-top: 4px; }

        /* Mantener ancho del encabezado: el contenido usa el mismo ancho que el recuadro superior */
        .section { margin: 18px 0 0 0; }
        .h1 { font-size: 14px; font-weight: 900; color: #0300b4; margin: 0 0 10px 0; text-transform: uppercase; }

        /* Caja/tabla de antecedentes (estilo clásico) */
        .box { border: 1px solid #000; border-radius: 0; padding: 10px 12px; }
        .kv { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .kv td { padding: 2px 6px; vertical-align: top; font-size: 12px; }
        .k { width: 34%; font-weight: 700; color: #000; text-transform: uppercase; }
        .sep { width: 12px; font-weight: 700; color: #000; text-align: center; }
        .v { width: 66%; color: #000; }

        /* Sección + tabla de controles (estático) */
        .control-title { margin: 14px 0 0 0; font-size: 12px; color: #000; }
        .control-title strong { font-weight: 900; }
        .control-note { margin: 2px 0 6px 0; font-size: 9px; font-weight: 700; color: #000; }

        .control-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .control-table th,
        .control-table td { border: 1px solid #000; padding: 4px 4px; font-size: 9px; color: #000; vertical-align: middle; }
        .control-table th { background: #e6e6e6; font-weight: 900; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .control-table td { vertical-align: top; }
        .control-table tr { page-break-inside: avoid; }

        .tc { text-align: center; }
        .tr { text-align: right; }
        .empty { text-align: center; padding: 16px; color: #000; }
        @page { margin: 5mm 5mm 25mm 5mm; }
      </style>
    </head>
    <body>
      <div class="static-header">
        <div class="static-top">
          ${input.innLogoBase64 ? `<img src="${input.innLogoBase64}" class="inn-logo" />` : ''}
          ${input.pampaLogoBase64 ? `<img src="${input.pampaLogoBase64}" class="pampa-logo" />` : ''}
        </div>

        <div class="title-box">
          <div class="title-main">INFORME OFICIAL CONTROL DE COMPACTACIÓN - MÉTODO NUCLEAR - ÁREA SUELO - R-L-004-32, v5</div>
          <div class="title-sub">(Resolución MINVU N°4884, 13 Diciembre 2022)</div>
          <div class="title-correl">Correlativo de obra: ${escapeHtml(input.obraNumero || '-')}</div>
        </div>
      </div>

      <div class="section">
        <div class="box">
          <table class="kv">
            ${antecedentesRows
      .map(r => {
        const value = String(r.value ?? '').trim()
        const sep = value ? ':' : ''
        return `<tr><td class="k">${escapeHtml(r.label)}</td><td class="sep">${escapeHtml(sep)}</td><td class="v">${escapeHtml(value)}</td></tr>`
      })
      .join('')}
          </table>
        </div>

        <div class="control-title"><strong>CONTROL DE COMPACTACIÓN.</strong> (Actividad realizada en terreno)</div>
        <div class="control-note">Según 8.502.1, Dic. 2003, MC-V8 y HUMEDAD Según 8.502.2, Dic. 2003, MC-V8</div>

        <table class="control-table">
          <thead>
            <tr>
              <th style="width: 28px;">N°</th>
              <th style="width: 110px; text-align:left;">Ubicación</th>
              <th style="width: 60px;">Frente a</th>
              <th style="width: 60px;">Entre</th>
              <th style="width: 52px;">Faja o<br>Lado</th>
              <th style="width: 60px;">Prof. de<br>Ensayo<br>(cm)</th>
              <th style="width: 50px;">Capa</th>
              <th style="width: 52px;">D.C.H.<br>(Kg/m3)</th>
              <th style="width: 34px;">W%</th>
              <th style="width: 52px;">D.C.S.<br>(Kg/m3)</th>
              <th style="width: 56px;">DMCS / DR<br>(Kg/m3)</th>
              <th style="width: 38px;">COMP.<br>(%)</th>
              <th style="width: 34px;">Exig.<br>(%)</th>
            </tr>
          </thead>
          <tbody>
            ${controlRowsHtml}
          </tbody>
        </table>
      </div>
    </body>
  </html>
  `
}

const parseIntParam = (value: string | null): number | null => {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const codigoAgrupadorId = parseIntParam(url.searchParams.get('codigoAgrupadorId'))
    const rcmId = parseIntParam(url.searchParams.get('rcmId'))
    const informeNumero = String(url.searchParams.get('informe') ?? '').trim()
    const preview = url.searchParams.get('preview') === '1'
    const download = url.searchParams.get('download') === '1'

    if (!codigoAgrupadorId && !rcmId) {
      return new NextResponse('Debe indicar codigoAgrupadorId o rcmId', { status: 400 })
    }

    const rcm = rcmId
      ? await prisma.rCM.findUnique({
        where: { id: rcmId },
        select: {
          id: true,
          numeroRcm: true,
          estadoOperativo: true,
          fechaMuestreo: true,
          fechaIngreso: true,
          fechaCodificacion: true
        }
      })
      : null

    const codigo = await prisma.codigoAgrupador.findFirst({
      where: codigoAgrupadorId ? { id: codigoAgrupadorId } : { rcms: { some: { id: rcmId! } } },
      select: {
        id: true,
        codigoNombre: true,
        descripcionServicio: true,
        ensayos: { select: { sku: true, nombre: true } },
        rcms: {
          select: {
            id: true
          },
          take: 1,
          orderBy: { id: 'asc' }
        },
        ordenTrabajo: {
          select: {
            clave: true,
            correlativ: true,
            createdAt: true,
            jsonOT: true,
            user: { select: { name: true } },
            densidad: {
              select: {
                item: true,
                marca: true,
                modelo: true,
                codigoEquipo: true,
                descripSuelo: true,
                controles: true
              }
            },
            agenda: {
              select: {
                cliente: {
                  select: {
                    rut: true,
                    razonSocial: true,
                    nombreCliente: true,
                    direccion: true,
                    comuna: true,
                    region: true,
                    ciudad: true
                  }
                },
                obra: { select: { numeroObra: true, nombreObra: true, direccion: true, comuna: true, region: true, mandante: true } },
                contactos: { select: { nombre: true, email: true, isPrincipal: true } }
              }
            }
          }
        }
      }
    })

    if (!codigo) {
      return new NextResponse('Código agrupador no encontrado', { status: 404 })
    }

    const ot = codigo.ordenTrabajo
    const agenda = ot?.agenda
    const cliente = agenda?.cliente
    const obra = agenda?.obra
    const densidad = ot?.densidad

    const contacto = (agenda?.contactos ?? []).find(c => c.isPrincipal) ?? (agenda?.contactos ?? [])[0]

    const jsonOT: any = (ot as any)?.jsonOT ?? null
    const respuesta: any = jsonOT?.RESPUESTA ?? jsonOT

    const densidadControles: any = densidad?.controles ?? null
    const jsonControles: any = respuesta?.controles ?? null

    const densidadArray = Array.isArray(densidadControles)
      ? densidadControles
      : Array.isArray(densidadControles?.controles)
        ? densidadControles.controles
        : null

    const jsonArray = Array.isArray(jsonControles) ? jsonControles : null

    const controles = densidadArray?.length
      ? densidadControles
      : jsonArray?.length
        ? jsonControles
        : densidadControles ?? jsonControles ?? null

    const innLogoPath = `${process.cwd()}/public/images/logos/inn-acreditacion.png`
    const innLogoBase64 = fs.existsSync(innLogoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(innLogoPath).toString('base64')
      : ''

    const pampaLogoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.jpg`
    const pampaLogoBase64 = fs.existsSync(pampaLogoPath)
      ? 'data:image/jpeg;base64,' + fs.readFileSync(pampaLogoPath).toString('base64')
      : ''

    const html = renderInformeDensidadHTML({
      informeNumero: informeNumero || '',
      codigoNombre: String(codigo.codigoNombre ?? ''),
      descripcionServicio: String(codigo.descripcionServicio ?? ''),
      clienteNombre: String(cliente?.razonSocial ?? cliente?.nombreCliente ?? ''),
      clienteRut: String(cliente?.rut ?? ''),
      clienteDireccion: String(cliente?.direccion ?? ''),
      atencionNombre: String(contacto?.nombre ?? ''),
      contactoEmail: String(contacto?.email ?? ''),
      obraNumero: String(obra?.numeroObra ?? ''),
      obraNombre: String(obra?.nombreObra ?? ''),
      obraDireccion: String(obra?.direccion ?? ''),
      obraComuna: String(obra?.comuna ?? ''),
      obraRegion: String(obra?.region ?? ''),
      mandante: String(obra?.mandante ?? ''),
      otClave: String(ot?.clave ?? ''),
      otCorrelativ: String(ot?.correlativ ?? ''),
      rcmNumero: String(rcm?.numeroRcm ?? ''),
      fechaMuestreo: formatDate(rcm?.fechaMuestreo ?? null),
      fechaEmision: formatDate(rcm?.fechaCodificacion ?? rcm?.fechaIngreso ?? null),
      laboratorista: String(ot?.user?.name ?? ''),
      equipoMarca: String(densidad?.marca ?? ''),
      equipoModelo: String(densidad?.modelo ?? ''),
      equipoCodigo: String(densidad?.codigoEquipo ?? ''),
      numeroSerie: '',
      conteoEstandar: '',
      procedimiento: '',
      referencia: '',
      item: String(densidad?.item ?? ''),
      descripSuelo: String(densidad?.descripSuelo ?? ''),
      ensayos: (codigo.ensayos ?? []).map(e => ({ sku: String(e.sku ?? ''), nombre: String(e.nombre ?? '') })),
      controles,
      innLogoBase64,
      pampaLogoBase64
    })

    if (preview) {
      return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-features=VizDisplayCompositor']
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })

      // Esperar a que carguen las fuentes web antes de renderizar PDF.
      await page.evaluateHandle('document.fonts.ready')

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '5mm', right: '5mm', bottom: '35mm', left: '5mm' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="width:100%;font-family:Helvetica,Arial,sans-serif;font-size:9px;color:#000;padding:0 32px;box-sizing:border-box;">
            <div style="font-size:9px;color:#000;margin:0 0 4px 0;">Página <span class='pageNumber'></span> de <span class='totalPages'></span></div>

            <div style="text-align:center;line-height:1.25;">
              <div>Laboratorio Pampa Austral Ltda. asegura la veracidad de los resultados del ensayo y/o control solicitado y NO la información declarada por el solicitante.</div>
              <div>Los resultados del presente informe se refieren únicamente al ítem controlado. - Este informe no es válido sin firma y sello.</div>
              <div style="color:#1d4ed8;">Este Informe ha sido Firmado Digitalmente, para verificar comuníquese con el Laboratorio Pampa Austral Limitada</div>
              <div style="color:#1d4ed8;">Declaración: Este informe no debe ser reproducido parcial ni totalmente sin la aprobación escrita del responsable de su emisión.</div>
            </div>

            <hr style="border:none;border-top:2px solid #22c55e;margin:6px 0 4px 0;padding:0;">

            <div style="text-align:center;font-size:10px;font-weight:700;color:#1d4ed8;">
              Santa Blanca 51 - Chillán Fono/Fax: (42)2238290 - (42)2240255 - gerencia@pampaustral.cl - www.pampaustral.cl
            </div>
          </div>
        `
      })

      const historyRcmId = rcm?.id ?? codigo.rcms?.[0]?.id ?? null
      const informeParsed = Number.parseInt(informeNumero.replace(/[^\d]/g, '').trim(), 10)

      if (historyRcmId && Number.isFinite(informeParsed) && informeParsed > 0) {
        const existingAuto = await prisma.rCMHistory.findFirst({
          where: {
            rcmId: historyRcmId,
            tipoEstado: 'INFORME_AUTO',
            informe: informeParsed
          },
          select: { id: true }
        })

        if (!existingAuto) {
          await prisma.rCMHistory.create({
            data: {
              rcm: { connect: { id: historyRcmId } },
              tipo: 'Ope',
              funcionario: 'Sistema',
              fechaAccion: new Date(),
              estAnterior: rcm?.estadoOperativo ?? null,
              estNuevo: rcm?.estadoOperativo ?? 'SIN_CAMBIO',
              observacion: 'Control de Compactación — Método Nuclear',
              informe: informeParsed,
              aplicadoA: 'CP',
              tipoEstado: 'INFORME_AUTO',
              motivo: 'Control de Compactación — Método Nuclear'
            }
          })
        }
      }

      const filename = `informe-densidad${informeNumero ? `-${informeNumero}` : ''}.pdf`

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`
        }
      })
    } finally {
      await browser.close()
    }
  } catch (error) {
    console.error('Error al generar Informe Densidad PDF:', error)
    return new NextResponse('Error al generar el PDF', { status: 500 })
  }
}
