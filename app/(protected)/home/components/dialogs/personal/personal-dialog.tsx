import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSolicitud } from "@/app/(protected)/home/hooks/use-solicitud";
import { PersonalDocumentForm } from "./document-form";
import { FileText } from "lucide-react";
import { CustomDialogHeader } from "../common/dialog-header";
import { ClientInfo } from "../common/client-info";
import { StatusBadge } from "../common/status-badge";

interface PersonalDialogProps {
  solicitudId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalDialog = ({
  solicitudId,
  isOpen,
  onClose,
}: PersonalDialogProps) => {
  const { solicitud, loading } = useSolicitud(solicitudId);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (data: any) => {
    // TODO: Implementar guardado
    setIsEditing(false);
  };

  const renderContent = () => {
    if (loading) {
      return <div>Cargando...</div>;
    }

    if (!solicitud) {
      return <div>No se encontró la solicitud</div>;
    }

    if (isEditing) {
      return (
        <PersonalDocumentForm
          detalle={solicitud.detalle || null}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <StatusBadge status={solicitud.estado} />
          <Button onClick={() => setIsEditing(true)}>Editar</Button>
        </div>

        <ClientInfo
          name={solicitud.usuario.name}
          email={solicitud.usuario.email}
          avatar={solicitud.usuario.avatar}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Testigo 1</h4>
            {solicitud.detalle?.Testigo1 ? (
              <a
                href={solicitud.detalle.Testigo1}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                <span>Ver documento</span>
              </a>
            ) : (
              <p className="text-gray-500">No disponible</p>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-2">Testigo 2</h4>
            {solicitud.detalle?.Testigo2 ? (
              <a
                href={solicitud.detalle.Testigo2}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                <span>Ver documento</span>
              </a>
            ) : (
              <p className="text-gray-500">No disponible</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <CustomDialogHeader 
          title="Documentos Personales"
          description="Documentos de Poder general o especial y Carta o justificativo de soltería"
        />
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}; 