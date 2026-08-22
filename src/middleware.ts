import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "chattm_session";
const ROLE_COOKIE = "chattm_role";

const AUTH_PAGES = new Set(["/login", "/signup"]);
const PUBLIC_PAGES = new Set(["/login", "/signup", "/admin/login", "/forgot-password"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PAGES.has(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const isAdmin = role === "ADMIN";

  if (!token && pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (!token && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL(isAdmin ? "/admin" : "/", request.url));
  }

  if (token && pathname === "/admin/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (token && pathname.startsWith("/admin") && pathname !== "/admin/login" && !isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
