import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"

// Définir les routes publiques
const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/access-denied'
])

export default clerkMiddleware(async (auth, request) => {
    // Pour les routes non publiques, utiliser auth.protect()
    if (!isPublicRoute(request)) {
        await auth.protect()
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
        '/(api|trpc)(.*)',
    ],
}