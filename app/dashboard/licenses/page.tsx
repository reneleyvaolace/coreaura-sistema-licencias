// app/dashboard/licenses/page.tsx
"use client";

import { useState, useEffect } from "react";

interface License {
  id: string;
  licenseKey: string;
  producto: string;
  usuario: string;
  estado: string;
  fechaCreacion: string;
}

export default function LicensesPage() {
  const [licencias, setLicencias] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [newLicense, setNewLicense] = useState({
    producto: "",
    usuario: "",
    estado: "activa",
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/licenses");
      const data = await response.json();
      
      if (response.ok) {
        setLicencias(data.licenses);
      } else {
        alert("Error al cargar licencias");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar licencias");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLicense(null);
    setNewLicense({ producto: "", usuario: "", estado: "activa" });
    setShowModal(true);
  };

  const openEditModal = (license: License) => {
    setEditingLicense(license);
    setNewLicense({
      producto: license.producto,
      usuario: license.usuario,
      estado: license.estado,
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
        body: JSON.stringify(newLicense),
      });

      if (response.ok) {
        alert(editingLicense ? "Licencia actualizada exitosamente" : "Licencia creada exitosamente");
        setShowModal(false);
        setNewLicense({ producto: "", usuario: "", estado: "activa" });
        fetchLicenses();
      } else {
        alert("Error al guardar licencia");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar licencia");
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta licencia?")) return;

    try {
      const response = await fetch(`/api/licenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Licencia eliminada");
        fetchLicenses();
      } else {
        alert("Error al eliminar licencia");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar licencia");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando licencias...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Licencias</h1>
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
              <th className="py-3 px-4 text-left">Producto</th>
              <th className="py-3 px-4 text-left">Usuario</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Fecha Creación</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {licencias.map((lic) => (
              <tr key={lic.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-sm">{lic.licenseKey}</td>
                <td className="py-3 px-4">{lic.producto}</td>
                <td className="py-3 px-4">{lic.usuario}</td>
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
                  <button
                    onClick={() => openEditModal(lic)}
                    className="text-blue-600 hover:text-blue-800 mr-3 font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteLicense(lic.id)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    Eliminar
                  </button>
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
                  Usuario (Email)
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
