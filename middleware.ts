// middleware.ts
// Solo los administradores pueden entrar al panel y a las APIs de administración.
// Los clientes usan el portal (/portal/mis-licencias).
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Rutas de API que no requieren ser administrador:
// auth (inicio de sesión), public (validación de licencias desde las apps),
// portal (el cliente ve solo sus licencias) y payments (compra y webhooks).
const RUTAS_LIBRES = ["/api/auth", "/api/public", "/api/portal", "/api/payments"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const esAdmin = token?.role === "admin";

  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!esAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/mis-licencias";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // APIs de administración: todo /api salvo las rutas libres.
  if (pathname.startsWith("/api")) {
    if (RUTAS_LIBRES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    if (!token || !esAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
