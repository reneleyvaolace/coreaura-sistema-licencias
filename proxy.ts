// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api", "/favicon.ico"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acceso libre a rutas públicas
  if (
    PUBLIC_PATHS.some((publicRoute) => pathname.startsWith(publicRoute)) ||
    pathname === "/api/auth/[...nextauth]"
  ) {
    return NextResponse.next();
  }

  // Obtener token de autenticación
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  // Si no hay token, redirigir a login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay token, permitir acceso
  return NextResponse.next();
}

// Define las rutas protegidas
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/(admin|licenses|products|users|settings)/:path*",
    // Agrega aquí otras rutas que quieras proteger
  ],
};
