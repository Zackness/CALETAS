"use client";

import React, { useState, useEffect, useMemo } from "react";

interface FullscreenPDFViewerProps {
  url: string;
  fileName: string;
}

/**
 * PDF vía /api/proxy-pdf (binario en streaming).
 * Evita proxy-pdf-base64: JSON + data URL fallan en PDFs medianos/grandes (límites del navegador y del parser).
 */
export default function FullscreenPDFViewer({ url, fileName }: FullscreenPDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string>("");

  const iframeSrc = useMemo(() => {
    const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
    return `${proxyUrl}#toolbar=0&navpanes=0&scrollbar=0`;
  }, [url]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setErrorDetails("");
  }, [url]);

  const handleIframeLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    setError(true);
    setLoading(false);
    setErrorDetails("No se pudo cargar el visor del PDF");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-white">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">Error al cargar el PDF</h3>
          <p className="text-sm mb-2 break-all max-w-xl mx-auto opacity-80">{fileName}</p>
          <p className="text-sm mb-4 text-red-500">{errorDetails}</p>
          <p className="text-xs text-gray-500">
            Si antes se veía con archivos pequeños y este no, suele ser tamaño: ahora el visor usa streaming y debería
            funcionar. Si persiste, el enlace en el almacén podría haber expirado o devolver otro tipo de archivo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-2" />
            <p className="text-gray-600">Cargando PDF...</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
      )}

      <iframe
        src={iframeSrc}
        className="w-full h-full border-0"
        title={fileName}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}
