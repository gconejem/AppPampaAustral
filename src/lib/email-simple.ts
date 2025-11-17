import nodemailer from 'nodemailer'

interface EmailOptions {
    to: string | string[]
    subject: string
    html: string
    attachments?: Array<{
        filename: string
        path?: string
        content?: Buffer | string
        encoding?: string
    }>
}

export async function sendEmail(options: EmailOptions) {
    console.log('📧 Iniciando envío de email...')
    console.log('📧 Usuario:', process.env.GMAIL_USER)
    console.log('📧 Destinatarios:', options.to)

    // ✅ CAMBIO: Usar nodemailer.createTransport (sin "er" al final)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        },
        tls: {
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

    const mailOptions = {
        from: {
            name: process.env.EMAIL_FROM_NAME || 'Pampa Austral',
            address: process.env.GMAIL_USER || ''
        },
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
    }

    console.log('📤 Enviando email...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado. Message ID:', info.messageId)

    return info
}
