import { auth } from '@/auth'

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const { nextUrl } = req

    // Proteger todas las rutas excepto las públicas
    const isPublicRoute = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/api/auth') ||
        nextUrl.pathname.startsWith('/_next') ||
        nextUrl.pathname.startsWith('/favicon.ico') ||
        nextUrl.pathname.startsWith('/api/') // Permitir todas las APIs por ahora

    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL('/login', nextUrl))
    }

    if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/', nextUrl))
    }
})

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
} 
