// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const [licensesSnapshot, productsSnapshot, usersSnapshot] = await Promise.all([
      adminDB.collection("licenses").get(),
      adminDB.collection("products").get(),
      adminDB.collection("users").get(),
    ]);

    const licenses = licensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const stats = {
      totalLicenses: licenses.length,
      activeLicenses: licenses.filter((l: any) => 
        l.estado === "activa" || l.status === "active" || l.active === true
      ).length,
      totalProducts: products.length,
      activeProducts: products.filter((p: any) => p.active === true).length,
      totalUsers: users.length,
      activeUsers: users.filter((u: any) => u.active === true).length,
      adminUsers: users.filter((u: any) => u.role === "admin").length,
    };

    const recentLicenses = licenses
      .filter((l: any) => l.fechaCreacion || l.createdAt)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.fechaCreacion || a.createdAt).getTime();
        const dateB = new Date(b.fechaCreacion || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((l: any) => ({
        id: l.licenseKey || l.id || "N/A",
        producto: l.producto || l.product || "N/A",
        usuario: l.usuario || l.user || l.email || "N/A",
        fecha: l.fechaCreacion || l.createdAt || new Date().toISOString(),
      }));

    return NextResponse.json({ stats, recentLicenses }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
  }
}
