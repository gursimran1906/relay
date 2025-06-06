import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Allow public access to report pages without any authentication
  if (request.nextUrl.pathname.startsWith("/report/")) {
    return NextResponse.next();
  }

  // Allow public access to API routes for report submission
  if (request.nextUrl.pathname.startsWith("/api/report-issue")) {
    return NextResponse.next();
  }

  // update user's auth session for all other routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/* (all auth routes including login, signup, callback, etc.)
     * - api/auth/* (auth API routes)
     * - public assets (images, etc.)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|auth|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
