import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-simple'
import { getServiceCompletionEmailTemplate } from '@/lib/email-templates'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            to,
            attachments,
            // ✅ AGREGAR ESTOS CAMPOS
            clientName,
            fecha,
            hora,
            projectName,
            projectLocation,
            tecnicoName,
            recepcionName,
            orders
        } = body

        console.log('📧 Preparando email para:', to)
        console.log('📎 Archivos adjuntos recibidos:', attachments?.length || 0)

        // Validar email
        if (!to) {
            return NextResponse.json(
                { error: 'Falta campo requerido: to' },
                { status: 400 }
            )
        }

        // Asunto fijo
        const subject = 'Laboratorio Pampa Austral - Notificación de servicio'

        // ✅ GENERAR HTML CON DATOS DINÁMICOS
        const htmlContent = getServiceCompletionEmailTemplate({
            clientName,
            fecha,
            hora,
            projectName,
            projectLocation,
            tecnicoName,
            recepcionName,
            orders
        })

        // Procesar attachments
        const emailAttachments = attachments?.map((att: any) => {
            console.log('📎 Procesando adjunto:', att.filename)
            return {
                filename: att.filename,
                content: att.content,
                contentType: att.contentType || 'application/pdf',
                encoding: 'base64'
            }
        }) || []

        console.log('📤 Enviando email con', emailAttachments.length, 'adjunto(s)...')

        // Enviar email
        const info = await sendEmail({
            to,
            subject,
            html: htmlContent,
            attachments: emailAttachments
        })

        console.log('✅ Email enviado:', info.messageId)

        return NextResponse.json({
            success: true,
            messageId: info.messageId,
            message: 'Email enviado correctamente',
            attachmentsCount: emailAttachments.length
        })
    } catch (error: any) {
        console.error('❌ Error enviando email:', error)
        return NextResponse.json(
            { error: error.message || 'Error al enviar email' },
            { status: 500 }
        )
    }
}
