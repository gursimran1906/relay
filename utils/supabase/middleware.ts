import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/auth/callback",
    "/auth/auth-code-error",
    "/auth/reset-password",
    "/auth/forgot-password",
  ];

  // Define API routes that don't require authentication
  const publicApiRoutes = ["/api/auth"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicApiRoute = publicApiRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isApiRoute = pathname.startsWith("/api/");

  // If there's an auth error or no user, and it's not a public route
  if ((error || !user) && !isPublicRoute && !isPublicApiRoute) {
    if (isApiRoute) {
      // For API routes, return 401 Unauthorized
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      // For page routes, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
