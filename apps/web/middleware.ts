import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login',
  '/register',
  '/auth/callback',
]);

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/login', '/register']);

export default clerkMiddleware(async (auth, req) => {
  try {
    const authObj = await auth();

    // If already signed in and hitting auth pages, send to discovery
    if (authObj.userId && isAuthRoute(req)) {
      return NextResponse.redirect(new URL('/discovery', req.url));
    }

    // Protect all non-public routes
    if (!isPublicRoute(req)) {
      if (!authObj.userId) {
        return authObj.redirectToSignIn({ returnBackUrl: req.url });
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Failsafe so the app doesn't go down entirely from a middleware error
    console.error('Middleware Error:', error);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
