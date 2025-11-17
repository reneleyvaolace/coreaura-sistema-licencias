// app/dashboard/help/page.tsx
"use client";

export default function HelpPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Centro de Ayuda</h1>
      
      {/* Sección de Preguntas Frecuentes */}
      <div className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Preguntas Frecuentes</h2>
        
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">¿Cómo generar una nueva licencia?</h3>
          <p className="text-gray-700">
            Ve a la sección de <strong>Licencias</strong>, haz clic en el botón "+ Nueva Licencia", 
            completa los datos requeridos y guarda. La licencia se generará automáticamente.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">¿Cómo agregar un nuevo producto?</h3>
          <p className="text-gray-700">
            Dirígete a <strong>Productos</strong>, pulsa "+ Nuevo Producto", ingresa el nombre, 
            precio y configuración, y activa el producto para que esté disponible.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">¿Cómo gestionar usuarios?</h3>
          <p className="text-gray-700">
            En la sección <strong>Usuarios</strong> puedes ver todos los registrados, editar roles, 
            activar/desactivar cuentas y eliminar usuarios si es necesario.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">¿Cómo cambiar la configuración del sistema?</h3>
          <p className="text-gray-700">
            Accede a <strong>Configuración</strong> para modificar el nombre del sitio, email de contacto, 
            y preferencias como notificaciones, modo mantenimiento y registros.
          </p>
        </div>
      </div>

      {/* Sección de Documentación */}
      <div className="bg-white border border-gray-300 rounded shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Documentación</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-2">
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
              Guía de inicio rápido
            </a>
          </li>
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
              API y endpoints disponibles
            </a>
          </li>
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
              Integración con plugins externos
            </a>
          </li>
          <li>
            <a href="#" className="text-blue-600 hover:text-blue-800 font-semibold">
              Configuración de pagos (PayPal/MercadoPago)
            </a>
          </li>
        </ul>
      </div>

      {/* Sección de Contacto */}
      <div className="bg-white border border-gray-300 rounded shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">¿Necesitas más ayuda?</h2>
        <p className="text-gray-700 mb-4">
          Si no encuentras la respuesta que buscas, contáctanos directamente:
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> soporte@coreaura.ia</p>
          <p><strong>Documentación oficial:</strong> <a href="https://coreaura.ia/docs" className="text-blue-600 hover:text-blue-800">coreaura.ia/docs</a></p>
        </div>
      </div>
    </section>
  );
}
