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
            value={formData.Testigo1}
            onChange={handleChange}
            placeholder="URL del documento del testigo 1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="Testigo2">Testigo 2</Label>
          <Input
            id="Testigo2"
            name="Testigo2"
            value={formData.Testigo2}
            onChange={handleChange}
            placeholder="URL del documento del testigo 2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="Testigo3">Testigo 3</Label>
          <Input
            id="Testigo3"
            name="Testigo3"
            value={formData.Testigo3}
            onChange={handleChange}
            placeholder="URL del documento del testigo 3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="Testigo4">Testigo 4</Label>
          <Input
            id="Testigo4"
            name="Testigo4"
            value={formData.Testigo4}
            onChange={handleChange}
            placeholder="URL del documento del testigo 4"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="generic_text">Texto adicional</Label>
        <Textarea
          id="generic_text"
          name="generic_text"
          value={formData.generic_text}
          onChange={handleChange}
          placeholder="Información adicional sobre los documentos"
          rows={4}
        />
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