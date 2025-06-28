"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Empresa, TipoEmpresa } from "@prisma/client";
import { CompaniesTable } from "./components/companies-table";
import { CreateCompanyDialog } from "./components/create-company-dialog";
import { EditCompanyDialog } from "./components/edit-company-dialog";

interface Company {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  RIF: string;
  persona_de_contacto: string;
  email: string;
  tipo: TipoEmpresa;
  createdAt: Date;
  updatedAt: Date;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Cargar empresas existentes
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/admin/companies');
        if (!response.ok) throw new Error('Error al cargar empresas');
        const data = await response.json();
        setCompanies(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar empresas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleDeleteCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/companies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar empresa');
      }

      setCompanies(prev => prev.filter(c => c.id !== id));
      toast.success('Empresa eliminada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar empresa');
    }
  };

  const handleUpdateCompany = (updatedCompany: Company) => {
    setCompanies(prev => prev.map(c => 
      c.id === updatedCompany.id ? updatedCompany : c
    ));
  };

  return (
    <div className="w-full flex flex-col items-center text-foreground py-10">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-500 to-blue-700 text-white/0 bg-clip-text">
        Gestión de Empresas
      </h1>

      <div className="w-full max-w-[1135px] px-4 md:px-8">
        {/* Lista de empresas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">Empresas Registradas</h2>
              <p className="text-sm text-muted-foreground">
                {companies.length} {companies.length === 1 ? 'empresa registrada' : 'empresas registradas'}
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Empresa
            </Button>
          </div>
          <div className="border-2 border-blue-500 rounded-lg">
            <CompaniesTable
              companies={companies}
              onEdit={setEditingCompany}
              onDelete={handleDeleteCompany}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {editingCompany && (
        <EditCompanyDialog
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
          onUpdate={handleUpdateCompany}
        />
      )}

      <CreateCompanyDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={(company: Company) => {
          setCompanies(prev => [...prev, company]);
        }}
      />
    </div>
  );
}
