import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import FileManager from "@/components/file-manager";
import CPanelStatus from "@/components/cpanel-status";
import CPanelQuickTest from "@/components/cpanel-quick-test";
import FileUploadTest from "@/components/file-upload-test";
import SuppressHydrationWarning from "@/components/suppress-hydration-warning";

export default async function TestCPanelPage() {
  const session = await getSession();
  
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

        <div className="bg-[var(--mygreen-light)] border-white/10 rounded-lg p-6">
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

        <div className="bg-[var(--mygreen-light)] border-white/10 rounded-lg p-6">
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

        <div className="bg-[var(--mygreen-light)] border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-special text-white mb-4">
            📤 Pruebas Disponibles
          </h2>
          <div className="text-white/70 space-y-2">
            <p>
              • <strong>Prueba Subida cPanel</strong>:{" "}
              <Link href="/test-upload-cpanel" className="text-[var(--accent-hex)] hover:underline">
                📤 Subida de archivos a cPanel
              </Link>
            </p>
            <p>
              • <strong>Crear Caleta</strong>:{" "}
              <Link href="/caletas/crear" className="text-[var(--accent-hex)] hover:underline">
                📝 Formulario completo de subida
              </Link>
            </p>
            <p>
              • <strong>Test PDF</strong>:{" "}
              <Link href="/test-pdf" className="text-[var(--accent-hex)] hover:underline">
                📄 Pruebas de visualización PDF
              </Link>
            </p>
            <p>
              • <strong>Test PDF Proxy</strong>:{" "}
              <Link href="/test-pdf-proxy" className="text-[var(--accent-hex)] hover:underline">
                🔗 Pruebas con proxy
              </Link>
            </p>
            <p>
              • <strong>Test PDF Blob</strong>:{" "}
              <Link href="/test-pdf-blob" className="text-[var(--accent-hex)] hover:underline">
                💾 Pruebas con Blob
              </Link>
            </p>
            <p>
              • <strong>Test PDF XHR</strong>:{" "}
              <Link href="/test-pdf-xhr" className="text-[var(--accent-hex)] hover:underline">
                📡 Pruebas con XHR
              </Link>
            </p>
            <p>
              • <strong>PDF Diagnostic</strong>:{" "}
              <Link href="/pdf-diagnostic" className="text-[var(--accent-hex)] hover:underline">
                🔍 Diagnóstico completo
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
