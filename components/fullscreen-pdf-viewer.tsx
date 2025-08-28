"use client";

import React, { useState, useEffect } from "react";

interface FullscreenPDFViewerProps {
  url: string;
  fileName: string;
}

export default function FullscreenPDFViewer({ url, fileName }: FullscreenPDFViewerProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");

  // Cargar PDF usando proxy base64
  useEffect(() => {
    const loadPDF = async () => {
      try {
        console.log('🔍 Cargando PDF pantalla completa:', url);
        setLoading(true);
        setError(false);
        setErrorDetails("");

        const proxyUrl = `/api/proxy-pdf-base64?url=${encodeURIComponent(url)}`;
        console.log('🔗 Proxy URL:', proxyUrl);

        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.success && data.dataUrl) {
          console.log('✅ PDF cargado como base64:', data.contentType, data.contentLength);
          setDataUrl(data.dataUrl);
          setLoading(false);
        } else {
          console.error('❌ Error en proxy base64:', data.error);
          setErrorDetails(data.error || 'Error desconocido');
          setError(true);
          setLoading(false);
        }

      } catch (err) {
        console.error('❌ Error cargando PDF pantalla completa:', err);
        setErrorDetails(err instanceof Error ? err.message : 'Error desconocido');
        setError(true);
        setLoading(false);
      }
    };

    loadPDF();
  }, [url]);

  const handleIframeLoad = () => {
    console.log("✅ PDF cargado exitosamente (pantalla completa)");
    setLoading(false);
    setError(false);
  };

  const handleIframeError = () => {
    console.error("❌ Error cargando PDF (pantalla completa)");
    setError(true);
    setLoading(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">Error al cargar el PDF</h3>
          <p className="text-sm mb-2">URL: {url}</p>
          <p className="text-sm mb-4 text-red-500">Error: {errorDetails}</p>
          <p className="text-xs mb-4 text-gray-500">Método: Proxy Base64 (Pantalla Completa)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-2"></div>
            <p className="text-gray-600">Cargando PDF...</p>
            <p className="text-sm text-gray-500">{fileName}</p>
          </div>
        </div>
      )}
      
      {dataUrl && (
        <iframe
          src={`${dataUrl}#toolbar=0&navpanes=0&scrollbar=0&download=0&print=0&fullscreen=0&view=FitH`}
          className="w-full h-full border-0"
          title={fileName}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
}
