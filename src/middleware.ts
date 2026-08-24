import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "chattm_session";
const ROLE_COOKIE = "chattm_role";

const AUTH_PAGES = new Set(["/login", "/signup"]);

const PUBLIC_PAGES = new Set([
  "/login",
  "/signup",
  "/admin/login",
  "/forgot-password",
]);

function isPublicPath(pathname: string) {
  return PUBLIC_PAGES.has(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  const isAdmin = role === "ADMIN";
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";

  /*
   * =========================================================
   * 1. ADMIN SESSION
   * =========================================================
   *
   * If an ADMIN is logged in, they are allowed to stay
   * inside /admin routes only.
   *
   * Example:
   * /admin
   * /admin/users
   * /admin/posts
   * /admin/reports
   * /admin/settings
   */

  if (token && isAdmin) {
    // Admin should never go back to normal login/signup
    if (AUTH_PAGES.has(pathname)) {
      return NextResponse.redirect(
        new URL("/admin", request.url),
      );
    }

    // Admin should not open admin login after already logged in
    if (isAdminLogin) {
      return NextResponse.redirect(
        new URL("/admin", request.url),
      );
    }

    /*
     * IMPORTANT:
     * Admin is NOT allowed to access public/user pages.
     *
     * Anything that is not /admin is redirected back
     * to the admin dashboard.
     */
    if (!isAdminRoute && !pathname.startsWith("/api/")) {
      return NextResponse.redirect(
        new URL("/admin", request.url),
      );
    }

    return NextResponse.next();
  }

  /*
   * =========================================================
   * 2. ADMIN ROUTES WITHOUT LOGIN
   * =========================================================
   */

  if (!token && isAdminRoute && !isAdminLogin) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url),
    );
  }

  /*
   * =========================================================
   * 3. NORMAL USER TRYING TO ACCESS ADMIN
   * =========================================================
   */

  if (
    token &&
    isAdminRoute &&
    !isAdminLogin &&
    !isAdmin
  ) {
    return NextResponse.redirect(
      new URL("/", request.url),
    );
  }

  /*
   * =========================================================
   * 4. ADMIN LOGIN
   * =========================================================
   */

  if (
    token &&
    isAdminLogin &&
    !isAdmin
  ) {
    return NextResponse.redirect(
      new URL("/", request.url),
    );
  }

  /*
   * =========================================================
   * 5. NORMAL USER AUTH PAGES
   * =========================================================
   */

  if (token && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(
      new URL("/", request.url),
    );
  }

  /*
   * =========================================================
   * 6. NORMAL USER / PUBLIC AUTH
   * =========================================================
   */

  if (!token && !isPublicPath(pathname)) {
    const loginUrl = new URL(
      "/login",
      request.url,
    );

    loginUrl.searchParams.set(
      "next",
      pathname,
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};