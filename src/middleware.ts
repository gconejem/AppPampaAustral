import { NextResponse } from 'next/server'

export function middleware(request) {
    // Manejar preflight OPTIONS
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://localhost',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
        })
    }

    // Añadir headers CORS a todas las respuestas
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', 'https://localhost')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    
    return response
}

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
}
