import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/access-denied'])

export default clerkMiddleware(async (auth, request) => {
    // Protection spécifique pour /admin-panel
    if (request.nextUrl.pathname.startsWith('/admin-panel')) {
        if (!auth.userId) {
            return NextResponse.redirect(new URL('/sign-in', request.url))
        }

        const email = auth.sessionClaims?.email as string
        if (!email) {
            return NextResponse.redirect(new URL('/access-denied', request.url))
        }

        try {
            const roleResponse = await fetch(`${request.nextUrl.origin}/api/users/role?email=${encodeURIComponent(email)}`)
            const { role } = await roleResponse.json()

            if (role !== 'admin' && role !== 'enseignant') {
                return NextResponse.redirect(new URL('/access-denied', request.url))
            }
        } catch (error) {
            return NextResponse.redirect(new URL('/access-denied', request.url))
        }
    }

    if (!isPublicRoute(request)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}