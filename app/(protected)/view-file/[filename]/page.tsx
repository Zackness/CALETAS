"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileImage, FileText } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import FullscreenPDFViewer from "@/components/fullscreen-pdf-viewer";
import FullscreenImageViewer from "@/components/fullscreen-image-viewer";

type ResolvedFile = {
  name: string;
  url: string;
};

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isPdfExt(ext: string) {
  return ext === "pdf";
}

function isImageExt(ext: string) {
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
}

export default function ViewFilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const params = useParams();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [file, setFile] = useState<ResolvedFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filenameParam = useMemo(() => (params?.filename as string | undefined) ?? "", [params?.filename]);
  const decodedFilename = useMemo(() => (filenameParam ? decodeURIComponent(filenameParam) : ""), [filenameParam]);
  const ext = useMemo(() => getExt(decodedFilename), [decodedFilename]);
  const kind = useMemo(() => {
    if (isPdfExt(ext)) return "pdf" as const;
    if (isImageExt(ext)) return "image" as const;
    return "unknown" as const;
  }, [ext]);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    setIsLoadingSession(false);
  }, [session, isPending, router]);

  useEffect(() => {
    const loadFileInfo = async () => {
      try {
        if (!decodedFilename) {
          setError("Nombre de archivo no válido");
          return;
        }

        const res = await fetch(`/api/caletas/file-by-name?filename=${encodeURIComponent(decodedFilename)}`);
        const data = await res.json();
        if (!res.ok || !data?.file?.url) {
          throw new Error(data?.error || "No se pudo resolver la URL del archivo");
        }
        setFile({ name: decodedFilename, url: data.file.url });
      } catch (err) {
        console.error("Error cargando información del archivo:", err);
        setError("Error al cargar el archivo");
      }
    };

    if (filenameParam) void loadFileInfo();
  }, [filenameParam, decodedFilename]);

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--mygreen-light)] border border-white/10 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">{kind === "image" ? "🖼️" : "📄"}</div>
            <h1 className="text-2xl font-special text-white mb-4">Error al cargar el archivo</h1>
            <p className="text-white/70 mb-6">{error}</p>
            <Button
              onClick={() => router.back()}
              className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="bg-[var(--mygreen-light)] border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <Button onClick={() => router.back()} variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <div className="min-w-0 text-white">
              <h1 className="font-special text-lg truncate">{file.name}</h1>
              <p className="text-white/70 text-sm">
                {kind === "pdf"
                  ? "Visualizando PDF en modo seguro - Sin descarga"
                  : kind === "image"
                    ? "Visualizando imagen - Zoom habilitado"
                    : "Visualizando archivo"}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-white/60 text-sm">
            {kind === "pdf" ? (
              <>
                <FileText className="h-4 w-4 text-[var(--accent-hex)]" />
                <span>PDF</span>
              </>
            ) : kind === "image" ? (
              <>
                <FileImage className="h-4 w-4 text-[var(--accent-hex)]" />
                <span>Imagen</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 h-[calc(100vh-80px)]">
        {kind === "pdf" ? (
          <FullscreenPDFViewer url={file.url} fileName={file.name} />
        ) : kind === "image" ? (
          <FullscreenImageViewer url={file.url} fileName={file.name} />
        ) : (
          <div className="h-full flex items-center justify-center bg-[var(--mygreen-dark)]">
            <div className="text-center px-4">
              <div className="text-6xl mb-4">📎</div>
              <p className="text-white font-medium">Tipo de archivo no soportado aquí</p>
              <p className="text-white/70 text-sm mt-1 break-all">{file.name}</p>
              <Button
                className="mt-4 bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                onClick={() => window.open(file.url, "_blank")}
              >
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

