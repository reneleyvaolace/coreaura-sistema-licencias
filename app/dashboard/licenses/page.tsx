// app/dashboard/licenses/page.tsx
"use client";

import { useState, useEffect } from "react";
import Mensaje from "@/components/Mensaje";

interface License {
  id: string;
  licenseKey: string;
  producto: string;
  usuario: string;
  estado: string;
  fechaCreacion: string;
  planId?: string | null;
  planName?: string | null;
  duration?: string | null;
  fechaExpiracion?: string | null;
  tipo?: string | null;
  clienteId?: string | null;
  licenciaEmpresaId?: string | null;
  maxUsers?: number | null;
}

interface Cliente {
  id: string;
  empresa?: string;
  email?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  active: boolean;
}

function duracionLabel(duration: string): string {
  if (duration === "yearly") return "Anual";
  if (duration === "lifetime") return "De por vida";
  return "Mensual";
}

// Vista previa del vencimiento en el formulario: +1 mes, +1 año, o sin vencimiento.
function vencimientoPreview(duration: string): string | null {
  if (duration === "lifetime") return null;
  const fecha = new Date();
  if (duration === "yearly") {
    fecha.setFullYear(fecha.getFullYear() + 1);
    return fecha.toLocaleDateString("es-MX");
  }
  const dia = fecha.getDate();
  fecha.setDate(1);
  fecha.setMonth(fecha.getMonth() + 1);
  const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  fecha.setDate(Math.min(dia, diasDelMes));
  return fecha.toLocaleDateString("es-MX");
}

