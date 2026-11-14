// app/dashboard/clientes/page.tsx
"use client";

import { useState, useEffect, Fragment } from "react";
import type { ClienteResumen } from "@/lib/crm/clients";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteResumen | null>(null);
  const [formData, setFormData] = useState({
    empresa: "",
    razonSocial: "",
    rfc: "",
    regimenFiscal: "",
    codigoPostal: "",
    contacto: "",
    email: "",
    telefono: "",
    notas: "",
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/clientes");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Error al cargar los clientes.");
      }
      const data = await response.json();
      setClientes(data.clientes);
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los clientes.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCliente(null);
    setFormData({
      empresa: "",
      razonSocial: "",
      rfc: "",
      regimenFiscal: "",
      codigoPostal: "",
      contacto: "",
      email: "",
      telefono: "",
      notas: "",
    });
    setShowModal(true);
  };

  // Editar abre la ficha del cliente; si aún no tiene ficha, abre el alta
  // con el correo ya puesto.
  const openEditModal = (c: ClienteResumen) => {
    setEditingCliente(c);
    setFormData({
      empresa: c.ficha?.empresa ?? "",
      razonSocial: c.ficha?.razonSocial ?? "",
      rfc: c.ficha?.rfc ?? c.rfc ?? "",
      regimenFiscal: c.ficha?.regimenFiscal ?? "",
      codigoPostal: c.ficha?.codigoPostal ?? "",
      contacto: c.ficha?.contacto ?? "",
      email: c.email,
      telefono: c.ficha?.telefono ?? "",
      notas: c.ficha?.notas ?? "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url =
        editingCliente?.ficha
          ? `/api/clients/${editingCliente.ficha.id}`
          : "/api/clients";
      const method = editingCliente?.ficha ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        alert(
          editingCliente?.ficha
            ? "Cliente actualizado exitosamente"
            : "Cliente creado exitosamente"
        );
        setShowModal(false);
        fetchClientes();
      } else {
        alert(data.error || "Error al guardar el cliente");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al guardar el cliente");
    }
  };

  const handleDelete = async (c: ClienteResumen) => {
    if (!c.ficha) return;
    if (!confirm(`¿Estás seguro de eliminar la ficha de ${c.nombre || c.email}?`)) return;

    try {
      const response = await fetch(`/api/clients/${c.ficha.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (response.ok) {
        alert("Cliente eliminado");
        fetchClientes();
      } else {
        alert(data.error || "Error al eliminar el cliente");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Error al eliminar el cliente");
    }
  };

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filtrados = clientes.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      c.email.toLowerCase().includes(q) ||
      (c.nombre ?? "").toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando clientes...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-2 text-gray-800">Clientes y empresas</h1>
      <p className="text-gray-600 mb-6">
        {clientes.length} {clientes.length === 1 ? "cliente" : "clientes"} ·{" "}
        {(() => {
          const activas = clientes.reduce((acc, c) => acc + c.licenciasActivas, 0);
          return `${activas} licencia${activas === 1 ? "" : "s"} activa${activas === 1 ? "" : "s"}`;
        })()}
      </p>

      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          + Nuevo Cliente
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full max-w-md border border-gray-300 rounded px-4 py-2 text-gray-800 outline-none focus:border-blue-500"
        />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-600">
          {clientes.length === 0
            ? "No hay clientes todavía. Aparecerán aquí cuando alguien tenga una cuenta, una licencia o un pago."
            : "Ningún cliente coincide con la búsqueda."}
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded shadow-sm overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-3 px-4 text-left">Cliente</th>
                <th className="py-3 px-4 text-left">Licencias</th>
                <th className="py-3 px-4 text-left">Planes</th>
                <th className="py-3 px-4 text-left">Próximo vencimiento</th>
                <th className="py-3 px-4 text-left">Total pagado</th>
                <th className="py-3 px-4 text-left">Última actividad</th>
                <th className="py-3 px-4 text-left">Licencias</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {filtrados.map((c) => (
                <Fragment key={c.email}>
                  <tr className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{c.nombre || "Sin nombre"}</div>
                      <div className="text-sm text-gray-500">{c.email}</div>
                      {c.rfc && (
                        <div className="text-xs text-gray-500 font-mono">RFC: {c.rfc}</div>
                      )}
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          c.activo === false
                            ? "bg-red-100 text-red-800"
                            : c.activo === true
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {c.activo === false
                          ? "Inactivo"
                          : c.activo === true
                            ? "Activo"
                            : "Sin cuenta"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.licencias.length} en total
                      <div className="text-sm text-gray-500">
                        {c.licenciasActivas} activa{c.licenciasActivas === 1 ? "" : "s"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {c.planes.length > 0 ? c.planes.join(", ") : "—"}
                    </td>
                    <td className="py-3 px-4">{formatFecha(c.proximoVencimiento)}</td>
                    <td className="py-3 px-4">
                      {c.totales.length > 0
                        ? c.totales
                            .map(
                              (t) =>
                                `$${t.total.toLocaleString("es-MX", { minimumFractionDigits: 2 })} ${t.moneda}`
                            )
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="py-3 px-4">{formatFecha(c.ultimaActividad)}</td>
                    <td className="py-3 px-4">
                      {c.licencias.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandido(expandido === c.email ? null : c.email)
                          }
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          {expandido === c.email ? "Ocultar" : "Ver licencias"}
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openEditModal(c)}
                        className="text-blue-600 hover:text-blue-800 mr-3 font-semibold"
                      >
                        Editar
                      </button>
                      {c.ficha && (
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandido === c.email && (
                    <tr key={`${c.email}-detalle`} className="border-t border-gray-200 bg-gray-50">
                      <td colSpan={8} className="py-4 px-6">
                        <table className="w-full">
                          <thead>
                            <tr className="text-xs uppercase text-gray-500">
                              <th className="py-2 px-3 text-left">Producto</th>
                              <th className="py-2 px-3 text-left">Clave</th>
                              <th className="py-2 px-3 text-left">Estado</th>
                              <th className="py-2 px-3 text-left">Plan</th>
                              <th className="py-2 px-3 text-left">Vencimiento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.licencias.map((lic) => (
                              <tr key={lic.id} className="border-t border-gray-200">
                                <td className="py-2 px-3 font-semibold">{lic.producto}</td>
                                <td className="py-2 px-3 font-mono text-xs">{lic.clave}</td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                      lic.estado === "activa"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {lic.estado || "—"}
                                  </span>
                                </td>
                                <td className="py-2 px-3">{lic.planName || "—"}</td>
                                <td className="py-2 px-3">
                                  {lic.fechaExpiracion
                                    ? formatFecha(lic.fechaExpiracion)
                                    : "Sin vencimiento"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingCliente?.ficha ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Empresa *</label>
                <input
                  type="text"
                  required
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Nombre comercial de la empresa"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Razón social</label>
                <input
                  type="text"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Razón social fiscal, sin régimen societario"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">RFC</label>
                  <input
                    type="text"
                    value={formData.rfc}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 font-mono"
                    placeholder="XAXX010101000"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Régimen fiscal</label>
                  <input
                    type="text"
                    value={formData.regimenFiscal}
                    onChange={(e) => setFormData({ ...formData, regimenFiscal: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800 font-mono"
                    placeholder="601"
                    maxLength={3}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Código postal</label>
                  <input
                    type="text"
                    value={formData.codigoPostal}
                    onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                    placeholder="15900"
                    maxLength={5}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                    placeholder="55 0000 0000"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Nombre de la persona de contacto"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="contacto@empresa.com"
                  disabled={!!editingCliente}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Notas internas sobre el cliente..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  {editingCliente?.ficha ? "Actualizar" : "Crear"}
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
