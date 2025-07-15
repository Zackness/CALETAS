"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, GraduationCap, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";

interface Prerrequisito {
  tipoPrerrequisito: string;
  prerrequisito: {
    id: string;
    nombre: string;
    codigo: string;
    semestre: number;
  };
}

interface Materia {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  creditos: number;
  semestre: number;
  horasTeoria: number;
  horasPractica: number;
  prerrequisitos: Prerrequisito[];
}

interface Semestre {
  semestre: number;
  materias: Materia[];
  creditosSemestre: number;
}

interface Carrera {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  duracion: number;
  creditos: number;
  universidad: {
    nombre: string;
    siglas: string;
  };
}

interface PensumData {
  carrera: Carrera;
  semestres: Semestre[];
  totalCreditos: number;
  totalSemestres: number;
}

interface PensumViewerProps {
  carreraId: string;
}

export default function PensumViewer({ carreraId }: PensumViewerProps) {
  const [pensum, setPensum] = useState<PensumData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMateria, setSelectedMateria] = useState<Materia | null>(null);

  useEffect(() => {
    const fetchPensum = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/user/onboarding/pensum?carreraId=${carreraId}`);
        setPensum(response.data);
      } catch (error) {
        console.error("Error fetching pensum:", error);
        setError("Error al cargar el pensum");
      } finally {
        setIsLoading(false);
      }
    };

    if (carreraId) {
      fetchPensum();
    }
  }, [carreraId]);

  const getTipoPrerrequisitoColor = (tipo: string) => {
    switch (tipo) {
      case "OBLIGATORIO":
        return "bg-red-500";
      case "RECOMENDADO":
        return "bg-yellow-500";
      case "CO_REQUISITO":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTipoPrerrequisitoText = (tipo: string) => {
    switch (tipo) {
      case "OBLIGATORIO":
        return "Obligatorio";
      case "RECOMENDADO":
        return "Recomendado";
      case "CO_REQUISITO":
        return "Co-requisito";
      default:
        return tipo;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-mygreen" />
        <span className="ml-2 text-white">Cargando pensum...</span>
      </div>
    );
  }

  if (error || !pensum) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <span className="ml-2 text-white">{error || "Error al cargar el pensum"}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información de la carrera */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-mygreen" />
            <CardTitle className="text-white">
              {pensum.carrera.nombre}
            </CardTitle>
          </div>
          <CardDescription className="text-white/80">
            {pensum.carrera.universidad.siglas} - {pensum.carrera.universidad.nombre}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-mygreen" />
              <span className="text-white">
                {pensum.totalSemestres} semestres
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-mygreen" />
              <span className="text-white">
                {pensum.totalCreditos} créditos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-mygreen" />
              <span className="text-white">
                {pensum.semestres.length} semestres activos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pensum por semestres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {pensum.semestres.map((semestre) => (
          <Card key={semestre.semestre} className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Semestre {semestre.semestre}
                </CardTitle>
                <Badge variant="secondary" className="bg-mygreen/20 text-mygreen border-mygreen/30">
                  {semestre.creditosSemestre} créditos
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {semestre.materias.map((materia) => (
                <div
                  key={materia.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedMateria(materia)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white text-sm">
                        {materia.codigo}
                      </h4>
                      <p className="text-white/80 text-xs">
                        {materia.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {materia.creditos} créditos
                        </Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {materia.horasTeoria}T + {materia.horasPractica}P
                        </Badge>
                      </div>
                    </div>
                    {materia.prerrequisitos.length > 0 && (
                      <Badge className={`text-xs ${getTipoPrerrequisitoColor(materia.prerrequisitos[0].tipoPrerrequisito)}`}>
                        {materia.prerrequisitos.length} prereq
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de detalles de materia */}
      {selectedMateria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {selectedMateria.codigo} - {selectedMateria.nombre}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMateria(null)}
                  className="text-white hover:bg-white/10"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-white mb-2">Descripción</h4>
                <p className="text-white/80 text-sm">
                  {selectedMateria.descripcion || "Sin descripción disponible"}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-white mb-2">Créditos</h4>
                  <p className="text-white/80">{selectedMateria.creditos}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Semestre</h4>
                  <p className="text-white/80">{selectedMateria.semestre}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Horas Teoría</h4>
                  <p className="text-white/80">{selectedMateria.horasTeoria}</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-2">Horas Práctica</h4>
                  <p className="text-white/80">{selectedMateria.horasPractica}</p>
                </div>
              </div>

              {selectedMateria.prerrequisitos.length > 0 && (
                <div>
                  <h4 className="font-medium text-white mb-2">Prerrequisitos</h4>
                  <div className="space-y-2">
                    {selectedMateria.prerrequisitos.map((prereq, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded">
                        <Badge className={`text-xs ${getTipoPrerrequisitoColor(prereq.tipoPrerrequisito)}`}>
                          {getTipoPrerrequisitoText(prereq.tipoPrerrequisito)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-white/50" />
                        <span className="text-white/80 text-sm">
                          {prereq.prerrequisito.codigo} - {prereq.prerrequisito.nombre} (Semestre {prereq.prerrequisito.semestre})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 