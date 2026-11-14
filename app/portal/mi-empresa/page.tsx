// app/portal/mi-empresa/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";

type Empresa = {
  id: string;
  empresa?: string;
  razonSocial?: string;
  rfc?: string;
  email?: string;
};

type Licencia = {
  id: string;
  licenseKey?: string;
  producto?: string;
  usuario?: string;
  estado?: string;
  planName?: string | null;
  duration?: string | null;
  fechaCreacion?: string;
  fechaExpiracion?: string | null;
  tipo?: string | null;
  maxUsers?: number | null;
};

type Usuario = {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
};

type Resumen = {
  empresa: Empresa | null;
  licenciasEmpresa: Licencia[];
  licenciasUsuario: Licencia[];
  usuarios: Usuario[];
  asientos: { usados: number; totales: number };
};

function perfilLabel(role: string): string {
  if (role === "company_admin") return "Administrador de empresa";
  if (role === "user") return "Operador";
  if (role === "auditor") return "Finanzas";
  if (role === "viewer") return "Consulta";
  if (role === "admin") return "Administrador CoreAura";
  return "Cliente";
}

function fmtFecha(iso?: string | null): string {
  if (!iso) return "Sin vencimiento";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX");
}

export default function MiEmpresaPage() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [sinAcceso, setSinAcceso] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    perfil: "user",
    password: "",
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/empresa");
      if (res.status === 401) {
        setNeedsLogin(true);
        return;
      }
      if (res.status === 403) {
        setSinAcceso(true);
        return;
      }
      if (!res.ok) {
        setMensaje({ tipo: "error", texto: "No se pudo cargar tu empresa" });
        return;
      }
      const data = await res.json();
      setResumen(data);
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo contactar el servidor" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ nombre: "", email: "", perfil: "user", password: "" });
    setShowModal(true);
  };

  const openEditModal = (u: Usuario) => {
    setEditingUser(u);
    setFormData({ nombre: u.name, email: u.email, perfil: u.role, password: "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser
        ? `/api/portal/empresa/usuarios/${editingUser.id}`
        : "/api/portal/empresa";
      const method = editingUser ? "PUT" : "POST";
      const body: Record<string, unknown> = editingUser
        ? { name: formData.nombre, role: formData.perfil }
        : {
            nombre: formData.nombre,
            email: formData.email,
            perfil: formData.perfil,
            password: formData.password,
          };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMensaje({
          tipo: "exito",
          texto: editingUser
            ? "Usuario actualizado exitosamente"
            : `Usuario creado exitosamente. Su licencia es ${data.licenseKey ?? ""}`,
        });
        setShowModal(false);
        load();
      } else {
        setMensaje({ tipo: "error", texto: data.error || "Error al guardar el usuario" });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al guardar el usuario" });
    }
  };

  const handleToggleActive = async (u: Usuario) => {
    try {
      const res = await fetch(`/api/portal/empresa/usuarios/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      if (res.ok) {
        setMensaje({
          tipo: "exito",
          texto: u.active ? "Usuario desactivado" : "Usuario activado",
        });
        load();
      } else {
        setMensaje({ tipo: "error", texto: "Error al cambiar el estado" });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al cambiar el estado" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/portal/empresa/usuarios/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMensaje({ tipo: "exito", texto: "Usuario eliminado" });
        load();
      } else {
        setMensaje({ tipo: "error", texto: "Error al eliminar el usuario" });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error al eliminar el usuario" });
    }
    setConfirmandoEliminar(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Mi empresa</h1>
      <p className="mt-1 text-sm text-gray-500">
        Licencias de tu empresa y los usuarios que las usan.
      </p>

      {mensaje && (
        <div
          className={`mt-4 flex items-start justify-between rounded-xl border p-4 text-sm ${
            mensaje.tipo === "exito"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span>{mensaje.texto}</span>
          <button
            onClick={() => setMensaje(null)}
            className="ml-4 font-bold"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}

      {needsLogin && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-gray-900">Inicia sesión para ver tu empresa</p>
          <a
            href="/login?callbackUrl=/portal/mi-empresa"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir a iniciar sesión
          </a>
        </div>
      )}

      {sinAcceso && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="font-semibold text-gray-900">
            Solo el administrador de la empresa puede ver esta sección
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Si eres el administrador de tu empresa, pide que te asignen ese perfil.
          </p>
        </div>
      )}

      {loading && !needsLogin && !sinAcceso && (
        <p className="mt-6 text-sm text-gray-500">Cargando tu empresa...</p>
      )}

      {!loading && !needsLogin && !sinAcceso && resumen && (
        <div>
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {resumen.empresa?.empresa || resumen.empresa?.razonSocial || "Tu empresa"}
            </h2>
            {resumen.empresa?.rfc && (
              <p className="mt-1 text-sm text-gray-500">RFC: {resumen.empresa.rfc}</p>
            )}
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                Usuarios: {resumen.asientos.usados} de {resumen.asientos.totales} licencias
                de usuario en uso
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gray-900"
                  style={{
                    width: `${resumen.asientos.totales > 0 ? Math.round((resumen.asientos.usados / resumen.asientos.totales) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </section>

          {resumen.licenciasEmpresa.length > 0 && (
            <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900">Licencia de empresa</h2>
              {resumen.licenciasEmpresa.map((lic) => (
                <dl key={lic.id} className="mt-3 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <dt>Producto</dt>
                    <dd className="font-semibold text-gray-900">{lic.producto}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Plan</dt>
                    <dd>{lic.planName || "Sin plan"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Usuarios incluidos</dt>
                    <dd>{lic.maxUsers ?? 1}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Vencimiento</dt>
                    <dd>{fmtFecha(lic.fechaExpiracion)}</dd>
                  </div>
                </dl>
              ))}
            </section>
          )}

          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">Usuarios de la empresa</h2>
              <button
                onClick={openCreateModal}
                disabled={resumen.asientos.usados >= resumen.asientos.totales}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                + Nuevo usuario
              </button>
            </div>
            {resumen.asientos.usados >= resumen.asientos.totales && (
              <p className="mt-2 text-sm text-gray-500">
                Ya no tienes licencias de usuario disponibles. Para agregar más usuarios,
                amplía tu plan.
              </p>
            )}
            {resumen.usuarios.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Aún no hay usuarios en tu empresa. Crea el primero con el botón de arriba.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {resumen.usuarios.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-500">
                        {u.email} · {perfilLabel(u.role)} · {u.active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-sm font-semibold text-gray-900 underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="text-sm font-semibold text-gray-600 underline"
                      >
                        {u.active ? "Desactivar" : "Activar"}
                      </button>
                      {confirmandoEliminar !== u.id ? (
                        <button
                          onClick={() => setConfirmandoEliminar(u.id)}
                          className="text-sm font-semibold text-red-600 underline"
                        >
                          Eliminar
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <span className="text-gray-600">¿Seguro?</span>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="font-bold text-red-700 underline"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            onClick={() => setConfirmandoEliminar(null)}
                            className="font-semibold text-gray-600 underline"
                          >
                            Cancelar
                          </button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900">Licencias de usuario</h2>
            {resumen.licenciasUsuario.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Aún no hay licencias de usuario asignadas.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {resumen.licenciasUsuario.map((lic) => (
                  <li
                    key={lic.id}
                    className="flex flex-wrap justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <span>{lic.usuario}</span>
                    <span className="font-mono text-xs">{lic.licenseKey}</span>
                    <span>{lic.planName || "Sin plan"}</span>
                    <span>{lic.estado}</span>
                    <span>{fmtFecha(lic.fechaExpiracion)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="mb-4">
                <label className="mb-2 block font-semibold text-gray-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-800"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block font-semibold text-gray-700">Correo</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  disabled={!!editingUser}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-800"
                  placeholder="usuario@empresa.com"
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block font-semibold text-gray-700">Perfil</label>
                <select
                  value={formData.perfil}
                  onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-800"
                >
                  <option value="company_admin">Administrador de empresa</option>
                  <option value="user">Operador</option>
                  <option value="auditor">Finanzas</option>
                  <option value="viewer">Consulta</option>
                </select>
              </div>
              {!editingUser && (
                <div className="mb-4">
                  <label className="mb-2 block font-semibold text-gray-700">
                    Contraseña temporal
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-800"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Compártela con el usuario; podrá cambiarla después.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded bg-gray-900 py-2 font-semibold text-white"
                >
                  {editingUser ? "Actualizar" : "Crear usuario"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded bg-gray-300 py-2 font-semibold text-gray-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
