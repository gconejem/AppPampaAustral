import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-simple'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { to, subject, message, attachments } = body

        if (!to || !subject || !message) {
            return NextResponse.json(
                { error: 'Campos requeridos: to, subject, message' },
                { status: 400 }
            )
        }

        const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .message {
            background: white;
            padding: 20px;
            border-radius: 8px;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Pampa Austral</h1>
          <p style="margin: 0; opacity: 0.9;">Control de Calidad</p>
        </div>
        <div class="content">
          <div class="message">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Pampa Austral. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `

        const emailAttachments = attachments?.map((att: any) => ({
            filename: att.filename,
            content: Buffer.from(att.content, 'base64'),
            contentType: att.contentType || 'application/octet-stream',
            encoding: 'base64'
        })) || []

        const info = await sendEmail({
            to,
            subject,
            html: htmlContent,
            attachments: emailAttachments
        })

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            message: 'Email enviado correctamente'
        })
    } catch (error: any) {
        console.error('❌ Error enviando email:', error)
        return NextResponse.json(
            { error: error.message || 'Error al enviar email' },
            { status: 500 }
        )
    }
}
