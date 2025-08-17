"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Move
} from "lucide-react";

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: string;
  horasTeoria: number;
  horasPractica: number;
  prerrequisitos?: { prerrequisito: Materia }[];
}

interface MateriaEstudiante {
  id: string;
  estado: string;
  nota?: number;
  materia: Materia;
}

interface PensumFlowchartProps {
  materias: Materia[];
  materiasEstudiante: MateriaEstudiante[];
  onMateriaClick?: (materia: Materia) => void;
}

export const PensumFlowchart = ({ materias, materiasEstudiante, onMateriaClick }: PensumFlowchartProps) => {
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Estados para gestos táctiles
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  // Agrupar materias por semestre
  const materiasPorSemestre = materias.reduce((acc, materia) => {
    const semestre = materia.semestre;
    if (!acc[semestre]) {
      acc[semestre] = [];
    }
    acc[semestre].push(materia);
    return acc;
  }, {} as Record<string, Materia[]>);

  // Ordenar semestres
  const semestresOrdenados = Object.keys(materiasPorSemestre).sort((a, b) => {
    const numA = parseInt(a.replace('S', ''));
    const numB = parseInt(b.replace('S', ''));
    return numA - numB;
  });

  // Reordenar materias dentro de cada semestre para que los prerrequisitos estén cerca
  const reordenarMateriasPorPrerrequisitos = () => {
    const materiasReordenadas: Record<string, Materia[]> = {};
    
    // Para cada semestre, reordenar las materias
    semestresOrdenados.forEach(semestre => {
      const materiasDelSemestre = [...materiasPorSemestre[semestre]];
      
      // Si es el primer semestre, mantener el orden original
      if (semestre === 'S1') {
        materiasReordenadas[semestre] = materiasDelSemestre;
        return;
      }
      
      // Para semestres posteriores, crear un orden basado en dependencias
      const semestreAnterior = `S${parseInt(semestre.replace('S', '')) - 1}`;
      const materiasSemestreAnterior = materiasPorSemestre[semestreAnterior] || [];
      
      // Crear un mapa de dependencias
      const dependencias = new Map<string, string[]>();
      materiasDelSemestre.forEach(materia => {
        if (materia.prerrequisitos) {
          const prereqsDelSemestreAnterior = materia.prerrequisitos
            .map(prerreq => prerreq.prerrequisito)
            .filter(prerreq => prerreq.semestre === semestreAnterior)
            .map(prerreq => prerreq.id);
          
          if (prereqsDelSemestreAnterior.length > 0) {
            dependencias.set(materia.id, prereqsDelSemestreAnterior);
          }
        }
      });
      
      // Ordenar materias basándose en la posición de sus prerrequisitos
      const materiasOrdenadas = materiasDelSemestre.sort((a, b) => {
        const prereqsA = dependencias.get(a.id) || [];
        const prereqsB = dependencias.get(b.id) || [];
        
        // Si ambas tienen prerrequisitos, ordenar por la posición del primer prerrequisito
        if (prereqsA.length > 0 && prereqsB.length > 0) {
          const posPrereqA = materiasSemestreAnterior.findIndex(m => m.id === prereqsA[0]);
          const posPrereqB = materiasSemestreAnterior.findIndex(m => m.id === prereqsB[0]);
          return posPrereqA - posPrereqB;
        }
        
        // Si solo una tiene prerrequisitos, la que tiene prerrequisitos va primero
        if (prereqsA.length > 0) return -1;
        if (prereqsB.length > 0) return 1;
        
        // Si ninguna tiene prerrequisitos, mantener orden original
        return 0;
      });
      
      materiasReordenadas[semestre] = materiasOrdenadas;
    });
    
    return materiasReordenadas;
  };

  const materiasPorSemestreReordenadas = reordenarMateriasPorPrerrequisitos();

  // Obtener estado de una materia del estudiante
  const getMateriaEstado = (materiaId: string) => {
    const materiaEstudiante = materiasEstudiante.find(me => me.materia.id === materiaId);
    return materiaEstudiante?.estado || null;
  };

  // Obtener color y icono según estado
  const getEstadoInfo = (estado: string | null) => {
    switch (estado) {
      case "APROBADA":
        return {
          color: "bg-green-500/20 border-green-500/50 text-green-300",
          icon: <CheckCircle className="w-4 h-4" />
        };
      case "EN_CURSO":
        return {
          color: "bg-blue-500/20 border-blue-500/50 text-blue-300",
          icon: <Clock className="w-4 h-4" />
        };
      case "APLAZADA":
        return {
          color: "bg-red-500/20 border-red-500/50 text-red-300",
          icon: <XCircle className="w-4 h-4" />
        };
      case "RETIRADA":
        return {
          color: "bg-yellow-500/20 border-yellow-500/50 text-yellow-300",
          icon: <AlertCircle className="w-4 h-4" />
        };
      default:
        return {
          color: "bg-gray-500/20 border-gray-500/50 text-gray-300",
          icon: <BookOpen className="w-4 h-4" />
        };
    }
  };

  // Manejar zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  // Manejar scroll con rueda del ratón y trackpad
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Detectar si es un gesto de trackpad (deltaX presente) o rueda de ratón
    const isTrackpad = Math.abs(e.deltaX) > 0;
    
    if (isTrackpad) {
      // Gesto de trackpad - usar deltaX para movimiento horizontal
      setPanX(prev => prev - e.deltaX * 0.5);
      // También usar deltaY para movimiento vertical si está presente
      if (Math.abs(e.deltaY) > 0) {
        setPanY(prev => prev - e.deltaY * 0.5);
      }
    } else {
      // Rueda de ratón tradicional
      // Si se mantiene presionada la tecla Shift, hacer scroll horizontal
      if (e.shiftKey) {
        setPanX(prev => prev - e.deltaY * 0.5);
      } else {
        // Scroll vertical normal
        setPanY(prev => prev - e.deltaY * 0.5);
      }
    }
  };

  // Manejar pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Solo activar drag si no se hace clic en una materia
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.materia-card')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Funciones auxiliares para gestos táctiles
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // Manejar gestos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Solo activar si no se toca una materia
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.materia-card')) {
      return;
    }

    const touches = e.touches;
    
    if (touches.length === 1) {
      // Un dedo - pan
      setIsTouching(true);
      setTouchStart({ 
        x: touches[0].clientX - panX, 
        y: touches[0].clientY - panY, 
        distance: 0 
      });
    } else if (touches.length === 2) {
      // Dos dedos - zoom
      setIsTouching(true);
      const distance = getDistance(touches[0], touches[1]);
      setTouchStart({ 
        x: 0, 
        y: 0, 
        distance: distance 
      });
      setLastTouchDistance(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (!isTouching) return;

    const touches = e.touches;
    
    if (touches.length === 1) {
      // Un dedo - pan
      setPanX(touches[0].clientX - touchStart.x);
      setPanY(touches[0].clientY - touchStart.y);
    } else if (touches.length === 2) {
      // Dos dedos - zoom
      const distance = getDistance(touches[0], touches[1]);
      const scale = distance / lastTouchDistance;
      
      setZoom(prev => {
        const newZoom = prev * scale;
        return Math.max(0.5, Math.min(3, newZoom));
      });
      
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsTouching(false);
  };

  // Generar conexiones solo entre prerrequisitos inmediatos
  const generarConexiones = () => {
    const conexiones: { from: string; to: string }[] = [];
    
    materias.forEach(materia => {
      if (materia.prerrequisitos) {
        materia.prerrequisitos.forEach(prerreq => {
          const prerrequisito = prerreq.prerrequisito;
          
          // Solo conectar si el prerrequisito está en el semestre inmediatamente anterior
          const semestreMateria = parseInt(materia.semestre.replace('S', ''));
          const semestrePrerreq = parseInt(prerrequisito.semestre.replace('S', ''));
          
          if (semestrePrerreq === semestreMateria - 1) {
            conexiones.push({
              from: prerrequisito.id,
              to: materia.id
            });
          }
        });
      }
    });
    
    return conexiones;
  };

  const conexiones = generarConexiones();

  // Calcular altura total necesaria
  const alturaMaxima = Math.max(...Object.values(materiasPorSemestreReordenadas).map(materias => materias.length * 120 + 80));

  // Calcular posición de una materia
  const getMateriaPosition = (materia: Materia) => {
    const semestreIndex = semestresOrdenados.indexOf(materia.semestre);
    const materiaIndex = materiasPorSemestreReordenadas[materia.semestre].findIndex(m => m.id === materia.id);
    
    const x = semestreIndex * 320 + 130; // Centro del semestre (actualizado para nueva separación)
    const y = 80 + (materiaIndex * 120) + 60; // Centro de la materia (60 es la mitad de la altura de la tarjeta)
    
    return { x, y };
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1C2D20] rounded-lg">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          className="bg-[#354B3A] border-white/10 text-white hover:bg-white/10"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          className="bg-[#354B3A] border-white/10 text-white hover:bg-white/10"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>

      {/* Indicador de navegación */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-[#354B3A] border-white/10">
          <CardContent className="p-3">
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex items-center gap-2">
                <Move className="w-3 h-3" />
                <span>Arrastra para navegar</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🖱️ Rueda: Scroll vertical</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⇧ + Rueda: Scroll horizontal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenedor del diagrama */}
      <div
        className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
          transformOrigin: 'top left',
          minHeight: `${alturaMaxima}px`,
          padding: '40px'
        }}
      >
        {/* Conexiones */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          {conexiones.map((conexion, index) => {
            const fromMateria = materias.find(m => m.id === conexion.from);
            const toMateria = materias.find(m => m.id === conexion.to);
            
            if (!fromMateria || !toMateria) return null;
            
            const fromPos = getMateriaPosition(fromMateria);
            const toPos = getMateriaPosition(toMateria);
            
            return (
              <g key={index}>
                <defs>
                  <marker
                    id={`arrowhead-${index}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#40C9A9"
                    />
                  </marker>
                </defs>
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="#40C9A9"
                  strokeWidth="2"
                  markerEnd={`url(#arrowhead-${index})`}
                  opacity="0.6"
                />
              </g>
            );
          })}
        </svg>

        {/* Semestres */}
        <div className="relative" style={{ zIndex: 2 }}>
          {semestresOrdenados.map((semestre, semestreIndex) => (
            <div
              key={semestre}
              className="absolute"
              style={{
                left: `${semestreIndex * 320}px`,
                top: '0px',
                width: '260px'
              }}
            >
              {/* Título del semestre */}
              <div className="text-center mb-4">
                <Badge className="bg-[#40C9A9] text-white px-4 py-2 text-lg font-bold">
                  {semestre}
                </Badge>
              </div>

              {/* Materias del semestre */}
              <div className="space-y-3">
                {materiasPorSemestreReordenadas[semestre].map((materia, materiaIndex) => {
                  const estado = getMateriaEstado(materia.id);
                  const estadoInfo = getEstadoInfo(estado);
                  
                  return (
                    <Card
                      key={materia.id}
                      className={`materia-card cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        estadoInfo.color
                      } border-2`}
                      onClick={() => onMateriaClick?.(materia)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          {estadoInfo.icon}
                          <span className="text-xs font-mono">{materia.codigo}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="text-xs leading-tight mb-2">
                          {materia.nombre}
                        </p>
                        <div className="flex justify-between items-center text-xs">
                          <span>{materia.creditos} créditos</span>
                          {estado && (
                            <Badge variant="outline" className="text-xs">
                              {estado}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-[#354B3A] border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                <span>No cursada</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-300" />
                <span>Aprobada</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-300" />
                <span>En curso</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-300" />
                <span>Aplazada</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 