export default function LicensesPage() {
  const [licencias, setLicencias] = useState<License[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [newLicense, setNewLicense] = useState({
    producto: "",
    usuario: "",
    estado: "activa",
    planId: "",
    tipo: "usuario",
    clienteId: "",
    licenciaEmpresaId: "",
  });

  useEffect(() => {
    fetchLicenses();
    fetchPlanes();
    fetchClientes();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/licenses");
      const data = await response.json();
      
      if (response.ok) {
        setLicencias(data.licenses);
      } else {
        setMensaje({ tipo: "error", texto: "Error al cargar licencias" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({ tipo: "error", texto: "Error al cargar licencias" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanes = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();
      if (response.ok) {
        setPlanes(data.plans ?? []);
      }
    } catch (error) {
      console.error("Error al cargar planes:", error);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      if (response.ok) {
        setClientes(data.clients ?? []);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  const openCreateModal = () => {
    setEditingLicense(null);
    setNewLicense({ producto: "", usuario: "", estado: "activa", planId: "", tipo: "usuario", clienteId: "", licenciaEmpresaId: "" });
    setShowModal(true);
  };

  const openEditModal = (license: License) => {
    setEditingLicense(license);
    setNewLicense({
      producto: license.producto,
      usuario: license.usuario,
      estado: license.estado,
      planId: license.planId ?? "",
      tipo: license.tipo ?? "usuario",
      clienteId: license.clienteId ?? "",
      licenciaEmpresaId: license.licenciaEmpresaId ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingLicense 
        ? `/api/licenses/${editingLicense.id}` 
        : "/api/licenses";
      
      const method = editingLicense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLicense,
          clienteId: newLicense.clienteId || null,
          licenciaEmpresaId:
            newLicense.tipo === "empresa" ? null : newLicense.licenciaEmpresaId || null,
        }),
      });

      if (response.ok) {
        setMensaje({ tipo: "exito", texto: editingLicense ? "Licencia actualizada exitosamente" : "Licencia creada exitosamente" });
        setShowModal(false);
        setNewLicense({ producto: "", usuario: "", estado: "activa", planId: "", tipo: "usuario", clienteId: "", licenciaEmpresaId: "" });
        fetchLicenses();
      } else {
        setMensaje({ tipo: "error", texto: "Error al guardar licencia" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({ tipo: "error", texto: "Error al guardar licencia" });
    }
  };

  const handleDeleteLicense = async (id: string) => {

    try {
      const response = await fetch(`/api/licenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMensaje({ tipo: "exito", texto: "Licencia eliminada" });
        fetchLicenses();
      } else {
        setMensaje({ tipo: "error", texto: "Error al eliminar licencia" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({ tipo: "error", texto: "Error al eliminar licencia" });
    }
    setConfirmandoEliminar(null);
  };

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando licencias...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Licencias</h1>
      <Mensaje mensaje={mensaje} onCerrar={() => setMensaje(null)} />
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          + Nueva Licencia
        </button>
      </div>

      {licencias.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-600">
          No hay licencias registradas. Crea la primera licencia usando el botón "+ Nueva Licencia".
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded bg-white shadow-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Clave de Licencia</th>
              <th className="py-3 px-4 text-left">Tipo</th>
              <th className="py-3 px-4 text-left">Producto</th>
              <th className="py-3 px-4 text-left">Usuario</th>
              <th className="py-3 px-4 text-left">Plan</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Fecha Creación</th>
              <th className="py-3 px-4 text-left">Vencimiento</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {licencias.map((lic) => (
              <tr key={lic.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-sm">{lic.licenseKey}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      lic.tipo === "empresa"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {lic.tipo === "empresa"
                      ? `Empresa (${lic.maxUsers ?? 1} usuarios)`
                      : "Usuario"}
                  </span>
                </td>
                <td className="py-3 px-4">{lic.producto}</td>
                <td className="py-3 px-4">{lic.usuario}</td>
                <td className="py-3 px-4">
                  {lic.planName
                    ? `${lic.planName} (${duracionLabel(lic.duration ?? "monthly")})`
                    : "Sin plan"}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      lic.estado === "activa"
                        ? "bg-green-100 text-green-800"
                        : lic.estado === "inactiva"
                        ? "bg-gray-100 text-gray-800"
                        : lic.estado === "suspendida"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {lic.estado}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {new Date(lic.fechaCreacion).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  {lic.fechaExpiracion
                    ? new Date(lic.fechaExpiracion).toLocaleDateString()
                    : "Sin vencimiento"}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => openEditModal(lic)}
                    className="text-blue-600 hover:text-blue-800 mr-3 font-semibold"
                  >
                    Editar
                  </button>
                  {confirmandoEliminar !== lic.id && (
                    <button
                      onClick={() => setConfirmandoEliminar(lic.id)}
                      className="text-red-600 hover:text-red-800 font-semibold"
                    >
                      Eliminar
                    </button>
                  )}
                  {confirmandoEliminar === lic.id && (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-sm text-gray-600">¿Seguro?</span>
                      <button
                        onClick={() => handleDeleteLicense(lic.id)}
                        className="text-red-700 hover:text-red-900 font-bold"
                      >
                        Sí, eliminar
                      </button>
                      <button
                        onClick={() => setConfirmandoEliminar(null)}
                        className="text-gray-600 hover:text-gray-800 font-semibold"
                      >
                        Cancelar
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingLicense ? "Editar Licencia" : "Nueva Licencia"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Producto
                </label>
                <input
                  type="text"
                  required
                  value={newLicense.producto}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, producto: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Tipo de licencia
                </label>
                <select
                  value={newLicense.tipo}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, tipo: e.target.value, licenciaEmpresaId: "" })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  <option value="usuario">De usuario</option>
                  <option value="empresa">De empresa (con usuarios incluidos)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Empresa (cliente)
                </label>
                <select
                  value={newLicense.clienteId}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, clienteId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  <option value="">Sin empresa</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.empresa || c.email || c.id}
                    </option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No hay fichas de cliente. Créelas en el módulo Clientes para ligar la licencia a una empresa.
                  </p>
                )}
              </div>
              {newLicense.tipo === "usuario" && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Licencia de empresa (opcional)
                  </label>
                  <select
                    value={newLicense.licenciaEmpresaId}
                    onChange={(e) =>
                      setNewLicense({ ...newLicense, licenciaEmpresaId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  >
                    <option value="">Sin licencia de empresa</option>
                    {licencias
                      .filter((l) => l.tipo === "empresa")
                      .map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.producto} — {l.licenseKey} ({l.maxUsers ?? 1} usuarios)
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  {newLicense.tipo === "empresa" ? "Cliente principal (Email)" : "Usuario (Email)"}
                </label>
                <input
                  type="email"
                  required
                  value={newLicense.usuario}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, usuario: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Plan
                </label>
                <select
                  value={newLicense.planId}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, planId: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  <option value="">Sin plan</option>
                  {planes.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {duracionLabel(plan.duration)} (${plan.price})
                    </option>
                  ))}
                </select>
                {planes.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    No hay planes creados. Créelos en el módulo Planes para elegir uno.
                  </p>
                )}
                {newLicense.planId && (
                  <p className="mt-1 text-xs text-gray-500">
                    {(() => {
                      const plan = planes.find((p) => p.id === newLicense.planId);
                      if (!plan) return "";
                      const vence = vencimientoPreview(plan.duration);
                      const usuarios = (plan as Plan & { maxUsers?: number }).maxUsers ?? 1;
                      const venceTxt = vence
                        ? `Vence el: ${vence}`
                        : "Sin vencimiento (de por vida)";
                      return newLicense.tipo === "empresa"
                        ? `${venceTxt} · Incluye ${usuarios} ${usuarios === 1 ? "usuario" : "usuarios"}`
                        : venceTxt;
                    })()}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Estado
                </label>
                <select
                  value={newLicense.estado}
                  onChange={(e) =>
                    setNewLicense({ ...newLicense, estado: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                  <option value="suspendida">Suspendida</option>
                  <option value="expirada">Expirada</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  {editingLicense ? "Actualizar" : "Crear"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

