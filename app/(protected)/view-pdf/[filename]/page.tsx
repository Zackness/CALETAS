"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FullscreenPDFViewer from "@/components/fullscreen-pdf-viewer";

interface PDFFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export default function ViewPDFPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<PDFFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
  }, [session, isPending, router]);

  useEffect(() => {
    const loadFileInfo = async () => {
      try {
        const filename = params.filename as string;
        if (!filename) {
          setError("Nombre de archivo no válido");
          return;
        }

        // Decodificar el nombre del archivo (por si tiene caracteres especiales)
        const decodedFilename = decodeURIComponent(filename);
        
        // Construir la URL del archivo (sin subcarpeta)
        const fileUrl = `https://startupven.com/caletas/home/nrektwbx/public_html/caletas/${decodedFilename}`;
        
        setFile({
          name: decodedFilename,
          url: fileUrl,
          type: 'application/pdf'
        });

      } catch (err) {
        console.error("Error cargando información del archivo:", err);
        setError("Error al cargar el archivo");
      }
    };

    if (params.filename) {
      loadFileInfo();
    }
  }, [params.filename]);

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#354B3A] border-white/10 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-special text-white mb-4">Error al cargar el PDF</h1>
            <p className="text-white/70 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => router.back()}
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                onClick={() => router.push("/test-cpanel")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Ir a cPanel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#354B3A] border-white/10 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-special text-white mb-4">Archivo no encontrado</h1>
            <p className="text-white/70 mb-6">No se pudo cargar la información del archivo</p>
            <Button
              onClick={() => router.push("/test-cpanel")}
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a cPanel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      {/* Header con información del archivo */}
      <div className="bg-[#354B3A] border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            
            <div className="text-white">
              <h1 className="font-special text-lg">{file.name}</h1>
              <p className="text-white/70 text-sm">
                Visualizando PDF en modo seguro - Sin descarga
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-white/50 text-sm">
              🔒 Modo seguro - Sin descarga
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal - PDF en pantalla completa */}
      <div className="flex-1 h-[calc(100vh-80px)]">
        <FullscreenPDFViewer 
          url={file.url}
          fileName={file.name}
        />
      </div>
    </div>
  );
}
