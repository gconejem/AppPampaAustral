interface ServiceCompletionEmailProps {
  clientName: string
  fecha: string
  hora: string
  projectName: string
  projectLocation: string
  tecnicoName: string
  recepcionName: string
  orders: Array<{
    correlativo: string
    descripcion: string
    formato: string
  }>
}

export function getServiceCompletionEmailTemplate(props: ServiceCompletionEmailProps): string {
  const {
    clientName,
    fecha,
    hora,
    projectName,
    projectLocation,
    tecnicoName,
    recepcionName,
    orders
  } = props

  const ordersTableRows = orders.map(order => `
    <tr>
      <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center; background-color: #f8f9fa;">${order.correlativo}</td>
      <td style="padding: 12px; border: 1px solid #dee2e6;">${order.descripcion}</td>
      <td style="padding: 12px; border: 1px solid #dee2e6; text-align: center;">${order.formato}</td>
    </tr>
  `).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Servicios - Pampa Austral</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
          <td align="center">
            <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">
                    🏢 PAMPA AUSTRAL
                  </h1>
                  <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">
                    Laboratorio Oficial Acreditado INN-CHILE
                  </p>
                </td>
              </tr>

              <!-- Saludo con cliente dinámico -->
              <tr>
                <td style="padding: 30px 40px 20px;">
                  <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">
                    Estimado <strong>${clientName}</strong>,
                  </p>
                </td>
              </tr>

              <!-- Mensaje con datos dinámicos -->
              <tr>
                <td style="padding: 0 40px 20px;">
                  <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.8; text-align: justify;">
                    Junto con saludar le informamos que con fecha <strong>${fecha}</strong>, a las <strong>${hora}</strong> hrs 
                    hemos recibido exitosamente el registro de los servicios realizados en su obra <strong>${projectName}</strong>, 
                    ubicada en <strong>${projectLocation}</strong>.
                  </p>
                </td>
              </tr>

              <!-- Título de Tabla -->
              <tr>
                <td style="padding: 20px 40px 10px;">
                  <p style="margin: 0; font-size: 15px; color: #333; font-weight: bold;">
                    Las Órdenes de Trabajo completadas son:
                  </p>
                </td>
              </tr>

              <!-- Tabla de Órdenes -->
              <tr>
                <td style="padding: 10px 40px 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 2px solid #667eea;">
                    <thead>
                      <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <th style="padding: 15px; color: #ffffff; font-size: 14px; font-weight: bold; text-align: center; border: 1px solid #5a67d8; width: 15%;">N°</th>
                        <th style="padding: 15px; color: #ffffff; font-size: 14px; font-weight: bold; text-align: left; border: 1px solid #5a67d8; width: 55%;">Descripción</th>
                        <th style="padding: 15px; color: #ffffff; font-size: 14px; font-weight: bold; text-align: center; border: 1px solid #5a67d8; width: 30%;">Formato</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ordersTableRows}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Nota sobre PDFs -->
              <tr>
                <td style="padding: 10px 40px 20px;">
                  <div style="background-color: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 13px; color: #1976d2; line-height: 1.6; text-align: justify;">
                      📎 Adjunto encontrará órdenes de trabajo digitales en formato PDF. Aquellas que hayan sido 
                      emitidas en formato papel, la copia del documento corresponde a la entregada por nuestro 
                      Laboratorista en terreno al término del servicio.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Información del Servicio -->
              <tr>
                <td style="padding: 10px 40px 20px;">
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                    <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">
                      El servicio fue realizado por nuestro técnico: <strong style="color: #667eea;">${tecnicoName}</strong> 
                      y fue recepcionado conforme por: <strong style="color: #667eea;">${recepcionName}</strong>
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Contacto -->
              <tr>
                <td style="padding: 10px 40px 20px;">
                  <p style="margin: 0 0 15px; font-size: 14px; color: #555; line-height: 1.8; text-align: justify;">
                    Ante dudas o consultas sobre este detalle por favor responder este correo con sus observaciones 
                    o sírvase llamar al <strong style="color: #667eea;">+56 42-223 82 90</strong> | 
                    <strong style="color: #667eea;">+56 42-224 02 55</strong> haciendo referencia a su Obra, 
                    N° de OT del servicio realizado.
                  </p>
                  <ul style="margin: 15px 0; padding-left: 20px; font-size: 14px; color: #555; line-height: 1.8;">
                    <li style="margin-bottom: 8px;">
                      Para dudas de <strong>carácter técnico</strong> ya sea de sus servicios o Informes oficiales, favor escribir a 
                      <a href="mailto:operaciones@pampaustral.cl" style="color: #667eea; text-decoration: none; font-weight: bold;">operaciones@pampaustral.cl</a>
                    </li>
                    <li>
                      Para conocer el <strong>estado de sus Informes Oficiales</strong>, favor escribir a 
                      <a href="mailto:info@pampaustral.cl" style="color: #667eea; text-decoration: none; font-weight: bold;">info@pampaustral.cl</a>
                    </li>
                  </ul>
                </td>
              </tr>

              <!-- Separador -->
              <tr>
                <td style="padding: 20px 40px 10px;">
                  <hr style="border: none; border-top: 2px solid #dee2e6; margin: 0;">
                </td>
              </tr>

              <!-- Firma -->
              <tr>
                <td style="padding: 20px 40px 10px;">
                  <p style="margin: 0 0 5px; font-size: 14px; color: #333;">Atentamente,</p>
                  <p style="margin: 5px 0; font-size: 16px; color: #667eea; font-weight: bold;">Laboratorio Pampa Austral Ltda.</p>
                  <p style="margin: 5px 0; font-size: 13px; color: #666; font-style: italic;">Laboratorio Oficial Acreditado INN-CHILE</p>
                  <p style="margin: 10px 0 0;">
                    <a href="https://www.pampaustral.cl" 
                       style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: bold;">
                      🌐 www.pampaustral.cl
                    </a>
                  </p>
                </td>
              </tr>

              <!-- Notas Legales -->
              <tr>
                <td style="padding: 20px 40px 30px;">
                  <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px;">
                    <p style="margin: 0 0 12px; font-size: 11px; color: #856404; line-height: 1.7; text-align: justify;">
                      <strong>Nota 1:</strong> Los resultados y/o emisión de Informes Oficiales serán entregados contra pago de facturas asociadas al servicio.
                    </p>
                    <p style="margin: 12px 0; font-size: 11px; color: #856404; line-height: 1.7; text-align: justify;">
                      <strong>Nota 2:</strong> Recibido el Informe Oficial, el cliente tiene un plazo de <strong>48 horas hábiles</strong> para efectuar observaciones, 
                      transcurrido dicho plazo y si no se reciben observaciones, dicho documento se dará por aprobado.
                    </p>
                    <p style="margin: 12px 0 0; font-size: 11px; color: #856404; line-height: 1.7; text-align: justify;">
                      <strong>Nota 3:</strong> Para Estudios de Mecánica de suelo, una vez recibido, el cliente tiene un plazo de <strong>3 meses</strong> 
                      para efectuar observaciones, transcurrido dicho plazo y si no se reciben observaciones, dicho documento se dará por aprobado.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #dee2e6;">
                  <p style="margin: 0 0 5px; font-size: 12px; color: #999;">
                    © ${new Date().getFullYear()} Laboratorio Pampa Austral Ltda. Todos los derechos reservados.
                  </p>
                  <p style="margin: 5px 0 0; font-size: 11px; color: #bbb;">
                    Este es un email automático. Si recibió este correo por error favor ignorar.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
