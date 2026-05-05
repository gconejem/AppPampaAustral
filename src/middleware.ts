import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = new Set([
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost'
])

function getAllowedOrigin(request) {
    const origin = request.headers.get('origin')
    return origin && ALLOWED_ORIGINS.has(origin) ? origin : null
}

export function middleware(request) {
    const pathname = request.nextUrl?.pathname || ''

    // Normaliza el login localizado (ej: /en/login) hacia la ruta real /login.
    if (/^\/(en|fr|ar)\/login\/?$/i.test(pathname)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/api')) {
        return NextResponse.next()
    }

    const allowedOrigin = getAllowedOrigin(request)

    // Manejar preflight OPTIONS
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true'
            }
        })
    }

    // Añadir headers CORS a todas las respuestas
    const response = NextResponse.next()
    if (allowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return response
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}
