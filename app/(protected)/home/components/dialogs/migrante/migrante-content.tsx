import { FileText } from "lucide-react";
import { Document, Page } from 'react-pdf';

interface MigranteContentProps {
  pasaporte?: string;
  visa?: string;
  otrosDocumentos?: string[];
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

export const MigranteContent = ({
  pasaporte,
  visa,
  otrosDocumentos = []
}: MigranteContentProps) => {
  return (
    <div className="space-y-6 border-t pt-4">
      <h3 className="font-medium text-lg">Documentos de viajero</h3>
      
      {/* Pasaporte */}
      {pasaporte && (
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Pasaporte</h4>
          <a
            href={pasaporte}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
          >
            <FileText className="h-4 w-4" />
            <span>Abrir en otra pestaña</span>
          </a>
          {renderDocument(pasaporte)}
        </div>
      )}
      
      {/* Visa */}
      {visa && (
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Visa</h4>
          <a
            href={visa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
          >
            <FileText className="h-4 w-4" />
            <span>Abrir en otra pestaña</span>
          </a>
          {renderDocument(visa)}
        </div>
      )}
      
      {/* Otros documentos */}
      {otrosDocumentos && otrosDocumentos.length > 0 && (
        <div className="border rounded p-4">
          <h4 className="font-medium mb-2">Otros documentos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otrosDocumentos.map((doc, index) => (
              <div key={index} className="border rounded p-3">
                <h5 className="text-sm font-medium mb-1">Documento {index + 1}</h5>
                <a
                  href={doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:underline mb-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Abrir en otra pestaña</span>
                </a>
                {renderDocument(doc)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mensaje si no hay documentos */}
      {!pasaporte && !visa && otrosDocumentos.length === 0 && (
        <p className="text-sm text-muted-foreground">No se han registrado documentos para esta solicitud.</p>
      )}
    </div>
  );
}; 