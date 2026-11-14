// app/login/page.tsx

"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  // Destino después de iniciar sesión: el que pidió la página que te
  // mandó al login (por ejemplo el portal de cliente), o el panel si
  // entras directo al login.
  const destinoDespuesDeLogin = () => {
    if (typeof window === "undefined") return "/dashboard";
    const callbackUrl = new URLSearchParams(window.location.search).get(
      "callbackUrl"
    );
    return callbackUrl || "/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Correo o contraseña incorrectos");
        return;
      }
      if (res?.ok) {
        router.push(destinoDespuesDeLogin());
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h2 className="text-3xl font-bold mb-4">Iniciar Sesión</h2>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded border border-red-400 bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <input
          className="border px-3 py-2 rounded"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo"
          required
        />
        <input
          className="border px-3 py-2 rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
        />
        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white py-2 rounded font-bold mt-2 disabled:opacity-50"
        >
          {cargando ? "Ingresando..." : "Iniciar Sesión"}
        </button>
        <button
          type="button"
          onClick={() =>
            signIn("google", { callbackUrl: destinoDespuesDeLogin() })
          }
          className="bg-gray-100 border py-2 rounded font-semibold mt-2"
        >
          Acceder con Google
        </button>
      </form>
    </main>
  );
}
