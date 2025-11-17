"use client";

import { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features?: string[];
  active: boolean;
  createdAt: string;
}

export default function PlansPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "monthly",
    features: "",
    active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/plans");
      const data = await response.json();
      
      if (response.ok) {
        setPlanes(data.plans);
      } else {
        alert("Error al cargar planes");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar planes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({ name: "", price: "", duration: "monthly", features: "", active: true });
    setShowModal(true);
  };

  const openEditModal = (planToEdit: Plan) => {
    setEditingPlan(planToEdit);
    setFormData({
      name: planToEdit.name,
      price: planToEdit.price.toString(),
      duration: planToEdit.duration,
      features: planToEdit.features ? planToEdit.features.join("\n") : "",
      active: planToEdit.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPlan 
        ? `/api/plans/${editingPlan.id}` 
        : "/api/plans";
      
      const method = editingPlan ? "PUT" : "POST";

      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: formData.price,
          duration: formData.duration,
          features: featuresArray,
          active: formData.active,
        }),
      });

      if (response.ok) {
        alert(editingPlan ? "Plan actualizado exitosamente" : "Plan creado exitosamente");
        setShowModal(false);
        fetchPlans();
      } else {
        alert("Error al guardar plan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar plan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este plan?")) return;

    try {
      const response = await fetch(`/api/plans/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Plan eliminado");
        fetchPlans();
      } else {
        alert("Error al eliminar plan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar plan");
    }
  };

  const toggleActive = async (planToToggle: Plan) => {
    try {
      const response = await fetch(`/api/plans/${planToToggle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !planToToggle.active }),
      });

      if (response.ok) {
        fetchPlans();
      } else {
        alert("Error al cambiar estado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar estado");
    }
  };

  const getDurationLabel = (duration: string) => {
    if (duration === "monthly") return "Mensual";
    if (duration === "yearly") return "Anual";
    if (duration === "lifetime") return "De por vida";
    return duration;
  };

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando planes...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Planes</h1>
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          + Nuevo Plan
        </button>
      </div>

      {planes.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-600">
          No hay planes registrados. Crea el primer plan usando el botón "+ Nuevo Plan".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.map((planItem) => (
            <div key={planItem.id} className="bg-white border border-gray-300 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{planItem.name}</h3>
                <button
                  onClick={() => toggleActive(planItem)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    planItem.active
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {planItem.active ? "Activo" : "Inactivo"}
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-3xl font-bold text-blue-600">
                  ${typeof planItem.price === 'number' ? planItem.price.toFixed(2) : '0.00'}
                </p>
                <p className="text-sm text-gray-600">{getDurationLabel(planItem.duration)}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Características:</p>
                {planItem.features && planItem.features.length > 0 ? (
                  <ul className="space-y-1">
                    {planItem.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">Sin características definidas</p>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEditModal(planItem)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(planItem.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded font-semibold text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg max-h-screen overflow-y-auto mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingPlan ? "Editar Plan" : "Nuevo Plan"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Nombre del Plan
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Ej: Plan Básico"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Precio (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="9.99"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Duración
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                >
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                  <option value="lifetime">De por vida</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Características (una por línea)
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Acceso completo&#10;Soporte 24/7&#10;Actualizaciones gratis"
                  rows={5}
                />
              </div>

              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="mr-3 h-4 w-4"
                />
                <label className="text-gray-700 font-semibold">Plan activo</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  {editingPlan ? "Actualizar" : "Crear"}
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
