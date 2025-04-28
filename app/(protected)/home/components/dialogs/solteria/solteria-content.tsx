import { FileText } from "lucide-react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar el worker de PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

interface SolteriaContentProps {
  testigo1?: string;
  testigo2?: string;
}

const renderDocument = (url: string) => {
  const fileType = url.split('.').pop()?.toLowerCase();

  if (fileType === 'pdf') {
    return (
      <div className="mt-2 border rounded p-2">
        <Document 
          file={url}
          loading={
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          }
          error={
            <div className="text-red-500 p-4">
              Error al cargar el PDF. Por favor, intente nuevamente.
            </div>
          }
          onLoadError={(error) => {
            console.error('Error loading PDF:', error);
          }}
        >
          <Page 
            pageNumber={1} 
            width={400}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            }
          />
        </Document>
      </div>
    );
  } else if (['jpg', 'jpeg', 'png'].includes(fileType || '')) {
    return (
      <div className="mt-2 border rounded p-2">
        <img 
          src={url} 
          alt="Documento" 
          className="max-w-full h-auto rounded"
          style={{ maxHeight: '400px' }}
        />
      </div>
    );
  } else {
    return <p className="text-sm text-muted-foreground mt-2">Formato de archivo no soportado para vista previa</p>;
  }
};

export const SolteriaContent = ({
  testigo1,
  testigo2,
}: SolteriaContentProps) => {
  return (
    <div className="border-t pt-4 mt-4 grid grid-cols-2 gap-4">
      {testigo1 && (
        <div>
          <h4 className="font-medium mb-2">Testigo 1</h4>
          <a
            href={testigo1}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <FileText className="h-4 w-4" />
            <span>Abrir en otra pestaña</span>
          </a>
          {renderDocument(testigo1)}
        </div>
      )}
      {testigo2 && (
        <div>
          <h4 className="font-medium mb-2">Testigo 2</h4>
          <a
            href={testigo2}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            <FileText className="h-4 w-4" />
            <span>Abrir en otra pestaña</span>
          </a>
          {renderDocument(testigo2)}
        </div>
      )}
      {!testigo1 && !testigo2 && (
        <div className="col-span-2 text-center text-muted-foreground">
          No se han subido documentos de testigos.
        </div>
      )}
    </div>
  );
}; 