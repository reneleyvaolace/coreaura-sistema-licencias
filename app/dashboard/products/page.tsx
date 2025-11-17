// app/dashboard/products/page.tsx
"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price?: number;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function ProductsPage() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products");
      const data = await response.json();
      
      if (response.ok) {
        setProductos(data.products);
      } else {
        alert("Error al cargar productos");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ name: "", price: "", description: "", active: true });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price?.toString() || "",
      description: product.description || "",
      active: product.active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingProduct 
        ? `/api/products/${editingProduct.id}` 
        : "/api/products";
      
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingProduct ? "Producto actualizado exitosamente" : "Producto creado exitosamente");
        setShowModal(false);
        fetchProducts();
      } else {
        alert("Error al guardar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar producto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Producto eliminado");
        fetchProducts();
      } else {
        alert("Error al eliminar producto");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar producto");
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });

      if (response.ok) {
        fetchProducts();
      } else {
        alert("Error al cambiar estado");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cambiar estado");
    }
  };

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando productos...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Productos</h1>
      <div className="mb-6">
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        >
          + Nuevo Producto
        </button>
      </div>

      {productos.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded p-6 text-center text-gray-600">
          No hay productos registrados. Crea el primer producto usando el botón "+ Nuevo Producto".
        </div>
      ) : (
        <table className="w-full border border-gray-300 rounded bg-white shadow-sm">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Precio</th>
              <th className="py-3 px-4 text-left">Descripción</th>
              <th className="py-3 px-4 text-left">Estado</th>
              <th className="py-3 px-4 text-left">Fecha Creación</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {productos.map((prod) => (
              <tr key={prod.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-semibold">{prod.name}</td>
                <td className="py-3 px-4">
                  ${typeof prod.price === 'number' ? prod.price.toFixed(2) : '0.00'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {prod.description || "Sin descripción"}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(prod)}
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      prod.active
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {prod.active ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="py-3 px-4">
                  {new Date(prod.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="text-blue-600 hover:text-blue-800 mr-3 font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(prod.id)}
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
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Ej: Plugin WordPress Pro"
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
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="49.99"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
                  placeholder="Descripción del producto (opcional)"
                  rows={3}
                />
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="mr-3 h-4 w-4"
                />
                <label className="text-gray-700 font-semibold">Producto activo</label>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold"
                >
                  {editingProduct ? "Actualizar" : "Crear"}
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
