import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PersonalDocumentFormProps {
  detalle: {
    Testigo1?: string;
    Testigo2?: string;
    Testigo3?: string;
    Testigo4?: string;
    generic_text?: string;
    documento?: {
      nombre?: string;
    };
  } | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const PersonalDocumentForm = ({
  detalle,
  onSave,
  onCancel,
}: PersonalDocumentFormProps) => {
  const [formData, setFormData] = useState({
    Testigo1: detalle?.Testigo1 || "",
    Testigo2: detalle?.Testigo2 || "",
    Testigo3: detalle?.Testigo3 || "",
    Testigo4: detalle?.Testigo4 || "",
    generic_text: detalle?.generic_text || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, testigo: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/bunny/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir el archivo');
        }

        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          [testigo]: data.url,
        }));
      } catch (error) {
        console.error('Error al subir el archivo:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="Testigo1">Testigo 1</Label>
          <Input
            id="Testigo1"
            name="Testigo1"
            type="file"
            onChange={(e) => handleFileChange(e, 'Testigo1')}
            placeholder="Subir archivo del testigo 1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="Testigo2">Testigo 2</Label>
          <Input
            id="Testigo2"
            name="Testigo2"
            type="file"
            onChange={(e) => handleFileChange(e, 'Testigo2')}
            placeholder="Subir archivo del testigo 2"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Guardar</Button>
      </div>
    </form>
  );
}; 