import fs from 'fs'

import { NextResponse } from 'next/server'

import puppeteer from 'puppeteer'

import { prisma } from '@/lib/prisma'

const ROLES_CONTACTO = [
  { value: 'encargado_obra', label: 'Encargado de Obra' },
  { value: 'dueno', label: 'Dueño' },
  { value: 'representante', label: 'Representante' },
  { value: 'jefe_obra_planta', label: 'Jefe de Obra / Planta' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrador_obra', label: 'Administrador de Obra' },
  { value: 'encargado_calidad', label: 'Encargado de Calidad' },
  { value: 'autocontrol', label: 'Autocontrol' },
  { value: 'profesional', label: 'Profesional' },
  { value: 'laboratorista', label: 'Laboratorista' },
  { value: 'ejecutivo_comercial', label: 'Ejecutivo Comercial y Administración' },
  { value: 'otro', label: 'Otro' }
]

function renderObraHTML(obra: any, logoBase64: string) {
  // Formatear la fecha de emisión como dd.mm.yyyy
  const fechaEmision = obra.fechaIngreso
    ? new Date(obra.fechaIngreso).toLocaleDateString('es-CL').replace(/-/g, '.').replace(/\//g, '.')
    : new Date().toLocaleDateString('es-CL').replace(/-/g, '.').replace(/\//g, '.');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800,900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; font-size: 10pt; }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          table-layout: fixed;
        }
        .header-table td, .header-table th {
          padding: 4px;
          font-family: 'Inter', sans-serif;
        }
        .header-logo {
          text-align: center;
          vertical-align: middle;
          width: 15%;
          min-width: 90px;
          background: #fff;
        }
        .header-title {
          font-weight: bold;
          font-size: 2em;
          text-align: center;
          vertical-align: middle;
          width: 55%;
          background: #fff;
          font-family: 'Inter', sans-serif;
        }
        .header-meta {
          font-size: 1.05em;
          width: 30%;
          background: #fff;
          font-family: 'Inter', sans-serif;
        }
        .header-meta b { font-weight: bold; font-family: 'Inter', sans-serif; }
        .section { margin: 24px 0; font-size: 1em; font-family: 'Inter', sans-serif; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .col { flex: 1; }
        .label { color: #736e7d; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; font-family: 'Inter', sans-serif; }
        .value { color: #736e7d; font-size: 12px; margin-bottom: 2px; font-family: 'Inter', sans-serif; }
        .table { width: 100%; border-collapse: collapse; margin-top: 24px; font-family: 'Inter', sans-serif; font-size: 1em; table-layout: fixed; }
        .table-2col col { width: 50%; }
        .table-3col col { width: 33.33%; }
        .table-4col col { width: 25%; }
        .table th, .table td { word-break: break-word; }
        .table-bordered { border: 1px solid #ccc; }
        .section-title { font-size: 1.1em; font-weight: bold; margin-bottom: 16px; color: #736e7d; font-family: 'Inter', sans-serif; }
        .grid-container { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .grid-item { margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div style="width: 100%; max-width: 900px; margin: 0 auto;">
      <table class="header-table">
        <tr>
          <td class="header-logo" rowspan="4">
            <img src="${logoBase64}" alt="LOGO" style="max-width:184px; max-height:92px;" />
          </td>
          <td class="header-title" rowspan="4" style="vertical-align: middle;">
            Ficha Cliente - Obra
          </td>
          <td class="header-meta"><b>Código: RPG-05-02</b></td>
        </tr>
        <tr>
          <td class="header-meta">Fecha de emisión: ${fechaEmision}</td>
        </tr>
        <tr>
          <td class="header-meta">Revisión N°: 03</td>
        </tr>
        <tr>
          <td class="header-meta">Página 1 de 1</td>
        </tr>
      </table>
      <hr style="border: none; border-top: 2px solid #ff0096; margin: 12px 0; width: 100%;">
      <div class="pdf-container">
        <div class="section">
          <table class="table table-2col">
            <colgroup>
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="2" style="font-size:1.1em; text-align:left; padding:6px; border:1px solid #ccc;">
                Datos Principales
              </th>
            </tr>
            <tr>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>N° Obra:</b> ${obra.numeroObra}<br/>
                <b>Fecha Ingreso:</b> ${obra.fechaIngreso ? new Date(obra.fechaIngreso).toLocaleDateString('es-CL') : '-'}<br/>
              </td>
              <td style="width:67%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>RUT Cliente:</b> ${obra.rut}<br/>
                <b>Nombre Cliente:</b> ${obra.nombreCliente}
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table class="table table-3col table-bordered">
            <colgroup>
              <col span="1" />
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="3" style="font-size:1.1em; text-align:left; padding:6px; border-bottom:1px solid #ccc; border-top:none; border-left:none; border-right:none;">
                Antecedentes
              </th>
            </tr>
            <tr>
              <td style="padding: 4px; border:none;">
                <b>Nombre Obra:</b> ${obra.nombreObra}
              </td>
              <td style="padding: 4px; border:none;">
                <b>Dirección:</b> ${obra.direccion}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px; border:none;">
                <b>Región:</b> ${obra.region}
              </td>
              <td style="padding: 4px; border:none;">
                <b>Comuna:</b> ${obra.comuna}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px; border:none;">
                <b>Sector:</b> ${obra.sector || '-'}
              </td>
              <td style="padding: 4px; border:none;">
                <b>Referencia:</b> ${obra.referencia || '-'}
              </td>
              <td style="padding: 4px; border:none;">
                <b>Georreferencia:</b> ${obra.georreferencia || '-'}
              </td>
            </tr>
            <tr>
              <td style="padding: 4px; border:none;">
                <b>Mandante:</b> ${obra.mandante || '-'}
              </td>
              <td style="padding: 4px; border:none;">
               <b>Texto Mandante:</b> ${obra.textoMandante || '-'}
              </td>
              <td style="padding: 4px; border:none;">
                <b>Informe a Mandante:</b> ${obra.informeMandante ? 'Sí' : 'No'}
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 6px; border:none;">
                <b>Enviar Informes a:</b> ${Array.isArray(obra.correos) ? obra.correos.join(', ') : '-'}
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table class="table table-3col">
            <colgroup>
              <col span="1" />
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="3" style="font-size:1.1em; text-align:left; padding:6px; border:1px solid #ccc;">
                Requisitos
              </th>
            </tr>
            <tr>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Acreditación Personal:</b> ${obra.acreditacionPersonal ? 'Sí' : 'No'}<br/>
                <b>Acreditación Equipos:</b> ${obra.acreditacionEquipos ? 'Sí' : 'No'}<br/>
                <b>Especificaciones Técnicas:</b> ${obra.especificacionesTecnicas ? 'Sí' : 'No'}<br/>
              </td>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Carta Compromiso:</b> ${obra.cartaCompromiso ? 'Sí' : 'No'}<br/>
                <b>Mandato y Envío de Informes a SERVIU:</b> ${obra.mandatoServiu ? 'Sí' : 'No'}<br/>
              </td>
              <td style="width:34%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Otros Requisitos:</b> ${obra.otrosRequisitos || '-'}
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table class="table table-3col">
            <colgroup>
              <col span="1" />
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="3" style="font-size:1.1em; text-align:left; padding:6px; border:1px solid #ccc;">
                Referencias
              </th>
            </tr>
            <tr>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Estado de Pago:</b> ${obra.estadoPago ? 'Sí' : 'No'}<br/>
                <b>HES:</b> ${obra.hes ? 'Sí' : 'No'}<br/>
              </td>
              <td style="width:67%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>OC:</b> ${obra.oc ? 'Sí' : 'No'}<br/>
                <b>Envío de Informes:</b> ${obra.envioInformes ? 'Sí' : 'No'}<br/>
              </td>
            </tr>
            <tr>
              <td colspan="3" style="padding: 6px; border:1px solid #ccc;">
                <b>Otras Referencias:</b> ${(obra.otrasReferencias || '-').replace(/\n/g, '<br/>')}
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table class="table table-3col">
            <colgroup>
              <col span="1" />
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="3" style="font-size:1.1em; text-align:left; padding:6px; border:1px solid #ccc;">
                Facturación
              </th>
            </tr>
            <tr>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Razón Social:</b> ${obra.razonSocial}<br/>
                <b>RUT:</b> ${obra.rut}<br/>
                <b>Giro:</b> ${obra.giro || '-'}<br/>
                <b>RUT Representante Legal:</b> ${obra.rutRepresentanteLegal || '-'}<br/>
                
              </td>
              <td style="width:33%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Dirección Comercial:</b> ${obra.direccionComercial}<br/>
                <b>Comuna:</b> ${obra.comunaFacturacion || '-'}<br/>
                <b>Teléfono:</b> ${obra.telefonoFacturacion || '-'}<br/>
                <b>Representante Legal:</b> ${obra.representanteLegal || '-'}
              </td>
              <td style="width:34%; vertical-align:top; padding: 6px; border:1px solid #ccc;">
                <b>Mail Recepción Factura:</b> ${Array.isArray(obra.mailRecepcionFactura) ? obra.mailRecepcionFactura.join(', ') : '-'}<br/>
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <table class="table table-4col">
            <colgroup>
              <col span="1" />
              <col span="1" />
              <col span="1" />
              <col span="1" />
            </colgroup>
            <tr>
              <th colspan="4" style="font-size:1.1em; text-align:left; padding:6px; border:1px solid #ccc;">
                Contactos
              </th>
            </tr>
            <tr>
              <th style="border:1px solid #ccc; padding:6px;">Nombre</th>
              <th style="border:1px solid #ccc; padding:6px;">Cargo</th>
              <th style="border:1px solid #ccc; padding:6px;">Email</th>
              <th style="border:1px solid #ccc; padding:6px;">Teléfono</th>
            </tr>
            ${obra.contactos && obra.contactos.length > 0 ? obra.contactos
              .sort((a: any, b: any) => {
                if (a.isPrincipal && !b.isPrincipal) return -1;
                if (!a.isPrincipal && b.isPrincipal) return 1;
                
return 0;
              })
              .map((contact: any) => `
                <tr>
                  <td style="border:1px solid #ccc; padding:6px;">${contact.nombre}${contact.isPrincipal ? ' (Principal)' : ''}</td>
                  <td style="border:1px solid #ccc; padding:6px;">${ROLES_CONTACTO.find(rol => rol.value === contact.rol)?.label || contact.rol || '-'}</td>
                  <td style="border:1px solid #ccc; padding:6px;">${contact.email || '-'}</td>
                  <td style="border:1px solid #ccc; padding:6px;">${contact.telefono1 || '-'}</td>
                </tr>
              `).join('') : `<tr><td colspan="4" style="border:1px solid #ccc; padding:6px; text-align:center;">No hay contactos registrados</td></tr>`}
          </table>
        </div>
        <!-- Firma y nota -->
        <div style="margin-top: 56px;">
          <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 8px;">
            <div style="text-align: right;">
              <span style="font-weight: bold; font-size: 1em;">Firma Cliente</span><br/>
              <hr style="width: 220px; border: none; border-top: 2px solid #222; margin: 8px 0 0 0;">
            </div>
          </div>
          <div style="font-size: 9px; color: #222; text-align: justify; margin-bottom: 32px;">
            Nota: Esta ficha ha sido generada a partir de los datos entregados por el cliente. Para la ejecución de los servicios, es obligatorio devolver este documento firmado junto con la Orden de Compra correspondiente. Laboratorio Pampa Austral no podrá iniciar los trabajos sin la recepción de ambos. La facturación se realizará exclusivamente a la razón social indicada en esta ficha. Cualquier modificación deberá ser informada con anticipación. Los informes se entregarán previo pago confirmado.
          </div>
          <hr style="border: none; border-top: 2px solid #ff0096; margin: 24px 0 24px 0; width: 100%;">
          <div style="display: flex; align-items: center; justify-content: flex-start; font-size: 11px;">
            <img src="${logoBase64}" alt="LOGO" style="max-width: 60px; max-height: 60px; margin-right: 12px;" />
            <div style="text-align: left; color: #0a1ea8;">
              <span style="color: #0a1ea8; font-weight: bold;">Casa Matriz: Calle Santa Blanca N°51, Chillán - Chile</span><br/>
              <span style="color: #0a1ea8;">Fono: 42-223 82 90 | 42-224 02 55 – Horario Atención 8:00h a 18:00h</span><br/>
              <span style="color: #0a1ea8; font-weight: bold;">contacto@pampaaustral.cl</span>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
  `
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const obra = await prisma.obra.findUnique({
      where: {
        obraId: parseInt(params.id)
      },
      include: {
        contactos: true
      }
    })

    if (!obra) {
      return new NextResponse('Obra no encontrada', { status: 404 })
    }

    // Cargar logo como base64
    const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`

    const logoBase64 = fs.existsSync(logoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
      : ''

    const html = renderObraHTML(obra, logoBase64)

    // Si la URL tiene ?preview=1, devolvemos el HTML en vez del PDF
    const url = new URL(request.url)

    if (url.searchParams.get('preview') === '1') {
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    const browser = await puppeteer.launch({ 
      headless: true, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })
    
    // Asegurar que las fuentes se carguen correctamente
    await page.evaluateHandle('document.fonts.ready')
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
      scale: 0.8,
      printBackground: true,
      preferCSSPageSize: true
    })

    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="obra_${obra.numeroObra}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    
return new NextResponse('Error al generar el PDF', { status: 500 })
  }
} 
