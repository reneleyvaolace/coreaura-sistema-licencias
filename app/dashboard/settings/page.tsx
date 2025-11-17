// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";

interface Settings {
  siteName: string;
  siteEmail: string;
  emailNotifications: boolean;
  allowRegistrations: boolean;
  maintenanceMode: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: "",
    siteEmail: "",
    emailNotifications: true,
    allowRegistrations: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();
      
      if (response.ok) {
        setSettings(data.settings);
      } else {
        alert("Error al cargar configuración");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Configuración guardada correctamente");
      } else {
        alert("Error al guardar configuración");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-800 py-12">Cargando configuración...</div>;
  }

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Configuración del Sistema</h1>
      
      <div className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Información General</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Nombre del Sitio</label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email de Contacto</label>
          <input
            type="email"
            value={settings.siteEmail}
            onChange={(e) => setSettings({ ...settings, siteEmail: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferencias</h2>
        
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
            className="mr-3 h-4 w-4"
          />
          <label className="text-gray-700 font-semibold">Activar notificaciones por email</label>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            checked={settings.allowRegistrations}
            onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
            className="mr-3 h-4 w-4"
          />
          <label className="text-gray-700 font-semibold">Permitir nuevos registros</label>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            className="mr-3 h-4 w-4"
          />
          <label className="text-gray-700 font-semibold">Modo mantenimiento</label>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`px-6 py-3 rounded font-semibold text-white ${
          saving ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Guardando..." : "Guardar Cambios"}
      </button>
    </section>
  );
}
