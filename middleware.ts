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
  "/api/mobilpay/(.*)",
  "/api/payment/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

