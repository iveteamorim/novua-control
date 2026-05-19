import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "novua_control_session";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/app" ||
    pathname === "/ingestion-preview" ||
    pathname === "/onboarding" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname.startsWith("/alerts/") ||
    pathname.startsWith("/api/incidents/")
  );
}

function isAuthPath(pathname: string) {
  return pathname === "/sign-in" || pathname === "/sign-up";
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (isProtectedPath(pathname) && !hasSession) {
    const signInUrl = new URL("/sign-in", request.url);
    if (pathname !== "/") {
      signInUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPath(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app",
    "/sign-in",
    "/sign-up",
    "/onboarding",
    "/settings",
    "/settings/:path*",
    "/alerts/:path*",
    "/ingestion-preview",
    "/api/incidents/:path*",
  ],
};
