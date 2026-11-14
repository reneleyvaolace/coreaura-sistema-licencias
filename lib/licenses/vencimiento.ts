// lib/licenses/vencimiento.ts
import { adminDB } from "@/lib/firebase/admin";

// Calcula la fecha de vencimiento de una licencia según la duración del plan:
// "monthly" -> +1 mes, "yearly" -> +1 año, "lifetime" -> sin vencimiento (null).
export function calcularVencimiento(duration: string, desde: Date): string | null {
  if (duration === "lifetime") return null;

  const fecha = new Date(desde);

  if (duration === "yearly") {
    fecha.setFullYear(fecha.getFullYear() + 1);
    return fecha.toISOString();
  }

  // monthly (por defecto): +1 mes, sin pasarse del último día del mes destino.
  const dia = fecha.getDate();
  fecha.setDate(1);
  fecha.setMonth(fecha.getMonth() + 1);
  const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  fecha.setDate(Math.min(dia, diasDelMes));
  return fecha.toISOString();
}

// Lee un plan de Firestore y devuelve los datos que se guardan en la licencia.
// Devuelve null si el plan no existe.
export async function datosPlanParaLicencia(planId: string, desde: Date) {
  const planDoc = await adminDB.collection("plans").doc(planId).get();
  if (!planDoc.exists) return null;

  const plan = planDoc.data() as { name?: string; duration?: string };
  const duration = plan.duration ?? "monthly";

  return {
    planId,
    planName: plan.name ?? "",
    duration,
    fechaExpiracion: calcularVencimiento(duration, desde),
  };
}

// Etiqueta en español de la duración de un plan.
export function duracionLabel(duration: string): string {
  if (duration === "yearly") return "Anual";
  if (duration === "lifetime") return "De por vida";
  return "Mensual";
}
