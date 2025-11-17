// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    // Asegurarnos que solo un admin pueda ver TODAS las transacciones
    if (!token) {
       return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Opcional: Verificar rol de admin
    // if (token.role !== 'admin') {
    //   return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    // }

    const transactionsSnapshot = await adminDB
      .collection("transactions")
      .orderBy("createdAt", "desc") // Ordenar por más recientes
      .get();
      
    const transactions = transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ transactions }, { status: 200 });

  } catch (error: any) {
    console.error("Error al obtener transacciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}