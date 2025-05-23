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
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip auth check for UploadThing routes
  if (req.nextUrl.pathname.startsWith('/api/uploadthing')) {
    return;
  }
  
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

