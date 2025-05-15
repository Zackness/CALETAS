"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Parentesco } from "@prisma/client";
import { toast } from "react-hot-toast";
import { EditFamiliarDialog } from "./components/edit-familiar-dialog";
import { FamiliaresTable } from "./components/familiares-table";
import { CreateFamiliarDialog } from "./components/create-familiar-dialog";
import { Plus } from "lucide-react";

interface Familiar {
  id: string;
  nombre: string;
  nombre2: string | null;
  apellido: string | null;
  apellido2: string | null;
  cedula: string;
  telefono: string | null;
  parentesco: Parentesco;
  fechaNacimiento: Date | null;
  usuarioId: string;
}

export default function FamiliaresPage() {
  const user = useCurrentUser();
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFamiliar, setEditingFamiliar] = useState<Familiar | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Cargar familiares existentes
  useEffect(() => {
    const fetchFamiliares = async () => {
      try {
        const response = await fetch('/api/familiares');
        if (!response.ok) throw new Error('Error al cargar familiares');
        const data = await response.json();
        setFamiliares(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar familiares');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamiliares();
  }, []);

  const handleDeleteFamiliar = async (id: string) => {
    try {
      const response = await fetch(`/api/familiares/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar familiar');
      }

      setFamiliares(prev => prev.filter(f => f.id !== id));
      toast.success('Familiar eliminado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar familiar');
    }
  };

  const handleUpdateFamiliar = (updatedFamiliar: Familiar) => {
    setFamiliares(prev => prev.map(f => 
      f.id === updatedFamiliar.id ? updatedFamiliar : f
    ));
  };

  return (
    <div className="w-full flex flex-col items-center text-foreground py-10">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-white/0 bg-clip-text">
        Gestión de Familiares
      </h1>

      <div className="w-full max-w-[1135px] px-4 md:px-8">
        {/* Lista de familiares */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Familiares Registrados</h2>
              <p className="text-sm text-muted-foreground">
                {familiares.length} {familiares.length === 1 ? 'familiar registrado' : 'familiares registrados'}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Familiar
            </Button>
          </div>
          <div className="border-2 border-blue-500 rounded-lg">
            <FamiliaresTable
              familiares={familiares}
              onEdit={setEditingFamiliar}
              onDelete={handleDeleteFamiliar}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {editingFamiliar && (
        <EditFamiliarDialog
          isOpen={!!editingFamiliar}
          onClose={() => setEditingFamiliar(null)}
          familiar={editingFamiliar}
          onUpdate={handleUpdateFamiliar}
        />
      )}

      <CreateFamiliarDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={(familiar) => {
          setFamiliares(prev => [...prev, familiar]);
        }}
      />
    </div>
  );
}
