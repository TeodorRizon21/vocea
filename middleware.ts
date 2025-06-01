import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/browse",
  "/forum",
  "/api/projects(.*)",
  "/api/topics(.*)",
  "/api/comments(.*)",
  "/project/(.*)",
  "/topic/(.*)",
  "/profile/(.*)",
  "/api/universities",
  "/api/faculties",
  "/api/user",
  "/payment/(.*)",
  "/api/webhooks/clerk",
  "/api/webhooks/(.*)",
  "/api/test/(.*)",
  "/api/uploadthing",
  "/api/uploadthing/(.*)",
  "/api/mobilpay/(.*)",
  "/api/payment/(.*)",
  // Add sign-in and sign-up routes as public
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth check for UploadThing routes
  if (req.nextUrl.pathname.startsWith('/api/uploadthing')) {
    return;
  }

  // Handle Clerk handshake requests
  if (req.nextUrl.searchParams.has('__clerk_handshake')) {
    return;
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

