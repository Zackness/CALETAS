import { auth } from "@/auth";
import { redirect } from "next/navigation";
import FileManager from "@/components/file-manager";
import CPanelStatus from "@/components/cpanel-status";
import CPanelQuickTest from "@/components/cpanel-quick-test";
import FileUploadTest from "@/components/file-upload-test";
import SuppressHydrationWarning from "@/components/suppress-hydration-warning";

export default async function TestCPanelPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-special text-white mb-2">
            🧪 Pruebas de cPanel - Banna Hosting
          </h1>
          <p className="text-white/70">
            Sistema de almacenamiento ilimitado para Caletas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de conexión */}
          <CPanelStatus />

          {/* Prueba rápida */}
          <CPanelQuickTest />
        </div>

        {/* Subida manual de archivos */}
        <FileUploadTest />

        {/* Gestor de archivos */}
        <FileManager />

        <div className="bg-[#354B3A] border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-special text-white mb-4">
            📋 Información de Configuración
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
            <div>
              <h3 className="text-white font-medium mb-2">Configuración FTP</h3>
              <ul className="space-y-1">
                <li>• Host: ftp.startupven.com</li>
                <li>• Usuario: caletas@startupven.com</li>
                <li>• Puerto: 21</li>
                <li>• Seguro: No</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">Directorios</h3>
              <ul className="space-y-1">
                <li>• Base: /home/nrektwbx/public_html/caletas</li>
                <li>• URL Pública: https://startupven.com/caletas</li>
                <li>• Subcarpetas: recursos, imagenes, documentos, videos</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[#354B3A] border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-special text-white mb-4">
            🔧 Funcionalidades Disponibles
          </h2>
          <div className="text-white/70 space-y-2">
            <p>• <strong>Estado de conexión</strong>: Verificación en tiempo real</p>
            <p>• <strong>Pruebas rápidas</strong>: Conexión, listado y subida</p>
            <p>• <strong>Subida manual</strong>: Subida directa de archivos</p>
            <p>• <strong>FileManager</strong>: Gestión completa de archivos</p>
            <p>• <strong>Visualización PDF</strong>: Página dinámica en pantalla completa</p>
            <p>• <strong>Modo seguro</strong>: Sin barra de herramientas ni descargas</p>
            <p>• <strong>Proxy Base64</strong>: Evita problemas de CORS</p>
            <p>• <strong>Almacenamiento ilimitado</strong>: Sin límites de espacio</p>
          </div>
        </div>

        <div className="bg-[#354B3A] border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-special text-white mb-4">
            📤 Pruebas Disponibles
          </h2>
          <div className="text-white/70 space-y-2">
            <p>• <strong>Prueba Subida cPanel</strong>: <a href="/test-upload-cpanel" className="text-[#40C9A9] hover:underline">📤 Subida de archivos a cPanel</a></p>
            <p>• <strong>Crear Caleta</strong>: <a href="/caletas/crear" className="text-[#40C9A9] hover:underline">📝 Formulario completo de subida</a></p>
            <p>• <strong>Test PDF</strong>: <a href="/test-pdf" className="text-[#40C9A9] hover:underline">📄 Pruebas de visualización PDF</a></p>
            <p>• <strong>Test PDF Proxy</strong>: <a href="/test-pdf-proxy" className="text-[#40C9A9] hover:underline">🔗 Pruebas con proxy</a></p>
            <p>• <strong>Test PDF Blob</strong>: <a href="/test-pdf-blob" className="text-[#40C9A9] hover:underline">💾 Pruebas con Blob</a></p>
            <p>• <strong>Test PDF XHR</strong>: <a href="/test-pdf-xhr" className="text-[#40C9A9] hover:underline">📡 Pruebas con XHR</a></p>
            <p>• <strong>PDF Diagnostic</strong>: <a href="/pdf-diagnostic" className="text-[#40C9A9] hover:underline">🔍 Diagnóstico completo</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
