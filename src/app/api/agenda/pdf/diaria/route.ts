import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import fs from 'fs'

export async function POST(request: Request) {
  try {
    const agendaData = await request.json()

    const { laboratorista, fecha, eventos } = agendaData

    // Filtrar eventos solo para el laboratorista seleccionado
    const eventosFiltrados = eventos.filter((evento: any) => {
      const asignados = evento.extendedProps?.asignados || []
      return asignados.some((asignado: any) => {
        const asignadoId = asignado.user?.id || asignado.id || asignado
        const laboratoristaId = laboratorista?.id
        return String(asignadoId) === String(laboratoristaId)
      })
    })

    // Cargar logo como base64
    const logoPath = `${process.cwd()}/public/images/logos/PAMPA_MG_2025_017-2.png`
    const logoBase64 = fs.existsSync(logoPath)
      ? 'data:image/png;base64,' + fs.readFileSync(logoPath).toString('base64')
      : ''

    const html = renderAgendaDiariaHTML(agendaData, eventosFiltrados, logoBase64)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-web-security', '--disable-features=VizDisplayCompositor']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Esperar a que las fuentes se carguen completamente
    await page.evaluateHandle('document.fonts.ready')
    await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo adicional para asegurar carga de fuentes

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '5mm', right: '5mm', bottom: '25mm', left: '5mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-family:'Segoe UI','Trebuchet MS','Lucida Grande','Lucida Sans Unicode','Lucida Sans',Tahoma,sans-serif;font-size:9px;color:#736e7d;text-align:center;line-height:1.2;position:relative;">
          <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Descubrir</span> <span style="color:#ff0295; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">•</span> <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Proyectar</span> <span style="color:#ff0295; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">•</span> <span style="color:#0300b4; font-weight:700; font-size:12px; font-family:'Segoe UI','Trebuchet MS','Lucida Grande',sans-serif;">Concretar</span><br>
          Casa Matriz: Calle Santa Blanca N°51, Chillán - Chile<br>
          Fono: 42-223 82 90 | 42-224 02 55 – Horario Atención: 8:00h a 18:00h (viernes hasta 17:00h)<br>
          <span style="font-weight:bold;">contacto@pampaustral.cl</span>
          <div style="position:absolute;left:20px;bottom:0;font-size:12px;color:#736e7d;">
            Agenda Diaria - ${new Date(fecha).toLocaleDateString('es-ES')}
          </div>
          <div style="position:absolute;right:20px;bottom:0;font-size:12px;color:#736e7d;">
            Página <span class='pageNumber'></span> de <span class='totalPages'></span>
          </div>
        </div>
      `
    })
    await browser.close()

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="agenda-diaria-${laboratorista?.name || 'laboratorista'}-${new Date(fecha).toISOString().split('T')[0]}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error al generar PDF de agenda diaria:', error)
    return new NextResponse('Error al generar el PDF de agenda diaria', { status: 500 })
  }
}

function renderAgendaDiariaHTML(agendaData: any, eventos: any[], logoBase64: string) {
  const { laboratorista, fecha } = agendaData

  // Función para formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Función para formatear estado
  const formatStatus = (estado: string) => {
    if (!estado) return 'AGENDADA'
    return estado.replace(/_/g, ' ')
  }

  // Función para obtener el nombre del solicitante
  const getSolicitante = (evento: any) => {
    const contactos = evento.extendedProps?.contactos || []
    if (contactos.length > 0) {
      const contacto = contactos[0]
      const nombre = contacto.nombre || 'Sin nombre'
      const telefono = contacto.telefono1 || contacto.telefono2 || ''
      return telefono ? `${nombre}<br>${telefono}` : nombre
    }
    return 'Sin contacto'
  }

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700,800,900&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Inter', sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; 
          margin: 0; 
          padding: 0; 
          color: #333; 
          font-size: 12px; 
          line-height: 1.4;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          background: #fff; 
          padding: 20px 30px 10px 30px; 
          border-bottom: 2px solid #FF0096; 
        }
        .header-left { 
          display: flex; 
          flex-direction: column; 
          align-items: flex-start; 
        }
        .logo-title { 
          display: flex; 
          align-items: center; 
        }
        .logo { 
          height: 35px; 
        }
        .title { 
          font-size: 16px; 
          font-weight: bold; 
          margin-left: 12px; 
          color: #333; 
        }
        .subtitle { 
          font-size: 10px; 
          color: #666; 
          font-style: italic; 
          margin-top: 2px; 
        }
        .header-right { 
          text-align: right; 
          color: #333; 
          font-size: 11px; 
          min-width: 200px; 
        }
        .header-right .label { 
          font-weight: bold; 
          color: #333; 
        }
        .pdf-container { 
          width: 100%; 
        }
        .section { 
          margin: 20px 30px; 
        }
        .agenda-title {
          font-size: 24px;
          font-weight: bold;
          color: #1976d2;
          text-align: center;
          margin: 20px 0 30px 0;
        }
        .laboratorista-info {
          font-size: 11px;
          color: #333;
          margin-bottom: 20px;
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
          font-size: 10px;
        }
        .table th { 
          background-color: #f5f5f5; 
          color: #333; 
          font-weight: bold; 
          font-size: 10px; 
          padding: 8px 6px; 
          text-align: left; 
          border: 1px solid #ddd;
        }
        .table td { 
          font-size: 9px; 
          padding: 6px; 
          border: 1px solid #ddd; 
          vertical-align: top; 
          color: #333; 
          white-space: normal;
          word-wrap: break-word;
        }
        .table tbody tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .event-row { 
          page-break-inside: avoid; 
        }
        @page {
          margin: 5mm 5mm 25mm 5mm;
        }
        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 8px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-agendada {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        }
        .status-creada {
          background-color: rgba(156, 39, 176, 0.1);
          color: #9C27B0;
        }
        .status-completada {
          background-color: rgba(33, 150, 243, 0.1);
          color: #2196F3;
        }
        .status-suspendida {
          background-color: rgba(244, 67, 54, 0.1);
          color: #F44336;
        }
        .status-eliminada {
          background-color: rgba(66, 66, 66, 0.1);
          color: #424242;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="header">
          <div class="header-left">
            <div class="logo-title">
              <img src="${logoBase64}" class="logo" />
              <span class="title">Laboratorio Oficial Pampa Austral</span>
            </div>
          </div>
          <div class="header-right">
            <div><span class="label">Fecha:</span> ${formatDate(fecha)}</div>
            <div><span class="label">Laboratorista:</span> ${laboratorista?.name || 'Nombre y Apellido'}</div>
          </div>
        </div>

        <div class="section">
          <div class="agenda-title">RUTA DIARIA</div>

          <div class="laboratorista-info">
            <strong>Fecha:</strong> ${formatDate(fecha)} - <strong>Laboratorista:</strong> ${laboratorista?.name || 'Nombre y Apellido'}
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 8%;">Hora</th>
                <th style="width: 10%;">Estado</th>
                <th style="width: 15%;">Cliente</th>
                <th style="width: 20%;">Obra</th>
                <th style="width: 10%;">Comuna</th>
                <th style="width: 15%;">Dirección</th>
                <th style="width: 10%;">Referencia / Georreferencia</th>
                <th style="width: 8%;">Servicios</th>
                <th style="width: 12%;">Solicitante</th>
              </tr>
            </thead>
            <tbody>
              ${eventos.map((evento: any) => {
    const horaInicio = formatTime(evento.start)
    const cliente = evento.extendedProps?.cliente?.nombreCliente || 'Nombre Cliente'
    const numeroObra = evento.extendedProps?.obra?.numeroObra || ''
    const nombreObra = evento.extendedProps?.obra?.nombreObra || 'Nombre Obra truncado'
    const obra = numeroObra ? `N° ${numeroObra} - ${nombreObra}` : nombreObra
    const comuna = evento.extendedProps?.comuna || 'Comuna'
    const direccion = evento.extendedProps?.direccion || 'Dirección'
    const estado = evento.extendedProps?.estado || 'AGENDADA'
    const estadoFormateado = formatStatus(estado)
    const solicitante = getSolicitante(evento)

    // Formatear servicios
    const servicios = evento.extendedProps?.servicios || []
    const serviciosText = servicios.map((servicio: any) => {
      if (typeof servicio === 'string') return servicio
      const nombreServicio = servicio.servicio || servicio.nombre || servicio.tipoServicio || servicio.descripcion || 'Servicio'
      const cantidad = servicio.cantidad ? ` (${servicio.cantidad})` : ''
      return `${nombreServicio}${cantidad}`
    }).join('<br>')

    // Determinar clase CSS para el estado
    let statusClass = 'status-agendada'
    switch (estado) {
      case 'CREADA':
        statusClass = 'status-creada'
        break
      case 'COMPLETADA':
        statusClass = 'status-completada'
        break
      case 'SUSPENDIDA':
      case 'SUSPENDIDA_TERRENO':
        statusClass = 'status-suspendida'
        break
      case 'ELIMINADA':
        statusClass = 'status-eliminada'
        break
      default:
        statusClass = 'status-agendada'
    }

    return `
                  <tr class="event-row">
                    <td><strong>${horaInicio}</strong></td>
                    <td>
                      <span class="status-badge ${statusClass}">
                        ${estadoFormateado}
                      </span>
                    </td>
                    <td>${cliente}</td>
                    <td>${obra}</td>
                    <td>${comuna}</td>
                    <td>${direccion}</td>
                    <td>Referencia / Georreferencia</td>
                    <td>${serviciosText || 'Sin servicios'}</td>
                    <td>${solicitante}</td>
                  </tr>
                `
  }).join('')}
            </tbody>
          </table>

          ${eventos.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #999; font-style: italic;">
              No hay visitas programadas para esta fecha
            </div>
          ` : ''}
        </div>
      </div>
    </body>
  </html>
  `
}

