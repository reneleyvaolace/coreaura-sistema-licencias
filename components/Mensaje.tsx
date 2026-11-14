"use client";

export interface MensajeData {
  tipo: "exito" | "error";
  texto: string;
}

// Aviso dentro de la página (nunca el alert() del navegador).
export default function Mensaje({
  mensaje,
  onCerrar,
}: {
  mensaje: MensajeData | null;
  onCerrar: () => void;
}) {
  if (!mensaje) return null;

  return (
    <div
      className={`mb-6 px-4 py-3 rounded border flex justify-between items-start ${
        mensaje.tipo === "exito"
          ? "bg-green-100 border-green-400 text-green-800"
          : "bg-red-100 border-red-400 text-red-700"
      }`}
      role={mensaje.tipo === "error" ? "alert" : "status"}
    >
      <span>{mensaje.texto}</span>
      <button
        onClick={onCerrar}
        className="ml-4 font-bold leading-none text-xl hover:opacity-70"
        aria-label="Cerrar mensaje"
      >
        ×
      </button>
    </div>
  );
}
