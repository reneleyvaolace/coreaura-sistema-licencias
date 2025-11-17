// app/dashboard/test-validation/page.tsx
"use client";

import { useState } from "react";

export default function TestValidationPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const [product, setProduct] = useState("");
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"validate" | "activate" | "deactivate">("validate");

  const handleAction = async (action: "validate" | "activate" | "deactivate") => {
    setLoading(true);
    setResult(null);

    try {
      let endpoint = "/api/public/validate";
      if (action === "activate") endpoint = "/api/public/activate";
      if (action === "deactivate") endpoint = "/api/public/deactivate";

      const bodyData: any = { licenseKey };
      
      if (action === "validate" || action === "activate") {
        if (product) bodyData.product = product;
      }
      
      if (domain) bodyData.domain = domain;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      setResult({ status: response.status, data, action });
    } catch (error) {
      setResult({ error: "Error al conectar con la API" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Probar API de Licencias</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("validate")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "validate"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Validar
        </button>
        <button
          onClick={() => setActiveTab("activate")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "activate"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Activar
        </button>
        <button
          onClick={() => setActiveTab("deactivate")}
          className={`px-4 py-2 rounded font-semibold ${
            activeTab === "deactivate"
              ? "bg-red-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Desactivar
        </button>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 max-w-2xl">
        {activeTab === "validate" && (
          <p className="text-gray-600 mb-6">
            Valida una licencia y opcionalmente verifica si está autorizada para un dominio específico.
          </p>
        )}
        {activeTab === "activate" && (
          <p className="text-gray-600 mb-6">
            Activa una licencia en un dominio específico. Si ya alcanzó el límite de activaciones, recibirás un error.
          </p>
        )}
        {activeTab === "deactivate" && (
          <p className="text-gray-600 mb-6">
            Desactiva una licencia de un dominio específico, liberando una activación.
          </p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Clave de Licencia *
          </label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
            placeholder="LIC-1234567890-ABCDEFGH"
          />
        </div>

        {(activeTab === "validate" || activeTab === "activate") && (
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Producto {activeTab === "validate" ? "(opcional)" : ""}
            </label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
              placeholder="Nombre del producto"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Dominio {activeTab === "validate" ? "(opcional)" : "*"}
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-800"
            placeholder="ejemplo.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Sin http://, https:// o www. Solo el dominio base.
          </p>
        </div>

        <button
          onClick={() => handleAction(activeTab)}
          disabled={
            !licenseKey ||
            loading ||
            (activeTab !== "validate" && !domain)
          }
          className={`w-full py-3 rounded font-semibold text-white ${
            !licenseKey || loading || (activeTab !== "validate" && !domain)
              ? "bg-gray-400 cursor-not-allowed"
              : activeTab === "validate"
              ? "bg-blue-600 hover:bg-blue-700"
              : activeTab === "activate"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Procesando..."
            : activeTab === "validate"
            ? "Validar Licencia"
            : activeTab === "activate"
            ? "Activar en Dominio"
            : "Desactivar de Dominio"}
        </button>

        {result && (
          <div className="mt-6 p-4 border rounded">
            <h3 className="font-bold text-lg mb-2 text-gray-800">
              Resultado de {result.action === "validate" ? "Validación" : result.action === "activate" ? "Activación" : "Desactivación"}:
            </h3>
            
            {result.error ? (
              <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800">
                <strong>Error:</strong> {result.error}
              </div>
            ) : (
              <>
                <div className={`p-3 rounded mb-3 ${
                  result.data.valid || result.data.success
                    ? "bg-green-50 border border-green-300 text-green-800"
                    : "bg-red-50 border border-red-300 text-red-800"
                }`}>
                  <strong>Estado:</strong>{" "}
                  {result.data.valid || result.data.success ? "✓ ÉXITO" : "✗ FALLÓ"}
                  <br />
                  <strong>Mensaje:</strong> {result.data.message}
                  <br />
                  <strong>HTTP Status:</strong> {result.status}
                  {result.data.hint && (
                    <>
                      <br />
                      <strong className="text-blue-600">Sugerencia:</strong> {result.data.hint}
                    </>
                  )}
                </div>

                {result.data.license && (
                  <div className="bg-gray-50 border border-gray-300 rounded p-3 mb-3">
                    <h4 className="font-semibold mb-2 text-gray-800">Datos de la Licencia:</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Clave:</strong> {result.data.license.key}</p>
                      <p><strong>Producto:</strong> {result.data.license.product}</p>
                      <p><strong>Usuario:</strong> {result.data.license.user}</p>
                      <p><strong>Estado:</strong> {result.data.license.status}</p>
                      {result.data.license.activations && (
                        <>
                          <p>
                            <strong>Activaciones:</strong>{" "}
                            {result.data.license.activations.current} /{" "}
                            {result.data.license.activations.max}
                          </p>
                          {result.data.license.activations.domains.length > 0 && (
                            <div className="mt-2">
                              <strong>Dominios activos:</strong>
                              <ul className="list-disc list-inside ml-4 mt-1">
                                {result.data.license.activations.domains.map((d: any, i: number) => (
                                  <li key={i}>
                                    {d.domain} 
                                    <span className="text-xs text-gray-500">
                                      {" "}(activado: {new Date(d.activatedAt).toLocaleString()})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {result.data.activation && (
                  <div className="bg-green-50 border border-green-300 rounded p-3 mb-3">
                    <h4 className="font-semibold mb-2 text-gray-800">Detalles de Activación:</h4>
                    <div className="text-sm text-gray-700">
                      <p><strong>Dominio:</strong> {result.data.activation.domain}</p>
                      <p><strong>Activado:</strong> {new Date(result.data.activation.activatedAt).toLocaleString()}</p>
                      {result.data.remainingActivations !== undefined && (
                        <p><strong>Activaciones restantes:</strong> {result.data.remainingActivations}</p>
                      )}
                    </div>
                  </div>
                )}

                {result.data.activations && Array.isArray(result.data.activations) && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-3 mb-3">
                    <h4 className="font-semibold mb-2 text-gray-800">Límite alcanzado:</h4>
                    <p className="text-sm text-gray-700 mb-2">Dominios actualmente activos:</p>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-700">
                      {result.data.activations.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.data.remainingActivations && Array.isArray(result.data.remainingActivations) && (
                  <div className="bg-blue-50 border border-blue-300 rounded p-3 mb-3">
                    <h4 className="font-semibold mb-2 text-gray-800">Dominios restantes:</h4>
                    <ul className="list-disc list-inside ml-4 text-sm text-gray-700">
                      {result.data.remainingActivations.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 bg-blue-50 border border-blue-300 rounded p-3">
                  <h4 className="font-semibold mb-2 text-gray-800">Respuesta Completa (JSON):</h4>
                  <pre className="text-xs text-gray-700 overflow-x-auto bg-white p-2 rounded">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 max-w-2xl">
        <h3 className="font-semibold text-gray-800 mb-2">💡 Ejemplo de integración en PHP (WordPress):</h3>
        <pre className="text-xs bg-white p-3 rounded border text-gray-700 overflow-x-auto">
{`// Obtener dominio del sitio
$domain = parse_url(home_url(), PHP_URL_HOST);

// ${activeTab === "activate" ? "ACTIVAR" : activeTab === "deactivate" ? "DESACTIVAR" : "VALIDAR"} licencia
$response = wp_remote_post('https://tu-dominio.com/api/public/${activeTab}', [
    'body' => json_encode([
        'licenseKey' => '${licenseKey || 'LIC-XXXXX'}',${product ? `\n        'product' => '${product}',` : ""}${domain || activeTab !== "validate" ? `\n        'domain' => $domain,` : ""}
    ]),
    'headers' => ['Content-Type' => 'application/json']
]);

$data = json_decode(wp_remote_retrieve_body($response), true);

if ($data['${activeTab === "validate" ? "valid" : "success"}']) {
    // ${activeTab === "validate" ? "Licencia válida" : activeTab === "activate" ? "Licencia activada" : "Licencia desactivada"} ✓
    echo "${activeTab === "validate" ? "Acceso permitido" : activeTab === "activate" ? "Licencia activada correctamente" : "Licencia desactivada"}";
} else {
    // Error
    echo "Error: " . $data['message'];
}`}
        </pre>
      </div>
    </section>
  );
}
