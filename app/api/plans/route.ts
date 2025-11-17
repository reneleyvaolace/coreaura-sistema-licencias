// app/api/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDB } from "@/lib/firebase/admin";
import { getToken } from "next-auth/jwt";

// GET: Listar todos los planes
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const plansSnapshot = await adminDB.collection("plans").get();
    const plans = plansSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ plans }, { status: 200 });
  } catch (error) {
    console.error("Error al obtener planes:", error);
    return NextResponse.json({ error: "Error al obtener planes" }, { status: 500 });
  }
}

// POST: Crear nuevo plan
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, price, duration, features = [], active = true } = body;

    if (!name || !price || !duration) {
      return NextResponse.json(
        { error: "Name, price y duration son requeridos" },
        { status: 400 }
      );
    }

    const newPlan = {
      name,
      price: parseFloat(price),
      duration, // "monthly", "yearly", "lifetime"
      features,
      active,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDB.collection("plans").add(newPlan);

    return NextResponse.json(
      { message: "Plan creado", id: docRef.id, plan: newPlan },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear plan:", error);
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 });
  }
}
