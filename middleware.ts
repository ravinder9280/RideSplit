import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/', '/how-it-works', '/safety',
    '/sign-in(.*)', '/sign-up(.*)',
    '/api/webhook/clerk(.*)', // allow webhooks
    '/api/healthz(.*)',       // optional health check
]);

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Skip protection for public routes
    if (isPublicRoute(req)) return;

    // Protect everything else
    const { userId, sessionClaims } = await auth();

    // If not signed in, Clerk will handle redirect automatically
    if (!userId) return;

    // Read our lightweight flag from the session token (publicMetadata)
    // NOTE: Your JWT template includes 'publicMetadata' by default in Clerk Next.js
    const publicMetadata = sessionClaims?.publicMetadata as Record<string, unknown> | undefined;
    const onboarded = publicMetadata?.onboarded === true;

    // Don't loop if we're already on /onboarding
    if (!onboarded && !isOnboardingRoute(req)) {
        const url = new URL('/onboarding', req.url);
        return Response.redirect(url, 307);
    }
});

export const config = {
    matcher: [
        // Run on all routes except Next internals & static assets
        '/((?!_next|.*\\.(?:js|css|png|jpg|jpeg|gif|svg|ico|txt|json|webmanifest|map)).*)',
        '/(api|trpc)(.*)',
    ],
};
