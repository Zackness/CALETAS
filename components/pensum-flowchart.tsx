"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { MouseEvent, Touch, TouchEvent, WheelEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Move,
  LocateFixed
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const ORDEN_PENSUM_POR_SEMESTRE: Record<string, string[]> = {
    // Orden oficial compartido por el usuario (azul/verde)
    S1: ["AAU1111", "ABB1515", "APP1611", "ABI1212", "ABI1413", "ABI1313", "IQU1713"],
    S2: ["ABB2425", "ABB2214", "ABI2122", "ABI2513", "ABI2612", "ABI2323"],
    S3: ["ABB3734", "ABB3113", "ABB3524", "ABB3611", "IME3412", "ABI3212", "ABI3313"],
    S4: ["ABB4644", "IEI4114", "IMC4512", "IME4314", "ABI4222", "IMT4413"],
    S5: ["IIN5513", "IEI5125", "IEL5214", "IME5413", "IME5313", "IME5613"],
    S6: ["IMC6113", "AFG6413", "IEL6523", "IME6613", "IME6713", "IEL6313", "IME6213"],
    S7: ["IMC7223", "IIN7313", "IEI7114", "IEL7513", "IEL7411", "IMC7614"],
    S8: ["IMC8211", "IMC8413", "IEL8313", "IEI8613", "IMC8113", "IMC8513"],
    S9: ["AFG9211", "AFG9713", "IMC9413", "IMC9313", "IMC9123", "IMC9524", "IMC9613"],
    S10: ["APP1016"],
  };

  const ordenarPorConfiguracion = (semestre: string, materiasSemestre: Materia[]) => {
    const orden = ORDEN_PENSUM_POR_SEMESTRE[semestre];
    if (!orden) return null;

    const prioridad = new Map(orden.map((codigo, index) => [codigo, index]));
    return [...materiasSemestre].sort((a, b) => {
      const posA = prioridad.get(a.codigo);
      const posB = prioridad.get(b.codigo);

      // Si alguna materia no está en la lista, va al final sin perderse.
      if (posA === undefined && posB === undefined) return a.codigo.localeCompare(b.codigo);
      if (posA === undefined) return 1;
      if (posB === undefined) return -1;
      return posA - posB;
    });
  };

  // Reordenar materias dentro de cada semestre para que los prerrequisitos estén cerca
  const reordenarMateriasPorPrerrequisitos = () => {
    const materiasReordenadas: Record<string, Materia[]> = {};
    
    // Para cada semestre, reordenar las materias
    semestresOrdenados.forEach(semestre => {
      const materiasDelSemestre = [...materiasPorSemestre[semestre]];

      // Si existe orden oficial configurado, siempre priorizarlo.
      const materiasConOrdenOficial = ordenarPorConfiguracion(semestre, materiasDelSemestre);
      if (materiasConOrdenOficial) {
        materiasReordenadas[semestre] = materiasConOrdenOficial;
        return;
      }
      
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
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
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
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    // No activar drag si se hace clic en una materia
    if ((e.target as HTMLElement).closest('.materia-card')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPanX(e.clientX - dragStart.x);
      setPanY(e.clientY - dragStart.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Funciones auxiliares para gestos táctiles
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  // Manejar gestos táctiles
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // No activar gestos de navegación si se toca una materia
    if ((e.target as HTMLElement).closest('.materia-card')) {
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

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
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

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsTouching(false);
  };

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  // Evitar "espagueti" visual en materias con muchos requisitos globales
  // (ej. Entrenamiento Industrial), sin alterar la lógica real de prerrequisitos.
  const shouldHideIncomingArrows = (materia: Materia) => {
    const nombre = normalizeText(materia.nombre);
    if (nombre.includes("entrenamiento industrial")) return true;
    return (materia.prerrequisitos?.length ?? 0) >= 8;
  };

  // Generar conexiones de TODOS los prerrequisitos (con filtros visuales)
  const generarConexiones = () => {
    const conexiones: { from: string; to: string }[] = [];
    
    materias.forEach(materia => {
      if (shouldHideIncomingArrows(materia)) return;
      if (materia.prerrequisitos) {
        materia.prerrequisitos.forEach(prerreq => {
          const prerrequisito = prerreq.prerrequisito;
          conexiones.push({
            from: prerrequisito.id,
            to: materia.id
          });
        });
      }
    });
    
    return conexiones;
  };

  const conexiones = generarConexiones();

  // Calcular altura total necesaria
  const alturaMaxima = Math.max(...Object.values(materiasPorSemestreReordenadas).map(materias => materias.length * 120 + 80));
  const anchoDiagrama = Math.max(semestresOrdenados.length * 320, 320);
  const altoDiagrama = Math.max(alturaMaxima + 80, 600);

  const centerDiagram = useCallback((nextZoom?: number) => {
    if (!containerRef.current) return;
    const viewportW = containerRef.current.clientWidth;
    const viewportH = containerRef.current.clientHeight;
    const effectiveZoom = nextZoom ?? zoom;
    const newPanX = (viewportW - (anchoDiagrama * effectiveZoom)) / 2;
    const newPanY = (viewportH - (altoDiagrama * effectiveZoom)) / 2;
    setPanX(newPanX);
    setPanY(newPanY);
  }, [zoom, anchoDiagrama, altoDiagrama]);

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const viewportW = containerRef.current.clientWidth;
    const viewportH = containerRef.current.clientHeight;
    const fitScale = Math.max(
      0.5,
      Math.min(
        1.2,
        (viewportW - 48) / anchoDiagrama,
        (viewportH - 48) / altoDiagrama
      )
    );
    setZoom(fitScale);
    requestAnimationFrame(() => centerDiagram(fitScale));
  }, [anchoDiagrama, altoDiagrama, centerDiagram]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    const onResize = () => fitToScreen();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitToScreen]);

  // Calcular posición de una materia
  const getMateriaPosition = (materia: Materia) => {
    const semestreIndex = semestresOrdenados.indexOf(materia.semestre);
    const materiaIndex = materiasPorSemestreReordenadas[materia.semestre].findIndex(m => m.id === materia.id);
    
    const x = semestreIndex * 320 + 130; // Centro del semestre (actualizado para nueva separación)
    const y = 80 + (materiaIndex * 120) + 60; // Centro de la materia (60 es la mitad de la altura de la tarjeta)
    
    return { x, y };
  };

  // Una materia está desbloqueada si no tiene prerrequisitos
  // o si todos sus prerrequisitos están aprobados.
  const isMateriaUnlocked = (materia: Materia) => {
    if (!materia.prerrequisitos || materia.prerrequisitos.length === 0) return true;
    const aprobadas = new Set(
      materiasEstudiante
        .filter((me) => me.estado === "APROBADA")
        .map((me) => me.materia.id)
    );
    return materia.prerrequisitos.every((p) => aprobadas.has(p.prerrequisito.id));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#1C2D20] rounded-lg">
      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={fitToScreen}
          className="bg-[#354B3A] border-white/10 text-white hover:bg-white/10"
          title="Centrar y ajustar diagrama"
        >
          <LocateFixed className="w-4 h-4" />
        </Button>
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
              <div className="flex items-center gap-2">
                <span>📱 1 dedo: mover · 2 dedos: zoom</span>
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
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "top left",
          minHeight: `${alturaMaxima}px`,
          width: `${anchoDiagrama}px`,
          padding: "40px",
        }}
      >
        {/* Conexiones */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <defs>
            <marker
              id="arrowhead-main"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#40C9A9" />
            </marker>
          </defs>
          {conexiones.map((conexion, index) => {
            const fromMateria = materias.find(m => m.id === conexion.from);
            const toMateria = materias.find(m => m.id === conexion.to);
            
            if (!fromMateria || !toMateria) return null;
            
            const fromPos = getMateriaPosition(fromMateria);
            const toPos = getMateriaPosition(toMateria);
            
            // Curva suave entre materias para una lectura visual más limpia
            const deltaX = toPos.x - fromPos.x;
            const controlOffset = Math.max(60, Math.abs(deltaX) * 0.35);
            const path = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + controlOffset} ${fromPos.y}, ${toPos.x - controlOffset} ${toPos.y}, ${toPos.x} ${toPos.y}`;

            return (
              <g key={index}>
                <path
                  d={path}
                  stroke="rgba(64, 201, 169, 0.95)"
                  strokeWidth="2.5"
                  fill="none"
                  markerEnd="url(#arrowhead-main)"
                  opacity="0.95"
                />
                <path
                  d={path}
                  stroke="rgba(64, 201, 169, 0.25)"
                  strokeWidth="6"
                  fill="none"
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
                  const unlocked = isMateriaUnlocked(materia);
                  const hiddenArrows = shouldHideIncomingArrows(materia);
                  
                  return (
                    <Card
                      key={materia.id}
                      className={`materia-card cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                        estadoInfo.color
                      } border-2`}
                      style={{
                        opacity: !estado && !unlocked ? 0.65 : 1,
                        filter: !estado && !unlocked ? "saturate(0.7)" : "none",
                      }}
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
                          {!estado && !unlocked && (
                            <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">
                              Bloqueada
                            </Badge>
                          )}
                        </div>
                        {hiddenArrows && (materia.prerrequisitos?.length ?? 0) > 0 && (
                          <p className="mt-2 text-[10px] text-white/70">
                            Requisito especial: requiere materias previas del plan.
                          </p>
                        )}
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