import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string
    subject: string
    html: string
    attachments?: Array<{
        filename: string
        content: string | Buffer
        contentType?: string
        encoding?: string
    }>
}

export async function sendEmail(options: EmailOptions) {
    console.log('📧 Iniciando envío de email...')
    console.log('📧 Usuario:', process.env.GMAIL_USER)
    console.log('📧 Destinatarios:', options.to)
    console.log('📎 Adjuntos:', options.attachments?.length || 0)

    // Configurar transporte con TLS config
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
            // No rechazar certificados no autorizados (solo para desarrollo)
            rejectUnauthorized: false
        }
    })

    // Verificar conexión
    try {
        await transporter.verify()
        console.log('✅ Conexión SMTP verificada')
    } catch (error) {
        console.error('❌ Error verificando conexión SMTP:', error)
        throw error
    }

    // Preparar mensaje
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Pampa Austral'}" <${process.env.GMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
    }

    console.log('📤 Enviando email...')

    // Enviar email
    const info = await transporter.sendMail(mailOptions)

    console.log('✅ Email enviado. Message ID:', info.messageId)

    if (options.attachments && options.attachments.length > 0) {
        console.log('📎 Adjuntos enviados:', options.attachments.map(a => a.filename).join(', '))
    }

    return info
}
