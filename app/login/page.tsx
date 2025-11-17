// app/login/page.tsx

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <h2 className="text-3xl font-bold mb-4">Iniciar Sesión</h2>
      <form
        className="flex flex-col gap-4 w-80"
        onSubmit={async (e) => {
          e.preventDefault();
          await signIn("credentials", {
            email,
            password,
            callbackUrl: "/dashboard",
          });
        }}
      >
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
          className="bg-blue-600 text-white py-2 rounded font-bold mt-2"
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => signIn("google")}
          className="bg-gray-100 border py-2 rounded font-semibold mt-2"
        >
          Acceder con Google
        </button>
      </form>
    </main>
  );
}
